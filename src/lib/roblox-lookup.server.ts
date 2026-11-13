export type RobloxProfile = { id: number; name: string; displayName: string; avatar: string | null };
type User = Omit<RobloxProfile, "avatar">;
type LookupResult = { profile: RobloxProfile | null; error?: string };
const HEADERS = { Accept: "application/json" };
const cache = new Map<string, { expires: number; result: LookupResult }>();

function exactUser(value: unknown, username: string): User | null {
  if (!value || typeof value !== "object") return null;
  const user = value as Partial<User>;
  if (typeof user.id !== "number" || !Number.isSafeInteger(user.id) || user.id <= 0 ||
      typeof user.name !== "string" || user.name.toLowerCase() !== username.toLowerCase() ||
      typeof user.displayName !== "string") return null;
  return { id: user.id, name: user.name, displayName: user.displayName };
}

async function request(url: string, init?: RequestInit) {
  try {
    const response = await fetch(url, { ...init, signal: AbortSignal.timeout(5000) });
    if (response.ok || (init?.redirect === "manual" && response.status >= 300 && response.status < 400)) return response;
    console.warn("Roblox lookup upstream", new URL(url).hostname, response.status);
  } catch {
    console.warn("Roblox lookup upstream unavailable", new URL(url).hostname);
  }
  return null;
}

async function json(url: string, init?: RequestInit): Promise<unknown> {
  const response = await request(url, init);
  if (!response) return null;
  try { return await response.json(); } catch { return null; }
}

function rows(value: unknown): unknown[] | null {
  if (!value || typeof value !== "object" || !("data" in value) || !Array.isArray(value.data)) return null;
  return value.data;
}

function decodeHtml(value: string): string {
  return value.replace(/&#(x[0-9a-f]+|\d+);|&(amp|quot|apos|lt|gt);/gi, (entity, numeric: string | undefined, named: string | undefined) => {
    if (numeric) {
      const code = numeric.toLowerCase().startsWith("x") ? parseInt(numeric.slice(1), 16) : parseInt(numeric, 10);
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : entity;
    }
    return ({ amp: "&", quot: '"', apos: "'", lt: "<", gt: ">" } as Record<string, string>)[named?.toLowerCase() ?? ""] ?? entity;
  });
}

async function officialProfilePage(id: string, username: string): Promise<User | null> {
  // The official website is reachable even when the users API blocks Worker IPs.
  // Confirm the exact username from Roblox's own metadata, never from the query.
  const response = await request(`https://www.roblox.com/users/${id}/profile`, { headers: { Accept: "text/html" }, redirect: "manual" });
  if (!response || !response.ok || !response.headers.get("content-type")?.includes("text/html")) return null;
  const reader = response.body?.getReader();
  if (!reader) return null;
  const decoder = new TextDecoder();
  let html = "";
  let bytes = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 512 * 1024) return null;
      html += decoder.decode(value, { stream: true });
      if (html.includes("</head>")) break;
    }
  } catch { return null; }
  finally { await reader.cancel().catch(() => undefined); }
  const tag = html.match(/<meta\b[^>]*\bproperty=["']og:title["'][^>]*>/i)?.[0];
  const title = tag?.match(/\bcontent="([^"]*)"/i)?.[1];
  const name = title ? decodeHtml(title).match(/^([A-Za-z0-9_]{3,20})'s Profile$/)?.[1] : null;
  const displayName = decodeHtml(html.match(/<title>([^<]*)<\/title>/i)?.[1] ?? "").replace(/ - Roblox$/, "").trim();
  if (!name || !displayName || displayName.length > 100) return null;
  return exactUser({ id: Number(id), name, displayName }, username);
}

async function lookup(username: string): Promise<{ user: User | null } | null> {
  const body = JSON.stringify({ usernames: [username], excludeBannedUsers: true });
  const init = { method: "POST", headers: { ...HEADERS, "Content-Type": "application/json" }, body };
  const primary = rows(await json("https://users.roblox.com/v1/usernames/users", init));
  if (primary) {
    if (primary.length === 0) return { user: null };
    const user = primary.map((row) => exactUser(row, username)).find((user) => user !== null);
    if (user) return { user };
  }

  // The GET search has a separate upstream limit. Never select a similar nickname.
  const search = rows(await json(`https://users.roblox.com/v1/users/search?keyword=${encodeURIComponent(username)}&limit=10`, { headers: HEADERS }));
  const match = search?.map((row) => exactUser(row, username)).find((user) => user !== null);
  if (match) return { user: match };

  // Roblox's canonical profile redirect supplies an ID, not an unverified display name.
  const redirect = await request(`https://www.roblox.com/users/profile?username=${encodeURIComponent(username)}`, { redirect: "manual" });
  if (redirect) {
    const location = redirect.headers.get("location");
    await redirect.body?.cancel();
    const destination = location ? new URL(location, "https://www.roblox.com") : null;
    const id = destination?.hostname === "www.roblox.com" ? destination.pathname.match(/^\/users\/(\d+)\/profile\/?$/)?.[1] : null;
    if (id) {
      const user = exactUser(await json(`https://users.roblox.com/v1/users/${id}`, { headers: HEADERS }), username);
      if (user) return { user };
      const pageUser = await officialProfilePage(id, username);
      if (pageUser) return { user: pageUser };
    }
  }
  const proxy = rows(await json("https://users.roproxy.com/v1/usernames/users", init));
  if (proxy) {
    if (proxy.length === 0) return { user: null };
    const user = proxy.map((row) => exactUser(row, username)).find((user) => user !== null);
    if (user) return { user };
  }
  return null;
}

export async function lookupRobloxProfile(username: string): Promise<LookupResult> {
  const key = username.toLowerCase();
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) return cached.result;
  const result = await lookup(username);
  if (!result) return { profile: null, error: "O Roblox está limitando as buscas no momento. Aguarde um pouco e tente novamente." };
  if (!result.user) return { profile: null };
  const user = result.user;
  const thumbnails = rows(await json(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${user.id}&size=150x150&format=Png&isCircular=false`, { headers: HEADERS }));
  const thumbnail = thumbnails?.[0];
  const avatar = thumbnail && typeof thumbnail === "object" && "imageUrl" in thumbnail && typeof thumbnail.imageUrl === "string" ? thumbnail.imageUrl : null;
  const value = { profile: { ...user, avatar } };
  if (cache.size >= 200) cache.clear();
  cache.set(key, { expires: Date.now() + 5 * 60 * 1000, result: value });
  return value;
}