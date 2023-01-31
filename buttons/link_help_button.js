const Discord = require('discord.js')
const config = require('../config/config.json')

module.exports = {
    async execute(client, interaction) {
        let message = interaction.message
        let embed = new Discord.EmbedBuilder()
                .setColor(config.colours.main)
                .setTimestamp()
                .addFields([{name: "Account linking system.", value: "**This system is in place to make applying to join the guild easier. It links your discord account with your minecraft account.\nCommands:**\n/link check - Check your own status, or the status of another person\n/link update - Create/update the minecraft account linked to your discord account.\n/link tutorial - Shows a gif with the tutorial on how to link your discord"}])
                .setFooter({text: '[Optional parameter] | <Required parameter>'})
        interaction.reply({embeds: [embed], files: [{
            attachment: './discord_link_tutorial.gif',
            name: 'tutorial.gif'
        }]})
    }
}