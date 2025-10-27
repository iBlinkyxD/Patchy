const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getPlayer } = require("../utils/playerUtils");
const {
  getCurrentShopSeeds,
  SHOP_ROTATION_INTERVAL,
  getLastShopRotation,
} = require("../utils/shopUtils");

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

async function handleShop({ id, reply }) {
  // Check if player exist
  const player = await getPlayer(id, reply);
  if (!player) return;

  // Get current seed shop rotation
  const seeds = getCurrentShopSeeds();

  // Create seed shop list
  const shopList = seeds
    .map((c) => `**${c.seedName}** — 💵 $${c.seedCost}`)
    .join("\n");

  // Calculate time for next rotation
  const nextRotationIn =
    SHOP_ROTATION_INTERVAL - (Date.now() - getLastShopRotation());
  const minutes = Math.floor(nextRotationIn / 60000);
  const seconds = Math.floor((nextRotationIn % 60000) / 1000);

  const embed = new EmbedBuilder()
    .setColor("#f5e942")
    .setTitle("🌻 Seed Shop (Rotates Every 30 Minutes)")
    .addFields(
      { name: "", value: `**💰 Balance: ** $${player.coins}`, inline: true },
      {
        name: "🪴 Available Seeds",
        value: shopList || "No seeds available right now!",
      },
      {
        name: "",
        value: `**⏱️ Next Rotation: **${minutes}m ${seconds}s`,
        inline: false,
      }
    )
    .setFooter({
      text: "Use /buy <seed> or !buy <seed> to purchase seeds!",
    });

  return reply({ embeds: [embed] });
}
