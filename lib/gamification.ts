export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji or icon name
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  isUnlocked: boolean;
  progress: number; // 0 to 100
  currentValue: number;
  targetValue: number;
}

export interface SkillNode {
  id: string;
  name: string;
  category: string;
  level: number; // 1 to 5
  maxLevel: number;
  solvedCount: number;
  requiredForNext: number;
  isUnlocked: boolean;
  isMaxed: boolean;
}

export interface RpgProfile {
  level: number;
  title: string;
  totalXp: number;
  currentLevelXp: number;
  nextLevelXp: number;
  xpProgressPercent: number;
  badges: Badge[];
  skillNodes: SkillNode[];
}

export function computeRpgProfile(
  totalSolved: number,
  difficultyBreakdown: { easy: number; medium: number; hard: number },
  streaks: { currentStreak: number; longestStreak: number },
  topicBreakdown: { tag: string; count: number }[],
  accountsCount: number,
  companyReadinessMaxPercent: number
): RpgProfile {
  // 1. Calculate XP
  const easyXp = (difficultyBreakdown.easy || 0) * 15;
  const medXp = (difficultyBreakdown.medium || 0) * 35;
  const hardXp = (difficultyBreakdown.hard || 0) * 80;
  const streakXp = (streaks.longestStreak || 0) * 25;
  const totalSolvedXp = totalSolved * 20;

  const totalXp = easyXp + medXp + hardXp + streakXp + totalSolvedXp;

  // Level formula: Level = floor(sqrt(totalXp / 100)) + 1
  const level = Math.max(1, Math.floor(Math.sqrt(totalXp / 120)) + 1);

  // XP for current and next level
  const currentBaseXp = Math.floor(Math.pow(level - 1, 2) * 120);
  const nextBaseXp = Math.floor(Math.pow(level, 2) * 120);
  const levelSpan = nextBaseXp - currentBaseXp;
  const currentLevelXp = Math.max(0, totalXp - currentBaseXp);
  const nextLevelXp = Math.max(1, levelSpan);
  const xpProgressPercent = Math.min(100, Math.round((currentLevelXp / nextLevelXp) * 100));

  // Determine Title
  let title = 'Novice Byte';
  if (level >= 40) title = 'Mythic Compiler God';
  else if (level >= 30) title = 'Grandmaster Coder';
  else if (level >= 20) title = 'Algorithm Architect';
  else if (level >= 10) title = 'Data Structure Knight';
  else if (level >= 5) title = 'Algo Apprentice';

  // Topic lookup map
  const topicMap: Record<string, number> = {};
  for (const t of topicBreakdown) {
    topicMap[t.tag.toLowerCase()] = (topicMap[t.tag.toLowerCase()] || 0) + t.count;
  }

  const getTopicCount = (name: string) => {
    let count = 0;
    const lower = name.toLowerCase();
    for (const [k, v] of Object.entries(topicMap)) {
      if (k.includes(lower)) count += v;
    }
    return count;
  };

  // 2. Badges List
  const badges: Badge[] = [
    {
      id: 'first-blood',
      name: 'First Blood',
      description: 'Solved your first competitive programming problem',
      icon: '⚔️',
      rarity: 'Common',
      isUnlocked: totalSolved >= 1,
      progress: Math.min(100, (totalSolved / 1) * 100),
      currentValue: totalSolved,
      targetValue: 1,
    },
    {
      id: 'century-club',
      name: 'Century Club',
      description: 'Solve 100+ combined problems across platforms',
      icon: '💯',
      rarity: 'Rare',
      isUnlocked: totalSolved >= 100,
      progress: Math.min(100, (totalSolved / 100) * 100),
      currentValue: totalSolved,
      targetValue: 100,
    },
    {
      id: 'speed-demon',
      name: 'Speed Demon',
      description: 'Solve 20+ Easy problems to master syntax and basics',
      icon: '⚡',
      rarity: 'Common',
      isUnlocked: difficultyBreakdown.easy >= 20,
      progress: Math.min(100, (difficultyBreakdown.easy / 20) * 100),
      currentValue: difficultyBreakdown.easy,
      targetValue: 20,
    },
    {
      id: 'algo-mind',
      name: 'Algorithmic Mind',
      description: 'Solve 25+ Medium problems (core interview tier)',
      icon: '🧠',
      rarity: 'Rare',
      isUnlocked: difficultyBreakdown.medium >= 25,
      progress: Math.min(100, (difficultyBreakdown.medium / 25) * 100),
      currentValue: difficultyBreakdown.medium,
      targetValue: 25,
    },
    {
      id: 'grandmaster-slayer',
      name: 'Grandmaster Slayer',
      description: 'Solve 5+ Hard problems',
      icon: '💀',
      rarity: 'Epic',
      isUnlocked: difficultyBreakdown.hard >= 5,
      progress: Math.min(100, (difficultyBreakdown.hard / 5) * 100),
      currentValue: difficultyBreakdown.hard,
      targetValue: 5,
    },
    {
      id: 'streak-beast',
      name: 'Streak Beast',
      description: 'Maintain an active daily streak of 7+ days',
      icon: '🔥',
      rarity: 'Rare',
      isUnlocked: streaks.currentStreak >= 7,
      progress: Math.min(100, (streaks.currentStreak / 7) * 100),
      currentValue: streaks.currentStreak,
      targetValue: 7,
    },
    {
      id: 'tri-platform',
      name: 'Tri-Platform Titan',
      description: 'Connect Codeforces, LeetCode, and CodeChef handles',
      icon: '🌐',
      rarity: 'Epic',
      isUnlocked: accountsCount >= 3,
      progress: Math.min(100, (accountsCount / 3) * 100),
      currentValue: accountsCount,
      targetValue: 3,
    },
    {
      id: 'faang-ready',
      name: 'FAANG Ready',
      description: 'Achieve 70%+ Readiness score in any top tech company',
      icon: '🏢',
      rarity: 'Legendary',
      isUnlocked: companyReadinessMaxPercent >= 70,
      progress: Math.min(100, (companyReadinessMaxPercent / 70) * 100),
      currentValue: companyReadinessMaxPercent,
      targetValue: 70,
    },
    {
      id: 'dp-wizard',
      name: 'DP Wizard',
      description: 'Conquer 10+ Dynamic Programming questions',
      icon: '🧙‍♂️',
      rarity: 'Epic',
      isUnlocked: getTopicCount('dynamic') >= 10,
      progress: Math.min(100, (getTopicCount('dynamic') / 10) * 100),
      currentValue: getTopicCount('dynamic'),
      targetValue: 10,
    },
    {
      id: 'graph-voyager',
      name: 'Graph Voyager',
      description: 'Solve 10+ Graph Theory & Traversal problems',
      icon: '🕸️',
      rarity: 'Rare',
      isUnlocked: getTopicCount('graph') >= 10,
      progress: Math.min(100, (getTopicCount('graph') / 10) * 100),
      currentValue: getTopicCount('graph'),
      targetValue: 10,
    },
  ];

  // 3. Skill Tree Nodes
  const treeConfig = [
    { id: 'arrays', name: 'Arrays & Strings', category: 'Fundamentals', target: 'array' },
    { id: 'hash', name: 'Hash Tables', category: 'Fundamentals', target: 'hash' },
    { id: 'pointers', name: 'Two Pointers & Window', category: 'Algorithms', target: 'pointer' },
    { id: 'bsearch', name: 'Binary Search', category: 'Algorithms', target: 'search' },
    { id: 'trees', name: 'Trees & BST', category: 'Data Structures', target: 'tree' },
    { id: 'heaps', name: 'Heaps & Priority Queues', category: 'Data Structures', target: 'heap' },
    { id: 'graphs', name: 'Graph Theory & BFS/DFS', category: 'Advanced', target: 'graph' },
    { id: 'dp', name: 'Dynamic Programming', category: 'Advanced', target: 'dynamic' },
    { id: 'greedy', name: 'Greedy & Backtracking', category: 'Advanced', target: 'greedy' },
  ];

  const skillNodes: SkillNode[] = treeConfig.map((item) => {
    const count = getTopicCount(item.target);
    // Level 1 = 2 solves, Level 2 = 5, Level 3 = 10, Level 4 = 20, Level 5 = 35
    const thresholds = [2, 5, 10, 20, 35];
    let nodeLevel = 0;
    for (let i = 0; i < thresholds.length; i++) {
      if (count >= thresholds[i]) {
        nodeLevel = i + 1;
      }
    }

    const nextThreshold = thresholds[nodeLevel] || thresholds[thresholds.length - 1];

    return {
      id: item.id,
      name: item.name,
      category: item.category,
      level: nodeLevel,
      maxLevel: 5,
      solvedCount: count,
      requiredForNext: nextThreshold,
      isUnlocked: count > 0,
      isMaxed: nodeLevel >= 5,
    };
  });

  return {
    level,
    title,
    totalXp,
    currentLevelXp,
    nextLevelXp,
    xpProgressPercent,
    badges,
    skillNodes,
  };
}
