const Discord = require('discord.js');
const client = new Discord.Client({disableEveryone: true});
const { CommandHandler } = require('djs-commands');
const CH = new CommandHandler({
  folder: __dirname + "/commands/",
  prefix: [';']
});

client.on('ready', async () => {
  console.log(client.user.username + ' is online!');
  client.user.setActivity('con la Mama de Matias');
});

client.on('message', async message => {
  if(message.channel.type === 'dm') return;
  if(message.author.type === 'bot') return;

  let messageArray = message.content.split(' ');
  let args = messageArray.splice(1);
  let command = messageArray[0];
  let cmd = CH.getCommand(command);

  if(!cmd) return;
  try{
    cmd.run(client, message, args);
  }catch(e){
    console.log(e)
  }
});

client.login(process.env.BOT_TOKEN);
