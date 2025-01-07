import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";
import { configDotenv } from "dotenv";

configDotenv();
const env = process.env;

if (!env.DATABASE_URL) {
    throw new Error("Missing environment variable: DATABASE_URL");
}

export const db = drizzle({
    connection: env.DATABASE_URL,
    schema,
});
