const Discord = require('discord.js')
const config = require('../config.json')
const functions = require('../functions.js')

module.exports = {
    help: true,
    data: new Discord.SlashCommandBuilder()
        .setName('ping')
        .setDescription(`View the bot's latency.`),
    async execute(client, interaction) {
        await interaction.deferReply()
        let aembed = new Discord.EmbedBuilder()
            .setColor(config.colours.secondary)
            .setTimestamp()
            .addFields([
                {name: "**Ping**", value: `Please wait, calculating ping...`}
            ])
        await interaction.editReply({embeds: [aembed], allowedMentions: {repliedUser: false}, fetchReply: true})
            .then(async (message) => {
                let messageTimestamp = message.createdTimestamp
                let interactionTimestamp = await functions.getTimestampFromID(interaction.id)
                let embed = new Discord.EmbedBuilder()
                    .setColor(config.colours.secondary)
                    .setTimestamp()
                    .addFields([{name: "**Ping**", value: `${Math.round(messageTimestamp) - Math.round(interactionTimestamp)} ms`}])
                interaction.editReply({embeds: [embed]})
            })
    },
};