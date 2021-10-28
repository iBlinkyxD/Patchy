const Discord = require('discord.js');

module.exports = {
  name: 'join',
  aliases: ['join', 'j'],
  description: 'join vc.',
  async run (client, message, cmd, args) {
    message.member.channel.join();
  }
}
