<h1 align="center">Setting the bot up</h1>

## Enviromental variables

Enviromental variables are used for saving sensitive data (e.g. your discord token).

To handle enviromental variables the project uses the [dotenv](https://www.npmjs.com/package/dotenv) npm package.

You must create a ".env" file in the root of the project and create all the necessary variables for the bot to function.

You can find more info on how to do that [here](https://www.npmjs.com/package/dotenv).

Variables that must be created in order for the bot to function:

**"TOKEN"** - contains your discord bot's token.

**"APIKEY"** - contains your hypixel API key. To get/reset your api key, use the "/api new" command anywhere on the hypixel network.

**"MONGO_URL"** - contains the URL of your MongoDB server. You must include the database name after the URL so the project knows where to save data (e.g. mongodb://localhost:27017/guildbot; mongodb://localhost:27017/ being the URL and guildbot the database name.)

**"MC_ACC_USERNAME"** - contains the email address of the minecraft account used for the guild chat bridge feature of the bot.

**"MC_ACC_PASSWORD"** - contains the password of the minecraft account used for the guild chat bridge feature of the bot.

**"MC_ACC_AUTHSERVER"** - specifies the auth server that the bot should use when logging in to the minecraft account. If the account is not migrated (a mojang account), use "mojang". If the account is migrated (to a microsoft account), use "microsoft".

## Additional confirugation - config.json file

The **config.json** file is used for saving less sesitive configuration data.

```json

{
    "discordGuildId": DISCORDID,
    "hypixelGuildId": UUID,
    "colours": {
        "main":"00FFF0",
        "secondary":"202225",
        "success":"00FF50",
        "warning":"FFFF10",
        "error":"FF1F00"
    },
    "roles":{
        "guildMemberRole":DISCORDID,
        "helpers":[DISCORDID, DISCORDID, ...],
        "adminRole":[DISCORDID, DISCORDID, ...]
    },
    "scheduledEvents": {
        "leaderboardDataUpdate":"*/1 * * * *"
    },
    "channels":{
        "logChannelId":DISCORDID,
        "appChannelId":DISCORDID,
        "queueChannelId":DISCORDID,
        "starboardChannelId":DISCORDID,
        "memberCount": {
            "discord":DISCORDID,
            "guild":DISCORDID
        }
    },
    "emoji": {
        "warning": "<:warning_emoji:868054485992357948>",
        "error":"<:error_emoji:868054485946224680>",
        "star":"<:GoldStar:905915895937892403>",
        "log":"<:log_emoji:868054485933625346>",
        "helpEmoji":"<:KannaSip:889543061821063189>",
        "helpCommands":"<:slash:913172347639435285>",
        "helpButtons":"<:button:913172562001928193>",
        "helpMenus":"<:dropdown_select:914106174754947113>",
        "github":"<:github:888155742719328276>",
        "discord":"<:DiscordLogoWhite:888158984475918368>",
        "plus":"<:plus:888072519582634075>",
        "minus":"<:minus:888072653003452516>",
        "applyCommandMembership":"<:idcard:950739003265654834>",
        "applyCommandStaff":"👮",
        "yes":"<:yesx:865887075509338122>",
        "no":"<:nox:865887075491643402>",
        "arrowLeft":"◀️",
        "arrowRight":"▶️"
    },
    "selectMenus": [
        {
            "name":UNIQUE_STRING,
            "description":STRING,
            "placeholder":STRING,
            "disabled":BOOLEAN,
            "maxValues":INTEGER,
            "minValues":INTEGER,
            "options":[
                {"value": "UNIQUE_STRING-example_name_1", "label": STRING, "description": STRING, "emoji": EMOJI_NAME},
                {"value": "UNIQUE_STRING-example_name_2", "label": STRING, "description": STRING, "emoji": EMOJI_NAME},
                {"value": "UNIQUE_STRING-example_name_3", "label": STRING, "description": STRING, "emoji": EMOJI_NAME},
                ...
            ],
            "actions": {
                "UNIQUE_STRING-example_name_1":{ "actionType":"toggleRole", "roleID":DISCORDID },
                "UNIQUE_STRING-example_name_2":{ "actionType":"removeRole", "roleID":DISCORDID },
                "UNIQUE_STRING-example_name_3":{ "actionType":"addRole", "roleID":DISCORDID },
                ...
            }
        },
        ...
    ],
    "modals":{
        "guildLeaveFeedback":{
            "enabled": BOOLEAN,
            "shortQuestion":{
                "enabled":BOOLEAN,
                "text":STRING,
                "placeholder":STRING,
                "minLength":INTEGER,
                "maxLength":INTEGER
            },
            "longQuestion":{
                "enabled":BOOLEAN,
                "text":STRING,
                "placeholder":STRING,
                "minLength":INTEGER,
                "maxLength":INTEGER
            }
        }
    },
    "tickets":{
        "enabled": BOOLEAN,
        "ticketTranscript": BOOLEAN,
        "userHasTranscript": BOOLEAN,
        "userCanClose": BOOLEAN,
        "categoryId":DISCORDID
    },
    "chatbridge":{
        "enabled":BOOLEAN,
        "channelId": DISCORDID,
        "webhook": "URL",
        "messagelogging": {
            "enabled":BOOLEAN,
            "channelId": DISCORDID
        },
        "relogOnKick": {
            "enabled": BOOLEAN,
            "relogAmount": INTEGER
        },
        "serverJoinLeaveMessages": {
            "enabled": BOOLEAN
        },
        "guildJoinLeaveMessages": {
            "enabled": BOOLEAN,
            "logging": BOOLEAN
        },
        "autoInviteOnApp": BOOLEAN
    },
    "url":{
        "guild_staff_application":"URL",
        "forums_post":"URL"
    },
    "guildAppReqs":{
        "textReqs": [
            STRING,
            STRING,
            ...
        ],
        "minNetworkLevel": INTEGER
    },
    "starboard":{
        "minimumCount": INTEGER
    }
}

```

**discordGuildId** is the ID of the discord server the bot operates in.

**hypixelGuildId** is the UUID of the hypixel guild.

**colours** is an object containing HEX values for various colours the bot uses. You can change these if you do not like the default ones.

**roles** is an object containing ID's of various discord roles.

- **guildMemberRole** is the role a guild member receives when their application is accepted.

- **helpers** are the roles that get pinged when an application is accepted so they can invite the member.

- **adminRole** is the administrator role.

**scheduledEvents** contains strings for various repeating scheduled tasks that are used by [node-schedule](https://www.npmjs.com/package/node-schedule). They are formatted like this:

```txt
*    *    *    *    *    *
┬    ┬    ┬    ┬    ┬    ┬
│    │    │    │    │    │
│    │    │    │    │    └ day of week (0 - 7) (0 or 7 is Sun)
│    │    │    │    └───── month (1 - 12)
│    │    │    └────────── day of month (1 - 31)
│    │    └─────────────── hour (0 - 23)
│    └──────────────────── minute (0 - 59)
└───────────────────────── second (0 - 59, OPTIONAL)
```

- **leaderboardDataUpdate**
Is used by the bot to determine the interval of time that should pass between every update of the guild leaderboard data.
The default is 1 minute (**\*/1 \* \* \* \***) meaning the data will be updated every minute, exactly on the minute.
For more complex configuration check the module's [repository on npmjs.com](https://www.npmjs.com/package/node-schedule).

**channels** contains ID's for various discord channels and categories the bot interacts with:

- **logChannelId** - channel used for general logs.

- **appChannelId** - channel used for membership application logs. Can be the same or separate as the default log channel.

- **queueChannelId** - channel used for the invite queue feature - when a member is to be invited, a message gets sent in this channel with their name and an easy to copy command for staff members to use. After they are invited, the message for that member can be easily deleted via a button.

- **starboardChannelId** - channel used for the starboard feature.

- **memberCount** - channels that act as member counts: discord being the discord server member count and guild being the hypixel guild member count.

**url** contains various URL's the bot uses.

- **guild_staff_application** is the URL of the staff application. This is sent when a user requests a staff application.

- **forums_post** is the guild's forums post. This is linked when a ticket is created.

**emoji** contains a list of various custom discord emoji you can change to your prefrence, if your bot does not have access to view the default ones.

**selectMenus** is an array of objects that describe custom select select menus that you can use instead of the classic reaction-role system for assigning roles. Every object should have the following attributes:

- **name** is the name and internal ID for the select menu, and as such it should be unique.

- **description** is the description of the select menu that will be shown in the /summon command when you try to create a select menu in a channel.

- **placeholder** is the placeholder for the select menu shown when none of the available options in the menu are selected.

- **disabled** is a true/false boolean that you can use to disable the select menu if needed

- **maxValues** sets the maximum amount of options that can be selected by the user at a time. Must be 0 or higher. Cannot be larger than the amount of options available, or an error will be thrown.

- **minValues** sets the minimum amount of options that can be selected by the user at a time. Must be 0 or higher. Cannot be larger than the amount of options available, or an error will be thrown.

- **options** is an array of objects describing the options in the select menu. Every option must have the following attributes:

  - value - a unique ID for this option

  - label - a label/name for this option

  - description - a description of this option

  - emoji - an emoji to use for this option or the discord ID of a custom emoji

- **actions** contains objects describing what action should be taken when any of the options in the menu are selected. The key of the objects inside of "actions" should match the value of the option in the options array. Every object should contain the following attributes:
  
  - actionType - What the bot should do when the option is selected. There are 3 possibilities:

    - toggleRole - Removes the role if the user has the role, or adds it if the user does not have the role.

    - addRole - Only attempts to add the role to the user no matter what

    - removeRole - Only attemts to remove the role from the user no matter what

  - roleID - the discord ID of the role you want to add/remove/toggle.

**modals** contains objects that contain settings for various modals

- **enabled** is a boolean (true/false) that enables and disables the feature

- **shortQuestion** is an object that contains configuration for the short question

  - enabled - is a boolean (true/false) that enables and disables the feature

  - text - the body text of the question

  - placeholder - placeholder string that sits in the field before any text is entered, e.g. an example answer

  - minLength - the minimum length of the text that can be entered into this field

  - maxLength - the maximum length of the text that can be entered into this field

- **longQuestion** is an object that contains configuration for the long question

  - enabled - is a boolean (true/false) that enables and disables the feature

  - text - the body text of the question

  - placeholder - placeholder string that sits in the field before any text is entered, e.g. an example answer

  - minLength - the minimum length of the text that can be entered into this field

  - maxLength - the maximum length of the text that can be entered into this field

**tickets** contains configuration for the bot's ticket system. The bot uses its own ticket system for guild applications. A button for opening tickets can be summoned using ``/summon ticket-button``. The /ticket command is intended for staff only and server permissions should be setup that way.

- **enabled** indicates whether the ticket system should be enabled or not.

- **ticketTranscript** indicates whether the ticket system should generate and log a transcript of the ticket once it is closed.

- **userHasTranscript** indicates whether the ticket system should generate and send a transcript of the ticket to the user once it is closed.

- **userCanClose** indicates whether the user can close the ticket using the close button or if only moderators can do that.

- **categoryId** is the discord ID of the category in which the ticket channel should be created.

**chatbridge** is a list of configuration options regarding the two way discord-minecraft chat bridge for the guild. This option requires a separate minecraft account so that the bot can be in the guild at all times sitting in limbo watching guildchat and relaying messages between /gc and a channel in your discord server.

- **enabled** is a boolean (true/false) that enables and disables the feature

- **channelId** is the ID of the discord channel you want to use for your chat bridge

- **webhook** is the URL of the webhook used for the chat bridge. The webhook must be within the channel defined in channelId for this feature to work properly.

- **messagelogging** allows you to log all raw messages to a channel. Should really only be used for debugging.

- **relogOnKick** allows the bot to re-login **relogAmount** of times after getting kicked from the server. The **relogAmount** limit exists to stop the account from getting accidentally banned for spam-logins in case some error occurs.

- **ServerJoinLeaveMessages** defines if the guild members logging on/off should be displayed in discord.

- **GuildJoinLeaveMessages** defines if members joining or leaving the guild should be displayed in discord. Aditionally, **Logging** defines if a copy of the message should be sent to the logs channel with extended information.

- **autoInviteOnApp** defines if members should be automatically invited by the minecraft bot once their applications in the discord server are successfull.

**guildAppReqs** defines settings used in the guild application process. **textReqs** is an array of strings that define simple requirements unenforceable by the bot. **minNetworkLevel** is the minimum hypixel network level required for members to be able to join.

**starboard** contains configuration options for the starboard feature

- **minimumCount** defines the minimum amount of stars a message needs before being sent to the starboard.

## MongoDB

This project requires an installation of MongoDB to function.

You can get a community server [here](https://www.mongodb.com/try/download/community).

You could alternatively also use [MongoDB atlas](https://www.mongodb.com/atlas).

The project uses [the official MongoDB module](https://www.npmjs.com/package/mongodb) to interact with the database.

The URL to the installation of the DB must contain the name of the database for it to function (check the Environmental variables section for more info)
