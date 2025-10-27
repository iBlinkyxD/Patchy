const crops = require("../data/crops");

const SHOP_ROTATION_INTERVAL = 30 * 60 * 1000; // 30 mins
const SHOP_SEED_COUNT = 12;

let lastShopRotation = 0;
let currentShopSeeds = [];

function getRandomSeeds() {
  const shuffled = [...crops].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, SHOP_SEED_COUNT);
}

function getCurrentShopSeeds() {
  const now = Date.now();
  if (now - lastShopRotation >= SHOP_ROTATION_INTERVAL || currentShopSeeds.length === 0) {
    currentShopSeeds = getRandomSeeds();
    lastShopRotation = now;
  }
  return currentShopSeeds;
}

function isSeedInRotation(seedId) {
  return getCurrentShopSeeds().some((c) => c.id === seedId);
}

function getLastShopRotation() {
  return lastShopRotation;
}

module.exports = {
  getCurrentShopSeeds,
  isSeedInRotation,
  SHOP_ROTATION_INTERVAL,
  getLastShopRotation,
};
