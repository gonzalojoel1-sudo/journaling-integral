import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('../api/auth/[...nextauth]/options', () => ({
  authOptions: {},
}));

vi.mock('../../db/db', () => ({ db: dbMock }));

vi.mock('../../db/schema', () => ({
  users: { id: 'id', email: 'email' },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const findFirstMock = vi.fn();
const insertValuesMock = vi.fn().mockResolvedValue(undefined);
const insertMock = vi.fn(() => ({ values: insertValuesMock }));

const dbMock = {
  query: { users: { findFirst: findFirstMock } },
  insert: insertMock,
};

const mockGetCurrentUserId = vi.fn();
vi.mock('@/app/actions/auth', async () => {
  const actual = await vi.importActual<typeof import('./auth')>('./auth');
  return {
    ...actual,
    getCurrentUserId: () => mockGetCurrentUserId(),
  };
});

const insertedUser = () => insertValuesMock.mock.calls[0]?.[0] ?? null;

beforeEach(() => {
  vi.clearAllMocks();
  insertValuesMock.mockResolvedValue(undefined);
  insertMock.mockImplementation(() => ({ values: insertValuesMock }));
  mockGetCurrentUserId.mockReset();
});

describe('getOrCreateUserProfile', () => {
  it('returns the existing user when one is found by id', async () => {
    const { getOrCreateUserProfile } = await import('./auth');
    const existing = { id: 'user-1', email: 'a@b.com' };
    mockGetCurrentUserId.mockResolvedValue('user-1');
    findFirstMock.mockResolvedValueOnce(existing);

    const result = await getOrCreateUserProfile();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.user).toEqual(existing);
    }
    expect(insertMock).not.toHaveBeenCalled();
  });

  it('inserts a new user when none exists (and reuses one by demo email if present)', async () => {
    const { getOrCreateUserProfile } = await import('./auth');
    mockGetCurrentUserId.mockResolvedValue('demo-user-id');
    findFirstMock.mockResolvedValueOnce(null);
    findFirstMock.mockResolvedValueOnce({ id: 'demo-user-id', email: 'demo@local' });

    const result = await getOrCreateUserProfile();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.user?.email).toBe('demo@local');
    }
    expect(insertMock).not.toHaveBeenCalled();
  });

  it('creates a brand-new user when neither id nor demo email matches', async () => {
    const { getOrCreateUserProfile } = await import('./auth');
    mockGetCurrentUserId.mockResolvedValue('demo-user-id');
    findFirstMock.mockResolvedValueOnce(null);
    findFirstMock.mockResolvedValueOnce(null);

    const result = await getOrCreateUserProfile();

    expect(result.success).toBe(true);
    expect(insertMock).toHaveBeenCalled();
    const payload = insertedUser();
    expect(payload).not.toBeNull();
    expect(payload.id).toBe('demo-user-id');
    expect(payload.role).toBe('user');
    expect(typeof payload.createdAt).toBe('string');
  });

  it('returns failure when DB throws', async () => {
    const { getOrCreateUserProfile } = await import('./auth');
    mockGetCurrentUserId.mockResolvedValue('demo-user-id');
    findFirstMock.mockRejectedValueOnce(new Error('db offline'));

    const result = await getOrCreateUserProfile();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/perfil|usuario/i);
    }
  });
});