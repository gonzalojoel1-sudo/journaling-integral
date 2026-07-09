export { default } from 'next-auth/middleware';

// Rutas protegidas que requieren inicio de sesión obligatorio
export const config = {
  matcher: [
    '/',
    '/journal',
    '/history',
    '/quarterly',
    '/habits',
    '/progress',
    '/review'
  ]
};