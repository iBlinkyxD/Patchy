const {
  SlashCommandBuilder,
  EmbedBuilder,
  MessageFlags,
} = require("discord.js");
const {
  getPlayer,
  getInventory,
  updateCoins,
  updateInventory,
  getSeedInventory,
} = require("../utils/db");
const fs = require("fs");

// Read seeds data from the JSON file
const crops = JSON.parse(fs.readFileSync("./src/data/seeds.json", "utf-8"));

module.exports = {
  data: new SlashCommandBuilder()
    .setName("sell")
    .setDescription("Sell all crops in your inventory."),

  async execute(interaction) {
    const playerId = interaction.user.id;

    const player = await getPlayer(playerId);
    const inventory = await getInventory(playerId, "crop");

    if (!player) {
      return interaction.reply({
        content:
          "You don't have a farm yet. Use `/startfarm` OR `!startfarm` to create one!",
        flags: MessageFlags.Ephemeral,
      });
    }

    if (inventory.length === 0) {
      return interaction.reply({
        content: "You don't have any crops to sell!",
        flags: MessageFlags.Ephemeral,
      });
    }

    console.log(inventory);
  },
  async executePrefix(message) {
    const playerId = message.author.id;

    const player = await getPlayer(playerId);
    const inventory = await getSeedInventory(playerId, "crop");

    if (!player) {
      return message.reply({
        content:
          "You don't have a farm yet. Use `/startfarm` OR `!startfarm` to create one!",
        flags: MessageFlags.Ephemeral,
      });
    }

    if (inventory.length === 0) {
      return message.reply({
        content: "You don't have any crops to sell!",
        flags: MessageFlags.Ephemeral,
      });
    }

    // Calculate total amount earned from selling all crops
    let totalEarned = 0;
    for (const item of inventory) {
      const crop = crops.find((crop) => crop.crop.toLowerCase() === item.item_name.toLowerCase());

      if (crop) {
        totalEarned += parseInt(crop.sellPrice) * parseInt(item.quantity); // Use the sellPrice from the crop JSON
      }
    }

    //Update the player's inventory and coins
    for (const item of inventory) {
      await updateInventory(playerId, item.item_name, item.quantity); // Remove crops from inventory
    }

    // Update player's coins balance
    const bal = Math.round(parseInt(player.coins) + parseInt(totalEarned));
    await updateCoins(playerId, bal);

    await message.reply({
      content: `You sold **all your crops** for **$${totalEarned}**!`,
      ephemeral: false,
    });
  },
};
