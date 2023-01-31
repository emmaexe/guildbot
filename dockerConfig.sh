#!/bin/ash
if [[ -f "$(pwd)/config/.env" && -f "$(pwd)/config/config.json" ]]; then
    node .
else
    echo The bot was not started due to missing configuration files. The files will now be generated \for you. Please configure the bot before re-starting it.
    if [[ -f "$(pwd)/config-template/.env.template" && -f "$(pwd)/config-template/config.json.template" ]]; then
        if [ -d "$(pwd)/config" ]; then
            if [ ! -f "$(pwd)/config/.env" ]; then
                cp "$(pwd)/config-template/.env.template" "$(pwd)/config/.env"
                echo Generated .env file.
            fi
            if [ ! -f "$(pwd)/config/config.json" ]; then
                cp "$(pwd)/config-template/config.json.template" "$(pwd)/config/config.json"
                echo Generated config.json file.
            fi  
        else
            mkdir config
            echo Generated config directory.
            cp "$(pwd)/config-template/.env.template" "$(pwd)/config/.env"
            echo Generated .env file.
            cp "$(pwd)/config-template/config.json.template" "$(pwd)/config/config.json"
            echo Generated config.json file.
        fi
    else
        echo Configuration templates missing. Please reinstall.
    fi 
fi