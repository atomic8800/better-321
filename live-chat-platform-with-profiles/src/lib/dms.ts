import { and, asc, count, desc, eq, gt, inArray, isNull, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { directMessages, users } from "@/db/schema";
import { toAttachment, toPublicUser, type Conversation, type DirectMessage } from "@/lib/types";

type DmRow = typeof directMessages.$inferSelect;

export function mapDm(r: DmRow): DirectMessage {
  return {
    id: r.id,
    senderId: r.senderId,
    recipientId: r.recipientId,
    content: r.content,
    attachment: toAttachment(r.attachmentFileId, r.attachmentType),
    createdAt: r.createdAt.toISOString(),
    readAt: r.readAt ? r.readAt.toISOString() : null,
  };
}

const involves = (me: number) => or(eq(directMessages.senderId, me), eq(directMessages.recipientId, me));

const between = (a: number, b: number) =>
  or(
    and(eq(directMessages.senderId, a), eq(directMessages.recipientId, b)),
    and(eq(directMessages.senderId, b), eq(directMessages.recipientId, a)),
  );

export async function getConversations(me: number): Promise<Conversation[]> {
  const recent = await db
    .select()
    .from(directMessages)
    .where(involves(me))
    .orderBy(desc(directMessages.id))
    .limit(1000);

  const lastByUser = new Map<number, DmRow>();
  for (const r of recent) {
    const other = r.senderId === me ? r.recipientId : r.senderId;
    if (!lastByUser.has(other)) lastByUser.set(other, r);
  }
  if (!lastByUser.size) return [];

  const ids = [...lastByUser.keys()];
  const [userRows, unreadRows] = await Promise.all([
    db.select().from(users).where(inArray(users.id, ids)),
    db
      .select({ senderId: directMessages.senderId, n: count() })
      .from(directMessages)
      .where(and(eq(directMessages.recipientId, me), isNull(directMessages.readAt)))
      .groupBy(directMessages.senderId),
  ]);
  const unread = new Map(unreadRows.map((r) => [r.senderId, Number(r.n)]));
  const byId = new Map(userRows.map((u) => [u.id, u]));

  return ids
    .filter((id) => byId.has(id))
    .map((id) => ({
      user: toPublicUser(byId.get(id)!),
      lastMessage: mapDm(lastByUser.get(id)!),
      unread: unread.get(id) ?? 0,
    }));
}

export async function getThread(me: number, other: number, limit = 150): Promise<DirectMessage[]> {
  const rows = await db
    .select()
    .from(directMessages)
    .where(between(me, other))
    .orderBy(desc(directMessages.id))
    .limit(limit);
  return rows.reverse().map(mapDm);
}

export async function markRead(me: number, other: number): Promise<void> {
  await db
    .update(directMessages)
    .set({ readAt: new Date() })
    .where(
      and(eq(directMessages.recipientId, me), eq(directMessages.senderId, other), isNull(directMessages.readAt)),
    );
}

export async function getDmsAfter(me: number, afterId: number): Promise<DirectMessage[]> {
  const rows = await db
    .select()
    .from(directMessages)
    .where(and(gt(directMessages.id, afterId), involves(me)))
    .orderBy(asc(directMessages.id))
    .limit(200);
  return rows.map(mapDm);
}

export async function maxDmId(): Promise<number> {
  const [row] = await db.select({ max: sql<number>`coalesce(max(${directMessages.id}), 0)` }).from(directMessages);
  return Number(row?.max ?? 0);
}

export async function unreadTotal(me: number): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(directMessages)
    .where(and(eq(directMessages.recipientId, me), isNull(directMessages.readAt)));
  return Number(row?.n ?? 0);
}
