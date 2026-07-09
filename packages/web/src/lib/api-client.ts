const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function getTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(
    /(?:^|;\s*)next-auth\.session-token=([^;]*)/
  );
  return match ? match[1] : null;
}

async function fetchJson(method: string, path: string, body?: unknown): Promise<any> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getTokenFromCookie();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  return res.json();
}

export const api = {
  get: (path: string) =>
    fetchJson('GET', path) as Promise<{ success: boolean; data?: any; error?: string }>,
  post: (path: string, body: unknown) =>
    fetchJson('POST', path, body) as Promise<{ success: boolean; data?: any; error?: string }>,
  patch: (path: string, body: unknown) =>
    fetchJson('PATCH', path, body) as Promise<{ success: boolean; data?: any; error?: string }>,
  del: (path: string) =>
    fetchJson('DELETE', path) as Promise<{ success: boolean; data?: any; error?: string }>,
  rawGet: async (path: string): Promise<unknown> => {
    const headers: Record<string, string> = {};
    const token = getTokenFromCookie();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_URL}${path}`, { headers });
    return res.json();
  },
};

export async function serverFetch(path: string): Promise<{ success: boolean; data?: any; error?: string }> {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const token = cookieStore.get('next-auth.session-token')?.value
    || cookieStore.get('__Secure-next-auth.session-token')?.value;

  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const res = await fetch(`${API}${path}`, { headers });
  return res.json();
}
