import type { User } from "@/db/schema";
import { formatDuration, isActive, isPermanent } from "@/lib/moderation";

/** Returns an error Response if the user may not send content right now, otherwise null. */
export function sendBlocked(user: User): Response | null {
  if (isActive(user.kickedUntil)) {
    return Response.json({ error: "You are kicked from the chat.", kicked: true }, { status: 403 });
  }
  if (isActive(user.mutedUntil)) {
    const left = isPermanent(user.mutedUntil)
      ? "permanently"
      : `for another ${formatDuration(Math.max(1, Math.ceil((user.mutedUntil!.getTime() - Date.now()) / 60000)))}`;
    return Response.json({ error: `You are muted ${left}.`, muted: true }, { status: 403 });
  }
  return null;
}

/** Members-only features (DMs, friends, wall). */
export function membersOnly(user: User): Response | null {
  if (user.role === "guest") {
    return Response.json(
      { error: "Create a free account to use DMs, friends and the wall." },
      { status: 403 },
    );
  }
  return null;
}
