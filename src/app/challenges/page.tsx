import React from 'react';
import { getAllChallenges, getBadges } from '../actions/challenges';
import { CHALLENGE_TEMPLATES } from '@/lib/challenge-templates';
import { ChallengesClient } from './ChallengesClient';

export const dynamic = 'force-dynamic';

export default async function ChallengesPage() {
  const challengesRes = await getAllChallenges();
  const badgesRes = await getBadges();

  const userChallenges = challengesRes.challenges || [];
  const userBadges = badgesRes.badges || [];
  const badgeIds = new Set(userBadges.map((b: any) => b.badgeId));

  const templatesForClient = CHALLENGE_TEMPLATES.map(({ check, ...rest }) => rest);

  return (
    <div className="space-y-6">
      <header className="border-b border-stone-200 dark:border-stone-800 pb-4">
        <h1 className="text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
          Desafios de Transformacion
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          Activa desafios, acumula insignias y sube de nivel. Tu progreso se valida automaticamente al completar tu journal diario.
        </p>
      </header>

      <ChallengesClient
        templates={templatesForClient}
        userChallenges={userChallenges}
        badgeIds={badgeIds}
      />
    </div>
  );
}
