const Discord = require('discord.js')
const config = require('../config.json')

module.exports = {
    help: true,
    data: new Discord.SlashCommandBuilder()
        .setName('apply')
        .setDescription(`List of available guild applications.`),
    async execute(client, interaction) {
        await interaction.deferReply()
        let guildmemberbutton = new Discord.ButtonBuilder()
            .setStyle(Discord.ButtonStyle.Secondary)
            .setEmoji(config.emoji.applyCommandMembership)
            .setLabel('Guild membership application')
            .setCustomId('apply_guild_member')
        let guildstaffbutton = new Discord.ButtonBuilder()
            .setStyle(Discord.ButtonStyle.Secondary)
            .setEmoji(config.emoji.applyCommandStaff)
            .setLabel('Staff application')
            .setCustomId('apply_guild_staff')
        let row = new Discord.ActionRowBuilder()
            .addComponents(guildmemberbutton, guildstaffbutton)
        let embed = new Discord.EmbedBuilder()
            .setColor(config.colours.main)
            .setTimestamp()
            .addFields([{name: '**Guild applications**', value: 'Select an application.'}])
        interaction.editReply({
            embeds: [embed],
            components: [row],
            allowedMentions: {
                repliedUser: false
            }
        })
    },
};