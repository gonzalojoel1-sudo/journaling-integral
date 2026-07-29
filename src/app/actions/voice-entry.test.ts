import { describe, it, expect, vi, beforeEach } from 'vitest';

const submitDailyEntryMock = vi.fn();
vi.mock('./daily-journal', () => ({
  submitDailyEntry: (...args: unknown[]) => submitDailyEntryMock(...args),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('submitVoiceEntry', () => {
  it('forwards data to submitDailyEntry and returns its success result', async () => {
    const { submitVoiceEntry } = await import('./voice-entry');
    const payload = { foo: 'bar' };
    submitDailyEntryMock.mockResolvedValue({ success: true, entryId: 'e-1' });

    const result = await submitVoiceEntry(payload);

    expect(submitDailyEntryMock).toHaveBeenCalledWith(payload);
    expect(result).toEqual({ success: true, entryId: 'e-1' });
  });

  it('returns the failure shape when submitDailyEntry throws', async () => {
    const { submitVoiceEntry } = await import('./voice-entry');
    submitDailyEntryMock.mockRejectedValue(new Error('upstream broken'));

    const result = await submitVoiceEntry({});

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('upstream broken');
    }
  });

  it('falls back to a default message when the thrown error has no message', async () => {
    const { submitVoiceEntry } = await import('./voice-entry');
    submitDailyEntryMock.mockRejectedValue({});

    const result = await submitVoiceEntry({});

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/entrada de voz|voz/i);
    }
  });
});