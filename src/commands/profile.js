const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

module.exports = {
  data: new SlashCommandBuilder()
    .setName("profile")
    .setDescription("View your farming profile."),

  async execute(interaction) {
    const playerId = interaction.user.id;
    const username = interaction.user.displayName;

    try {
      // Fetch player data
      const playerQuery = "SELECT * FROM players WHERE player_id = $1";
      const playerResult = await pool.query(playerQuery, [playerId]);

      if (playerResult.rows.length === 0) {
        return interaction.reply({
          content:
            "You don't have a farming profile yet. Use `/startfarm` to create one!",
          ephemeral: true,
        });
      }

      const player = playerResult.rows[0];

      // Fetch inventory
      const inventoryQuery =
        "SELECT item_name, quantity FROM inventory WHERE player_id = $1 AND quantity > 0";
      const inventoryResult = await pool.query(inventoryQuery, [playerId]);
      const inventory =
        inventoryResult.rows
          .map((item) => `${item.item_name}: ${item.quantity}`)
          .join("\n") || "You have no crops! Get some by farming.";

      // Create embed
      const embed = new EmbedBuilder()
        .setColor("#2ECC71")
        .setTitle(`${username}'s Farming Profile`)
        .setThumbnail(interaction.user.displayAvatarURL())
        .addFields(
          {
            name: "Balance",
            value: `$${player.coins.toFixed(2)}`,
            inline: true,
          },
          { name: "🌟 Level", value: `${player.level}`, inline: true },
          { name: "⚡ XP", value: `${player.xp}`, inline: true },
          { name: "🏡 Max Plots", value: `${player.max_plots}`, inline: true },
          { name: "📦 Inventory", value: inventory, inline: false }
        )
        .setTimestamp();
      interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error("Database error: ", error);
      interaction.reply({
        content: "There was an error retrieving your profile.",
        ephemeral: true,
      });
    }
  },

  async executePrefix(message) {
    const playerId = message.author.id;
    const username = message.author.displayName;

    try {
      // Fetch player data
      const playerQuery = "SELECT * FROM players WHERE player_id = $1";
      const playerResult = await pool.query(playerQuery, [playerId]);

      if (playerResult.rows.length === 0) {
        return message.reply({
          content:
            "You don't have a farming profile yet. Use `/startfarm` to create one!",
          ephemeral: true,
        });
      }

      const player = playerResult.rows[0];

      // Fetch inventory
      const inventoryQuery =
        "SELECT item_name, quantity FROM inventory WHERE player_id = $1 AND quantity > 0";
      const inventoryResult = await pool.query(inventoryQuery, [playerId]);
      const inventory =
        inventoryResult.rows
          .map((item) => `${item.item_name}: ${item.quantity}`)
          .join("\n") || "You have no crops! Get some by farming.";

      // Create embed
      const embed = new EmbedBuilder()
        .setColor("#2ECC71")
        .setTitle(`${username}'s Farming Profile`)
        .setThumbnail(message.author.displayAvatarURL())
        .addFields(
          {
            name: "💰 Balance",
            value: `$${Number(player.coins).toFixed(2)}`,
            inline: true,
          },
          { name: "🌟 Level", value: `${player.level}`, inline: true },
          { name: "⚡ XP", value: `${player.xp}`, inline: true },
          { name: "🏡 Max Plots", value: `${player.max_plots}`, inline: true },
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
