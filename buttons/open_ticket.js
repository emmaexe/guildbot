const Discord = require('discord.js')
const config = require('../config.json')
const functions = require('../functions.js')

module.exports = {
    async execute(client, interaction) {
        let modal = new Discord.Modal()
            .setCustomId("openTicket")
            .setTitle("Open a ticket.")
        let row = new Discord.MessageActionRow()
        let reasonTextInput = new Discord.TextInputComponent()
            .setCustomId("reason")
            .setLabel("Why are you opening the ticket?")
            .setPlaceholder("Enter a reason...")
            .setMinLength(10)
            .setMaxLength(500)
            .setRequired(true)
            .setStyle(2)
        row.addComponents(reasonTextInput)
        modal.addComponents(row)
        await interaction.showModal(modal);
    }
}