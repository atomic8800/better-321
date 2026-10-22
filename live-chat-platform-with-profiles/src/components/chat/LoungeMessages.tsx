"use client";

import { useMemo } from "react";
import { Avatar } from "@/components/Avatar";
import { MediaView } from "@/components/MediaView";
import { MessageText, RankIcon, StyledName } from "@/components/chat/StyledText";
import { useAutoScroll } from "@/components/chat/useAutoScroll";
import { buildMentionMatcher, mentionsUser, type MentionUser } from "@/lib/mentions";
import { dayLabel, timeOf } from "@/lib/time";
import type { ChatMessage, SelfUser } from "@/lib/types";

type Props = {
  messages: ChatMessage[];
  me: SelfUser;
  onlineIds: Set<number>;
  mentionUsers: MentionUser[];
  live: boolean;
  onOpenProfile: (username: string) => void;
  onDelete: (id: number) => void;
  pinSignal: number;
};

export function LoungeMessages({ messages, me, onlineIds, mentionUsers, live, onOpenProfile, onDelete, pinSignal }: Props) {
  const { ref, onScroll } = useAutoScroll(messages, pinSignal);

  // Everyone we know about: users in the list + anyone who has spoken.
  const signature = useMemo(() => {
    const map = new Map<number, MentionUser>();
    for (const u of mentionUsers) map.set(u.id, u);
    for (const m of messages) if (m.author) map.set(m.author.id, m.author);
    map.set(me.id, me);
    return JSON.stringify([...map.values()].map((u) => [u.id, u.username, u.displayName]));
  }, [mentionUsers, messages, me]);
  const matcher = useMemo(() => {
    const list = (JSON.parse(signature) as [number, string, string][]).map(([id, username, displayName]) => ({
      id,
      username,
      displayName,
    }));
    return buildMentionMatcher(list);
  }, [signature]);

  let lastDay = "";

  return (
    <div ref={ref} onScroll={onScroll} className="scrollbar-thin min-h-0 flex-1 overflow-y-auto bg-[#161616] py-2">
      {messages.length === 0 && live && (
        <div className="grid h-full place-items-center text-center text-zinc-500">
          <div>
            <p className="text-3xl">👋</p>
            <p className="mt-2 text-sm">It&apos;s quiet in here. Say hi!</p>
          </div>
        </div>
      )}
      {messages.map((m) => {
        const day = new Date(m.createdAt).toDateString();
        const showDay = day !== lastDay;
        lastDay = day;
        const separator = showDay ? (
          <div className="my-3 flex items-center gap-3 px-5 text-[11px] uppercase tracking-wider text-zinc-600">
            <span className="h-px flex-1 bg-white/[0.06]" />
            {dayLabel(m.createdAt)}
            <span className="h-px flex-1 bg-white/[0.06]" />
          </div>
        ) : null;

        if (m.kind === "system") {
          return (
            <div key={m.id}>
              {separator}
              <div className="my-1.5 px-5 text-center text-[13px] text-zinc-500">
                <span className="rounded-full bg-white/[0.04] px-3 py-1">{m.content}</span>
              </div>
            </div>
          );
        }

        const a = m.author;
        const mentionsMe = !!m.content && a?.id !== me.id && mentionsUser(m.content, matcher, me.id);

        return (
          <div key={m.id}>
            {separator}
            <div
              className={`animate-fade-up group relative flex gap-3 border-l-[3px] px-4 py-2 transition-colors sm:px-5 ${
                mentionsMe ? "border-orange-500 bg-orange-500/[0.07]" : "border-transparent hover:bg-white/[0.025]"
              }`}
            >
              <button
                onClick={() => a && onOpenProfile(a.username)}
                className="shrink-0 self-start rounded-full bg-zinc-300/80 p-[2px]"
                title={a ? `View ${a.displayName}` : undefined}
              >
                <Avatar
                  src={a?.avatarUrl ?? null}
                  name={a?.displayName ?? "?"}
                  accent={a?.accentColor ?? "#71717a"}
                  size={42}
                  online={a ? onlineIds.has(a.id) : false}
                />
              </button>

              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex min-w-0 items-center gap-1.5">
                  {a && <RankIcon rank={a.rank} user={a} size={13} />}
                  <button
                    onClick={() => a && onOpenProfile(a.username)}
                    className="min-w-0 text-[14px] font-bold leading-tight hover:underline"
                  >
                    {a ? <StyledName user={a} /> : <span className="text-zinc-500">Deleted user</span>}
                  </button>
                  <span className="shrink-0 text-[11px] text-zinc-600 opacity-0 transition group-hover:opacity-100">
                    {timeOf(m.createdAt)}
                  </span>
                </div>

                {m.content && (
                  <p className="mt-0.5 whitespace-pre-wrap break-words text-[15px] leading-relaxed">
                    <MessageText content={m.content} style={a ?? {}} matcher={matcher} meId={me.id} onMention={onOpenProfile} />
                  </p>
                )}
                {m.attachment && (
                  <div className="mt-2 max-w-md">
                    <MediaView media={m.attachment} />
                  </div>
                )}
              </div>

              {me.rank === "owner" && (
                <button
                  onClick={() => onDelete(m.id)}
                  className="absolute right-3 top-2 rounded-lg px-2 py-1 text-xs text-zinc-500 opacity-0 transition hover:bg-rose-500/15 hover:text-rose-300 group-hover:opacity-100"
                  title="Delete message (owner)"
                >
                  🗑️
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
