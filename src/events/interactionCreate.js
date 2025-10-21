module.exports = async (client, interaction) => {
  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error("Error during command execution:", error);
    await interaction.reply({
      content: "There was an error executing this command.",
      flags: true,
    });
  }
};
