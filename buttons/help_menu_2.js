const Discord = require('discord.js')
const config = require('../config/config.json')
const pkg = require('../package.json')

module.exports = { 
    async execute(client, interaction) {
        let buttonFoward = new Discord.ButtonBuilder()
            .setStyle(Discord.ButtonStyle.Secondary)
            .setEmoji(config.emoji.arrowRight)
            .setCustomId('help_menu_fowards')
            .setDisabled(true)
        let buttonBackwards = new Discord.ButtonBuilder()
            .setStyle(Discord.ButtonStyle.Secondary)
            .setEmoji(config.emoji.arrowLeft)
            .setCustomId('help_menu_1')
        let row = new Discord.ActionRowBuilder()
            .addComponents(buttonBackwards, buttonFoward)
        const embed = new Discord.EmbedBuilder()
            .setColor(config.colours.secondary)
            .setTimestamp()
            .setTitle("Found a bug? Have a feature request? Need help?")
            .setDescription(`${config.emoji.github} [GitHub](https://github.com/emmaexe/guildbot)\n${config.emoji.discord} [Support server](${pkg.supportServer})`)
            .setFooter({text: 'Developed by @emmaexe#0859'})
        interaction.update({
            embeds: [embed],
            components: [row]
        });
    }
}