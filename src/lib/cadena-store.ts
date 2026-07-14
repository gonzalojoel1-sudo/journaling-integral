import { db } from '@/db/db';
import { chains, chainItems } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function getChainWithSteps(chainId: string) {
  const chain = await db.query.chains.findFirst({
    where: eq(chains.id, chainId),
  });
  if (!chain) return null;

  const items = await db.query.chainItems.findMany({
    where: eq(chainItems.chainId, chainId),
    orderBy: (items, { asc }) => [asc(items.order)],
  });

  return {
    ...chain,
    steps: items.map(item => ({ id: item.id, name: item.name || '', order: item.order })),
  };
}
