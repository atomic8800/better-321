"use client";

import { useEffect, useState } from "react";
import { apiFetch, clearToken, hardNavigate } from "@/lib/client";
import { isPermanent } from "@/lib/moderation";
import type { SelfUser } from "@/lib/types";

export function formatRemaining(ms: number): string {
  if (ms <= 0) return "0s";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d) return `${d}d ${h}h ${m}m`;
  if (h) return `${h}h ${m}m ${sec}s`;
  if (m) return `${m}m ${sec}s`;
  return `${sec}s`;
}

export function KickedScreen({ me }: { me: SelfUser }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const perm = isPermanent(me.kickedUntil);
  const remaining = me.kickedUntil ? new Date(me.kickedUntil).getTime() - now : 0;
  const over = !perm && remaining <= 0;

  async function logout() {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } finally {
      clearToken();
      hardNavigate("/");
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-6">
      <div className="glass w-full max-w-md rounded-3xl p-8 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Better321" className="mx-auto h-16 w-16 object-contain opacity-80 grayscale-[40%]" />
        <h1 className="mt-4 text-2xl font-black">{perm ? "You've been banned" : over ? "Your kick has ended" : "You've been kicked"}</h1>
        {me.kickReason && (
          <p className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
            Reason: {me.kickReason}
          </p>
        )}
        {perm ? (
          <p className="mt-4 text-sm text-zinc-400">This account has been permanently banned and deleted from Better321.</p>
        ) : over ? (
          <p className="mt-4 text-sm text-zinc-400">Please follow the chat rules. You can rejoin now.</p>
        ) : (
          <>
            <p className="mt-4 text-sm text-zinc-400">You can rejoin in</p>
            <p className="mt-1 font-mono text-4xl font-bold text-orange-300">{formatRemaining(remaining)}</p>
          </>
        )}
        <div className="mt-6 flex justify-center gap-2">
          {over && (
            <button className="btn-primary" onClick={() => window.location.reload()}>
              Rejoin chat →
            </button>
          )}
          <button className="btn-ghost" onClick={logout}>
            Log out
          </button>
        </div>
      </div>
    </main>
  );
}
