const Discord = require('discord.js');

module.exports = {
  name: 'play',
  aliases: ['p'],
  description: 'Play music.',
  async run (client, message, cmd, args) {
    const string = args.join(" ")
    if (!string) return message.channel.send(`Please enter a song url or query to search.`)
    try {
        client.distube.play(message, string)
    } catch (e) {
        message.channel.send(`Error: \`${e}\``)
    }
  }
}
