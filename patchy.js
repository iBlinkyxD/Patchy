const Discord = require('discord.js');
const client = new Discord.Client({partials: ["MESSAGE", "CHANNEL", "REACTION", "GUILD_VOICE_STATES"]});
const { CommandHandler } = require('djs-commands');
const distube = require('distube');

client.distube = new distube.DisTube(client, {searchSongs: 0, emitNewSongOnly: true});
const status = queue => `Volume: \`${queue.volume}%\` | Filter: \`${queue.filters.join(", ") || "Off"}\` | Loop: \`${queue.repeatMode ? queue.repeatMode === 2 ? "All Queue" : "This Song" : "Off"}\` | Autoplay: \`${queue.autoplay ? "On" : "Off"}\``
client.distube    
    .on("playSong", (queue, song) => queue.textChannel.send(
        `🎶 Now Playing \`${song.name}\` - \`${song.formattedDuration}\`\nRequested by: ${song.user}\n${status(queue)}`
    ))
    .on("addSong", (queue, song) => queue.textChannel.send(
        `Added ${song.name} - \`${song.formattedDuration}\` to the queue by ${song.user}`
    ))
    .on("addList", (queue, playlist) => queue.textChannel.send(
        `Added \`${playlist.name}\` playlist (${playlist.songs.length} songs) to queue\n${status(queue)}`
    ))
    .on("error", (channel, e) => {
        channel.send(`An error encountered: ${e}`)
        console.error(e)
    })
    .on("empty", channel => channel.send("Voice channel is empty! Leaving the channel..."))
    .on("searchNoResult", message => message.channel.send(`No result found!`))
    .on("finish", queue => queue.textChannel.send("Finished!"))


client.commands = new Discord.Collection();
client.events = new Discord.Collection();

['command_handler', 'event_handler'].forEach(handler =>{
    require(`./handlers/${handler}`)(client, Discord);
})

client.once('ready', () => {
    client.user.setActivity(`Rythm tweakin`, {type: 'WATCHING'}) // PLAYING, WATCHING, LISTENING, STREAMING
});

client.login(process.env.BOT_TOKEN);
