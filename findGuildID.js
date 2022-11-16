//If you need to find your guild's hypixel guild UUID, run ``node findGuildID.js`` instead of ``node .`` or ``node server.js``.
//This script is seperate from the bot and is not required for it to work. You may delete it if you wish, but keep it here if you think you might need to find your hypixel guild's UUID again.

const readline = require("readline");
const rl = readline.createInterface({input: process.stdin, output: process.stdout });
require('dotenv').config()
const fetch = require('node-fetch')

rl.question("Enter the guild name: ", async function(name) {
    let rawData = await fetch(`https://api.hypixel.net/guild?key=${process.env.APIKEY}&name=${name}`)
    let data = await rawData.json()
    if (data.success) {
        console.log(`\nHere is your hypixel guild's UUID:\n${data.guild._id}`)
    } else {
        console.error(`A hypixel API error occurred:\n${data.cause}`)
    }
    rl.close();
});