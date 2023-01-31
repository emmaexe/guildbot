const Discord = require('discord.js')
const config = require('../config/config.json')
const fetch = require('node-fetch')
require('dotenv').config({ path: '../config/.env' });
const mongo = require('mongodb')
const MongoClient = new mongo.MongoClient(process.env.MONGO_URL)

module.exports = {
    help: true,
    data: new Discord.SlashCommandBuilder()
        .setName('link')
        .setDescription(`Minecraft account linking system.`)
        .addSubcommand(subCommand => subCommand
            .setName('check')
            .setDescription('Check the status of someone\'s account link or your own.')
            .addUserOption(userOption => userOption
                .setName('target')
                .setDescription('Select the user.')
                .setRequired(true)
            )
        )
        .addSubcommand(subCommand => subCommand
            .setName('tutorial')
            .setDescription('Tutorial gif on how to link your minecraft account.')
        )
        .addSubcommand(subCommand => subCommand
            .setName('update')
            .setDescription('Update the link between your discord and minecraft accounts.')
            .addStringOption(stringOption => stringOption
                .setName('in-game-name')
                .setDescription('Your In-Game-Name.')
                .setRequired(true)
            )
        )

        ,
    async execute(client, interaction) {
        await interaction.deferReply()
        if (interaction.options.getSubcommand() == 'check') {
            await MongoClient.connect()
            const db = MongoClient.db()
            let user = interaction.options.getUser('target')
            db.collection('minecraft-accounts').findOne({ discord_id: user.id },function(err, res){
                if (err) throw err;
                let userData;
                if (res == undefined) {
                    userData = undefined;
                } else {
                    userData = res.minecraft_name;
                }
                let embed = new Discord.EmbedBuilder()
                    .setColor(config.colours.main)
                    .setTimestamp()
                    .setTitle(`${user.username}#${user.discriminator}`)
                if (userData == undefined) {
                    embed.addFields([{name: "This account is NOT linked!", value: `To link a minecraft account to a discord account, use the **/link update** command.`}])
                } else {
                    embed.addFields([{name: "This account is linked!", value: `**Minecraft account:** ${userData}`}])
                }
                interaction.editReply({
                    embeds: [embed],
                    allowedMentions: {
                        repliedUser: false
                    }
                })
                MongoClient.close()
            })
        } else if (interaction.options.getSubcommand() == 'tutorial') {
            interaction.editReply({
                files: [{
                    attachment: './discord_link_tutorial.gif',
                    name: 'tutorial.gif'
                }], allowedMentions: { repliedUser: false }
            })
        } else if (interaction.options.getSubcommand() == 'update') {
            let username = interaction.options.getString('in-game-name')
            let uuid_data_raw = await fetch(`https://api.mojang.com/users/profiles/minecraft/${username}`)
            let uuid_data = undefined;
            try{uuid_data = await uuid_data_raw.json()}catch(err){console.error}
            if (uuid_data) {
                let data_raw = await fetch(`https://api.hypixel.net/player?key=${process.env.APIKEY}&uuid=${uuid_data.id}`)
                let data = await data_raw.json()
                if (data.success == true) {
                    let socialmediadata = undefined;
                    try {
                        socialmediadata = data.player.socialMedia.links.DISCORD
                    } catch(err){}
                    if (socialmediadata) {
                        let discord = data.player.socialMedia.links.DISCORD
                        if (discord == interaction.user.tag) {
                            await MongoClient.connect()
                            const db = MongoClient.db()
                            db.collection('minecraft-accounts').findOne({ discord_id: interaction.user.id }, async function(err, res) {
                                if (err) throw err;
                                if (res == null) {
                                    await db.collection('minecraft-accounts').insertOne({discord_id: interaction.user.id, minecraft_name: uuid_data.name, minecraft_uuid: uuid_data.id}, function(err, res) {
                                        if (err) throw err;
                                        MongoClient.close()
                                    })
                                } else {
                                    await db.collection('minecraft-accounts').updateOne({ discord_id: interaction.user.id }, { $set: { minecraft_name: uuid_data.name, minecraft_uuid: uuid_data.id } })
                                    MongoClient.close()
                                }
                            })
                            let logembed = new Discord.EmbedBuilder()
                                .setColor(config.colours.main)
                                .setTimestamp()
                                .setTitle(`${config.emoji.log} LOG`)
                                .addFields([{name: `**Account link successful.**`, value: `**Discord account tag:** ${interaction.user.tag}\n**Discord account ID:** ${interaction.user.id}\n**Minecraft account name:** ${uuid_data.name}\n**Minecraft account UUID:** ${uuid_data.id}\n`}])
                            let logchannel = client.channels.cache.get(config.channels.logChannelId)
                            logchannel.send({
                                embeds: [logembed]
                            })
                            let embed = new Discord.EmbedBuilder()
                                .setColor(config.colours.main)
                                .setTimestamp()
                                .addFields([{name: "Success.", value: `Successfully linked **${uuid_data.name}** to **<@${interaction.user.id}>**`}])
                            interaction.editReply({embeds: [embed], allowedMentions: { repliedUser: false }})
                        } else {
                            let embed = new Discord.EmbedBuilder()
                                .setColor(config.colours.error)
                                .setTimestamp()
                                .setTitle(`${config.emoji.error} An error has occurred.`)
                                .addFields([{name: `**This player\'s discord account does not match your discord account.**`, value: `**You need to set your discord account in the profile menu on Hypixel.**\nMake sure you entered your full discord tag (e.g. **Username#0001**).`}])
                            interaction.editReply({embeds: [embed], allowedMentions: { repliedUser: false }})
                            setTimeout(() => {interaction.deleteReply()}, 15000);
                        }
                    } else {
                        //Throw error -> User has not set their DISCORD account in game
                        let embed = new Discord.EmbedBuilder()
                                .setColor(config.colours.error)
                                .setTimestamp()
                                .setTitle(`${config.emoji.error} An error has occurred.`)
                                .addFields([{name: `**This player\'s discord account does not match your discord account.**`, value: `**You need to set your discord account in the profile menu on Hypixel.**\nMake sure you entered your full discord tag (e.g. **Username#0001**).`}])
                        interaction.editReply({embeds: [embed], allowedMentions: { repliedUser: false }})
                        setTimeout(() => {interaction.deleteReply()}, 15000);
                    }
                } else {
                    let embed = new Discord.EmbedBuilder()
                        .setColor(config.colours.error)
                        .setTimestamp()
                        .setTitle(`${config.emoji.error} An error has occurred.`)
                        .addFields([{name: `**${data.cause}**`, value: `*This probably means the API key is invalid.*`}])
                    interaction.editReply({embeds: [embed], allowedMentions: { repliedUser: false }})
                    setTimeout(() => {interaction.deleteReply()}, 15000);
                    let logembed = new Discord.EmbedBuilder()
                        .setColor(config.colours.error)
                        .setTimestamp()
                        .setTitle(`${config.emoji.error} ERROR`)
                        .addFields([{name: `**Cause: **`, value: `A player ran a bot command and the Hypixel API key provided by the config file was invalid.`}])
                    let logchannel = client.channels.cache.get(config.channels.logChannelId)
                    logchannel.send({ 
                        embeds: [logembed]
                    })
                }
            } else {
                let embed = new Discord.EmbedBuilder()
                    .setColor(config.colours.error)
                    .setTimestamp()
                    .setTitle(`${config.emoji.error} An error has occurred.`)
                    .addFields([{name: `**A Mojang API error occurred**`, value: `*This probably means the username you entered does not exist.*`}])
                    try{embed.addFields([{name: `**Additional info available: ${uuid_data.error}**`, value: `**${uuid_data.errorMessage}**`}])}catch(err){}
                interaction.editReply({embeds: [embed], allowedMentions: { repliedUser: false }})
                setTimeout(() => {interaction.deleteReply()}, 15000);
            }
        }
    },
};