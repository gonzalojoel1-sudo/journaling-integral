import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default withAuth(
  function middleware(req: NextRequest) {
    const response = NextResponse.next();
    response.headers.set('x-pathname', req.nextUrl.pathname);
    return response;
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  },
);

export const config = {
  matcher: [
    '/',
    '/journal',
    '/history',
    '/quarterly',
    '/habits',
    '/challenges',
    '/negocio',
    '/finanzas',
    '/configuracion',
    '/progress',
    '/review',
    '/onboarding',
  ],
};
