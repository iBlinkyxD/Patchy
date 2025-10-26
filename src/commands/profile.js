const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { createPlayer, regenerateStamina } = require("../utils/playerUtils");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("profile")
    .setDescription("Check your farm profile."),

  async execute(interaction) {
    await handleProfile({
      id: interaction.user.id,
      username: interaction.user.displayName,
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

  // Check if player exist if not then create one
  const player = await createPlayer(id, username, reply);
  
  // Update Stamina
  regenerateStamina(player);
  await player.save();

  // Calculate XP needed for next level
  const xpNeeded = player.level * 100;

  // Calculate available vs unlocked plots
  const totalPlots = player.plotsUnlocked;
  const usedPlots = player.plots.length;
  const availablePlots = Math.max(0, totalPlots - usedPlots);

  const embed = new EmbedBuilder()
    .setColor("#2ECC71")
    .setTitle(`${username}'s Farming Profile`)
    .setThumbnail(avatar)
    .addFields(
      { name: "", value: `🌟 **Level ${player.level}**`, inline: true },
      { name: "", value: `📈 **XP:** ${player.xp}/${xpNeeded}`, inline: true },
      { name: "", value: "", inline: true },
      {
        name: "",
        value: `⚡ **Stamina:** ${player.stamina}/${player.maxStamina}`,
        inline: true,
      },
      {
        name: "",
        value: `🏡 **Available Plots: **${availablePlots}/${player.plotsUnlocked}`,
        inline: true,
      },
      {
        name: "",
        value: `💰 **Balance:** $${player.coins}`,
        inline: false,
      }
    )
    .setTimestamp();

  return reply({ embeds: [embed] });
}
