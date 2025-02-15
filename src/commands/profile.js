const {
  SlashCommandBuilder,
  EmbedBuilder,
  MessageFlags,
} = require("discord.js");
const { getPlayer, getInventory } = require("../utils/db");
const { getLevelFromXP } = require("../utils/calculation");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("profile")
    .setDescription("View your farming profile."),

  async execute(interaction) {
    const playerId = interaction.user.id;
    const username = interaction.user.displayName;

    const player = await getPlayer(playerId);
    const { level, currentXP, nextLevelXP } = getLevelFromXP(player.xp);
    const inventory = await getInventory(playerId, "crop");

    try {
      if (!player) {
        return interaction.reply({
          content:
            "You don't have a farm yet. Use `/startfarm` OR `!startfarm` to create one!",
          flags: MessageFlags.Ephemeral,
        });
      }

      // Create embed
      const embed = new EmbedBuilder()
        .setColor("#2ECC71")
        .setTitle(`${username}'s Farming Profile`)
        .setThumbnail(interaction.author.displayAvatarURL())
        .addFields(
          { name: "", value: `🌟 **Level ${level}**`, inline: true },
          {
            name: "",
            value: `⚡ XP: ${currentXP}/${nextLevelXP}`,
            inline: true,
          }, // XP progress bar
          {
            name: "",
            value: `💰 Balance: **$${Math.round(player.coins)}**`,
            inline: false,
          },
          { name: "", value: `🏡 Plots: ${player.max_plots}`, inline: false },
          { name: "📦 Inventory", value: inventory, inline: false }
        )
        .setTimestamp();
      interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error("Database error: ", error);
      interaction.reply({
        content: "There was an error retrieving your profile.",
        flags: MessageFlags.Ephemeral,
      });
    }
  },

  async executePrefix(message) {
    const playerId = message.author.id;
    const username = message.author.displayName;

    const player = await getPlayer(playerId);
    const { level, currentXP, nextLevelXP } = getLevelFromXP(player.xp);
    const inventory = await getInventory(playerId, "crop");

    try {
      if (!player) {
        return message.reply({
          content:
            "You don't have a farm yet. Use `/startfarm` OR `!startfarm` to create one!",
          ephemeral: true,
        });
      }

      // Create embed
      const embed = new EmbedBuilder()
        .setColor("#2ECC71")
        .setTitle(`${username}'s Farming Profile`)
        .setThumbnail(message.author.displayAvatarURL())
        .addFields(
          { name: "", value: `🌟 **Level ${level}**`, inline: true },
          {
            name: "",
            value: `⚡ XP: ${currentXP}/${nextLevelXP}`,
            inline: true,
          }, // XP progress bar
          {
            name: "",
            value: `💰 Balance: **$${Math.round(player.coins)}**`,
            inline: false,
          },
          { name: "", value: `🏡 Plots: ${player.max_plots}`, inline: false },
          { name: "📦 Inventory", value: inventory, inline: false }
        )
        .setTimestamp();
      message.reply({ embeds: [embed] });
    } catch (error) {
      console.error("Database error: ", error);
      message.reply({
        content: "There was an error retrieving your profile.",
        ephemeral: true,
      });
    }
  },
};
