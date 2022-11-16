const { SlashCommandBuilder } = require('@discordjs/builders');
const Discord = require('discord.js')
const config = require('../config.json')

module.exports = {
    help: true,
    data: new SlashCommandBuilder()
        .setName('apply')
        .setDescription(`List of available guild applications.`),
    async execute(client, interaction) {
        await interaction.deferReply()
        let guildmemberbutton = new Discord.MessageButton()
            .setStyle(2)
            .setEmoji(config.emoji.applyCommandMembership)
            .setLabel('Guild membership application')
            .setCustomId('apply_guild_member')
        let guildstaffbutton = new Discord.MessageButton()
            .setStyle(2)
            .setEmoji(config.emoji.applyCommandStaff)
            .setLabel('Staff application')
            .setCustomId('apply_guild_staff')
        let row = new Discord.MessageActionRow()
            .addComponents(guildmemberbutton, guildstaffbutton)
        let embed = new Discord.MessageEmbed()
            .setColor(config.colours.main)
            .setTimestamp()
            .addField('**Guild applications**', 'Select an application.')
        interaction.editReply({
            embeds: [embed],
            components: [row],
            allowedMentions: {
                repliedUser: false
            }
        })
    },
};