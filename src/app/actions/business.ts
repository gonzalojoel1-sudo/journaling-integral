'use server';

import { db } from '@/db/db';
import { dailyEntries, businessTransactions, businessSettings } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { getCurrentUserId, requireCurrentUserId } from './auth';
import {
  validate,
  AutoSaveBizFieldSchema,
  AutoSyncSalesSchema,
  UpsertBusinessSettingSchema,
  DeleteBusinessSettingSchema,
  UpdateBusinessTransactionSchema,
  DeleteBusinessTransactionSchema,
  CreateBusinessTransactionSchema,
  RegisterSaleSchema,
  type AllowedBizField,
} from '@/lib/validations';
import { logger } from '@/lib/logger';
import { todayStr } from '@/lib/dates';

export async function autoSaveBizField(field: string, value: string | number, date: string) {
  try {
    const v = validate(AutoSaveBizFieldSchema, { field, value, date });
    if (!v.success) return { success: false, error: v.error };

    const userId = await getCurrentUserId();

    const existing = await db.query.dailyEntries.findFirst({
      where: and(eq(dailyEntries.userId, userId), eq(dailyEntries.date, date)),
    });

    if (!existing) {
      const entryId = randomUUID();
      const now = new Date().toISOString();
      const timeStr = new Date().toTimeString().split(' ')[0].substring(0, 5);

      await db.insert(dailyEntries).values({
        id: entryId,
        userId,
        date,
        time: timeStr,
        levelAtEntry: 1,
        createdAt: now,
        ...(field === 'bizProspectCompleted' ? { bizProspectCompleted: value as number } : {}),
        ...(field === 'bizFollowUpCompleted' ? { bizFollowUpCompleted: value as number } : {}),
        ...(field === 'bizMktActionCompleted' ? { bizMktActionCompleted: value as number } : {}),
        ...(field === 'bizContactsCount' ? { bizContactsCount: value as number } : {}),
        ...(field === 'bizSalesCount' ? { bizSalesCount: value as number } : {}),
        ...(field === 'bizIncome' ? { bizIncome: value as number } : {}),
        ...(field === 'bizExpenses' ? { bizExpenses: value as number } : {}),
        ...(field === 'bizActionsSpecific' ? { bizActionsSpecific: value as string } : {}),
      });

      revalidatePath('/');
      revalidatePath('/negocio');
      return { success: true, created: true, entryId };
    }

    const updateData: Record<string, unknown> = {};
    const allowedField = v.data.field as AllowedBizField;
    updateData[allowedField] = v.data.value;

    await db.update(dailyEntries)
      .set(updateData as Partial<typeof dailyEntries.$inferInsert>)
      .where(eq(dailyEntries.id, existing.id));

    revalidatePath('/');
    revalidatePath('/negocio');
    return { success: true, entryId: existing.id };
  } catch (error) {
    logger.error('auto_save_error', {}, error);
    return { success: false, error: 'Failed to save' };
  }
}

export async function autoSyncSalesWithTransaction(date: string) {
  try {
    const v = validate(AutoSyncSalesSchema, { date });
    if (!v.success) return { success: false, error: v.error };

    const userId = await getCurrentUserId();

    const entry = await db.query.dailyEntries.findFirst({
      where: and(eq(dailyEntries.userId, userId), eq(dailyEntries.date, date)),
    });

    if (!entry) return { success: false, error: 'No entry found' };

    const salesCount = entry.bizSalesCount;

    const activeSettings = await db.query.businessSettings.findFirst({
      where: and(
        eq(businessSettings.userId, userId),
        eq(businessSettings.isActive, 1),
      ),
    });

    const defaultAmount = activeSettings?.defaultSaleAmount ?? 0;
    const defaultCost = activeSettings?.defaultSaleCost ?? 0;

    const existingAutoSales = await db.query.businessTransactions.findMany({
      where: and(
        eq(businessTransactions.userId, userId),
        eq(businessTransactions.date, date),
        eq(businessTransactions.dailyEntryId, entry.id),
        eq(businessTransactions.isSale, 1),
      ),
    });

    const currentAutoCount = existingAutoSales.length;

    if (salesCount > currentAutoCount && defaultAmount > 0) {
      const toCreate = salesCount - currentAutoCount;
      for (let i = 0; i < toCreate; i++) {
        await db.insert(businessTransactions).values({
          id: randomUUID(),
          userId,
          amount: defaultAmount,
          cost: defaultCost,
          type: 'ingreso',
          description: `Venta automática #${currentAutoCount + i + 1}`,
          source: activeSettings?.name || 'General',
          isSale: 1,
          date,
          dailyEntryId: entry.id,
          createdAt: new Date().toISOString(),
        });
      }
    } else if (salesCount < currentAutoCount) {
      const toRemove = existingAutoSales.slice(salesCount);
      for (const tx of toRemove) {
        await db.delete(businessTransactions).where(eq(businessTransactions.id, tx.id));
      }
    }

    revalidatePath('/');
    revalidatePath('/negocio');
    return { success: true };
  } catch (error) {
    logger.error('auto_sync_error', {}, error);
    return { success: false, error: 'Failed to sync' };
  }
}

export async function getActiveBusinessSettings() {
  try {
    const userId = await getCurrentUserId();
    const settings = await db.query.businessSettings.findMany({
      where: and(
        eq(businessSettings.userId, userId),
        eq(businessSettings.isActive, 1),
      ),
    });
    return settings.length > 0 ? settings[0] : null;
  } catch {
    return null;
  }
}

export async function getBusinessSettingsList() {
  try {
    const userId = await getCurrentUserId();
    return await db.query.businessSettings.findMany({
      where: eq(businessSettings.userId, userId),
    });
  } catch {
    return [];
  }
}

export async function upsertBusinessSetting(data: {
  id?: string;
  name: string;
  defaultSaleAmount?: number;
  defaultSaleCost?: number;
  isActive?: boolean;
  category?: string;
  monthlyGoal?: number;
  isRecurring?: number;
}) {
  try {
    const v = validate(UpsertBusinessSettingSchema, data);
    if (!v.success) {
      logger.error('settings_validation_failed', {}, v.error);
      return { success: false, error: v.error };
    }

    const userId = await getCurrentUserId();
    logger.info('settings_upsert_started');

    const insertResult = await db.insert(businessSettings).values({
      id: data.id || randomUUID(),
      userId,
      name: data.name,
      defaultSaleAmount: data.defaultSaleAmount ?? 0,
      defaultSaleCost: data.defaultSaleCost ?? 0,
      isActive: data.isActive ? 1 : 0,
      category: data.category ?? 'Servicio',
      monthlyGoal: data.monthlyGoal ?? 0,
      isRecurring: data.isRecurring ? 1 : 0,
      createdAt: new Date().toISOString(),
    }).onConflictDoUpdate({
      target: businessSettings.id,
      set: {
        name: data.name,
        defaultSaleAmount: data.defaultSaleAmount ?? 0,
        defaultSaleCost: data.defaultSaleCost ?? 0,
        isActive: data.isActive ? 1 : 0,
        category: data.category ?? 'Servicio',
        monthlyGoal: data.monthlyGoal ?? 0,
        isRecurring: data.isRecurring ? 1 : 0,
      },
    });

    logger.debug('settings_insert_result', { meta: insertResult });
    revalidatePath('/negocio');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    logger.error('settings_upsert_error', {}, error);
    return { success: false, error: String(error) };
  }
}

export async function deleteBusinessSetting(id: string) {
  try {
    const v = validate(DeleteBusinessSettingSchema, { id });
    if (!v.success) return { success: false, error: v.error };

    const userId = await requireCurrentUserId();
    const result = await db.delete(businessSettings)
      .where(and(eq(businessSettings.id, id), eq(businessSettings.userId, userId)))
      .returning({ id: businessSettings.id });

    if (result.length === 0) {
      return { success: false, error: 'Configuración no encontrada o sin permisos' };
    }

    revalidatePath('/negocio');
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function updateBusinessTransaction(
  id: string,
  data: {
    amount?: number;
    cost?: number;
    type?: string;
    description?: string;
    source?: string;
    isSale?: boolean;
    date?: string;
  },
) {
  try {
    const v = validate(UpdateBusinessTransactionSchema, { id, ...data });
    if (!v.success) return { success: false, error: v.error };

    const updateData: Record<string, any> = {};
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.cost !== undefined) updateData.cost = data.cost;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.source !== undefined) updateData.source = data.source;
    if (data.isSale !== undefined) updateData.isSale = data.isSale ? 1 : 0;
    if (data.date !== undefined) updateData.date = data.date;

    if (Object.keys(updateData).length === 0) {
      return { success: false, error: 'No fields to update' };
    }

    const userId = await requireCurrentUserId();
    const result = await db.update(businessTransactions)
      .set(updateData)
      .where(and(eq(businessTransactions.id, id), eq(businessTransactions.userId, userId)))
      .returning({ id: businessTransactions.id });

    if (result.length === 0) {
      return { success: false, error: 'Transacción no encontrada o sin permisos' };
    }

    revalidatePath('/negocio');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    logger.error('tx_edit_error', {}, error);
    return { success: false, error: 'Failed to update transaction' };
  }
}

export async function registerSale(settingsId: string, date: string) {
  try {
    const v = validate(RegisterSaleSchema, { settingsId, date });
    if (!v.success) return { success: false, error: v.error };

    const userId = await getCurrentUserId();

    const unit = await db.query.businessSettings.findFirst({
      where: and(
        eq(businessSettings.id, settingsId),
        eq(businessSettings.userId, userId),
      ),
    });

    if (!unit) return { success: false, error: 'Unidad de negocio no encontrada' };

    const { name: sourceName, defaultSaleAmount, defaultSaleCost } = unit;

    // Fila 1: Ingreso
    await db.insert(businessTransactions).values({
      id: randomUUID(),
      userId,
      amount: defaultSaleAmount,
      cost: 0,
      type: 'ingreso',
      description: `Venta - ${sourceName}`,
      source: sourceName,
      isSale: 1,
      date,
      dailyEntryId: null,
      createdAt: new Date().toISOString(),
    });

    // Fila 2: Costo (gasto)
    if (defaultSaleCost > 0) {
      await db.insert(businessTransactions).values({
        id: randomUUID(),
        userId,
        amount: defaultSaleCost,
        cost: 0,
        type: 'gasto',
        description: `Costo fijo de venta - ${sourceName}`,
        source: sourceName,
        isSale: 0,
        date,
        dailyEntryId: null,
        createdAt: new Date().toISOString(),
      });
    }

    // Incrementar contador de ventas
    const existing = await db.query.dailyEntries.findFirst({
      where: and(eq(dailyEntries.userId, userId), eq(dailyEntries.date, date)),
    });

    if (existing) {
      await db.update(dailyEntries)
        .set({ bizSalesCount: existing.bizSalesCount + 1 })
        .where(eq(dailyEntries.id, existing.id));
    } else {
      const now = new Date().toISOString();
      const timeStr = new Date().toTimeString().split(' ')[0].substring(0, 5);
      await db.insert(dailyEntries).values({
        id: randomUUID(),
        userId,
        date,
        time: timeStr,
        levelAtEntry: 1,
        bizSalesCount: 1,
        createdAt: now,
      });
    }

    revalidatePath('/');
    revalidatePath('/negocio');
    return { success: true };
  } catch (error) {
    logger.error('register_sale_error', {}, error);
    return { success: false, error: 'Failed to register sale' };
  }
}

export async function deleteBusinessTransaction(id: string) {
  try {
    const v = validate(DeleteBusinessTransactionSchema, { id });
    if (!v.success) return { success: false, error: v.error };

    const userId = await requireCurrentUserId();
    const result = await db.delete(businessTransactions)
      .where(and(eq(businessTransactions.id, id), eq(businessTransactions.userId, userId)))
      .returning({ id: businessTransactions.id });

    if (result.length === 0) {
      return { success: false, error: 'Transacción no encontrada o sin permisos' };
    }

    revalidatePath('/negocio');
    revalidatePath('/');
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function createBusinessTransaction(data: {
  amount: number;
  cost?: number;
  type: string;
  description?: string;
  source?: string;
  isSale?: boolean;
  date?: string;
}) {
  try {
    const v = validate(CreateBusinessTransactionSchema, data);
    if (!v.success) return { success: false, error: v.error };

    const userId = await getCurrentUserId();
    const todayDateStr = todayStr();

    await db.insert(businessTransactions).values({
      id: randomUUID(),
      userId,
      amount: data.amount,
      cost: data.cost ?? 0,
      type: data.type,
      description: data.description || null,
      source: data.source || 'General',
      isSale: data.isSale ? 1 : 0,
      date: data.date || todayDateStr,
      dailyEntryId: null,
      createdAt: new Date().toISOString(),
    });

    revalidatePath('/negocio');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    logger.error('create_transaction_error', {}, error);
    return { success: false, error: 'No se pudo crear la transacción.' };
  }
}
