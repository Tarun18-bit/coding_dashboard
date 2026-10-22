export interface ClanMember {
  userId: string;
  username: string;
  rank: number;
  solvedThisWeek: number;
  totalSolved: number;
  currentStreak: number;
  bestPlatform: string;
  role: 'Leader' | 'Elder' | 'Member';
}

export interface ClanActivity {
  id: string;
  username: string;
  action: string;
  timestamp: string;
  badge?: string;
}

export interface Clan {
  id: string;
  name: string;
  tagline: string;
  avatar: string;
  category: 'University' | 'FAANG Prep' | 'Competitive' | 'Casual';
  memberCount: number;
  weeklyTarget: number;
  currentWeekSolves: number;
  members: ClanMember[];
  activities: ClanActivity[];
}

export const INITIAL_CLANS: Clan[] = [];
