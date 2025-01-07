import {
    ApplicationCommandType,
    ContextMenuCommandBuilder,
    MessageContextMenuCommandInteraction,
    MessageFlags,
} from "discord.js";
import type { Command } from ".";
import { db } from "../db";
import { logEntries, logs as logs_table } from "../db/schema";
import { eq } from "drizzle-orm";
import { formatDate, stringToDate } from "../utils";

const cmd = new ContextMenuCommandBuilder()
    .setName("log")
    // @ts-ignore
    .setType(ApplicationCommandType.Message);

const execute = async (interaction: MessageContextMenuCommandInteraction) => {
    // We only want to let admins use this command
    if (!interaction.memberPermissions?.has("Administrator")) {
        await interaction.reply({
            content: "You need to be an admin to use this command!",
            flags: MessageFlags.Ephemeral,
        });
        return;
    }

    // Parse markdown into a format we understand
    const message = interaction.targetMessage.content.replaceAll("```", "");

    /** Get contents of markdown
     *
     * ## key
     * value
     *
     * ## key2
     * value2
     */
    const contents = new Map<string, string>();

    let currentKey = "";
    let currentValue = "";
    for (const line of message.split("\n")) {
        if (line === "" || line === "\n") {
            continue;
        }

        if (line.startsWith("## ")) {
            if (currentKey !== "") {
                contents.set(currentKey, currentValue.trim());
            }

            currentKey = line.substring(3);
            currentValue = "";
        } else {
            currentValue += line + "\n";
        }
    }

    if (currentKey !== "") {
        contents.set(currentKey, currentValue);
    }

    // Check if we found any logs
    if (contents.size === 0) {
        await interaction.reply("No logs found!");
        return;
    }

    // Get the date of the log by regex
    const content_date = message.match(/# (.*)\n/);

    // Check for valid date
    let date = new Date();

    if (content_date) {
        // Swap around to US format
        date = stringToDate(content_date[1]);
    }

    if (isNaN(date.getTime())) {
        date = new Date();
    }

    date.setHours(0, 0, 0, 0);

    // Check if logs already exist for this date
    const existingLogs = await db
        .select()
        .from(logs_table)
        .where(eq(logs_table.date, date))
        .execute();

    if (existingLogs.length > 0) {
        await db
            .delete(logEntries)
            .where(eq(logEntries.log_id, existingLogs[0].id))
            .execute();

        for (const [key, value] of contents) {
            await db
                .insert(logEntries)
                .values({
                    log_id: existingLogs[0].id,
                    subject: key,
                    body: value,
                })
                .execute();
        }

        await interaction.reply(
            `Logs already exist for ${formatDate(date)}, updated entries!`,
        );
        return;
    }

    // Save logs to database
    const user = interaction.user.tag;
    let currentDate = await db
        .insert(logs_table)
        .values({ user, date })
        .returning({ id: logs_table.id })
        .execute()
        .then((result) => result[0]);

    for (const [key, value] of contents) {
        await db
            .insert(logEntries)
            .values({ log_id: currentDate.id, subject: key, body: value })
            .execute();
    }

    await interaction.reply(
        `Saved ${contents.size} logs for ${formatDate(date)}!`,
    );
};

export const logs: Command = { cmd, execute };
