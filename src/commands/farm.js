const { SlashCommandBuilder, EmbedBuilder, Embed } = require("discord.js");
const Player = require("../models/player");
const crops = require("../data/crops");

function formatTime(ms) {
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const hours = Math.floor(minutes / 60);
    const remMinutes = minutes % 60;

    if (hours > 0) return `${hours}h ${remMinutes}m ${seconds}s left`;
    else if (minutes > 0) return `${minutes}m ${seconds}s left`;
    else return `${seconds}s left`;
}

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
  const player = await Player.findOne({ userId: id });
  if (!player) {
    return reply({
      content:
        "You don't have a farm yet. Use `/startfarm` OR `!startfarm` to create one!",
      ephemeral: true,
    });
  }

  if (!player.plots.length) {
    return reply(
      "You haven't planted anythign yet! Use `/plant` OR `!plant` to get started."
    );
  }

  const now = Date.now();
  const cropStats = {};
  let nextHarvestTime = Infinity;
  let nextHarvestCrop = null;

  for (const plot of player.plots) {
    const cropData = crops.find((c) => c.id === plot.crop);
    if (!cropData) continue;

    if (!cropStats[cropData.id])
      cropStats[cropData.id] = {
        name: cropData.name,
        readyCount: 0,
        growingTimes: [],
      };

    const remaining = plot.readyAt - now;
    if (remaining <= 0) {
      cropStats[cropData.id].readyCount++;
    } else {
      cropStats[cropData.id].growingTimes.push(remaining);

      // ✅ Track the soonest harvest time
      if (plot.readyAt < nextHarvestTime) {
        nextHarvestTime = plot.readyAt;
        nextHarvestCrop = cropData;
      }
    }
  }

  const totalPlots = player.plotsUnlocked;
  const usedPlots = player.plots.length;
  const emptyPlots = Math.max(0, totalPlots - usedPlots);

  // Format Breakdown
  const breakdownLines = Object.values(cropStats).map((entry) => {
    const total = entry.readyCount + entry.growingTimes.length;

    if (entry.growingTimes.length === 0) {
      return `${entry.name} ×${total} — ✅ All Ready!`;
    }

    // Average remaining grow time
    const avgTime =
      entry.growingTimes.reduce((a, b) => a + b, 0) /
      entry.growingTimes.length;

    const timeText = formatTime(avgTime);
    const readyText =
      entry.readyCount > 0 ? `✅ ${entry.readyCount} ready, ` : "";
    return `${entry.name} ×${total} — ${readyText}⏳ ${timeText}`;
  });
  
  // ✅ Build the "next harvest" message
  let nextHarvestField;
  if (nextHarvestTime === Infinity) {
    nextHarvestField = "All crops are ready to harvest!";
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
        value: `${emptyPlots}/${totalPlots}`,
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
