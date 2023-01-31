const Discord = require('discord.js')
const config = require('../config/config.json')
const functions = require('../functions.js')

module.exports = {
    async execute(client, interaction) {
        let modal = new Discord.ModalBuilder()
            .setCustomId("openTicket")
            .setTitle("Open a ticket.")
        let row = new Discord.ActionRowBuilder()
        let reasonTextInput = new Discord.TextInputBuilder()
            .setCustomId("reason")
            .setLabel("Why are you opening the ticket?")
            .setPlaceholder("Enter a reason...")
            .setMinLength(10)
            .setMaxLength(500)
            .setRequired(true)
            .setStyle(Discord.TextInputStyle.Paragraph)
        row.addComponents(reasonTextInput)
        modal.addComponents(row)
        await interaction.showModal(modal);
    }
}