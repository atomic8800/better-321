import { and, asc, desc, eq, inArray, lt } from "drizzle-orm";
import { db } from "@/db";
import { postMedia, posts, users } from "@/db/schema";
import { toAttachment, toPublicUser, type WallPost } from "@/lib/types";

export async function getWall(authorIds: number[], before?: number, limit = 20): Promise<WallPost[]> {
  if (!authorIds.length) return [];
  const rows = await db
    .select({ post: posts, author: users })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .where(and(inArray(posts.authorId, authorIds), before ? lt(posts.id, before) : undefined))
    .orderBy(desc(posts.id))
    .limit(limit);
  if (!rows.length) return [];

  const media = await db
    .select()
    .from(postMedia)
    .where(inArray(postMedia.postId, rows.map((r) => r.post.id)))
    .orderBy(asc(postMedia.position));
  const byPost = new Map<number, typeof media>();
  for (const m of media) byPost.set(m.postId, [...(byPost.get(m.postId) ?? []), m]);

  return rows.map(({ post, author }) => ({
    id: post.id,
    content: post.content,
    createdAt: post.createdAt.toISOString(),
    author: toPublicUser(author),
    media: (byPost.get(post.id) ?? []).map((m) => toAttachment(m.fileId, m.type)!),
  }));
}
