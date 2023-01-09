const Discord = require('discord.js')
const config = require('../config.json')
const fetch = require('node-fetch')
require('dotenv').config()
const mongo = require('mongodb')
const MongoClient = new mongo.MongoClient(process.env.MONGO_URL)

module.exports = {
    help: true,
    cooldown: 2000,
    data: new Discord.SlashCommandBuilder()
        .setName('guild')
        .setDescription(`Access data about the guild and its members.`)
        .addSubcommand(subcommand => subcommand
            .setName('checkuser')
            .setDescription("Fetch data about a user.")
            .addUserOption(option => option
                .setName('target')
                .setDescription('Discord username')
                .setRequired(true)
            )
        )
        .addSubcommand(subcommand => subcommand
            .setName('leaderboard')
            .setDescription("Fetch the guild's exp leaderboard.")
        )
        .addSubcommand(subcommand => subcommand
            .setName('info')
            .setDescription("General guild statistics and information.")
        ),
    async execute(client, interaction) {
        if (interaction.options.getSubcommand() == 'checkuser') {
            let discordUser = interaction.options.getUser('target')
            await MongoClient.connect()
            const db = MongoClient.db()
            let res = await db.collection('minecraft-accounts').findOne({ discord_id: discordUser.id })
            MongoClient.close()
            let inGameName;
            if (res == undefined) {
                inGameName = undefined;
            } else {
                inGameName = res.minecraft_name;
            }
            if (inGameName == undefined) return interaction.reply({
                content: "**There was an error while executing this command!**\n*You must enter a discord user with a valid linked minecraft account (see the **/link** command)*",
                ephemeral: true
            })
            let hGuild;
            let data = await fetch(`https://api.hypixel.net/guild?key=${process.env.APIKEY}&id=${config.hypixelGuildId}`)
            try {
                hGuild = await data.json()
            } catch (err) {
                console.error(err)
            }
            if (hGuild.success) {
                hGuild.guild.members.forEach(async member => {
                    let nameData = await fetch(`https://minecraft-api.com/api/pseudo/${member.uuid}/json`)
                    let mun = undefined;
                    try{mun = await nameData.json()}catch(err){console.error}
                    if (mun) {
                        if (mun.pseudo == inGameName) {
                            dates = Object.keys(member.expHistory)
                            let dateField = ``
                            dates.forEach((date) => {
                                dateField += `**${date} - **${member.expHistory[date].toLocaleString("en")} exp\n`
                            })
                            let strData = await fetch(`https://api.hypixel.net/player?key=${process.env.APIKEY}&uuid=${member.uuid}`)
                            data = await strData.json()
                            if (data.success != true) {
                                console.error(data);
                                return interaction.reply({
                                    content: `**There was an error while executing this command!**\n*No additional information available.*`,
                                    ephemeral: true
                                })
                            }
                            let rank = "";
                            if (data.player.monthlyPackageRank == "SUPERSTAR") {
                                rank = "MVP++"
                            } else if (data.player.newPackageRank == "MVP_PLUS") {
                                rank = "MVP+"
                            } else if (data.player.newPackageRank == "MVP") {
                                rank = "MVP"
                            } else if (data.player.newPackageRank == "VIP_PLUS") {
                                rank = "VIP+"
                            } else if (data.player.newPackageRank == "VIP") {
                                rank = "VIP"
                            } else if (data.player.newPackageRank == "MVP") {
                                rank = "MVP"
                            }
                            let embed = new Discord.EmbedBuilder()
                                .setColor(config.colours.main)
                                .setTimestamp()
                                .setTitle(`**${rank}** ${inGameName} - Guild member data`)
                                .setFooter({text: `uuid: ${member.uuid}`})
                                .addFields([
                                    {name: "Rank", value: `${member.rank}`},
                                    {name: "Joined guild", value: `${new Date(member.joined)}`},
                                    {name: "Exp history", value: dateField}
                                ])
                            let memberButton = new Discord.ButtonBuilder()
                                .setStyle(Discord.ButtonStyle.Secondary)
                                .setLabel('Guild member data')
                                .setCustomId('guildcommand_member')
                                .setDisabled(true)
                            let userButton = new Discord.ButtonBuilder()
                                .setStyle(Discord.ButtonStyle.Secondary)
                                .setLabel('User data')
                                .setCustomId('guildcommand_user')
                            let row = new Discord.ActionRowBuilder()
                                .addComponents(memberButton, userButton)
                            interaction.reply({
                                content: `||{"uuid":"${member.uuid}","tag":"${discordUser.tag}"}||`,
                                embeds: [embed],
                                components: [row]
                            })
                        }
                    }
                })
            } else {
                console.error(hGuoild)
            }
        } else if (interaction.options.getSubcommand() == 'leaderboard') {
            await interaction.deferReply()
            await MongoClient.connect()
            const db = MongoClient.db()
            let res = await db.collection('hypixel-api-data').findOne({ sid: "guild-leaderboard-data" })
            await MongoClient.close()
            let leaderBoardData = res.data;
            let arrData = Object.entries(leaderBoardData)
            arrData.sort(function (a, b) {
                return b[1].total - a[1].total;
            });
            let embed = new Discord.EmbedBuilder()
                .setTimestamp()
                .setColor(config.colours.main)
                .setTitle("Weekly guild exp leaderboard")
            ti = 5
            if (arrData.length < 5) ti = arrData.length
            for (let i = 0; i < ti; i++) {
                let userData = arrData[i];
                embed.addFields([{name: `*#${i+1}* **${userData[1].rankName}** ${userData[0]}`, value: `Total: *${userData[1].total.toLocaleString("en")} exp*\nAverage daily: *${((Math.floor(userData[1].avg*100))/100).toLocaleString("en")} exp*`}])
            }
            interaction.editReply({
                embeds: [embed],
                allowedMentions: {
                    repliedUser: false
                }
            })
        } else if (interaction.options.getSubcommand() == 'info') {
            function capitalizeWords(str) {
                return str.replace(/\w\S*/g, function (text) {
                    return text.charAt(0).toUpperCase() + text.substr(1).toLowerCase();
                });
            }
            let strData = await fetch(`https://api.hypixel.net/guild?key=${process.env.APIKEY}&id=${config.hypixelGuildId}`)
            let data = await strData.json()
            if (data.success != true) {
                console.error(data);
                return interaction.reply({
                    content: `**There was an error while executing this command!**\n*No additional information available.*`,
                    ephemeral: true
                })
            }
            let level;
            if (data.guild.exp < 100000) {
                level = 0;
            } else if (data.guild.exp < 250000) {
                level = 1;
            } else if (data.guild.exp < 500000) {
                level = 2;
            } else if (data.guild.exp < 1000000) {
                level = 3;
            } else if (data.guild.exp < 1750000) {
                level = 4
            } else if (data.guild.exp < 2750000) {
                level = 5;
            } else if (data.guild.exp < 4000000) {
                level = 6;
            } else if (data.guild.exp < 5500000) {
                level = 7;
            } else if (data.guild.exp < 7500000) {
                level = 8
            } else if (data.guild.exp >= 7500000) {
                if (data.guild.exp < 15000000) {
                    level = Math.floor((data.guild.exp - 7500000) / 2500000) + 9
                } else {
                    level = Math.floor((data.guild.exp - 15000000) / 3000000) + 12
                }
            }
            let games = data.guild.preferredGames.join(", ");
            games = games.replace("_", " ");
            games = capitalizeWords(games);
            let joinable;
            if (data.guild.joinable) {
                joinable = "Yes"
            } else {
                joinable = "No"
            }
            let publiclyListed;
            if (data.guild.publiclyListed) {
                publiclyListed = "Yes"
            } else {
                publiclyListed = "No"
            }
            let mostPlayed = Object.entries(data.guild.guildExpByGameType)
            mostPlayed.sort(function (a, b) {
                return b[1] - a[1];
            });
            let mostPlayedStr = ""
            for (let i = 0; i < 10; i++) {
                mostPlayedStr += capitalizeWords(mostPlayed[i][0].replace("_", " "))
                if (i != 9) {
                    mostPlayedStr += ", "
                }
            }
            let gtag = ""
            if (data.guild.tag) gtag = `**[${data.guild.tag}]** `
            let embed = new Discord.EmbedBuilder()
                .setTitle(`${gtag}${data.guild.name}`)
                .setFooter({text: `uuid: ${data.guild._id}`})
                .setTimestamp()
                .setColor(config.colours.main)
                .addFields([
                    {name: `Created on:`, value: `${new Date(data.guild.created)}`},
                    {name: `Guild level:`, value: `${level}`},
                    {name: `Guild members:`, value: `${data.guild.members.length}`},
                    {name: `Guild coins:`, value: `${data.guild.coins.toLocaleString("en")} coins\n(Max ${data.guild.coinsEver.toLocaleString("en")})`},
                    {name: `Description:`, value: `${data.guild.description}`},
                    {name: `Publicly listed / Joinable:`, value: `${publiclyListed} / ${joinable}`},
                    {name: `Preferred games:`, value: `${games}`},
                    {name: `Top 10 most played games:`, value: `${mostPlayedStr}`}
                ])
            interaction.reply({
                embeds: [embed]
            })
        }
    },
};