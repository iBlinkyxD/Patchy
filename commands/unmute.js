const Discord = require("discord.js");

module.exports = {
  name: 'unmute',
  aliases: ['u'],
  description: 'Unmute everyone in the voice chat.',
  async run (client, message, cmd, args) {
    if(!message.member.hasPermission("MUTE_MEMBERS")) return message.channel.send("No tienes permiso");
    let channel = message.member.voice.channel;

    for (let member of channel.members){
      await member[1].voice.setMute(false);
    }
    return message.channel.send("Unmuted!");
  }
}
