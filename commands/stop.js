const Discord = require('discord.js');

module.exports = {
  name: 'stop',
  aliases: ['disconnect', 'leave', 'exit', 'dc'],
  description: 'Play music.',
  async run (client, message, cmd, args) {
    const queue = client.distube.getQueue(message)
    if (!queue) return message.channel.send(`There is nothing in the queue right now!`)
    queue.stop()
    message.channel.send(`Stopped!`)
  }
}
