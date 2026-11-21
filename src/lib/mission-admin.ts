export type MissionClick = {
  username: string;
  occurredAt: string;
};

export type NickSummary = {
  username: string;
  count: number;
  latestAt: string;
};

type MissionData = {
  url: string;
  clicks: MissionClick[];
};

const STORAGE_KEY = "mission-admin-data-v1";
export const NICKS_PER_PAGE = 50;

export function parseMissionUrl(value: string): string | null {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

function readData(): MissionData {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === null) return { url: "", clicks: [] };

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(
      "Os dados locais do painel estão inválidos. Limpe os dados do site e tente novamente.",
    );
  }

  if (
    typeof data !== "object" ||
    data === null ||
    !("url" in data) ||
    typeof data.url !== "string" ||
    !("clicks" in data) ||
    !Array.isArray(data.clicks)
  ) {
    throw new Error(
      "Os dados locais do painel estão inválidos. Limpe os dados do site e tente novamente.",
    );
  }
  if (data.url && !parseMissionUrl(data.url)) {
    throw new Error("O link salvo não é um destino HTTP ou HTTPS válido.");
  }

  const clicks: MissionClick[] = [];
  for (const click of data.clicks) {
    if (!isMissionClick(click)) {
      throw new Error(
        "Os registros locais de cliques estão inválidos. Limpe os dados do site e tente novamente.",
      );
    }
    clicks.push(click);
  }

  return { url: data.url, clicks };
}

function isMissionClick(value: unknown): value is MissionClick {
  if (
    typeof value !== "object" ||
    value === null ||
    !("username" in value) ||
    !("occurredAt" in value)
  ) {
    return false;
  }

  return (
    typeof value.username === "string" &&
    typeof value.occurredAt === "string" &&
    Number.isFinite(Date.parse(value.occurredAt))
  );
}

function writeData(data: MissionData): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function loadMissionData(): MissionData {
  return readData();
}

export function saveMissionUrl(value: string): string {
  const url = parseMissionUrl(value);
  if (!url) throw new Error("Informe um link válido começando com http:// ou https://.");

  const data = readData();
  writeData({ ...data, url });
  return url;
}

export function recordMissionClick(username: string): void {
  const nick = username.trim();
  if (!/^[A-Za-z0-9_]{3,20}$/.test(nick)) {
    throw new Error("Não foi possível registrar o nick informado.");
  }

  const data = readData();
  writeData({
    ...data,
    clicks: [...data.clicks, { username: nick, occurredAt: new Date().toISOString() }],
  });
}

export function clearMissionClicks(): void {
  const data = readData();
  writeData({ ...data, clicks: [] });
}

export function groupMissionClicks(clicks: MissionClick[]): NickSummary[] {
  const groups = new Map<string, NickSummary>();

  for (const click of clicks) {
    const key = click.username.toLowerCase();
    const current = groups.get(key);
    if (!current) {
      groups.set(key, { username: click.username, count: 1, latestAt: click.occurredAt });
      continue;
    }

    current.count += 1;
    if (Date.parse(click.occurredAt) > Date.parse(current.latestAt)) {
      current.username = click.username;
      current.latestAt = click.occurredAt;
    }
  }

  return [...groups.values()].sort((a, b) => Date.parse(b.latestAt) - Date.parse(a.latestAt));
}

export function paginateNickGroups(groups: NickSummary[], requestedPage: number) {
  const totalPages = Math.max(1, Math.ceil(groups.length / NICKS_PER_PAGE));
  const currentPage = Math.min(Math.max(1, requestedPage), totalPages);
  const start = (currentPage - 1) * NICKS_PER_PAGE;

  return {
    currentPage,
    totalPages,
    items: groups.slice(start, start + NICKS_PER_PAGE),
  };
}
