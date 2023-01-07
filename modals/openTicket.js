const Discord = require('discord.js')
const config = require('../config.json')
const functions = require('../functions.js')
const Permissions = Discord.Permissions;
require('dotenv').config()
const mongo = require('mongodb')
const MongoClient = new mongo.MongoClient(process.env.MONGO_URL)

module.exports = {
    async execute(client, interaction) {
        let reason = await interaction.fields.getTextInputValue("reason")
        await client.guilds.fetch(config.discordGuildId).then (async guild => {
            await MongoClient.connect()
            const db = MongoClient.db()
            db.collection('statistics').findOne({ sid: "countTickets" }, async function(err, countres) {
                if (err) throw err;
                let count = undefined; if (countres != undefined) {count = countres.value; count+=1} else {count = 1};
                if (countres != undefined) {
                    await db.collection('statistics').updateOne({ sid: "countTickets" }, { $set: { value: count } })
                } else {
                    await db.collection('statistics').insertOne({ sid: "countTickets", value: count })
                }
                let category = await client.channels.fetch(config.tickets.categoryId)
                let permissions = await category.permissionOverwrites.cache.get()
                category.createChannel(`ticket-${count}`, {
                    reason: `New ticket opened by ${interaction.user.tag}.`,
                    type: 'GUILD_TEXT',
                    topic: `Ticket #${count}\nTicket opened by ${interaction.user.tag}\nReason: ${reason}`,
                    permissionOverwrites: permissions,
                    position: 0
                }).then(async channel => {
                    await channel.permissionOverwrites.create(interaction.user.id, { 'VIEW_CHANNEL': true, 'SEND_MESSAGES': true, 'ATTACH_FILES': true, 'READ_MESSAGE_HISTORY': true })
                    await interaction.reply({content: `**Your ticket was opened.**\n<#${channel.id}>`, ephemeral: true})
                    await guild.channels.fetch(config.channels.logChannelId).then(async logchannel => {
                        let logembed = new Discord.MessageEmbed()
                            .setTitle(`${config.emoji.log} LOG\n\nNew Ticket Opened`)
                            .setThumbnail(interaction.user.avatarURL())
                            .setColor(config.colours.main)
                            .addField(`**Ticket author:** `, `<@${interaction.user.id}> [${interaction.user.id}]`)
                            .addField(`**Reason:** `, `${reason}`)
                            .addField(`**Channel:** `, `<#${channel.id}>`)
                            .setTimestamp()
                        logchannel.send({embeds:[logembed]})
                        let embed = new Discord.MessageEmbed()
                            .setColor(config.colours.main)
                            .setTitle('**A staff member will be here to help you soon.**')
                            .setTimestamp()
                        let nomembershipembed = new Discord.MessageEmbed()
                            .setColor(config.colours.main)
                            .setTitle('**A staff member will be here to help you soon.**')
                            .setDescription(`**Looking to join the guild?**\n[Guild forums post](${config.url.forums_post})\n*To apply, run the **/apply** command in a ticket.*\n**Applied and accepted?**\nAn invite will be sent to you when a staff member is online.\n**You aren\'t online?**\nAn offline invite will be sent. This means the next time you next log in, you will have 5 minutes to join the guild before the invite expires.`)
                            .setTimestamp()
                        let linkingEmbed = new Discord.MessageEmbed()
                            .setColor(config.colours.main)
                            .setTitle('**Before applying, please link your account!**')
                            .setDescription('If you are here to apply for guild membership:\nBefore you may apply, you must link your minecraft account to your discord account. Press the button to learn more.')
                            .setTimestamp()
                        let linkHelpButton = new Discord.MessageButton()
                            .setStyle(2)
                            .setEmoji('ℹ️')
                            .setLabel('Learn more.')
                            .setCustomId('link_help_button')
                        let closeTicketButton = new Discord.MessageButton()
                            .setStyle(4)
                            .setEmoji('🔒')
                            .setLabel('Close ticket')
                            .setCustomId('close_ticket')
                        let infoTicketEmbed = new Discord.MessageEmbed()
                            .setColor(config.colours.main)
                            .addField('**Ticket # ID: **', `${count}`)
                            .addField('**Ticket opened by: **', `<@${interaction.user.id}> [${interaction.user.id}]`)
                            .addField('**Ticket opened on: **', `<t:${Math.round((await functions.getTimestampFromID(channel.id))/1000)}> [<t:${Math.round((await functions.getTimestampFromID(channel.id))/1000)}:R>]`)
                            .addField('**Ticket opened for reason: **', `${reason}`)
                            .addField('**Ticket channel: **', `<#${channel.id}> [${channel.id}]`)
                            .setTimestamp()
                        let closeTicketEmbed = new Discord.MessageEmbed()
                            .setColor(config.colours.secondary)
                            .setTitle('**To close the ticket, please press the button.**')
                            .setTimestamp()
                        let row = new Discord.MessageActionRow()
                            .addComponents(linkHelpButton)
                        let closerow = new Discord.MessageActionRow()
                            .addComponents(closeTicketButton)
                        let firstMessage = undefined, closeMessage = undefined;
                        if (config.tickets.userCanClose) {
                            closeMessage = await channel.send({embeds: [infoTicketEmbed, closeTicketEmbed], components: [closerow]})
                            await closeMessage.pin()
                        }
                        if (interaction.member) {
                            if (interaction.member.roles.cache.has(config.roles.guildMemberRole)) {
                                firstMessage = await channel.send({embeds: [embed]})
                            } else {
                                firstMessage = await channel.send({embeds: [nomembershipembed, linkingEmbed], components:[row]})
                            }
                            await firstMessage.pin()
                        }
                        await db.collection('tickets').insertOne({ sid: "ticket", numid: count, channel_id: channel.id, user_id: interaction.user.id, reason: reason })
                        await MongoClient.close()
                    })
                })
            })
        });
    }
}