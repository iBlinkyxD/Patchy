const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Get player available plots
async function getAvailablePlots(playerId, quantity) {
  const query =
    "SELECT plot_id FROM player_farm WHERE player_id = $1 AND status = 'Empty' LIMIT $2";
  const result = await pool.query(query, [playerId, quantity]);
  return result.rows.length >= quantity ? result.rows : null;
}

// Plant the crop in the available plot
async function plantCrop(
  playerId,
  plotId,
  itemName,
  plantTime,
  growthTime,
  yieldAmount,
  sort_order
) {
  await pool.query(
    "UPDATE player_farm SET item_name = $1, plant_time = $2, growth_time = $3, yield = $4, sort_order = $5, status = 'Planted' WHERE plot_id = $6 AND player_id = $7",
    [itemName, plantTime, growthTime, yieldAmount, sort_order, plotId, playerId]
  );
}

// Get all crops ready to harvest.
async function getReadyCrops(playerId) {
  const query = `
    SELECT * FROM player_farm
    WHERE player_id = $1
    AND status = 'Planted'
    AND (plant_time + growth_time * 1000) <= $2;
  `;

  const { rows } = await pool.query(query, [playerId, Date.now()]);
  return rows;
}

// Reset farm plot after harvest.
async function harvestCrop(plotId) {
  const query = `
      UPDATE player_farm
      SET item_name = '', plant_time = 0, growth_time = 0, yield = 0, status = 'Empty', sort_order = 0
      WHERE plot_id = $1;
  `;

  await pool.query(query, [plotId]);
}

module.exports = {
  getAvailablePlots,
  plantCrop,
  getReadyCrops,
  harvestCrop,
};
