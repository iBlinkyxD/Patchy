const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require("discord.js");
const { getPlayer, getSeedInventory, getInventory } = require("../utils/db");
const { getLevelFromXP } = require("../utils/calculation");
const fs = require("fs");

// Read seeds data from the JSON file
const seeds = JSON.parse(fs.readFileSync("./src/data/seeds.json", "utf-8"));

module.exports = {
  data: new SlashCommandBuilder()
    .setName("shop")
    .setDescription("View available seeds and upgrade for purchase."),

  async execute(interaction) {
    const playerId = interaction.user.id;
    const username = interaction.user.displayName;
    const player = await getPlayer(playerId);
    const { level } = getLevelFromXP(player.xp);

    if (!player) {
      return interaction.reply({
        content:
          "You don't have a farm yet. Use `/startfarm` OR `!startfarm` to create one!",
        flags: MessageFlags.Ephemeral,
      });
    }

    const availableSeeds = seeds.filter(
      (seed) => level >= seed.levelRequired && seed.price > 0
    );
    const nextUnlock = seeds.find((seed) => seed.levelRequired > level);

    const seedList =
      availableSeeds
        .map((seed) => `**${seed.name}** — $${seed.price}`)
        .join("\n") || "Try planting wheat seeds—they're FREE!";

    //Create an embed to display the available seeds
    const embed = new EmbedBuilder()
      .setAuthor({ name: `${username}` })
      .setTitle(
        "The higher your farming level, the better seeds you can plant!"
      )
      .setColor("#FFA500")
      .setDescription(`Balance: **$${Math.round(player.coins)}**`)
      .addFields({ name: "", value: seedList })
      .setFooter({
        text: nextUnlock
          ? `🔒 Next Unlock: ${nextUnlock.name} (Level ${nextUnlock.levelRequired})`
          : "🎉 You've unlocked all seeds!",
      });

    await interaction.reply({ embeds: [embed] });
  },

  async executePrefix(message) {
    const playerId = message.author.id;
    const username = message.author.displayName;
    const player = await getPlayer(playerId);
    const { level } = getLevelFromXP(player.xp);

    if (!player) {
      return message.reply({
        content:
          "You don't have a farm yet. Use `/startfarm` OR `!startfarm` to create one!",
        ephemeral: true,
      });
    }

    const availableSeeds = seeds.filter(
      (seed) => level >= seed.levelRequired && seed.price > 0
    );
    const nextUnlock = seeds.find((seed) => seed.levelRequired > level);

  // Retrieve the player's current seed inventory
  const inventory = await getSeedInventory(playerId, "seed");

  const seedList =
    availableSeeds
      .map((seed) => {
        const ownedAmount = inventory.find(
          (item) => item.item_name.toLowerCase() === seed.name.toLowerCase()
        )
          ? inventory.find(
              (item) => item.item_name.toLowerCase() === seed.name.toLowerCase()
            ).quantity
          : 0;

        return `**${seed.name}** ($${seed.price}) — Owned: **${ownedAmount}**`;
      })
      .join("\n") || "Try planting wheat seeds—they're FREE!";

    //Create an embed to display the available seeds
    const embed = new EmbedBuilder()
      .setAuthor({ name: `${username}` })
      .setTitle(
        "The higher your farming level, the better seeds you can plant!"
      )
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

    const buyButtons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("buy_1")
        .setLabel("Buy x1")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("buy_10")
        .setLabel("Buy x10")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("buy_100")
        .setLabel("Buy x25")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("buy_1000")
        .setLabel("Buy x1000")
        .setStyle(ButtonStyle.Primary)
    );
    // Send the embed with dropdown and buttons
    await message.reply({
      embeds: [embed],
      components: [new ActionRowBuilder().addComponents(seedMenu), buyButtons],
    });
  },
};
