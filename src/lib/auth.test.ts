import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/app/api/auth/[...nextauth]/options', () => ({
  authOptions: {},
}));

import { getServerSession } from 'next-auth';
import { getSessionUser, getUserRole, requireAdmin } from './auth';

const mockedGetServerSession = vi.mocked(getServerSession);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getSessionUser', () => {
  it('should return null when there is no session', async () => {
    mockedGetServerSession.mockResolvedValue(null);
    const user = await getSessionUser();
    expect(user).toBeNull();
  });

  it('should return null when session has no user', async () => {
    mockedGetServerSession.mockResolvedValue({} as any);
    const user = await getSessionUser();
    expect(user).toBeNull();
  });

  it('should return the user when session has a user', async () => {
    const mockUser = {
      id: 'user-123',
      name: 'Joel',
      email: 'joel@test.com',
      role: 'user',
      currentLevel: 5,
    };
    mockedGetServerSession.mockResolvedValue({ user: mockUser } as any);
    const user = await getSessionUser();
    expect(user).toEqual(mockUser);
  });

  it('should return the user even when fields are missing', async () => {
    const mockUser = { id: 'user-456' };
    mockedGetServerSession.mockResolvedValue({ user: mockUser } as any);
    const user = await getSessionUser();
    expect(user).toEqual(mockUser);
  });
});

describe('getUserRole', () => {
  it('should return "admin" when user has admin role', async () => {
    mockedGetServerSession.mockResolvedValue({
      user: { id: 'u1', role: 'admin' },
    } as any);
    const role = await getUserRole();
    expect(role).toBe('admin');
  });

  it('should return "user" when user has user role', async () => {
    mockedGetServerSession.mockResolvedValue({
      user: { id: 'u1', role: 'user' },
    } as any);
    const role = await getUserRole();
    expect(role).toBe('user');
  });

  it('should return null when there is no session', async () => {
    mockedGetServerSession.mockResolvedValue(null);
    const role = await getUserRole();
    expect(role).toBeNull();
  });

  it('should return null when role is missing', async () => {
    mockedGetServerSession.mockResolvedValue({
      user: { id: 'u1' },
    } as any);
    const role = await getUserRole();
    expect(role).toBeNull();
  });

  it('should return null when role is an unexpected string', async () => {
    mockedGetServerSession.mockResolvedValue({
      user: { id: 'u1', role: 'superuser' },
    } as any);
    const role = await getUserRole();
    expect(role).toBeNull();
  });
});

describe('requireAdmin', () => {
  it('should return user when role is admin', async () => {
    const mockUser = { id: 'admin-1', role: 'admin' };
    mockedGetServerSession.mockResolvedValue({ user: mockUser } as any);
    const user = await requireAdmin();
    expect(user).toEqual(mockUser);
  });

  it('should throw when user is not admin', async () => {
    mockedGetServerSession.mockResolvedValue({
      user: { id: 'u1', role: 'user' },
    } as any);
    await expect(requireAdmin()).rejects.toThrow('Unauthorized: admin role required');
  });

  it('should throw when there is no session', async () => {
    mockedGetServerSession.mockResolvedValue(null);
    await expect(requireAdmin()).rejects.toThrow('Unauthorized: admin role required');
  });
});
