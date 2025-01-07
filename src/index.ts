import { configDotenv } from "dotenv";
import { commands } from "./commands/index";
import { Client, MessageFlags, REST, Routes } from "discord.js";

configDotenv();
const { DISCORD_TOKEN, DISCORD_CLIENT_ID } = process.env;

if (!DISCORD_TOKEN || !DISCORD_CLIENT_ID) {
    throw new Error("Missing environment variables");
}

const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);

/**
 * Create client
 */

const client = new Client({ intents: ["Guilds", "GuildMessages"] });

/**
 * Register client commands
 */

client.once("ready", async () => {
    console.log("Registering commands...");

    try {
        await rest.put(Routes.applicationCommands(DISCORD_CLIENT_ID), {
            body: commands.map(({ cmd }) => cmd),
        });
    } catch (error) {
        console.error(error);
        client.destroy();
    }

    console.log("Ready!");
});

/**
 * Handle command interactions
 */

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand() && !interaction.isUserContextMenuCommand())
        return;

    const command = commands.find(
        ({ cmd }) => cmd.name === interaction.commandName,
    );
    if (!command) return;

    try {
        // @ts-ignore
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({
            content: "There was an error while executing this command!",
            flags: MessageFlags.Ephemeral,
        });
    }
});

client.login(DISCORD_TOKEN);
