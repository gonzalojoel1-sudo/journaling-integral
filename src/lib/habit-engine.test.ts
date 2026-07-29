import { describe, it, expect, vi, beforeEach } from 'vitest';

const findManyMock = vi.fn();
const updateSetMock = vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });
const updateMock = vi.fn().mockReturnValue({ set: updateSetMock });

vi.mock('../db/db', () => ({
  db: {
    query: { habits: { findMany: findManyMock } },
    update: updateMock,
  },
}));

vi.mock('../db/schema', () => ({
  habits: {
    id: 'id',
    userId: 'userId',
    habitType: 'habitType',
    domain: 'domain',
    currentStrength: 'currentStrength',
    lastStrengthDate: 'lastStrengthDate',
    pilarCompleted: 'pilarCompleted',
    triggerHitCount: 'triggerHitCount',
    actionExecutedCount: 'actionExecutedCount',
    daysInCurrentCycle: 'daysInCurrentCycle',
    rescueAction: 'rescueAction',
    activeAction: 'activeAction',
    currentStreak: 'currentStreak',
    streakShields: 'streakShields',
    victoryCount: 'victoryCount',
    temptationCount: 'temptationCount',
  },
}));

const setCalls = () => updateSetMock.mock.calls.map((c) => c[0]);

beforeEach(() => {
  vi.clearAllMocks();
  updateSetMock.mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });
  updateMock.mockReturnValue({ set: updateSetMock });
});

describe('processDailyHabits', () => {
  it('returns early without touching the DB when dailyHabits is empty', async () => {
    const { processDailyHabits } = await import('./habit-engine');
    await processDailyHabits('user-1', [], '2026-07-11');
    expect(findManyMock).not.toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('returns early when entries have no habitId', async () => {
    const { processDailyHabits } = await import('./habit-engine');
    await processDailyHabits('user-1', [{} as { habitId: string }], '2026-07-11');
    expect(findManyMock).not.toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('updates a non-pilar PRECISO habit (counts trigger + action when completed)', async () => {
    findManyMock.mockResolvedValue([
      {
        id: 'h-preciso',
        userId: 'user-1',
        habitType: 'preciso',
        currentStrength: 0,
        lastStrengthDate: null,
        triggerHitCount: 2,
        actionExecutedCount: 3,
      },
    ]);

    const { processDailyHabits } = await import('./habit-engine');
    await processDailyHabits(
      'user-1',
      [{ habitId: 'h-preciso', completed: true }],
      '2026-07-11',
    );

    expect(updateMock).toHaveBeenCalled();
    const allSets = setCalls();
    const triggerSet = allSets.find((s) => 'triggerHitCount' in s);
    expect(triggerSet).toBeDefined();
    expect(triggerSet.triggerHitCount).toBe(3);
    expect(triggerSet.actionExecutedCount).toBe(4);
  });

  it('updates a non-pilar SEMBRAR habit (bumps daysInCurrentCycle when completed)', async () => {
    findManyMock.mockResolvedValue([
      {
        id: 'h-sembrar',
        userId: 'user-1',
        habitType: 'sembrar',
        currentStrength: 1.0,
        lastStrengthDate: '2026-07-10',
        daysInCurrentCycle: 4,
      },
    ]);

    const { processDailyHabits } = await import('./habit-engine');
    await processDailyHabits(
      'user-1',
      [{ habitId: 'h-sembrar', completed: true }],
      '2026-07-11',
    );

    const allSets = setCalls();
    const cycleSet = allSets.find((s) => 'daysInCurrentCycle' in s);
    expect(cycleSet).toBeDefined();
    expect(cycleSet.daysInCurrentCycle).toBe(5);
  });

  it('updates a non-pilar CRECER habit (increments streak when completed)', async () => {
    findManyMock.mockResolvedValue([
      {
        id: 'h-crecer',
        userId: 'user-1',
        habitType: 'crecer',
        currentStrength: 2.0,
        lastStrengthDate: '2026-07-10',
        currentStreak: 3,
        streakShields: 0,
      },
    ]);

    const { processDailyHabits } = await import('./habit-engine');
    await processDailyHabits(
      'user-1',
      [{ habitId: 'h-crecer', completed: true }],
      '2026-07-11',
    );

    const allSets = setCalls();
    const streakSet = allSets.find((s) => 'currentStreak' in s);
    expect(streakSet).toBeDefined();
    expect(streakSet.currentStreak).toBe(4);
  });

  it('updates a non-pilar CAMBIAR habit (counts victory when completed + temptation)', async () => {
    findManyMock.mockResolvedValue([
      {
        id: 'h-cambiar',
        userId: 'user-1',
        habitType: 'cambiar',
        currentStrength: 1.0,
        lastStrengthDate: '2026-07-10',
        victoryCount: 1,
        temptationCount: 2,
      },
    ]);

    const { processDailyHabits } = await import('./habit-engine');
    await processDailyHabits(
      'user-1',
      [
        { habitId: 'h-cambiar', completed: true, temptationAppeared: true },
      ],
      '2026-07-11',
    );

    const allSets = setCalls();
    const victorySet = allSets.find((s) => 'victoryCount' in s);
    expect(victorySet).toBeDefined();
    expect(victorySet.victoryCount).toBe(2);
    const temptationSet = allSets.find((s) => 'temptationCount' in s && !('victoryCount' in s));
    expect(temptationSet).toBeUndefined();
  });

  it('processes a PILAR habit: marks pilarCompleted=1 only when all non-pilar are completed', async () => {
    findManyMock.mockResolvedValue([
      {
        id: 'h-pilar',
        userId: 'user-1',
        habitType: 'pilar',
        domain: 'cuerpo',
        currentStrength: 5.0,
        lastStrengthDate: '2026-07-10',
      },
      {
        id: 'h-preciso',
        userId: 'user-1',
        habitType: 'preciso',
        currentStrength: 1.0,
        lastStrengthDate: '2026-07-10',
        triggerHitCount: 0,
        actionExecutedCount: 0,
      },
    ]);

    const { processDailyHabits } = await import('./habit-engine');
    await processDailyHabits(
      'user-1',
      [
        { habitId: 'h-pilar', completed: true },
        { habitId: 'h-preciso', completed: true },
      ],
      '2026-07-11',
    );

    const allSets = setCalls();
    const pilarSet = allSets.find((s) => 'pilarCompleted' in s);
    expect(pilarSet).toBeDefined();
    expect(pilarSet.pilarCompleted).toBe(1);
    expect(pilarSet.currentStrength).toBeDefined();
  });

  it('pilar habit gets pilarCompleted=0 when a non-pilar is missing', async () => {
    findManyMock.mockResolvedValue([
      {
        id: 'h-pilar',
        userId: 'user-1',
        habitType: 'pilar',
        domain: 'mente',
        currentStrength: 3.0,
        lastStrengthDate: '2026-07-10',
      },
      {
        id: 'h-preciso',
        userId: 'user-1',
        habitType: 'preciso',
        currentStrength: 1.0,
        lastStrengthDate: '2026-07-10',
        triggerHitCount: 0,
        actionExecutedCount: 0,
      },
    ]);

    const { processDailyHabits } = await import('./habit-engine');
    await processDailyHabits(
      'user-1',
      [
        { habitId: 'h-pilar', completed: true },
        { habitId: 'h-preciso', completed: false },
      ],
      '2026-07-11',
    );

    const allSets = setCalls();
    const pilarSet = allSets.find((s) => 'pilarCompleted' in s);
    expect(pilarSet).toBeDefined();
    expect(pilarSet.pilarCompleted).toBe(0);
  });

  it('skips habit entries whose id is unknown (no matching habit record)', async () => {
    findManyMock.mockResolvedValue([]);

    const { processDailyHabits } = await import('./habit-engine');
    await processDailyHabits(
      'user-1',
      [{ habitId: 'unknown-id', completed: true }],
      '2026-07-11',
    );

    expect(updateMock).not.toHaveBeenCalled();
  });
});