import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { habits } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { requireCurrentUserId } from '@/app/actions/auth';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const userId = await requireCurrentUserId();
    const { habitId, evolutionOptimal, evolutionMinimum } = await req.json();
    if (!habitId) return NextResponse.json({ error: 'habitId required' }, { status: 400 });

    const habit = await db.query.habits.findFirst({
      where: and(eq(habits.id, habitId), eq(habits.userId, userId)),
    });
    if (!habit) return NextResponse.json({ error: 'Habit not found' }, { status: 404 });

    await db.update(habits).set({
      evolutionCycle: (habit.evolutionCycle ?? 0) + 1,
      daysInCurrentCycle: 0,
      evolutionOptimal: evolutionOptimal || null,
      evolutionMinimum: evolutionMinimum || null,
      activeAction: evolutionOptimal || habit.activeAction,
      rescueAction: evolutionMinimum || habit.rescueAction,
    }).where(eq(habits.id, habitId));

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    logger.error('habit_evolve_failed', {}, error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
