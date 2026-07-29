import { requireCurrentUserId, updateUserLevel } from '@/app/actions/auth';

export async function POST(req: Request) {
  try {
    const userId = await requireCurrentUserId();
    const { level } = await req.json();
    const result = await updateUserLevel(level, userId);
    return Response.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}
