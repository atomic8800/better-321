"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  src: string;
  title: string;
  accent: string;
  autoPlay?: boolean;
  compact?: boolean;
};

function fmt(s: number) {
  if (!Number.isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export function MusicPlayer({ src, title, accent, autoPlay = false, compact = false }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.volume = 0.6;
    if (autoPlay) {
      a.play()
        .then(() => setBlocked(false))
        .catch(() => setBlocked(true));
    }
  }, [autoPlay, src]);

  function toggle() {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      a.play()
        .then(() => setBlocked(false))
        .catch(() => setBlocked(true));
    } else {
      a.pause();
    }
  }

  const pct = duration ? (time / duration) * 100 : 0;

  return (
    <div
      className={`rounded-2xl border border-white/10 bg-white/[0.04] ${compact ? "p-3" : "p-4"}`}
      style={{ boxShadow: playing ? `0 0 0 1px ${accent}55, 0 10px 40px ${accent}22` : undefined }}
    >
      <audio
        ref={audioRef}
        src={src}
        loop
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
      />
      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-lg text-white shadow-lg transition hover:scale-105"
          style={{ background: `linear-gradient(135deg, ${accent}, ${accent}99)` }}
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? "❚❚" : "▶"}
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`text-base ${playing ? "animate-pulse" : ""}`} aria-hidden>
              🎵
            </span>
            <p className="truncate text-sm font-semibold">{title}</p>
          </div>
          <div
            className="mt-2 h-1.5 w-full cursor-pointer overflow-hidden rounded-full bg-white/10"
            onClick={(e) => {
              const a = audioRef.current;
              if (!a || !duration) return;
              const rect = e.currentTarget.getBoundingClientRect();
              a.currentTime = ((e.clientX - rect.left) / rect.width) * duration;
            }}
          >
            <div className="h-full rounded-full transition-[width]" style={{ width: `${pct}%`, background: accent }} />
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-zinc-500">
            <span>{fmt(time)}</span>
            <span>{fmt(duration)}</span>
          </div>
        </div>
      </div>
      {blocked && !playing && (
        <p className="mt-2 text-[11px] text-zinc-500">Press play to hear this profile&apos;s song.</p>
      )}
    </div>
  );
}
