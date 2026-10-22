"use client";

import { useCallback, useEffect, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { RoleBadge } from "@/components/ProfileTags";
import { apiFetch } from "@/lib/client";
import { isPermanent } from "@/lib/moderation";
import type { ModLogEntry, PublicUser, SelfUser } from "@/lib/types";

type Overview = { log: ModLogEntry[]; moderators: PublicUser[]; punished: SelfUser[]; bans: number };

const ACTION_LABEL: Record<string, string> = {
  kick: "🚫 kicked",
  ban: "⛔ banned & deleted",
  lift_bans: "🔓 lifted all bans",
  unkick: "✅ lifted kick on",
  mute: "🔇 muted",
  unmute: "🔊 unmuted",
  promote: "🛡️ promoted",
  demote: "⬇️ demoted",
  delete_message: "🗑️ deleted a message",
  clear_chat: "🧹 cleared the chat",
};

function until(iso: string | null) {
  if (!iso) return "";
  if (isPermanent(iso)) return "permanent";
  return `until ${new Date(iso).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}`;
}

export function StaffPanel({ me, onClose }: { me: SelfUser; onClose: () => void }) {
  const isOwner = me.rank === "owner";
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [clearReason, setClearReason] = useState("");

  const load = useCallback(async () => {
    const res = await apiFetch("/api/mod/overview");
    if (!res.ok) return setError("Could not load staff data.");
    setData((await res.json()) as Overview);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function act(body: Record<string, unknown>, confirmText?: string) {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusy(true);
    setError(null);
    const res = await apiFetch("/api/mod", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    setBusy(false);
    if (!res.ok) setError(json.error ?? "Action failed.");
    await load();
  }

  const canLift = (u: PublicUser) => isOwner || u.rank === "user";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="animate-fade-up flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-orange-500/20 bg-[#140d08] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
          <div>
            <h2 className="text-lg font-black">{isOwner ? "👑 Owner panel" : "🛡️ Moderator panel"}</h2>
            <p className="text-xs text-zinc-500">Click a user in the chat to mute, kick{isOwner ? ", ban or promote" : ""} them.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => void load()} className="btn-ghost !px-3 !py-1.5 text-xs">
              ↻ Refresh
            </button>
            <button onClick={onClose} className="btn-ghost !px-3 !py-1.5 text-xs">
              ✕
            </button>
          </div>
        </div>

        <div className="scrollbar-thin flex-1 space-y-6 overflow-y-auto p-5">
          {error && <p className="rounded-xl bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>}
          {!data && !error && <p className="text-sm text-zinc-500">Loading…</p>}

          {data && (
            <>
              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Active punishments — {data.punished.length}
                </h3>
                {data.punished.length === 0 ? (
                  <p className="text-sm text-zinc-500">Nobody is kicked or muted. 🎉</p>
                ) : (
                  <ul className="space-y-2">
                    {data.punished.map((u) => (
                      <li key={u.id} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-3">
                        <Avatar src={u.avatarUrl} name={u.displayName} accent={u.accentColor} size={34} />
                        <div className="min-w-0 flex-1 text-sm">
                          <p className="font-semibold" style={{ color: u.accentColor }}>
                            {u.displayName} <span className="text-xs font-normal text-zinc-500">@{u.username}</span>
                          </p>
                          {u.kickedUntil && (
                            <p className="text-xs text-rose-300">
                              🚫 Kicked {until(u.kickedUntil)}
                              {u.kickReason ? ` — ${u.kickReason}` : ""}
                            </p>
                          )}
                          {u.mutedUntil && (
                            <p className="text-xs text-amber-300">
                              🔇 Muted {until(u.mutedUntil)}
                              {u.muteReason ? ` — ${u.muteReason}` : ""}
                            </p>
                          )}
                        </div>
                        {canLift(u) && (
                          <div className="flex flex-col gap-1">
                            {u.kickedUntil && (
                              <button
                                disabled={busy}
                                onClick={() => act({ action: "unkick", targetId: u.id })}
                                className="btn-ghost !px-2 !py-1 text-xs"
                              >
                                Lift kick
                              </button>
                            )}
                            {u.mutedUntil && (
                              <button
                                disabled={busy}
                                onClick={() => act({ action: "unmute", targetId: u.id })}
                                className="btn-ghost !px-2 !py-1 text-xs"
                              >
                                Unmute
                              </button>
                            )}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Moderators — {data.moderators.length}
                </h3>
                {data.moderators.length === 0 ? (
                  <p className="text-sm text-zinc-500">
                    No moderators yet.{isOwner && " Open a member's profile in the chat and click “Make mod”."}
                  </p>
                ) : (
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {data.moderators.map((u) => (
                      <li key={u.id} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-2.5">
                        <Avatar src={u.avatarUrl} name={u.displayName} accent={u.accentColor} size={30} />
                        <span className="min-w-0 flex-1 truncate text-sm font-medium" style={{ color: u.accentColor }}>
                          {u.displayName}
                        </span>
                        <RoleBadge role={u.role} rank={u.rank} />
                        {isOwner && (
                          <button
                            disabled={busy}
                            onClick={() => act({ action: "demote", targetId: u.id }, `Remove ${u.displayName} as moderator?`)}
                            className="text-xs text-zinc-400 hover:text-rose-300"
                            title="Remove moderator"
                          >
                            ✕
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {isOwner && (
                <>
                  <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <h3 className="text-sm font-bold">⛔ Banned accounts</h3>
                    <p className="mt-1 text-xs text-zinc-400">
                      {data.bans === 0
                        ? "No bans on record."
                        : `${data.bans} account${data.bans === 1 ? " has" : "s have"} been permanently banned and deleted. Their usernames (and guest IP addresses) stay blocked from rejoining.`}
                    </p>
                    {data.bans > 0 && (
                      <button
                        disabled={busy}
                        onClick={() =>
                          act(
                            { action: "lift_bans" },
                            "Lift every ban? Banned usernames and IP addresses will be able to join again. Deleted accounts are not restored.",
                          )
                        }
                        className="btn-ghost mt-3 !px-3 !py-1.5 text-xs"
                      >
                        🔓 Lift all bans
                      </button>
                    )}
                  </section>

                  <section className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.05] p-4">
                    <h3 className="text-sm font-bold text-rose-200">🧹 Clear chat</h3>
                    <p className="mt-1 text-xs text-zinc-400">Removes every message for everyone. This can&apos;t be undone.</p>
                    <div className="mt-3 flex gap-2">
                      <input
                        className="input !py-1.5 text-sm"
                        placeholder="Reason (optional)"
                        value={clearReason}
                        maxLength={200}
                        onChange={(e) => setClearReason(e.target.value)}
                      />
                      <button
                        disabled={busy}
                        onClick={() => act({ action: "clear_chat", reason: clearReason }, "Clear the entire chat for everyone?")}
                        className="shrink-0 rounded-xl bg-rose-500/90 px-3 text-sm font-semibold text-white hover:bg-rose-500 disabled:opacity-50"
                      >
                        Clear
                      </button>
                    </div>
                  </section>

                  <section>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Moderation log</h3>
                    {data.log.length === 0 ? (
                      <p className="text-sm text-zinc-500">No actions yet.</p>
                    ) : (
                      <ul className="space-y-1.5 text-sm">
                        {data.log.map((l) => (
                          <li key={l.id} className="rounded-lg bg-white/[0.03] px-3 py-2">
                            <span className="font-semibold text-orange-200">{l.actor ?? "Someone"}</span>{" "}
                            <span className="text-zinc-300">{ACTION_LABEL[l.action] ?? l.action}</span>{" "}
                            {l.target && <span className="font-semibold">{l.target}</span>}
                            {l.until && <span className="text-zinc-400"> ({until(l.until)})</span>}
                            {l.reason && <span className="text-zinc-400"> — {l.reason}</span>}
                            <span className="float-right text-[11px] text-zinc-600">
                              {new Date(l.createdAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
