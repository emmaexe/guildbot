const { SlashCommandBuilder } = require('@discordjs/builders');
const Discord = require('discord.js')
const config = require('../config.json')
const mongo = require('mongodb');
const MongoClient = new mongo.MongoClient(process.env.MONGO_URL)

module.exports = {
    help: false,
    data: new SlashCommandBuilder()
        .setName('summon')
        .setDescription(`Summons an object.`)
        .addSubcommand(command => command
            .setName('menu')
            .setDescription('Summon a dropdown menu')
            .addStringOption(option => {
                option.setName('object').setDescription('Select and object you would like to summon.').setRequired(true)
                for (let i = 0;i<config.selectMenus.length;i++) {
                    option.addChoices({name: config.selectMenus[i].description, value: config.selectMenus[i].name})
                }
                return option;
                }
            )
        )
        .addSubcommand(command => command
            .setName('kickwave')
            .setDescription('Summons an embed that calculates a kickwave.')
            .addBooleanOption(option => option
                .setName('ephemeral')
                .setDescription('If the reply should be ephemeral or not.')
                .setRequired(true)
            )
            .addIntegerOption(option => option
                .setName('count')
                .setDescription('Amount of users to consider (max 25).')
                .setRequired(true)
            )
        )
        .addSubcommand(command => command
            .setName('ticket-button')
            .setDescription('Summons an empty message with an embedded button for opening tickets.')
        )
        ,
    async execute(client, interaction) {
        if (interaction.options.getSubcommand() == 'menu') {
            let menuConfig = config.selectMenus.find(menu => menu.name === interaction.options.getString('object'));
            const menu = new Discord.MessageSelectMenu()
                .setCustomId(menuConfig.name)
                .setPlaceholder(menuConfig.placeholder)
                .setOptions(menuConfig.options)
                .setMaxValues(menuConfig.maxValues)
                .setMinValues(menuConfig.minValues)
                .setDisabled(menuConfig.disabled)
            const row = new Discord.MessageActionRow()
                .addComponents(menu)
            interaction.channel.send({content: "​", components: [row]}) //ZERO-WIDTH SPACE
            interaction.reply({content: "Object summoned successfully.", ephemeral: true})
        } else if (interaction.options.getSubcommand() == 'kickwave') {
            //Calculate players who contributed the least in the last 7 days.
            await MongoClient.connect()
            const db = MongoClient.db()
            db.collection('hypixel-api-data').findOne({ sid: "guild-leaderboard-data" }, async function(err, res) {
                if (err) throw err;
                if (res == null) {
                    interaction.reply({content:"You can't do this now. Please try again later.", ephemeral: true})
                    MongoClient.close()
                } else {
                    let lastUpdateTimestamp = res.timestamp;
                    let nowTimestamp = Date.now()
                    let totalSeconds = ((nowTimestamp-lastUpdateTimestamp) / 1000);
                    totalSeconds %= 86400; totalSeconds %= 3600;
                    let minutes = Math.floor(totalSeconds / 60);
                    let seconds = Math.floor(totalSeconds % 60);
                    let embed = new Discord.MessageEmbed()
                        .setTitle(`Kickwave calculation`)
                        .setColor(config.colours.secondary)
                        .setFooter({text: `Data last updated ${minutes}min ${seconds}sec ago.`})
                    content = "```json\n[\n"
                    let leaderBoardData = res.data
                    let arrData = Object.entries(leaderBoardData)
                    arrData.sort(function (a, b) {
                        return a[1].total - b[1].total;
                    });
                    let count = interaction.options.getInteger('count')
                    if (count > 25) count = 25;
                    if (count > arrData.length) count = arrData.length;
                    for (let i = 0;i<count;i++) {
                        let userData = arrData[i];
                        embed.addField(`**${userData[1].rankName}** - *${userData[0]}*`, `Total: *${userData[1].total.toLocaleString("en")} exp*\nAverage daily: *${((Math.floor(userData[1].avg*100))/100).toLocaleString("en")} exp*`, true)
                        if (i+1<count) {content+=`"${userData[0]}",\n`} else {content+=`"${userData[0]}"\n]`}
                    }
                    content+="\n```"
                    interaction.reply({ephemeral: interaction.options.getBoolean('ephemeral'), embeds: [embed], content: content}).then(()=>{
                        MongoClient.close()
                    })
                }    
            })
        } else if (interaction.options.getSubcommand() == 'ticket-button') {
            if (config.tickets.enabled) {
                let button = new Discord.MessageButton()
                    .setStyle(2)
                    .setEmoji('🎫')
                    .setCustomId('open_ticket')
                const row = new Discord.MessageActionRow()
                    .addComponents(button)
                interaction.channel.send({content: "​", components: [row]}) //ZERO-WIDTH SPACE
                interaction.reply({content: "Object summoned successfully.", ephemeral: true})
            } else {
                interaction.reply({content: "The ticket system is disabled.", ephemeral: true})
            }
        }
    },
};