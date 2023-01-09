require('dotenv').config()
const fetch = require('node-fetch')
const mongo = require('mongodb')
const MongoClient = new mongo.MongoClient(process.env.MONGO_URL)
const config = require('./config.json')
const pkg = require('./package.json')
const Discord = require('discord.js')
const { colours } = require('./consoleFormatting.js')
const { compare } = require('compare-versions')

module.exports = {
    async getTimestampFromID(discordId) {
        return (discordId / 4194304 + 1420070400000)
    },
    async checkForUpdates(client) {
        let baseUrl = pkg.repository.urlRaw
        let data = await fetch(baseUrl + "package.json")
        let packageData = await data.json()
        let channel = client.channels.cache.get(config.channels.logChannelId)
        if (compare(pkg.version.toString(), packageData.version.toString(), ">")) {
            let embed = new Discord.EmbedBuilder()
                .setColor(config.colours.warning)
                .setTimestamp()
                .addFields([{name: `${config.emoji.warning} Warning!`, value: `You are running either an unreleased or a misconfigured version of GuildBot. \nOnly proceed if you are sure you know what you're doing. \nIf not, contact ${pkg.author} about this or post an issue on the github repository: ${pkg.repository.url}.`}])
            channel.send({
                embeds: [embed]
            })
            console.warn(`${colours.reset}${colours.fg.yellow}You are running either an unreleased or a misconfigured version of GuildBot. Only proceed if you are sure you know what you're doing. If not, contact ${pkg.author} about this or post an issue on the github repository: ${pkg.repository.url}.${colours.reset}`)
        } else if (compare(pkg.version.toString(), packageData.version.toString(), "<")) {
            let githubApiDataRaw = await fetch(pkg.repository.urlApi + "/releases")
            let githubApiData = await githubApiDataRaw.json()
            let versionsBehind = githubApiData.findIndex(release => compare(release.tag_name.toString(), pkg.version.toString(), "=") === true)
            let embed = new Discord.EmbedBuilder()
                .setColor(config.colours.warning)
                .setTimestamp()
                .addFields([{name: `${config.emoji.warning} Warning!`, value: `A new version of GuildBot is available!\n**${pkg.version} => ${packageData.version}**\nYou are **${versionsBehind}** updates behind the latest update.\nDownload it now at ${githubApiData[0].html_url}`}])
            channel.send({
                embeds: [embed]
            })
            console.info(`${colours.reset}${colours.fg.yellow}A new version of GuildBot is available!\n${colours.bright}${pkg.version} => ${packageData.version}\n${colours.reset}${colours.fg.yellow}You are ${colours.bright}${versionsBehind}${colours.reset}${colours.fg.yellow} updates behind the latest update.\n${colours.reset}${colours.fg.yellow}Download it now at ${githubApiData[0].html_url}${colours.reset}`)
        } else if (compare(pkg.version.toString(), packageData.version.toString(), "=")) {
            console.log(`${colours.fg.white}No updates available. You are running the latest version of GuildBot: ${colours.bright}${pkg.version}${colours.reset}`)
        }
    },
    async leaderboardDataUpdate(client) {
        let leaderboardData = {};
        let hGuild = {}
        let data = await fetch(`https://api.hypixel.net/guild?key=${process.env.APIKEY}&id=${config.hypixelGuildId}`)
        try {
            hGuild = await data.json()
        } catch (err) {
            console.error(err)
        }
        if (hGuild.success) {
            let count = hGuild.guild.members.length
            let channel = await client.channels.fetch(config.channels.memberCount.guild)
            channel.setName(`📊Guild Members: ${count}📊`)
            for (const member of hGuild.guild.members) {
                let nameData = await fetch(`https://minecraft-api.com/api/pseudo/${member.uuid}/json`)
                    let mun = undefined;
                    try {mun = await nameData.json()} catch(err){console.error}
                    if (mun) {
                        dates = Object.keys(member.expHistory)
                        let avgExp = 0;
                        let totalExp = 0;
                        let c = 0;
                        dates.forEach((date) => {
                            avgExp += member.expHistory[date]
                            c += 1;
                        })
                        totalExp = avgExp;
                        avgExp /= c;
                        let rank = {"name": undefined, "default": false, "tag": undefined, "created": undefined, "priority": undefined};
                        if (member.rank == "GUILDMASTER" || member.rank == "Guild Master") {
                            rank = {
                                "name": "Guild Master",
                                "default": false,
                                "tag": null,
                                "created": hGuild.guild.created,
                                "priority": 101
                            }
                        } else {
                            rank = hGuild.guild.ranks.find(rank => rank.name.toLowerCase() == member.rank.toLowerCase())
                        }
                        leaderboardData[mun.pseudo.toString()] = {
                            avg: avgExp,
                            total: totalExp,
                            rankName: rank.name,
                            rankDefault: rank.default,
                            rankTag: rank.tag,
                            rankCreated: rank.created,
                            rankPriority: rank.priority
                        }
                    }
            }
            setTimeout(async () => {
                await MongoClient.connect()
                const db = MongoClient.db()
                db.collection('hypixel-api-data').findOne({ sid: "guild-leaderboard-data" }, async function(err, res) {
                    if (err) throw err;
                    if (res == null) {
                        db.collection('hypixel-api-data').insertOne({sid: "guild-leaderboard-data", data: leaderboardData, timestamp: Date.now()}, async function(err, res) {
                            if (err) throw err;
                            await MongoClient.close()
                        })
                    } else {
                        await db.collection('hypixel-api-data').updateOne({ sid: "guild-leaderboard-data" }, { $set: { data: leaderboardData, timestamp: Date.now() } })
                        await MongoClient.close()
                    }
                })
            }, 1500)
        } else {
            console.error(hGuild)
        }
    },
    mineflayerConfig() {
        let obj = {
            host: "mc.hypixel.net",
            version: "1.8",
            username: process.env.MC_ACC_USERNAME.toString(),
            password: process.env.MC_ACC_PASSWORD.toString(),
            auth: process.env.MC_ACC_AUTHSERVER.toString(),
            hideErrors: true
        }
        return obj;
    },
    async fetchJSON(url) {
        let rawData = undefined;
        try {
            rawData = await fetch(url);
        } catch(err){ console.error(err); }
        if (rawData === undefined) {
            return undefined;
        } else {
            let parsedData = undefined;
            try {
                parsedData = rawData.json();
            } catch (err) { console.error(err); }
            if (parsedData === undefined) {
                return undefined;
            } else {
                return parsedData;
            }
        }
    },
    hypixelUtil: {
        networkLevelFromExp(exp) {
            return (Math.sqrt((2 * parseInt(exp)) + 30625) / 50) - 2.5
        }
    },
    statistics: {
        async increaseButtonCount() {
            await MongoClient.connect()
            const db = await MongoClient.db()
            await db.collection('statistics').findOne({ sid: "countButtons" }, async function(err, res) {
                if (err) throw err;
                if (res == null) {
                    await db.collection('statistics').insertOne({sid: "countButtons", value: 1}, function(err, res) {
                        if (err) throw err;
                        MongoClient.close()
                    })
                } else {
                    await db.collection('statistics').updateOne({ sid: "countButtons" }, { $set: { value: res.value+1 } })
                    MongoClient.close()
                }
            })
        },
        async increaseCommandCount() {
            await MongoClient.connect()
            const db = await MongoClient.db()
            await db.collection('statistics').findOne({ sid: "countCommands" }, async function(err, res) {
                if (err) throw err;
                if (res == null) {
                    await db.collection('statistics').insertOne({sid: "countCommands", value: 1}, function(err, res) {
                        if (err) throw err;
                        MongoClient.close()
                    })
                } else {
                    await db.collection('statistics').updateOne({ sid: "countCommands" }, { $set: { value: res.value+1 } })
                    MongoClient.close()
                }
            })
        },
        async increaseSelectMenuCount() {
            await MongoClient.connect()
            const db = await MongoClient.db()
            await db.collection('statistics').findOne({ sid: "countSelectMenu" }, async function(err, res) {
                if (err) throw err;
                if (res == null) {
                    await db.collection('statistics').insertOne({sid: "countSelectMenu", value: 1}, function(err, res) {
                        if (err) throw err;
                        MongoClient.close()
                    })
                } else {
                    await db.collection('statistics').updateOne({ sid: "countSelectMenu" }, { $set: { value: res.value+1 } })
                    MongoClient.close()
                }
            })
        },
        async increaseGuildApplicationCount() {
            await MongoClient.connect()
            const db = await MongoClient.db()
            await db.collection('statistics').findOne({ sid: "countGuildApplications" }, async function(err, res) {
                if (err) throw err;
                if (res == null) {
                    await db.collection('statistics').insertOne({sid: "countGuildApplications", value: 1}, function(err, res) {
                        if (err) throw err;
                        MongoClient.close()
                    })
                } else {
                    await db.collection('statistics').updateOne({ sid: "countGuildApplications" }, { $set: { value: res.value+1 } })
                    MongoClient.close()
                }
            })
        }
    },
    eventFunctions: {
        async minecraftGuildMemberLeave(client, memberId, uuid, name) {
            if (memberId != undefined) {
                let guild = await client.guilds.fetch(config.discordGuildId);
                let member = await guild.members.fetch(memberId);
                let embed = new Discord.EmbedBuilder()
                    .setThumbnail(guild.iconURL())
                    .setColor(config.colours.main)
                    .setTitle(`**${guild.name}**`)
                    .addFields([{name: `**We're sorry to see you go, \`\`${name}\`\`.**`, value: `Would you mind filling a very quick and short survey on why you left? Your feedback will be forwarded to our staff team and greatly appreciated.`}])
                let button = new Discord.ButtonBuilder()
                    .setStyle(Discord.ButtonStyle.Secondary)
                    .setLabel('Open survey')
                    .setCustomId('guild_leave_feedback')
                let row = new Discord.ActionRowBuilder()
                    .addComponents(button)
                await member.send({message:`<@${memberId}>`, embeds:[embed], components:[row]})
            }
        }
    }
}