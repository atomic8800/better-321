"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { GIFTS_CHANGED } from "@/components/economy/GiftModal";
import { apiFetch } from "@/lib/client";
import { GIFTS, giftByKey } from "@/lib/economy";
import { timeAgo } from "@/lib/time";

export type GiftData = {
  total: number;
  summary: Record<string, number>;
  recent: {
    id: number;
    gift: string;
    message: string | null;
    createdAt: string;
    sender: { username: string; displayName: string; accentColor: string; avatarUrl: string | null } | null;
  }[];
};

export function useGifts(username: string, userId: number, enabled = true) {
  const [data, setData] = useState<GiftData | null>(null);
  const load = useCallback(async () => {
    if (!enabled) return;
    const res = await apiFetch(`/api/users/${username}/gifts`);
    if (res.ok) setData((await res.json()) as GiftData);
  }, [username, enabled]);
  useEffect(() => {
    void load();
    const onChange = (e: Event) => (e as CustomEvent<number>).detail === userId && void load();
    window.addEventListener(GIFTS_CHANGED, onChange);
    return () => window.removeEventListener(GIFTS_CHANGED, onChange);
  }, [load, userId]);
  return data;
}

export function GiftsTab({ data, isMe }: { data: GiftData | null; isMe: boolean }) {
  if (!data) return <p className="py-6 text-center text-sm text-zinc-500">Loading gifts…</p>;
  return (
    <div className="pb-6">
      <div className="grid grid-cols-4 gap-2">
        {GIFTS.map((g) => {
          const n = data.summary[g.key] ?? 0;
          return (
            <div
              key={g.key}
              className={`flex flex-col items-center rounded-2xl border p-2 ${
                n ? "border-orange-400/25 bg-orange-500/[0.07]" : "border-white/5 bg-white/[0.02] opacity-45"
              }`}
              title={`${n} × ${g.name}`}
            >
              <img src={g.image} alt={g.name} className="h-12 w-12 object-contain" />
              <span className="mt-1 text-sm font-black tabular-nums">×{n}</span>
              <span className="text-[10px] text-zinc-500">{g.name}</span>
            </div>
          );
        })}
      </div>

      <h3 className="mb-2 mt-5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
        Recent gifts {data.total > 0 && `· ${data.total} total`}
      </h3>
      {data.recent.length === 0 ? (
        <p className="text-sm text-zinc-500">{isMe ? "No gifts yet — they'll show up here." : "No gifts yet. Be the first! 🎁"}</p>
      ) : (
        <ul className="space-y-2">
          {data.recent.map((r) => {
            const def = giftByKey(r.gift);
            return (
              <li key={r.id} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-2.5">
                {def && <img src={def.image} alt={def.name} className="h-10 w-10 shrink-0 object-contain" />}
                <div className="min-w-0 flex-1 text-sm">
                  <p className="truncate">
                    <b className="text-zinc-100">{def?.name ?? r.gift}</b>
                    <span className="text-zinc-500"> from </span>
                    {r.sender ? (
                      <Link href={`/u/${r.sender.username}`} className="font-semibold hover:underline" style={{ color: r.sender.accentColor }}>
                        {r.sender.displayName}
                      </Link>
                    ) : (
                      <span className="text-zinc-500">a deleted user</span>
                    )}
                  </p>
                  {r.message && <p className="truncate text-xs italic text-zinc-400">“{r.message}”</p>}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {r.sender && <Avatar src={r.sender.avatarUrl} name={r.sender.displayName} accent={r.sender.accentColor} size={22} />}
                  <span className="text-[10px] text-zinc-600">{timeAgo(r.createdAt)}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
