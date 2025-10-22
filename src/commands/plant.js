const { SlashCommandBuilder } = require("discord.js");
const crops = require("../data/crops");
const Player = require("../models/player");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("plant")
    .setDescription("Plant a seed in your available plots.")
    .addStringOption((option) =>
      option
        .setName("seed")
        .setDescription("The seed you want to plant")
        .setRequired(true)
        .addChoices(crops.map((c) => ({ name: c.seedName, value: c.id })))
    )
    .addIntegerOption((option) =>
      option
        .setName("amount")
        .setDescription("The number of seeds to plant (default: 1)")
        .setMinValue(1)
        .setRequired(false)
    ),

  async execute(interaction) {
    const seedId = interaction.options.getString("seed");
    const amount = interaction.options.getInteger("amount") || 1;
    await handlePlant({
      id: interaction.user.id,
      seedId,
      amount,
      reply: (response) => interaction.reply(response),
    });
  },

  async executePrefix(message) {
    const args = message.content.trim().split(" ").slice(1);
    if (args.length === 0)
      return message.reply("Please provide a seed to plant.");

    const { seedId, amount } = parseArguments(args);

    // Match user input to a crop (case-insensitive)
    const crop =
      crops.find(
        (c) =>
          c.id.toLowerCase() === seedId.toLowerCase() ||
          c.name.toLowerCase().includes(seedId.toLowerCase()) ||
          c.seedName.toLowerCase().includes(seedId.toLowerCase())
      ) || null;

    if (!crop) return message.reply("❌ Invalid seed name.");

    await handlePlant({
      id: message.author.id,
      seedId: crop.id,
      amount,
      reply: (response) => message.reply(response),
    });
  },
};

// Helper to extract seed + amount
function parseArguments(args) {
  let amount = parseInt(args[args.length - 1]);
  let seedId = isNaN(amount) ? args.join(" ") : args.slice(0, -1).join(" ");
  return {
    seedId,
    amount: isNaN(amount) ? 1 : Math.max(amount, 1),
  };
}

async function handlePlant({ id, seedId, amount, reply }) {
  const crop = crops.find((c) => c.id === seedId);
  if (!crop) return reply("❌ Invalid seed.");

  const player = await Player.findOne({ userId: id });
  if (!player) {
    return reply({
      content:
        "You don't have a farm yet. Use `/startfarm` OR `!startfarm` to create one!",
      ephemeral: true,
    });
  }

  const availableSeeds = player.seeds.get(seedId) || 0;
  if (availableSeeds < amount) {
    if (availableSeeds === 0) {
      return reply(`You don't own any **${crop.seedName}**!`);
    } else {
      return reply(
        `You only have **${availableSeeds}** ${crop.seedName}.`
      );
    }
  }

  const availablePlots = player.plotsUnlocked - player.plots.length;
  if (availablePlots <= 0)
    return reply("🚜 All your plots are currently used!");
  if (amount > availablePlots)
    return reply(
      `🚜 You only have **${availablePlots}** free plots available.`
    );

  // Update player data
  player.seeds.set(seedId, availableSeeds - amount);

  const now = new Date();
  const readyAt = new Date(now.getTime() + crop.growTime);

  for (let i = 0; i < amount; i++) {
    player.plots.push({
      crop: seedId,
      plantedAt: now,
      readyAt,
    });
  }
  await player.save();

  return reply(
    `You planted **${amount}x ${
      crop.seedName
    }**! They’ll be ready in **${Math.floor(crop.growTime / 60000)} minutes.**`
  );
}
