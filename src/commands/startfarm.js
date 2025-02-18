const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const { getPlayer, createPlayer } = require("../utils/playersDb");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("startfarm")
    .setDescription("Create your farming profile."),

  async execute(interaction) {
    await handleStartFarm({
      id: interaction.user.id,
      reply: (response) => interaction.reply(response),
      ephemeralFlag: MessageFlags.Ephemeral,
    });
  },

  async executePrefix(message) {
    await handleStartFarm({
      id: message.author.id,
      reply: (response) => message.reply(response),
      ephemeralFlag: true,
    });
  },
};

async function handleStartFarm({ id, reply, ephemeralFlag }) {
  try {
    const player = await getPlayer(id);

    if (player) {
      return reply({
        content:
          "You already have a farm! Use `/profile` OR `!profile` to view it.",
        flags: ephemeralFlag,
      });
    }

    await createPlayer(id);

    reply("🌾 Farming profile created! Check it with `/profile`.");
  } catch (error) {
    console.error("Database error in startfarm:", error);
    reply({
      content:
        "⚠️ An error occurred while creating your profile. Please try again later.",
      flags: ephemeralFlag,
    });
  }
}
