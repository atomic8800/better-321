import { db } from "@/db";
import { files } from "@/db/schema";
import { LIMITS } from "@/lib/constants";

export type MediaType = "image" | "video";

export type SavedMedia = { id: string; type: MediaType };

/** Validates and stores an uploaded image/video. Returns a saved record, null (no file) or an error string. */
export async function saveMedia(
  file: FormDataEntryValue | null,
  ownerId: number,
  kind: "chat" | "dm" | "post",
  allow: MediaType[] = ["image", "video"],
): Promise<SavedMedia | null | { error: string }> {
  if (!(file instanceof File) || file.size === 0) return null;
  const mime = file.type || "";
  const type: MediaType | null = mime.startsWith("image/") ? "image" : mime.startsWith("video/") ? "video" : null;
  if (!type || !allow.includes(type)) {
    return { error: allow.includes("video") ? "Only images and videos can be sent." : "Only images can be sent." };
  }
  const limit = type === "image" ? LIMITS.chatImage : LIMITS.chatVideo;
  if (file.size > limit) {
    return { error: `${type === "image" ? "Images" : "Videos"} must be under ${limit / 1024 / 1024}MB.` };
  }
  const data = Buffer.from(await file.arrayBuffer());
  const [row] = await db
    .insert(files)
    .values({ ownerId, kind, mime, size: file.size, name: file.name.slice(0, 120), data })
    .returning({ id: files.id });
  return { id: row.id, type };
}

export function isMediaError(v: unknown): v is { error: string } {
  return !!v && typeof v === "object" && "error" in v;
}
