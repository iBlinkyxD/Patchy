const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const { getPlayer, createPlayer } = require("../utils/db");
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

    const player = await getPlayer(playerId);

    try {
      if (player) {
        return interaction.reply({
          content:
            "You already have a farm yet. Use `/profile` OR `!profile` to view it!",
          flags: MessageFlags.Ephemeral,
        });
      }

      // Insert new player data
      await createPlayer(playerId);

      interaction.reply("Farming profile created! Check it with /profile");
    } catch (error) {
      console.error("Database error: ", error);
      interaction.reply({
        content: "There was an error creating your profile.",
        flags: MessageFlags.Ephemeral,
      });
    }
  },

  async executePrefix(message) {
    const playerId = message.author.id;
    const player = await getPlayer(playerId);
    try {
      if (player) {
        return message.reply({
          content:
            "You already have a farm yet. Use `/profile` OR `!profile` to view it!",
          ephemeral: true,
        });
      }

      // Insert new player data
      await createPlayer(playerId);

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
