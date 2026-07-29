import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { habits } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { requireCurrentUserId } from '@/app/actions/auth';
import { validate, EvolveHabitSchema } from '@/lib/validations';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const userId = await requireCurrentUserId();

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const v = validate(EvolveHabitSchema, body);
    if (!v.success) {
      return NextResponse.json({ error: v.error }, { status: 400 });
    }

    const { habitId, evolutionOptimal, evolutionMinimum } = v.data;

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
