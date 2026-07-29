'use client';

import {
  UnitPerformanceBreakdown,
  type UnitPerformance,
} from '@/components/business/UnitPerformanceBreakdown';

export type { UnitPerformance };

interface UnitPerformanceTableProps {
  data: UnitPerformance[];
  periodLabel: string;
}

export function UnitPerformanceTable({ data, periodLabel }: UnitPerformanceTableProps) {
  return <UnitPerformanceBreakdown data={data} periodLabel={periodLabel} />;
}
