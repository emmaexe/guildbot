# ⚠️ This project is archived

Guildbot is no longer being actively maintained

I no longer have enough time to play hypixel and have lost interest in this project. I might come back to it at some point in the future but for now it will no longer recieve any support/updates.

<br><br>

---

<h1 align="center">Guildbot - a bot for minecraft hypixel guilds</h1>
<p>
  <img src="https://img.shields.io/badge/node-18.x-blue.svg" />
  <a href="https://github.com/emmaexe/guildbot/wiki" target="_blank">
    <img alt="Documentation" src="https://img.shields.io/badge/documentation-yes-brightgreen.svg" />
  </a>
  <a href="https://github.com/emmaexe/guildbot/graphs/commit-activity" target="_blank">
    <img alt="Maintenance" src="https://img.shields.io/badge/Maintained%3F-no-red.svg" />
  </a>
  <a href="https://github.com/emmaexe/guildbot/blob/main/LICENSE" target="_blank">
    <img alt="License: GPL--3.0" src="https://img.shields.io/github/license/emmaexe/guildbot" />
  </a>
</p>

> Discord bot for hypixel guilds. Offers automatic applications with in-game requirements, displaying guild and player statistics, a guild chat to discord two-way bridge and more.

### 🏠 [Repository](https://github.com/emmaexe/guildbot)

## **Dependencies**

- MongoDB server
- NodeJS 18.x
  - compare-versions
  - discord-html-transcripts
  - discord.js
  - dotenv
  - mineflayer
  - mongodb
  - node-schedule

## **Installation**

### **From source**

Download or clone the [latest release](https://github.com/emmaexe/guildbot/releases/latest).

Enter the directory and run:

```sh
npm install
```

### **Using Docker**

Pull the latest guildbot image

```sh
docker pull emmaexe/guildbot
```

Download the [docker-compose.yml](https://github.com/emmaexe/guildbot/blob/main/docker-compose.yml) file.

In the `docker-compose.yml` file, under volumes define a valid path for the config folder on your server where guildbot config files will be exposed for easy access. (e.g. `/home/server/.config/guildbot:/app/config:rw`)

## **Setup/configuration**

For instructions on how to set the bot up, check out the [SETUP.md](https://github.com/emmaexe/guildbot/blob/main/SETUP.md) file.

## **Usage**

### **Installed from source**

Run this command in the root directory of the cloned repository:

```sh
node .
```

### **Installed using docker**

Run the command in the directory where your `docker-compose.yml` file is stored:

```sh
docker compose up -d
```

## **Author**

👤 **Emmaexe**

* Github: [@emmaexe](https://ln.emmaexe.moe/github)
* Discord: [@emmaexe](https://ln.emmaexe.moe/discord-server)

## 🤝 Contributing

Contributions, issues and feature requests are welcome!<br />Feel free to check [issues page](https://github.com/emmaexe/guildbot/issues). You can also take a look at the [contributing guide](https://github.com/emmaexe/guildbot/blob/main/CONTRIBUTING.md).

## Show your support

Give a ⭐️ if this project helped you!

## 📝 License

This project is [GPL-3.0-only](https://github.com/emmaexe/guildbot/blob/main/LICENSE) licensed.
