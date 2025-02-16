const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Get a player inventory.
async function getInventory(playerId, itemType) {
  const inventoryQuery =
    "SELECT item_name, quantity FROM inventory WHERE player_id = $1 AND quantity > 0 AND item_type = $2";
  const inventoryResult = await pool.query(inventoryQuery, [
    playerId,
    itemType,
  ]);

  return inventoryResult.rows;
}

// Update inventory.
async function updateInventory(playerId, quantity, itemName) {
  const query = `UPDATE inventory SET quantity = quantity - $1 WHERE player_id = $2 AND item_name = $3`;
  await pool.query(query, [quantity, playerId, itemName]);
}

// Add harvested crops in the player's inventory
async function addToInventory(
  playerId,
  itemName,
  quantity,
  sortOrder,
  itemType
) {
  const query = `
      INSERT INTO inventory (player_id, item_name, quantity, sort_order ,item_type)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (player_id, item_name)
      DO UPDATE SET quantity = inventory.quantity + $3;
  `;

  await pool.query(query, [playerId, itemName, quantity, sortOrder, itemType]);
}

module.exports = {
  getInventory,
  addToInventory,
  updateInventory,
};
