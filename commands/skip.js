const Discord = require('discord.js');

module.exports = {
  name: 'skip',
  aliases: ['skip', 's'],
  description: 'Skip the current song.',
  async run (client, message, cmd, args) {
    const queue = client.distube.getQueue(message)
    if (!queue) return message.channel.send(`There is nothing in the queue right now!`)
    try {
        const song = queue.skip()
        message.channel.send(`Skipped!`)
    } catch (e) {
        message.channel.send(`${e}`)
    }
  }
}
