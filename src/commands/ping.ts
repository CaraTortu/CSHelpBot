import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import type { Command } from ".";

const cmd = new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Replies with Pong!");

const execute = async (interaction: CommandInteraction) => {
    await interaction.reply(`Ping is ${interaction.client.ws.ping}ms`);
};

export const ping: Command = { cmd, execute };
