require('dotenv').config({ path: './config/.env' });
const fs = require('fs');
const mongo = require('mongodb');
const MongoClient = new mongo.MongoClient(process.env.MONGO_URL);
const functions = require('./functions.js');
const schedule = require('node-schedule');
const fetch = require('node-fetch');
const mineflayer = require('mineflayer');
const Discord = require("discord.js");
const client = new Discord.Client({ intents: 3260415 });
const config = require('./config/config.json');
const mineflayerconfig = functions.mineflayerConfig();

const logging = require('./consoleFormatting.js');
if (config.logs.fancyLogs) { logging.log(); logging.warn(); logging.error(); logging.info(); }
if (config.logs.djsDebugging) { client.on('debug', async (debug) => {console.info(debug)}); }

client.on('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    await MongoClient.connect()
    const db = MongoClient.db()
    db.collection('starboard').findOne({}, async function (err, res) {
        if (err) throw err;
        if (res != undefined) {
            await db.collection('starboard').drop()
            await MongoClient.close()
        }
    })
    guild = await client.guilds.fetch(config.discordGuildId)
    client.user.setActivity(`over ${guild.name}`, {type: "WATCHING"})
    client.commands = new Discord.Collection();
    const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {const command = require(`./commands/${file}`); if (command.data) {client.commands.set(command.data.name, command);};}
    const deployCommands = require(`./slashCommands.js`);
    deployCommands.deploy(client, client.user.id, config.discordGuildId)
    functions.checkForUpdates(client)
    functions.leaderboardDataUpdate(client)
})

client.on('interactionCreate', async (interaction) => {
	if (interaction.isButton()) {
        functions.statistics.increaseButtonCount()
        try {
            let interactionFile = require(`./buttons/${interaction.customId}.js`);
            interactionFile.execute(client, interaction)
        } catch (err) {
            return console.error(err);
        }
    } else if (interaction.isStringSelectMenu()) {
        functions.statistics.increaseSelectMenuCount()
        try {
            let interactionFile = require(`./select-menus-handler.js`);
            interactionFile.execute(client, interaction)
        } catch (err) {
            return console.error(err);
        }
    } else if (interaction.isModalSubmit()) {
        try {
            let interactionFile = require(`./modals/${interaction.customId}.js`);
            interactionFile.execute(client, interaction)
        } catch (err) {
            return console.error(err);
        }
    } else if (interaction.isCommand()) {
        functions.statistics.increaseCommandCount()
        const command = client.commands.get(interaction.commandName);
        if (!command) return;
        let now = Date.now()
        const qfilter = {
            guildid: interaction.guild.id,
            command: interaction.commandName
        }
        if (command.cooldown) {
            await MongoClient.connect()
            const db = MongoClient.db()
            let nextAvailable = await db.collection('cooldown').findOne(qfilter)
            if (nextAvailable == undefined) nextAvailable = 0;
            if (nextAvailable - now > 0) {
                await interaction.reply({
                    content: `**Command on cooldown! Please wait *${(nextAvailable-now)/1000}* more seconds.**`,
                    ephemeral: true
                });
                MongoClient.close()
            } else {
                try {
                    await command.execute(client, interaction);
                    const db = MongoClient.db()
                    db.collection('cooldown').findOne(qfilter, async function (err, res) {
                        if (err) throw err;
                        if (res == null) {
                            db.collection('cooldown').insertOne({
                                guildid: interaction.guild.id,
                                command: interaction.commandName,
                                value: now + command.cooldown
                            }, function (err, res) {
                                if (err) throw err;
                                MongoClient.close()
                                return;
                            })
                        } else {
                            await db.collection('cooldown').updateOne(qfilter, {
                                $set: {
                                    value: now + command.cooldown
                                }
                            })
                            MongoClient.close()
                            return;
                        }
                    })        
                } catch (error) {
                    console.error(error);
                    return interaction.reply({
                        content: '**There was an error while executing this command!**\n*No more info is available.*',
                        ephemeral: true
                    });
                }
            }
        } else {
            try {
                await command.execute(client, interaction);
            } catch (error) {
                console.error(error);
                return interaction.reply({
                    content: '**There was an error while executing this command!**\n*No more info is available.*',
                    ephemeral: true
                });
            }
        }
    }
});

client.on('guildMemberAdd', async (member) => {
    if (member.guild.id == config.discordGuildId) {
        let num = member.guild.memberCount;
        let channel = await member.guild.channels.fetch(config.channels.memberCount.discord);
        channel.setName(`📊Members: ${num}📊`);
    }
});

client.on('guildMemberRemove', async (member) => {
    if (member.guild.id == config.discordGuildId) {
        let num = member.guild.memberCount;
        let channel = await member.guild.channels.fetch(config.channels.memberCount.discord);
        channel.setName(`📊Members: ${num}📊`);
    }
});

client.on('messageCreate', async (message) => {
    if (message.guild) {
        if (message.guild.id != config.discordGuildId) return;
        if (message.mentions.members.size >= 0 && !message.author.bot) {
            message.mentions.members.forEach(async member => {
                await MongoClient.connect()
                const db = MongoClient.db()
                let away = await db.collection('away-system').findOne({ discord_id: member.id })
                await MongoClient.close()
                if (away != undefined) {
                    if (away.status == true) {
                        message.reply({allowedMentions: {repliedUser: false}, content: `\`\`${member.displayName}\`\` is currently away. You can check their away status using \`\`/away view\`\`.`})
                    }
                }
            })
        }
    }
})

client.on('messageReactionAdd', async (messageReaction, user) => {
    message = messageReaction.message;
    if (messageReaction.emoji.name == "⭐" && message.guild.id == config.discordGuildId && message.author.id != client.user.id && messageReaction.count >= config.starboard.minimumCount) {
        message.react(`${config.emoji.star}`)
        let embed = new Discord.EmbedBuilder()
            .setTitle(message.author.tag)
            .setThumbnail(message.author.displayAvatarURL())
            .setFooter({text: `${messageReaction.count}⭐`})
            .setTimestamp()
        desc = `**[Jump to message](https://discord.com/channels/${message.guild.id}/${message.channel.id}/${message.id})**\n`
        if (message.content) {desc+=message.content}
        embed.setDescription(desc)
        if (message.attachments) {
            let attachment = await message.attachments.find(att => att.contentType.startsWith("image/"))
            if (attachment) {
                embed.setImage(attachment.url)
            }
        }
        let qfilter = {messageid: message.id}
        await MongoClient.connect()
        const db = MongoClient.db()
        db.collection('starboard').findOne(qfilter, async function (err, res) {
            if (res == undefined) {
                let starboard = await client.channels.fetch(config.channels.starboardChannelId)
                await starboard.send({embeds: [embed]}).then(async (msg) => {
                    db.collection('starboard').insertOne({messageid: message.id, starboardid: msg.id}, async function(err, res) {
                        if (err) throw err;
                        await MongoClient.close()
                    })
                })
            } else {
                let starboard = await client.channels.fetch(config.channels.starboardChannelId)
                try {
                    starboard.messages.fetch({message: res.starboardid}).then(async (message) => {
                        message.edit({embeds: [embed]})
                    })
                } catch (err) {
                    console.error(err)
                }
                await MongoClient.close()   
            }
        })
    }
})

client.on('messageReactionRemove', async (messageReaction, user) => {
    message = messageReaction.message;
    if (messageReaction.emoji.name == "⭐" && message.guild.id == config.discordGuildId && message.author.id != client.user.id && messageReaction.count >= config.starboard.minimumCount) {
        let embed = new Discord.EmbedBuilder()
            .setTitle(message.author.tag)
            .setThumbnail(message.author.displayAvatarURL())
            .setFooter({text: `${messageReaction.count}⭐`})
            .setTimestamp()
        desc = `**[Jump to message](https://discord.com/channels/${message.guild.id}/${message.channel.id}/${message.id})**\n`
        if (message.content) {desc+=message.content}
        embed.setDescription(desc)
        if (message.attachments) {
            let attachment = await message.attachments.find(att => att.contentType.startsWith("image/"))
            if (attachment) {
                embed.setImage(attachment.url)
            }
        }
        let qfilter = {messageid: message.id}
        await MongoClient.connect()
        const db = MongoClient.db()
        db.collection('starboard').findOne(qfilter, async function (err, res) {
            if (err) throw err;
            if (res == undefined) {
                let starboard = await client.channels.fetch(config.channels.starboardChannelId)
                await starboard.send({embeds: [embed]}).then(async (msg) => {
                    db.collection('starboard').insertOne({messageid: message.id, starboardid: msg.id}, async function(err, res) {
                        if (err) throw err;
                        await MongoClient.close()
                    })
                })
            } else {
                let starboard = await client.channels.fetch(config.channels.starboardChannelId)
                try {
                    starboard.messages.fetch({message: res.starboardid}).then(async (message) => {
                        message.edit({embeds: [embed]})
                    })
                } catch (err) {
                    console.error(err)
                }
                await MongoClient.close()   
            }
        })
    }
})

const leaderboardDataUpdateJob = schedule.scheduleJob(config.scheduledEvents.leaderboardDataUpdate, function(){functions.leaderboardDataUpdate(client)});

client.login(process.env.TOKEN)

if (config.chatbridge.enabled) {
    let bindEvents = function(mclient, relogAmount) {
        module.exports = {mclient: mclient}
        const chatbridgehook = new Discord.WebhookClient({url: config.chatbridge.webhook})
        client.on('messageCreate', message => {
            if (message.channel.id === config.chatbridge.channelId && !message.author.bot && message.author) {
                mclient.chat(`/gc ${message.member.displayName}: ${message.content}`)
            }
        })
        mclient.on('login', () => {
            client.channels.fetch(config.channels.logChannelId).then(channel => {
                let embed = new Discord.EmbedBuilder()
                    .setColor(config.colours.success)
                    .setTimestamp()
                    .setTitle(`${config.emoji.log} LOG`)
                    .addFields([{name: 'ChatBridge - Connection Successfull', value: `Successfully logged in to hypixel as **${mclient.username}**.`}])
                if (config.chatbridge.relogOnKick.enabled) {
                    embed.addFields([{name: `Remaining re-login attempts`, value: `Remaining attempts of logging in after getting kicked: **${relogAmount}**`}])//**${res.relogAmount}**`)
                    channel.send({embeds:[embed]})
                } else {
                    channel.send({embeds:[embed]})
                }
            })
        })
        mclient.on('kicked', (reason, loggedIn) => {
            client.channels.fetch(config.channels.logChannelId).then(channel => {
                let embed = new Discord.EmbedBuilder()
                    .setColor(config.colours.success)
                    .setTimestamp()
                    .setTitle(`${config.emoji.log} LOG`)
                    .addFields([{name: 'ChatBridge - Bot kicked', value: `ChatBridge bot **${mclient.username}** has been kicked from hypixel:\n**${reason}**`}])
                channel.send({embeds:[embed]})
            })
            if (config.chatbridge.relogOnKick.enabled) {
                if (relogAmount>0) {
                    mclient = mineflayer.createBot(mineflayerconfig)
                    bindEvents(mclient, relogAmount-1)
                }
            }
        })
        mclient.on('messagestr', async (message) => {
            let spacex = new RegExp('^( )*$')
            if (spacex.test(message)) return;
            if (config.chatbridge.messagelogging.enabled) {
                client.channels.fetch(config.chatbridge.messagelogging.channelId).then(channel => {
                    let msg = message.replace(/<@.*>/g, "").replace(/(@everyone)|(@here)/g, "")
                    if (msg.length >= 1) {
                        channel.send({content:`\`\`${msg}\`\``})
                    }
                })
            }
            //You cannot say the same message twice!
            if (message == "You cannot say the same message twice!") {
                client.channels.fetch(config.chatbridge.channelId).then(async channel => {
                    let msg = channel.lastMessage
                    await msg.reply({content: "**You cannot say the same message twice!**", ephemeral: true, allowedMentions: { repliedUser: false }})
                    //await msg.delete()
                })
            }
            //let dmex = new RegExp('^From .+: ')
            let gex = new RegExp('^Guild > .+: ')
            //MC username regex ---> ([a-z]|[A-Z]|[0-9]|_){3,16}
            let guildJoin = /^(\[.+\] )?([a-z]|[A-Z]|[0-9]|_){3,16} joined the guild!$/g
            let guildLeave = /^(\[.+\] )?([a-z]|[A-Z]|[0-9]|_){3,16} left the guild!$/g
            let serverJoin = new RegExp('^Guild > ([a-z]|[A-Z]|[0-9]|_){3,16} joined\.$')
            let serverLeave = new RegExp('^Guild > ([a-z]|[A-Z]|[0-9]|_){3,16} left\.$')
            if (config.chatbridge.serverJoinLeaveMessages.enabled && serverJoin.test(message)) {
                let name = message.slice(8, message.length-8)
                let embed = new Discord.EmbedBuilder()
                    .setColor("Green")
                    .setTitle(`**${name}** is now online.`)
                let response = await fetch(`https://minecraft-api.com/api/uuid/${name}/json`)
                let namedata = {uuid: undefined};
                try{namedata = await response.json()}catch(err){console.error}
                chatbridgehook.send({
                    'username': name,
                    'embeds': [embed],
                    'avatarURL': `https://crafatar.com/renders/head/${namedata.uuid}`
                })
            } else if (config.chatbridge.serverJoinLeaveMessages.enabled && serverLeave.test(message)) {
                let name = message.slice(8, message.length-6)
                let embed = new Discord.EmbedBuilder()
                    .setColor("Red")
                    .setTitle(`**${name}** is now offline.`)
                let response = await fetch(`https://minecraft-api.com/api/uuid/${name}/json`)
                let namedata = {uuid: undefined};
                try{namedata = await response.json()}catch(err){console.error}
                chatbridgehook.send({
                    'username': name,
                    'embeds': [embed],
                    'avatarURL': `https://crafatar.com/renders/head/${namedata.uuid}`
                })
            }
            if (config.chatbridge.guildJoinLeaveMessages.enabled && guildLeave.test(message)){
                let name = message.split(" ");
                if (message.startsWith("[")) {name = name[1]} else {name = name[0]}
                let response = await fetch(`https://minecraft-api.com/api/uuid/${name}/json`)
                let namedata = {uuid: undefined};
                try{namedata = await response.json()}catch(err){console.error}
                let embed = new Discord.EmbedBuilder()
                    .setColor(config.colours.secondary)
                    .setTitle(`**${name}** has left the guild!`)
                chatbridgehook.send({
                    'username': name,
                    'embeds': [embed],
                    'avatarURL': `https://crafatar.com/renders/head/${namedata.uuid}`
                })
                if (config.chatbridge.guildJoinLeaveMessages.logging) {
                    await MongoClient.connect()
                    const db = MongoClient.db()
                    let res = await db.collection('minecraft-accounts').findOne({ minecraft_uuid: namedata.uuid })
                    await MongoClient.close()
                    let uuid; if (namedata.uuid == undefined) {uuid = "*unavailable*"} else {uuid = namedata.uuid}
                    let discordId; if (res == undefined) {discordId = "*unavailable*"} else {discordId = res.discord_id}
                    let discordTag; if (res == undefined) {discordTag = "*unavailable*"} else {let user = await client.users.fetch(discordId); discordTag = user.tag}
                    let logembed = new Discord.EmbedBuilder()
                        .setColor(config.colours.secondary)
                        .setTimestamp()
                        .setTitle(`${config.emoji.log} LOG`)
                        .setThumbnail(`https://crafatar.com/renders/head/${namedata.uuid}`)
                        .addFields([{name: `**${name}** has **LEFT** the guild.`, value: `**Discord account tag:** ${discordTag}\n**Discord account ID:** ${discordId}\n**Minecraft account name:** ${name}\n**Minecraft account UUID:** ${uuid}\n`}])
                    let logchannel = await client.channels.fetch(config.channels.logChannelId)
                    logchannel.send({embeds: [logembed]})
                }
                if (config.modals.guildLeaveFeedback.enabled) {
                    await MongoClient.connect()
                    const db = MongoClient.db()
                    let res = await db.collection('minecraft-accounts').findOne({ minecraft_uuid: namedata.uuid })
                    await MongoClient.close()
                    let uuid; if (namedata.uuid == undefined) {uuid = undefined} else {uuid = namedata.uuid}
                    let discordId; if (res) {discordId = res.discord_id} else {discordId = undefined}
                    functions.eventFunctions.minecraftGuildMemberLeave(client, discordId, uuid, name)
                }
            } else if(config.chatbridge.guildJoinLeaveMessages.enabled && guildJoin.test(message)){
                let name = message.split(" ");
                if (message.startsWith("[")) {name = name[1]} else {name = name[0]}
                let response = await fetch(`https://minecraft-api.com/api/uuid/${name}/json`)
                let namedata = {uuid: undefined};
                try{namedata = await response.json()}catch(err){console.error}
                let embed = new Discord.EmbedBuilder()
                    .setColor(config.colours.secondary)
                    .setTitle(`**${name}** has joined the guild!`)
                chatbridgehook.send({
                    'username': name,
                    'embeds': [embed],
                    'avatarURL': `https://crafatar.com/renders/head/${namedata.uuid}`
                })
                await MongoClient.connect()
                const db = MongoClient.db()
                let res = await db.collection('minecraft-accounts').findOne({ minecraft_uuid: namedata.uuid })
                await MongoClient.close()
                if (config.chatbridge.guildJoinLeaveMessages.logging) {
                    let uuid; if (namedata.uuid == undefined) {uuid = "*unavailable*"} else {uuid = namedata.uuid}
                    let discordId; if (res == undefined) {discordId = "*unavailable*"} else {discordId = res.discord_id}
                    let discordTag; if (res == undefined) {discordTag = "*unavailable*"} else {let user = await client.users.fetch(discordId); discordTag = user.tag}
                    let logembed = new Discord.EmbedBuilder()
                        .setColor(config.colours.secondary)
                        .setTimestamp()
                        .setTitle(`${config.emoji.log} LOG`)
                        .setThumbnail(`https://crafatar.com/renders/head/${namedata.uuid}`)
                        .addFields([{name: `**${name}** has **JOINED** the guild.`, value: `**Discord account tag:** ${discordTag}\n**Discord account ID:** ${discordId}\n**Minecraft account name:** ${name}\n**Minecraft account UUID:** ${uuid}\n`}])
                    let logchannel = await client.channels.fetch(config.channels.logChannelId)
                    logchannel.send({embeds: [logembed]})
                }
            } 
            if (gex.test(message)) {
                let part = message.match(gex)[0]
                let msg = message.replace(gex, "").replace(/(<@.+>)|(@everyone)|(@here)/g, "")
                if (msg.length < 1) return;
                let namearr = part.replace(/^Guild > /, "").split(" ")
                let name = namearr[0]
                if (namearr[0].startsWith('[')) name = namearr[1]
                name = name.replace(/: ?$/, "")
                if (name != mclient.username) {
                    let response = await fetch(`https://minecraft-api.com/api/uuid/${name}/json`)
                    let namedata = {uuid: undefined};
                    try{namedata = await response.json()}catch(err){console.error}
                    chatbridgehook.send({
                        'username': name,
                        'content': msg,
                        'avatarURL': `https://crafatar.com/renders/head/${namedata.uuid}`
                    })
                }
            }
        })
    }

    let mclient = mineflayer.createBot(mineflayerconfig)
    setTimeout(() => {
        bindEvents(mclient, config.chatbridge.relogOnKick.relogAmount)
    }, 500)
}