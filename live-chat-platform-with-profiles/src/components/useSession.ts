"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, clearToken, getToken } from "@/lib/client";
import type { PublicUser, SelfUser } from "@/lib/types";

export type SessionState =
  | { status: "loading"; me: null }
  | { status: "ready"; me: SelfUser }
  | { status: "anonymous"; me: null };

export type SetMe = (u: PublicUser | SelfUser) => void;

/**
 * Resolves the signed-in user. If the server already identified the user
 * (via cookie) we use that immediately; otherwise we fall back to the
 * token stored in localStorage and ask /api/me.
 */
export function useSession(initialUser: SelfUser | null): [SessionState, SetMe] {
  const [state, setState] = useState<SessionState>(
    initialUser ? { status: "ready", me: initialUser } : { status: "loading", me: null },
  );

  useEffect(() => {
    if (initialUser) return;
    let cancelled = false;
    if (!getToken()) {
      setState({ status: "anonymous", me: null });
      return;
    }
    apiFetch("/api/me")
      .then(async (res) => {
        if (cancelled) return;
        if (res.ok) {
          const data = (await res.json()) as { user: SelfUser };
          setState({ status: "ready", me: data.user });
        } else {
          clearToken();
          setState({ status: "anonymous", me: null });
        }
      })
      .catch(() => {
        if (!cancelled) setState({ status: "anonymous", me: null });
      });
    return () => {
      cancelled = true;
    };
  }, [initialUser]);

  const setMe = useCallback<SetMe>((u) => {
    setState((prev) => {
      const base: SelfUser = prev.me ?? { ...u, muteReason: null, kickedUntil: null, kickReason: null, coins: 0 };
      return { status: "ready", me: { ...base, ...u } };
    });
  }, []);
  return [state, setMe];
}
