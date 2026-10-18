// Signed session token: base64url(payload).hmac. Node runtime.
import { createHmac, timingSafeEqual } from 'crypto';
export const COOKIE = 'nexora_session';
const secret = () => {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) throw new Error('SESSION_SECRET is not set (min 16 chars). See .env.example');
  return s;
};
export function signToken(uid: string, days = 7): string {
  const body = Buffer.from(JSON.stringify({ uid, exp: Date.now() + days * 864e5 })).toString('base64url');
  return `${body}.${createHmac('sha256', secret()).update(body).digest('base64url')}`;
}
export function verifyToken(token?: string): string | null {
  if (!token) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const good = createHmac('sha256', secret()).update(body).digest('base64url');
  if (sig.length !== good.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(good))) return null;
  try { const p = JSON.parse(Buffer.from(body, 'base64url').toString()); return p.exp > Date.now() ? p.uid : null; } catch { return null; }
}
