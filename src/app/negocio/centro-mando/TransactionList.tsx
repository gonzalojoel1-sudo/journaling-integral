'use client';

import { TransactionLedger } from '@/components/business/TransactionLedger';
import type { TransactionSummary } from './useDashboardData';

interface TransactionListProps {
  transactions: TransactionSummary[];
}

export function TransactionList({ transactions }: TransactionListProps) {
  return <TransactionLedger transactions={transactions} />;
}
