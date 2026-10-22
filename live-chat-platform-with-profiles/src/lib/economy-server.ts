import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { CENTS, DAILY_BONUS, DAILY_COOLDOWN_HOURS, INCOME_MAX_CATCHUP_MINUTES, INCOME_PER_MINUTE } from "@/lib/economy";

/**
 * Grants passive income: INCOME_PER_MINUTE coins for each full minute since the last payout.
 * Only a few minutes can be caught up, so income is earned while you're actually around,
 * not while offline. Atomic, so multiple tabs can't double-pay.
 */
export async function accrueIncome(userId: number): Promise<number | null> {
  const rate = INCOME_PER_MINUTE * CENTS;
  const cap = INCOME_MAX_CATCHUP_MINUTES;
  const rows = await db.execute<{ coins: string | number }>(sql`
    UPDATE users SET
      coins = coins + LEAST(floor(extract(epoch from (now() - last_income_at)) / 60), ${cap})::int * ${rate},
      last_income_at = CASE
        WHEN now() - last_income_at > make_interval(mins => ${cap}) THEN now()
        ELSE last_income_at + floor(extract(epoch from (now() - last_income_at)) / 60) * interval '1 minute'
      END
    WHERE id = ${userId} AND role <> 'guest' AND now() - last_income_at >= interval '1 minute'
    RETURNING coins
  `);
  const row = rows.rows[0];
  return row ? Number(row.coins) : null;
}

export async function getWallet(userId: number) {
  const [row] = await db
    .select({ coins: users.coins, lastIncomeAt: users.lastIncomeAt, lastDailyAt: users.lastDailyAt })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!row) return null;
  const dailyAvailableAt = row.lastDailyAt
    ? new Date(row.lastDailyAt.getTime() + DAILY_COOLDOWN_HOURS * 3600_000)
    : new Date(0);
  return {
    coins: row.coins,
    nextIncomeAt: new Date(row.lastIncomeAt.getTime() + 60_000).toISOString(),
    dailyAvailableAt: dailyAvailableAt.toISOString(),
    incomePerMinute: INCOME_PER_MINUTE,
    dailyBonus: DAILY_BONUS,
  };
}

export async function claimDaily(userId: number): Promise<number | null> {
  const rows = await db
    .update(users)
    .set({ coins: sql`${users.coins} + ${DAILY_BONUS * CENTS}`, lastDailyAt: new Date() })
    .where(
      and(
        eq(users.id, userId),
        sql`(${users.lastDailyAt} IS NULL OR ${users.lastDailyAt} <= now() - make_interval(hours => ${DAILY_COOLDOWN_HOURS}))`,
      ),
    )
    .returning({ coins: users.coins });
  return rows[0]?.coins ?? null;
}

/** Atomically applies `delta` (may be negative) if the balance can cover `required`. Returns the new balance or null. */
export async function adjustCoins(userId: number, delta: number, required = 0): Promise<number | null> {
  const rows = await db
    .update(users)
    .set({ coins: sql`${users.coins} + ${delta}` })
    .where(and(eq(users.id, userId), gte(users.coins, required)))
    .returning({ coins: users.coins });
  return rows[0]?.coins ?? null;
}
