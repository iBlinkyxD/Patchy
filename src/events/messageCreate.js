const PREFIX = "!";

module.exports = async (client, message) => {
  if (message.author.bot || !message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
  const commandName = args.shift().toLowerCase();

  const command = client.commands.get(commandName);
  if (!command) return;

  try {
    await command.executePrefix(message, args);
  } catch (error) {
    console.error("Error executing prefix command:", error);
    await message.reply("There was an error executing this command.");
  }
};
