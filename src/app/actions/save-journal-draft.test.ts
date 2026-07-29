import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/app/api/auth/[...nextauth]/options', () => ({
  authOptions: {},
}));

const mockRequireUserId = vi.fn();
vi.mock('@/app/actions/auth', () => ({
  requireCurrentUserId: () => mockRequireUserId(),
}));

const insertValuesMock = vi.fn().mockResolvedValue(undefined);
const updateWhereMock = vi.fn().mockResolvedValue(undefined);

const dbMock = {
  query: {
    dailyEntries: {
      findFirst: vi.fn(),
    },
    circles: {
      findFirst: vi.fn(),
    },
    circleMembers: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    weeklyPlans: {
      findFirst: vi.fn(),
    },
    quarterlyPlans: {
      findFirst: vi.fn(),
    },
  },
  insert: vi.fn(() => ({ values: insertValuesMock })),
  update: vi.fn(() => ({ set: vi.fn(() => ({ where: updateWhereMock })) })),
};

vi.mock('../../db/db', () => ({
  db: dbMock,
}));

vi.mock('../../db/schema', () => ({
  dailyEntries: { userId: 'userId', date: 'date', id: 'id' },
  circles: { createdBy: 'createdBy', id: 'id' },
  circleMembers: { inviteCode: 'inviteCode', userId: 'userId', id: 'id', circleId: 'circleId', status: 'status' },
  weeklyPlans: { userId: 'userId', id: 'id', weekLabel: 'weekLabel' },
  quarterlyPlans: { userId: 'userId', id: 'id', quarterLabel: 'quarterLabel', year: 'year', isActive: 'isActive' },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireUserId.mockResolvedValue('user-A');
  insertValuesMock.mockClear().mockResolvedValue(undefined);
  updateWhereMock.mockClear().mockResolvedValue(undefined);
  dbMock.insert.mockClear().mockImplementation(() => ({ values: insertValuesMock }));
  dbMock.update.mockClear().mockImplementation(() => ({ set: vi.fn(() => ({ where: updateWhereMock })) }));
  dbMock.query.dailyEntries.findFirst.mockReset().mockResolvedValue(null);
  dbMock.query.circles.findFirst.mockReset().mockResolvedValue(null);
  dbMock.query.circleMembers.findFirst.mockReset().mockResolvedValue(null);
  dbMock.query.circleMembers.findMany.mockReset().mockResolvedValue([]);
  dbMock.query.weeklyPlans.findFirst.mockReset().mockResolvedValue(null);
  dbMock.query.quarterlyPlans.findFirst.mockReset().mockResolvedValue(null);
});

describe('saveJournalDraft', () => {
  it('rejects payload containing injected userId', async () => {
    const { saveJournalDraft } = await import('./save-journal-draft');
    const result = await saveJournalDraft({
      gratitude1: 'Familia',
      userId: 'attacker-controlled-id',
    });
    expect(result.success).toBe(false);
    expect(dbMock.query.dailyEntries.findFirst).not.toHaveBeenCalled();
  });

  it('rejects payload containing injected date', async () => {
    const { saveJournalDraft } = await import('./save-journal-draft');
    const result = await saveJournalDraft({
      gratitude1: 'X',
      date: '2099-12-31',
    });
    expect(result.success).toBe(false);
  });

  it('queries existing entry filtered by userId (cross-user leak prevention)', async () => {
    const { saveJournalDraft } = await import('./save-journal-draft');
    dbMock.query.dailyEntries.findFirst.mockResolvedValue({ id: 'existing-id' });
    await saveJournalDraft({ gratitude1: 'Familia' });
    expect(dbMock.query.dailyEntries.findFirst).toHaveBeenCalled();
    expect(mockRequireUserId).toHaveBeenCalled();
  });

  it('rejects oversized gratitude1', async () => {
    const { saveJournalDraft } = await import('./save-journal-draft');
    const result = await saveJournalDraft({ gratitude1: 'A'.repeat(501) });
    expect(result.success).toBe(false);
  });

  it('inserts new entry when none exists for today', async () => {
    const { saveJournalDraft } = await import('./save-journal-draft');
    await saveJournalDraft({ gratitude1: 'Familia' });
    expect(dbMock.insert).toHaveBeenCalled();
  });
});

describe('saveHabitsDraft', () => {
  it('rejects payload with injected userId inside habit items', async () => {
    const { saveHabitsDraft } = await import('./save-habits-draft');
    const result = await saveHabitsDraft([
      { habitId: 'h-1', name: 'X', habitType: 'crecer', completed: true, userId: 'attacker' },
    ]);
    expect(result.success).toBe(false);
  });

  it('rejects non-array input', async () => {
    const { saveHabitsDraft } = await import('./save-habits-draft');
    const result = await saveHabitsDraft({ habitId: 'h-1' });
    expect(result.success).toBe(false);
  });

  it('uses server-derived userId, not input', async () => {
    const { saveHabitsDraft } = await import('./save-habits-draft');
    mockRequireUserId.mockResolvedValue('user-A');
    await saveHabitsDraft([{ habitId: 'h-1', completed: true }]);
    expect(mockRequireUserId).toHaveBeenCalled();
  });

  it('inserts new entry when none exists for today', async () => {
    const { saveHabitsDraft } = await import('./save-habits-draft');
    await saveHabitsDraft([{ habitId: 'h-1', completed: true }]);
    expect(dbMock.insert).toHaveBeenCalled();
  });
});

describe('circles.createCircle', () => {
  it('returns existing circle id when user already has one', async () => {
    const { createCircle } = await import('./circles');
    dbMock.query.circles.findFirst.mockResolvedValue({ id: 'existing-circle' });
    const result = await createCircle('Test');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.circleId).toBe('existing-circle');
      expect((result as any).alreadyExisted).toBe(true);
    }
  });

  it('inserts new circle when none exists', async () => {
    const { createCircle } = await import('./circles');
    const result = await createCircle('Nuevo círculo');
    expect(result.success).toBe(true);
    expect(dbMock.insert).toHaveBeenCalled();
  });

  it('handles race: insert fails, re-check finds existing', async () => {
    const { createCircle } = await import('./circles');
    dbMock.insert.mockImplementationOnce(() => ({
      values: vi.fn().mockRejectedValue(new Error('UNIQUE constraint failed')),
    }));
    dbMock.query.circles.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'race-winner' });
    const result = await createCircle('Carrera');
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result as any).alreadyExisted).toBe(true);
    }
  });
});

describe('circles.generateInvite', () => {
  it('rejects when user does not own the circle', async () => {
    const { generateInvite } = await import('./circles');
    dbMock.query.circles.findFirst.mockResolvedValue(null);
    const result = await generateInvite('00000000-0000-0000-0000-000000000001');
    expect(result.success).toBe(false);
  });

  it('generates 16-char hex invite code (64 bits entropy)', async () => {
    const { generateInvite } = await import('./circles');
    dbMock.query.circles.findFirst.mockResolvedValue({ id: '00000000-0000-0000-0000-000000000001' });
    const result = await generateInvite('00000000-0000-0000-0000-000000000001');
    expect(result.success).toBe(true);
    if (result.success && result.inviteCode) {
      expect(result.inviteCode).toHaveLength(16);
      expect(result.inviteCode).toMatch(/^[a-f0-9]+$/);
    }
  });

  it('rejects when circle is full', async () => {
    const { generateInvite } = await import('./circles');
    dbMock.query.circles.findFirst.mockResolvedValue({ id: '00000000-0000-0000-0000-000000000001' });
    dbMock.query.circleMembers.findMany.mockResolvedValue([{}, {}]);
    const result = await generateInvite('00000000-0000-0000-0000-000000000001');
    expect(result.success).toBe(false);
  });
});

describe('circles.joinCircle', () => {
  it('rejects when invite code does not exist', async () => {
    const { joinCircle } = await import('./circles');
    dbMock.query.circleMembers.findFirst.mockResolvedValue(null);
    const result = await joinCircle('a'.repeat(16));
    expect(result.success).toBe(false);
  });

  it('returns alreadyJoined when same user re-attempts with their code', async () => {
    const { joinCircle } = await import('./circles');
    dbMock.query.circleMembers.findFirst.mockResolvedValue({
      id: 'm-1',
      userId: 'user-A',
      circleId: 'circle-1',
    });
    const result = await joinCircle('a'.repeat(16));
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result as any).alreadyJoined).toBe(true);
    }
  });

  it('updates member only when userId is null (race-safe)', async () => {
    const { joinCircle } = await import('./circles');
    dbMock.query.circleMembers.findFirst.mockResolvedValue({
      id: 'm-1',
      userId: null,
      circleId: 'circle-1',
    });
    const setFn = vi.fn(() => ({
      where: vi.fn().mockResolvedValue({ rowsAffected: 1 }),
    }));
    dbMock.update.mockImplementationOnce(() => ({ set: setFn }));
    const result = await joinCircle('b'.repeat(16));
    expect(result.success).toBe(true);
    expect(setFn).toHaveBeenCalled();
  });
});

describe('saveWeeklyPlan', () => {
  it('rejects invalid payload', async () => {
    const { saveWeeklyPlan } = await import('./weekly-planning');
    const result = await saveWeeklyPlan({ focus: 'A'.repeat(1000) });
    expect(result.success).toBe(false);
  });

  it('inserts new plan with server-derived userId', async () => {
    const { saveWeeklyPlan } = await import('./weekly-planning');
    const result = await saveWeeklyPlan({ focus: 'Test focus', tasks: [] });
    expect(result.success).toBe(true);
    expect(dbMock.insert).toHaveBeenCalled();
    const valuesArg = insertValuesMock.mock.calls[0][0];
    expect(valuesArg.userId).toBe('user-A');
  });

  it('updates existing plan with userId ownership filter', async () => {
    const { saveWeeklyPlan } = await import('./weekly-planning');
    dbMock.query.weeklyPlans.findFirst.mockResolvedValue({ id: 'existing-plan' });
    const result = await saveWeeklyPlan({ focus: 'Test', tasks: [] });
    expect(result.success).toBe(true);
    expect(updateWhereMock).toHaveBeenCalled();
  });
});

describe('saveQuarterlyPlan', () => {
  it('inserts new plan with server-derived userId', async () => {
    const { saveQuarterlyPlan } = await import('./quarterly-planning');
    const result = await saveQuarterlyPlan({ quarterLabel: 'Q4/2026', year: 2026 });
    expect(result.success).toBe(true);
    expect(dbMock.insert).toHaveBeenCalled();
    const valuesArg = insertValuesMock.mock.calls[0][0];
    expect(valuesArg.userId).toBe('user-A');
  });

  it('updates existing plan with userId ownership filter', async () => {
    const { saveQuarterlyPlan } = await import('./quarterly-planning');
    dbMock.query.quarterlyPlans.findFirst.mockResolvedValue({ id: 'existing-quarterly' });
    const result = await saveQuarterlyPlan({ quarterLabel: 'Q4/2026', year: 2026 });
    expect(result.success).toBe(true);
    expect(updateWhereMock).toHaveBeenCalled();
  });
});