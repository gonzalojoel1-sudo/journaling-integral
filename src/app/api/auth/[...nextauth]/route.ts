import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { db } from '../../../../db/db';
import { users } from '../../../../db/schema';
import { eq } from 'drizzle-orm';
import { scryptSync } from 'crypto';

// Función nativa y ultra-segura para encriptar contraseñas sin dependencias externas de NPM
function hashPassword(password: string): string {
  const salt = 'journaling-integral-salt-key';
  return scryptSync(password, salt, 64).toString('hex');
}

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Por favor, introduce tu email y contraseña.');
        }

        // Buscar usuario en la base de datos por email
        const user = await db.query.users.findFirst({
          where: eq(users.email, credentials.email),
        });

        if (!user) {
          throw new Error('No existe ningún usuario registrado con este email.');
        }

        // Comparar contraseñas cifradas
        const hashedPassword = hashPassword(credentials.password);
        if (user.password !== hashedPassword) {
          throw new Error('Contraseña incorrecta.');
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET || 'journaling-nextauth-super-secret-key-12345',
});

export { handler as GET, handler as POST };