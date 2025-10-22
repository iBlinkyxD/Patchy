const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const Player = require("../models/player");
const crops = require("../data/crops");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("inventory")
    .setDescription("Check your inventory"),

  async execute(interaction) {
    handleInventory({
      id: interaction.user.id,
      username: interaction.user.displayName,
      reply: (response) => interaction.reply(response),
    });
  },

  async executePrefix(message) {
    handleInventory({
      id: message.author.id,
      username: message.author.displayName,
      reply: (response) => message.reply(response),
    });
  },
};

async function handleInventory({ id, username, reply }) {
  let player = await Player.findOne({ userId: id });

  if (!player) {
    return reply({
      content:
        "You don't have a farm yet. Use `/startfarm` OR `!startfarm` to create one!",
      ephemeral: true,
    });
  }

  const seedEntries = Array.from(player.seeds.entries());

  const seedText =
    seedEntries.length > 0
      ? seedEntries
          .map(([id, amount]) => {
            const crop = crops.find((c) => c.id === id);
            return `**${amount}** ${crop?.seedName || id}`;
          })
          .join("\n")
      : "No seeds yet.";

  const cropEntries = Array.from(player.crops.entries());

  const cropText =
    cropEntries.length > 0
      ? cropEntries
          .map(([id, amount]) => {
            const crop = crops.find((c) => c.id === id);
            return `**${amount}** ${crop?.name || id}`;
          })
          .join("\n")
      : "No crops yet.";

  const embed = new EmbedBuilder()
    .setTitle(`📦 ${username}’s Inventory`)
    .setColor("#fce303")
    .addFields({ name: "**Seeds**", value: seedText })
    .addFields({ name: "**Crops**", value: cropText });

  return reply({ embeds: [embed] });
}
