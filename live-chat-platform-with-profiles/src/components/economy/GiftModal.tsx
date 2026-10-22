"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { CoinIcon } from "@/components/economy/CoinIcon";
import { apiFetch } from "@/lib/client";
import { coinStore, useCoins } from "@/lib/coinStore";
import { CENTS, GIFTS, GIFT_MESSAGE_MAX, formatCoins, type GiftKey } from "@/lib/economy";
import type { PublicUser } from "@/lib/types";

export const GIFTS_CHANGED = "better321:gifts-changed";

export function GiftModal({ recipient, onClose }: { recipient: PublicUser; onClose: () => void }) {
  const coins = useCoins();
  const [gift, setGift] = useState<GiftKey>("heart");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const def = GIFTS.find((g) => g.key === gift)!;
  const affordable = coins != null && coins >= def.price * CENTS;

  async function send() {
    setBusy(true);
    setError(null);
    const res = await apiFetch("/api/gifts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipientId: recipient.id, gift, message }),
    });
    const data = (await res.json().catch(() => ({}))) as { coins?: number; error?: string };
    setBusy(false);
    if (!res.ok) return setError(data.error ?? "Couldn't send gift.");
    if (data.coins != null) coinStore.set(data.coins);
    window.dispatchEvent(new CustomEvent(GIFTS_CHANGED, { detail: recipient.id }));
    setSent(def.key);
    setMessage("");
  }

  return (
    <div className="fixed inset-0 z-[55] grid place-items-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="animate-fade-up w-full max-w-md rounded-3xl border border-orange-500/20 bg-[#140d08] p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar src={recipient.avatarUrl} name={recipient.displayName} accent={recipient.accentColor} size={40} />
            <div>
              <p className="text-xs text-zinc-500">Send a gift to</p>
              <p className="font-bold" style={{ color: recipient.accentColor }}>
                {recipient.displayName}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost !px-2.5 !py-1 text-xs">
            ✕
          </button>
        </div>

        {sent ? (
          <div className="py-6 text-center">
            <img
              src={GIFTS.find((g) => g.key === sent)!.image}
              alt=""
              className="mx-auto h-28 w-28 animate-bounce object-contain drop-shadow-[0_10px_25px_rgba(249,115,22,0.35)]"
            />
            <p className="mt-3 text-lg font-black">Gift sent! 🎉</p>
            <p className="text-sm text-zinc-400">It now shows on {recipient.displayName}&apos;s Gifts tab.</p>
            <div className="mt-5 flex justify-center gap-2">
              <button onClick={() => setSent(null)} className="btn-ghost text-sm">
                Send another
              </button>
              <button onClick={onClose} className="btn-primary text-sm">
                Done
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-5 grid grid-cols-4 gap-2">
              {GIFTS.map((g) => (
                <button
                  key={g.key}
                  onClick={() => setGift(g.key)}
                  className={`flex flex-col items-center rounded-2xl border p-2 transition ${
                    gift === g.key
                      ? "border-orange-400/70 bg-orange-500/15 shadow-[0_0_20px_rgba(249,115,22,0.2)]"
                      : "border-white/10 bg-white/[0.03] hover:bg-white/[0.07]"
                  }`}
                >
                  <img src={g.image} alt={g.name} className="h-14 w-14 object-contain" />
                  <span className="mt-1 text-xs font-semibold">{g.name}</span>
                  <span className="mt-0.5 flex items-center gap-1 text-[11px] text-amber-200">
                    <CoinIcon size={11} /> {g.price}
                  </span>
                </button>
              ))}
            </div>
            <input
              className="input mt-4 text-sm"
              placeholder="Add a message (optional)"
              maxLength={GIFT_MESSAGE_MAX}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            {error && <p className="mt-2 text-xs text-rose-300">{error}</p>}
            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-xs text-zinc-400">
                Balance: <CoinIcon size={12} /> <b className="text-amber-100">{formatCoins(coins)}</b>
              </span>
              <button onClick={send} disabled={busy || !affordable} className="btn-primary text-sm">
                {busy ? "Sending…" : affordable ? `Send ${def.name} · ${def.price}` : "Not enough coins"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function GiftButton({ recipient }: { recipient: PublicUser }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-ghost !px-3 !py-1.5 text-xs">
        🎁 Gift
      </button>
      {open && <GiftModal recipient={recipient} onClose={() => setOpen(false)} />}
    </>
  );
}
