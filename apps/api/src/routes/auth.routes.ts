import { Router, Response, Request } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { JWT_SECRET, AuthenticatedRequest, authenticateToken } from '../middleware/auth';
import { sendPasswordResetOtpEmail } from '../services/emailService';

const prisma = new PrismaClient();
const router = Router();

// ============================================================================
// Security & Authentication Helper Functions
// ============================================================================

/**
 * Strips passwordHash and sensitive attributes from user object before sending to client.
 */
export function sanitizeUser<T extends { passwordHash?: string }>(user: T | null | undefined): Omit<T, 'passwordHash'> | null {
  if (!user) return null;
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

/**
 * Normalizes email by stripping zero-width/invisible characters, trimming, and lowercasing.
 */
export function normalizeEmail(email: unknown): string {
  if (!email || typeof email !== 'string') return '';
  return email
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // Strip zero-width spaces / BOM
    .trim()
    .toLowerCase();
}

/**
 * Validates whether a string is a standard bcrypt hash ($2a$, $2b$, $2y$, $2x$).
 */
export function isBcryptHash(hash: string | null | undefined): boolean {
  if (!hash || typeof hash !== 'string') return false;
  return /^\$2[abyx]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(hash);
}

/**
 * Masks email address for safe logging without exposing PII.
 * Example: "john.doe@example.com" -> "jo***e@example.com"
 */
export function maskEmail(email: string): string {
  if (!email || typeof email !== 'string') return '***';
  const parts = email.split('@');
  if (parts.length !== 2) return '***';
  const name = parts[0];
  const domain = parts[1];
  const maskedName =
    name.length <= 2
      ? name[0] + '***'
      : name.substring(0, 2) + '***' + name.slice(-1);
  return `${maskedName}@${domain}`;
}

/**
 * Extracts client IP address safely from headers or request socket.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
}

/**
 * Secure structured authentication logger.
 * Never logs raw passwords, password hashes, or JWT tokens.
 */
export function logAuthEvent(event: {
  action:
    | 'LOGIN_ATTEMPT'
    | 'LOGIN_SUCCESS'
    | 'LOGIN_FAILED'
    | 'REGISTER_ATTEMPT'
    | 'REGISTER_SUCCESS'
    | 'REGISTER_FAILED'
    | 'PASSWORD_RESET_ATTEMPT'
    | 'PASSWORD_RESET_SUCCESS'
    | 'PASSWORD_RESET_FAILED'
    | 'CHANGE_PASSWORD_SUCCESS'
    | 'CHANGE_PASSWORD_FAILED';
  email: string;
  ip: string;
  reason?: string;
  userId?: string;
}) {
  const timestamp = new Date().toISOString();
  const masked = maskEmail(event.email);
  const userPart = event.userId ? ` [userId: ${event.userId}]` : '';
  const reasonPart = event.reason ? ` [reason: ${event.reason}]` : '';
  console.log(
    `[AUTH] [${timestamp}] [${event.action}] [email: ${masked}] [ip: ${event.ip}]${userPart}${reasonPart}`
  );
}

/**
 * Finds all user candidates matching an email address case-insensitively and whitespace-trimmed.
 * Prioritizes local accounts with valid password hashes.
 * Logs query diagnostics and properly throws database failures rather than silently hiding them.
 */
export async function findUsersByEmail(cleanEmail: string) {
  const masked = maskEmail(cleanEmail);
  console.log(`[AUTH_DIAG] [DB_QUERY] Executing findUsersByEmail for: "${masked}"`);

  try {
    const candidates = await prisma.$queryRaw<
      Array<{
        id: string;
        name: string;
        email: string;
        passwordHash: string;
        avatar: string | null;
        role: string;
        provider: string;
        isBlocked: boolean;
        createdAt: Date;
      }>
    >`
      SELECT id, name, email, "passwordHash", avatar, role, provider, "isBlocked", "createdAt"
      FROM "User"
      WHERE LOWER(TRIM(email)) = ${cleanEmail}
      ORDER BY 
        CASE WHEN provider = 'local' THEN 0 ELSE 1 END,
        CASE WHEN "passwordHash" LIKE '$2%' THEN 0 ELSE 1 END,
        "createdAt" DESC
    `;

    console.log(
      `[AUTH_DIAG] [DB_RESULT] Query returned ${candidates.length} candidate record(s) for email: "${masked}"`
    );
    return candidates;
  } catch (err: any) {
    console.error(
      `[AUTH_DIAG] [DB_ERROR] Database query failed in findUsersByEmail for "${masked}": ${err.message}`
    );
    throw err;
  }
}

// In-Memory OTP store with 10-minute expiration
interface OtpRecord {
  code: string;
  expiresAt: number;
  attempts: number;
}
const otpStore = new Map<string, OtpRecord>();

// ============================================================================
// Local Email/Password Registration
// ============================================================================
router.post('/register', async (req: Request, res: Response) => {
  const clientIp = getClientIp(req);
  try {
    const { name, email, password } = req.body;
    if (!email || !password || !name) {
      logAuthEvent({
        action: 'REGISTER_FAILED',
        email: typeof email === 'string' ? email : '',
        ip: clientIp,
        reason: 'Missing name, email, or password',
      });
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const cleanEmail = normalizeEmail(email);
    if (!cleanEmail) {
      logAuthEvent({
        action: 'REGISTER_FAILED',
        email: '',
        ip: clientIp,
        reason: 'Invalid email format after normalization',
      });
      return res.status(400).json({ error: 'Invalid email address' });
    }

    if (password.length < 6) {
      logAuthEvent({
        action: 'REGISTER_FAILED',
        email: cleanEmail,
        ip: clientIp,
        reason: 'Password length less than 6 characters',
      });
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    logAuthEvent({ action: 'REGISTER_ATTEMPT', email: cleanEmail, ip: clientIp });

    let existingUsers;
    try {
      existingUsers = await findUsersByEmail(cleanEmail);
    } catch (dbErr: any) {
      return res.status(500).json({ error: 'Database service unavailable during registration' });
    }

    if (existingUsers.length > 0) {
      const primaryUser = existingUsers[0];
      // If user already has a valid bcrypt hash, never overwrite it!
      if (isBcryptHash(primaryUser.passwordHash)) {
        logAuthEvent({
          action: 'REGISTER_FAILED',
          email: cleanEmail,
          ip: clientIp,
          reason: 'Email already registered with active password credentials',
          userId: primaryUser.id,
        });
        return res.status(400).json({ error: 'Email already registered. Please sign in instead.' });
      }

      // If user is a legacy unhashed placeholder, upgrade safely upon explicit registration
      const hashedPassword = await bcrypt.hash(password, 10);
      const updatedUser = await prisma.user.update({
        where: { id: primaryUser.id },
        data: {
          name: name.trim() || primaryUser.name,
          email: cleanEmail,
          passwordHash: hashedPassword,
          provider: 'local',
        },
      });

      logAuthEvent({
        action: 'REGISTER_SUCCESS',
        email: cleanEmail,
        ip: clientIp,
        reason: 'Upgraded legacy user during registration',
        userId: updatedUser.id,
      });

      const token = jwt.sign(
        { id: updatedUser.id, email: updatedUser.email, role: updatedUser.role, name: updatedUser.name },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      return res.status(200).json({ user: sanitizeUser(updatedUser), token });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        passwordHash: hashedPassword,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name.trim())}`,
        role: 'USER',
        provider: 'local',
      },
    });

    logAuthEvent({
      action: 'REGISTER_SUCCESS',
      email: cleanEmail,
      ip: clientIp,
      userId: newUser.id,
    });

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({ user: sanitizeUser(newUser), token });
  } catch (error: any) {
    logAuthEvent({
      action: 'REGISTER_FAILED',
      email: typeof req.body?.email === 'string' ? req.body.email : '',
      ip: clientIp,
      reason: `Server exception during registration: ${error.message}`,
    });
    return res.status(500).json({ error: 'Server error during registration' });
  }
});

// ============================================================================
// Local Email/Password Login
// ============================================================================
router.post('/login', async (req: Request, res: Response) => {
  const clientIp = getClientIp(req);
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      logAuthEvent({
        action: 'LOGIN_FAILED',
        email: typeof email === 'string' ? email : '',
        ip: clientIp,
        reason: 'Missing email or password in request body',
      });
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanEmail = normalizeEmail(email);
    if (!cleanEmail) {
      logAuthEvent({
        action: 'LOGIN_FAILED',
        email: '',
        ip: clientIp,
        reason: 'Invalid email after normalization',
      });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    logAuthEvent({ action: 'LOGIN_ATTEMPT', email: cleanEmail, ip: clientIp });

    // 1. Query candidate records from database
    let candidates;
    try {
      candidates = await findUsersByEmail(cleanEmail);
    } catch (dbError: any) {
      logAuthEvent({
        action: 'LOGIN_FAILED',
        email: cleanEmail,
        ip: clientIp,
        reason: `Database connectivity error during lookup: ${dbError.message}`,
      });
      return res.status(500).json({ error: 'Authentication service temporarily unavailable' });
    }

    // 2. Identify if user lookup succeeded
    if (candidates.length === 0) {
      console.log(`[AUTH_DIAG] [LOOKUP_FAILED] No user account exists for email "${maskEmail(cleanEmail)}"`);
      logAuthEvent({
        action: 'LOGIN_FAILED',
        email: cleanEmail,
        ip: clientIp,
        reason: 'User not found in database',
      });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 3. Evaluate candidate accounts to match the correct account with valid password
    let matchedUser: any = null;
    let allBlocked = true;
    let hasLocalAccount = false;

    for (const candidate of candidates) {
      if (candidate.provider === 'local') {
        hasLocalAccount = true;
      }

      console.log(
        `[AUTH_DIAG] [EVAL_ACCOUNT] Candidate ID: "${candidate.id}", provider: "${candidate.provider}", isBcrypt: ${isBcryptHash(candidate.passwordHash)}, isBlocked: ${candidate.isBlocked}`
      );

      if (candidate.isBlocked) {
        console.log(`[AUTH_DIAG] [ACCOUNT_BLOCKED] Candidate "${candidate.id}" is marked blocked, skipping`);
        continue;
      }

      allBlocked = false;

      // Passwords are strictly compared exactly as entered (no auto-trimming)
      if (isBcryptHash(candidate.passwordHash)) {
        const isMatch = await bcrypt.compare(password, candidate.passwordHash);
        if (isMatch) {
          console.log(`[AUTH_DIAG] [PASSWORD_MATCH] Candidate "${candidate.id}" password verified successfully`);
          matchedUser = candidate;
          break;
        } else {
          console.log(`[AUTH_DIAG] [PASSWORD_MISMATCH] Candidate "${candidate.id}" password comparison returned false`);
        }
      } else if (candidate.provider === 'local' && candidate.passwordHash && candidate.passwordHash === password) {
        // Safe legacy plaintext upgrade ONLY if the user actually enters the matching legacy password
        console.log(`[AUTH_DIAG] [LEGACY_MATCH] Candidate "${candidate.id}" legacy password matched. Upgrading to bcrypt.`);
        const newHash = await bcrypt.hash(password, 10);
        await prisma.user.update({
          where: { id: candidate.id },
          data: { passwordHash: newHash, provider: 'local' },
        });
        candidate.passwordHash = newHash;
        matchedUser = candidate;
        break;
      }
    }

    // 4. Handle failure if no candidate account matched
    if (!matchedUser) {
      if (allBlocked && candidates.length > 0) {
        console.log(`[AUTH_DIAG] [LOGIN_FAILED] All candidate accounts are blocked for email "${maskEmail(cleanEmail)}"`);
        logAuthEvent({
          action: 'LOGIN_FAILED',
          email: cleanEmail,
          ip: clientIp,
          reason: 'All candidate accounts are blocked',
        });
        return res.status(403).json({ error: 'Account has been blocked' });
      }

      const failureReason = !hasLocalAccount
        ? 'Account exists only via social provider with no local password'
        : 'Password mismatch across all candidate accounts';

      console.log(`[AUTH_DIAG] [LOGIN_FAILED] ${failureReason} for email "${maskEmail(cleanEmail)}"`);
      logAuthEvent({
        action: 'LOGIN_FAILED',
        email: cleanEmail,
        ip: clientIp,
        reason: failureReason,
      });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 5. Check account blocked status on matched account
    if (matchedUser.isBlocked) {
      logAuthEvent({
        action: 'LOGIN_FAILED',
        email: cleanEmail,
        ip: clientIp,
        reason: 'Matched account is blocked',
        userId: matchedUser.id,
      });
      return res.status(403).json({ error: 'Account has been blocked' });
    }

    // 6. Login exclusively authenticates the user and generates a JWT.
    // (No purchase updates or email mutations)
    logAuthEvent({
      action: 'LOGIN_SUCCESS',
      email: cleanEmail,
      ip: clientIp,
      userId: matchedUser.id,
    });

    console.log(`[AUTH_DIAG] [LOGIN_SUCCESS] Successfully authenticated user "${matchedUser.id}" for email "${maskEmail(cleanEmail)}"`);

    let token: string;
    try {
      token = jwt.sign(
        { id: matchedUser.id, email: matchedUser.email, role: matchedUser.role, name: matchedUser.name },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
    } catch (jwtErr: any) {
      console.error(`[AUTH_DIAG] [JWT_ERROR] Token generation failed: ${jwtErr.message}`);
      return res.status(500).json({ error: 'Authentication token generation failed' });
    }

    // 7. Return sanitized user and token (passwordHash is NEVER returned)
    return res.json({ user: sanitizeUser(matchedUser), token });
  } catch (error: any) {
    logAuthEvent({
      action: 'LOGIN_FAILED',
      email: typeof req.body?.email === 'string' ? req.body.email : '',
      ip: clientIp,
      reason: `Unhandled server exception during login: ${error.message}`,
    });
    return res.status(500).json({ error: 'Server error during login' });
  }
});

// ============================================================================
// Social Login endpoint (Google, Microsoft, Apple, Facebook)
// ============================================================================
router.post('/social-login', async (req: Request, res: Response) => {
  const clientIp = getClientIp(req);
  try {
    const { provider, email, name } = req.body;
    if (!provider) {
      return res.status(400).json({ error: 'Provider is required' });
    }

    const userEmail = email || `user.${provider}.${Date.now()}@socialauth.org`;
    const userName = name || `${provider.toUpperCase()} Authorized User`;

    const cleanSocialEmail = normalizeEmail(userEmail);
    const existingCandidates = await findUsersByEmail(cleanSocialEmail);
    let user = existingCandidates.length > 0 ? existingCandidates[0] : null;

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: userName,
          email: cleanSocialEmail,
          passwordHash: 'social',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userName)}`,
          role: 'USER',
          provider: provider,
        },
      });
    }

    if (user.isBlocked) {
      logAuthEvent({
        action: 'LOGIN_FAILED',
        email: cleanSocialEmail,
        ip: clientIp,
        reason: 'Blocked account attempting social login',
        userId: user.id,
      });
      return res.status(403).json({ error: 'Account has been blocked' });
    }

    logAuthEvent({
      action: 'LOGIN_SUCCESS',
      email: cleanSocialEmail,
      ip: clientIp,
      reason: `Social sign-in via ${provider}`,
      userId: user.id,
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({ user: sanitizeUser(user), token });
  } catch (error) {
    return res.status(500).json({ error: 'Social authentication failed' });
  }
});

// ============================================================================
// Profile Endpoints
// ============================================================================
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.user?.id } });
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  return res.json(sanitizeUser(user));
});

router.put('/profile', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { name, avatar } = req.body;
  const user = await prisma.user.update({
    where: { id: req.user?.id },
    data: {
      ...(name && { name }),
      ...(avatar && { avatar }),
    },
  });

  return res.json(sanitizeUser(user));
});

// ============================================================================
// Forgot Password Flow
// ============================================================================

// 1. Send OTP for Forgot Password
router.post(['/forgot-password/send-otp', '/send-otp'], async (req: Request, res: Response) => {
  const clientIp = getClientIp(req);
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email address is required' });
    }

    const cleanEmail = normalizeEmail(email);
    const candidates = await findUsersByEmail(cleanEmail);
    if (candidates.length === 0) {
      logAuthEvent({
        action: 'PASSWORD_RESET_FAILED',
        email: cleanEmail,
        ip: clientIp,
        reason: 'No account found for password reset OTP',
      });
      return res.status(404).json({ error: 'No account found with this email address' });
    }

    const user = candidates[0];
    if (user.isBlocked) {
      logAuthEvent({
        action: 'PASSWORD_RESET_FAILED',
        email: cleanEmail,
        ip: clientIp,
        reason: 'Blocked account attempting password reset',
        userId: user.id,
      });
      return res.status(403).json({ error: 'Account has been blocked' });
    }

    logAuthEvent({
      action: 'PASSWORD_RESET_ATTEMPT',
      email: cleanEmail,
      ip: clientIp,
      userId: user.id,
    });

    // Generate random 6-digit verification code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(cleanEmail, {
      code: otp,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      attempts: 0,
    });

    // Send email via service (with console fallback)
    await sendPasswordResetOtpEmail({
      toEmail: cleanEmail,
      userName: user.name,
      otp,
    });

    return res.status(200).json({
      success: true,
      message: `A 6-digit OTP has been sent to ${cleanEmail}. Please enter it to reset your password.`,
      devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined,
    });
  } catch (error) {
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

    const cleanEmail = normalizeEmail(email);
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

    if (record.code !== String(otp).trim()) {
      record.attempts += 1;
      return res.status(400).json({ error: 'Invalid verification code. Please check and try again.' });
    }

    return res.status(200).json({ success: true, message: 'OTP verified successfully.' });
  } catch (error) {
    return res.status(500).json({ error: 'Server error while verifying OTP' });
  }
});

// 3. Reset Password using OTP
router.post(['/forgot-password/reset', '/forgot-password'], async (req: Request, res: Response) => {
  const clientIp = getClientIp(req);
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({ error: 'Email and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    const cleanEmail = normalizeEmail(email);
    const candidates = await findUsersByEmail(cleanEmail);
    if (candidates.length === 0) {
      logAuthEvent({
        action: 'PASSWORD_RESET_FAILED',
        email: cleanEmail,
        ip: clientIp,
        reason: 'User not found during password reset',
      });
      return res.status(404).json({ error: 'No account found with this email address' });
    }

    const user = candidates[0];
    if (user.isBlocked) {
      logAuthEvent({
        action: 'PASSWORD_RESET_FAILED',
        email: cleanEmail,
        ip: clientIp,
        reason: 'Account blocked during password reset',
        userId: user.id,
      });
      return res.status(403).json({ error: 'Account has been blocked' });
    }

    // Verify OTP if provided
    if (otp) {
      const record = otpStore.get(cleanEmail);
      if (!record) {
        return res.status(400).json({ error: 'No active OTP found. Please request a new code.' });
      }

      if (Date.now() > record.expiresAt) {
        otpStore.delete(cleanEmail);
        return res.status(400).json({ error: 'OTP has expired. Please request a new code.' });
      }

      if (record.code !== String(otp).trim()) {
        record.attempts += 1;
        return res.status(400).json({ error: 'Invalid verification code. Please check and try again.' });
      }

      otpStore.delete(cleanEmail);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        provider: 'local',
      },
    });

    logAuthEvent({
      action: 'PASSWORD_RESET_SUCCESS',
      email: cleanEmail,
      ip: clientIp,
      userId: user.id,
    });

    return res.status(200).json({
      message: 'Password has been reset successfully. Please sign in with your new password.',
    });
  } catch (error) {
    return res.status(500).json({ error: 'Server error while resetting password' });
  }
});

// ============================================================================
// Change Password for Authenticated User
// ============================================================================
router.post('/change-password', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const clientIp = getClientIp(req);
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

    // Passwords strictly compared as entered
    let match = false;
    if (isBcryptHash(user.passwordHash)) {
      match = await bcrypt.compare(currentPassword, user.passwordHash);
    } else {
      match = currentPassword === user.passwordHash;
    }

    if (!match) {
      logAuthEvent({
        action: 'CHANGE_PASSWORD_FAILED',
        email: user.email,
        ip: clientIp,
        reason: 'Current password mismatch',
        userId: user.id,
      });
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedNewPassword,
        provider: 'local',
      },
    });

    logAuthEvent({
      action: 'CHANGE_PASSWORD_SUCCESS',
      email: user.email,
      ip: clientIp,
      userId: user.id,
    });

    return res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Server error while changing password' });
  }
});

export default router;
