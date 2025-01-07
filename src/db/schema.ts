import { relations } from "drizzle-orm";
import {
    pgTableCreator,
    text,
    timestamp,
    uuid,
    varchar,
} from "drizzle-orm/pg-core";

const newTable = pgTableCreator((table) => `discord_bot_${table}`);

export const logs = newTable("logs", {
    id: uuid("id").defaultRandom().primaryKey(),
    date: timestamp("date").notNull(),
    user: varchar("user", { length: 255 }).notNull(),
});

export const logs_relations = relations(logs, ({ many }) => ({
    log_entries: many(logEntries),
}));

export const logEntries = newTable("log_entries", {
    id: uuid("id").defaultRandom().primaryKey(),
    log_id: uuid("logId")
        .references(() => logs.id, { onUpdate: "cascade", onDelete: "cascade" })
        .notNull(),
    subject: varchar("subject", { length: 255 }).notNull(),
    body: text("body").notNull(),
});

export const logEntries_relations = relations(logEntries, ({ one }) => ({
    log: one(logs, {
        fields: [logEntries.log_id],
        references: [logs.id],
    }),
}));
