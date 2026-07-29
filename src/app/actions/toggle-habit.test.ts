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

const entryFindFirstMock = vi.fn();
const habitFindFirstMock = vi.fn();
const insertValuesMock = vi.fn().mockResolvedValue(undefined);
const updateSetMock = vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });
const updateMock = vi.fn().mockReturnValue({ set: updateSetMock });

const dbMock = {
  query: {
    dailyEntries: { findFirst: entryFindFirstMock },
    habits: { findFirst: habitFindFirstMock },
  },
  insert: vi.fn(() => ({ values: insertValuesMock })),
  update: updateMock,
};

vi.mock('../../db/db', () => ({ db: dbMock }));
vi.mock('../../db/schema', () => ({
  dailyEntries: {
    userId: 'userId',
    date: 'date',
    id: 'id',
    dailyHabitsJson: 'dailyHabitsJson',
    mitSerCompleted: 'mitSerCompleted',
    mitNegocioCompleted: 'mitNegocioCompleted',
    mitRelacionesCompleted: 'mitRelacionesCompleted',
  },
  habits: { id: 'id', userId: 'userId' },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const insertValuesArgs = () => insertValuesMock.mock.calls[0]?.[0] ?? null;
const updateSetArgs = () => updateSetMock.mock.calls[0]?.[0] ?? null;

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireUserId.mockResolvedValue('user-A');
  entryFindFirstMock.mockResolvedValue(null);
  habitFindFirstMock.mockResolvedValue(null);
  insertValuesMock.mockClear().mockResolvedValue(undefined);
  updateSetMock.mockClear().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });
  updateMock.mockClear().mockReturnValue({ set: updateSetMock });
  dbMock.insert.mockClear().mockImplementation(() => ({ values: insertValuesMock }));
});

describe('toggleHabitCompleted (habit kind)', () => {
  it('requires habitId for kind=habit', async () => {
    const { toggleHabitCompleted } = await import('./toggle-habit');
    const result = await toggleHabitCompleted({ kind: 'habit', completed: true });
    expect(result.success).toBe(false);
    expect(insertValuesMock).not.toHaveBeenCalled();
  });

  it('rejects when habit does not belong to authenticated user', async () => {
    const { toggleHabitCompleted } = await import('./toggle-habit');
    habitFindFirstMock.mockResolvedValue(null);
    const result = await toggleHabitCompleted({
      kind: 'habit',
      habitId: '00000000-0000-0000-0000-000000000001',
      completed: true,
    });
    expect(result.success).toBe(false);
    expect(insertValuesMock).not.toHaveBeenCalled();
  });

  it('creates a new daily entry when none exists for today, persists completed=true', async () => {
    const { toggleHabitCompleted } = await import('./toggle-habit');
    habitFindFirstMock.mockResolvedValue({ id: '00000000-0000-0000-0000-000000000001' });
    entryFindFirstMock.mockResolvedValue(null);
    const result = await toggleHabitCompleted({
      kind: 'habit',
      habitId: '00000000-0000-0000-0000-000000000001',
      completed: true,
    });
    expect(result.success).toBe(true);
    expect(dbMock.insert).toHaveBeenCalled();
    const payload = insertValuesArgs();
    expect(payload).not.toBeNull();
    const parsed = JSON.parse(payload.dailyHabitsJson);
    expect(parsed[0].habitId).toBe('00000000-0000-0000-0000-000000000001');
    expect(parsed[0].completed).toBe(true);
  });

  it('updates existing daily entry by merging habits array (toggle on)', async () => {
    const { toggleHabitCompleted } = await import('./toggle-habit');
    habitFindFirstMock.mockResolvedValue({ id: 'h-1' });
    entryFindFirstMock.mockResolvedValue({
      id: 'entry-1',
      dailyHabitsJson: JSON.stringify([
        { habitId: 'h-1', completed: false },
        { habitId: 'h-2', completed: false },
      ]),
    });
    const result = await toggleHabitCompleted({
      kind: 'habit',
      habitId: 'h-1',
      completed: true,
    });
    expect(result.success).toBe(true);
    expect(updateSetMock).toHaveBeenCalled();
    const setCall = updateSetArgs();
    const parsed = JSON.parse(setCall.dailyHabitsJson);
    const h1 = parsed.find((h: { habitId: string }) => h.habitId === 'h-1');
    expect(h1.completed).toBe(true);
  });

  it('updates existing entry by setting completed=false when toggling off', async () => {
    const { toggleHabitCompleted } = await import('./toggle-habit');
    habitFindFirstMock.mockResolvedValue({ id: 'h-1' });
    entryFindFirstMock.mockResolvedValue({
      id: 'entry-1',
      dailyHabitsJson: JSON.stringify([{ habitId: 'h-1', completed: true }]),
    });
    const result = await toggleHabitCompleted({
      kind: 'habit',
      habitId: 'h-1',
      completed: false,
    });
    expect(result.success).toBe(true);
    const setCall = updateSetArgs();
    const parsed = JSON.parse(setCall.dailyHabitsJson);
    expect(parsed[0].completed).toBe(false);
  });

  it('appends a new habit entry when toggling a habit not yet in the list', async () => {
    const { toggleHabitCompleted } = await import('./toggle-habit');
    habitFindFirstMock.mockResolvedValue({ id: 'h-2' });
    entryFindFirstMock.mockResolvedValue({
      id: 'entry-1',
      dailyHabitsJson: JSON.stringify([{ habitId: 'h-1', completed: true }]),
    });
    const result = await toggleHabitCompleted({
      kind: 'habit',
      habitId: 'h-2',
      completed: true,
    });
    expect(result.success).toBe(true);
    const setCall = updateSetArgs();
    const parsed = JSON.parse(setCall.dailyHabitsJson);
    expect(parsed).toHaveLength(2);
    expect(parsed.find((h: { habitId: string }) => h.habitId === 'h-2').completed).toBe(true);
  });

  it('corrupts gracefully when dailyHabitsJson is malformed', async () => {
    const { toggleHabitCompleted } = await import('./toggle-habit');
    habitFindFirstMock.mockResolvedValue({ id: 'h-1' });
    entryFindFirstMock.mockResolvedValue({
      id: 'entry-1',
      dailyHabitsJson: 'not-json{{',
    });
    const result = await toggleHabitCompleted({
      kind: 'habit',
      habitId: 'h-1',
      completed: true,
    });
    expect(result.success).toBe(true);
    const setCall = updateSetArgs();
    const parsed = JSON.parse(setCall.dailyHabitsJson);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].habitId).toBe('h-1');
  });
});

describe('toggleHabitCompleted (MIT kind)', () => {
  it('persists mitSerCompleted on existing entry', async () => {
    const { toggleHabitCompleted } = await import('./toggle-habit');
    entryFindFirstMock.mockResolvedValue({ id: 'entry-1' });
    const result = await toggleHabitCompleted({ kind: 'mitSer', completed: true });
    expect(result.success).toBe(true);
    expect(updateSetMock).toHaveBeenCalled();
    expect(updateSetArgs().mitSerCompleted).toBe(1);
  });

  it('persists mitNegocioCompleted without affecting other flags', async () => {
    const { toggleHabitCompleted } = await import('./toggle-habit');
    entryFindFirstMock.mockResolvedValue({ id: 'entry-1' });
    const result = await toggleHabitCompleted({ kind: 'mitNegocio', completed: true });
    expect(result.success).toBe(true);
    const setCall = updateSetArgs();
    expect(setCall.mitNegocioCompleted).toBe(1);
    expect(setCall.mitSerCompleted).toBeUndefined();
    expect(setCall.mitRelacionesCompleted).toBeUndefined();
  });

  it('creates a new entry when none exists for today, marking the flag', async () => {
    const { toggleHabitCompleted } = await import('./toggle-habit');
    entryFindFirstMock.mockResolvedValue(null);
    const result = await toggleHabitCompleted({ kind: 'mitRelaciones', completed: true });
    expect(result.success).toBe(true);
    expect(dbMock.insert).toHaveBeenCalled();
    const payload = insertValuesArgs();
    expect(payload.mitRelacionesCompleted).toBe(1);
  });

  it('sets completed=false by writing 0 instead of null', async () => {
    const { toggleHabitCompleted } = await import('./toggle-habit');
    entryFindFirstMock.mockResolvedValue({ id: 'entry-1' });
    const result = await toggleHabitCompleted({ kind: 'mitSer', completed: false });
    expect(result.success).toBe(true);
    expect(updateSetArgs().mitSerCompleted).toBe(0);
  });

  it('rejects unknown kind', async () => {
    const { toggleHabitCompleted } = await import('./toggle-habit');
    const result = await toggleHabitCompleted({
      kind: 'unknown' as unknown as 'habit',
      completed: true,
    });
    expect(result.success).toBe(false);
    expect(insertValuesMock).not.toHaveBeenCalled();
    expect(updateSetMock).not.toHaveBeenCalled();
  });
});
