'use client';

import React from 'react';

export function NavSkeleton() {
  return (
    <div className="p-4 border-t border-stone-200 dark:border-stone-850 bg-stone-100/60 dark:bg-stone-950/30">
      <div className="animate-pulse space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-stone-200 dark:bg-stone-800" />
          <div className="space-y-1.5 flex-1">
            <div className="h-3 w-20 bg-stone-200 dark:bg-stone-800 rounded" />
            <div className="h-2 w-14 bg-stone-200 dark:bg-stone-800 rounded" />
          </div>
        </div>
        <div className="h-8 w-full bg-stone-200 dark:bg-stone-800 rounded-xl" />
      </div>
    </div>
  );
}
