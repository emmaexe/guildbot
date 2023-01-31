const Discord = require('discord.js')
const config = require('../config/config.json')
const functions = require('../functions.js')

module.exports = {
    async execute(client, interaction) {
        let cshort = config.modals.guildLeaveFeedback.shortQuestion, clong = config.modals.guildLeaveFeedback.longQuestion;
        let modal = new Discord.ModalBuilder()
            .setCustomId("guildLeaveFeedback")
            .setTitle("Guild leave feedback.")
        let textInputShort = new Discord.TextInputBuilder(), textInputLong = new Discord.TextInputBuilder(), rowShort = new Discord.ActionRowBuilder(), rowLong = new Discord.ActionRowBuilder();
        if (cshort.enabled) {
            textInputShort
                .setCustomId("textinputshort")
                .setLabel(cshort.text)
                .setPlaceholder(cshort.placeholder)
                .setMinLength(cshort.minLength)
                .setMaxLength(cshort.maxLength)
                .setStyle(Discord.TextInputStyle.Short)
            rowShort.addComponents(textInputShort)
            modal.addComponents(rowShort)
        }
        if (clong.enabled) {
            textInputLong
                .setCustomId("textinputlong")
                .setLabel(clong.text)
                .setPlaceholder(clong.placeholder)
                .setMinLength(clong.minLength)
                .setMaxLength(clong.maxLength)
                .setStyle(Discord.TextInputStyle.Paragraph)
            rowLong.addComponents(textInputLong)
            modal.addComponents(rowLong)
        }
        await interaction.showModal(modal);
    }
}