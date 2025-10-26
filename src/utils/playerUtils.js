const Player = require("../models/player");

async function createPlayer(id, username, reply) {
  let player = await Player.findOne({ userId: id });

  if (!player) {
    player = new Player({
      userId: id,
      username: username,
    });
    await player.save();
    await reply(`🌾 A new farm has been created for you, ${username}!`);
  }

  return player;
}

async function getPlayer(id, reply) {
  const player = await Player.findOne({ userId: id });
  if (!player) {
    await reply({
      content:
        "You don't have a farm yet. Use `/startfarm` OR `!startfarm` to create one!",
      ephemeral: true,
    });
    return null;
  }

  return player;
}

function regenerateStamina(player) {
  const now = Date.now();
  const elapsed = now - player.lastStaminaUpdate;
  const regenRate = 2 * 60 * 1000; // 1 every 2 mins.
  const recovered = Math.floor(elapsed / regenRate);

  if (recovered > 0) {
    player.stamina = Math.min(player.maxStamina, player.stamina + recovered);
    player.lastStaminaUpdate = now;
  }
}

function checkCoins(player, cost){
  if(player.coins < cost) return false;
  player.coins -= cost;
  return true;
}

function checkStamina(player, cost) {
  if (player.stamina < cost) return false;
  player.stamina -= cost;
  return true;
}

module.exports = {
  createPlayer,
  getPlayer,
  regenerateStamina,
  checkCoins,
  checkStamina,
};
