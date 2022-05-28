const { Client } = require("discord.js");


module.exports = {
    name: "ready",
    once: true,
    /**
     *  @param {Client} client
     */

    execute (client){
        console.log("Patchy is online!");
        client.user.setActivity("星街すいせい", {type: "WATCHING"})
    }
}