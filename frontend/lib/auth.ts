import "server-only";
import "./env/load";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "./db";
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
} from "@/lib/emails/service";
import {
  buildAccountLinkingConfig,
  buildSocialProviders,
} from "@/lib/auth/social-providers";

function sanitizeRole(role: unknown): "BUYER" | "SELLER" {
  return role === "SELLER" ? "SELLER" : "BUYER";
}

if (!process.env.MONGODB_URI) {
  console.error(
    "[auth] MONGODB_URI is missing. Check .env and ensure .env.local does not override it with an empty value."
  );
}

function extraTrustedOrigins(): string[] {
  const origins: string[] = [];
  for (const raw of [
    process.env.VERCEL_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
  ]) {
    if (!raw) continue;
    const host = raw.replace(/^https?:\/\//, "");
    origins.push(`https://${host}`);
  }
  return origins;
}

const socialProviders = buildSocialProviders();
const accountLinking = buildAccountLinkingConfig();

export const auth = betterAuth({
  appName: process.env.APP_NAME || "Rollnexa",
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, {
    provider: "mongodb",
  }),
  experimental: {
    // The Prisma adapter otherwise falls back to a join path that doesn't
    // correctly map this project's MongoDB User.accounts relation.
    joins: true,
  },
  ...(Object.keys(socialProviders).length > 0 ? { socialProviders } : {}),
  ...(accountLinking ? { account: { accountLinking } } : {}),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordResetEmail({ userId: user.id, resetUrl: url });
    },
  },
  trustedOrigins: [
    process.env.BETTER_AUTH_URL,
    process.env.APP_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    ...extraTrustedOrigins(),
  ].filter(Boolean) as string[],
  onAPIError: {
    errorURL: "/login",
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail({ userId: user.id, verificationUrl: url });
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
  advanced: {
    database: {
      // Prisma MongoDB schema uses @default(auto()) ObjectIds — let the DB generate them.
      generateId: false,
    },
    useSecureCookies: (process.env.BETTER_AUTH_URL || "").startsWith("https://"),
    defaultCookieAttributes: {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    },
  },
  plugins: [nextCookies()],
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "BUYER",
        input: true,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const raw = user as typeof user & { role?: string | null };
          const incomingRole = raw.role;
          // Email/password registration may choose BUYER|SELLER; default BUYER.
          const nextRole =
            incomingRole === undefined || incomingRole === null || incomingRole === ""
              ? "BUYER"
              : sanitizeRole(incomingRole);

          return {
            data: {
              ...raw,
              role: nextRole,
            },
          };
        },
        after: async (user) => {
          try {
            await prisma.profile.create({
              data: { userId: user.id },
            });
          } catch (error) {
            console.error("[auth] Failed to create profile for user", user.id, error);
          }

          try {
            await sendWelcomeEmail({ userId: user.id });
          } catch (error) {
            console.error("[auth] Welcome email failed for user", user.id, error);
          }
        },
      },
    },
    session: {
      create: {
        after: async (session) => {
          try {
            await prisma.user.update({
              where: { id: session.userId },
              data: { lastLoginAt: new Date() },
            });
          } catch (error) {
            console.error("[auth] Failed to update lastLoginAt for user", session.userId, error);
          }
        },
      },
    },
  },
});

export type SessionUser = typeof auth.$Infer.Session.user;
