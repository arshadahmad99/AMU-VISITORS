import { Router, Response, Request } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { JWT_SECRET, AuthenticatedRequest, authenticateToken } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();

// Local Email/Password Registration
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existingUser = await prisma.user.findUnique({ where: { email: cleanEmail } });

    if (existingUser) {
      // If account was created during guest checkout/seed with unhashed placeholder password, upgrade it
      const isLegacyHash = !existingUser.passwordHash || (!existingUser.passwordHash.startsWith('$2a$') && !existingUser.passwordHash.startsWith('$2b$'));
      if (isLegacyHash) {
        const hashedPassword = await bcrypt.hash(password, 10);
        const updatedUser = await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            name: name || existingUser.name,
            passwordHash: hashedPassword,
            provider: 'local',
          }
        });
        // Sync existing purchases matching user email to user ID
        await prisma.purchase.updateMany({
          where: {
            user: { email: { equals: cleanEmail, mode: 'insensitive' } },
            userId: { not: updatedUser.id }
          },
          data: { userId: updatedUser.id }
        });

        const token = jwt.sign({ id: updatedUser.id, email: updatedUser.email, role: updatedUser.role, name: updatedUser.name }, JWT_SECRET, {
          expiresIn: '7d',
        });
        return res.status(200).json({ user: updatedUser, token });
      }

      return res.status(400).json({ error: 'Email already registered. Please sign in instead.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        name,
        email: cleanEmail,
        passwordHash: hashedPassword,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
        role: 'USER',
        provider: 'local',
      }
    });

    // Sync existing purchases matching user email to user ID
    await prisma.purchase.updateMany({
      where: {
        user: { email: { equals: cleanEmail, mode: 'insensitive' } },
        userId: { not: newUser.id }
      },
      data: { userId: newUser.id }
    });

    const token = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name }, JWT_SECRET, {
      expiresIn: '7d',
    });

    return res.status(201).json({ user: newUser, token });
  } catch (error) {
    return res.status(500).json({ error: 'Server error during registration' });
  }
});

// Local Email/Password Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    console.log(`[LOGIN ATTEMPT] email: "${email}"`);
    if (!email || !password) {
      console.log(`[LOGIN FAILED] Missing email or password`);
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (!user) {
      console.log(`[LOGIN FAILED] User not found for email: "${cleanEmail}"`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.isBlocked) {
      console.log(`[LOGIN FAILED] User blocked: "${cleanEmail}"`);
      return res.status(403).json({ error: 'Account has been blocked' });
    }

    const isBcryptHash = user.passwordHash && (user.passwordHash.startsWith('$2a$') || user.passwordHash.startsWith('$2b$'));
    let match = false;

    if (isBcryptHash) {
      match = await bcrypt.compare(password, user.passwordHash);
    } else {
      // Legacy or checkout-created user (e.g., 'hashed_pw'): accept password & set its bcrypt hash
      console.log(`[LOGIN UPGRADE] Upgrading legacy password hash for user: "${cleanEmail}"`);
      const newHash = await bcrypt.hash(password, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: newHash, provider: 'local' }
      });
      match = true;
    }

    if (!match) {
      console.log(`[LOGIN FAILED] Password mismatch for: "${cleanEmail}"`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Sync existing purchases matching user email to user ID
    await prisma.purchase.updateMany({
      where: {
        user: { email: { equals: cleanEmail, mode: 'insensitive' } },
        userId: { not: user.id }
      },
      data: { userId: user.id }
    });

    console.log(`[LOGIN SUCCESS] User: "${cleanEmail}"`);
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, {
      expiresIn: '7d',
    });

    return res.json({ user, token });
  } catch (error) {
    console.error(`[LOGIN ERROR]`, error);
    return res.status(500).json({ error: 'Server error during login' });
  }
});

// Social Login endpoint (Google, Microsoft, Apple, Facebook)
router.post('/social-login', async (req: Request, res: Response) => {
  try {
    const { provider, email, name } = req.body;
    if (!provider) {
      return res.status(400).json({ error: 'Provider is required' });
    }

    const userEmail = email || `user.${provider}.${Date.now()}@socialauth.org`;
    const userName = name || `${provider.toUpperCase()} Authorized User`;

    let user = await prisma.user.findUnique({ where: { email: userEmail.toLowerCase() } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: userName,
          email: userEmail.toLowerCase(),
          passwordHash: 'social',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userName)}`,
          role: 'USER',
          provider: provider,
        }
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({ error: 'Account has been blocked' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, {
      expiresIn: '7d',
    });

    return res.json({ user, token });
  } catch (error) {
    return res.status(500).json({ error: 'Social authentication failed' });
  }
});

// Get current profile
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.user?.id } });
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  return res.json(user);
});

// Update profile
router.put('/profile', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { name, avatar } = req.body;
  const user = await prisma.user.update({
    where: { id: req.user?.id },
    data: {
      ...(name && { name }),
      ...(avatar && { avatar }),
    }
  });

  return res.json(user);
});

export default router;
