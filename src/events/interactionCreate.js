module.exports = async (client, interaction) => {
  try {
    // Autocomplete interaction
    if (interaction.isAutocomplete()) {
      const command = client.commands.get(interaction.commandName);
      if (!command || !command.autocomplete) return;
      return command.autocomplete(interaction);
    }

    // Regular slash command
    if (!interaction.isCommand()) return;
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    await command.execute(interaction);
  } catch (error) {
    console.error("Error during command execution:", error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "There was an error executing this command.",
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: "There was an error executing this command.",
        ephemeral: true,
      });
    }
  }
};
