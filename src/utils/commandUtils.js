
// Helper to extract seed + amount
function parseArguments(args) {
  let amount = parseInt(args[args.length - 1]);
  let seedId = isNaN(amount) ? args.join(" ") : args.slice(0, -1).join(" ");
  return {
    seedId,
    amount: isNaN(amount) ? 1 : Math.max(amount, 1),
  };
}

module.exports = {
    parseArguments,
}