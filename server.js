require('dotenv').config()
const logging = require('./consoleFormatting.js'); logging.log(); logging.warn(); logging.error(); logging.info(); //console.log('log'); console.warn('warn'); console.error('error'); console.info('info'); //For testing
const fs = require('fs');
const mongo = require('mongodb')
const MongoClient = new mongo.MongoClient(process.env.MONGO_URL)
const functions = require('./functions.js')
const schedule = require('node-schedule');
const fetch = require('node-fetch')
const mineflayer = require('mineflayer')
const Discord = require("discord.js")
const allIntents = new Discord.Intents(32767); const client = new Discord.Client({ intents: allIntents }); //Uses all intents. The bot runs in a single server so it does not matter.
const config = require('./config.json')
const mineflayerconfig = functions.mineflayerConfig()
client.on('error', async (err) => {
    const channel = await client.channels.cache.get(config.channels.logChannelId)
    const embed = new Discord.MessageEmbed()
        .setTitle(`${config.emoji.error} A DiscordAPIError has occurred.`)
        .addField('**Cause: **', `\`\`${err.message}\`\``)
    channel.send({embeds:[embed]})
})

//client.on('debug', async (debug) => {console.info(debug)}) //Uncomment for debugging.

client.on('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    await MongoClient.connect()
    let db = MongoClient.db()
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
    for (const file of commandFiles) {const command = require(`./commands/${file}`); client.commands.set(command.data.name, command);}
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
    } else if (interaction.isSelectMenu()) {
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
            let db = MongoClient.db()
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
        if (message.channel.type == 'GUILD_TEXT' && message.channel.name.startsWith('ticket-') && !message.author.bot) {
            await MongoClient.connect()
            let db = MongoClient.db()
            let res = await db.collection('tickets').findOne({ sid: 'ticket_introduction_message', discord_id: message.author.id })
            if (res == undefined) {
                await db.collection('tickets').insertOne({ sid: 'ticket_introduction_message', discord_id: message.author.id })
                const embed = new Discord.MessageEmbed()
                    .setTitle(`**Hello ${message.author.tag}, welcome to ${message.guild.name}!**`)
                    .setDescription(`I see it is your first time opening a ticket here. If you are here to apply for guild membership, **please do not bother the staff unless you have a problem**.\nThis process is completely automated and handled by me.\nIf you wish to apply you must do the following:\n\`\`\`• Log on to the hypixel network and set your discord account in the social menu (/link tutorial for more information on how to do that.)\n• Use the /link update command so I can confirm you are the owner of that minecraft account. (Make sure you use my /link command not the commands of other bots)\n• Use the /apply command to submit your application. \n\`\`\`If your application is accepted, you will be placed in an invite queue, and **a member of the staff team will invite you when they are online**.`)
                    .setFooter({text: `You are seeing this message because it is your first time opening a ticket. This message will not be repeated.`})
                    .setTimestamp()
                await message.reply({
                    embeds: [embed],
                    ephemeral: true
                })
            }
            MongoClient.close()
        }
    }
})

client.on('channelCreate', async (channel) => {
    if (channel.type == 'GUILD_TEXT' && channel.name.startsWith('ticket-')) {
        setTimeout(() => {
            channel.setParent(config.channels.ticketCategoryId, { lockPermissions: false })
            let embed = new Discord.MessageEmbed()
                .setColor(config.colours.main)
                .setTitle('**A staff member will be here to help you soon.**')
                .setTimestamp()
            let nomembershipembed = new Discord.MessageEmbed()
                .setColor(config.colours.main)
                .setTitle('**A staff member will be here to help you soon.**')
                .setDescription(`**Looking to join the guild?**\n[Guild forums post](${config.url.forums_post})\n*To apply, run the **/apply** command in a ticket.*\n**Applied and accepted?**\nAn invite will be sent to you when a staff member is online.\n**You aren\'t online?**\nAn offline invite will be sent. This means the next time you next log in, you will have 5 minutes to join the guild before the invite expires.`)
                .setTimestamp()
            let linkingEmbed = new Discord.MessageEmbed()
                .setColor(config.colours.main)
                .setTitle('**Before applying, please link your account!**')
                .setDescription('If you are here to apply for guild membership:\nBefore you may apply, you must link your minecraft account to your discord account. Press the button to learn more.')
                .setTimestamp()
            let linkHelpButton = new Discord.MessageButton()
                .setStyle(2)
                .setEmoji('ℹ️')
                .setLabel('Learn more.')
                .setCustomId('link_help_button')
            let row = new Discord.MessageActionRow()
                .addComponents(linkHelpButton)
            channel.messages.fetch().then(async messages => {
                let id = await messages.find(m => /\<\@[0123456789]*\>/.test(m.content)).content.replace(/[^0123456789]/g, '')
                let member = await channel.guild.members.fetch(id)
                if (member) {
                    if (member.roles.cache.has(config.roles.guildMemberRole)) {
                        channel.send({embeds: [embed]})
                    } else {
                        channel.send({embeds: [nomembershipembed, linkingEmbed], components:[row]})
                    }        
                } else {
                    channel.send({embeds: [nomembershipembed, linkingEmbed], components:[row]})
                }
            }).catch(console.error);
        }, 1000);
    }
})

client.on('messageReactionAdd', async (messageReaction, user) => {
    message = messageReaction.message;
    if (messageReaction.emoji.name == "⭐" && message.guild.id == config.discordGuildId && message.author.id != client.user.id && messageReaction.count >= config.starboard.minimumCount) {
        message.react(`${config.emoji.star}`)
        let embed = new Discord.MessageEmbed()
            .setAuthor(message.author.tag.toString(), message.author.displayAvatarURL())
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
        let db = MongoClient.db()
        db.collection('starboard').findOne(qfilter, async function (err, res) {
            if (res == undefined) {
                let starboard = await client.channels.fetch(config.channels.starboardChannelId)
                await starboard.send({embeds: [embed]}).then(async (msg) => {
                    await db.collection('starboard').insertOne({messageid: message.id, starboardid: msg.id}, function(err, res) {
                        if (err) throw err;
                    })
                })
            } else {
                let starboard = await client.channels.fetch(config.channels.starboardChannelId)
                try {
                    starboard.messages.fetch(res.starboardid).then(async (message) => {
                        message.edit({embeds: [embed]})
                    })
                } catch (err) {
                    console.error(err)
                }
                
            }
            MongoClient.close()
        })
    }
})

client.on('messageReactionRemove', async (messageReaction, user) => {
    message = messageReaction.message;
    if (messageReaction.emoji.name == "⭐" && message.guild.id == config.discordGuildId && message.author.id != client.user.id && messageReaction.count >= config.starboard.minimumCount) {
        let embed = new Discord.MessageEmbed()
            .setAuthor(message.author.tag.toString(), message.author.displayAvatarURL())
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
        let db = MongoClient.db()
        db.collection('starboard').findOne(qfilter, async function (err, res) {
            if (err) throw err;
            if (res == undefined) {
                let starboard = await client.channels.fetch(config.channels.starboardChannelId)
                await starboard.send({embeds: [embed]}).then(async (msg) => {
                    await db.collection('starboard').insertOne({messageid: message.id, starboardid: msg.id}, function(err, res) {
                        if (err) throw err;
                        
                    })
                })
            } else {
                let starboard = await client.channels.fetch(config.channels.starboardChannelId)
                try {
                    starboard.messages.fetch(res.starboardid).then(async (message) => {
                        message.edit({embeds: [embed]})
                    })
                } catch (err) {
                    console.error(err)
                }
                
            }
            MongoClient.close()
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
                let embed = new Discord.MessageEmbed()
                    .setColor(config.colours.success)
                    .setTimestamp()
                    .setTitle(`${config.emoji.log} LOG`)
                    .addField('ChatBridge - Connection Successfull', `Successfully logged in to hypixel as **${mclient.username}**.`)
                if (config.chatbridge.relogOnKick.enabled) {
                    embed.addField(`Remaining re-login attempts`, `Remaining attempts of logging in after getting kicked: **${relogAmount}**`)//**${res.relogAmount}**`)
                    channel.send({embeds:[embed]})
                } else {
                    channel.send({embeds:[embed]})
                }
            })
        })
        mclient.on('kicked', (reason, loggedIn) => {
            client.channels.fetch(config.channels.logChannelId).then(channel => {
                let embed = new Discord.MessageEmbed()
                    .setColor(config.colours.success)
                    .setTimestamp()
                    .setTitle(`${config.emoji.log} LOG`)
                    .addField('ChatBridge - Bot kicked', `ChatBridge bot **${mclient.username}** has been kicked from hypixel:\n**${reason}**`)
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
                let embed = new Discord.MessageEmbed()
                    .setColor("GREEN")
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
                let embed = new Discord.MessageEmbed()
                    .setColor("RED")
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
                let embed = new Discord.MessageEmbed()
                    .setColor(config.colours.secondary)
                    .setTitle(`**${name}** has left the guild!`)
                chatbridgehook.send({
                    'username': name,
                    'embeds': [embed],
                    'avatarURL': `https://crafatar.com/renders/head/${namedata.uuid}`
                })
                if (config.chatbridge.guildJoinLeaveMessages.logging) {
                    await MongoClient.connect()
                    let db = MongoClient.db()
                    let res = await db.collection('minecraft-accounts').findOne({ minecraft_uuid: namedata.uuid })
                    await MongoClient.close()
                    let uuid; if (namedata.uuid == undefined) {uuid = "*unavailable*"} else {uuid = namedata.uuid}
                    let discordId; if (res == undefined) {discordId = "*unavailable*"} else {discordId = res.discord_id}
                    let discordTag; if (res == undefined) {discordTag = "*unavailable*"} else {let user = await client.users.fetch(discordId); discordTag = user.tag}
                    let logembed = new Discord.MessageEmbed()
                        .setColor(config.colours.secondary)
                        .setTimestamp()
                        .setTitle(`${config.emoji.log} LOG`)
                        .setThumbnail(`https://crafatar.com/renders/head/${namedata.uuid}`)
                        .addField(`**${name}** has **LEFT** the guild.`, `**Discord account tag:** ${discordTag}\n**Discord account ID:** ${discordId}\n**Minecraft account name:** ${name}\n**Minecraft account UUID:** ${uuid}\n`)
                    let logchannel = await client.channels.fetch(config.channels.logChannelId)
                    logchannel.send({embeds: [logembed]})
                }
                if (config.modals.guildLeaveFeedback.enabled) {
                    await MongoClient.connect()
                    let db = MongoClient.db()
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
                let embed = new Discord.MessageEmbed()
                    .setColor(config.colours.secondary)
                    .setTitle(`**${name}** has joined the guild!`)
                chatbridgehook.send({
                    'username': name,
                    'embeds': [embed],
                    'avatarURL': `https://crafatar.com/renders/head/${namedata.uuid}`
                })
                await MongoClient.connect()
                let db = MongoClient.db()
                let res = await db.collection('minecraft-accounts').findOne({ minecraft_uuid: namedata.uuid })
                await MongoClient.close()
                if (config.chatbridge.guildJoinLeaveMessages.logging) {
                    let uuid; if (namedata.uuid == undefined) {uuid = "*unavailable*"} else {uuid = namedata.uuid}
                    let discordId; if (res == undefined) {discordId = "*unavailable*"} else {discordId = res.discord_id}
                    let discordTag; if (res == undefined) {discordTag = "*unavailable*"} else {let user = await client.users.fetch(discordId); discordTag = user.tag}
                    let logembed = new Discord.MessageEmbed()
                        .setColor(config.colours.secondary)
                        .setTimestamp()
                        .setTitle(`${config.emoji.log} LOG`)
                        .setThumbnail(`https://crafatar.com/renders/head/${namedata.uuid}`)
                        .addField(`**${name}** has **JOINED** the guild.`, `**Discord account tag:** ${discordTag}\n**Discord account ID:** ${discordId}\n**Minecraft account name:** ${name}\n**Minecraft account UUID:** ${uuid}\n`)
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