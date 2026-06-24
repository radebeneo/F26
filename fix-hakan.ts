import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import { sql } from "drizzle-orm";

async function main() {
  const { db } = await import("./src/db/index.js");

  console.log("Fixing Hakan's ID...");
  try {
    await db.transaction(async (tx: any) => {
      // Ensure cascades are in place
      await tx.execute(sql`ALTER TABLE user_squad_players DROP CONSTRAINT IF EXISTS user_squad_players_player_id_players_id_fk`);
      await tx.execute(sql`ALTER TABLE user_squad_players ADD CONSTRAINT user_squad_players_player_id_players_id_fk FOREIGN KEY (player_id) REFERENCES players(id) ON UPDATE CASCADE`);
      await tx.execute(sql`ALTER TABLE player_stats DROP CONSTRAINT IF EXISTS player_stats_player_id_players_id_fk`);
      await tx.execute(sql`ALTER TABLE player_stats ADD CONSTRAINT player_stats_player_id_players_id_fk FOREIGN KEY (player_id) REFERENCES players(id) ON UPDATE CASCADE`);
      await tx.execute(sql`ALTER TABLE user_squads DROP CONSTRAINT IF EXISTS user_squads_twelfth_man_id_players_id_fk`);
      await tx.execute(sql`ALTER TABLE user_squads ADD CONSTRAINT user_squads_twelfth_man_id_players_id_fk FOREIGN KEY (twelfth_man_id) REFERENCES players(id) ON UPDATE CASCADE`);

      // 1. If someone is accidentally squatting on 1216, move them out of the way to a high safe ID
      await tx.execute(sql`UPDATE players SET id = 50001216 WHERE id = 1216`);
      
      // 2. Move Hakan (who was accidentally mapped to 1222 previously) to his correct JSON ID 1216
      await tx.execute(sql`UPDATE players SET id = 1216 WHERE id = 1222`);
      
      // 3. (Optional) We could move the squatter down to 1222, but the sync script will handle disabled unmapped players anyway
    });
    console.log("✅ Hakan successfully relocated to ID 1216!");
  } catch (err) {
    console.error("❌ Failed to fix Hakan:", err);
  }
  process.exit(0);
}

main();
