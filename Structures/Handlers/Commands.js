const { Perms } = require("../Validation/Permissions");
const { Client } = require("discord.js");


/**
 * @param {Client} client
 */
module.exports = async (client, PG, Ascii) => {
    const Table = new Ascii("Command Loaded");

    CommandsArray = [];

    (await PG(`${process.cwd().replace(/\\/g, '/')}/Commands/*/*.js`)).map(async (file) => {
        const command = require(file);

        if(!command.name)
        return Table.addRow(file.split("/")[7], "Failed", "Missing a name.")

        if(!command.description)
        return Table.addRow(command.name, "Failed", "Missing a description")

        if(command.permission) {
            if(Perms.includes(command.permission))
            command.defaultPermission = false;
            else
            return Table.addRow(command.name, "Failed", "Permission is invalid")
        }

        client.commands.set(command.name, command);
        CommandsArray.push(command);

        await Table.addRow(command.name,  "Succesfuly loaded command!");
    });
    
    console.log(Table.toString());

    //Permissions check //
    client.on('ready', async () => {
        const mainGuild = await client.guilds.cache.get("GUILDID_GOES_HERE");
        
    });

    client.on("ready", async () => {

        client.guilds.cache.forEach((g) => {
            g.commands.set(CommandsArray);
        });
    });
}