import type { NewFixture } from "@/db/schema";

export const fixtures: NewFixture[] = [
  // Example fixtures for Group Stage MD1
  {
    gameweekId: 1,
    homeNation: "Mexico",
    awayNation: "South Africa",
    kickoffTime: new Date("2026-06-11T20:00:00Z"),
    status: "UPCOMING",
  },
  {
    gameweekId: 1,
    homeNation: "South Korea",
    awayNation: "Czechia",
    kickoffTime: new Date("2026-06-12T15:00:00Z"),
    status: "UPCOMING",
  },
  {
    gameweekId: 1,
    homeNation: "Canada",
    awayNation: "Bosnia-Herzegovina",
    kickoffTime: new Date("2026-06-12T18:00:00Z"),
    status: "UPCOMING",
  },
  {
    gameweekId: 1,
    homeNation: "Qatar",
    awayNation: "Switzerland",
    kickoffTime: new Date("2026-06-12T21:00:00Z"),
    status: "UPCOMING",
  },
  {
    gameweekId: 1,
    homeNation: "Brazil",
    awayNation: "Morocco",
    kickoffTime: new Date("2026-06-13T15:00:00Z"),
    status: "UPCOMING",
  },
  {
    gameweekId: 1,
    homeNation: "Haiti",
    awayNation: "Scotland",
    kickoffTime: new Date("2026-06-13T18:00:00Z"),
    status: "UPCOMING",
  },
  {
    gameweekId: 1,
    homeNation: "United States",
    awayNation: "Australia",
    kickoffTime: new Date("2026-06-13T21:00:00Z"),
    status: "UPCOMING",
  },
  {
    gameweekId: 1,
    homeNation: "Paraguay",
    awayNation: "Türkiye",
    kickoffTime: new Date("2026-06-14T15:00:00Z"),
    status: "UPCOMING",
  },
];
