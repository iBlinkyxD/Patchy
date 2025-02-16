const { MessageFlags } = require("discord.js");
const { handleInteraction } = require("../handlers/interactionHandler");

module.exports = async (client, interaction) => {
  if (interaction.isButton() || interaction.isStringSelectMenu()) {
    await handleInteraction(interaction);
  }
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error("Error during command execution:", error);
    await interaction.reply({
      content: "There was an error executing this command.",
      flags: MessageFlags.Ephemeral,
    });
  }
};
