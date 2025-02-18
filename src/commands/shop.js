const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require("discord.js");
const { getPlayer } = require("../utils/playersDb");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("shop")
    .setDescription("View available seeds and upgrade for purchase."),

  async execute(interaction) {
    await handleShop({
      id: interaction.user.id,
      name: interaction.user.displayName,
      reply: (response) => interaction.reply(response),
      ephemeralFlag: MessageFlags.Ephemeral,
    });
  },

  async executePrefix(message) {
    await handleShop({
      id: message.author.id,
      name: message.author.displayName,
      reply: (response) => message.reply(response),
      ephemeralFlag: true,
    });
  },
};

async function handleShop({ id, name, reply, ephemeralFlag }) {
  try {
    const player = await getPlayer(id);

    if (!player) {
      return reply({
        content: "You don't have a farm yet. Use `/startfarm` to create one!",
        flags: ephemeralFlag,
      });
    }

    // Create buttons for Seed Shop and Upgrade Shop
    const buttonRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("seed_shop")
        .setLabel("🌱")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("upgrade_shop")
        .setLabel("🏡")
        .setStyle(ButtonStyle.Primary)
    );

    // Send the initial embed with buttons to choose a shop
    const embed = new EmbedBuilder()
      .setAuthor({ name: `${name}` })
      .setTitle("Please select a category.")
      .setDescription(
        "🌱 **Seed Shop** - Shop for seeds. \n 🏡 **Farm Upgrade** - Shop for farm upgrades."
      )
      .setColor("#FFA500");

    await reply({
      embeds: [embed],
      components: [buttonRow],
    });
  } catch (error) {
    console.error("Error during shop handling:", error);
    return reply({
      content: "There was an error while loading the shop.",
      flags: ephemeralFlag,
    });
  }
}
