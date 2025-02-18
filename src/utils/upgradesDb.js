const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Get player upgrades.
async function getUpgrades(playerId){
    const query = "SELECT upgrade_name, upgrade_level FROM upgrades WHERE player_id = $1"
    const result = await pool.query(query, [playerId]);
    return result.rows;
}

// Level upgrade up.
async function updateUpgrade(playerId, upgradeName, newLevel ) {
    const query = "UPDATE upgrades SET upgrade_level = $1 WHERE player_id = $2 AND upgrade_name = $3";
    await pool.query(query, [newLevel, playerId, upgradeName]);
}

module.exports = {
    getUpgrades,
    updateUpgrade,
}