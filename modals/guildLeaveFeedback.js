const Discord = require('discord.js')
const config = require('../config.json')
require('dotenv').config()
const mongo = require('mongodb')
const MongoClient = new mongo.MongoClient(process.env.MONGO_URL)

module.exports = {
    async execute(client, interaction) {
        let guild = await client.guilds.fetch(config.discordGuildId);
        await guild.channels.fetch(config.channels.logChannelId).then(async channel => {
            let cshort = config.modals.guildLeaveFeedback.shortQuestion, clong = config.modals.guildLeaveFeedback.longQuestion;
            let textInputShort = await interaction.fields.getTextInputValue("textinputshort")
            let textInputLong = await interaction.fields.getTextInputValue("textinputlong")
            let embed = new Discord.MessageEmbed()
                .setTitle(`${config.emoji.log} LOG\n\nGuild leave feedback\n\`\`@${interaction.user.tag}\`\``)
                .setThumbnail(interaction.user.avatarURL())
                .setColor(config.colours.main)
                .setFooter({text:`id: ${interaction.user.id}`})
            if (textInputShort != undefined && textInputShort != "") { embed.addField(cshort.text, textInputShort) }
            if (textInputLong != undefined && textInputLong != "") { embed.addField(clong.text, textInputLong) }
            if ((textInputShort != undefined && textInputShort != "") || (textInputLong != undefined && textInputLong != "")) {
                channel.send({embeds:[embed]})
                /*
                let editembed = new Discord.MessageEmbed()
                    .setThumbnail(guild.iconURL())
                    .setColor(config.colours.main)
                    .setTitle(`**${guild.name}**`)
                    .addField(`**Thank you for your feedback.**`, `The form is now closed.`)
                await interaction.message.edit({embeds:[editembed],components:[]})
                */
                await interaction.reply({content: "**Thank you for your feedback. Your reply was submitted.**", ephemeral: true})
            } else {
                await interaction.reply({content: "**An empty reply cannot be submitted.**", ephemeral: true})
            }
        })
    }
}