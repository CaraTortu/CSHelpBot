import { env } from "bun"
import { drizzle } from "drizzle-orm/node-postgres"
import * as schema from "./schema"

if (!env.DATABASE_URL) {
    throw new Error("Missing environment variable: DATABASE_URL")
}

export const db = drizzle({
    connection: env.DATABASE_URL,
    schema
})
