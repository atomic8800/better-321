"use client";

import { useMemo, useState } from "react";
import { apiFetch } from "@/lib/client";
import { LIMITS_BY_RANK, PERMANENT_MINUTES, formatDuration, isPermanent } from "@/lib/moderation";
import type { PublicUser, SelfUser } from "@/lib/types";

type Preset = { label: string; minutes: number };

const MUTE_PRESETS: Preset[] = [
  { label: "5m", minutes: 5 },
  { label: "15m", minutes: 15 },
  { label: "1h", minutes: 60 },
  { label: "6h", minutes: 360 },
  { label: "12h", minutes: 720 },
  { label: "1 day", minutes: 1440 },
];
const KICK_PRESETS: Preset[] = [
  { label: "10m", minutes: 10 },
  { label: "1h", minutes: 60 },
  { label: "1 day", minutes: 1440 },
  { label: "3 days", minutes: 4320 },
  { label: "7 days", minutes: 10080 },
];
const OWNER_EXTRA: Preset[] = [
  { label: "30 days", minutes: 43200 },
  { label: "1 year", minutes: 525600 },
  { label: "Permanent", minutes: PERMANENT_MINUTES },
];

export function canModerateClient(me: PublicUser, target: PublicUser): boolean {
  if (me.id === target.id || target.rank === "owner") return false;
  if (me.rank === "owner") return true;
  return me.rank === "moderator" && target.rank === "user";
}

function untilText(iso: string | null) {
  if (!iso) return "";
  if (isPermanent(iso)) return "permanently";
  return `until ${new Date(iso).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}`;
}

export function ModPanel({
  me,
  target,
  onUpdated,
  onDeleted,
}: {
  me: SelfUser;
  target: PublicUser;
  onUpdated: (u: PublicUser) => void;
  onDeleted?: (userId: number) => void;
}) {
  const isOwner = me.rank === "owner";
  const canMod = canModerateClient(me, target);
  const canChangeRank = isOwner && target.id !== me.id && target.rank !== "owner" && target.role === "member";
  if (!canMod && !canChangeRank) return null;

  return (
    <section className="mx-5 mb-6 rounded-2xl border border-orange-500/25 bg-orange-500/[0.06] p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-orange-200">{isOwner ? "👑 Owner tools" : "🛡️ Moderator tools"}</h3>
        <span className="text-[10px] uppercase tracking-wider text-zinc-500">only staff see this</span>
      </div>

      {canChangeRank && <RankControl target={target} onUpdated={onUpdated} />}

      {canMod && (
        <>
          <ActionBox kind="mute" me={me} target={target} onUpdated={onUpdated} />
          <ActionBox kind="kick" me={me} target={target} onUpdated={onUpdated} onDeleted={onDeleted} />
        </>
      )}

      {!isOwner && (
        <p className="mt-3 text-[11px] leading-relaxed text-zinc-500">
          Moderators can mute for up to {formatDuration(LIMITS_BY_RANK.moderator.muteMaxMinutes)} and kick for up to{" "}
          {formatDuration(LIMITS_BY_RANK.moderator.kickMaxMinutes)}. A reason is required for kicks.
        </p>
      )}
    </section>
  );
}

function RankControl({ target, onUpdated }: { target: PublicUser; onUpdated: (u: PublicUser) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMod = target.rank === "moderator";

  async function run() {
    setBusy(true);
    setError(null);
    const res = await apiFetch("/api/mod", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: isMod ? "demote" : "promote", targetId: target.id }),
    });
    const data = (await res.json().catch(() => ({}))) as { user?: PublicUser; error?: string };
    setBusy(false);
    if (!res.ok) return setError(data.error ?? "Failed.");
    if (data.user) onUpdated(data.user);
  }

  return (
    <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 p-3">
      <div className="text-sm">
        <p className="font-semibold">Moderator rank</p>
        <p className="text-xs text-zinc-400">
          {isMod ? `${target.displayName} is a moderator.` : `Give ${target.displayName} moderator powers.`}
        </p>
        {error && <p className="mt-1 text-xs text-rose-300">{error}</p>}
      </div>
      <button onClick={run} disabled={busy} className={isMod ? "btn-ghost !px-3 !py-1.5 text-xs" : "btn-primary !px-3 !py-1.5 text-xs"}>
        {busy ? "…" : isMod ? "Remove mod" : "🛡️ Make mod"}
      </button>
    </div>
  );
}

function ActionBox({
  kind,
  me,
  target,
  onUpdated,
  onDeleted,
}: {
  kind: "mute" | "kick";
  me: SelfUser;
  target: PublicUser;
  onUpdated: (u: PublicUser) => void;
  onDeleted?: (userId: number) => void;
}) {
  const isOwner = me.rank === "owner";
  const limits = LIMITS_BY_RANK[isOwner ? "owner" : "moderator"];
  const maxMinutes = kind === "mute" ? limits.muteMaxMinutes : limits.kickMaxMinutes;
  const reasonRequired = kind === "kick" && limits.kickReasonRequired;

  const presets = useMemo(
    () => [...(kind === "mute" ? MUTE_PRESETS : KICK_PRESETS), ...(isOwner ? OWNER_EXTRA : [])],
    [kind, isOwner],
  );

  const [minutes, setMinutes] = useState<number>(kind === "mute" ? 15 : 60);
  const [customValue, setCustomValue] = useState("");
  const [customUnit, setCustomUnit] = useState<"m" | "h" | "d">("m");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const usingCustom = customValue.trim() !== "";
  const effectiveMinutes = usingCustom
    ? Math.round(Number(customValue) * (customUnit === "m" ? 1 : customUnit === "h" ? 60 : 1440))
    : minutes;

  const active = kind === "mute" ? target.mutedUntil : null;
  const banDelete = kind === "kick" && effectiveMinutes === PERMANENT_MINUTES;

  async function post(action: string, extra: Record<string, unknown> = {}) {
    setBusy(true);
    setError(null);
    setOk(null);
    const res = await apiFetch("/api/mod", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, targetId: target.id, ...extra }),
    });
    const data = (await res.json().catch(() => ({}))) as { user?: PublicUser; deleted?: boolean; error?: string };
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Failed.");
      return false;
    }
    if (data.deleted) {
      onDeleted?.(target.id);
      return true;
    }
    if (data.user) onUpdated(data.user);
    return true;
  }

  async function submit() {
    if (effectiveMinutes !== PERMANENT_MINUTES) {
      if (!Number.isFinite(effectiveMinutes) || effectiveMinutes < 1) return setError("Enter a valid duration.");
      if (effectiveMinutes > maxMinutes) return setError(`Max ${kind} length for your rank is ${formatDuration(maxMinutes)}.`);
    }
    if (reasonRequired && reason.trim().length < 3) return setError("Please give a reason (at least 3 characters).");
    if (
      banDelete &&
      !window.confirm(
        `Permanently ban ${target.displayName}?\n\nTheir account will be deleted along with their messages, DMs, friends and wall posts. Their username${
          target.role === "guest" ? " and IP address" : ""
        } will stay blocked. This can't be undone.`,
      )
    ) {
      return;
    }
    const done = await post(kind, { minutes: effectiveMinutes, reason });
    if (done) {
      setOk(
        `${target.displayName} was ${kind === "kick" ? (effectiveMinutes === PERMANENT_MINUTES ? "banned" : "kicked") : "muted"} ${
          effectiveMinutes === PERMANENT_MINUTES ? "permanently" : `for ${formatDuration(effectiveMinutes)}`
        }.`,
      );
      setReason("");
    }
  }

  return (
    <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">{kind === "mute" ? "🔇 Mute" : "🚫 Kick"}</p>
        {active && (
          <button onClick={() => post("unmute")} disabled={busy} className="text-xs text-emerald-300 hover:underline">
            Unmute (muted {untilText(active)})
          </button>
        )}
      </div>
      <p className="text-[11px] text-zinc-500">
        {kind === "mute"
          ? "They can still read the chat but can't send messages."
          : isOwner
            ? "Removes them from the chat until the time runs out. Permanent bans delete the account."
            : "Removes them from the chat until the time runs out."}
      </p>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {presets
          .filter((p) => p.minutes === PERMANENT_MINUTES || p.minutes <= maxMinutes)
          .map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => {
                setMinutes(p.minutes);
                setCustomValue("");
              }}
              className={`rounded-lg px-2 py-1 text-xs transition ${
                !usingCustom && minutes === p.minutes
                  ? p.minutes === PERMANENT_MINUTES
                    ? "bg-rose-500 text-white"
                    : "bg-orange-500 text-black"
                  : "bg-white/5 text-zinc-300 hover:bg-white/10"
              }`}
            >
              {p.label}
            </button>
          ))}
      </div>

      <div className="mt-2 flex gap-2">
        <input
          className="input !py-1.5 text-sm"
          type="number"
          min={1}
          placeholder="Custom"
          value={customValue}
          onChange={(e) => setCustomValue(e.target.value)}
        />
        <select
          className="input !w-28 !py-1.5 text-sm"
          value={customUnit}
          onChange={(e) => setCustomUnit(e.target.value as "m" | "h" | "d")}
        >
          <option value="m">minutes</option>
          <option value="h">hours</option>
          <option value="d">days</option>
        </select>
      </div>

      <textarea
        className="input mt-2 min-h-[56px] resize-y !py-1.5 text-sm"
        placeholder={reasonRequired ? "Reason (required)" : "Reason (optional)"}
        value={reason}
        maxLength={200}
        onChange={(e) => setReason(e.target.value)}
      />

      {error && <p className="mt-2 text-xs text-rose-300">{error}</p>}
      {ok && <p className="mt-2 text-xs text-emerald-300">{ok}</p>}

      <button
        onClick={submit}
        disabled={busy}
        className={`mt-2 w-full rounded-xl px-3 py-2 text-sm font-semibold transition disabled:opacity-50 ${
          kind === "kick" ? "bg-rose-500/90 text-white hover:bg-rose-500" : "bg-amber-400/90 text-black hover:bg-amber-400"
        }`}
      >
        {busy
          ? "Working…"
          : banDelete
            ? `⛔ Ban & delete ${target.displayName}'s account`
            : `${kind === "mute" ? "Mute" : effectiveMinutes === PERMANENT_MINUTES ? "Ban" : "Kick"} ${target.displayName} ${
              effectiveMinutes === PERMANENT_MINUTES
                ? "permanently"
                : Number.isFinite(effectiveMinutes) && effectiveMinutes > 0
                  ? `for ${formatDuration(effectiveMinutes)}`
                  : ""
            }`}
      </button>
    </div>
  );
}
