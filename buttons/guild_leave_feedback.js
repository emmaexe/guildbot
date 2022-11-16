const Discord = require('discord.js')
const config = require('../config.json')
const functions = require('../functions.js')

module.exports = {
    async execute(client, interaction) {
        let cshort = config.modals.guildLeaveFeedback.shortQuestion, clong = config.modals.guildLeaveFeedback.longQuestion;
        let modal = new Discord.Modal()
            .setCustomId("guildLeaveFeedback")
            .setTitle("Guild leave feedback.")
        let textInputShort = new Discord.TextInputComponent(), textInputLong = new Discord.TextInputComponent(), rowShort = new Discord.MessageActionRow(), rowLong = new Discord.MessageActionRow();
        if (cshort.enabled) {
            textInputShort
                .setCustomId("textinputshort")
                .setLabel(cshort.text)
                .setPlaceholder(cshort.placeholder)
                .setMinLength(cshort.minLength)
                .setMaxLength(cshort.maxLength)
                .setStyle(1)
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
                .setStyle(2)
            rowLong.addComponents(textInputLong)
            modal.addComponents(rowLong)
        }
        await interaction.showModal(modal);
    }
}