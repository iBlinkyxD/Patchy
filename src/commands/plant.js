const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const {
  getAvailablePlots,
  plantCrop
} = require("../utils/plotsDb");
const { getPlayer } = require("../utils/playersDb");
const { getInventory, updateInventory} = require("../utils/inventoryDb");
const fs = require("fs");

// Read seeds data from the JSON file
const seeds = JSON.parse(fs.readFileSync("./src/data/seeds.json", "utf-8"));

// Read crop data from the JSON file
const crops = JSON.parse(fs.readFileSync("./src/data/crops.json", "utf-8"));

module.exports = {
  data: new SlashCommandBuilder()
    .setName("plant")
    .setDescription("View your farming profile.")
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
    )
    .addIntegerOption((option) =>
      option
        .setName("quantity")
        .setDescription("The number of seeds to plant (default: 1)")
        .setMinValue(1)
        .setRequired(false)
    ),

  async execute(interaction) {
    const seedName = interaction.options.getString("seed");
    const quantity = interaction.options.getInteger("quantity") || 1;
    await handlePlanting({
      id: interaction.user.id,
      reply: (response) => interaction.reply(response),
      ephemeralFlag: MessageFlags.Ephemeral,
      seedName,
      quantity,
    });
  },

  async executePrefix(message) {
    const args = message.content.split(" ").slice(1);
    if (args.length === 0) return message.reply("Please provide a seed to plant.");
  
    const { seedName, quantity } = parseArguments(args);

    await handlePlanting({
      id: message.author.id,
      reply: (response) => message.reply(response),
      ephemeralFlag: true,
      seedName,
      quantity,
    });
  },
};

function parseArguments(args) {
  let quantity = parseInt(args[args.length - 1]);
  let seedName = isNaN(quantity) ? args.join(" ") : args.slice(0, -1).join(" ");

  return {
    seedName,
    quantity: isNaN(quantity) ? 1 : Math.max(quantity, 1), // Default to 1 if NaN
  };
}

async function handlePlanting({ id, reply, ephemeralFlag, seedName, quantity }) {
  try {
    const player = await getPlayer(id);
    if (!player) {
      return reply({
        content: "You don't have a farm yet. Use `/startfarm` OR `!startfarm` to create one!",
        flags: ephemeralFlag,
      });
    }

    const seedLower = seedName.toLowerCase();
    const selectedSeed = seeds.find((seed) => seed.name.toLowerCase() === seedLower);
    if (!selectedSeed) return reply("That seed doesn't exist!");

    const crop = crops.find((crop) => crop.id === selectedSeed.cropId);
    if (!crop) return reply("Error: Associated crop not found!");

    // Check seed inventory (except for Wheat Seeds)
    if (seedLower !== "wheat seeds") {
      const inventory = await getInventory(id, "seed");
      const seedInInventory = inventory.find((item) => item.item_name.toLowerCase() === seedLower);

      if (!seedInInventory || seedInInventory.quantity < quantity) {
        return reply(`You don't have enough **${seedName}** seeds! You only have **${seedInInventory ? seedInInventory.quantity : 0}**.`);
      }
    }

    // Get available plots
    const availablePlots = await getAvailablePlots(id, quantity);
    if (!availablePlots) return reply("You have no available plots! Harvest a crop or expand your farm.");

    await updateInventory(id, quantity, selectedSeed.name);

    // Plant crops in parallel
    await Promise.all(
      availablePlots.slice(0, quantity).map((plot) =>
        plantCrop(
          id,
          plot.plot_id,
          crop.name,
          Date.now(),
          selectedSeed.growthTime,
          selectedSeed.yield,
          selectedSeed.id
        )
      )
    );

    return reply(`You planted **${quantity} ${seedName}**! They will grow in **${selectedSeed.growthTime} seconds**.`);
  } catch (error) {
    console.error("Database error: ", error);
    return reply({
      content: "There was an error during the process.",
      flags: ephemeralFlag,
    });
  }
}

