const Discord = require('discord.js')
const config = require('../config/config.json')

module.exports = {
    async execute(client, interaction) {
        let message = interaction.message
        message.delete()
        interaction.reply({content: "Deleted.", ephemeral: true})
    }
}