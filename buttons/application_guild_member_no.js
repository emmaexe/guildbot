const Discord = require('discord.js')
const config = require('../config.json')

module.exports = {
    async execute(client, interaction) {
        let nembed = new Discord.EmbedBuilder()
            .setColor(config.colours.main)
            .setTimestamp()
            .setTitle(`We're sorry but you do not meet the requirements to join the guild.`)
        interaction.update({
            embeds: [nembed],
            components: []
        });
        const logembed = new Discord.EmbedBuilder()
            .setColor(config.colours.error)
            .setTimestamp()
            .setTitle(interaction.user.tag)
            .setThumbnail(interaction.user.displayAvatarURL())
            .addFields([{name: '**Failed application**', value: '**Questions 1-3 (requirements):**\nUser anwsered **NO**.\n**Question 4 (IGN):**\nNot checked.'}])
        channel = client.channels.cache.get(config.channels.appChannelId)
        channel.send({embeds: [logembed]})
    }
}