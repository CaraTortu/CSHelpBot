import {
    ChatInputCommandInteraction,
    MessageFlags,
    SlashCommandBuilder,
    type APIEmbedField,
} from "discord.js";
import type { Command } from ".";
import { db } from "../db";
import { logEntries, logs } from "../db/schema";
import { eq, like } from "drizzle-orm";
import { stringToDate } from "../utils";
import { Pagination } from "pagination.djs";

const CHOICES: { name: string; value: string }[] = [
    { name: "Date", value: "date" },
    { name: "Module", value: "module" },
];

const cmd = new SlashCommandBuilder()
    .addStringOption((option) =>
        option
            .addChoices(CHOICES)
            .setName("query")
            .setDescription("The query to search for")
            .setRequired(true),
    )
    .addStringOption((option) =>
        option
            .setName("value")
            .setDescription("The value to search for")
            .setRequired(true),
    )
    .setName("search")
    .setDescription("Search for a log entry");

const dateSearch = async (
    interaction: ChatInputCommandInteraction,
    value: string,
) => {
    const date = stringToDate(value);

    if (isNaN(date.getTime())) {
        await interaction.reply({
            content: "Invalid date! Please make sure the format is DD/MM/YYYY",
            flags: MessageFlags.Ephemeral,
        });
        return;
    }

    const log = await db.query.logs.findFirst({
        where: eq(logs.date, date),
        with: { log_entries: true },
    });

    if (!log) {
        await interaction.reply({
            content: `No logs found for ${date.toDateString()}`,
            flags: MessageFlags.Ephemeral,
        });
        return;
    }

    const pagination = new Pagination(interaction, {
        limit: 5,
        loop: true,
    });

    pagination.setTitle(`Entries for ${date.toDateString()}`);

    const fields: APIEmbedField[] = log.log_entries.map((entry) => ({
        name: entry.subject,
        value: entry.body,
    }));

    pagination.setFields(fields);
    pagination.paginateFields();
    pagination.render();
};

const moduleSearch = async (
    interaction: ChatInputCommandInteraction,
    value: string,
) => {
    const entries = await db.query.logEntries.findMany({
        where: like(logEntries.subject, `%${value}%`),
        with: { log: true },
    });

    if (entries.length === 0) {
        await interaction.reply({
            content: `No logs found for ${value}`,
            flags: MessageFlags.Ephemeral,
        });
        return;
    }

    // Sort entries by date
    entries.sort((a, b) => {
        if (!a.log.date || !b.log.date) return 0;
        return b.log.date.getTime() - a.log.date.getTime();
    });

    const pagination = new Pagination(interaction, {
        limit: 5,
        loop: true,
    });

    pagination.setTitle(`Entries found for ${value}`);

    const fields: APIEmbedField[] = entries.map((entry) => ({
        name: `${entry.subject} - ${entry.log.date?.toDateString()}`,
        value: entry.body,
    }));

    pagination.setFields(fields);
    pagination.paginateFields();
    pagination.render();
};

const execute = async (interaction: ChatInputCommandInteraction) => {
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
            await interaction.reply({
                content: "Invalid query",
                flags: MessageFlags.Ephemeral,
            });
            return;
    }
};

export const search: Command = { cmd, execute };
