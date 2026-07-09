import { Context, Next } from 'hono';

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  let token: string | undefined;

  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  }

  if (!token) {
    return c.json({ success: false, error: 'No autorizado' }, 401);
  }

  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    c.set('userId', payload.sub || payload.id);
    c.set('userEmail', payload.email);
    await next();
  } catch {
    return c.json({ success: false, error: 'Token invalido' }, 401);
  }
}
