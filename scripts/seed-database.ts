#!/usr/bin/env node

/**
 * Script to seed fake users and AI boyfriends into the database
 * This creates test data so you can see matches on the matches page
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ ERROR: Missing environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function seedDatabase() {
  console.log('🚀 Starting database seed...\n');

  // Read and execute AI boyfriends migration
  console.log('📝 Seeding AI Boyfriends...');
  const aiBoyfriendsSQL = fs.readFileSync(
    path.join(process.cwd(), 'supabase/migrations/20251120000002_seed_ai_boyfriends.sql'),
    'utf8'
  );
  
  const { error: aiError } = await supabase.rpc('exec_sql', { sql: aiBoyfriendsSQL });
  
  if (aiError) {
    // Try direct query if RPC doesn't exist
    const { error: directAiError } = await supabase.from('ai_boyfriends').select('count').limit(1);
    if (directAiError) {
      console.error('❌ Error checking AI boyfriends:', directAiError);
    } else {
      console.log('✅ AI Boyfriends (migration may need manual application via Supabase Dashboard)');
    }
  } else {
    console.log('✅ AI Boyfriends seeded successfully');
  }

  // Read and execute fake users migration
  console.log('\n📝 Seeding Fake Users...');
  const fakeUsersSQL = fs.readFileSync(
    path.join(process.cwd(), 'supabase/migrations/20251120000003_seed_fake_users.sql'),
    'utf8'
  );
  
  const { error: usersError } = await supabase.rpc('exec_sql', { sql: fakeUsersSQL });
  
  if (usersError) {
    // Try direct insert if RPC doesn't exist
    const { error: directUsersError } = await supabase.from('users').select('count').limit(1);
    if (directUsersError) {
      console.error('❌ Error checking users:', directUsersError);
    } else {
      console.log('✅ Fake Users (migration may need manual application via Supabase Dashboard)');
    }
  } else {
    console.log('✅ Fake Users seeded successfully');
  }

  // Check results
  console.log('\n📊 Checking seeded data...\n');
  
  const { data: aiBoyfriends, error: aiBfError } = await supabase
    .from('ai_boyfriends')
    .select('name')
    .eq('active', true);
  
  if (!aiBfError && aiBoyfriends) {
    console.log(`✅ AI Boyfriends in database: ${aiBoyfriends.length}`);
    aiBoyfriends.forEach(bf => console.log(`   - ${bf.name}`));
  }
  
  const { data: users, error: usersCheckError } = await supabase
    .from('users')
    .select('full_name, is_online')
    .limit(15);
  
  if (!usersCheckError && users) {
    console.log(`\n✅ Users in database: ${users.length}`);
    users.slice(0, 10).forEach(user => console.log(`   - ${user.full_name} ${user.is_online ? '🟢' : '⚪'}`));
    if (users.length > 10) {
      console.log(`   ... and ${users.length - 10} more`);
    }
  }

  console.log('\n🎉 Database seed completed!');
  console.log('\n📋 Next Steps:');
  console.log('1. If you see "migration may need manual application" above:');
  console.log('   - Go to Supabase Dashboard > SQL Editor');
  console.log('   - Copy the content from supabase/migrations/20251120000002_seed_ai_boyfriends.sql');
  console.log('   - Paste and run it in the SQL Editor');
  console.log('   - Do the same for 20251120000003_seed_fake_users.sql');
  console.log('2. Navigate to /matches page to see the seeded users and AI boyfriends');
}

seedDatabase().catch(console.error);
