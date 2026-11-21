import { describe, expect, it } from "vitest";
import { groupMissionClicks, paginateNickGroups, type MissionClick } from "./mission-admin";

describe("mission click summaries", () => {
  it("groups nicks case-insensitively and keeps the latest spelling and time", () => {
    const clicks: MissionClick[] = [
      { username: "Maguinsupremo", occurredAt: "2026-01-01T10:00:00.000Z" },
      { username: "OUTRO", occurredAt: "2026-01-02T10:00:00.000Z" },
      { username: "maguinsupremo", occurredAt: "2026-01-03T10:00:00.000Z" },
    ];

    expect(groupMissionClicks(clicks)).toEqual([
      { username: "maguinsupremo", count: 2, latestAt: "2026-01-03T10:00:00.000Z" },
      { username: "OUTRO", count: 1, latestAt: "2026-01-02T10:00:00.000Z" },
    ]);
  });

  it("shows at most 50 nicks per page and clamps an outdated page number", () => {
    const groups = Array.from({ length: 51 }, (_, index) => ({
      username: `nick${index}`,
      count: 1,
      latestAt: "2026-01-01T10:00:00.000Z",
    }));

    expect(paginateNickGroups(groups, 1).items).toHaveLength(50);
    expect(paginateNickGroups(groups, 2).items).toHaveLength(1);
    expect(paginateNickGroups(groups, 5).currentPage).toBe(2);
    expect(paginateNickGroups([], 1).totalPages).toBe(1);
  });
});
