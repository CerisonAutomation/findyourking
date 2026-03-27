/**
 * Drizzle Configuration
 * Database schema generation and migrations
 */

import {defineConfig} from 'drizzle-kit'
import {config} from 'dotenv'

config({path: '.env.local'})

export default defineConfig({
    schema: './src/lib/db/schema.ts',
    out: './drizzle',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.POSTGRES_URL!
    },
    verbose: true,
    strict: true,
    tablesFilter: ['zenith_*']
})