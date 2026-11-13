import { afterEach, describe, expect, it, vi } from "vitest";
import { lookupRobloxProfile } from "./roblox-lookup.server";

afterEach(() => vi.unstubAllGlobals());
const response = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status });

describe("Roblox lookup", () => {
  it("uses official GET fallback after POST rate limiting and selects the exact nick", async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(response({}, 429))
      .mockResolvedValueOnce(response({ data: [
        { id: 999, name: "buildermanFan", displayName: "builderman" },
        { id: 156, name: "builderman", displayName: "builderman" },
      ] }))
      .mockResolvedValueOnce(response({ data: [{ imageUrl: "https://tr.rbxcdn.com/avatar.png" }] }));
    vi.stubGlobal("fetch", fetcher);
    const result = await lookupRobloxProfile("Builderman");
    expect(result.profile?.id).toBe(156);
    expect(result.profile?.name).toBe("builderman");
    expect(fetcher.mock.calls[1]?.[0]).toContain("users.roblox.com/v1/users/search");
    await lookupRobloxProfile("BUILDERMAN");
    expect(fetcher).toHaveBeenCalledTimes(3);
  });

  it("does not return a similar account or a matching display name", async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(response({}, 429))
      .mockResolvedValueOnce(response({ data: [{ id: 999, name: "ExactNickFan", displayName: "ExactNick" }] }))
      .mockResolvedValueOnce(response({}, 404))
      .mockResolvedValueOnce(response({ data: [] }));
    vi.stubGlobal("fetch", fetcher);
    expect(await lookupRobloxProfile("ExactNick")).toEqual({ profile: null });
  });

  it("verifies the canonical profile redirect against official account details", async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(response({}, 429))
      .mockResolvedValueOnce(response({}, 429))
      .mockResolvedValueOnce(new Response(null, { status: 302, headers: { location: "https://www.roblox.com/users/1/profile" } }))
      .mockResolvedValueOnce(response({ id: 1, name: "Roblox", displayName: "Roblox" }))
      .mockResolvedValueOnce(response({}, 429));
    vi.stubGlobal("fetch", fetcher);
    const result = await lookupRobloxProfile("Roblox");
    expect(result.profile).toEqual({ id: 1, name: "Roblox", displayName: "Roblox", avatar: null });
  });

  it("reports unavailable rather than not-found when all providers rate limit", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({}, 429)));
    const result = await lookupRobloxProfile("UnavailableNick");
    expect(result.profile).toBeNull();
    expect(result.error).toBeDefined();
  });

  it("confirms MaguinSupremo on the official profile page when API requests are rate limited", async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(response({}, 429))
      .mockResolvedValueOnce(response({}, 429))
      .mockResolvedValueOnce(new Response(null, { status: 302, headers: { location: "https://www.roblox.com/users/9547621244/profile" } }))
      .mockResolvedValueOnce(response({}, 429))
      .mockResolvedValueOnce(new Response('<head><title>SantaUndeny - Roblox</title><meta property="og:title" content="MaguinSupremo&#x27;s Profile"></head>', { headers: { "content-type": "text/html" } }))
      .mockResolvedValueOnce(response({}, 429));
    vi.stubGlobal("fetch", fetcher);
    expect((await lookupRobloxProfile("maguinsupremo")).profile).toEqual({ id: 9547621244, name: "MaguinSupremo", displayName: "SantaUndeny", avatar: null });
  });

  it("rejects official page metadata belonging to a different username", async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(response({}, 429))
      .mockResolvedValueOnce(response({}, 429))
      .mockResolvedValueOnce(new Response(null, { status: 302, headers: { location: "/users/456/profile" } }))
      .mockResolvedValueOnce(response({}, 429))
      .mockResolvedValueOnce(new Response('<head><title>PageExactNick - Roblox</title><meta property="og:title" content="PageExactNickFan&#39;s Profile"></head>', { headers: { "content-type": "text/html" } }))
      .mockResolvedValueOnce(response({}, 429));
    vi.stubGlobal("fetch", fetcher);
    expect((await lookupRobloxProfile("PageExactNick")).profile).toBeNull();
  });
});