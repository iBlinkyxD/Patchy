const { SlashCommandBuilder } = require("discord.js");
const { getPlayer, checkCoins } = require("../utils/playerUtils");
const { isSeedInRotation, getCurrentShopSeeds } = require("../utils/shopUtils");
const { parseArguments } = require("../utils/commandUtils");
const { getCrop } = require("../utils/cropUtils");
const crops = require("../data/crops");
const { autocomplete } = require("./sell");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("buy")
    .setDescription("Buy seeds from the shop.")
    .addStringOption(
      (option) =>
        option
          .setName("seed")
          .setDescription("The seed you want to buy")
          .setRequired(true)
          .setAutocomplete(true) // ✅ dynamic list
    )
    .addIntegerOption((option) =>
      option
        .setName("amount")
        .setDescription("How many seeds to buy")
        .setRequired(true)
    ),

  async autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused();
    const seeds = getCurrentShopSeeds();

    const filtered = seeds
      .filter((seed) =>
        seed.seedName.toLowerCase().includes(focusedValue.toLowerCase())
      )
      .map((seed) => ({ name: seed.seedName, value: seed.id }));

    await interaction.respond(filtered.slice(0, 25)); // Discord allows max 25 options
  },

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

  async executePrefix(message) {
    const args = message.content.trim().split(" ").slice(1);
    if (args.length === 0)
      return message.reply("Please provide a seed to buy.");

    const { seedId, amount } = parseArguments(args);

    await handleBuy({
      id: message.author.id,
      seedId,
      amount,
      reply: (response) => message.reply(response),
    });
  },
};

async function handleBuy({ id, seedId, amount, reply }) {
  // Check for valid seed
  const seed = getCrop(seedId);
  if (!seed) return reply("Invalid seed.");

  // Check if player exist
  const player = await getPlayer(id, reply);
  if (!player) return;

  // Check if the seed is currently in rotation
  if (!isSeedInRotation(seedId)) {
    return reply({
      content: "That seed is not available in the current shop rotation.",
      ephemeral: true,
    });
  }

  // Check if player have enough coins
  const totalCost = seed.seedCost * amount;

  const enoughCoin = checkCoins(player, totalCost);
  if (!enoughCoin)
    return reply({
      content: "You don’t have enough coins to buy that many!",
      ephemeral: true,
    });

  // Inventory: make sure it's a Map or a plain object
  const currentSeeds = player.seeds.get(seedId) || 0;
  player.seeds.set(seedId, currentSeeds + amount);

  await player.save();

  return reply(
    `You bought **${amount}x ${
      seed.seedName
    }** for **$${totalCost}** coins!\nYou now have **${player.seeds.get(
      seedId
    )}x ${seed.seedName}**.`
  );
}
