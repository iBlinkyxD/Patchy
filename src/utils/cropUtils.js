const crops = require("../data/crops");

// Match user input to a crop (case-insensitive)

function getCrop(cropId) {
  return (
    crops.find(
      (c) =>
        c.id.toLowerCase() === cropId.toLowerCase() ||
        c.name.toLowerCase().includes(cropId.toLowerCase()) ||
        c.seedName.toLowerCase().includes(cropId.toLowerCase())
    ) || null
  );
}

module.exports = {
  getCrop,
};
