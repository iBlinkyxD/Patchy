const Discord = require('discord.js');
const ytdl = require('ytdl-core');
const ytSearch = require('yt-search');

const queue = new Map();

module.exports = {
  name: 'play',
  aliases: ['p','skip', 's', 'exit', 'e', 'dc', 'pause', 'stop', 'resume', 'queue', 'q'],
  description: 'Play music.',
  async run (client, message, cmd, args) {

    const voice_channel = message.member.voice.channel;

    if(!voice_channel) return message.channel.send('You need to be in a channel to execute this command!');
    const permissions = voice_channel.permissionsFor(message.client.user);
    if(!permissions.has('CONNECT')) return message.channel.send('You dont have the correct permissions');
    if(!permissions.has('SPEAK')) return message.channel.send('You dont have the correct permission');

    const server_queue = queue.get(message.guild.id);

    if (cmd === 'play' || cmd === 'p'){

      if(!args.length) return message.channel.send('You need to send the second argument!');
      let song = {};

      if (ytdl.validateURL(args[0])) {
        const song_info = await ytdl.getInfo(args[0]);
        song = { title: song_info.videoDetails.title, url: song_info.videoDetails.video_url }
      } else {
        const video_finder = async (query) => {
          const videoResult = await ytSearch(query);
          return (videoResult.videos.length > 1) ? videoResult.videos[0] : null;
        }
        const video = await video_finder(args.join(' '));
        if (video){
          song = { title: video.title, url: video.url }
        }else{
          message.channel.send('Mi loco me explotaste wtf?');
        }
      }

      if(!server_queue){
        const queue_constructor = {
          voice_channel: voice_channel,
          text_channel: message.channel,
          connection: null,
          songs: []
        }

        queue.set(message.guild.id, queue_constructor);
        queue_constructor.songs.push(song);

        try{
          const connection = await voice_channel.join();
          queue_constructor.connection = connection;
          video_player(message.guild, queue_constructor.songs[0]);
        } catch (err){
          queue.delete(message.guild.id);
          message.channel.send('There was an error connecting!');
          throw err;
        }
      } else{
        server_queue.songs.push(song);
        if(server_queue.songs.length == 1){
          video_player(message.guild,server_queue.songs[0]);
        }else{
          return message.channel.send(`🎶 **${song.title}** added to queue! 🎶`);
        }
      }
    } else if(cmd === 'skip' || cmd === 's') skip_song(client, message, server_queue);
    else if(cmd === 'exit' || cmd === 'e' || cmd === 'dc') exit_song(client, message, server_queue);
    else if(cmd === 'pause' || cmd === 'stop') pause_song(client, message, server_queue);
    else if(cmd === 'resume' || cmd === 'r') resume_song(client, message, server_queue);
    else if(cmd === 'queue' || cmd === 'q') queue_song(client, message, server_queue);

  }
}

const video_player = async (guild, song) => {
  const song_queue = queue.get(guild.id);

  if(!song){
    if(song_queue.songs.length == 0){
      song_queue.leaveTimer = setTimeout(function (){
        song_queue.voice_channel.leave();
        queue.delete(guild.id);
        song_queue.text_channel.send('There is no more songs in the queue. Leaving...');
      },60000);
    }
    return;
  }

  try{
    clearTimeout(song_queue.leaveTimer);
    console.log("leaveTimer Removed!");
  }catch (e){
    console.log("No leaveTimer found"); // There's no leaveTimer
  }

  const stream = ytdl(song.url, { filter: 'audioonly' });
  song_queue.connection.play(stream, {seek: 0, volume: 0.5})
      .on('finish', () => {
        song_queue.songs.shift();
        video_player(guild,song_queue.songs[0]);
      });
  await song_queue.text_channel.send(`🎶 Now playing ** ${song.title}** 🎶`)
}

const skip_song = (client, message, server_queue) => {
  if(!message.member.voice.channel) return message.channel.send('You need to be in a channel to execute this command!');
  // if(!client.voice.channel) return message.channel.send('Bot need to be connected in a channel to execute this command!.');
  if(!server_queue){
    return message.channel.send('❌ There are no song in queue.');
  }
  server_queue.connection.dispatcher.end();
}

const exit_song = (client, message, server_queue) => {
  if(!message.member.voice.channel) return message.channel.send('You need to be in a channel to execute this command!');
  // if(!client.voice.channel) return message.channel.send('Bot need to be connected in a channel to execute this command!.');
  server_queue.songs = [];
  server_queue.connection.dispatcher.end();
}

const pause_song = (client, message, server_queue) => {
  if(!message.member.voice.channel) return message.channel.send('You need to be in a channel to execute this command!');
  // if(!client.voice.channel) return message.channel.send('Bot need to be connected in a channel to execute this command!.');
  if(server_queue.connection.dispatcher.pause()){
    message.channel.send('⏸️The song is already paused.');
  }
  server_queue.connection.dispatcher.pause();
  message.channel.send('⏸️Paused');
}

const resume_song = (client, message, server_queue) => {
  if(!message.member.voice.channel) return message.channel.send('You need to be in a channel to execute this command!');
  // if(!client.voice.channel) return message.channel.send('Bot need to be connected in a channel to execute this command!.');
  server_queue.connection.dispatcher.resume();
  message.channel.send('Resumed');
}

const queue_song = (client, message, server_queue) => {
  if(!message.member.voice.channel) return message.channel.send('You need to be in a channel to execute this command!');
  // if(!client.voice.channel) return message.channel.send('Bot need to be connected in a channel to execute this command!.');
  const queueList = server_queue.songs.map((song, i) => `[${++i}] - ${song.title}`);
  const queueEmbed = new Discord.MessageEmbed()
      .setDescription(queueList);
  return message.channel.send(queueEmbed);
}
