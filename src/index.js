require("dotenv").config();
const {
  Client,
  IntentsBitField,
  Collection,
} = require("discord.js");
const fse = require("fs-extra");
const path = require("path");

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
const commandFiles = fse
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  client.commands.set(command.data.name, command);
  // console.log(`Loaded command: ${command.data.name}`);
}

// Load all event from the 'events' folder
const eventsPath = path.join(__dirname, "events");
const eventFiles = fse.readdirSync(eventsPath).filter((file) => file.endsWith(".js"));

for (const file of eventFiles) {
  const event = require(path.join(eventsPath, file));
  const eventName = file.split(".")[0];

  client.on(eventName, (...args) => event(client, ...args));
}

client.login(process.env.BOT_TOKEN_DEV);