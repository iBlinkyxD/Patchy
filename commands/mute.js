const Discord = require("discord.js");

module.exports = {
  name:'mute',
  aliases: ['m'],
  description: 'mute all members in the voice chat.',
  async run (client, message, cmd, args) {
    if(!message.member.hasPermission("MUTE_MEMBERS")) return message.channel.send("You dont have the permissions");
    let channel = message.member.voice.channel;

    for (let member of channel.members){
      await member[1].voice.setMute(true);
    }
    return message.channel.send("Muted!");
  }
}
