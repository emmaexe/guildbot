const Discord = require('discord.js')
const fetch = require('node-fetch')
require('dotenv').config()
const config = require('../config.json')

module.exports = {
    async execute(client, interaction) {
        let message = interaction.message
        let passedData = JSON.parse((message.content).replace("||", "").replace("||", ""))
        let strData = await fetch(`https://api.hypixel.net/player?key=${process.env.APIKEY}&uuid=${passedData.uuid}`)
        let data = await strData.json()
        let mcVer = data.player.mcVersionRp
        let karma = data.player.karma
        let firstLogin = new Date(data.player.firstLogin)
        let lastLogin;
        if (data.player.lastLogin) {
            lastLogin = new Date(data.player.lastLogin)
        } else {
            lastLogin = undefined
        }   
        let lastSeen;
        if (data.player.lastLogout) {
            lastSeen = new Date(data.player.lastLogout)
        } else {
            lastSeen = undefined
        }
        let name = data.player.displayname
        let exp = data.player.networkExp
        networkLevel = Math.round((Math.sqrt((2 * parseInt(exp)) + 30625) / 50) - 2.5)
        networkLevelRaw = (Math.sqrt((2 * parseInt(exp)) + 30625) / 50) - 2.5
        let rank = "";
        if (data.player.monthlyPackageRank == "SUPERSTAR") {rank="MVP++"} else if (data.player.newPackageRank == "MVP_PLUS") {rank="MVP+"} else if (data.player.newPackageRank == "MVP") {rank="MVP"} else if (data.player.newPackageRank == "VIP_PLUS") {rank="VIP+"} else if (data.player.newPackageRank == "VIP") {rank="VIP"} else if (data.player.newPackageRank == "MVP") {rank="MVP"}
        let loginInline = false; if(lastLogin || lastSeen) loginInline = true;
        let embed = new Discord.EmbedBuilder()
            .setColor(config.colours.main)
            .setTimestamp()
            .setTitle(`**${rank}** ${name} - User data`)
            .setFooter({text: `uuid: ${passedData.uuid}`})
            .addFields([
                {name: "Minecraft version: ", value: `${mcVer}`},
                {name: "Network level: ", value: `${networkLevel}`},
                {name: "Karma: ", value: `${karma.toLocaleString("en")}`},
                {name: "First login: ", value: `${firstLogin}`, inline: loginInline}
            ])
            if (lastLogin) {embed.addFields([{name: "Last login: ", value: `${lastLogin}`, inline: true}])}
            if (lastSeen) {embed.addFields([{name: "Last seen: ", value: `${lastSeen}`, inline: true}])}
        let memberButton = new Discord.ButtonBuilder()
            .setStyle(Discord.ButtonStyle.Secondary)
            .setLabel('Guild member data')
            .setCustomId('guildcommand_member')
        let userButton = new Discord.ButtonBuilder()
            .setStyle(Discord.ButtonStyle.Secondary)
            .setLabel('User data')
            .setCustomId('guildcommand_user')
            .setDisabled(true)
        let row = new Discord.ActionRowBuilder()
            .addComponents(memberButton, userButton)
        interaction.update({
            content: message.content,
            embeds: [embed],
            components: [row]
        })
    }
}