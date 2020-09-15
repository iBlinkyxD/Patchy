const Discord = require("discord.js");

module.exports = class unmute {
  constructor(){
    this.name = 'unmute',
    this.alias = ['u'],
    this.usage = ';unmute'
  }

  async run (client, message, args) {
    if(!message.member.hasPermission("MUTE_MEMBERS")) return message.channel.send("No tienes permiso");
    let channel = message.member.voice.channel;

    for (let member of channel.members){
      member[1].voice.setMute(false);
    }
    return message.channel.send("Unmuted!");
  }
}
