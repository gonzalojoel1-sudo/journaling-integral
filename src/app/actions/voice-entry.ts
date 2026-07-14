'use server';

import { submitDailyEntry } from './daily-journal';

export async function submitVoiceEntry(data: Record<string, any>) {
  try {
    const result = await submitDailyEntry(data);
    return result;
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al guardar entrada de voz.' };
  }
}
