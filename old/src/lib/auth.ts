import NextAuth, { DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./db";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      paid: boolean;
      points: number;
    } & DefaultSession["user"]
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [Google],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        const dbUser = user as any;
        session.user.role = dbUser.role || "USER";
        session.user.paid = dbUser.paid || false;
        session.user.points = dbUser.points || 0;
      }
      return session;
    }
  },
  events: {
    async createUser({ user }) {
      if (user.email === 'angelincrm@gmail.com') {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: 'ADMIN' }
        });
      }
    }
  }
});

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;

  return prisma.user.findUnique({
    where: { id: session.user.id },
    include: { championTeam: true },
  });
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    throw new Error("ADMIN_REQUIRED");
  }
  return user;
}
