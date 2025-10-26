const { SlashCommandBuilder, EmbedBuilder, Embed } = require("discord.js");
const { getPlayer } = require("../utils/playerUtils");
const { formatTime } = require("../utils/timeUtils");
const crops = require("../data/crops");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("farm")
    .setDescription("Check your farm plots and crop growth progress."),

  async execute(interaction) {
    await handleFarm({
      id: interaction.user.id,
      username: interaction.user.username,
      reply: (response) => interaction.reply(response),
    });
  },

  async executePrefix(message) {
    await handleFarm({
      id: message.author.id,
      username: message.author.displayName,
      reply: (response) => message.reply(response),
    });
  },
};

async function handleFarm({ id, username, reply }) {

  // Check if player exist
  const player = await getPlayer(id, reply);
  if(!player) return;

  // Check if plots are empty
  if (!player.plots.length) {
    return reply(
      "You haven't planted anythign yet! Use `/plant` OR `!plant` to get started."
    );
  }

  // Search for planted crops data
  const now = Date.now();
  const cropStats = {};
  let nextHarvestTime = Infinity;
  let nextHarvestCrop = null;

  for (const plot of player.plots) {
    const cropData = crops.find((c) => c.id === plot.crop);
    if (!cropData) continue;

    if (!cropStats[cropData.id]) {
      cropStats[cropData.id] = {
        name: cropData.name,
        needsWater: 0,
        growingTimes: [],
        readyCount: 0,
      };
    }

    // Crop hasn't been watered yet
    if (!plot.watered) {
      cropStats[cropData.id].needsWater++;
      continue;
    }

    const remaining = plot.readyAt - now;

    if (remaining <= 0) {
      cropStats[cropData.id].readyCount++;
    } else {
      cropStats[cropData.id].growingTimes.push(remaining);

      if (plot.readyAt < nextHarvestTime) {
        nextHarvestTime = plot.readyAt;
        nextHarvestCrop = cropData;
      }
    }
  }

 // Calculate available vs unlocked plots
  const totalPlots = player.plotsUnlocked;
  const usedPlots = player.plots.length;
  const availablePlots = Math.max(0, totalPlots - usedPlots);

  // Format Breakdown
  const breakdownLines = Object.values(cropStats).map((entry) => {
    const total =
      entry.needsWater + entry.growingTimes.length + entry.readyCount;

    if (entry.needsWater === total) {
      return `${entry.name} ×${total} — 💧 Needs Water (${entry.needsWater})`;
    }

    let line = `${entry.name} ×${total} — `;

    if (entry.readyCount > 0) line += `✅ ${entry.readyCount} ready, `;
    if (entry.needsWater > 0)
      line += `💧 ${entry.needsWater} need water, `;

    if (entry.growingTimes.length > 0) {
      const avgTime =
        entry.growingTimes.reduce((a, b) => a + b, 0) /
        entry.growingTimes.length;
      const timeText = formatTime(avgTime);
      line += `⏳ ${timeText}`;
    }

    return line.trim().replace(/,\s*$/, ""); // Remove trailing comma
  });
  
  // Build the "next harvest" message
  let nextHarvestField;
  if (nextHarvestTime === Infinity) {
    nextHarvestField = "All crops are ready or need watering!";
  } else {
    const timeLeft = formatTime(nextHarvestTime - now);
    nextHarvestField = `${nextHarvestCrop.name} — ${timeLeft}`;
  }

  const embed = new EmbedBuilder()
    .setColor("#2ECC71")
    .setTitle(`${username}'s Farm Summary`)
    .addFields(
      {
        name: "🪴 Empty Plots",
        value: `${availablePlots}/${totalPlots}`,
        inline: true,
      },
      { name: "🕒 Next Harvest Ready In", value: nextHarvestField, inline: true },
      {
        name: "🌾 Crop Breakdown",
        value: breakdownLines.join("\n") || "None",
        inline: false,
      },
      
    )
    .setTimestamp();

  return reply({ embeds: [embed] });
}
