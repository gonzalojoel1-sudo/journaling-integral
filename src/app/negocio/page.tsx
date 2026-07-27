import React from 'react';
import { db } from '@/db/db';
import { dailyEntries, businessTransactions } from '@/db/schema';
import { getBusinessSettingsList } from '../actions/business';
import { getCurrentUserId } from '../actions/auth';
import { eq } from 'drizzle-orm';
import { CentroMandoDashboard } from './CentroMandoDashboard';

export const dynamic = 'force-dynamic';

export default async function NegocioPage() {
  const userId = await getCurrentUserId();
  const settingsList = await getBusinessSettingsList();

  const allEntries = await db.query.dailyEntries.findMany({
    where: eq(dailyEntries.userId, userId),
    columns: {
      id: true,
      date: true,
      bizContactsCount: true,
      bizIncome: true,
      bizProspectCompleted: true,
      bizFollowUpCompleted: true,
      bizMktActionCompleted: true,
    },
  });

  const allTransactions = await db.query.businessTransactions.findMany({
    where: eq(businessTransactions.userId, userId),
  });

  return (
    <CentroMandoDashboard
      transactions={allTransactions}
      entries={allEntries}
      settingsList={settingsList}
    />
  );
}
