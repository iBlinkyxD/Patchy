const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const crops = require("../data/crops");
const Player = require("../models/player");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("sell")
    .setDescription("Sell harvested crops.")
    .addStringOption((option) =>
      option
        .setName("crop")
        .setDescription("The crop you want to sell (leave empty to sell all).")
        .addChoices(...crops.map((c) => ({ name: c.name, value: c.id })))
    )
    .addIntegerOption((option) =>
      option
        .setName("amount")
        .setDescription("How many of that crop you want to sell.")
        .setRequired(false)
        .setMinValue(1)
    ),

  async execute(interaction) {
    const cropId = interaction.options.getString("crop");
    const amount = interaction.options.getInteger("amount") || 1;

    await handleSell({
      id: interaction.user.id,
      cropId,
      amount,
      reply: (response) => interaction.reply(response),
    });
  },

  async executePrefix(message, args) {
    const cropId = args[0]?.toLowerCase();
    const amount = args[1] ? parseInt(args[1]) : null;

    await handleSell({
      id: message.author.id,
      cropId,
      amount,
      reply: (response) => message.reply(response),
    });
  },
};

async function handleSell({ id, cropId, amount, reply }) {
  const player = await Player.findOne({ userId: id });
  if (!player) {
    return reply({
      content:
        "You don't have a farm yet. Use `/startfarm` OR `!startfarm` to create one!",
      ephemeral: true,
    });
  }
  if (!player.crops || player.crops.size === 0)
    return reply("You don’t have any crops to sell.");

  let totalEarned = 0;
  let soldItems = [];

  // --- SELL ALL ---
  if (!cropId) {
    for (const [id, qty] of player.crops.entries()) {
      const crop = crops.find((c) => c.id === id);
      if (!crop || qty <= 0) continue;

      const coinsEarned = crop.harvestReward * qty;
      totalEarned += coinsEarned;
      soldItems.push(`${crop.name} x${qty} (💰 ${coinsEarned})`);
    }

    if (soldItems.length === 0)
      return reply("You don't have any crops worth selling.");

    player.crops.clear();
  }

  // --- SELL SPECIFIC CROP ---
  else {
    const crop = crops.find((c) => c.id === cropId);
    if (!crop) return reply("That crop doesn't exist.");

    const ownedAmount = player.crops.get(cropId) || 0;
    if (ownedAmount === 0) return reply(`You don't own any **${crop.name}**.`);

    const sellAmount = amount ? Math.min(amount, ownedAmount) : ownedAmount;
    const coinsEarned = crop.harvestReward * sellAmount;

    player.crops.set(cropId, ownedAmount - sellAmount);
    if (player.crops.get(cropId) <= 0) player.crops.delete(cropId);

    totalEarned = coinsEarned;
    soldItems.push(`${crop.name} x${sellAmount} (💰 ${coinsEarned})`);
  }

  //Update player coins
  player.coins += totalEarned;
  await player.save();

  const embed = new EmbedBuilder()
    .setTitle("💰 Crops Sold")
    .setColor("Gold")
    .setDescription(soldItems.join("\n"))
    .addFields(
      {
        name: "Total Coins Earned",
        value: `$${totalEarned}`,
        inline: true,
      },
      { name: "Current Balance", value: `$${player.coins}`, inline: true }
    )
    .setTimestamp();

  return reply({ embeds: [embed] });
}
