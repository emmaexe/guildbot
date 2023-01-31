const discord = require('discord.js')
const config = require('./config/config.json')

module.exports = {
    async execute(client, interaction) {
        let member = await interaction.member;
        let menuConfig = config.selectMenus.find(menu => menu.name === interaction.customId);
        try {
            if (!interaction.values[0]) {
                await interaction.reply({
                    content: 'None of the options were selected. Nothing happened.',
                    ephemeral: true
                })
            } else {
                let addedCounter = 0;
                let removedCounter = 0;
                for (let i = 0; i < interaction.values.length; i++) {
                    let menuValue = interaction.values[i]
                    if (member.roles.cache.has(menuConfig.actions[menuValue].roleID)) {
                        if (menuConfig.actions[menuValue].actionType == "toggleRole" || menuConfig.actions[menuValue].actionType == "removeRole") {
                            await member.roles.remove(menuConfig.actions[menuValue].roleID)
                            removedCounter++;
                        }
                    } else {
                        if (menuConfig.actions[menuValue].actionType == "toggleRole" || menuConfig.actions[menuValue].actionType == "addRole") {
                            await member.roles.add(menuConfig.actions[menuValue].roleID)
                            addedCounter++;
                        }
                    }
                }
                await interaction.reply({
                    content: `${config.emoji.plus} Applied - **${addedCounter}** roles\n${config.emoji.minus} Removed - **${removedCounter}** roles.`,
                    ephemeral: true
                })
            }
        } catch (err) { console.error(err); }
    }
}