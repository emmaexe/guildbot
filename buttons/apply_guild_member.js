const Discord = require('discord.js')
const config = require('../config.json')
require('dotenv').config()
const mongo = require('mongodb')
const MongoClient = new mongo.MongoClient(process.env.MONGO_URL)

module.exports = {
    async execute(client, interaction) {
        let message = interaction.message
        let nembed = new Discord.EmbedBuilder()
            .setColor(config.colours.main)
            .setTimestamp()
        await MongoClient.connect()
        const db = MongoClient.db()
        db.collection('tickets').findOne({ sid: "ticket", channel_id: interaction.channel.id, user_id: interaction.user.id }, async function(err, ticket) {
            if (err) throw err;
            if (ticket != undefined) {
                let reqString = "";
                for (let i = 0;i<config.guildAppReqs.textReqs.length;i++) {
                    reqString+=`**${i+1}.** ${config.guildAppReqs.textReqs[i]}\n`;
                }
                if (config.guildAppReqs.minNetworkLevel > 0) reqString+=`\n*This guild enforces **a minimum network level requirement**. To join this guild, your [hypixel network level](https://hypixel.fandom.com/wiki/Network_Levels) must be at the very least **${config.guildAppReqs.minNetworkLevel}**.*`
                nembed.addFields([{name: 'Do you agree with the following:', value: reqString}])
                let yesbutton = new Discord.ButtonBuilder()
                    .setStyle(Discord.ButtonStyle.Secondary)
                    .setEmoji(config.emoji.yes)
                    .setLabel('Yes')
                    .setCustomId('application_guild_member_yes')
                let nobutton = new Discord.ButtonBuilder()
                    .setStyle(Discord.ButtonStyle.Secondary)
                    .setEmoji(config.emoji.no)
                    .setLabel('No')
                    .setCustomId('application_guild_member_no')
                let row = new Discord.ActionRowBuilder()
                    .addComponents(yesbutton, nobutton)
                await interaction.update({
                    embeds: [nembed],
                    components: [row]
                });
                await MongoClient.close()
            } else {
                nembed.addFields([{name: '**Guild applications**', value: `**Guild membership application**\nTo join the guild, create a ticket and run the command again.`}])
                await interaction.update({
                    embeds: [nembed],
                    components: []
                });
                await MongoClient.close()
            }
        })
    }
}