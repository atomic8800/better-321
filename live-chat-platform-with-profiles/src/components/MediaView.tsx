"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import type { Attachment } from "@/lib/types";

export function MediaView({ media, className = "", fill = false }: { media: Attachment; className?: string; fill?: boolean }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (media.type === "video") {
    return (
      <video
        src={media.url}
        controls
        preload="metadata"
        playsInline
        className={`${fill ? "h-full w-full object-cover" : "max-h-80 max-w-full"} rounded-xl border border-white/10 bg-black ${className}`}
      />
    );
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={`block overflow-hidden rounded-xl border border-white/10 ${fill ? "h-full w-full" : ""} ${className}`}>
        <img
          src={media.url}
          alt="Shared image"
          loading="lazy"
          className={`${fill ? "h-full w-full object-cover" : "max-h-80 max-w-full object-contain"} transition hover:opacity-90`}
        />
      </button>
      {open && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/85 p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <img src={media.url} alt="Shared image" className="max-h-[90vh] max-w-[95vw] rounded-xl object-contain shadow-2xl" />
          <div className="absolute right-4 top-4 flex gap-2">
            <a
              href={media.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="btn-ghost !px-3 !py-1.5 text-xs"
            >
              Open original ↗
            </a>
            <button className="btn-ghost !px-3 !py-1.5 text-xs">✕</button>
          </div>
        </div>
      )}
    </>
  );
}
