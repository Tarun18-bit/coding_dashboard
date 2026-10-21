import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { codechefFetcher } from '../lib/platforms/codechef';

async function test() {
  console.log('Fetching profile for txrun_18...');
  const profile = await codechefFetcher.fetchProfile('txrun_18');
  console.log('CODECHEF PROFILE:', profile);

  console.log('Fetching contests for txrun_18...');
  const contests = await codechefFetcher.fetchContests('txrun_18');
  console.log('CODECHEF CONTESTS:', contests);

  console.log('Fetching recent submissions for txrun_18...');
  const subs = await codechefFetcher.fetchRecentSubmissions('txrun_18');
  console.log('CODECHEF SUBS:', subs);
}

test().catch(console.error);
