const {
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  StringSelectMenuBuilder,
} = require("discord.js");
const { getPlayer, updateCoins, updatePlot } = require("../utils/playersDb");
const { getInventory, addToInventory } = require("../utils/inventoryDb");
const fs = require("fs");
const { getLevelFromXP, upgradeCost } = require("../utils/formulas");
const {
  showSeedShop,
  showUpgradeShop,
  showShop,
} = require("../utils/shopEmbeds");
const { getUpgrades, updateUpgrade } = require("../utils/upgradesDb");

const seeds = JSON.parse(fs.readFileSync("./src/data/seeds.json", "utf-8"));
const selectedSeeds = new Map(); // Store selected seeds in memory
const quantities = [1, 10, 100, 1000];

// Read upgrade data from the JSON file
const upgrades = JSON.parse(
  fs.readFileSync("./src/data/upgrades.json", "utf-8")
);

// Helper function to create the seed embed
const createSeedEmbed = (
  bal,
  availableSeeds,
  inventory,
  username,
  nextUnlock,
  selectedSeedName
) => {
  // Get the owned amount of the selected seed
  const ownedAmount = selectedSeedName
    ? inventory.get(selectedSeedName.toLowerCase()) || 0
    : null;

  const seedList =
    availableSeeds
      .map((seed) => {
        const owned = inventory.get(seed.name.toLowerCase()) || 0;
        return `${seed.emoji} **${seed.name}** ($${seed.price}) — Owned: **${owned}**`;
      })
      .join("\n") || "Try planting wheat seeds—they're FREE!";
  // Construct the description dynamically
  let description = `💰 Balance: **$${Math.round(bal)}**`;
  if (ownedAmount !== null) {
    description += `\nOwned **(${selectedSeedName}): ${ownedAmount}**`;
  }

  return new EmbedBuilder()
    .setAuthor({ name: `${username}` })
    .setTitle("The higher your farming level, the better seeds you can plant!")
    .setColor("#FFA500")
    .setDescription(description)
    .addFields({ name: "", value: seedList })
    .setFooter({
      text: nextUnlock
        ? `🔒 Next Unlock: ${nextUnlock.name} (Level ${nextUnlock.levelRequired})`
        : "🎉 You've unlocked all seeds!",
    });
};

module.exports.handleInteraction = async (interaction) => {
  const playerId = interaction.user.id;
  const player = await getPlayer(playerId);
  const { level } = getLevelFromXP(player.xp);
  const username = interaction.user.displayName;
  const inventory = new Map(); // Use a Map for fast lookup
  const dbInventory = await getInventory(playerId, "seed");

  dbInventory.forEach((item) =>
    inventory.set(item.item_name.toLowerCase(), item.quantity)
  );

  const availableSeeds = seeds.filter(
    (seed) => level >= seed.levelRequired && seed.price > 0
  );
  const nextUnlock = seeds.find((seed) => seed.levelRequired > level);

  if (
    interaction.isStringSelectMenu() &&
    interaction.customId === "select_seed"
  ) {
    const selectedSeedName = interaction.values[0];
    const selectedSeed = seeds.find((seed) => seed.name === selectedSeedName);

    // Check if player meets the level requirement
    if (!selectedSeed || level < selectedSeed.levelRequired) {
      return interaction.reply({
        content: `🚫 You do not meet the level requirement for **${selectedSeedName}**. Required Level: **${selectedSeed.levelRequired}**, Your Level: **${level}**.`,
        ephemeral: true, // Only visible to the user
      });
    }

    selectedSeeds.set(playerId, selectedSeedName);

    //Create an embed to display the available seeds
    const embed = createSeedEmbed(
      player.coins,
      availableSeeds,
      inventory,
      username,
      nextUnlock,
      selectedSeedName
    );

    return interaction.update({
      content: "",
      components: [
        new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId("select_seed")
            .setPlaceholder("Choose a seed to buy.")
            .addOptions([
              ...availableSeeds.map((seed) => ({
                label: seed.name,
                description: `$${seed.price} per seed`,
                value: seed.name,
                default: selectedSeedName === seed.name,
              })),
            ])
        ),
        new ActionRowBuilder().addComponents(
          quantities.map((q) => {
            const selectedSeed = seeds.find(
              (seed) => seed.name === selectedSeedName
            );
            const totalCost = selectedSeed.price * q;
            return new ButtonBuilder()
              .setCustomId(`buy_${q}`)
              .setLabel(`Buy x${q} ($${totalCost})`)
              .setStyle(ButtonStyle.Primary)
              .setDisabled(player.coins < totalCost);
          })
        ),
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("return_shop")
            .setLabel("Return")
            .setStyle(ButtonStyle.Secondary)
        ),
      ],
      embeds: [embed],
    });
  }

  if (interaction.isButton()) {
    const { customId } = interaction;

    if (customId === "return_shop") {
      return await showShop(interaction);
    }

    if (customId === "seed_shop") {
      return await showSeedShop(interaction);
    }

    if (customId === "upgrade_shop") {
      return await showUpgradeShop(interaction, "Welcome to the Upgrade Shop!");
    }

    const validBuyCommands = ["buy_1", "buy_10", "buy_100", "buy_1000"];

    if (validBuyCommands.includes(interaction.customId)) {
      const quantity = parseInt(interaction.customId.replace("buy_", ""), 10);
      const selectedSeedName = selectedSeeds.get(playerId);

      if (!selectedSeedName) {
        return interaction.reply({
          content: "",
          flags: MessageFlags.Ephemeral,
        });
      }

      const selectedSeed = seeds.find((seed) => seed.name === selectedSeedName);
      const totalCost = selectedSeed.price * quantity;

      if (player.coins < totalCost) {
        return interaction.reply({
          content: "Not enough coins!",
          flags: MessageFlags.Ephemeral,
        });
      }

      // Update player's coins and inventory
      await updateCoins(playerId, player.coins - totalCost);
      await addToInventory(
        playerId,
        selectedSeed.name,
        quantity,
        selectedSeed.id,
        "seed"
      );

      const dbInventory = await getInventory(playerId, "seed");

      dbInventory.forEach((item) =>
        inventory.set(item.item_name.toLowerCase(), item.quantity)
      );

      const availableSeeds = seeds.filter(
        (seed) => level >= seed.levelRequired && seed.price > 0
      );
      const nextUnlock = seeds.find((seed) => seed.levelRequired > level);

      let bal = player.coins - totalCost;

      //Create an embed to display the available seeds
      const embed = createSeedEmbed(
        bal,
        availableSeeds,
        inventory,
        username,
        nextUnlock,
        selectedSeedName
      );

      return interaction.update({
        content: `✅ You bought **${quantity}x ${selectedSeed.name}** for **$${totalCost}**!`,
        embeds: [embed],
      });
    }

    const validUpgradeCommands = ["upgrade_Farm_Expansion"];
    if (validUpgradeCommands.includes(interaction.customId)) {
      const upgradeName = customId
        .replace("upgrade_", "")
        .replace(/_/g, " ")
        .toLowerCase();
      const upgrade = upgrades.find(
        (u) => u.name.toLowerCase() === upgradeName
      );

      if (!upgrade) {
        return interaction.reply({
          content: "Invalid upgrade!",
          flags: MessageFlags.Ephemeral,
        });
      }

      const playerUpgrades = await getUpgrades(playerId);

      const currentUpgrade = playerUpgrades.find(
        (u) => u.upgrade_name.toLowerCase() === upgradeName
      );

      const currentLevel = currentUpgrade ? currentUpgrade.upgrade_level : 0;

      // Determine multiplier and plotIncrease
      const isFarmExpansion = upgradeName === "farm expansion";
      const multiplier = isFarmExpansion && currentLevel >= 10 ? 2 : 1.5;
      const plotIncrease =
        isFarmExpansion && currentLevel >= 10 ? 5 : upgrade.increase;

      const upgradePrice = upgradeCost(upgrade.price, multiplier, currentLevel);

      if (player.coins < upgradePrice) {
        return interaction.reply({
          content: "Not enough coins to buy this upgrade!",
          flags: MessageFlags.Ephemeral,
        });
      }
      // Deduct coins and apply upgrade
      await Promise.all([
        updateCoins(playerId, player.coins - upgradePrice),
        updateUpgrade(playerId, upgrade.name, currentLevel + 1),
        updatePlot(playerId, plotIncrease),
      ]);

      return await showUpgradeShop(
        interaction,
        `✅ You upgraded **${upgrade.name}** to Level ${
          currentLevel + 1
        } for **$${upgradePrice}**!`
      );
    }
  }
};
