import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '@digital-library/types';
import { usersStore, userPasswordsMap } from '../services/store';
import { JWT_SECRET, AuthenticatedRequest, authenticateToken } from '../middleware/auth';

const router = Router();

// Local Email/Password Registration
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existingUser = usersStore.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser: User = {
      id: `user-${Date.now()}`,
      name,
      email,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      role: 'USER',
      provider: 'local',
      isBlocked: false,
      createdAt: new Date().toISOString(),
    };

    usersStore.push(newUser);
    userPasswordsMap[email] = hashedPassword;

    const token = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name }, JWT_SECRET, {
      expiresIn: '7d',
    });

    return res.status(201).json({ user: newUser, token });
  } catch (error) {
    return res.status(500).json({ error: 'Server error during registration' });
  }
});

// Local Email/Password Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = usersStore.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ error: 'Account has been blocked' });
    }

    const hashedPassword = userPasswordsMap[user.email];
    if (hashedPassword) {
      const match = await bcrypt.compare(password, hashedPassword);
      if (!match) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, {
      expiresIn: '7d',
    });

    return res.json({ user, token });
  } catch (error) {
    return res.status(500).json({ error: 'Server error during login' });
  }
});

// Social Login endpoint (Google, Microsoft, Apple, Facebook)
router.post('/social-login', async (req, res) => {
  try {
    const { provider, email, name } = req.body;
    if (!provider) {
      return res.status(400).json({ error: 'Provider is required' });
    }

    const userEmail = email || `user.${provider}.${Date.now()}@socialauth.org`;
    const userName = name || `${provider.toUpperCase()} Authorized User`;

    let user = usersStore.find((u) => u.email.toLowerCase() === userEmail.toLowerCase());

    if (!user) {
      user = {
        id: `user-${provider}-${Date.now()}`,
        name: userName,
        email: userEmail,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userName)}`,
        role: 'USER',
        provider: provider as any,
        isBlocked: false,
        createdAt: new Date().toISOString(),
      };
      usersStore.push(user);
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
router.get('/me', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = usersStore.find((u) => u.id === req.user?.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  return res.json(user);
});

// Update profile
router.put('/profile', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userIndex = usersStore.findIndex((u) => u.id === req.user?.id);
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { name, avatar } = req.body;
  if (name) usersStore[userIndex].name = name;
  if (avatar) usersStore[userIndex].avatar = avatar;

  return res.json(usersStore[userIndex]);
});

export default router;
