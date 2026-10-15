import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";

export async function memoryScope(create = false) {
  const jar = await cookies();
  const existing = jar.get("stroy-memory")?.value;
  if (existing && /^[a-f0-9]{64}$/.test(existing)) return existing;
  if (!create) return null;
  const scope = randomBytes(32).toString("hex");
  jar.set("stroy-memory", scope, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return scope;
}
