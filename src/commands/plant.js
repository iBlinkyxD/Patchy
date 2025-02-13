const { SlashCommandBuilder } = require("discord.js");
const { Pool } = require("pg");
const fs = require("fs");

// Read crops data from the JSON file
const crops = JSON.parse(fs.readFileSync("./src/data/crops.json", "utf-8"));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

module.exports = {
  data: new SlashCommandBuilder()
    .setName("plant")
    .setDescription("Plant a crop")
    .addStringOption((option) =>
      option
        .setName("crop")
        .setDescription("The type of crop you want to plant")
        .setRequired(true)
        .addChoices(
          crops.map((crop) => ({
            name: crop.name,
            value: crop.name,
          }))
        )
    ),
  async execute(interaction) {
    const userId = interaction.author.id;
    const cropName = interaction.options.getString("crop");

    // Find the selected crop from the JSON data
    const selectedCrop = crops.find((crop) => crop.name === cropName);
    if (!selectedCrop) {
      await interaction.reply("That crop doesn't exist!");
      return;
    }

    // Check if the player has enough coins and meets level requirements
    const playerData = await pool.query("SELECT * FROM players WHERE player_id = $1", [userId]);
    if (playerData.rows.length === 0) {
      await interaction.reply(
        "You don't have an account yet! Use `/balance` first."
      );
      return;
    }

    const player = playerData.rows[0];
    if (player.coins < selectedCrop.price) {
      await interaction.reply(
        `❌ You don't have enough coins to plant **${cropName}**. You need **${selectedCrop.price}** coins.`
      );
      return;
    }

    if (player.level < selectedCrop.levelRequired) {
      await interaction.reply(
        `❌ You need to be at least level **${selectedCrop.levelRequired}** to plant **${cropName}**.`
      );
      return;
    }

    // Deduct cost and plant the crop
    await pool.query(
      "UPDATE players SET coins = coins - $1 WHERE player_id = $2",
      [selectedCrop.price, userId]
    );
    await interaction.reply(
      `You planted **${cropName}**! It will grow in **2 hours**.`
    );
  },
  async executePrefix(message) {
    const userId = message.author.id;
    
    // Extract the crop name from the message (assuming the format is "!plant <crop>")
    const args = message.content.split(" ");
    const cropName = args[1]; // Assuming the crop name is the second argument
  
    if (!cropName) {
      await message.reply("Please provide a crop name to plant.");
      return;
    }
  
    // Find the selected crop from the JSON data
    const selectedCrop = crops.find((crop) => crop.name.toLowerCase() === cropName.toLowerCase());
    if (!selectedCrop) {
      await message.reply("That crop doesn't exist!");
      return;
    }
  
    // Check if the player has enough coins and meets level requirements
    const playerData = await pool.query("SELECT * FROM players WHERE player_id = $1", [userId]);
    if (playerData.rows.length === 0) {
      await message.reply("You don't have an account yet! Use `/balance` first.");
      return;
    }
  
    const player = playerData.rows[0];
    if (player.coins < selectedCrop.price) {
      await message.reply(`❌ You don't have enough coins to plant **${cropName}**. You need **${selectedCrop.price}** coins.`);
      return;
    }
  
    if (player.level < selectedCrop.levelRequired) {
      await message.reply(`❌ You need to be at least level **${selectedCrop.levelRequired}** to plant **${cropName}**.`);
      return;
    }
  
    // Deduct cost and plant the crop
    await pool.query("UPDATE players SET coins = coins - $1 WHERE player_id = $2", [selectedCrop.price, userId]);
    await message.reply(`You planted **${cropName}**! It will grow in **2 hours**.`);
  },  
};
