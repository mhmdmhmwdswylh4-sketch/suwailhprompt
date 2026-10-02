export const CATEGORIES = [
  "general",
  "coding",
  "website",
  "mobile",
  "image",
  "video",
  "marketing",
  "business",
  "research",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const MAX_IDEA_LENGTH = 2000;
export const MIN_IDEA_LENGTH = 3;

export function isCategory(v: unknown): v is Category {
  return typeof v === "string" && (CATEGORIES as readonly string[]).includes(v);
}
