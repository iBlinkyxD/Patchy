const Discord = require("discord.js");

module.exports = class mute {
  constructor(){
    this.name = 'mute',
    this.alias = ['m'],
    this.usage = ';mute'
  }

  async run (client, message, args) {
    if(!message.member.hasPermission("MUTE_MEMBERS")) return message.channel.send("No tienes permiso");
    let channel = message.member.voice.channel;

    for (let member of channel.members){
      member[1].voice.setMute(true);
    }
    return message.channel.send("Muted!");
  }
}
