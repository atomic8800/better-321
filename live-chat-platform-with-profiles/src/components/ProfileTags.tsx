import type { PublicUser } from "@/lib/types";
import type { Rank } from "@/lib/moderation";

type TagUser = Pick<PublicUser, "age" | "gender" | "pronouns" | "country" | "sexuality" | "role"> &
  Partial<Pick<PublicUser, "relationship">>;

export function RoleBadge({
  role,
  rank = "user",
  className = "",
}: {
  role: "guest" | "member";
  rank?: Rank;
  className?: string;
}) {
  const base = `rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide whitespace-nowrap ${className}`;
  if (rank === "owner") {
    return (
      <span
        className={`${base} border border-amber-300/60 bg-gradient-to-r from-amber-400 to-orange-500 text-black shadow-[0_0_12px_rgba(251,146,60,0.45)]`}
        title="Owner"
      >
        👑 Owner
      </span>
    );
  }
  if (rank === "moderator") {
    return (
      <span className={`${base} border border-sky-400/50 bg-sky-500/20 text-sky-200`} title="Moderator">
        🛡️ Mod
      </span>
    );
  }
  return role === "guest" ? (
    <span className={`${base} border border-zinc-500/40 bg-zinc-500/15 text-zinc-300`}>Guest</span>
  ) : (
    <span className={`${base} border border-orange-400/40 bg-orange-500/15 text-orange-200`}>Member</span>
  );
}

export function ProfileTags({ user, compact = false }: { user: TagUser; compact?: boolean }) {
  const tags: { icon: string; label: string; title: string }[] = [];
  if (user.age) tags.push({ icon: "🎂", label: String(user.age), title: "Age" });
  if (user.gender) tags.push({ icon: "✨", label: user.gender, title: "Gender" });
  if (user.pronouns) tags.push({ icon: "💬", label: user.pronouns, title: "Pronouns" });
  if (user.country) tags.push({ icon: "🌍", label: user.country, title: "Country" });
  if (user.sexuality) tags.push({ icon: "🏳️‍🌈", label: user.sexuality, title: "Sexuality" });
  if (user.relationship)
    tags.push({
      icon: "💞",
      label: compact ? user.relationship : `Relationship status: ${user.relationship}`,
      title: "Relationship status",
    });

  if (!tags.length) {
    return compact ? null : <p className="text-sm text-zinc-500">No tags yet.</p>;
  }

  return (
    <div className={`flex flex-wrap ${compact ? "gap-1" : "gap-2"}`}>
      {tags.map((t) => (
        <span
          key={t.title}
          title={t.title}
          className={`inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 text-zinc-200 ${
            compact ? "px-1.5 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"
          }`}
        >
          <span aria-hidden>{t.icon}</span>
          {t.label}
        </span>
      ))}
    </div>
  );
}
