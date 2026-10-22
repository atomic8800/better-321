"use client";

import Link from "next/link";
import { TopNav } from "@/components/TopNav";
import { ProfileCard } from "@/components/ProfileCard";
import { useSession } from "@/components/useSession";
import { FriendButton } from "@/components/FriendButton";
import { GiftButton } from "@/components/economy/GiftModal";
import type { PublicUser, SelfUser } from "@/lib/types";

export function PublicProfileShell({
  initialViewer,
  user,
  online,
}: {
  initialViewer: SelfUser | null;
  user: PublicUser;
  online: boolean;
}) {
  const [session] = useSession(initialViewer);
  const me = session.status === "ready" ? session.me : null;

  return (
    <div className="min-h-screen">
      {me ? (
        <TopNav me={me} />
      ) : (
        <header className="sticky top-0 z-30 border-b border-white/5 bg-[#0d0906]/80 backdrop-blur">
          <div className="mx-auto flex h-14 w-full max-w-[1400px] items-center justify-between px-4">
            <Link href="/" className="flex items-center gap-2 text-lg font-black tracking-tight">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Better321 logo" className="h-9 w-9 object-contain" />
              <span>
                Better<span className="text-orange-400">321</span>
              </span>
            </Link>
            <Link href="/" className="btn-primary !px-3 !py-1.5 text-sm">
              Join the chat
            </Link>
          </div>
        </header>
      )}
      <main className="mx-auto w-full max-w-3xl px-4 py-6">
        <Link href="/chat" className="text-sm text-zinc-400 hover:text-zinc-200">
          ← Back to chat
        </Link>
        <div className="glass mt-4 overflow-hidden rounded-3xl bg-[#140d08]">
          <ProfileCard
            user={user}
            online={online}
            isMe={me?.id === user.id}
            autoPlayMusic
            large
            actions={
              me && me.role !== "guest" && user.role !== "guest" && me.id !== user.id ? (
                <>
                  <FriendButton userId={user.id} />
                  <GiftButton recipient={user} />
                  <Link href={`/chat?dm=${user.username}`} className="btn-ghost !px-3 !py-1.5 text-xs">
                    💬 Message
                  </Link>
                </>
              ) : null
            }
          />
        </div>
      </main>
    </div>
  );
}
