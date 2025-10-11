const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create a player.
async function createPlayer(playerId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Insert new player
    const insertPlayerQuery = `
        INSERT INTO players (player_id, coins, level, xp, max_plots)
        VALUES ($1, 100.00, 1, 0, 3)
      `;
    await client.query(insertPlayerQuery, [playerId]);

    // Insert 3 empty plots for the new player
    const insertPlotsQuery = `
        INSERT INTO player_farm (player_id, item_name, plant_time, growth_time, yield, status)
        VALUES 
          ($1, '', 0, 0, 0, 'Empty'),
          ($1, '', 0, 0, 0, 'Empty'),
          ($1, '', 0, 0, 0, 'Empty')
      `;
    await client.query(insertPlotsQuery, [playerId]);

    const insertUpgrade = `INSERT INTO upgrades (player_id, upgrade_name, upgrade_level) VALUES ($1, 'Farm Expansion', 1)`
    await client.query(insertUpgrade, [playerId]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error creating player:", error);
  } finally {
    client.release();
  }
}

// Get a player data if exists.
async function getPlayer(playerId) {
  const playerQuery = "SELECT * FROM players WHERE player_id = $1";
  const playerResult = await pool.query(playerQuery, [playerId]);

  // If the player does not exist, return null
  return playerResult.rows.length > 0 ? playerResult.rows[0] : null;
}

// Update player XP
async function addXP(playerId, xp) {
  const query = `
      UPDATE players SET xp = xp + $1 WHERE player_id = $2;
    `;

  await pool.query(query, [xp, playerId]);
}

// Update player coins
async function updateCoins(playerId, coins) {
  const query = `UPDATE players SET coins = $1 WHERE player_id = $2`;

  await pool.query(query, [coins, playerId]);
}

// Update player plots
async function updatePlot(playerId, plotIncrease) {
  const updateQuery = `UPDATE players SET max_plots = max_plots + $1 WHERE player_id = $2`;
  await pool.query(updateQuery, [plotIncrease, playerId]);

  // Insert multiple empty plots for the new player
  const insertPlotsQuery = `
    INSERT INTO player_farm (player_id, item_name, plant_time, growth_time, yield, status)
    VALUES 
      ${Array(plotIncrease).fill(`($1, '', 0, 0, 0, 'Empty')`).join(', ')}
  `;
  await pool.query(insertPlotsQuery, [playerId]);
}


module.exports = {
  getPlayer,
  createPlayer,
  addXP,
  updateCoins,
  updatePlot
};
