const {
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  StringSelectMenuBuilder,
} = require("discord.js");
const { getPlayer, updateCoins } = require("../utils/playersDb");
const { getInventory, addToInventory} = require("../utils/inventoryDb");
const fs = require("fs");
const { getLevelFromXP } = require("../utils/formulas");

const seeds = JSON.parse(fs.readFileSync("./src/data/seeds.json", "utf-8"));
const selectedSeeds = new Map(); // Store selected seeds in memory
const quantities = [1, 10, 100, 1000];

// Helper function to create the seed embed
const createSeedEmbed = (
    player,
    availableSeeds,
    inventory,
    username,
    nextUnlock,
    selectedSeedName
  ) => {
    // Get the owned amount of the selected seed
    const ownedAmount =
      selectedSeedName
        ? inventory.get(selectedSeedName.toLowerCase()) || 0
        : null;
  
    const seedList =
      availableSeeds
        .map((seed) => {
          const owned = inventory.get(seed.name.toLowerCase()) || 0;
          return `**${seed.name}** ($${seed.price}) — Owned: **${owned}**`;
        })
        .join("\n") || "Try planting wheat seeds—they're FREE!";
    // Construct the description dynamically
    let description = `Balance: **$${Math.round(player.coins)}**`;
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

      selectedSeeds.set(playerId, selectedSeedName);


    //Create an embed to display the available seeds
    const embed = createSeedEmbed(
      player,
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
      ],
      embeds: [embed],
    });
  }

  if (interaction.isButton()) {
    const quantity = parseInt(interaction.customId.replace("buy_", ""), 10);
    const selectedSeedName = selectedSeeds.get(playerId);

    if (!selectedSeedName) {
      return interaction.reply({ content: "", flags: MessageFlags.Ephemeral });
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

    //Create an embed to display the available seeds
    const embed = createSeedEmbed(
        player,
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
};
