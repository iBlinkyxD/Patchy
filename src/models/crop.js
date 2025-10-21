const mongoose = require("mongoose");

const cropSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  growTime: { type: Number, required: true }, // in minutes
  xp: { type: Number, required: true },
  basePrice: { type: Number, required: true },
  unlockLevel: { type: Number, default: 1 },
  season: { type: String, default: "all" },
});

module.exports = mongoose.model("Crop", cropSchema);
