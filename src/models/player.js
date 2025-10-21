const mongoose = require("mongoose");

const plotSchema = new mongoose.Schema({
  crop: { type: String },
  plantedAt: { type: Date },
  readyAt: { type: Date },
});

const playerSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  username: { type: String },
  level: { type: Number, default: 1 },
  xp: { type: Number, default: 0 },
  coins: { type: Number, default: 100 },
  stamina: { type: Number, default: 100 },
  maxStamina: { type: Number, default: 100 },
  lastStaminaUpdate: { type: Date, default: Date.now },
  plotsUnlocked: { type: Number, default: 3 },
  plots: { type: [plotSchema], default: [] },
  seeds: { type: Map, of: Number, default: {} },
  crops: { type: Map, of: Number, default: {} }, 
  animals: { type: Map, of: Number, default: {} },
  upgrades: { type: [String], default: [] },
  coopId: { type: String, default: null },
});

module.exports = mongoose.model("Player", playerSchema);
