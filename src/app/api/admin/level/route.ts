import { updateUserLevel } from '@/app/actions/auth';

export async function POST(req: Request) {
  const { level } = await req.json();
  const result = await updateUserLevel(level);
  return Response.json(result);
}
