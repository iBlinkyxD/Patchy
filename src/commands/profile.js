const {
  SlashCommandBuilder,
  EmbedBuilder,
  MessageFlags,
} = require("discord.js");
const { getInventory } = require("../utils/inventoryDb");
const { getPlayer } = require("../utils/playersDb");
const { getLevelFromXP } = require("../utils/formulas");
const { getUsedPlot } = require("../utils/plotsDb");
const fs = require("fs");

// Read seeds data from the JSON file
const crops = JSON.parse(fs.readFileSync("./src/data/crops.json", "utf-8"));


module.exports = {
  data: new SlashCommandBuilder()
    .setName("profile")
    .setDescription("View your farming profile."),

  async execute(interaction) {
    await handleProfileRequest({
      id: interaction.user.id,
      name: interaction.user.displayName,
      avatar: interaction.user.displayAvatarURL(),
      reply: (response) => interaction.reply(response),
      ephemeralFlag: MessageFlags.Ephemeral,
    });
  },

  async executePrefix(message) {
    await handleProfileRequest({
      id: message.author.id,
      name: message.author.displayName,
      avatar: message.author.displayAvatarURL(),
      reply: (response) => message.reply(response),
      ephemeralFlag: true,
    });
  },
};

async function handleProfileRequest({
  id,
  name,
  avatar,
  reply,
  ephemeralFlag,
}) {
  try {
    const player = await getPlayer(id);
    if (!player) {
      return reply({
        content:
          "You don't have a farm yet. Use `/startfarm` OR `!startfarm` to create one!",
        flags: ephemeralFlag,
      });
    }

    const { level, currentXP, nextLevelXP } = getLevelFromXP(player.xp);
    const inventory = await getInventory(id, "crop");

    // Format inventory with emojis
    let formattedInventory =
      inventory.length > 0
        ? inventory
            .map((item) => {
              const crop = crops.find((c) => c.name.toLowerCase() === item.item_name.toLowerCase());
              const emoji = crop ? crop.emoji : "❓"; // Use default ❓ if emoji is not found
              return `**${item.quantity}** ${emoji} ${item.item_name}`;
            })
            .join("\n")
        : "You have no crops."; // If no items, show an empty message

    const usedPlot = await getUsedPlot(id);
    let emptyPlot = player.max_plots - usedPlot;

    const embed = new EmbedBuilder()
      .setColor("#2ECC71")
      .setTitle(`${name}'s Farming Profile`)
      .setThumbnail(avatar)
      .addFields(
        { name: "", value: `🌟 **Level ${level}**`, inline: true },
        { name: "", value: `⚡ XP: ${currentXP}/${nextLevelXP}`, inline: true },
        {
          name: "",
          value: `💰 Balance: **$${Math.round(player.coins)}**`,
          inline: false,
        },
        { name: "", value: `🏡 Available Plots: ${emptyPlot}/${player.max_plots}`, inline: false },
        { name: "📦 Inventory", value: formattedInventory, inline: false }
      )
      .setTimestamp();

    reply({ embeds: [embed] });
  } catch (error) {
    console.error("Database error: ", error);
    reply({
      content: "There was an error retrieving your profile.",
      flags: ephemeralFlag,
    });
  }
}
