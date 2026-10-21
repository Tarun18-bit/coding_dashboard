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

export const INITIAL_CLANS: Clan[] = [
  {
    id: 'faang-aspirants',
    name: 'FAANG Aspirants 2025',
    tagline: 'Grinding Striver SDE sheet and LeetCode Mediums daily for upcoming summer placements.',
    avatar: '🚀',
    category: 'FAANG Prep',
    memberCount: 14,
    weeklyTarget: 120,
    currentWeekSolves: 88,
    members: [
      {
        userId: '1',
        username: 'txrun_18',
        rank: 1,
        solvedThisWeek: 18,
        totalSolved: 26,
        currentStreak: 12,
        bestPlatform: 'LeetCode',
        role: 'Leader',
      },
      {
        userId: '2',
        username: 'oggy_18',
        rank: 2,
        solvedThisWeek: 14,
        totalSolved: 34,
        currentStreak: 9,
        bestPlatform: 'Codeforces',
        role: 'Elder',
      },
      {
        userId: '3',
        username: 'algo_zenith',
        rank: 3,
        solvedThisWeek: 12,
        totalSolved: 142,
        currentStreak: 6,
        bestPlatform: 'CodeChef',
        role: 'Member',
      },
      {
        userId: '4',
        username: 'byte_ninja',
        rank: 4,
        solvedThisWeek: 9,
        totalSolved: 89,
        currentStreak: 4,
        bestPlatform: 'LeetCode',
        role: 'Member',
      },
    ],
    activities: [
      {
        id: 'a1',
        username: 'txrun_18',
        action: 'solved Trapping Rain Water on LeetCode',
        timestamp: '15m ago',
        badge: 'Hard',
      },
      {
        id: 'a2',
        username: 'oggy_18',
        action: 'participated in Codeforces Round 980 (Div. 2)',
        timestamp: '2h ago',
        badge: 'Contest',
      },
      {
        id: 'a3',
        username: 'algo_zenith',
        action: 'unlocked DP Wizard RPG Badge',
        timestamp: '4h ago',
        badge: 'Achievement',
      },
    ],
  },
  {
    id: 'night-owls-cf',
    name: 'Midnight Codeforces Crew',
    tagline: 'Div 2 & Div 3 contest regulars. We discuss solutions after midnight rounds.',
    avatar: '🦉',
    category: 'Competitive',
    memberCount: 22,
    weeklyTarget: 150,
    currentWeekSolves: 112,
    members: [
      {
        userId: '5',
        username: 'speed_demon',
        rank: 1,
        solvedThisWeek: 21,
        totalSolved: 310,
        currentStreak: 18,
        bestPlatform: 'Codeforces',
        role: 'Leader',
      },
      {
        userId: '6',
        username: 'matrix_hacker',
        rank: 2,
        solvedThisWeek: 16,
        totalSolved: 240,
        currentStreak: 11,
        bestPlatform: 'CodeChef',
        role: 'Elder',
      },
    ],
    activities: [
      {
        id: 'b1',
        username: 'speed_demon',
        action: 'achieved Expert rating (1612) on Codeforces',
        timestamp: '1d ago',
        badge: 'Rating Peak',
      },
    ],
  },
  {
    id: 'iit-grinders',
    name: 'IIT Campus Coders',
    tagline: 'Campus batch cohort preparing for top MNC on-campus coding rounds.',
    avatar: '🎓',
    category: 'University',
    memberCount: 35,
    weeklyTarget: 200,
    currentWeekSolves: 165,
    members: [
      {
        userId: '7',
        username: 'campus_champ',
        rank: 1,
        solvedThisWeek: 24,
        totalSolved: 420,
        currentStreak: 30,
        bestPlatform: 'LeetCode',
        role: 'Leader',
      },
    ],
    activities: [
      {
        id: 'c1',
        username: 'campus_champ',
        action: 'completed Blind 75 Roadmap (75/75)',
        timestamp: '2d ago',
        badge: 'Mastery',
      },
    ],
  },
];
