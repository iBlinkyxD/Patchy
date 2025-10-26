const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getPlayer } = require("../utils/playerUtils");
const crops = require("../data/crops");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("harvest")
    .setDescription(
      "Harvest all fully grown crops and store them in inventory."
    ),

  async execute(interaction) {
    handleHarvest({
      id: interaction.user.id,
      reply: (response) => interaction.reply(response),
    });
  },

  async executePrefix(message) {
    handleHarvest({
      id: message.author.id,
      reply: (response) => message.reply(response),
    });
  },
};

async function handleHarvest({ id, reply }) {
  // Check if player exist
  const player = await getPlayer(id, reply);
  if (!player) return;

  // Check if crops are ready to harvest
  if (player.plots.length === 0)
    return reply("You don’t have any crops planted right now.");

  const now = Date.now();
  const harvestSummary = {};
  const remainingPlots = [];

  // Process each plot
  for (const plot of player.plots) {
    const cropData = crops.find((c) => c.id === plot.crop);
    if (!cropData) continue;

    // Skip crops that haven't been watered
    if (!plot.watered) {
      remainingPlots.push(plot);
      continue;
    }

    if (plot.readyAt <= now) {
      const yieldAmount = Math.floor(Math.random() * 3) + 1; // random 1–3
      const xpGain = cropData.xp * yieldAmount;

      // Add to player's crop inventory
      const currentAmount = player.crops.get(cropData.id) || 0;
      player.crops.set(cropData.id, currentAmount + yieldAmount);

      // Add to summary
      if (!harvestSummary[cropData.id]) {
        harvestSummary[cropData.id] = {
          name: cropData.name,
          totalYield: 0,
          xpGained: 0,
        };
      }
      harvestSummary[cropData.id].totalYield += yieldAmount;
      harvestSummary[cropData.id].xpGained += xpGain;
    } else {
      remainingPlots.push(plot);
    }
  }

  if (Object.keys(harvestSummary).length === 0)
    return reply("None of your crops are ready yet! Check back later.");

  // Update player data
  player.plots = remainingPlots;

  const totalXP = Object.values(harvestSummary).reduce(
    (sum, c) => sum + c.xpGained,
    0
  );
  player.xp += totalXP;

  // Level up check
  let leveledUp = false;
  let xpNeeded = player.level * 100;
  while (player.xp >= xpNeeded) {
    player.xp -= xpNeeded;
    player.level++;
    leveledUp = true;
    xpNeeded = player.level * 100;
  }

  await player.save();

  // Format summary lines
  const summaryLines = Object.values(harvestSummary)
    .map((c) => `${c.name} ×${c.totalYield} (⭐ ${c.xpGained})`)
    .join("\n");

  const embed = new EmbedBuilder()
    .setTitle("🌾 Harvest Summary")
    .setColor("Green")
    .setDescription(summaryLines)
    .addFields(
      { name: "⭐ Total XP Gained", value: `${totalXP}`, inline: true },
      { name: "🌟 Level", value: `${player.level}`, inline: true },
      { name: "📈 XP", value: `${player.xp}/${xpNeeded}`, inline: true }
    )
    .setFooter({
      text: leveledUp ? "🎉 You leveled up!" : "Keep harvesting to gain XP!",
    })
    .setTimestamp();

  return reply({ embeds: [embed] });
}
