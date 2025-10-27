const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getPlayer } = require("../utils/playerUtils");
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
  // Check if player exist
  const player = await getPlayer(id, reply);
  if (!player) return;

  // Get all seeds from player inventory
  // ✅ Filter out 0-amount seeds
  const seedEntries = Array.from(player.seeds.entries()).filter(
    ([, amount]) => amount > 0
  );

  const seedText =
    seedEntries.length > 0
      ? seedEntries
          .map(([id, amount]) => {
            const crop = crops.find((c) => c.id === id);
            return `**${amount}** ${crop?.seedName || id}`;
          })
          .join("\n")
      : "No seeds yet.";

  // Get all crop from player inventory
  const cropEntries = Array.from(player.crops.entries()).filter(
    ([, amount]) => amount > 0
  );
  
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
