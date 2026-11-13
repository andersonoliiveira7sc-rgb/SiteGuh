import { createServerFn } from "@tanstack/react-start";
import { lookupRobloxProfile } from "./roblox-lookup.server";

export type RobloxProfile = { id: number; name: string; displayName: string; avatar: string | null };

export const findRobloxUser = createServerFn({ method: "POST" })
  .validator((input: { username: string }) => {
    const u = String(input?.username ?? "").trim();
    if (!/^[A-Za-z0-9_]{3,20}$/.test(u)) throw new Error("Nick inválido");
    return { username: u };
  })
  .handler(async ({ data }): Promise<{ profile: RobloxProfile | null; error?: string }> => {
    return lookupRobloxProfile(data.username);
  });
