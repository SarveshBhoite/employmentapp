import jwt from 'jsonwebtoken';

const JWT_SECRET = '1dd74ba40c2e29365f84ba91c5be12c2590f92873d64b58f089e7383630123sd';

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'admin' | 'employee';
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
}
