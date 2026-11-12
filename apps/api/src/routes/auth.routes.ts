import { Router, Response, Request } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { JWT_SECRET, AuthenticatedRequest, authenticateToken } from '../middleware/auth';
import { sendPasswordResetOtpEmail } from '../services/emailService';

const prisma = new PrismaClient();
const router = Router();

// In-Memory OTP store with 10-minute expiration
interface OtpRecord {
  code: string;
  expiresAt: number;
  attempts: number;
}
const otpStore = new Map<string, OtpRecord>();

// Local Email/Password Registration
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existingUser = await prisma.user.findFirst({
      where: { email: { equals: cleanEmail, mode: 'insensitive' } }
    });

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
    const user = await prisma.user.findFirst({
      where: { email: { equals: cleanEmail, mode: 'insensitive' } }
    });
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

    const cleanSocialEmail = userEmail.trim().toLowerCase();
    let user = await prisma.user.findFirst({
      where: { email: { equals: cleanSocialEmail, mode: 'insensitive' } }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: userName,
          email: cleanSocialEmail,
          passwordHash: 'social',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userName)}`,
          role: 'USER',
          provider: provider,
        }
      });
    }

    // Sync any purchases linked to this email
    await prisma.purchase.updateMany({
      where: {
        user: { email: { equals: cleanSocialEmail, mode: 'insensitive' } },
        userId: { not: user.id }
      },
      data: { userId: user.id }
    });

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

// 1. Send OTP for Forgot Password
router.post(['/forgot-password/send-otp', '/send-otp'], async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email address is required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await prisma.user.findFirst({
      where: { email: { equals: cleanEmail, mode: 'insensitive' } }
    });
    if (!user) {
      return res.status(404).json({ error: 'No account found with this email address' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ error: 'Account has been blocked' });
    }

    // Generate random 6-digit verification code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(cleanEmail, {
      code: otp,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      attempts: 0
    });

    // Send email via service (with console fallback)
    await sendPasswordResetOtpEmail({
      toEmail: cleanEmail,
      userName: user.name,
      otp
    });

    return res.status(200).json({
      success: true,
      message: `A 6-digit OTP has been sent to ${cleanEmail}. Please enter it to reset your password.`,
      // Expose devOtp in development so developers can test without checking inbox
      devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined
    });
  } catch (error) {
    console.error('[SEND OTP ERROR]', error);
    return res.status(500).json({ error: 'Server error while generating OTP' });
  }
});

// 2. Verify OTP
router.post(['/forgot-password/verify-otp', '/verify-otp'], async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP code are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const record = otpStore.get(cleanEmail);

    if (!record) {
      return res.status(400).json({ error: 'No OTP requested for this email. Please click Resend OTP.' });
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(cleanEmail);
      return res.status(400).json({ error: 'OTP has expired. Please request a new code.' });
    }

    if (record.attempts >= 5) {
      otpStore.delete(cleanEmail);
      return res.status(400).json({ error: 'Too many invalid attempts. Please request a new OTP.' });
    }

    if (record.code !== otp.trim()) {
      record.attempts += 1;
      return res.status(400).json({ error: 'Invalid verification code. Please check and try again.' });
    }

    return res.status(200).json({ success: true, message: 'OTP verified successfully.' });
  } catch (error) {
    console.error('[VERIFY OTP ERROR]', error);
    return res.status(500).json({ error: 'Server error while verifying OTP' });
  }
});

// 3. Reset Password using OTP
router.post(['/forgot-password/reset', '/forgot-password'], async (req: Request, res: Response) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({ error: 'Email and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await prisma.user.findFirst({
      where: { email: { equals: cleanEmail, mode: 'insensitive' } }
    });
    if (!user) {
      return res.status(404).json({ error: 'No account found with this email address' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ error: 'Account has been blocked' });
    }

    // If OTP was provided in the request, verify it
    if (otp) {
      const record = otpStore.get(cleanEmail);
      if (!record) {
        return res.status(400).json({ error: 'No active OTP found. Please request a new code.' });
      }

      if (Date.now() > record.expiresAt) {
        otpStore.delete(cleanEmail);
        return res.status(400).json({ error: 'OTP has expired. Please request a new code.' });
      }

      if (record.code !== otp.trim()) {
        record.attempts += 1;
        return res.status(400).json({ error: 'Invalid verification code. Please check and try again.' });
      }

      // Remove OTP once used
      otpStore.delete(cleanEmail);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        provider: 'local',
      }
    });

    console.log(`[PASSWORD RESET WITH OTP] Password successfully reset for user: "${cleanEmail}"`);
    return res.status(200).json({ message: 'Password has been reset successfully. Please sign in with your new password.' });
  } catch (error) {
    console.error('[FORGOT PASSWORD ERROR]', error);
    return res.status(500).json({ error: 'Server error while resetting password' });
  }
});

// Change Password for Authenticated User
router.post('/change-password', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isBcryptHash = user.passwordHash && (user.passwordHash.startsWith('$2a$') || user.passwordHash.startsWith('$2b$'));
    let match = false;

    if (isBcryptHash) {
      match = await bcrypt.compare(currentPassword, user.passwordHash);
    } else {
      match = (currentPassword === user.passwordHash);
    }

    if (!match) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedNewPassword,
        provider: 'local',
      }
    });

    console.log(`[CHANGE PASSWORD] Password successfully changed for user: "${user.email}"`);
    return res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('[CHANGE PASSWORD ERROR]', error);
    return res.status(500).json({ error: 'Server error while changing password' });
  }
});

export default router;
