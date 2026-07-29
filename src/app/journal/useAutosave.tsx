'use client';

import { useEffect, useRef, useState } from 'react';
import { logger } from '@/lib/logger';

interface UseAutosaveOptions<T> {
  data: T;
  onSave: (data: T) => Promise<void>;
  delay?: number;
  enabled?: boolean;
}

interface UseAutosaveReturn {
  isSaving: boolean;
  lastSaved: Date | null;
  hasChanges: boolean;
}

export function useAutosave<T>({
  data,
  onSave,
  delay = 2000,
  enabled = true,
}: UseAutosaveOptions<T>): UseAutosaveReturn {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  
  const previousDataRef = useRef<T>(data);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      previousDataRef.current = data;
      return;
    }

    const dataChanged = JSON.stringify(data) !== JSON.stringify(previousDataRef.current);
    
    if (!dataChanged) {
      setHasChanges(false);
      return;
    }

    setHasChanges(true);

    if (!enabled) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      setIsSaving(true);
      try {
        await onSave(data);
        setLastSaved(new Date());
        previousDataRef.current = data;
        setHasChanges(false);
      } catch (error) {
        logger.error('autosave_failed', {}, error);
      } finally {
        setIsSaving(false);
      }
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, onSave, delay, enabled]);

  return { isSaving, lastSaved, hasChanges };
}
