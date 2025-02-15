const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require("discord.js");
const {
  getPlayer,
  getReadyCrops,
  harvestCrop,
  addToInventory,
  addXP,
} = require("../utils/db");
const fs = require("fs");

// Read seeds data from the JSON file
const cropData = JSON.parse(fs.readFileSync("./src/data/seeds.json", "utf-8"));

module.exports = {
  data: new SlashCommandBuilder()
    .setName("harvest")
    .setDescription(
      "Harvest all fully grown crops and store them in inventory."
    ),

  async execute(interaction) {
    const playerId = interaction.user.id;

    const player = await getPlayer(playerId);

    if (!player) {
      return interaction.reply({
        content:
          "You don't have a farm yet. Use `/startfarm` OR `!startfarm` to create one!",
          flags: MessageFlags.Ephemeral,
      });
    }

    // Fetch crops that are ready for harvest
    const readyCrops = await getReadyCrops(playerId);

    if (!readyCrops.length) {
      return interaction.reply("⏳ You have no crops ready for harvest!");
    }

    let harvestedCrops = [];

    for (const crop of readyCrops) {
      // Store harvested crops in inventory
      await addToInventory(playerId, crop.item_name, crop.yield, crop.sort_order, "crop");

      // Reset the farm plot
      await harvestCrop(crop.plot_id);

      harvestedCrops.push(`${crop.item_name} (+${crop.yield})`);
    }

    return interaction.reply(
      `🌾 You harvested: **${harvestedCrops.join(
        ", "
      )}**!\n📦 Stored in inventory.`
    );
  },
  async executePrefix(message) {
    const playerId = message.author.id;
    const username = message.author.displayName;

    const player = await getPlayer(playerId);

    if (!player) {
      return message.reply({
        content:
          "You don't have a farm yet. Use `/startfarm` OR `!startfarm` to create one!",
        ephemeral: true,
      });
    }

    // Fetch crops that are ready for harvest
    const readyCrops = await getReadyCrops(playerId);

    if (!readyCrops.length) {
      return message.reply("⏳ You have no crops ready for harvest!");
    }

    let harvestedCrops = {};
    let totalXP = 0;

    for (const crop of readyCrops) {
      // Store harvested crops in inventory
      await addToInventory(playerId, crop.item_name, crop.yield, crop.sort_order, "crop");

      // Reset the farm plot
      await harvestCrop(crop.plot_id);

      if (!harvestedCrops[crop.item_name]) {
        harvestedCrops[crop.item_name] = 0;
      }
      harvestedCrops[crop.item_name] += crop.yield;

      // Find XP value for this crop from JSON
      const cropInfo = cropData.find(
        (c) => c.crop.toLowerCase() === crop.item_name.toLowerCase()
      );
      const cropXP = cropInfo ? cropInfo.xp : 1; // Default to 1 XP if crop not found

      // Add XP based on the crop's XP per yield
      totalXP += crop.yield * cropXP;
    }

    await addXP(playerId, totalXP);

    // Construct embed message
    const embed = new EmbedBuilder()
      .setAuthor({ name: `${username}` })
      .setColor("#ffcc00")
      .setTitle("Harvest Report")
      .setDescription(`You've successfully harvested your crops!`)
      .setFooter({ text: "Stored in your inventory 📦" });
    Object.entries(harvestedCrops).forEach(([crop, amount]) => {
      embed.addFields({
        name: "",
        value: `**${amount}** ${crop}`,
        inline: true,
      });
    });
    // Add XP earned at the end
    embed.addFields({
      name: "",
      value: `**+${totalXP} XP!**`,
      inline: false,
    });

    return message.reply({ embeds: [embed] });
  },
};
