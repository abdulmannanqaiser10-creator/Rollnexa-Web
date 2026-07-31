import { randomUUID } from "node:crypto";
import { hashPassword } from "@better-auth/utils/password";
import type { PrismaClient } from "../../app/generated/prisma/client";

export type SeedDevAdminInput = {
  prisma: PrismaClient;
  name: string;
  email: string;
  password: string;
};

export async function seedDevAdmin({
  prisma,
  name,
  email,
  password,
}: SeedDevAdminInput) {
  const normalizedEmail = email.trim().toLowerCase();
  const hashed = await hashPassword(password);

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: {
      accounts: {
        where: { providerId: "credential" },
        take: 1,
      },
    },
  });

  if (!existing) {
    const userId = randomUUID();
    const user = await prisma.user.create({
      data: {
        id: userId,
        name,
        email: normalizedEmail,
        emailVerified: false,
        role: "ADMIN",
        accountStatus: "ACTIVE",
        accounts: {
          create: {
            providerId: "credential",
            accountId: userId,
            password: hashed,
          },
        },
        profile: {
          create: {},
        },
      },
      select: { id: true, email: true, role: true },
    });

    return user;
  }

  const credential = existing.accounts[0];
  if (credential) {
    await prisma.account.update({
      where: { id: credential.id },
      data: { password: hashed },
    });
  } else {
    await prisma.account.create({
      data: {
        userId: existing.id,
        providerId: "credential",
        accountId: existing.id,
        password: hashed,
      },
    });
  }

  const user = await prisma.user.update({
    where: { id: existing.id },
    data: {
      name,
      role: "ADMIN",
      accountStatus: "ACTIVE",
    },
    select: { id: true, email: true, role: true },
  });

  await prisma.profile.upsert({
    where: { userId: user.id },
    create: { userId: user.id },
    update: {},
  });

  return user;
}
