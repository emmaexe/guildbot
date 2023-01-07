const Discord = require('discord.js')

module.exports = {
    async execute(client, interaction) {
        let row = new Discord.MessageActionRow()
        let button = new Discord.MessageButton()
            .setStyle(4)
            .setEmoji('🔒')
            .setLabel('Close ticket')
            .setCustomId('close_ticket_confirm')
        row.addComponents(button)
        await interaction.reply({content: "**Please press the button again to confirm you want to close the ticket.**", components: [row], ephemeral: true});
    }
}