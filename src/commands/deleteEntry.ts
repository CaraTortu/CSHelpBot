import {
    CommandInteraction,
    MessageFlags,
    SlashCommandBuilder,
} from "discord.js";
import type { Command } from ".";
import { stringToDate } from "../utils";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { logs } from "../db/schema";

const cmd = new SlashCommandBuilder()
    .addStringOption((option) =>
        option
            .setName("date")
            .setDescription("The date of the entry (DD/MM/YYYY)")
            .setRequired(true),
    )
    .setName("delete")
    .setDescription("Deletes an entry");

const execute = async (interaction: CommandInteraction) => {
    // We only want to let admins use this command
    if (!interaction.memberPermissions?.has("Administrator")) {
        await interaction.reply({
            content: "You need to be an admin to use this command!",
            flags: MessageFlags.Ephemeral,
        });
        return;
    }

    const date = stringToDate(
        interaction.options.get("date", true).value as string,
    );

    if (isNaN(date.getTime())) {
        await interaction.reply({
            content: "Invalid date! Please make sure the format is DD/MM/YYYY",
            flags: MessageFlags.Ephemeral,
        });
        return;
    }

    const result = await db.delete(logs).where(eq(logs.date, date)).execute();
    if (result.rowCount === 0) {
        await interaction.reply({
            content: "No entries found for that date!",
            flags: MessageFlags.Ephemeral,
        });
        return;
    }

    // Delete the entry
    await interaction.reply({
        content: "Deleted entry!",
        flags: MessageFlags.Ephemeral,
    });
};

export const deleteEntry: Command = { cmd, execute };
