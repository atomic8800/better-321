"use client";

import { SessionGate } from "@/components/SessionGate";
import { TopNav } from "@/components/TopNav";
import { ChatRoom } from "@/components/ChatRoom";
import { KickedScreen } from "@/components/KickedScreen";
import type { SelfUser } from "@/lib/types";

export function ChatShell({ initialUser }: { initialUser: SelfUser | null }) {
  return (
    <SessionGate initialUser={initialUser}>
      {(me, setMe) =>
        me.kickedUntil && new Date(me.kickedUntil).getTime() > Date.now() ? (
          <KickedScreen me={me} />
        ) : (
          <div className="flex h-screen flex-col">
            <TopNav me={me} />
            <ChatRoom me={me} setMe={setMe} />
          </div>
        )
      }
    </SessionGate>
  );
}
