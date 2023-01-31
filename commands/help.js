const Discord = require('discord.js')
const config = require('../config/config.json')
const pkg = require('../package.json')
require('dotenv').config({ path: '../config/.env' });
const mongo = require('mongodb')
const MongoClient = new mongo.MongoClient(process.env.MONGO_URL)

module.exports = {
    help: true,
    data: new Discord.SlashCommandBuilder()
        .setName('help')
        .setDescription(`Show useful information about the bot.`),
    async execute(client, interaction) {
        await interaction.deferReply()
        let buttonFoward = new Discord.ButtonBuilder()
            .setStyle(Discord.ButtonStyle.Secondary)
            .setEmoji(config.emoji.arrowRight)
            .setCustomId('help_menu_1')
        let buttonBackwards = new Discord.ButtonBuilder()
            .setStyle(Discord.ButtonStyle.Secondary)
            .setEmoji(config.emoji.arrowLeft)
            .setCustomId('help_menu_backwards')
            .setDisabled(true)
        let row = new Discord.ActionRowBuilder()
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
            const embed = new Discord.EmbedBuilder()
                .setColor(config.colours.secondary)
                .setTimestamp()
                .setTitle(`**GuildBot v${pkg.version}**`)
                .addFields([
                    {name: "Uptime", value: `:clock2: ${days}d ${hours}h ${minutes}m ${seconds}s`, inline: true},
                    {name: "Servers", value: `:shield: ${client.guilds.cache.size}`, inline: true}  ,
                    {name: "Channels", value: `:file_folder: ${client.channels.cache.size}`, inline: true},
                    {name: "Users", value: `:bust_in_silhouette: ${client.users.cache.size}`, inline: true},
                    {name: "Emoji", value: `${config.emoji.helpEmoji} ${client.emojis.cache.size}`, inline: true},
                    {name: "Commands ran", value: `${config.emoji.helpCommands} ${countCommands}`, inline: true},
                    {name: "Buttons pressed", value: `${config.emoji.helpButtons} ${countButtons}`, inline: true},
                    {name: "Select menu's used", value: `${config.emoji.helpMenus} ${countSelectMenu}`, inline: true},
                    {name: "Guild Applications Submitted", value: `:pencil: ${countGuildApplications}`, inline: true},
                    {name: "Bot repository", value: `${config.emoji.github} [**GitHub**](${pkg.repository.url})`, inline: true},
                    {name: "Bot library", value: "[**Discord.js v13**](https://discord.js.org/#/docs/main/)", inline: true},
                    {name: "Bot support server", value: `${config.emoji.discord} [**Invite link**](${pkg.supportServer})`, inline: true},
                    {name: "Created on", value: `${client.user.createdAt}`}
                ])
                .setThumbnail(client.user.displayAvatarURL())
                .setFooter({text: 'Developed by @emmaexe#0859'}); 
            if (!interaction.guild.roles.everyone.permissions.has(Discord.PermissionsBitField.Flags.UseExternalEmojis)) {
                if (!interaction.channel.permissionsFor(interaction.guild.roles.everyone).has(Discord.PermissionsBitField.Flags.UseExternalEmojis)) {
                    embed.addFields([{name: ':warning: External emoji could not be displayed!', value: 'For external emoji to be displayed properly within slash commands, the @everyone role in your server needs to have the "Use External Emoji" permission.'}])
                }
            }
            interaction.editReply({
                embeds: [embed],
                components: [row],
                allowedMentions: {
                    repliedUser: false
                }
            })
            MongoClient.close()
        });
    },
};