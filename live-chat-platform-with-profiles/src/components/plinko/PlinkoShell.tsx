"use client";

import Link from "next/link";
import { SessionGate } from "@/components/SessionGate";
import { TopNav } from "@/components/TopNav";
import { KickedScreen } from "@/components/KickedScreen";
import { PlinkoGame } from "@/components/plinko/PlinkoGame";
import type { SelfUser } from "@/lib/types";

export function PlinkoShell({ initialUser }: { initialUser: SelfUser | null }) {
  return (
    <SessionGate initialUser={initialUser}>
      {(me) =>
        me.kickedUntil && new Date(me.kickedUntil).getTime() > Date.now() ? (
          <KickedScreen me={me} />
        ) : (
          <div className="min-h-screen">
            <TopNav me={me} />
            <main className="mx-auto w-full max-w-6xl px-3 py-4 sm:px-4">
              {me.role === "guest" ? (
                <div className="glass mx-auto mt-10 max-w-md rounded-3xl p-8 text-center">
                  <p className="text-4xl">🎰</p>
                  <h1 className="mt-3 text-2xl font-black">Plinko is for members</h1>
                  <p className="mt-2 text-sm text-zinc-400">
                    Create a free account to get 500 coins, earn more every minute you&apos;re online, play Plinko and send gifts.
                  </p>
                  <Link href="/profile" className="btn-primary mt-5 inline-block">
                    Create account →
                  </Link>
                </div>
              ) : (
                <PlinkoGame />
              )}
            </main>
          </div>
        )
      }
    </SessionGate>
  );
}
