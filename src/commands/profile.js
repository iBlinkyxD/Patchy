const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const Player = require("../models/player");
const { execute, executePrefix } = require("./startfarm");

function regenerateStamina(player) {
  const now = Date.now();
  const elapsed = now - player.lastStaminaUpdate;
  const regenRate = 2 * 60 * 1000; // 1 every 2 mins.
  const recovered = Math.floor(elapsed / regenRate);

  if (recovered > 0) {
    player.stamina = Math.min(player.maxStamina, player.stamina + recovered);
    player.lastStaminaUpdate = now;
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("profile")
    .setDescription("Check your farm profile."),

  async execute(interaction) {
    await handleProfile({
      id: interaction.user.id,
      username: interaction.username,
      avatar: interaction.user.displayAvatarURL(),
      reply: (response) => interaction.reply(response),
    });
  },

  async executePrefix(message) {
    await handleProfile({
      id: message.author.id,
      username: message.author.displayName,
      avatar: message.author.displayAvatarURL(),
      reply: (response) => message.reply(response),
    });
  },
};

async function handleProfile({ id, username, avatar, reply }) {
  let player = await Player.findOne({ userId: id });

  if (!player) {
    player = new Player({
      userId: id,
      username: username,
    });
    await player.save();
    await reply(`🌾 A new farm has been created for you, ${username}!`);
  }

  regenerateStamina(player);
  await player.save();

  const embed = new EmbedBuilder()
    .setColor("#2ECC71")
    .setTitle(`${username}'s Farming Profile`)
    .setThumbnail(avatar)
    .addFields(
      { name: "", value: `🌟 **Level ${player.level}**`, inline: true },
      { name: "", value: `📈 **XP:** ${player.xp}`, inline: true },
      { name: "", value: `⚡ **Stamina:** ${player.stamina}/${player.maxStamina}`, inline: false },
      {
        name: "",
        value: `💰 Balance: **$${player.coins}**`,
        inline: false,
      },
    )
    .setTimestamp();

  return reply({ embeds: [embed] });
}
