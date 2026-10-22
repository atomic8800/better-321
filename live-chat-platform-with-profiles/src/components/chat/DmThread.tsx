"use client";

import { Avatar } from "@/components/Avatar";
import { MediaView } from "@/components/MediaView";
import { dayLabel, timeAgo, timeOf } from "@/lib/time";
import type { DirectMessage, PublicUser, SelfUser } from "@/lib/types";
import { useAutoScroll } from "@/components/chat/useAutoScroll";

type Props = {
  me: SelfUser;
  peer: PublicUser;
  messages: DirectMessage[] | undefined;
  online: boolean;
  onOpenProfile: (u: PublicUser) => void;
};

export function DmThread({ me, peer, messages, online, onOpenProfile }: Props) {
  const { ref, onScroll } = useAutoScroll(messages, peer.id);
  const list = messages ?? [];
  const lastMine = [...list].reverse().find((m) => m.senderId === me.id);

  let lastDay = "";
  return (
    <div ref={ref} onScroll={onScroll} className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-4 py-4">
      <div className="mb-6 flex flex-col items-center text-center">
        <button onClick={() => onOpenProfile(peer)}>
          <Avatar src={peer.avatarUrl} name={peer.displayName} accent={peer.accentColor} size={72} online={online} />
        </button>
        <p className="mt-2 text-lg font-black" style={{ color: peer.accentColor }}>
          {peer.displayName}
        </p>
        <p className="text-xs text-zinc-500">
          @{peer.username} · {online ? "online now" : `last seen ${timeAgo(peer.lastSeenAt)}`}
        </p>
        <p className="mt-2 text-xs text-zinc-500">This is the start of your private conversation. 🔒</p>
      </div>

      {!messages && <p className="text-center text-sm text-zinc-500">Loading messages…</p>}

      {list.map((m) => {
        const mine = m.senderId === me.id;
        const day = new Date(m.createdAt).toDateString();
        const showDay = day !== lastDay;
        lastDay = day;
        return (
          <div key={m.id}>
            {showDay && (
              <div className="my-4 flex items-center gap-3 text-[11px] uppercase tracking-wider text-zinc-500">
                <span className="h-px flex-1 bg-white/5" />
                {dayLabel(m.createdAt)}
                <span className="h-px flex-1 bg-white/5" />
              </div>
            )}
            <div className={`animate-fade-up mb-2 flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] ${mine ? "items-end" : "items-start"} flex flex-col gap-1`}>
                {m.attachment && (
                  <div className="max-w-xs">
                    <MediaView media={m.attachment} />
                  </div>
                )}
                {m.content && (
                  <p
                    className={`whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-[15px] leading-relaxed ${
                      mine
                        ? "rounded-br-md bg-gradient-to-br from-orange-500 to-orange-600 text-white"
                        : "rounded-bl-md border border-white/10 bg-white/[0.06] text-zinc-100"
                    }`}
                  >
                    {m.content}
                  </p>
                )}
                <span className="px-1 text-[10px] text-zinc-500">
                  {timeOf(m.createdAt)}
                  {mine && lastMine?.id === m.id && (m.readAt ? " · Seen" : " · Sent")}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
