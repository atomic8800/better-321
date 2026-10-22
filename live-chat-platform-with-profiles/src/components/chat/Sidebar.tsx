"use client";

import Link from "next/link";
import { StyledName } from "@/components/chat/StyledText";
import { Avatar } from "@/components/Avatar";
import { timeAgo } from "@/lib/time";
import type { Conversation, DirectMessage, SelfUser } from "@/lib/types";

type Props = {
  me: SelfUser;
  view: { type: "lounge" } | { type: "dm"; userId: number };
  conversations: Conversation[];
  onlineIds: Set<number>;
  loungeUnread: number;
  friendRequests: number;
  onLounge: () => void;
  onOpenDm: (c: Conversation) => void;
  className?: string;
  onClose?: () => void;
};

function preview(me: SelfUser, m: DirectMessage | null) {
  if (!m) return "Say hi 👋";
  const prefix = m.senderId === me.id ? "You: " : "";
  if (m.content) return prefix + m.content;
  return prefix + (m.attachment?.type === "video" ? "🎬 Video" : "🖼️ Photo");
}

export function Sidebar({
  me,
  view,
  conversations,
  onlineIds,
  loungeUnread,
  friendRequests,
  onLounge,
  onOpenDm,
  className = "",
  onClose,
}: Props) {
  const isGuest = me.role === "guest";
  return (
    <aside className={`glass w-64 shrink-0 flex-col overflow-hidden rounded-2xl ${className}`}>
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
        <h2 className="text-sm font-bold">Chats</h2>
        {onClose && (
          <button className="text-xs text-zinc-400" onClick={onClose}>
            Close
          </button>
        )}
      </div>
      <div className="scrollbar-thin flex-1 overflow-y-auto p-2">
        <p className="px-2 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Channels</p>
        <button
          onClick={onLounge}
          className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium transition ${
            view.type === "lounge" ? "bg-orange-500/15 text-orange-100" : "text-zinc-300 hover:bg-white/5"
          }`}
        >
          <span className="text-orange-400">#</span>
          <span className="flex-1">Better321</span>
          {loungeUnread > 0 && (
            <span className="rounded-full bg-orange-500 px-1.5 text-[10px] font-bold text-black">
              {loungeUnread > 99 ? "99+" : loungeUnread}
            </span>
          )}
        </button>

        {!isGuest && (
          <Link
            href="/friends"
            className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-zinc-300 transition hover:bg-white/5"
          >
            <span>👥</span>
            <span className="flex-1">Friends &amp; Wall</span>
            {friendRequests > 0 && (
              <span className="rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white" title="Friend requests">
                {friendRequests}
              </span>
            )}
          </Link>
        )}
        {!isGuest && (
          <Link
            href="/plinko"
            className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-zinc-300 transition hover:bg-white/5"
          >
            <span>🎰</span>
            <span className="flex-1">Plinko</span>
            <span className="rounded-full bg-amber-400/15 px-1.5 text-[10px] font-bold text-amber-200">WIN</span>
          </Link>
        )}

        <p className="px-2 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Direct messages</p>
        {isGuest ? (
          <div className="rounded-xl border border-orange-500/20 bg-orange-500/[0.06] p-3 text-xs text-zinc-300">
            Guests can&apos;t send DMs or add friends.{" "}
            <Link href="/profile" className="font-semibold text-orange-300 hover:underline">
              Create a free account
            </Link>{" "}
            to unlock them.
          </div>
        ) : conversations.length === 0 ? (
          <p className="px-3 py-2 text-xs leading-relaxed text-zinc-500">
            No conversations yet. Open someone&apos;s profile and press <b>💬 Message</b> to start one.
          </p>
        ) : (
          <ul className="space-y-0.5">
            {conversations.map((c) => {
              const active = view.type === "dm" && view.userId === c.user.id;
              return (
                <li key={c.user.id}>
                  <button
                    onClick={() => onOpenDm(c)}
                    className={`flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left transition ${
                      active ? "bg-orange-500/15" : "hover:bg-white/5"
                    }`}
                  >
                    <Avatar
                      src={c.user.avatarUrl}
                      name={c.user.displayName}
                      accent={c.user.accentColor}
                      size={34}
                      online={onlineIds.has(c.user.id)}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className={`min-w-0 text-sm ${c.unread ? "font-bold" : "font-medium"}`}>
                          <StyledName user={c.user} />
                        </span>
                        {c.lastMessage && (
                          <span className="shrink-0 text-[10px] text-zinc-600">{timeAgo(c.lastMessage.createdAt)}</span>
                        )}
                      </span>
                      <span className={`block truncate text-xs ${c.unread ? "text-zinc-200" : "text-zinc-500"}`}>
                        {preview(me, c.lastMessage)}
                      </span>
                    </span>
                    {c.unread > 0 && (
                      <span className="rounded-full bg-orange-500 px-1.5 text-[10px] font-bold text-black">{c.unread}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
