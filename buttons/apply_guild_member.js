const Discord = require('discord.js')
const config = require('../config.json')

module.exports = {
    async execute(client, interaction) {
        let message = interaction.message
        let nembed = new Discord.MessageEmbed()
            .setColor(config.colours.main)
            .setTimestamp()
        if (message.channel.type == 'GUILD_TEXT' && message.channel.name.startsWith('ticket-')) {
            let reqString = "";
            for (let i = 0;i<config.guildAppReqs.textReqs.length;i++) {
                reqString+=`**${i+1}.** ${config.guildAppReqs.textReqs[i]}\n`;
            }
            if (config.guildAppReqs.minNetworkLevel > 0) reqString+=`\n*This guild enforces **a minimum network level requirement**. To join this guild, your [hypixel network level](https://hypixel.fandom.com/wiki/Network_Levels) must be at the very least **${config.guildAppReqs.minNetworkLevel}**.*`
            nembed.addField('Do you agree with the following:', reqString)
                let yesbutton = new Discord.MessageButton()
                    .setStyle(2)
                    .setEmoji(config.emoji.yes) //865887075509338122
                    .setLabel('Yes')
                    .setCustomId('application_guild_member_yes')
                let nobutton = new Discord.MessageButton()
                    .setStyle(2)
                    .setEmoji(config.emoji.no) //865887075491643402
                    .setLabel('No')
                    .setCustomId('application_guild_member_no')
                let row = new Discord.MessageActionRow()
                    .addComponents(yesbutton, nobutton)
                interaction.update({
                    embeds: [nembed],
                    components: [row]
                });            
        } else {
            nembed.addField('**Guild applications**', `**Guild membership application**\nTo join the guild, create a ticket and run the command again.`)
            interaction.update({
                embeds: [nembed],
                components: []
            });
        }
    }
}