require('dotenv').config()
module.exports.deploy = async (client, clientId, guildId) => {
    const fs = require('fs');
    const { REST } = require('@discordjs/rest');
    const { Routes } = require('discord-api-types/v9');
    const token = process.env.TOKEN
    
    const commands = [];
    const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
    
    for (const file of commandFiles) {
        const command = require(`./commands/${file}`);
        if (command.data) {commands.push(command.data.toJSON());}
    }
    
    const rest = new REST({ version: '9' }).setToken(token);
    
    rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands }).then(async () => {
        console.log('Successfully registered application commands.')
    }).catch(console.error);
}