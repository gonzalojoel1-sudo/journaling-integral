'use server';

import { db } from '@/db/db';
import { userSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getCurrentUserId } from './auth';
import { logger } from '@/lib/logger';
import {
  validate,
  UpdateUserSettingSchema,
  CompleteOnboardingSchema,
} from '@/lib/validations';

const defaultSettings = {
  showBusinessPanel: false,
  showFinancePanel: false,
  showHabitsPanel: false,
  showQuarterlyPanel: false,
  showChallengesPanel: false,
  aiAssistantEnabled: true,
  onboardingCompleted: false,
};

export async function getUserSettings() {
  try {
    const userId = await getCurrentUserId();
    const settings = await db.query.userSettings.findFirst({
      where: eq(userSettings.userId, userId),
    });

    if (!settings) {
      await db.insert(userSettings).values({
        userId,
        showBusinessPanel: 0,
        showFinancePanel: 0,
        showHabitsPanel: 0,
        showQuarterlyPanel: 0,
        showChallengesPanel: 0,
        aiAssistantEnabled: 1,
        onboardingCompleted: 0,
      });
      return defaultSettings;
    }

    return {
      showBusinessPanel: settings.showBusinessPanel === 1,
      showFinancePanel: settings.showFinancePanel === 1,
      showHabitsPanel: (settings.showHabitsPanel ?? 0) === 1,
      showQuarterlyPanel: (settings.showQuarterlyPanel ?? 0) === 1,
      showChallengesPanel: (settings.showChallengesPanel ?? 0) === 1,
      aiAssistantEnabled: (settings.aiAssistantEnabled ?? 1) === 1,
      onboardingCompleted: settings.onboardingCompleted === 1,
    };
  } catch (error) {
    logger.error('get_user_settings_failed', {}, error);
    return defaultSettings;
  }
}

export async function updateUserSetting(field: string, value: boolean) {
  try {
    const v = validate(UpdateUserSettingSchema, { field, value });
    if (!v.success) return { success: false, error: v.error };

    const userId = await getCurrentUserId();

    const existing = await db.query.userSettings.findFirst({
      where: eq(userSettings.userId, userId),
    });

    const updateData: Record<string, number> = {};
    updateData[field] = value ? 1 : 0;

    if (existing) {
      await db.update(userSettings)
        .set(updateData)
        .where(eq(userSettings.userId, userId));
    } else {
      await db.insert(userSettings).values({
        userId,
        showBusinessPanel: 0,
        showFinancePanel: 0,
        showHabitsPanel: 0,
        showQuarterlyPanel: 0,
        showChallengesPanel: 0,
        aiAssistantEnabled: 1,
        onboardingCompleted: 0,
        ...updateData,
      });
    }

    revalidatePath('/configuracion');
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error) {
    logger.error('update_user_setting_failed', { field }, error);
    return { success: false, error: 'Error al actualizar configuración' };
  }
}

export async function completeOnboarding(prefs: {
  showBusinessPanel: boolean;
  showFinancePanel: boolean;
  showHabitsPanel: boolean;
  showQuarterlyPanel: boolean;
  showChallengesPanel: boolean;
}) {
  try {
    const v = validate(CompleteOnboardingSchema, prefs);
    if (!v.success) return { success: false, error: v.error };

    const userId = await getCurrentUserId();

    const existing = await db.query.userSettings.findFirst({
      where: eq(userSettings.userId, userId),
    });

    const data = {
      userId,
      showBusinessPanel: prefs.showBusinessPanel ? 1 : 0,
      showFinancePanel: prefs.showFinancePanel ? 1 : 0,
      showHabitsPanel: prefs.showHabitsPanel ? 1 : 0,
      showQuarterlyPanel: prefs.showQuarterlyPanel ? 1 : 0,
      showChallengesPanel: prefs.showChallengesPanel ? 1 : 0,
      onboardingCompleted: 1,
    };

    if (existing) {
      await db.update(userSettings)
        .set(data)
        .where(eq(userSettings.userId, userId));
    } else {
      await db.insert(userSettings).values(data);
    }

    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error) {
    logger.error('complete_onboarding_failed', {}, error);
    return { success: false, error: 'Error al completar el onboarding' };
  }
}