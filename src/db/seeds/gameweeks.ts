import type { NewGameweek } from "@/db/schema";

export const gameweeks: NewGameweek[] = [
  { name: "Group Stage MD1", deadlineTime: new Date("2026-06-11T20:00:00+01:00"), isCurrent: true, isFinished: false },
  { name: "Group Stage MD2", deadlineTime: new Date("2026-06-18T17:00:00+01:00"), isCurrent: false, isFinished: false },
  { name: "Group Stage MD3", deadlineTime: new Date("2026-06-24T20:00:00+01:00"), isCurrent: false, isFinished: false },
  { name: "Round of 32", deadlineTime: new Date("2026-06-28T20:00:00+01:00"), isCurrent: false, isFinished: false },
  { name: "Round of 16", deadlineTime: new Date("2026-07-04T18:00:00+01:00"), isCurrent: false, isFinished: false },
  { name: "Quarter-finals", deadlineTime: new Date("2026-07-09T21:00:00+01:00"), isCurrent: false, isFinished: false },
  { name: "Semi-finals", deadlineTime: new Date("2026-07-14T20:00:00+01:00"), isCurrent: false, isFinished: false },
  { name: "Final", deadlineTime: new Date("2026-07-18T22:00:00+01:00"), isCurrent: false, isFinished: false },
];
