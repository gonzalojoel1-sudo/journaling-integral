import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { joinCircle } from '@/app/actions/circles';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  if (!code) return NextResponse.redirect(new URL('/challenges', req.url));

  const res = await joinCircle(code);
  if (res.success) {
    return NextResponse.redirect(new URL('/', req.url));
  }
  return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(res.error || 'Error')}`, req.url));
}
