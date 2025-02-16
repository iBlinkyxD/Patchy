const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  MessageFlags,
} = require("discord.js");
const { getPlayer } = require("../utils/playersDb");
const { getInventory } = require("../utils/inventoryDb");
const { getLevelFromXP } = require("../utils/formulas");
const fs = require("fs");

// Read seeds data from the JSON file
const seeds = JSON.parse(fs.readFileSync("./src/data/seeds.json", "utf-8"));

module.exports = {
  data: new SlashCommandBuilder()
    .setName("shop")
    .setDescription("View available seeds and upgrade for purchase."),

  async execute(interaction) {
    await handleShop({
      id: interaction.user.id,
      name: interaction.user.displayName,
      reply: (response) => interaction.reply(response),
      ephemeralFlag: MessageFlags.Ephemeral,
    });
  },

  async executePrefix(message) {
    await handleShop({
      id: message.author.id,
      name: message.author.displayName,
      reply: (response) => message.reply(response),
      ephemeralFlag: true,
    });
  },
};

async function handleShop({ id, name, reply, ephemeralFlag }) {
  try {
    const player = await getPlayer(id);

    if (!player) {
      return reply({
        content:
          "You don't have a farm yet. Use `/startfarm` OR `!startfarm` to create one!",
        flags: ephemeralFlag,
      });
    }

    const { level } = getLevelFromXP(player.xp);

    // Precompute available seeds and next unlock
    const availableSeeds = [];
    let nextUnlock = null;

    for (const seed of seeds) {
      if (level >= seed.levelRequired && seed.price > 0) {
        availableSeeds.push(seed);
      } else if (!nextUnlock && seed.levelRequired > level) {
        nextUnlock = seed;
      }
    }

    // Retrieve the player's current seed inventory
    const inventory = await getInventory(id, "seed");
    const inventoryMap = new Map(inventory.map(item => [item.item_name.toLowerCase(), item.quantity]));

    const seedList = availableSeeds.map((seed) => {
      const ownedAmount = inventoryMap.get(seed.name.toLowerCase()) || 0;
      return `**${seed.name}** ($${seed.price}) — Owned: **${ownedAmount}**`;
    }).join("\n") || "Try planting wheat seeds—they're FREE!";

    // Create an embed to display the available seeds
    const embed = new EmbedBuilder()
      .setAuthor({ name: `${name}` })
      .setTitle("The higher your farming level, the better seeds you can plant!")
      .setColor("#FFA500")
      .setDescription(`Balance: **$${Math.round(player.coins)}**`)
      .addFields({ name: "", value: seedList })
      .setFooter({
        text: nextUnlock
          ? `🔒 Next Unlock: ${nextUnlock.name} (Level ${nextUnlock.levelRequired})`
          : "🎉 You've unlocked all seeds!",
      });

    // Dropdown menu for seed selection
    const seedMenu = new StringSelectMenuBuilder()
      .setCustomId("select_seed")
      .setPlaceholder("Choose a seed to buy.")
      .addOptions(
        availableSeeds.map((seed) => ({
          label: seed.name,
          description: `$${seed.price} per seed`,
          value: seed.name,
        }))
      );

    // Send the embed with the dropdown menu
    await reply({
      embeds: [embed],
      components: [new ActionRowBuilder().addComponents(seedMenu)],
    });
  } catch (error) {
    console.error("Error during buy process:", error);
    return reply({
      content: "There was an error during the process.",
      flags: ephemeralFlag,
    });
  }
}
