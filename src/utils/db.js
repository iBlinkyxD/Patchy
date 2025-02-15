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

// Get a player inventory.
async function getInventory(playerId, itemType) {
  const inventoryQuery =
    "SELECT item_name, quantity FROM inventory WHERE player_id = $1 AND quantity > 0 AND item_type = $2";
  const inventoryResult = await pool.query(inventoryQuery, [playerId, itemType]);

  return inventoryResult.rows.length > 0
    ? inventoryResult.rows
        .map((item) => `**${item.quantity}** ${item.item_name}`)
        .join("\n")
    : "You have no items.";
}

// Get a player's inventory as an array of objects
async function getSeedInventory(playerId, itemType) {
  const inventoryQuery =
    "SELECT item_name, quantity FROM inventory WHERE player_id = $1 AND item_type = $2";
  const inventoryResult = await pool.query(inventoryQuery, [playerId, itemType]);

  // Return the raw array of inventory items
  return inventoryResult.rows; 
}

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
  sort_order,
) {
  await pool.query(
    "UPDATE player_farm SET item_name = $1, plant_time = $2, growth_time = $3, yield = $4, sort_order = $5, status = 'Planted' WHERE plot_id = $6 AND player_id = $7",
    [itemName, plantTime, growthTime, yieldAmount, sort_order, plotId, playerId]
  );
}

// Update inventory.
async function updateSeedInventory(playerId, quantity, seedName){
  const query = `UPDATE inventory SET quantity = quantity - $1 WHERE player_id = $2 AND item_name = $3`
  await pool. query(query, [quantity, playerId, seedName])
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

// Add harvested crops in the player's inventory
async function addToInventory(playerId, itemName, quantity, sortOrder, itemType) {
  const query = `
      INSERT INTO inventory (player_id, item_name, quantity, sort_order ,item_type)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (player_id, item_name)
      DO UPDATE SET quantity = inventory.quantity + $3;
  `;

  await pool.query(query, [playerId, itemName, quantity, sortOrder, itemType]);
}

// Add player XP
async function addXP(playerId, xp) {
  const query = `
    UPDATE players SET xp = xp + $1 WHERE player_id = $2;
  `;

  await pool.query(query, [xp, playerId]);
}

// Deducts player coins
async function updateCoins(playerId, coins){
  const query =`UPDATE players SET coins = $1 WHERE player_id = $2`;

  await pool.query(query, [coins, playerId]);
}

async function updateInventory(playerId, itemName, quantity) {
  const query = `UPDATE inventory SET quantity = quantity - $1 WHERE player_id = $2 AND item_name = $3`;
  await pool.query(query, [quantity, playerId, itemName]);
}

module.exports = {
  getPlayer,
  getInventory,
  createPlayer,
  getAvailablePlots,
  plantCrop,
  getReadyCrops,
  harvestCrop,
  addToInventory,
  addXP,
  updateCoins,
  getSeedInventory,
  updateSeedInventory,
  updateInventory,
};
