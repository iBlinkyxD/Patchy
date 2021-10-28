const Discord = require('discord.js');

module.exports = {
  name: 'queue',
  aliases: ['queue', 'q'],
  description: 'Check queue of songs.',
  async run (client, message, cmd, args) {
    const queue = client.distube.getQueue(message)
    if (!queue) return message.channel.send(`There is nothing playing!`)
    const q = queue.songs.map((song, i) => `${i === 0 ? "Playing:" : `${i}.`} ${song.name} - \`${song.formattedDuration}\``).join("\n")
    message.channel.send(`**Server Queue**\n${q}`)
  }
}
