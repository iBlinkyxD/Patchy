const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const {
  getPlayer,
  getAvailablePlots,
  plantCrop,
  getInventory,
  getSeedInventory,
  updateSeedInventory,
} = require("../utils/db");
const fs = require("fs");

// Read seeds data from the JSON file
const seeds = JSON.parse(fs.readFileSync("./src/data/seeds.json", "utf-8"));

module.exports = {
  data: new SlashCommandBuilder()
    .setName("plant")
    .setDescription("Plant a seed")
    .addStringOption((option) =>
      option
        .setName("seed")
        .setDescription("The type of seed you want to plant")
        .setRequired(true)
        .addChoices(
          seeds.map((seed) => ({
            name: seed.name,
            value: seed.name,
          }))
        )
    ),
  async execute(interaction) {
    const playerId = interaction.user.id;
    const player = await getPlayer(playerId);

    if (!player) {
      return interaction.reply({
        content:
          "You don't have a farm yet. Use `/startfarm` OR `!startfarm` to create one!",
        flags: MessageFlags.Ephemeral,
      });
    }

    // Extract arguments
    const args = interaction.content.split(" ").slice(1); // Remove command prefix
    if (args.length === 0) {
      return interaction.reply("Please provide a seed to plant.");
    }

    // Determine if the last argument is a number (quantity)
    let seedName = args.slice(0, -1).join(" ");
    let quantity = parseInt(args[args.length - 1]);

    if (isNaN(quantity)) {
      seedName = args.join(" ");
      quantity = 1; // Default to 1 if no quantity is specified
    }

    if (!seedName || quantity <= 0) {
      return interaction.reply(
        "Please provide a valid seed and quantity to plant."
      );
    }

    // Find the selected seed from the JSON data
    const selectedSeed = seeds.find(
      (seed) => seed.name.toLowerCase() === seedName.toLowerCase()
    );
    if (!selectedSeed) {
      return await interaction.reply("That seed doesn't exist!");
    }

    // Skip inventory check for Wheat Seeds
    if (seedName.toLowerCase() !== "wheat seeds") {
      const inventory = await getInventory(playerId);
      const seedInInventory = inventory.find(
        (item) => item.item_name.toLowerCase() === seedName.toLowerCase()
      );

      if (!seedInInventory || seedInInventory.quantity < quantity) {
        return interaction.reply(
          `❌ You don't have enough **${seedName}** seeds! You only have **${
            seedInInventory ? seedInInventory.quantity : 0
          }**.`
        );
      }
    }

    const availablePlot = await getAvailablePlots(playerId, quantity);
    if (!availablePlot) {
      return interaction.reply(
        "You have no available plots! Harvest a crop or expand your farm."
      );
    }

    const currentTime = Date.now();

    // Check if the player is planting wheat
    for (let i = 0; i < quantity; i++) {
      const plot = availablePlot[i];
      await plantCrop(
        playerId,
        plot.plot_id,
        seedName.toLowerCase(),
        currentTime,
        selectedSeed.growthTime,
        selectedSeed.yield
      );
    }

    return interaction.reply(
      `You planted **${quantity} ${seedName}**! It will grow in **${selectedSeed.growthTime} seconds**.`
    );
  },
  async executePrefix(message) {
    const playerId = message.author.id;
    const player = await getPlayer(playerId);

    if (!player) {
      return message.reply({
        content:
          "You don't have a farm yet. Use `/startfarm` OR `!startfarm` to create one!",
        ephemeral: true,
      });
    }

    // Extract arguments
    const args = message.content.split(" ").slice(1); // Remove command prefix
    if (args.length === 0) {
      return message.reply("Please provide a seed to plant.");
    }

    // Determine if the last argument is a number (quantity)
    let seedName = args.slice(0, -1).join(" ");
    let quantity = parseInt(args[args.length - 1]);

    if (isNaN(quantity)) {
      seedName = args.join(" ");
      quantity = 1; // Default to 1 if no quantity is specified
    }

    if (!seedName || quantity <= 0) {
      return message.reply(
        "Please provide a valid seed and quantity to plant."
      );
    }

    // Find the selected seed from the JSON data
    const selectedSeed = seeds.find(
      (seed) => seed.name.toLowerCase() === seedName.toLowerCase()
    );
    if (!selectedSeed) {
      return await message.reply("That seed doesn't exist!");
    }

    // Skip inventory check for Wheat Seeds
    if (seedName.toLowerCase() !== "wheat seeds") {
      const inventory = await getSeedInventory(playerId, "seed");
      const seedInInventory = inventory.find(
        (item) => item.item_name.toLowerCase() === seedName.toLowerCase()
      );

      if (!seedInInventory || seedInInventory.quantity < quantity) {
        return message.reply(
          `❌ You don't have enough **${seedName}** seeds! You only have **${
            seedInInventory ? seedInInventory.quantity : 0
          }**.`
        );
      }
    }

    const availablePlot = await getAvailablePlots(playerId, quantity);
    if (!availablePlot) {
      return message.reply(
        "You have no available plots! Harvest a crop or expand your farm."
      );
    }

    const currentTime = Date.now();

    // Check if the player is planting wheat
    for (let i = 0; i < quantity; i++) {
      const plot = availablePlot[i];
      await plantCrop(
        playerId,
        plot.plot_id,
        selectedSeed.crop,
        currentTime,
        selectedSeed.growthTime,
        selectedSeed.yield,
        selectedSeed.id
      );
    }

    await updateSeedInventory(playerId, quantity, selectedSeed.name);

    return message.reply(
      `You planted **${quantity} ${seedName}**! It will grow in **${selectedSeed.growthTime} seconds**.`
    );
  },
};
