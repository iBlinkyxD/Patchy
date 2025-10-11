const {
  EmbedBuilder,
  StringSelectMenuBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require("discord.js");
const { getPlayer } = require("../utils/playersDb");
const { getInventory } = require("../utils/inventoryDb");
const { getLevelFromXP } = require("../utils/formulas");
const fs = require("fs");
const { getUpgrades } = require("../utils/upgradesDb");
const { upgradeCost } = require("../utils/formulas");

// Read seeds data from the JSON file
const seeds = JSON.parse(fs.readFileSync("./src/data/seeds.json", "utf-8"));

// Read upgrade data from the JSON file
const upgrades = JSON.parse(
  fs.readFileSync("./src/data/upgrades.json", "utf-8")
);

// Show Show Menu
async function showShop(interaction) {
  try {
    const playerId = interaction.user.id;
    const username = interaction.user.displayName;
    const player = await getPlayer(playerId);

    if (!player) {
      return interaction.reply({
        content: "You don't have a farm yet. Use `/startfarm` to create one!",
        flags: MessageFlags.Ephemeral,
      });
    }

    // Create buttons for Seed Shop and Upgrade Shop
    const buttonRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("seed_shop")
        .setLabel("🌱")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("upgrade_shop")
        .setLabel("🏡")
        .setStyle(ButtonStyle.Primary)
    );

    // Send the initial embed with buttons to choose a shop
    const embed = new EmbedBuilder()
      .setAuthor({ name: `${username}` })
      .setTitle("Please select a category.")
      .setDescription(
        "🌱 **Seed Shop** - Shop for seeds. \n 🏡 **Farm Upgrade** - Shop for farm upgrades."
      )
      .setColor("#FFA500");

    await interaction.update({
      embeds: [embed],
      components: [buttonRow],
    });
  } catch (error) {
    console.error("Error during shop handling:", error);
    return interaction.reply({
      content: "There was an error while loading the shop.",
      flags: MessageFlags.Ephemeral,
    });
  }
}

// Show Seed Shop
async function showSeedShop(interaction) {
  try {
    const playerId = interaction.user.id;
    const username = interaction.user.displayName;
    const player = await getPlayer(playerId);

    if (!player) {
      return interaction.reply({
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
    const inventory = await getInventory(playerId, "seed");
    const inventoryMap = new Map(
      inventory.map((item) => [item.item_name.toLowerCase(), item.quantity])
    );

    const seedList =
      availableSeeds
        .map((seed) => {
          const ownedAmount = inventoryMap.get(seed.name.toLowerCase()) || 0;
          return `${seed.emoji} **${seed.name}** ($${seed.price}) — Owned: **${ownedAmount}**`;
        })
        .join("\n") || "Try planting wheat seeds—they're FREE!";

    // Create an embed to display the available seeds
    const embed = new EmbedBuilder()
      .setAuthor({ name: `${username}` })
      .setTitle(
        "The higher your farming level, the better seeds you can plant!"
      )
      .setColor("#FFA500")
      .setDescription(`💰 Balance: **$${Math.round(player.coins)}**`)
      .addFields({ name: "", value: seedList })
      .setFooter({
        text: nextUnlock
          ? `🔒 Next Unlock: ${nextUnlock.name} (Level ${nextUnlock.levelRequired})`
          : "🎉 You've unlocked all seeds!",
      });

    // Buttons for returning to the previous shop
    const returnButton = new ButtonBuilder()
      .setCustomId("return_shop")
      .setLabel("Return")
      .setStyle(ButtonStyle.Secondary);
    if (availableSeeds.length === 0) {
      // Send the embed with the dropdown menu
      await interaction.update({
        embeds: [embed],
        components: [new ActionRowBuilder().addComponents(returnButton)],
      });
    } else {
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
      await interaction.update({
        embeds: [embed],
        components: [
          new ActionRowBuilder().addComponents(seedMenu),
          new ActionRowBuilder().addComponents(returnButton),
        ],
      });
    }
  } catch (error) {
    console.error("Error during buy process:", error);
    return interaction.reply({
      content: "There was an error during the process.",
      flags: MessageFlags.Ephemeral,
    });
  }
}

// Show Upgrade Shop (you will define upgrades)
async function showUpgradeShop(interaction, message) {
  try {
    const playerId = interaction.user.id;
    const username = interaction.user.displayName;
    const player = await getPlayer(playerId);

    if (!player) {
      return interaction.reply({
        content:
          "You don't have a farm yet. Use `/startfarm` OR `!startfarm` to create one!",
        flags: MessageFlags.Ephemeral,
      });
    }

    const playerUpgrades = await getUpgrades(playerId);

    // Create a map of upgrades owned by the player
    const upgradeLevels = new Map(
      playerUpgrades.map((u) => [u.upgrade_name.toLowerCase(), u.upgrade_level])
    );

    // Create buttons dynamically with calculated price
    const buttonRow = new ActionRowBuilder().addComponents(
      ...upgrades.map((upgrade) => {
        const upgradeNameKey = upgrade.name.toLowerCase();
        const level = upgradeLevels.get(upgradeNameKey) || 1; // Default to level 0 if not owned
        let multiplier = 1.5;

        if (upgrade.name === "Farm Expansion" && level >= 10) {
          plotIncrease = 5;
          multiplier = 2;
        }

        const newPrice = upgradeCost(upgrade.price, multiplier, level);

        return new ButtonBuilder()
          .setCustomId(`upgrade_${upgrade.name.replace(/\s+/g, "_")}`)
          .setLabel(`${upgrade.name} - $${newPrice}`)
          .setStyle(ButtonStyle.Primary);
      })
    );

    // Buttons for returning to the previous shop
    const returnButton = new ButtonBuilder()
      .setCustomId("return_shop")
      .setLabel("Return")
      .setStyle(ButtonStyle.Secondary);

    const embed = new EmbedBuilder()
      .setAuthor({ name: `${username}` })
      .setTitle("Upgrades are permanent and can be leveled up multiple times.")
      .setDescription(
        `Balance: **$${Math.round(player.coins)}**\n
        ${upgrades
          .map((upgrade) => {
            // Only increase farming plots if it's "Farm Expansion" and level >= 10
            let plotIncrease = upgrade.increase;
            const upgradeNameKey = upgrade.name.toLowerCase();
            let level = upgradeLevels.get(upgradeNameKey) || 1;
            let multiplier = 1.5;

            if (upgrade.name === "Farm Expansion" && level >= 10) {
              plotIncrease = 5;
              multiplier = 2;
            }

            const newPrice = upgradeCost(upgrade.price, multiplier, level);
            return `(Level ${level}/${upgrade.maxLevel}) **${upgrade.name}** - Farming Plot +${plotIncrease} - $${newPrice}`;
          })
          .join("\n")}`
      )
      .setColor("#FF6347");
    return interaction.update({
      content: `${message}`,
      embeds: [embed],
      components: [
        buttonRow,
        new ActionRowBuilder().addComponents(returnButton),
      ],
    });
  } catch (error) {
    console.error("Error during buy process:", error);
    return interaction.reply({
      content: "There was an error during the process.",
      flags: MessageFlags.Ephemeral,
    });
  }
}

module.exports = { showShop, showSeedShop, showUpgradeShop }; // Export the function
