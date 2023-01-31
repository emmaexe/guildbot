const Discord = require('discord.js')
const config = require('../config/config.json')
const functions = require('../functions.js')
require('dotenv').config({ path: '../config/.env' });
const mongo = require('mongodb')
const MongoClient = new mongo.MongoClient(process.env.MONGO_URL)

module.exports = {
    help: true,
    data: new Discord.SlashCommandBuilder()
        .setName('away')
        .setDescription(`View/set your away status. (Indicates whether you are away on e.g. vacation)`)
        .addSubcommand(command => command
            .setName('set')
            .setDescription('Set your own away status.')
            .addBooleanOption(option => option
                    .setName('away')
                    .setDescription('Indicates whether you are away or not.')
                    .setRequired(true)
                )
            .addStringOption(option => option
                    .setName('reason')
                    .setDescription('Add a reason for being away.')
                )
        )
        .addSubcommand(command => command
            .setName('view')
            .setDescription('View a user\'s away status.')
            .addUserOption(option => option
                    .setName('user')
                    .setDescription('The user whose away status you want to view.')
                    .setRequired(true)
                )
        ),
    async execute(client, interaction) {
        if (interaction.options.getSubcommand() == "set") {
            let away = interaction.options.getBoolean('away'), reason = interaction.options.getString('reason');
            if (!away) { reason = ""; }
            if (reason == undefined) { reason = ""; }
            await MongoClient.connect()
            const db = MongoClient.db()
            let exists = await db.collection('away-system').findOne({ discord_id: interaction.user.id })
            if (exists == undefined) {
                await db.collection('away-system').insertOne({ discord_id: interaction.user.id, status: away, reason: reason })
            } else {
                await db.collection('away-system').updateOne({ discord_id: interaction.user.id }, {$set: { discord_id: interaction.user.id, status: away, reason: reason }})
            }
            await MongoClient.close()
            await interaction.reply({ephemeral: true, content: `Your away status has been updated to **${away}**${reason ? ` with reason **${reason}**` : ``}`})
        } else if (interaction.options.getSubcommand() == "view") {
            await interaction.deferReply()
            let target = interaction.options.getUser('user');
            await MongoClient.connect()
            const db = MongoClient.db()
            db.collection('away-system').findOne({ discord_id: target.id }, async function(err, res){
                if (err) throw err;
                let away = undefined, reason = undefined;
                if (res != undefined) {
                    away = res.status;
                    reason = res.reason;
                }
                let awayText;
                if (away == undefined) {
                    awayText = "This user has never set their away status before.";
                } else if (away) {
                    awayText = "This user is currently **away**.";
                } else if (!away) {
                    awayText = "This user is **not away**.";
                }
                let embed = new Discord.EmbedBuilder()
                    .setTitle(`Away status for **@${target.tag}**`)
                    .setThumbnail(target.displayAvatarURL())
                    .setTimestamp()
                    .setColor(config.colours.main)
                    .addFields([{name: `**Away status**`, value: `${awayText}`}])
                if (reason) {
                    embed.addFields([{name: `**Reason**`, value: `${reason}`}])
                }
                await interaction.editReply({embeds: [embed]})
                await MongoClient.close()
            })
        }
    },
};