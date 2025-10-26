const { SlashCommandBuilder } = require("discord.js");
const Player = require("../models/player");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("startfarm")
    .setDescription("Start your farming journey!"),

  async execute(interaction) {
    await handleStartFarm({
      id: interaction.user.id,
      username: interaction.user.displayName,
      reply: (response) => interaction.reply(response),
    });
  },

  async executePrefix(message) {
    await handleStartFarm({
      id: message.author.id,
      username: message.author.displayName,
      reply: (response) => message.reply(response),
    });
  },
};

async function handleStartFarm({ id, username, reply }) {

  // Check if player exist
  const player = await Player.findOne({ userId: id });
  if (player) {
    return reply({
      content: "You already have a farm! Use `/profile` OR `!profile` to view it.",
      ephemeral: true,
    });
  }

  // Create new player if doesn't exist
  const newPlayer = new Player({
    userId: id,
    username: username,
  });

  await newPlayer.save();

  return reply({
    content: "🌱 Farming profile created! Check it with `/profile` OR `!profile`.",
  });
}
