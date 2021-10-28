const Discord = require("discord.js");

module.exports = {
  name: 'test',
  aliases: ['t'],
  description: 'Just a test command.',
  async run (client, message, cmd, args) {
    return message.channel.send("tumal");
  }
}
