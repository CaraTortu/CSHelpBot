import {
    ChatInputCommandInteraction,
    MessageFlags,
    SlashCommandBuilder,
    type APIEmbedField,
} from "discord.js";
import type { Command } from ".";
import { Pagination } from "pagination.djs";
import { db } from "../db";

const cmd = new SlashCommandBuilder()
    .setName("all")
    .setDescription("Returns all logs");

const execute = async (interaction: ChatInputCommandInteraction) => {
    const pagination = new Pagination(interaction, {
        limit: 5,
        loop: true,
    });
    pagination.setTitle("All logs");

    const entries = await db.query.logEntries.findMany({
        with: { log: true },
    });

    if (entries.length === 0) {
        await interaction.reply({
            content: "No logs found",
            flags: MessageFlags.Ephemeral,
        });
        return;
    }

    // Sort entries by date
    entries.sort((a, b) => {
        if (!a.log.date || !b.log.date) return 0;
        return b.log.date.getTime() - a.log.date.getTime();
    });

    const fields: APIEmbedField[] = entries.map((entry) => ({
        name: `${entry.subject} - ${entry.log.date?.toDateString()}`,
        value: entry.body,
    }));

    pagination.setFields(fields);
    pagination.paginateFields();
    pagination.render();
};

export const all: Command = { cmd, execute };
