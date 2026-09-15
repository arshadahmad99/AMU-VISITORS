import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '@digital-library/types';
import { usersStore } from '../services/store';

export const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-digital-library-key-2026';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    name: string;
  };
}

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1];
  
  if (!token && req.query.token && typeof req.query.token === 'string') {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Check PostgreSQL database user
    const dbUser = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (dbUser && dbUser.isBlocked) {
      return res.status(403).json({ error: 'Account has been blocked by administrator' });
    }

    req.user = {
      id: decoded.id,
      email: dbUser ? dbUser.email : decoded.email,
      role: (dbUser ? dbUser.role : decoded.role) as UserRole,
      name: dbUser ? dbUser.name : decoded.name
    };
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Administrative privileges required' });
  }
  next();
};
