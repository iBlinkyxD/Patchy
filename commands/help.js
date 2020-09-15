const Discord = require("discord.js");

module.exports = class help {
  constructor(){
    this.name = 'help',
    this.alias = ['h'],
    this.usage = ';help'
  }

  async run (client, message, args) {
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
