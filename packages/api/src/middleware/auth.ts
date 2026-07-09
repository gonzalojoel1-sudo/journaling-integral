import { Context, Next } from 'hono';
import { jwtDecrypt } from 'jose';

const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || 'journaling-nextauth-super-secret-key-12345';
const secret = new TextEncoder().encode(NEXTAUTH_SECRET);

function getTokenFromCookie(c: Context): string | undefined {
  const cookieHeader = c.req.header('Cookie');
  if (!cookieHeader) return undefined;
  const match = cookieHeader.match(/next-auth\.session-token=([^;]+)/);
  return match?.[1];
}

export async function authMiddleware(c: Context, next: Next) {
  let token: string | undefined;

  const authHeader = c.req.header('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  } else {
    token = getTokenFromCookie(c);
  }

  if (!token) {
    return c.json({ success: false, error: 'No autorizado' }, 401);
  }

  try {
    const { payload } = await jwtDecrypt(token, secret);
    c.set('userId', (payload.sub || payload.id || 'demo-user-id') as string);
    c.set('userEmail', (payload.email || '') as string);
    await next();
  } catch {
    return c.json({ success: false, error: 'Token invalido' }, 401);
  }
}
