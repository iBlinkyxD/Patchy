require("dotenv").config();
const { Client, IntentsBitField, Collection, ActivityType } = require("discord.js");
const fs = require("fs");
const path = require("path");

const PREFIX = "!";

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
    IntentsBitField.Flags.GuildPresences,
  ],
});

client.commands = new Collection();

// Load all commands from the 'commands' folder
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  client.commands.set(command.data.name, command);
  // console.log(`Loaded command: ${command.data.name}`);
}

client.on("ready", () => {
  console.log("Patchy is online!");
  client.user.setPresence({
    activities: [{name: "星街すいせい", type: ActivityType.Watching }],
    status: 'dnd',
  });
});

// Handle slash commands
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error("Error during command execution: ", error);
    await interaction.reply({
      content: "There was an error executing this command.",
      ephemeral: true,
    });
  }
});

// Handle Prefix Commands
client.on("messageCreate", async (message) => {
  if(message.author.bot || !message.content.startsWith(PREFIX)) return;
  
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
})

client.login(process.env.BOT_TOKEN);
