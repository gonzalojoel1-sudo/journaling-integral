import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { ROLE_ADMIN, ROLE_USER, type Role } from '@/lib/constants-domain';

export type SessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
  currentLevel?: number;
};

export type UserRole = Role;

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session.user as SessionUser;
}

export async function getUserRole(): Promise<UserRole | null> {
  const user = await getSessionUser();
  const role = user?.role;
  if (role === ROLE_ADMIN || role === ROLE_USER) {
    return role;
  }
  return null;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (user?.role !== ROLE_ADMIN) {
    throw new Error('Unauthorized: admin role required');
  }
  return user;
}

