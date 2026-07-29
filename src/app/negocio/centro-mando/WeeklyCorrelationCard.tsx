'use client';

import { WeeklyCorrelation } from '@/components/business/WeeklyCorrelation';

interface DayCell {
  date: string;
  label: string;
  mitCompleted: boolean;
  cashCollected: number;
}

interface WeeklyCorrelationCardProps {
  data: DayCell[];
}

export function WeeklyCorrelationCard({ data }: WeeklyCorrelationCardProps) {
  return <WeeklyCorrelation data={data} />;
}
