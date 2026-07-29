'use server';

import { db } from '@/db/db';
import { personalTransactions, businessTransactions } from '@/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { getCurrentUserId, requireCurrentUserId } from './auth';
import {
  validate,
  CreatePersonalTransactionSchema,
  UpdatePersonalTransactionSchema,
  DeletePersonalTransactionSchema,
  WithdrawToPersonalSchema,
} from '@/lib/validations';
import { logger } from '@/lib/logger';

export async function createPersonalTransaction(data: {
  amount: number;
  type: string;
  category?: string;
  account?: string;
  description?: string;
  date?: string;
}) {
  try {
    const v = validate(CreatePersonalTransactionSchema, data);
    if (!v.success) return { success: false, error: v.error };

    const userId = await getCurrentUserId();
    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();

    await db.insert(personalTransactions).values({
      id: randomUUID(),
      userId,
      amount: data.amount,
      type: data.type,
      category: data.category || 'Otros',
      account: data.account || 'Efectivo',
      description: data.description || null,
      date: data.date || todayStr,
      createdAt: now,
    });

    // Muro de Fuego: si es ingreso por Retiro del Negocio, sincronizar business
    if (data.type === 'ingreso' && data.category === 'Retiro del Negocio') {
      await db.insert(businessTransactions).values({
        id: randomUUID(),
        userId,
        amount: data.amount,
        cost: 0,
        type: 'gasto',
        description: 'Retiro a Cuenta Personal',
        source: 'General',
        isSale: 0,
        date: data.date || todayStr,
        dailyEntryId: null,
        createdAt: now,
      });

      revalidatePath('/negocio');
      revalidatePath('/');
    }

    revalidatePath('/finanzas');
    return { success: true };
  } catch (error) {
    logger.error('personal_create_transaction_failed', {}, error);
    return { success: false, error: 'Failed to create' };
  }
}

export async function updatePersonalTransaction(
  id: string,
  data: {
    amount?: number;
    type?: string;
    category?: string;
    account?: string;
    description?: string;
    date?: string;
  },
) {
  try {
    const v = validate(UpdatePersonalTransactionSchema, { id, ...data });
    if (!v.success) return { success: false, error: v.error };

    const updateData: Record<string, any> = {};
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.account !== undefined) updateData.account = data.account;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.date !== undefined) updateData.date = data.date;

    const userId = await requireCurrentUserId();
    const result = await db.update(personalTransactions)
      .set(updateData)
      .where(and(eq(personalTransactions.id, id), eq(personalTransactions.userId, userId)))
      .returning({ id: personalTransactions.id });

    if (result.length === 0) {
      return { success: false, error: 'Transacción no encontrada o sin permisos' };
    }

    revalidatePath('/finanzas');
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function deletePersonalTransaction(id: string) {
  try {
    const v = validate(DeletePersonalTransactionSchema, { id });
    if (!v.success) return { success: false, error: v.error };

    const userId = await requireCurrentUserId();
    const result = await db.delete(personalTransactions)
      .where(and(eq(personalTransactions.id, id), eq(personalTransactions.userId, userId)))
      .returning({ id: personalTransactions.id });

    if (result.length === 0) {
      return { success: false, error: 'Transacción no encontrada o sin permisos' };
    }

    revalidatePath('/finanzas');
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function getPersonalMetricsRange(startDate: string, endDate: string) {
  try {
    const userId = await getCurrentUserId();

    const txns = await db.query.personalTransactions.findMany({
      where: and(
        eq(personalTransactions.userId, userId),
        gte(personalTransactions.date, startDate),
        lte(personalTransactions.date, endDate),
      ),
    });

    const totalIncome = txns
      .filter((t) => t.type === 'ingreso')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = txns
      .filter((t) => t.type === 'gasto')
      .reduce((sum, t) => sum + t.amount, 0);

    const liquidity = totalIncome - totalExpenses;

    const savingsRate = totalIncome > 0
      ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100 * 100) / 100
      : 0;

    const categoryBreakdown = txns
      .filter((t) => t.type === 'gasto')
      .reduce((acc: Record<string, number>, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {});

    return {
      success: true,
      totalIncome,
      totalExpenses,
      liquidity,
      savingsRate,
      categoryBreakdown,
      transactions: txns,
    };
  } catch (error) {
    logger.error('personal_metrics_failed', {}, error);
    return { success: false, error: 'Failed to get metrics' };
  }
}

export async function withdrawToPersonal(amount: number, date?: string) {
  try {
    const v = validate(WithdrawToPersonalSchema, { amount, date });
    if (!v.success) return { success: false, error: v.error };

    const userId = await getCurrentUserId();
    const todayStr = date || new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();

    await db.insert(businessTransactions).values({
      id: randomUUID(),
      userId,
      amount,
      cost: 0,
      type: 'gasto',
      description: 'Retiro de Socios/Sueldo',
      source: 'General',
      isSale: 0,
      date: todayStr,
      dailyEntryId: null,
      createdAt: now,
    });

    await db.insert(personalTransactions).values({
      id: randomUUID(),
      userId,
      amount,
      type: 'ingreso',
      category: 'Retiro Negocio',
      account: 'Banco',
      description: 'Retiro desde negocio',
      date: todayStr,
      createdAt: now,
    });

    revalidatePath('/negocio');
    revalidatePath('/finanzas');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    logger.error('personal_withdraw_failed', {}, error);
    return { success: false, error: 'Failed to withdraw' };
  }
}
