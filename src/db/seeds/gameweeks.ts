import type { NewGameweek } from "@/db/schema";

export const gameweeks: NewGameweek[] = [
  { name: "Group Stage MD1", deadlineTime: new Date("2026-06-11T11:00:00Z"), isCurrent: true,  isFinished: false },
  { name: "Group Stage MD2", deadlineTime: new Date("2026-06-15T11:00:00Z"), isCurrent: false, isFinished: false },
  { name: "Group Stage MD3", deadlineTime: new Date("2026-06-19T11:00:00Z"), isCurrent: false, isFinished: false },
  { name: "Round of 32",     deadlineTime: new Date("2026-06-27T11:00:00Z"), isCurrent: false, isFinished: false },
  { name: "Round of 16",     deadlineTime: new Date("2026-07-02T11:00:00Z"), isCurrent: false, isFinished: false },
  { name: "Quarter-finals",  deadlineTime: new Date("2026-07-05T11:00:00Z"), isCurrent: false, isFinished: false },
  { name: "Semi-finals",     deadlineTime: new Date("2026-07-14T11:00:00Z"), isCurrent: false, isFinished: false },
  { name: "Final",           deadlineTime: new Date("2026-07-19T11:00:00Z"), isCurrent: false, isFinished: false },
];
