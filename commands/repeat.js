const Discord = require('discord.js');

module.exports = {
  name: 'repeat',
  aliases: ['repeat', 'loop'],
  description: 'Resume the song.',
  async run (client, message, cmd, args) {
    const queue = client.distube.getQueue(message)
    if (!queue) return message.channel.send(`There is nothing playing!`)
    let mode = null
    switch (args[0]) {
        case "off":
            mode = 0
            break
        case "song":
            mode = 1
            break
        case "queue":
            mode = 2
            break
    }
    mode = queue.setRepeatMode(mode)
    mode = mode ? mode === 2 ? "Repeat queue" : "Repeat song" : "Off"
    message.channel.send(`Set repeat mode to \`${mode}\``)
  }
}
