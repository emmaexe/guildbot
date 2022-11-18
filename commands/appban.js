const {
    SlashCommandBuilder
} = require('@discordjs/builders');
const Discord = require('discord.js')
const config = require('../config.json')
require('dotenv').config()
const mongo = require('mongodb')
const MongoClient = new mongo.MongoClient(process.env.MONGO_URL)
const functions = require('../functions.js')
const server = require('../server.js')

module.exports = {
    help: false,
    data: new SlashCommandBuilder()
        .setName('appban')
        .setDescription(`Ban a person from submitting guild applications.`)
        .addSubcommand(subcommand => subcommand
            .setName('add')
            .setDescription('Add an application ban.')
            .addUserOption(option => option
                .setName('target')
                .setDescription('The person you want to ban.')
                .setRequired(true)
                )
            .addStringOption(option => option
                .setName('reason')
                .setDescription('A reason for the punishment.')
                .setRequired(true)
                )
            .addStringOption(option => option
                .setName('time')
                .setDescription('Amount of time to ban the person for.')
                .addChoices({name:"30m", value:"1800"}, {name:"1h", value:"3600"}, {name:"12h", value:"43200"}, {name:"1d", value:"86400"}, {name:"2d", value:"172800"}, {name:"4d", value:"345600"}, {name:"1W", value:"604800"}, {name:"2W", value:"1209600"}, {name:"1M", value:"2419200"}, {name:"6M", value:"14515200"}, {name:"1Y", value:"31556952"}, {name:"50Y", value:"1577847600"})
                .setRequired(true)
                )
            .addBooleanOption(option => option
                .setName('silent')
                .setDescription('Defines if this operation should be executed silently.')
                .setRequired(true)
                )
            .addIntegerOption(option => option
                .setName('customtime')
                .setDescription('A custom ban length, in HOURS. Will override the time option.')
                )
            )
        .addSubcommand(subcommand => subcommand
            .setName('list')
            .setDescription('Show the currently active punishment and the user\'s punishment history.')
            .addUserOption(option => option
                .setName('target')
                .setDescription('The person whose punishments you want to list.')
                .setRequired(true)
                )
            .addBooleanOption(option => option
                .setName('silent')
                .setDescription('Defines if this operation should be executed silently.')
                .setRequired(true)
                )
            )
        .addSubcommand(subcommand => subcommand
            .setName('remove')
            .setDescription('Remove the user\'s currently active punishment.')
            .addUserOption(option => option
                .setName('target')
                .setDescription('The person whose punishment you want to remove.')
                .setRequired(true)
                )
            .addBooleanOption(option => option
                .setName('silent')
                .setDescription('Defines if this operation should be executed silently.')
                .setRequired(true)
                )
            )
        ,
    async execute(client, interaction) {
        if (interaction.options.getSubcommand() == "add") {
            let ephemeralValue = interaction.options.getBoolean('silent')
            let timeNow = Math.round(Date.now()/1000)
            let reason = interaction.options.getString('reason')
            let target = interaction.options.getUser('target')
            let customtime = interaction.options.getInteger('customtime')
            let time; if (customtime == undefined) {time = parseInt(interaction.options.getString('time'))} else {time = 3600*customtime}
            if (isNaN(time)) {
                interaction.reply({content: "Please select/enter a valid ban length.", ephemeral: true})
            } else {
                let endtime = Math.round(timeNow+time);
                await MongoClient.connect()
                let db = MongoClient.db()
                let res = await db.collection('guild_application_bans').findOne({ discord_id: target.id })
                if (res == undefined) {
                    await db.collection('guild_application_bans').insertOne({ discord_id: target.id, discord_tag: target.tag, start_timestamp: timeNow, end_timestamp: endtime, length: time, reason: reason, admin: {discord_id: interaction.user.id, discord_tag: interaction.user.tag} })
                    await MongoClient.close()
                    let embed = new Discord.MessageEmbed()
                        .setColor(config.colours.success)
                        .setTimestamp()
                        .setThumbnail(target.displayAvatarURL())
                        .setTitle(`New punishment added.`)
                        .addField(`New punishment data:`, `**Target:** *<@${target.id}> (${target.tag})*\n**Target ID:** *${target.id}*\n**Punishment given by:** *<@${interaction.user.id}> (${interaction.user.tag}, ${interaction.user.id})*\n**Reason for punishment:** *${reason}*\n**Punishment ends:** *<t:${endtime}:R> (<t:${endtime}:F>)*`)
                    let logembed = new Discord.MessageEmbed()
                        .setColor(config.colours.main)
                        .setTimestamp()
                        .setThumbnail(target.displayAvatarURL())
                        .setTitle(`${config.emoji.log} LOG`)
                        .addField(`New punishment added:`, `**Target:** *<@${target.id}> (${target.tag})*\n**Target ID:** *${target.id}*\n**Punishment given by:** *<@${interaction.user.id}> (${interaction.user.tag}, ${interaction.user.id})*\n**Reason for punishment:** *${reason}*\n**Punishment ends:** *<t:${endtime}:R> (<t:${endtime}:F>)*`)
                    let logchannel = await client.channels.fetch(config.channels.logChannelId)
                    logchannel.send({embeds: [logembed]})
                    interaction.reply({embeds: [embed], ephemeral: ephemeralValue})
                } else if (res.end_timestamp < endtime) {
                    let historyFetch = await db.collection('guild_application_bans_history').findOne({ discord_id: target.id })
                    let historyArray;
                    if (historyFetch != undefined) {historyArray = historyFetch.data;} else {historyArray = []}
                    historyArray.unshift(res);
                    historyArray.slice(0, 24)
                    if (historyFetch == undefined) {
                        await db.collection('guild_application_bans_history').insertOne({ discord_id: target.id, data: historyArray })
                    } else {
                        await db.collection('guild_application_bans_history').updateOne({ discord_id: target.id }, { $set: { discord_id: target.id, data: historyArray }})
                    }
                    await db.collection('guild_application_bans').updateOne({ discord_id: target.id }, { $set: { discord_id: target.id, discord_tag: target.tag, start_timestamp: timeNow, end_timestamp: endtime, length: time, reason: reason, admin: {discord_id: interaction.user.id, discord_tag: interaction.user.tag} } })
                    await MongoClient.close()
                    let embed = new Discord.MessageEmbed()
                        .setColor(config.colours.success)
                        .setTimestamp()
                        .setThumbnail(target.displayAvatarURL())
                        .setTitle(`Old punishment overridden.`)
                        .addField(`Old punishment data:`, `**Target:** *<@${res.discord_id}> (${res.discord_tag})*\n**Target ID:** *${res.discord_id}*\n**Punishment given by:** *<@${res.admin.discord_id}> (${res.admin.discord_tag}, ${res.admin.discord_id})*\n**Reason for punishment:** *${res.reason}*\n**Punishment ends:** *<t:${res.end_timestamp}:R> (<t:${res.end_timestamp}:F>)*`)
                        .addField(`New punishment data:`, `**Target:** *<@${target.id}> (${target.tag})*\n**Target ID:** *${target.id}*\n**Punishment given by:** *<@${interaction.user.id}> (${interaction.user.tag}, ${interaction.user.id})*\n**Reason for punishment:** *${reason}*\n**Punishment ends:** *<t:${endtime}:R> (<t:${endtime}:F>)*`)
                    let logembed = new Discord.MessageEmbed()
                        .setColor(config.colours.main)
                        .setTimestamp()
                        .setThumbnail(target.displayAvatarURL())
                        .setTitle(`${config.emoji.log} LOG`)
                        .addField(`New punishment added:`, `**Target:** *<@${target.id}> (${target.tag})*\n**Target ID:** *${target.id}*\n**Punishment given by:** *<@${interaction.user.id}> (${interaction.user.tag}, ${interaction.user.id})*\n**Reason for punishment:** *${reason}*\n**Punishment ends:** *<t:${endtime}:R> (<t:${endtime}:F>)*`)
                        .addField(`Old punishment removed:`, `**Target:** *<@${res.discord_id}> (${res.discord_tag})*\n**Target ID:** *${res.discord_id}*\n**Punishment given by:** *<@${res.admin.discord_id}> (${res.admin.discord_tag}, ${res.admin.discord_id})*\n**Reason for punishment:** *${res.reason}*\n**Punishment ends:** *<t:${res.end_timestamp}:R> (<t:${res.end_timestamp}:F>)*`)
                    let logchannel = await client.channels.fetch(config.channels.logChannelId)
                    logchannel.send({embeds: [logembed]})
                    interaction.reply({embeds: [embed], ephemeral: ephemeralValue})
                } else {
                    await MongoClient.close()
                    let embed = new Discord.MessageEmbed()
                        .setColor(config.colours.error)
                        .setTimestamp()
                        .setTitle("Error. Could not add punishment.")
                        .setDescription(`**New punishment could not be added since it ends earlier than an existing punishment. To add the new punishment, adjust its length accordingly or remove the old one.**\n\n**Old punishment ends:** *<t:${res.end_timestamp}:R> (<t:${res.end_timestamp}:F>)*\n**New punishment ends:** *<t:${endtime}:R> (<t:${endtime}:F>)*`)
                    interaction.reply({embeds: [embed], ephemeral: true})
                }
            }
        } else if (interaction.options.getSubcommand() == "list") {
            let timeNow = Math.round(Date.now()/1000)
            let ephemeralValue = interaction.options.getBoolean('silent')
            let target = interaction.options.getUser('target')
            let embed = new Discord.MessageEmbed()
                .setTimestamp()
                .setColor(config.colours.main)
                .setThumbnail(target.displayAvatarURL())
                .setTitle(`Punishment history for ${target.tag} (${target.id})`)
            await MongoClient.connect()
            let db = MongoClient.db()
            let currentFetch = await db.collection('guild_application_bans').findOne({ discord_id: target.id })
            let historyFetch = await db.collection('guild_application_bans_history').findOne({ discord_id: target.id })
            MongoClient.close()
            let historyArray;
            if (historyFetch != undefined) {historyArray = historyFetch.data;} else {historyArray = []}
            if (currentFetch != undefined) {
                if (currentFetch.end_timestamp<timeNow) {
                    historyArray.unshift(currentFetch);
                    currentFetch = undefined;
                    historyArray.slice(0, 24)
                }
            }
            if (currentFetch == undefined) {
                embed.addField(`**Currently active punishment:**`, `*None.*`)
            } else {
                embed.addField(`**Currently active punishment:**`, `Target: *<@${currentFetch.discord_id}> (${currentFetch.discord_tag})*\nTarget ID: *${currentFetch.discord_id}*\nPunishment given by: *<@${currentFetch.admin.discord_id}> (${currentFetch.admin.discord_tag}, ${currentFetch.admin.discord_id})*\nReason for punishment: *${currentFetch.reason}*\nPunishment ends: *<t:${currentFetch.end_timestamp}:R> (<t:${currentFetch.end_timestamp}:F>)*`)
            }
            if (historyArray.length == 0) {
                embed.addField(`**Punishment history (expired, removed or overridden punishments, higher is older):**`, `*Empty.*`)
            } else {
                for (let i = 0;i<historyArray.length;i++) {
                    let res = historyArray[i]
                    if (i == 0) {
                        embed.addField(`**Punishment history (expired, removed or overridden punishments, higher is older):**\n\nPunishment #${i+1}`, `Target: *<@${res.discord_id}> (${res.discord_tag})*\nTarget ID: *${res.discord_id}*\nPunishment given by: *<@${res.admin.discord_id}> (${res.admin.discord_tag}, ${res.admin.discord_id})*\nReason for punishment: *${res.reason}*\nPunishment ends: *<t:${res.end_timestamp}:R> (<t:${res.end_timestamp}:F>)*`)
                    } else {
                        embed.addField(`Punishment #${i+1}`, `Target: *<@${res.discord_id}> (${res.discord_tag})*\nTarget ID: *${res.discord_id}*\nPunishment given by: *<@${res.admin.discord_id}> (${res.admin.discord_tag}, ${res.admin.discord_id})*\nReason for punishment: *${res.reason}*\nPunishment ends: *<t:${res.end_timestamp}:R> (<t:${res.end_timestamp}:F>)*`, true)
                    }
                }
            }
            interaction.reply({embeds: [embed], ephemeral: ephemeralValue})
        } else if (interaction.options.getSubcommand() == "remove") {
            let timeNow = Math.round(Date.now()/1000)
            let ephemeralValue = interaction.options.getBoolean('silent')
            let target = interaction.options.getUser('target')
            await MongoClient.connect()
            let db = MongoClient.db()
            let currentFetch = await db.collection('guild_application_bans').findOne({ discord_id: target.id })
            let historyFetch = await db.collection('guild_application_bans_history').findOne({ discord_id: target.id })
            if (currentFetch == undefined) {
                let embed = new Discord.MessageEmbed()
                    .setColor(config.colours.error)
                    .setTimestamp()
                    .setTitle("Error. Could not remove punishment.")
                    .setDescription(`**Punishment could not be removed since there is no currently active punishment.**`)
                interaction.reply({embeds: [embed], ephemeral: true})
            } else {
                if (currentFetch.end_timestamp < timeNow) {
                    let embed = new Discord.MessageEmbed()
                        .setColor(config.colours.error)
                        .setTimestamp()
                        .setTitle("Error. Could not remove punishment.")
                        .setDescription(`**There is no currently active punishment.**`)
                    interaction.reply({embeds: [embed], ephemeral: true})
                } else {
                    let historyArray;
                    if (historyFetch != undefined) {historyArray = historyFetch.data;} else {historyArray = []}
                    historyArray.unshift(currentFetch);
                    historyArray.slice(0, 24)
                    if (historyFetch == undefined) {
                        await db.collection('guild_application_bans_history').insertOne({ discord_id: target.id, data: historyArray })
                    } else {
                        await db.collection('guild_application_bans_history').updateOne({ discord_id: target.id }, { $set: { discord_id: target.id, data: historyArray }})
                    }
                    await db.collection('guild_application_bans').deleteOne({ discord_id: target.id })
                    await MongoClient.close()
                    let embed = new Discord.MessageEmbed()
                        .setColor(config.colours.success)
                        .setTimestamp()
                        .setThumbnail(target.displayAvatarURL())
                        .setTitle(`Punishment removed.`)
                        .addField(`Punishment data:`, `**Target:** *<@${currentFetch.discord_id}> (${currentFetch.discord_tag})*\n**Target ID:** *${currentFetch.discord_id}*\n**Punishment given by:** *<@${currentFetch.admin.discord_id}> (${currentFetch.admin.discord_tag}, ${currentFetch.admin.discord_id})*\n**Reason for punishment:** *${currentFetch.reason}*\n**Punishment ends:** *<t:${currentFetch.end_timestamp}:R> (<t:${currentFetch.end_timestamp}:F>)*`)
                    let logembed = new Discord.MessageEmbed()
                        .setColor(config.colours.main)
                        .setTimestamp()
                        .setThumbnail(target.displayAvatarURL())
                        .setTitle(`${config.emoji.log} LOG`)
                        .addField(`Punishment removed:`, `**Target:** *<@${currentFetch.discord_id}> (${currentFetch.discord_tag})*\n**Target ID:** *${currentFetch.discord_id}*\n**Punishment given by:** *<@${currentFetch.admin.discord_id}> (${currentFetch.admin.discord_tag}, ${currentFetch.admin.discord_id})*\n**Reason for punishment:** *${currentFetch.reason}*\n**Punishment ends:** *<t:${currentFetch.end_timestamp}:R> (<t:${currentFetch.end_timestamp}:F>)*`)
                        .addField(`Punishment removed by:`, `User: <@${interaction.user.id}>\nUser tag: ${interaction.user.tag}\nUser ID: ${interaction.user.id}`)
                    let logchannel = await client.channels.fetch(config.channels.logChannelId)
                    logchannel.send({embeds: [logembed]})
                    interaction.reply({embeds: [embed], ephemeral: ephemeralValue})
                }
            }
        }
    },
};

/*
CURRENT:
{
    "discord_id": string,
    "discord_tag": string,
    "start_timestamp": timestamp,
    "end_timestamp": timestamp,
    "length": timestamp,
    "reason": string
    "admin": {discord_id: string, discord_tag: string}
}
HISTORY:
[
    "discord_id": string,
    "data": array
]
*/