//If you wish to clear slash commands from the bot, run ``node clearSlashCommands.js`` instead of ``node .`` or ``node server.js``.
//This script is seperate from the bot and is not required for it to work. You may delete it if you wish, but just in case you ever want to clear the bot's slash commands, keep it here.

require('dotenv').config({ path: './config/.env' })
const Discord = require('discord.js')
const allIntents = new Discord.Intents(32767); const client = new Discord.Client({ intents: allIntents });
const config = require('./config/config.json')

client.login(process.env.TOKEN)

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`)
    let guild = await client.guilds.fetch(config.discordGuildId)
    console.log(`Deleting ${guild.commands.size} commands`)
    await guild.commands.set([]).then(console.log)
    client.destroy()
})