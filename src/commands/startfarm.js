const { SlashCommandBuilder } = require("discord.js");
const Player = require("../models/player");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("startfarm")
    .setDescription("Start your farming journey!"),

  async execute(interaction) {
    await handleStartFarm({
      id: interaction.user.id,
      username: interaction.username,
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
  const existing = await Player.findOne({ userId: id });

  if (existing) {
    return reply({
      content: "🌾 You already have a farm! Use `/profile` OR `!profile` to view it.",
      ephemeral: true,
    });
  }

  const newPlayer = new Player({
    userId: id,
    username: username,
  });

  await newPlayer.save();

  return reply({
    content: "🌱 Farming profile created! Check it with `/profile` OR `!profile`.",
  });
}
