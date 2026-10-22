"use client";

import Link from "next/link";
import { SessionGate } from "@/components/SessionGate";
import { TopNav } from "@/components/TopNav";
import { AuthPanel } from "@/components/AuthPanel";
import { ProfileEditor } from "@/components/ProfileEditor";
import type { SelfUser } from "@/lib/types";

export function ProfileShell({ initialUser }: { initialUser: SelfUser | null }) {
  return (
    <SessionGate initialUser={initialUser}>
      {(me, setMe) => (
        <div className="min-h-screen">
          <TopNav me={me} />
          <main className="mx-auto w-full max-w-5xl px-4 py-6">
            <Link href="/chat" className="text-sm text-zinc-400 hover:text-zinc-200">
              ← Back to chat
            </Link>
            {me.role === "guest" ? (
              <div className="mt-6 grid gap-8 lg:grid-cols-2">
                <div>
                  <h1 className="text-3xl font-black tracking-tight">You&apos;re a guest, {me.displayName}</h1>
                  <p className="mt-3 text-zinc-400">
                    Guests can chat and browse profiles, but profile customisation is for members. Create a free
                    account right here — your guest chat history comes with you.
                  </p>
                  <ul className="mt-6 space-y-2 text-sm text-zinc-300">
                    <li>🖼️ Upload a profile picture and banner</li>
                    <li>🎵 Add profile music that plays on your page</li>
                    <li>🏷️ Tag your age, gender, pronouns, country and sexuality</li>
                    <li>🎨 Pick an accent colour for your name</li>
                  </ul>
                </div>
                <AuthPanel upgrade />
              </div>
            ) : (
              <ProfileEditor key={me.id} initial={me} onSaved={setMe} />
            )}
          </main>
        </div>
      )}
    </SessionGate>
  );
}
