const fs = require('fs');

const officialData = JSON.parse(fs.readFileSync('public/official/official_rounds.json', 'utf8'));
const playersContent = fs.readFileSync('src/db/seeds/players.ts', 'utf8');

const nationMatches = playersContent.match(/p\("[^"]+", "[^"]+", "([^"]+)"/g);
const playerNations = new Set(nationMatches.map(m => {
  const parts = m.split('", "');
  return parts[2].replace(/"$/, '');
}));

console.log("Nations in players.ts:", playerNations);

const officialNations = new Set();
officialData.forEach(round => {
  if (round.tournaments) {
    round.tournaments.forEach(t => {
      officialNations.add(t.homeSquadName);
      officialNations.add(t.awaySquadName);
    });
  }
});

console.log("Nations in official_rounds.json:", officialNations);

const mapping = {
  "USA": "United States",
  "Korea Republic": "South Korea",
  "Bosnia and Herzegovina": "Bosnia-Herzegovina",
  "Curaçao": "Curacao",
  "IR Iran": "Iran"
};

const unmapped = [];
for (let n of officialNations) {
  let mapped = mapping[n] || n;
  if (!playerNations.has(mapped)) {
    unmapped.push(n + ' (mapped: ' + mapped + ')');
  }
}

console.log("Unmapped nations:", unmapped);

let fixturesTs = 'import type { NewFixture } from "@/db/schema";\n\nexport const fixtures: NewFixture[] = [\n';
let gameweeksTs = 'import type { NewGameweek } from "@/db/schema";\n\nexport const gameweeks: NewGameweek[] = [\n';

const roundNames = [
  "Group Stage MD1",
  "Group Stage MD2",
  "Group Stage MD3",
  "Round of 32",
  "Round of 16",
  "Quarter-finals",
  "Semi-finals",
  "Final"
];

officialData.forEach((round, i) => {
  const gwId = round.id;
  const name = roundNames[i];
  const isCurrent = (i === 0);
  const isFinished = false; // We can set this to true if in the past? But maybe just follow instructions: isCurrent: true for first, others false.
  
  // Wait, the gameweeks need a `deadlineTime`. In the JSON, the round has `startDate`. We can use `startDate` as `deadlineTime`.
  const deadlineTime = new Date(round.startDate);
  // Subtract maybe an hour or just use startDate? The current gameweeks.ts uses "11:00:00Z", but let's just use the startDate of the first fixture.
  let earliestFixtureDate = round.startDate;
  if (round.tournaments && round.tournaments.length > 0) {
    earliestFixtureDate = round.tournaments.reduce((min, t) => t.date < min ? t.date : min, round.tournaments[0].date);
  }
  
  const d = new Date(earliestFixtureDate);
  // deadline usually 1-2 hours before, but let's just use earliestFixtureDate. Wait, the original `deadlineTime` in gameweeks.ts was e.g. "2026-06-11T11:00:00Z".
  // Let's just keep the date but make it 11:00:00Z or keep the exact date? I'll use the exact start date from the round or earliest fixture.
  
  gameweeksTs += `  { name: "${name}", deadlineTime: new Date("${earliestFixtureDate}"), isCurrent: ${isCurrent}, isFinished: false },\n`;
  
  if (round.tournaments) {
    round.tournaments.forEach(t => {
      const home = mapping[t.homeSquadName] || t.homeSquadName;
      const away = mapping[t.awaySquadName] || t.awaySquadName;
      let status = "UPCOMING";
      if (t.status === "complete") {
        status = "FINISHED";
      } else if (t.status === "live") {
        status = "LIVE";
      }
      
      let scoreStr = '';
      if (status === "FINISHED") {
        scoreStr = `, homeScore: ${t.homeScore}, awayScore: ${t.awayScore}`;
      }
      
      fixturesTs += `  { gameweekId: ${gwId}, homeNation: "${home}", awayNation: "${away}", kickoffTime: new Date("${t.date}"), status: "${status}"${scoreStr} },\n`;
    });
  }
});

gameweeksTs += '];\n';
fixturesTs += '];\n';

fs.writeFileSync('src/db/seeds/gameweeks.ts', gameweeksTs);
fs.writeFileSync('src/db/seeds/fixtures.ts', fixturesTs);

console.log("Successfully generated gameweeks.ts and fixtures.ts");
