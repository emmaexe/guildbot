const Discord = require('discord.js')
const fs = require('fs')
const config = require('../config/config.json')

module.exports = {
    async execute(client, interaction) {
        let buttonFoward = new Discord.ButtonBuilder()
            .setStyle(Discord.ButtonStyle.Secondary)
            .setEmoji(config.emoji.arrowRight)
            .setCustomId('help_menu_2')
        let buttonBackwards = new Discord.ButtonBuilder()
            .setStyle(Discord.ButtonStyle.Secondary)
            .setEmoji(config.emoji.arrowLeft)
            .setCustomId('help_menu_0')
        let row = new Discord.ActionRowBuilder()
            .addComponents(buttonBackwards, buttonFoward)
        const embed = new Discord.EmbedBuilder()
            .setColor(config.colours.secondary)
            .setTimestamp()
            .setFooter({text: 'Developed by @emmaexe#0859'})
            .setTitle("Commands:")
        const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            const command = require(`../commands/${file}`);
            if (command.help) {embed.addFields([{name: `**/${command.data.name}**`, value: `${command.data.description}`}])}
        }
        interaction.update({
            embeds: [embed],
            components: [row]
        });
    }
}