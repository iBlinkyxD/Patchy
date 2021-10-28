const Discord = require("discord.js");

module.exports = {
  name: 'help',
  aliases: ['h'],
  description: 'Show a list of commands and their description.',
  async run (client, message, cmd, args, Discord) {
    let botembed = new Discord.MessageEmbed()
    .setTitle("Lista de Commandos")
    .setColor("#fc7edd")
    .addField("**Help**", "Muesta la lista de Commandos")
    .addField("**Mute**", "Mutea a todos dentro del Canal de Voz")
    .addField("**Unmute**", "Desmutea a todos dentro del Canal de Voz")
    // .addField("**Prefix**", "Cambia el prefix del Commando")
    return message.channel.send(botembed);
  }
}
