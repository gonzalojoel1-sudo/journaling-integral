import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { habits } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const { habitId, evolutionOptimal, evolutionMinimum } = await req.json();
    if (!habitId) return NextResponse.json({ error: 'habitId required' }, { status: 400 });

    const habit = await db.query.habits.findFirst({ where: eq(habits.id, habitId) });
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
    console.error('Error evolving habit:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
