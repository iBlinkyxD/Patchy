const {
  SlashCommandBuilder,
  MessageFlags,
} = require("discord.js");
const { getPlayer, updateCoins } = require("../utils/playersDb");
const { updateInventory, getInventory } = require("../utils/inventoryDb");
const fs = require("fs");

// Read seeds data from the JSON file
const crops = JSON.parse(fs.readFileSync("./src/data/crops.json", "utf-8"));
const cropMap = new Map(crops.map((crop) => [crop.name.toLowerCase(), crop]));

module.exports = {
  data: new SlashCommandBuilder()
    .setName("sell")
    .setDescription("Sell all crops in your inventory."),

  async execute(interaction) {
    handleSell({
      id: interaction.user.id,
      reply: (response) => interaction.reply(response),
      ephemeralFlag: MessageFlags.Ephemeral,
    });
  },
  async executePrefix(message) {
    handleSell({
      id: message.author.id,
      reply: (response) => message.reply(response),
      ephemeralFlag: true,
    });
  },
};

async function handleSell({ id, reply, ephemeralFlag }) {
  try {
    const player = await getPlayer(id);
    const inventory = await getInventory(id, "crop");

    if (!player) {
      return reply({
        content:
          "You don't have a farm yet. Use `/startfarm` OR `!startfarm` to create one!",
          flags: ephemeralFlag,
      });
    }

    if (inventory.length === 0) {
      return reply({
        content: "You don't have any crops to sell!",
        flags: ephemeralFlag,
      });
    }

    const cropsToRemove = [];
    let totalEarned = 0;

    for (const item of inventory) {
      const crop = cropMap.get(item.item_name.toLowerCase()); // Convert crop name to lowercase for matching

      if (crop) {
        // Calculate total earnings for the current crop
        totalEarned += crop.sellPrice * item.quantity;
        cropsToRemove.push(item); // Add the item to cropsToRemove (will be removed later from inventory)
      }
    }

    // Remove crops from the inventory and update the player's coins
    await Promise.all([
      ...cropsToRemove.map((item) =>
        updateInventory(id, item.quantity, item.item_name)
      ),
      updateCoins(
        id,
        Math.round(parseInt(player.coins) + parseInt(totalEarned))
      ),
    ]);

    return reply({
      content: `You sold **all your crops** for **$${totalEarned}**!`,
    });
  } catch (error) {
    console.error("Error during sell process:", error);
    return reply({
      content: "There was an error during the process.",
      flags: ephemeralFlag,
    });
  }
}
