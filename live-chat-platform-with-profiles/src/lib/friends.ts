import { and, count, eq, inArray, or } from "drizzle-orm";
import { db } from "@/db";
import { friendships, users } from "@/db/schema";
import { toPublicUser, type FriendStatus, type PublicUser } from "@/lib/types";

type Row = typeof friendships.$inferSelect;

export async function findFriendship(a: number, b: number): Promise<Row | null> {
  const [row] = await db
    .select()
    .from(friendships)
    .where(
      or(
        and(eq(friendships.requesterId, a), eq(friendships.addresseeId, b)),
        and(eq(friendships.requesterId, b), eq(friendships.addresseeId, a)),
      ),
    )
    .limit(1);
  return row ?? null;
}

export function statusFrom(me: number, other: number, row: Row | null): FriendStatus {
  if (me === other) return "self";
  if (!row) return "none";
  if (row.status === "accepted") return "friends";
  return row.requesterId === me ? "outgoing" : "incoming";
}

export async function getFriendStatus(me: number, other: number): Promise<FriendStatus> {
  if (me === other) return "self";
  return statusFrom(me, other, await findFriendship(me, other));
}

export async function getFriendIds(me: number): Promise<number[]> {
  const rows = await db
    .select({ r: friendships.requesterId, a: friendships.addresseeId })
    .from(friendships)
    .where(and(eq(friendships.status, "accepted"), or(eq(friendships.requesterId, me), eq(friendships.addresseeId, me))));
  return rows.map((x) => (x.r === me ? x.a : x.r));
}

export async function getFriendData(me: number): Promise<{
  friends: PublicUser[];
  incoming: PublicUser[];
  outgoing: PublicUser[];
}> {
  const rows = await db
    .select()
    .from(friendships)
    .where(or(eq(friendships.requesterId, me), eq(friendships.addresseeId, me)));
  const ids = rows.map((r) => (r.requesterId === me ? r.addresseeId : r.requesterId));
  if (!ids.length) return { friends: [], incoming: [], outgoing: [] };
  const userRows = await db.select().from(users).where(inArray(users.id, ids));
  const byId = new Map(userRows.map((u) => [u.id, toPublicUser(u)]));

  const friends: PublicUser[] = [];
  const incoming: PublicUser[] = [];
  const outgoing: PublicUser[] = [];
  for (const r of rows) {
    const other = byId.get(r.requesterId === me ? r.addresseeId : r.requesterId);
    if (!other) continue;
    if (r.status === "accepted") friends.push(other);
    else if (r.requesterId === me) outgoing.push(other);
    else incoming.push(other);
  }
  friends.sort((x, y) => x.displayName.localeCompare(y.displayName));
  return { friends, incoming, outgoing };
}

export async function pendingIncomingCount(me: number): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(friendships)
    .where(and(eq(friendships.addresseeId, me), eq(friendships.status, "pending")));
  return Number(row?.n ?? 0);
}
