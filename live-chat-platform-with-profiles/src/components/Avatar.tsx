/* eslint-disable @next/next/no-img-element */
type Props = {
  src: string | null;
  name: string;
  accent?: string;
  size?: number;
  className?: string;
  online?: boolean;
};

export function Avatar({ src, name, accent = "#fb923c", size = 40, className = "", online }: Props) {
  const initial = (name.trim()[0] ?? "?").toUpperCase();
  return (
    <span
      className={`relative inline-block shrink-0 ${className}`}
      style={{ width: size, height: size }}
      aria-label={name}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          className="h-full w-full rounded-full object-cover ring-2"
          style={{ ["--tw-ring-color" as string]: `${accent}66` }}
          draggable={false}
        />
      ) : (
        <span
          className="flex h-full w-full items-center justify-center rounded-full font-bold text-white"
          style={{
            background: `linear-gradient(135deg, ${accent}, ${accent}88)`,
            fontSize: Math.max(12, size * 0.42),
          }}
        >
          {initial}
        </span>
      )}
      {online && (
        <span
          className="online-dot absolute bottom-0 right-0 block rounded-full border-2 border-[#140d08] bg-emerald-400"
          style={{ width: Math.max(10, size * 0.28), height: Math.max(10, size * 0.28) }}
        />
      )}
    </span>
  );
}
