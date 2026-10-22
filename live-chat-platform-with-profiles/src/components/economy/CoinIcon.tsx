export function CoinIcon({ size = 18, className = "" }: { size?: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-block shrink-0 rounded-full ${className}`}
      style={{
        width: size,
        height: size,
        background: "radial-gradient(circle at 35% 30%, #fff3b0 0%, #f5c84c 35%, #d99a1e 70%, #a8700f 100%)",
        boxShadow: "inset 0 -1px 2px rgba(0,0,0,0.35), 0 0 6px rgba(245,200,76,0.35)",
      }}
    />
  );
}
