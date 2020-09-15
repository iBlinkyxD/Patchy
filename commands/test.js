const Discord = require("discord.js");

module.exports = class test {
  constructor(){
    this.name = 'test',
    this.alias = ['t'],
    this.usage = ';test'
  }

  async run (client, message, args) {
    return message.channel.send("tumal");
  }
}
