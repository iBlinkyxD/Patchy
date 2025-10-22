const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const crops = require("../data/crops");
const Player = require("../models/player");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("shop")
    .setDescription("View available seeds for purchase."),

  async execute(interaction) {
    await handleShop({
      id: interaction.user.id,
      reply: (response) => interaction.reply(response),
    });
  },

  async executePrefix(message) {
    await handleShop({
      id: message.author.id,
      reply: (response) => message.reply(response),
    });
  },
};

async function handleShop({id, reply }) {
  const player = await Player.findOne({ userId: id });
  if (!player) {
    return reply({
      content:
        "You don't have a farm yet. Use `/startfarm` OR `!startfarm` to create one!",
      ephemeral: true,
    });
  }

  const shopList = crops
    .map(
      (c) =>
        `${c.seedName} — 💰 ${c.seedCost} coins | ⏳ ${
          c.growTime / 60000
        } min | ⭐ ${c.xp} XP`
    )
    .join("\n");

  const embed = new EmbedBuilder()
    .setColor("#f5e942")
    .setTitle("🌻 Seed Shop")
    .addFields(
      {
        name: "",
        value: `💰 Balance: **$${player.coins}**`,
        inline: false,
      },
      { name: "", value: shopList }
    )
    .setFooter({text: "Use /buy <seed> or !buy <seed> to purchase seeds!"});
  return reply({ embeds: [embed] });
}
