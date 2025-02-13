const { SlashCommandBuilder } = require("discord.js");
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

module.exports = {
  data: new SlashCommandBuilder()
    .setName("startfarm")
    .setDescription("Create your farming profile."),
  async execute(interaction) {
    const playerId = interaction.user.id;

    try {
      // Check if the player already exists
      const checkQeury = "SELECT * FROM players WHERE player_id = $1";
      const checkResult = await pool.query(checkQeury, [playerId]);

      if (checkResult.rows.length > 0) {
        return interaction.reply({
          content: "You already have a farming profile!",
          ephemeral: true,
        });
      }

      // Insert new player data
      const insertQuery = `
                INSERT INTO players (player_id, coins, level, xp, max_plots)
                VALUES ($1, 100.00, 1, 0, 3)
            `;
      await pool.query(insertQuery, [playerId]);

      interaction.reply("Farming profile created! Check it with /profile");
    } catch (error) {
      console.error("Database error: ", error);
      interaction.reply({
        content: "There was an error creating your profile.",
        ephemeral: true,
      });
    }
  },

  async executePrefix(message) {
    const playerId = message.author.id;

    try {
      // Check if the player already exists
      const checkQeury = "SELECT * FROM players WHERE player_id = $1";
      const checkResult = await pool.query(checkQeury, [playerId]);

      if (checkResult.rows.length > 0) {
        return message.reply({
          content: "You already have a farming profile!",
          ephemeral: true,
        });
      }

      // Insert new player data
      const insertQuery = `
                INSERT INTO players (player_id, coins, level, xp, max_plots)
                VALUES ($1, 100.00, 1, 0, 3)
            `;
      await pool.query(insertQuery, [playerId]);

      message.reply("Farming profile created! Check it with /profile");
    } catch (error) {
      console.error("Database error: ", error);
      message.reply({
        content: "There was an error creating your profile.",
        ephemeral: true,
      });
    }
  },
};
