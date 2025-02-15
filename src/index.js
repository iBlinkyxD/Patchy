require("dotenv").config();
const {
  Client,
  IntentsBitField,
  Collection,
  ActivityType,
  MessageFlags,
} = require("discord.js");
const fs = require("fs");
const path = require("path");
const { getPlayer, updateCoins, addToInventory } = require("./utils/db");

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

// Read seeds data from the JSON file
const seeds = JSON.parse(fs.readFileSync("./src/data/seeds.json", "utf-8"));
const selectedSeeds = new Map();  // In-memory map to store selected seeds for players

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
    activities: [{ name: "星街すいせい", type: ActivityType.Watching }],
    status: "dnd",
  });
});

// Handle slash commands
client.on("interactionCreate", async (interaction) => {
  if (interaction.isStringSelectMenu()) {
    // Handle the seed selection interaction
    if (interaction.customId === "select_seed") {
      const selectedSeed = interaction.values[0];

      // Store the selected seed in the in-memory Map
      selectedSeeds.set(interaction.user.id, selectedSeed);

      await interaction.reply({
        content: `🌱 You selected **${selectedSeed}**! Now choose how many to buy.`,
        flags: MessageFlags.Ephemeral,
      });
    }
  }

  if (interaction.isButton()) {
    // Handle the buy buttons
    const quantity = parseInt(interaction.customId.replace("buy_", ""), 10);
    const playerId = interaction.user.id;

    // Retrieve the selected seed from the in-memory Map
    const selectedSeed = selectedSeeds.get(playerId);

    if (!selectedSeed) {
      return interaction.reply({
        content: "⚠️ You need to select a seed first!",
        flags: MessageFlags.Ephemeral,
      });
    }

    const seed = seeds.find((seed) => seed.name === selectedSeed);

    if (!seed) {
      return interaction.reply({
        content: "⚠️ Something went wrong. Please try again.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const totalCost = seed.price * quantity;

    // Check if the player has enough money
    const player = await getPlayer(playerId);  // Get player data for coins
    if (player.coins < totalCost) {
      return interaction.reply({
        content: `❌ You don't have enough money! You need **$${totalCost}** but you only have **$${player.coins}**.`,
        flags: MessageFlags.Ephemeral,
      });
    }

    // Deduct money and handle the purchase
    player.coins -= totalCost;
    await updateCoins(playerId, player.coins);

    // Add to player inventory
    await addToInventory(playerId, seed.name, quantity, seed.id, "seed");

    return interaction.reply({
      content: `✅ You bought **${quantity}x ${seed.name}** for **$${totalCost}**!`,
      flags: MessageFlags.Ephemeral,
    });
  }

  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error("Error during command execution: ", error);
    await interaction.reply({
      content: "There was an error executing this command.",
      flags: MessageFlags.Ephemeral,
    });
  }
});

// Handle Prefix Commands
client.on("messageCreate", async (message) => {
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
});

client.login(process.env.BOT_TOKEN);
