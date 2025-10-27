const { SlashCommandBuilder } = require("discord.js");
const { getPlayer } = require("../utils/playerUtils");
const { parseArguments } = require("../utils/commandUtils");
const { getCrop } = require("../utils/cropUtils");
const crops = require("../data/crops");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("plant")
    .setDescription("Plant a seed in your available plots.")
    .addStringOption((option) =>
      option
        .setName("seed")
        .setDescription("The seed you want to plant")
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("amount")
        .setDescription("The number of seeds to plant (default: 1)")
        .setMinValue(1)
        .setRequired(false)
    ),

  async autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused();
    const player = await getPlayer(interaction.user.id);
    if (!player) return interaction.respond([]);

    // Get only seeds the player owns
    const ownedSeeds = Array.from(player.seeds.entries())
      .filter(([_, amount]) => amount > 0)
      .map(([id, amount]) => {
        const crop = crops.find((c) => c.id === id);
        return { name: `${crop.seedName} (${amount})`, value: id };
      })
      .filter((seed) =>
        seed.name.toLowerCase().includes(focusedValue.toLowerCase())
      );

    await interaction.respond(ownedSeeds.slice(0, 25));
  },

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

    await handlePlant({
      id: message.author.id,
      seedId,
      amount,
      reply: (response) => message.reply(response),
    });
  },
};

async function handlePlant({ id, seedId, amount, reply }) {
  // Check for valid seed
  const seed = getCrop(seedId);
  if (!seed) return reply("Invalid seed.");

  // Check if player exist
  const player = await getPlayer(id, reply);
  if (!player) return;

  // Check if player own or have enough seeds
  const availableSeeds = player.seeds.get(seedId) || 0;
  if (availableSeeds < amount) {
    if (availableSeeds === 0) {
      return reply(`You don't own any **${seed.seedName}**!`);
    } else {
      return reply(`You only have **${availableSeeds}** ${seed.seedName}.`);
    }
  }

  // Check if available plots
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

  for (let i = 0; i < amount; i++) {
    player.plots.push({
      crop: seedId,
      plantedAt: now,
      readyAt: null,
      watered: false,
    });
  }
  await player.save();

  return reply(
    `You planted **${amount}x ${
      seed.seedName
    }**! They’ll be ready in **${Math.floor(seed.growTime / 60000)} minutes.**`
  );
}
