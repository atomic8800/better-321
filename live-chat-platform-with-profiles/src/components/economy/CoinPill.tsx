"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CoinIcon } from "@/components/economy/CoinIcon";
import { apiFetch } from "@/lib/client";
import { coinStore, useCoins, useWallet, useWalletPolling, type Wallet } from "@/lib/coinStore";
import { DAILY_BONUS, INCOME_PER_MINUTE, formatCoins } from "@/lib/economy";

function countdown(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h ? `${h}h ${m}m` : m ? `${m}m ${sec}s` : `${sec}s`;
}

export function CoinPill({ initialCoins }: { initialCoins: number }) {
  useWalletPolling(true, initialCoins);
  const coins = useCoins();
  const wallet = useWallet();
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [bump, setBump] = useState(false);
  const prev = useRef<number | null>(coins);
  const ref = useRef<HTMLDivElement>(null);

  // Little bounce when the balance goes up.
  useEffect(() => {
    if (coins != null && prev.current != null && coins > prev.current) {
      setBump(true);
      const t = setTimeout(() => setBump(false), 450);
      prev.current = coins;
      return () => clearTimeout(t);
    }
    prev.current = coins;
  }, [coins]);

  useEffect(() => {
    if (!open) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    window.addEventListener("mousedown", onDown);
    return () => {
      clearInterval(t);
      window.removeEventListener("mousedown", onDown);
    };
  }, [open]);

  const dailyAt = wallet ? new Date(wallet.dailyAvailableAt).getTime() : 0;
  const dailyReady = !!wallet && dailyAt <= now;

  async function claim() {
    setBusy(true);
    setMsg(null);
    const res = await apiFetch("/api/coins/daily", { method: "POST" });
    const data = (await res.json().catch(() => ({}))) as { wallet?: Wallet; error?: string };
    setBusy(false);
    if (!res.ok || !data.wallet) return setMsg(data.error ?? "Couldn't claim.");
    coinStore.setWallet(data.wallet, true);
    setMsg(`+${DAILY_BONUS} coins claimed! 🎉`);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 rounded-full border border-amber-300/25 bg-amber-400/10 py-1 pl-1.5 pr-3 text-sm font-bold text-amber-100 transition hover:bg-amber-400/20 ${
          bump ? "scale-110" : ""
        }`}
        title="Your coins"
      >
        <CoinIcon size={20} />
        <span className="tabular-nums">{formatCoins(coins)}</span>
        {dailyReady && <span className="h-2 w-2 rounded-full bg-emerald-400" title="Daily bonus ready" />}
      </button>
      {open && (
        <div className="animate-fade-up absolute right-0 top-11 z-50 w-72 rounded-2xl border border-white/10 bg-[#1a110a] p-4 shadow-2xl">
          <div className="flex items-center gap-2">
            <CoinIcon size={30} />
            <div>
              <p className="text-2xl font-black tabular-nums text-amber-100">{formatCoins(coins)}</p>
              <p className="text-[11px] text-zinc-500">coins</p>
            </div>
          </div>
          <div className="mt-3 space-y-2 text-xs text-zinc-300">
            <p className="rounded-xl bg-white/[0.04] px-3 py-2">
              ⏱️ You earn <b className="text-amber-200">{INCOME_PER_MINUTE} coins every minute</b> while you&apos;re on Better321.
              {wallet && (
                <span className="block text-zinc-500">Next payout in {countdown(new Date(wallet.nextIncomeAt).getTime() + 15_000 - now)}</span>
              )}
            </p>
            <div className="rounded-xl bg-white/[0.04] px-3 py-2">
              <p>
                📅 Daily bonus: <b className="text-amber-200">+{DAILY_BONUS} coins</b>
              </p>
              <button
                disabled={!dailyReady || busy}
                onClick={claim}
                className="btn-primary mt-2 w-full !py-1.5 text-xs disabled:!opacity-40"
              >
                {busy ? "Claiming…" : dailyReady ? "Claim daily bonus" : wallet ? `Ready in ${countdown(dailyAt - now)}` : "…"}
              </button>
            </div>
            {msg && <p className="text-center text-emerald-300">{msg}</p>}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Link href="/plinko" onClick={() => setOpen(false)} className="btn-ghost !py-1.5 text-center text-xs">
              🎰 Plinko
            </Link>
            <span className="rounded-xl border border-white/10 px-2 py-1.5 text-center text-[11px] leading-tight text-zinc-400">
              🎁 Send gifts from any profile
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
