/**
 * fetch-all-squad-pictures.mjs
 *
 * 1. Reads wc2026_teams.json to get IdTeam for all 48 teams.
 * 2. Fetches each team squad from the official FIFA API.
 * 3. Extracts PlayerPicture.PictureUrl → fifaId pairs.
 * 4. Updates official_players.json with a `pictureUrl` field on matching players.
 *
 * Usage:
 *   node scripts/fetch-all-squad-pictures.mjs
 *
 * Env vars (optional):
 *   DELAY_MS   - ms to wait between requests (default 300) to be polite to the API
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// ── Config ───────────────────────────────────────────────────────────────────

const TEAMS_PATH           = resolve(ROOT, "public/official/wc2026_teams.json");
const OFFICIAL_PLAYERS_PATH = resolve(ROOT, "public/official/official_players.json");

const ID_COMPETITION = "17";
const ID_SEASON      = "285023";
const LANGUAGE       = "en";
const DELAY_MS       = parseInt(process.env.DELAY_MS ?? "300", 10);

const BASE_URL = (idTeam) =>
  `https://api.fifa.com/api/v3/teams/${idTeam}/squad` +
  `?idCompetition=${ID_COMPETITION}&idSeason=${ID_SEASON}&language=${LANGUAGE}`;

// ── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Parse the fifaId from the tail of a FIFA picture URL.
 * e.g. "https://digitalhub.fifa.com/transform/.../MESSI-Lionel_229397" → 229397
 */
function extractFifaId(url) {
  if (!url || typeof url !== "string") return null;
  const match = url.match(/_(\d+)$/);
  return match ? parseInt(match[1], 10) : null;
}

// ── Main ─────────────────────────────────────────────────────────────────────

const teamsData = JSON.parse(readFileSync(TEAMS_PATH, "utf-8"));
const teams = teamsData.teams;
console.log(`Found ${teams.length} teams in wc2026_teams.json\n`);

// Build the pictureUrl map across all teams
const pictureMap = new Map(); // fifaId (number) → pictureUrl (string)

let teamsFetched   = 0;
let teamsFailed    = 0;
let totalPictures  = 0;

for (const team of teams) {
  const { IdTeam, TeamName, IdCountry } = team;
  const url = BASE_URL(IdTeam);

  process.stdout.write(`  [${IdCountry}] ${TeamName.padEnd(30)} → `);

  try {
    const res = await fetch(url, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "F26-Fantasy/1.0",
      },
    });

    if (!res.ok) {
      console.log(`HTTP ${res.status} ${res.statusText}`);
      teamsFailed++;
      await sleep(DELAY_MS);
      continue;
    }

    const data = await res.json();
    const players = data.Players ?? [];
    let count = 0;

    for (const player of players) {
      const picUrl = player?.PlayerPicture?.PictureUrl ?? null;
      const fifaId = extractFifaId(picUrl);
      if (fifaId && picUrl) {
        pictureMap.set(fifaId, picUrl);
        count++;
      }
    }

    console.log(`${count} pictures (${players.length} players in squad)`);
    totalPictures += count;
    teamsFetched++;
  } catch (err) {
    console.log(`ERROR: ${err.message}`);
    teamsFailed++;
  }

  await sleep(DELAY_MS);
}

console.log(`\n── Fetch summary ──────────────────────────────────`);
console.log(`  Teams fetched successfully : ${teamsFetched}`);
console.log(`  Teams failed               : ${teamsFailed}`);
console.log(`  Total picture URLs mapped  : ${pictureMap.size} (${totalPictures} raw)`);

// ── Attach to official_players.json ─────────────────────────────────────────

console.log(`\nUpdating official_players.json...`);
const officialPlayers = JSON.parse(readFileSync(OFFICIAL_PLAYERS_PATH, "utf-8"));

let attached   = 0;
let unchanged  = 0;
let noMatch    = 0;

for (const player of officialPlayers) {
  if (!player.fifaId) {
    noMatch++;
    continue;
  }

  const url = pictureMap.get(player.fifaId);

  if (url) {
    if (player.pictureUrl === url) {
      unchanged++;
    } else {
      player.pictureUrl = url;
      attached++;
    }
  } else {
    noMatch++;
  }
}

console.log(`  Players updated  : ${attached}`);
console.log(`  Already correct  : ${unchanged}`);
console.log(`  No match found   : ${noMatch}`);

writeFileSync(
  OFFICIAL_PLAYERS_PATH,
  JSON.stringify(officialPlayers, null, 4),
  "utf-8"
);

console.log(`\nDone — official_players.json saved.`);
