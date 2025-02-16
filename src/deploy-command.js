require("dotenv").config();
const { REST, Routes } = require("discord.js");
const fs = require("fs");

const commands = [];
const commandFiles = fs
  .readdirSync("./src/commands")
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  commands.push(command.data.toJSON());
}

const rest = new REST({ version: "10" }).setToken(process.env.BOT_TOKEN_PROD);

(async () => {
  try {
    console.log("Registering slash commands...");
    response = await rest.put(Routes.applicationCommands(process.env.CLIENT_ID_PROD), {
      body: commands,
    });
    console.log("Slash commands registered!");
  } catch (error) {
    console.error("Error registering slash command: ", error);
  }
})();
