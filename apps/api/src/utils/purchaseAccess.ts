import { Prisma, PrismaClient } from '@prisma/client';

export const COMPLETED_PURCHASE_STATUSES = [
  'COMPLETED',
  'completed',
  'SUCCESS',
  'success',
  'PAID',
  'paid',
];

export interface IdentityInput {
  id?: string;
  email?: string;
}

/**
 * Resolves the canonical user ID and normalized email for an authenticated request,
 * and ensures any purchases tied to the same email (case-insensitive) are synced to `userId`.
 */
export async function resolveUserIdentity(
  prisma: PrismaClient,
  identity?: IdentityInput | null
): Promise<{ userId?: string; email?: string }> {
  const rawUserId = identity?.id;
  const rawEmail = identity?.email?.trim().toLowerCase();

  let dbUser = rawUserId
    ? await prisma.user.findUnique({ where: { id: rawUserId } })
    : null;

  if (!dbUser && rawEmail) {
    dbUser = await prisma.user.findFirst({
      where: { email: { equals: rawEmail, mode: 'insensitive' } },
    });
  }

  const userId = dbUser?.id || rawUserId;
  const email = dbUser?.email || rawEmail;

  if (userId && email) {
    await prisma.purchase.updateMany({
      where: {
        user: { email: { equals: email, mode: 'insensitive' } },
        userId: { not: userId },
      },
      data: { userId },
    });
  }

  return { userId, email };
}

/**
 * Builds a Prisma where clause matching completed purchases for a user by ID or email.
 */
export function buildCompletedPurchaseWhere(
  userId?: string,
  email?: string,
  bookId?: string
): Prisma.PurchaseWhereInput {
  const ownerClauses: Prisma.PurchaseWhereInput[] = [];
  if (userId) {
    ownerClauses.push({ userId });
  }
  if (email) {
    ownerClauses.push({
      user: { email: { equals: email, mode: 'insensitive' } },
    });
  }

  return {
    ...(bookId ? { bookId } : {}),
    status: { in: COMPLETED_PURCHASE_STATUSES },
    ...(ownerClauses.length > 0 ? { OR: ownerClauses } : {}),
  };
}

/**
 * Checks whether the given user owns a completed purchase for `bookId`
 * (matching either `userId` or case-insensitive `email`).
 */
export async function hasCompletedPurchase(
  prisma: PrismaClient,
  identity: IdentityInput | undefined,
  bookId: string
): Promise<boolean> {
  const { userId, email } = await resolveUserIdentity(prisma, identity);
  if (!userId && !email) {
    return false;
  }

  const purchase = await prisma.purchase.findFirst({
    where: buildCompletedPurchaseWhere(userId, email, bookId),
    select: { id: true },
  });

  return Boolean(purchase);
}

