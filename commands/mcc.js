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
        .setName('mcc')
        .setDescription(`Control your ChatBridge minecraft account from discord.`)
        .addSubcommand(command => command
            .setName('ginvite')
            .setDescription('Invite a player to the guild.')
            .addStringOption(option => option
                .setName('name')
                .setDescription('The username of the player you wish to invite.')
                .setRequired(true)
                )
        )
        .addSubcommand(command => command
            .setName('gkick')
            .setDescription('Kick a player from the guild.')
            .addStringOption(option => option
                .setName('name')
                .setDescription('The username of the player you wish to kick.')
                .setRequired(true)
                )
            .addStringOption(option => option
                .setName('reason')
                .setDescription('The reason for kicking the player.')
                .setRequired(true)
                )
        )
        .addSubcommand(command => command
            .setName('rawcommand')
            .setDescription('Send a custom command as the bot to the minecraft server.')
            .addStringOption(option => option
                .setName('command')
                .setDescription('The full command, without the \"/\" at the beginning.')
                .setRequired(true)
                )
        ),
    async execute(client, interaction) {
        await interaction.deferReply()
        let mclient = await server.mclient;
        if (!config.chatbridge.enabled) return interaction.editReply({content:"**The chatbridge feature of this bot must be enabled in the configuration file before this command can be used.**", ephemeral: true})
        if (interaction.options.getSubcommand() == "ginvite") {
            let name = interaction.options.getString('name')
            mclient.chat(`/g invite ${name}`)
            interaction.editReply({content: `Sent **${name}** an invite to the guild.`, ephemeral: true})
        } else if (interaction.options.getSubcommand() == "gkick") {
            let name = interaction.options.getString('name')
            let reason = interaction.options.getString('reason')
            mclient.chat(`/g kick ${name} ${reason}`)
            interaction.editReply({content: `Kicked **${name}** from the guild.`, ephemeral: true})
        } else if (interaction.options.getSubcommand() == "rawcommand") {
            let command = interaction.options.getString('command')
            mclient.chat(`/${command}`)
            interaction.editReply({content: `Sent \"**/${command}**\" to the server.`, ephemeral: true})
        }
    },
};