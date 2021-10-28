const Discord = require('discord.js');

module.exports = {
  name: 'resume',
  aliases: ['resume', 'unpause'],
  description: 'Resume the song.',
  async run (client, message, cmd, args) {
    const queue = client.distube.getQueue(message)
    if (!queue) return message.channel.send(`There is nothing in the queue right now!`)
    queue.resume()
    message.channel.send("Resumed the song for you :)")
  }
}
