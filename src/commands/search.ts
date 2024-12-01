import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import type { Command } from ".";
import { db } from "../db";
import { logEntries, logs } from "../db/schema";
import { eq, like } from "drizzle-orm";
import { stringToDate } from "../utils";

const CHOICES: { name: string, value: string }[] = [
    { name: "Date", value: "date" },
    { name: "Module", value: "module" },
]

const cmd = new SlashCommandBuilder()
    .addStringOption(option =>
        option
            .addChoices(CHOICES)
            .setName("query")
            .setDescription("The query to search for")
            .setRequired(true))
    .addStringOption(option =>
        option
            .setName("value")
            .setDescription("The value to search for")
            .setRequired(true))
    .setName("search")
    .setDescription("Search for a log entry");

const dateSearch = async (interaction: CommandInteraction, value: string) => {
    const date = stringToDate(value);

    if (isNaN(date.getTime())) {
        await interaction.reply({ content: "Invalid date! Please make sure the format is DD/MM/YYYY", ephemeral: true });
        return;
    }

    const logs_found = await db.select().from(logs).where(eq(logs.date, date)).execute();

    if (logs_found.length === 0) {
        await interaction.reply({ content: `No logs found for ${date.toDateString()}`, ephemeral: true });
        return;
    }

    // Found logs, let's search the entries 
    const entries = await db.select().from(logEntries).where(eq(logEntries.log_id, logs_found[0].id)).execute();

    let response = `Found ${entries.length} entries for ${date.toDateString()}\`\`\`md\n`;

    for (const entry of entries) {
        response += `## ${entry.subject}\n${entry.body}\n\n`;
    }

    response += "```";

    await interaction.reply({ content: response, ephemeral: true });
}

const moduleSearch = async (interaction: CommandInteraction, value: string) => {
    const entries = await db.select().from(logEntries).where(like(logEntries.subject, `%${value}%`)).execute();

    if (entries.length === 0) {
        await interaction.reply({ content: `No logs found for ${value}`, ephemeral: true });
        return;
    }

    let response = `Found ${entries.length} entries for ${value}\`\`\`md\n`;

    for (const entry of entries) {
        const date = await db.query.logs.findFirst({ where: eq(logs.id, entry.log_id) }).then(log => log?.date);
        response += `## ${entry.subject} - ${date?.toDateString()}\n${entry.body}\n`;
    }

    response += "```";

    await interaction.reply({ content: response, ephemeral: true });
}

const execute = async (interaction: CommandInteraction) => {
    const query_value = interaction.options.get("query", true).value;
    const value = interaction.options.get("value", true).value as string;

    switch (query_value) {
        case "date":
            await dateSearch(interaction, value);
            break;
        case "module":
            await moduleSearch(interaction, value);
            break;
        default:
            await interaction.reply({ content: "Invalid query", ephemeral: true });
            return
    }
}

export const search: Command = { cmd, execute }
