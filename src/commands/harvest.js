const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const Player = require("../models/player");
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
  const player = await Player.findOne({ userId: id });

  if (!player) {
    return reply({
      content:
        "🌾 You don't have a farm yet. Use `/startfarm` OR `!startfarm` to create one!",
      ephemeral: true,
    });
  }

  if (player.plots.length === 0)
    return reply("🌱 You don’t have any crops planted right now.");

  const now = new Date();
  let harvested = [];
  let remaining = [];
  let totalXP = 0;

  // Separate ready vs. not ready crops
  for (const plot of player.plots) {
    const cropData = crops.find((c) => c.id === plot.crop);
    if (!cropData) continue;

    // Check if crop is ready
    if (plot.readyAt <= now) {
      const yieldAmount = Math.floor(Math.random() * 3) + 1; // 1–3 crops

      // Add to inventory
      const currentAmount = player.crops.get(cropData.id) || 0;
      player.crops.set(cropData.id, currentAmount + yieldAmount);

      harvested.push({
        crop: cropData,
        yield: yieldAmount,
      });

      // Rewards
      totalXP += cropData.xp * yieldAmount;
    } else {
      remaining.push(plot); // not ready yet
    }
  }

  if (harvested.length === 0)
    return reply("🕒 None of your crops are ready yet! Check back later.");

  // Update player
  player.plots = remaining;
  player.xp += totalXP;

  const xpNeeded = player.level * 100;
  if (player.xp > xpNeeded) {
    player.level++;
    player.xp -= xpNeeded;
  }

  await player.save();

  const summary = harvested
    .map(
      (h) =>
        `${h.crop.name} ×${h.yield} (, ⭐ ${
          h.crop.xp * h.yield
        })`
    )
    .join("\n");

    const embed = new EmbedBuilder()
      .setTitle("🌾 Harvest Results")
      .setColor("Green")
      .setDescription(summary)
      .addFields(
        { name: "⭐ Total XP Gained", value: `${totalXP}`, inline: true },
        { name: "🏅 Level", value: `${player.level}`, inline: true }
      )
      .setTimestamp();

    return reply({ embeds: [embed] });
}
