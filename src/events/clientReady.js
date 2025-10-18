const { ActivityType } = require("discord.js");

module.exports = (client) => {
  console.log("Patchy is online!");

  client.user.setPresence({
    activities: [{ name: "星街すいせい", type: ActivityType.Watching }],
    status: "dnd",
  });
};