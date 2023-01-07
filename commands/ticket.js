const { SlashCommandBuilder } = require('@discordjs/builders');
const Discord = require('discord.js')
const config = require('../config.json')
const functions = require('../functions.js')
const mongo = require('mongodb');
const MongoClient = new mongo.MongoClient(process.env.MONGO_URL)

if (config.tickets.enabled) {
    module.exports = {
        help: false,
        data: new SlashCommandBuilder()
            .setName('ticket')
            .setDescription(`Manage the ticket you are currently viewing. Only works in ticket channels.`)
            .addSubcommand(command => command
                .setName('info')
                .setDescription('Fetch info about the ticket')
                .addBooleanOption(option => option
                    .setName('ephemeral')
                    .setDescription('Decides if the response should be ephemeral or not. (default: true)')
                    .setRequired(false)
                )
            )
            .addSubcommand(command => command
                .setName('close')
                .setDescription('Close the ticket')
            ),
        async execute(client, interaction) {
            if (interaction.options.getSubcommand() == 'info') {
                let channel = interaction.channel
                let ephemeral = interaction.options.getBoolean('ephemeral')
                if (ephemeral == undefined) {ephemeral=true}
                await MongoClient.connect()
                const db = MongoClient.db()
                db.collection('tickets').findOne({ sid: "ticket", channel_id: channel.id }, async function(err, ticket) {
                    if (err) throw err;
                    if (ticket != undefined) {
                        let embed = new Discord.MessageEmbed()
                            .setTitle('Ticket info')
                            .addField('**Ticket # ID: **', `${ticket.numid}`)
                            .addField('**Ticket opened by: **', `<@${ticket.user_id}> [${ticket.user_id}]`)
                            .addField('**Ticket opened on: **', `<t:${Math.round((await functions.getTimestampFromID(channel.id))/1000)}> [<t:${Math.round((await functions.getTimestampFromID(channel.id))/1000)}:R>]`)
                            .addField('**Ticket opened for reason: **', `${ticket.reason}`)
                            .addField('**Ticket channel: **', `<#${ticket.channel_id}> [${ticket.channel_id}]`)
                            .setColor(config.colours.main)
                            .setTimestamp()
                        await interaction.reply({embeds: [embed], ephemeral: ephemeral})
                    } else {
                        await interaction.reply({content: "**The ticket does not exist.\nUnable to fetch info about the ticket.**", ephemeral: true});
                        await MongoClient.close()
                    }
                })
            } else if (interaction.options.getSubcommand() == 'close') {
                let row = new Discord.MessageActionRow()
                let button = new Discord.MessageButton()
                    .setStyle(4)
                    .setEmoji('🔒')
                    .setLabel('Close ticket')
                    .setCustomId('close_ticket_confirm')
                row.addComponents(button)
                await interaction.reply({content: "**Please press the button to confirm you want to close the ticket.**", components: [row], ephemeral: true});
            }
        },
    };
}