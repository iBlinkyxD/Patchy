const Discord = require('discord.js');
const client = new Discord.Client({partials: ["MESSAGE", "CHANNEL", "REACTION", "GUILD_VOICE_STATES"]});
// const botconfig = require('./botconfig.json');
const { CommandHandler } = require('djs-commands');

client.commands = new Discord.Collection();
client.events = new Discord.Collection();

['command_handler', 'event_handler'].forEach(handler =>{
    require(`./handlers/${handler}`)(client, Discord);
})

client.once('ready', () => {
    client.user.setActivity(`Rythm tweakin`, {type: 'WATCHING'}) // PLAYING, WATCHING, LISTENING, STREAMING
});

client.login(process.env.BOT_TOKEN);