import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { supabaseAdmin } from '../lib/db';

async function main() {
  const { data: users, error: uErr } = await supabaseAdmin.from('users').select('*');
  console.log('=== USERS ===', users, uErr);

  const { data: accounts, error: aErr } = await supabaseAdmin.from('accounts').select('*');
  console.log('=== ACCOUNTS ===', accounts, aErr);

  const { data: snapshots, error: sErr } = await supabaseAdmin.from('snapshots').select('account_id, solved_total, taken_at');
  console.log('=== SNAPSHOTS ===', snapshots, sErr);
}

main().catch(console.error);
