const Discord = require('discord.js');

module.exports = {
  name: 'pause',
  aliases: ['pause', 'stop', 'hold'],
  description: 'Pause the song',
  async run (client, message, cmd, args) {
    const queue = client.distube.getQueue(message)
    if (!queue) return message.channel.send(`There is nothing in the queue right now!`)
    // if (queue.pause) {
    //     queue.resume()
    //     return message.channel.send("Resumed the song for you :)")
    // }
    queue.pause()
    message.channel.send("Paused the song for you :)")
  }
}
