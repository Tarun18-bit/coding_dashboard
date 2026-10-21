import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { supabaseAdmin } from '../lib/db';

async function verifyDatabase() {
  console.log(`\n========================================`);
  console.log(`Checking Supabase Database Records`);
  console.log(`========================================\n`);

  try {
    const { data: users, error: uErr } = await supabaseAdmin.from('users').select('*');
    if (uErr) {
      console.error('❌ Supabase Connection / Query Failed:', uErr.message);
      console.log('\nMake sure:');
      console.log('1. NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
      console.log('2. schema.sql was executed in Supabase SQL editor.');
      return;
    }
    console.log(`✓ Connection successful!`);
    console.log(`✓ Users in DB: ${users?.length || 0}`);

    const { data: accounts } = await supabaseAdmin.from('accounts').select('*');
    console.log(`✓ Accounts in DB: ${accounts?.length || 0}`);
    accounts?.forEach(a => console.log(`   - [${a.platform}] ${a.handle} (Last synced: ${a.last_synced_at || 'Never'})`));

    const { data: snapshots } = await supabaseAdmin.from('snapshots').select('*').order('taken_at', { ascending: false }).limit(5);
    console.log(`✓ Snapshots in DB: ${snapshots?.length || 0}`);
    snapshots?.forEach(s => console.log(`   - Solved: ${s.solved_total} (E: ${s.easy}, M: ${s.medium}, H: ${s.hard}) | Rating: ${s.rating}`));

    const { count: contestCount } = await supabaseAdmin.from('contests').select('*', { count: 'exact', head: true });
    console.log(`✓ Total Contests stored: ${contestCount || 0}`);

    const { count: subCount } = await supabaseAdmin.from('submissions').select('*', { count: 'exact', head: true });
    console.log(`✓ Total Submissions stored: ${subCount || 0}`);

    console.log(`\n========================================\n`);
  } catch (error: unknown) {
    console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
  }
}

verifyDatabase();
