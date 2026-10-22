"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { SelfUser } from "@/lib/types";
import { useSession, type SessionState, type SetMe } from "@/components/useSession";

export function SessionGate({
  initialUser,
  children,
}: {
  initialUser: SelfUser | null;
  children: (me: SelfUser, setMe: SetMe) => ReactNode;
}) {
  const [session, setMe] = useSession(initialUser);
  if (session.status === "ready") return <>{children(session.me, setMe)}</>;
  return <SessionFallback state={session} />;
}

export function SessionFallback({ state }: { state: SessionState }) {
  if (state.status === "loading") {
    return (
      <main className="grid min-h-screen place-items-center">
        <div className="flex items-center gap-3 text-zinc-400">
          <span className="h-3 w-3 animate-ping rounded-full bg-orange-400" />
          Connecting…
        </div>
      </main>
    );
  }
  return (
    <main className="grid min-h-screen place-items-center px-6">
      <div className="glass rounded-3xl p-10 text-center">
        <p className="text-5xl">🔑</p>
        <h1 className="mt-4 text-2xl font-black">You&apos;re not signed in</h1>
        <p className="mt-2 text-sm text-zinc-400">Join as a guest or log in to enter the chat.</p>
        <Link href="/" className="btn-primary mt-6 inline-block">
          Go to the entrance
        </Link>
      </div>
    </main>
  );
}
