import { Prisma } from '@prisma/client';

export async function acquireMealMonthLocks(
  tx: Prisma.TransactionClient,
  messId: string,
  dateKeys: string[],
) {
  const months = [...new Set(dateKeys.map((date) => date.slice(0, 7)))].sort();
  for (const month of months) {
    await tx.$queryRaw(Prisma.sql`
      SELECT pg_advisory_xact_lock(
        hashtextextended(${`meal:${messId}:${month}`}, 0)
      )::text AS "lock_result"
    `);
  }
}

export async function acquireMealCommandLock(
  tx: Prisma.TransactionClient,
  messId: string,
  userId: string,
  idempotencyKey: string,
) {
  await tx.$queryRaw(Prisma.sql`
    SELECT pg_advisory_xact_lock(
      hashtextextended(
        ${`meal-command:${messId}:${userId}:${idempotencyKey}`},
        0
      )
    )::text AS "lock_result"
  `);
}
