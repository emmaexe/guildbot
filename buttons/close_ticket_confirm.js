const Discord = require('discord.js')
const config = require('../config.json')
const functions = require('../functions.js')
const transcripts = require('discord-html-transcripts');
const mongo = require('mongodb');
const MongoClient = new mongo.MongoClient(process.env.MONGO_URL)

module.exports = {
    async execute(client, interaction) {
        let closeTicket = async function(channel, ticket, reason) {
            const transcript = await transcripts.createTranscript(channel)
            await channel.delete(`Ticket closed by ${interaction.user.tag} [${interaction.user.id}].`)
            await interaction.guild.channels.fetch(config.channels.logChannelId).then(async logchannel => {
                let logembed = new Discord.MessageEmbed()
                    .setTitle(`${config.emoji.log} LOG\n\nTicket Closed`)
                    .setThumbnail(interaction.user.avatarURL())
                    .setColor(config.colours.main)
                    .addField('**Ticket # ID: **', `${ticket.numid}`)
                    .addField('**Ticket opened by: **', `<@${ticket.user_id}> [${ticket.user_id}]`)
                    .addField(`**Ticket closed by:** `, `<@${interaction.user.id}> [${interaction.user.id}]`)
                    .addField('**Ticket opened on: **', `<t:${Math.round((await functions.getTimestampFromID(channel.id))/1000)}> [<t:${Math.round((await functions.getTimestampFromID(channel.id))/1000)}:R>]`)
                    .addField('**Ticket opened for reason: **', `${ticket.reason}`)
                    .addField('**Ticket channel: **', `<#${ticket.channel_id}> [${ticket.channel_id}]`)
                    .setTimestamp()
                if (config.tickets.ticketTranscript) {
                    logchannel.send({embeds:[logembed], files:[transcript]})
                } else {
                    logchannel.send({embeds:[logembed]})
                }
                if (config.tickets.userHasTranscript) {
                    await interaction.guild.members.fetch(ticket.user_id).then(async member => {
                        await member.send({content:`Your ticket in ${interaction.guild.name} has been closed.`, files:[transcript]})
                    })
                }
                return interaction.reply({content: "**The ticket will now be closed.**", ephemeral: true});
            })
        }
        let channel = interaction.channel
        await MongoClient.connect()
        const db = MongoClient.db()
        db.collection('tickets').findOne({ sid: "ticket", channel_id: channel.id }, async function(err, ticket) {
            if (err) throw err;
            if (ticket != undefined) {
                if (interaction.user.id == ticket.user_id) {
                    if (config.tickets.userCanClose) {
                        await closeTicket(channel, ticket)
                        await db.collection('tickets').deleteOne({ sid: "ticket", channel_id: channel.id })
                        await MongoClient.close()
                    } else {
                        await interaction.reply({content: "**You do not have permission to do that.\nUnable to close ticket.**", ephemeral: true});
                        await MongoClient.close()
                    }
                } else {
                    await closeTicket(channel, ticket)
                    await db.collection('tickets').deleteOne({ sid: "ticket", channel_id: channel.id })
                    await MongoClient.close()
                }
            } else {
                await interaction.reply({content: "**The ticket does not exist.\nUnable to close ticket.**", ephemeral: true});
                await MongoClient.close()
            }
        })
        
        
    }
}