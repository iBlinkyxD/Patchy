const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getPlayer, regenerateStamina } = require("../utils/playerUtils");
const crops = require("../data/crops");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("water")
    .setDescription("Water your crops to help them grow faster."),

  async execute(interaction) {
    await handleWater({
      id: interaction.user.id,
      reply: (response) => interaction.reply(response),
    });
  },

  async executePrefix(message) {
    await handleWater({
      id: message.author.id,
      reply: (response) => message.reply(response),
    });
  },
};

async function handleWater({ id, reply }) {
  const player = await getPlayer(id, reply);
  if (!player) return;

  regenerateStamina(player);
  await player.save();

  const now = new Date();
  let wateredCount = 0;

  // Find unwatered crops
  for (const plot of player.plots) {
    if (!plot.watered) {
      const cropData = crops.find((c) => c.id === plot.crop);
      if (!cropData) continue;

      // Check stamina before watering this plot
      if (player.stamina < 1) break;

      // Start growth
      plot.watered = true;
      plot.readyAt = new Date(now.getTime() + cropData.growTime);
      player.stamina -= 1;
      wateredCount++;
    }
  }

  if (!player.plots || player.plots.length === 0) {
    return reply({
      content: "You don’t have any crops to water!",
      ephemeral: true,
    });
  }

  if (wateredCount === 0) {
    return reply({
      content:
        "You either have no unwatered crops or not enough stamina to water them!",
      ephemeral: true,
    });
  }

  await player.save();

  const embed = new EmbedBuilder()
    .setColor("#4DA6FF")
    .setTitle("💦 Watered Your Crops!")
    .setDescription(
      `You watered **${wateredCount}** crops — they're now starting to grow! 🌱`
    )
    .addFields({
      name: "",
      value: `**⚡ Stamina Remaining: **${player.stamina}`,
      inline: true,
    })
    .setTimestamp();

  return reply({ embeds: [embed] });
}
