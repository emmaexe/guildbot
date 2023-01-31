const Discord = require('discord.js')
const config = require('../config/config.json')
const functions = require('../functions.js')
require('dotenv').config({ path: '../config/.env' });
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
                category.children.create({
                    name: `ticket-${count}`,
                    type: Discord.ChannelType.GuildText,
                    topic: `Ticket #${count}\nTicket opened by ${interaction.user.tag}\nReason: ${reason}`,
                    reason: `New ticket opened by ${interaction.user.tag}.`,
                    permissionOverwrites: permissions,
                    position: 0
                }).then(async channel => {
                    await channel.permissionOverwrites.create(interaction.user.id, { 'ViewChannel': true, 'SendMessages': true, 'AttachFiles': true, 'ReadMessageHistory': true })
                    await interaction.reply({content: `**Your ticket was opened.**\n<#${channel.id}>`, ephemeral: true})
                    await guild.channels.fetch(config.channels.logChannelId).then(async logchannel => {
                        let logembed = new Discord.EmbedBuilder()
                            .setTitle(`${config.emoji.log} LOG\n\nNew Ticket Opened`)
                            .setThumbnail(interaction.user.avatarURL())
                            .setColor(config.colours.main)
                            .addFields([
                                {name: `**Ticket author:** `, value: `<@${interaction.user.id}> [${interaction.user.id}]`},
                                {name: `**Reason:** `, value: `${reason}`},
                                {name: `**Channel:** `, value: `<#${channel.id}>`}
                            ])
                            .setTimestamp()
                        logchannel.send({embeds:[logembed]})
                        let embed = new Discord.EmbedBuilder()
                            .setColor(config.colours.main)
                            .setTitle('**A staff member will be here to help you soon.**')
                            .setTimestamp()
                        let nomembershipembed = new Discord.EmbedBuilder()
                            .setColor(config.colours.main)
                            .setTitle('**A staff member will be here to help you soon.**')
                            .setDescription(`**Looking to join the guild?**\n[Guild forums post](${config.url.forums_post})\n*To apply, run the **/apply** command in a ticket.*\n**Applied and accepted?**\nAn invite will be sent to you when a staff member is online.\n**You aren\'t online?**\nAn offline invite will be sent. This means the next time you next log in, you will have 5 minutes to join the guild before the invite expires.`)
                            .setTimestamp()
                        let linkingEmbed = new Discord.EmbedBuilder()
                            .setColor(config.colours.main)
                            .setTitle('**Before applying, please link your account!**')
                            .setDescription('If you are here to apply for guild membership:\nBefore you may apply, you must link your minecraft account to your discord account. Press the button to learn more.')
                            .setTimestamp()
                        let linkHelpButton = new Discord.ButtonBuilder()
                            .setStyle(Discord.ButtonStyle.Secondary)
                            .setEmoji('ℹ️')
                            .setLabel('Learn more.')
                            .setCustomId('link_help_button')
                        let closeTicketButton = new Discord.ButtonBuilder()
                            .setStyle(Discord.ButtonStyle.Danger)
                            .setEmoji('🔒')
                            .setLabel('Close ticket')
                            .setCustomId('close_ticket')
                        let infoTicketEmbed = new Discord.EmbedBuilder()
                            .setColor(config.colours.main)
                            .addFields([
                                {name: '**Ticket # ID: **', value: `${count}`},
                                {name: '**Ticket opened by: **', value: `<@${interaction.user.id}> [${interaction.user.id}]`},
                                {name: '**Ticket opened on: **', value: `<t:${Math.round((await functions.getTimestampFromID(channel.id))/1000)}> [<t:${Math.round((await functions.getTimestampFromID(channel.id))/1000)}:R>]`},
                                {name: '**Ticket opened for reason: **', value: `${reason}`},
                                {name: '**Ticket channel: **', value: `<#${channel.id}> [${channel.id}]`}
                            ])
                            .setTimestamp()
                        let closeTicketEmbed = new Discord.EmbedBuilder()
                            .setColor(config.colours.secondary)
                            .setTitle('**To close the ticket, please press the button.**')
                            .setTimestamp()
                        let row = new Discord.ActionRowBuilder()
                            .addComponents(linkHelpButton)
                        let closerow = new Discord.ActionRowBuilder()
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