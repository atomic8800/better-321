"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/client";
import type { FriendStatus } from "@/lib/types";

export function FriendButton({ userId, onChange }: { userId: number; onChange?: (s: FriendStatus) => void }) {
  const [status, setStatus] = useState<FriendStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setStatus(null);
    apiFetch(`/api/friends/status?userId=${userId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { status: FriendStatus } | null) => !cancelled && d && setStatus(d.status))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [userId]);

  async function act(action: string, confirmText?: string) {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusy(true);
    setError(null);
    const res = await apiFetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, userId }),
    });
    const data = (await res.json().catch(() => ({}))) as { status?: FriendStatus; error?: string };
    setBusy(false);
    if (!res.ok) return setError(data.error ?? "Failed");
    if (data.status) {
      setStatus(data.status);
      onChange?.(data.status);
    }
  }

  if (!status || status === "self") return null;
  const cls = "!px-3 !py-1.5 text-xs";

  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      {status === "none" && (
        <button disabled={busy} onClick={() => act("request")} className={`btn-primary ${cls}`}>
          ➕ Add friend
        </button>
      )}
      {status === "outgoing" && (
        <button disabled={busy} onClick={() => act("cancel")} className={`btn-ghost ${cls}`} title="Cancel request">
          ⏳ Request sent
        </button>
      )}
      {status === "incoming" && (
        <>
          <button disabled={busy} onClick={() => act("accept")} className={`btn-primary ${cls}`}>
            ✓ Accept
          </button>
          <button disabled={busy} onClick={() => act("decline")} className={`btn-ghost ${cls}`}>
            Decline
          </button>
        </>
      )}
      {status === "friends" && (
        <button
          disabled={busy}
          onClick={() => act("remove", "Remove this friend?")}
          className={`btn-ghost ${cls} hover:!border-rose-400/40 hover:!text-rose-200`}
          title="Click to remove friend"
        >
          🤝 Friends
        </button>
      )}
      {error && <span className="text-[11px] text-rose-300">{error}</span>}
    </span>
  );
}
