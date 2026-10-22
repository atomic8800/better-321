/** Client-safe economy constants & helpers. Balances are stored in hundredths of a coin. */
export const CENTS = 100;
export const STARTING_COINS = 500;
export const INCOME_PER_MINUTE = 5;
export const INCOME_MAX_CATCHUP_MINUTES = 3;
export const DAILY_BONUS = 250;
export const DAILY_COOLDOWN_HOURS = 24;
export const GIFT_MESSAGE_MAX = 100;

export const GIFTS = [
  { key: "heart", name: "Heart", price: 10, image: "/gifts/heart.png", emoji: "❤️" },
  { key: "donut", name: "Donut", price: 25, image: "/gifts/donut.png", emoji: "🍩" },
  { key: "beer", name: "Beer", price: 50, image: "/gifts/beer.png", emoji: "🍺" },
  { key: "kiss", name: "Kiss", price: 100, image: "/gifts/kiss.png", emoji: "💋" },
] as const;

export type GiftKey = (typeof GIFTS)[number]["key"];
export type GiftDef = (typeof GIFTS)[number];

export function giftByKey(key: string): GiftDef | undefined {
  return GIFTS.find((g) => g.key === key);
}

/** Formats hundredths of a coin, e.g. 123450 -> "1,234.5". */
export function formatCoins(cents: number | null | undefined): string {
  if (cents == null || !Number.isFinite(cents)) return "—";
  return (cents / CENTS).toLocaleString(undefined, { maximumFractionDigits: 2 });
}
