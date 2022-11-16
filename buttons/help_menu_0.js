const Discord = require('discord.js')
const {
    MessageButton,
    MessageActionRow
} = require('discord.js');
const config = require('../config.json')
const pkg = require('../package.json')
require('dotenv').config()
const mongo = require('mongodb')
const MongoClient = new mongo.MongoClient(process.env.MONGO_URL)

module.exports = {
    async execute(client, interaction) {
        let buttonFoward = new Discord.MessageButton()
            .setStyle(2)
            .setEmoji(config.emoji.arrowRight)
            .setLabel('')
            .setCustomId('help_menu_1')
        let buttonBackwards = new Discord.MessageButton()
            .setStyle(2)
            .setEmoji(config.emoji.arrowLeft)
            .setLabel('')
            .setCustomId('help_menu_backwards')
            .setDisabled(true)
        let row = new Discord.MessageActionRow()
            .addComponents(buttonBackwards, buttonFoward)
        let totalSeconds = (client.uptime / 1000);
        let days = Math.floor(totalSeconds / 86400);
        totalSeconds %= 86400;
        let hours = Math.floor(totalSeconds / 3600);
        totalSeconds %= 3600;
        let minutes = Math.floor(totalSeconds / 60);
        let seconds = Math.floor(totalSeconds % 60);
        await MongoClient.connect()
        const db = MongoClient.db()
        db.collection('statistics').find({}).toArray(function (err, res) {
            if (err) throw err;
            let countCommands = res.find(obj => obj.sid === 'countCommands'); if (countCommands==null) {countCommands = 0} else {countCommands = countCommands.value};
            let countButtons = res.find(obj => obj.sid === 'countButtons'); if (countButtons==null) {countButtons = 0} else {countButtons = countButtons.value};
            let countSelectMenu = res.find(obj => obj.sid === 'countSelectMenu'); if (countSelectMenu==null) {countSelectMenu = 0} else {countSelectMenu = countSelectMenu.value};
            let countGuildApplications = res.find(obj => obj.sid === 'countGuildApplications'); if (countGuildApplications==null) {countGuildApplications = 0} else {countGuildApplications = countGuildApplications.value};
            const embed = new Discord.MessageEmbed()
                .setColor(config.colours.secondary)
                .setTimestamp()
                .setTitle(`**GuildBot v${pkg.version}**`)
                .addField("Uptime", `:clock2: ${days}d ${hours}h ${minutes}m ${seconds}s`, true)
                .addField("Servers", `:shield: ${client.guilds.cache.size}`, true)
                .addField("Channels", `:file_folder: ${client.channels.cache.size}`, true)
                .addField("Users", `:bust_in_silhouette: ${client.users.cache.size}`, true)
                .addField("Emoji", `${config.emoji.helpEmoji} ${client.emojis.cache.size}`, true)
                .addField("Commands ran", `${config.emoji.helpCommands} ${countCommands}`, true)
                .addField("Buttons pressed", `${config.emoji.helpButtons} ${countButtons}`, true)
                .addField("Select menu's used", `${config.emoji.helpMenus} ${countSelectMenu}`, true)
                .addField("Guild Applications Submitted", `:pencil: ${countGuildApplications}`, true)
                .addField("Bot repository", `${config.emoji.github} [**GitHub**](${pkg.repository.url})`, true)
                .addField("Bot library", "[**Discord.js v13**](https://discord.js.org/#/docs/main/)", true)
                .addField("Bot support server", `${config.emoji.discord} [**Invite link**](${pkg.supportServer})`, true)
                .addField("Created on", `${client.user.createdAt}`)
                .setThumbnail(client.user.displayAvatarURL())
                .setFooter({text: 'Developed by @emmaexe#0859'})
            if (!interaction.guild.roles.everyone.permissions.has(Discord.Permissions.FLAGS.USE_EXTERNAL_EMOJIS)) {
                if (!interaction.channel.permissionsFor(interaction.guild.roles.everyone).has(Discord.Permissions.FLAGS.USE_EXTERNAL_EMOJIS)) {
                    embed.addField(':warning: External emoji could not be displayed!', 'For external emoji to be displayed properly within slash commands, the @everyone role in your server needs to have the "Use External Emoji" permission.')    
                }
            }
            if (!interaction.channel.permissionsFor(interaction.guild.roles.everyone).serialize().USE_EXTERNAL_EMOJIS && interaction.guild.roles.everyone.permissions.has(Discord.Permissions.FLAGS.USE_EXTERNAL_EMOJIS)) {
                embed.addField(':warning: External emoji could not be displayed!', 'For external emoji to be displayed properly within slash commands, the @everyone role in your server needs to have the "Use External Emoji" permission.')    
            }
            interaction.update({
                embeds: [embed],
                components: [row]
            });
            MongoClient.close()
        });
    }
}