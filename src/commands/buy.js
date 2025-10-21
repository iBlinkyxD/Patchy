const Player = require("../models/player");
const crops = require("../data/crops");
const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("buy")
    .setDescription("Buy seeds from the shop.")
    .addStringOption((option) =>
      option
        .setName("seed")
        .setDescription("The seed you want to buy")
        .setRequired(true)
        // Must spread choices
        .addChoices(...crops.map((c) => ({ name: c.seedName, value: c.id })))
    )
    .addIntegerOption((option) =>
      option
        .setName("amount")
        .setDescription("How many seeds to buy")
        .setRequired(true)
    ),

  // Slash command version
  async execute(interaction) {
    const seedId = interaction.options.getString("seed");
    const amount = interaction.options.getInteger("amount") || 1;

    await handleBuy({
      id: interaction.user.id,
      seedId,
      amount,
      reply: (response) => interaction.reply(response),
    });
  },

  // Prefix version: !buy wheat 3
  async executePrefix(message) {
    const args = message.content.trim().split(" ").slice(1);
    if (args.length === 0)
      return message.reply("Please provide a seed to buy.");

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

    await handleBuy({
      id: message.author.id,
      seedId: crop.id, // use the real crop ID
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

// Main buy logic
async function handleBuy({ id, seedId, amount, reply }) {
  const crop = crops.find((c) => c.id === seedId);
  if (!crop) return reply("❌ Invalid seed.");

  const player = await Player.findOne({ userId: id });
  if (!player)
    return reply(
      "🌱 You don’t have a farm yet! Use /startfarm or !startfarm first."
    );

  const totalCost = crop.seedCost * amount;

  if (player.coins < totalCost)
    return reply("💸 You don’t have enough coins to buy that many!");

  player.coins -= totalCost;

  // Inventory: make sure it's a Map or a plain object
  const currentSeeds = player.seeds.get(seedId) || 0;
  player.seeds.set(seedId, currentSeeds + amount);

  await player.save();

  return reply(
    `✅ You bought ${amount}x ${crop.seedName} for 💰${totalCost} coins!\nYou now have ${player.seeds.get(
      seedId
    )}x ${crop.seedName}.`
  );
}
