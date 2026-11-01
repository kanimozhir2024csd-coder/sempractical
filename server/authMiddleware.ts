import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { dbService } from './db';
import { UserProfile, UserRole } from '../src/types';

const SESSION_SECRET = process.env.SESSION_SECRET || 'rec-tech-campus-session-token-2026';

export interface AuthenticatedRequest extends Request {
  user?: UserProfile;
}

export function createSessionToken(user: UserProfile): string {
  const payload = {
    sub: user.id,
    role: user.role,
    email: user.email,
    name: user.name,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
  };
  const str = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(str).digest('base64url');
  return `${str}.${signature}`;
}

export function verifySessionToken(token: string): { sub: string; role: UserRole; email: string; name: string } | null {
  try {
    const [payloadStr, signature] = token.split('.');
    if (!payloadStr || !signature) return null;
    const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(payloadStr).digest('base64url');
    if (signature !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(payloadStr, 'base64url').toString('utf-8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid Authorization Bearer header.' });
  }

  const token = authHeader.slice(7).trim();
  const decoded = verifySessionToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Unauthorized: Session token is invalid or expired. Please sign in again.' });
  }

  const user = await dbService.getProfileById(decoded.sub);
  if (!user || !user.is_active) {
    return res.status(401).json({ error: 'Unauthorized: Account deactivated or not found.' });
  }

  req.user = user;
  next();
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: Authentication required.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden: Access requires one of [${allowedRoles.join(', ')}] roles. Your role is '${req.user.role}'.`,
      });
    }
    next();
  };
}
