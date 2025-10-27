const { REST, Routes } = require("discord.js");
const fse = require("fs-extra");
require("dotenv").config();

const commands = [];
const commandFiles = fse
  .readdirSync("./src/commands")
  .filter((file) => file.endsWith(".js"));

// Load command data
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  commands.push(command.data.toJSON());
}

const rest = new REST({ version: "10" }).setToken(process.env.BOT_TOKEN_DEV);

// Replace with your guild ID
const GUILD_ID = process.env.GUILD_ID;
const CLIENT_ID = process.env.CLIENT_ID_DEV;

(async () => {
  try {
    console.log("Started refreshing guild commands.");

    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
      body: commands,
    });

    console.log("Successfully reloaded guild commands.");
  } catch (error) {
    console.error(error);
  }
})();
