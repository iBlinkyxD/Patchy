const {
  SlashCommandBuilder,
  EmbedBuilder,
  MessageFlags,
} = require("discord.js");
const {
  getReadyCrops,
  harvestCrop
} = require("../utils/plotsDb");
const {addToInventory} = require("../utils/inventoryDb");
const { getPlayer, addXP } = require("../utils/playersDb");
const fs = require("fs");

// Read crops data once and store it globally
const crops = JSON.parse(fs.readFileSync("./src/data/crops.json", "utf-8"));

// Create a map of crop names to XP for faster lookup
const cropXPMap = crops.reduce((acc, crop) => {
  acc[crop.name.toLowerCase()] = crop.xp;
  return acc;
}, {});

module.exports = {
  data: new SlashCommandBuilder()
    .setName("harvest")
    .setDescription(
      "Harvest all fully grown crops and store them in inventory."
    ),

  async execute(interaction) {
    handleHarvest({
      id: interaction.user.id,
      name: interaction.user.displayName,
      reply: (response) => interaction.reply(response),
      ephemeralFlag: MessageFlags.Ephemeral,
    });
  },

  async executePrefix(message) {
    handleHarvest({
      id: message.author.id,
      name: message.author.displayName,
      reply: (response) => message.reply(response),
      ephemeralFlag: true,
    });
  },
};

async function handleHarvest({ id, name, reply, ephemeralFlag }) {
  try {
    const player = await getPlayer(id);

    if (!player) {
      return reply({
        content:
          "You don't have a farm yet. Use `/startfarm` OR `!startfarm` to create one!",
        flags: ephemeralFlag,
      });
    }

    // Fetch crops that are ready for harvest
    const readyCrops = await getReadyCrops(id);
    if (!readyCrops.length) {
      return reply("⏳ You have no crops ready for harvest!");
    }

    let harvestedCrops = {};
    let totalXP = 0;

    // Perform batch database operations
    const harvestPromises = readyCrops.map(async (crop) => {
      // Store harvested crops in inventory
      await addToInventory(
        id,
        crop.item_name,
        crop.yield,
        crop.sort_order,
        "crop"
      );

      // Reset the farm plot
      await harvestCrop(crop.plot_id);

      // Accumulate crop data
      harvestedCrops[crop.item_name] =
        (harvestedCrops[crop.item_name] || 0) + crop.yield;

      // Calculate XP for the crop
      const cropXP = cropXPMap[crop.item_name.toLowerCase()] || 1; // Default XP = 1
      totalXP += crop.yield * cropXP;
    });

    // Wait for all promises to complete
    await Promise.all(harvestPromises);

    // Add total XP
    await addXP(id, totalXP);

    // Construct embed message
    const embed = new EmbedBuilder()
      .setAuthor({ name: name })
      .setColor("#ffcc00")
      .setTitle("Harvest Report")
      .setDescription("You've successfully harvested your crops!")
      .setFooter({ text: "Stored in your inventory 📦" });

    // Construct a single string for all harvested crops
    let cropsList = "";
    Object.entries(harvestedCrops).forEach(([crop, amount]) => {
      const cropData = crops.find((c) => c.name.toLowerCase() === crop.toLowerCase());
      const emoji = cropData?.emoji || "🌱"; // Default emoji if not found
      cropsList += `${emoji} **${amount}** ${crop}\n`;
    });

    // Add harvested crops data to the embed
    embed.addFields({
      name: "",
      value: cropsList || "No crops were harvested.", // Default message if no crops were harvested
      inline: false,
    });

    // Add XP earned at the end
    embed.addFields({
      name: "",
      value: `**+${totalXP} XP!**`,
      inline: false,
    });

    // Reply with the embed
    return reply({ embeds: [embed] });
  } catch (error) {
    console.error("Error during harvest process:", error);
    return reply({
      content: "There was an error during the process.",
      flags: ephemeralFlag,
    });
  }
}
