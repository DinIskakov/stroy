import { z } from "zod";
import type { Profile } from "./data";
export const profileSchema = z.object({
  id: z.string().min(1).max(80),
  name: z.string().min(1).max(80),
  relation: z.string().max(60),
  initials: z.string().max(4),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  occasion: z.string().min(1).max(60),
  date: z.iso.date(),
  address: z.string().max(500).optional(),
  birthday: z.iso.date().or(z.literal("")).optional(),
  budget: z.number().int().min(100).max(100000),
  notes: z.string().min(5).max(3000),
  dislikes: z.array(z.string().min(1).max(80)).max(20),
  owned: z.array(z.string().min(1).max(80)).max(20),
  interests: z.array(z.string().max(80)).max(10),
});

export function prepareProfile(profile: Profile): Profile | null {
  const clean = (items: string[]) => items.map((s) => s.trim()).filter(Boolean);
  const parsed = profileSchema.safeParse({
    ...profile,
    name: profile.name.trim(),
    dislikes: clean(profile.dislikes),
    owned: clean(profile.owned),
    interests: clean(profile.interests),
    initials: profile.name
      .trim()
      .split(/\s+/)
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase(),
  });
  return parsed.success ? parsed.data : null;
}
