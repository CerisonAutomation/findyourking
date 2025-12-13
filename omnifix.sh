#!/bin/bash
set -e

echo "--- Cleaning workspace ---"
rm -rf node_modules package-lock.json yarn.lock

echo "--- Installing dependencies using pnpm ---"
pnpm install

echo "--- Adding Supabase CLI as a dev dependency ---"
pnpm add -D supabase

echo "--- Creating .env.local file ---"
echo 'NEXT_PUBLIC_SUPABASE_URL=https://voxzezzqhctprqwwplks.supabase.co' > .env.local
echo 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable__tuFYf05rkKTdGeHCzSJ6A_aQt4bULQ' >> .env.local

echo "--- Workspace has been fixed successfully! ---"
