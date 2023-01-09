const Discord = require('discord.js')
const config = require('../config.json')

module.exports = {
    async execute(client, interaction) {
        let nembed = new Discord.EmbedBuilder()
            .setColor(config.colours.main)
            .setTimestamp()
            .addFields([{name: '**Guild applications**', value: `**Staff application**\nTo apply for a staff position, fill in [this form](${config.url.guild_staff_application}).`}])
        interaction.update({
            embeds: [nembed],
            components: []
        });
    }
}