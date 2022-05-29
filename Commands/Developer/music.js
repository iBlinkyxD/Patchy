const { CommandInteraction, Client, MessageEmbed, Message } = require("discord.js");

module.exports = {
    name: "music",
    description: "Complete music system",
    options: [
        {
        name:"play", description: "Play a song.", type: "SUB_COMMAND",
        options:[{name: "query", description: "Provide a name or a url for the song", type: "STRING", required: true}]
        },
        {
            name: "volume", description: "Alter the volume", type: "SUB_COMMAND",
            options: [{name: "percent", description: "10 = 10%", type: "NUMBER", required: true}]
        },
        {
            name: "settings", description: "Select an option.", type: "SUB_COMMAND",
            options: [{name: "options", description: "Select an option.", type: "STRING", required: true,
            choices: [
                {name: "View Queue", value: "queue"},
                {name: "Skip Song", value: "skip"},
                {name: "Pause Song", value: "pause"},
                {name: "Resume Song", value: "resume"},
                {name: "Stop Music", value: "stop"},
                {name: "Shuffle Queue", value: "shuffle"},
                {name: "Toggle Repeat Mode", value: "RepeatMode"}
            ]}]
        }
    ],
    /**
     * @param {CommandInteraction} interaction 
     * @param {Client} client 
     */
    async execute(interaction, client){
        const { options, member, guild, channel } = interaction;
        const VoiceChannel = member.voice.channel;

        if(!VoiceChannel)
        return interaction.reply({content: "You must be in a voice channel to be able to use this command.", ephemeral: true});

        if(guild.me.voice.channelId && VoiceChannel.id !== guild.me.voice.channelId)
        return interaction.reply({content: `I'm already playing music in <#${guild.me.voice.channelId}>.`, ephemeral: true});

        try {
            switch(options.getSubcommand()){
                case "play" : {
                    client.distube.play( VoiceChannel, options.getString("query"), { textChannel: channel, member: member});
                    return interaction.reply({content: "Request recieved."});
                }
                case "volume" : {
                    const Volume = options.getNumber("percent");
                    if(Volume > 100 || Volume < 1)
                    return interaction.reply({content: "You have to specifiy a number between 1 and 100."});

                    client.distube.setVolume(VoiceChannel, Volume);
                    return interaction.reply({content: `Volume has been set to \`${Volume}%\``});
                }
                case "settings" : {
                    const queue = await client.distube.getQueue(VoiceChannel);

                    if(!queue)
                    return interaction.reply({content: "There is no song in the queue."});

                    switch(options.getString("options")){
                        case "skip" :
                            await queue.skip(VoiceChannel);
                            return interaction.reply({content: `⏭ Song has been skipped.`});
                        case "stop" :
                            await queue.stop(VoiceChannel);
                            return interaction.reply({content: "⛔️ Queue has been stopped."});
                        case "pause" :
                            await queue.pause(VoiceChannel);
                            return interaction.reply({content: `▶️ Song has been stopped.`});
                        case "resume" :
                            await queue.resume(VoiceChannel);
                            return interaction.reply({content: `⏸ Song has been resumed.`});
                        case "shuffle" :
                            await queue.shuffle(VoiceChannel);
                            return interaction.reply({content: `🔀 Queue has been shuffled.`});
                        case "RepeatMode" :
                            let Mode2 = await client.distube.setRepeatMode(queue);
                            return interaction.reply({content: `🔁 Repeat Mode is set to: ${Mode2 = Mode2 ? Mode2 == 2 ? "Queue" : "Song" : "Off"}`});
                        case "queue":
                            return interaction.reply({embeds: [new MessageEmbed()
                            .setColor("PURPLE")
                            .setDescription(`${queue.songs.map(
                                (song,id) => `\n**${id + 1}**. ${song.name} - \`${song.formattedDuration}\``)}`
                            )]});
                    }
                    return;
                }
            }
        }catch(e){
            const errorEmbed = new MessageEmbed()
            .setColor("RED")
            .setDescription(`Error: ${e}`)
            return interaction.reply({embeds: [errorEmbed]});
        }

    }
}
