const Discord = require('discord.js')
require('dotenv').config()
const fetch = require('node-fetch')
const mongo = require('mongodb')
const MongoClient = new mongo.MongoClient(process.env.MONGO_URL)
const config = require('../config.json')
const functions = require('../functions.js')
const server = require('../server.js')

module.exports = {
    async execute(client, interaction) {
        let message = interaction.message
        let userData;
        let userID;
        await MongoClient.connect()
        const db = MongoClient.db()

        let timeNow = Math.round(Date.now()/1000)
        let appban = await db.collection('guild_application_bans').findOne({ discord_id: interaction.user.id })
        if (appban != undefined) {
            if (appban.end_timestamp > timeNow) {
                let embed = new Discord.MessageEmbed()
                    .setColor(config.colours.error)
                    .setTimestamp()
                    .setThumbnail(interaction.user.displayAvatarURL())
                    .setTitle(`**Error. Could not complete guild application.**`)
                    .addField(`**You are banned from submitting guild applications.**`, `Ban date: *<t:${appban.start_timestamp}:R> (<t:${appban.start_timestamp}:F>)*\nReason for ban: *${appban.reason}*\nBan ends: *<t:${appban.end_timestamp}:R> (<t:${appban.end_timestamp}:F>)*`)
                return interaction.update({ embeds: [embed], components: [] })
            }
        }

        db.collection('minecraft-accounts').findOne({discord_id: interaction.user.id}, async function (err, res) {
            if (err) throw err;
            if (res == undefined) {
                userData = undefined;
            } else {
                userData = res.minecraft_name
                userID = res.minecraft_uuid
            }
            if (userData == undefined) {
                let undefinedEmbed = new Discord.MessageEmbed()
                    .setColor(config.colours.error)
                    .setTimestamp()
                    .addField(`${config.emoji.error} Minecraft account not linked!`, "Your minecraft account is not linked to your discord account. You can fix this by running the **/link update** command.")
                let linkHelpButton = new Discord.MessageButton()
                    .setStyle(2)
                    .setEmoji('ℹ️')
                    .setLabel('Learn more.')
                    .setCustomId('link_help_button')
                let row = new Discord.MessageActionRow()
                    .addComponents(linkHelpButton)
                await interaction.update({
                    embeds: [undefinedEmbed],
                    components: [row]
                });
                await MongoClient.close()
            } else {
                await MongoClient.close()
                let data_raw = await fetch(`https://api.hypixel.net/player?key=${process.env.APIKEY}&uuid=${userID}`)
                data = await data_raw.json()
                if (data.success == true) {
                    networkLevelRaw = functions.hypixelUtil.networkLevelFromExp(data.player.networkExp)
                    networkLevel = Math.round(networkLevelRaw)
                    if (networkLevel >= config.guildAppReqs.minNetworkLevel) {
                        let sucessembed = new Discord.MessageEmbed()
                            .setColor(config.colours.main)
                            .setTimestamp()
                            .addField('Your application was accepted.', 'Thank you.')
                            .addField(`${config.emoji.log} Warning:`, "Make sure to leave your current guild if you are in one, or we will not be able to send you an invitation.\nMake sure your guild invites are turned **on** in your privacy settings. You can view the settings inside the profile menu (Right click your head in slot 2 of your hotbar) from any lobby on the hypixel network.")
                        let helperPing=""
                        for (let i = 0;i<config.roles.helperRole.length;i++) {
                            helperPing+=`<@&${config.roles.helperRole[i]}>`
                        }
                        if (helperPing!="") {
                            //message.channel.send(helperPing)
                        }
                        if (config.chatbridge.enabled && config.chatbridge.autoInviteOnApp) {
                            const mclient = server.mclient;
                            mclient.chat(`/g invite ${userData}`)
                            sucessembed.addField(`AutoInvite is turned on.`, `The bot has attempted to send you an automatic invite. If you did not recieve it or missed it, you can reapply for another automatic invite if there are no staff available to invite you to the guild.`)
                        }
                        interaction.update({
                            embeds: [sucessembed],
                            components: []
                        });

                        const logembed = new Discord.MessageEmbed()
                            .setColor(config.colours.success)
                            .setTimestamp()
                            .setAuthor(interaction.user.tag)
                            .setThumbnail(interaction.user.displayAvatarURL())
                            .addField('**Successful application**', `**Questions 1-3 (requirements):**\nUser anwsered **YES**.\n**Linked IGN:**\n*${userData}*\n**Their network level:** ${networkLevelRaw}`)
                        channel = client.channels.cache.get(config.channels.appChannelId)
                        channel.send({
                            embeds: [logembed]
                        })

                        const queueembed = new Discord.MessageEmbed()
                            .setColor(config.colours.secondary)
                            .setTimestamp()
                            .addField(`**${userData}**`, `\`\`/g invite ${userData}\`\``)
                        let deletebutton = new Discord.MessageButton()
                            .setStyle(4)
                            .setLabel('Invite sent -> Delete from queue')
                            .setCustomId('delete_message')
                        let row = new Discord.MessageActionRow()
                            .addComponents(deletebutton)
                        queuechannel = client.channels.cache.get(config.channels.queueChannelId)
                        queuechannel.send({
                            embeds: [queueembed],
                            components: [row]
                        })
                        interaction.member.roles.add(config.roles.guildMemberRole)
                        functions.statistics.increaseGuildApplicationCount()
                    } else {
                        let nembed = new Discord.MessageEmbed()
                            .setColor(config.colours.main)
                            .setTimestamp()
                            .setTitle(`**We're sorry but you do not meet the requirements to join the guild.**\nRequired network level: ${config.guildAppReqs.minNetworkLevel}\nYour network level: ${networkLevelRaw}`)
                        interaction.update({
                            embeds: [nembed],
                            components: []
                        });
                        const logembed = new Discord.MessageEmbed()
                            .setColor(config.colours.error)
                            .setTimestamp()
                            .setAuthor(interaction.user.tag)
                            .setThumbnail(interaction.user.displayAvatarURL())
                            .addField('**Failed application**', `**User did not meet the network level ${config.guildAppReqs.minNetworkLevel} requirement.**\nTheir IGN: ${userData}\nTheir NW level: ${networkLevelRaw}`)
                        channel = client.channels.cache.get(config.channels.appChannelId)
                        channel.send({
                            embeds: [logembed]
                        })
                    }
                } else {
                    let embed = new Discord.MessageEmbed()
                        .setColor(config.colours.error)
                        .setTimestamp()
                        .setTitle(`${config.emoji.error} An error has occurred.`)
                        .addField(`**${data.cause}**`, `*This probably means the API key is invalid. Ping <@299265668522442752>.*`)
                    let msg = await message.reply({
                        embeds: [embed],
                        allowedMentions: {
                            repliedUser: false
                        }
                    })
                    setTimeout(() => {
                        msg.delete();
                        message.delete()
                    }, 15000);
                    let logembed = new Discord.MessageEmbed()
                        .setColor(config.colours.error)
                        .setTimestamp()
                        .setTitle(`${config.emoji.error} ERROR`)
                        .addField(`**Cause: **`, `A player ran a bot command and the Hypixel API key provided by the config file was invalid.`)
                    let logchannel = client.channels.cache.get(config.channels.logChannelId)
                    logchannel.send({
                        content: "<@299265668522442752> <@299265668522442752> <@299265668522442752>",
                        embeds: [logembed]
                    })
                }
            }
        })
    }
}