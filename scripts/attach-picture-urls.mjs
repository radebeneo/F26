/**
 * attach-picture-urls.mjs
 *
 * Reads one or more FIFA squad JSON files (like argentina.json) and extracts
 * PlayerPicture.PictureUrl for each player.  The fifaId is parsed from the
 * trailing segment of the URL (e.g. "MESSI-Lionel_229397" → 229397).
 *
 * Each matched player in official_players.json receives a new `pictureUrl`
 * field.  Players with no match are left unchanged.
 *
 * Usage:
 *   node scripts/attach-picture-urls.mjs
 *
 * To process additional squad files, add their paths to SQUAD_FILES below.
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// ── Config ───────────────────────────────────────────────────────────────────

const OFFICIAL_PLAYERS_PATH = resolve(
  ROOT,
  "public/official/official_players.json"
);

/**
 * Add more squad files here as they are downloaded.
 * Each file must follow the same shape as argentina.json.
 */
const SQUAD_FILES = [
  resolve(ROOT, "public/official/argentina.json"),
  // resolve(ROOT, "public/official/brazil.json"),
  // ... etc.
];

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Parse the fifaId from the tail of a FIFA picture URL.
 *
 * Example URL:
 *   https://digitalhub.fifa.com/transform/19823774-.../MESSI-Lionel_229397
 *
 * Returns the integer 229397, or null if the pattern is not found.
 */
function extractFifaIdFromUrl(url) {
  if (!url || typeof url !== "string") return null;
  // The URL path ends with  <SLUG>_<fifaId>
  const match = url.match(/_(\d+)$/);
  return match ? parseInt(match[1], 10) : null;
}

// ── Main ─────────────────────────────────────────────────────────────────────

// 1. Build a map:  fifaId (number) => pictureUrl (string)
const pictureMap = new Map();

for (const squadFile of SQUAD_FILES) {
  console.log(`\nProcessing squad file: ${squadFile}`);
  const squadData = JSON.parse(readFileSync(squadFile, "utf-8"));

  const players = squadData.Players ?? [];
  let matched = 0;
  let skipped = 0;

  for (const player of players) {
    const pictureUrl = player?.PlayerPicture?.PictureUrl ?? null;
    const fifaId = extractFifaIdFromUrl(pictureUrl);

    if (fifaId !== null && pictureUrl) {
      pictureMap.set(fifaId, pictureUrl);
      matched++;
    } else {
      skipped++;
    }
  }

  console.log(
    `  -> ${matched} picture URLs extracted, ${skipped} players skipped (no picture)`
  );
}

console.log(`\nTotal picture URLs in map: ${pictureMap.size}`);

// 2. Load official_players.json and attach picture URLs
const officialPlayers = JSON.parse(
  readFileSync(OFFICIAL_PLAYERS_PATH, "utf-8")
);

let attached = 0;
let alreadyHad = 0;
let noMatch = 0;

for (const player of officialPlayers) {
  if (!player.fifaId) {
    noMatch++;
    continue;
  }

  const url = pictureMap.get(player.fifaId);

  if (url) {
    if (player.pictureUrl && player.pictureUrl === url) {
      alreadyHad++;
    } else {
      player.pictureUrl = url;
      attached++;
    }
  } else {
    if (!player.pictureUrl) {
      noMatch++;
    }
  }
}

console.log(`\nResults:`);
console.log(`  ${attached} players updated with a new pictureUrl`);
console.log(`  ${alreadyHad} players already had the correct pictureUrl`);
console.log(
  `  ${noMatch} players had no matching picture (squad file not processed yet)`
);

// 3. Write the updated file back
writeFileSync(
  OFFICIAL_PLAYERS_PATH,
  JSON.stringify(officialPlayers, null, 4),
  "utf-8"
);

console.log(`\nDone - official_players.json saved.`);
