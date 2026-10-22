import { and, count, eq, gte, isNull, or } from "drizzle-orm";
import { db } from "@/db";
import { bans, messages, users, type User } from "@/db/schema";

export type BanRecord = typeof bans.$inferSelect;

/** Finds a permanent ban matching a username and/or IP address. */
export async function findBan({ username, ip }: { username?: string | null; ip?: string | null }): Promise<BanRecord | null> {
  const conds = [];
  if (username) conds.push(eq(bans.username, username.toLowerCase()));
  if (ip) conds.push(eq(bans.ip, ip));
  if (!conds.length) return null;
  const [row] = await db.select().from(bans).where(or(...conds)).limit(1);
  return row ?? null;
}

/**
 * Permanently bans an account and deletes it.
 * - Records the username (and the IP for guests) so the account can't simply come back.
 * - Soft-deletes their lounge messages so they disappear live for everyone.
 * - Deletes the user row; sessions, files, DMs, friendships and wall posts cascade away.
 */
export async function banAndDelete(target: User, actorId: number | null, reason: string | null): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.insert(bans).values({
      username: target.username,
      // IPs are only recorded for guests, so members sharing a network aren't caught by it.
      ip: target.role === "guest" ? (target.lastIp ?? target.kickedIp) : null,
      displayName: target.displayName,
      reason,
      actorId,
    });
    await tx
      .update(messages)
      .set({ deletedAt: new Date() })
      .where(and(eq(messages.userId, target.id), isNull(messages.deletedAt)));
    await tx.delete(users).where(eq(users.id, target.id));
  });
}

/** Deletes any accounts that were permanently kicked before auto-deletion existed. */
export async function purgeLegacyPermanentKicks(): Promise<number> {
  const legacy = await db.select().from(users).where(gte(users.kickedUntil, new Date("9999-01-01T00:00:00Z")));
  for (const u of legacy) {
    await banAndDelete(u, null, u.kickReason);
  }
  return legacy.length;
}

export async function banCount(): Promise<number> {
  const [row] = await db.select({ n: count() }).from(bans);
  return Number(row?.n ?? 0);
}
