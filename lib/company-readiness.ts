export interface CompanyProfile {
  id: string;
  name: string;
  tagline: string;
  logoColor: string;
  badgeBg: string;
  badgeText: string;
  difficultyTarget: {
    easy: number;
    medium: number;
    hard: number;
  };
  // Topic weights normalized to 100
  topicWeights: Record<string, number>;
  // Curated representative questions asked frequently
  recommendedProblems: {
    title: string;
    topic: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    platform: 'leetcode' | 'codeforces';
    url: string;
  }[];
}

export interface TopicReadiness {
  topic: string;
  userSolved: number;
  targetCount: number;
  matchScore: number; // 0 to 100
  weight: number;
}

export interface CompanyReadinessResult {
  company: CompanyProfile;
  overallScore: number; // 0 to 100
  status: 'Interview Ready' | 'Near Ready' | 'Needs Practice' | 'Foundational Gap';
  statusColor: string;
  topicBreakdown: TopicReadiness[];
  topGaps: {
    topic: string;
    gapCount: number;
    potentialBoost: number; // e.g. +14% score increase
  }[];
  curatedSuggestions: CompanyProfile['recommendedProblems'];
}

export const TARGET_COMPANIES: CompanyProfile[] = [
  {
    id: 'google',
    name: 'Google',
    tagline: 'Complex DP, Graphs, Trees & Advanced Thinking',
    logoColor: '#EA4335',
    badgeBg: 'bg-[#EA4335]/15 border-[#EA4335]/30',
    badgeText: 'text-[#EA4335]',
    difficultyTarget: { easy: 20, medium: 50, hard: 20 },
    topicWeights: {
      'dynamic programming': 25,
      'graphs': 20,
      'trees': 18,
      'arrays': 12,
      'binary search': 10,
      'dfs/bfs': 10,
      'two pointers': 5,
    },
    recommendedProblems: [
      {
        title: 'Word Break II',
        topic: 'dynamic programming',
        difficulty: 'Hard',
        platform: 'leetcode',
        url: 'https://leetcode.com/problems/word-break-ii/',
      },
      {
        title: 'Course Schedule II',
        topic: 'graphs',
        difficulty: 'Medium',
        platform: 'leetcode',
        url: 'https://leetcode.com/problems/course-schedule-ii/',
      },
      {
        title: 'Lowest Common Ancestor of a Binary Tree',
        topic: 'trees',
        difficulty: 'Medium',
        platform: 'leetcode',
        url: 'https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/',
      },
      {
        title: 'Find Median from Data Stream',
        topic: 'graphs',
        difficulty: 'Hard',
        platform: 'leetcode',
        url: 'https://leetcode.com/problems/find-median-from-data-stream/',
      },
    ],
  },
  {
    id: 'amazon',
    name: 'Amazon',
    tagline: 'Hash Tables, Trees, Strings & Sliding Window',
    logoColor: '#FF9900',
    badgeBg: 'bg-[#FF9900]/15 border-[#FF9900]/30',
    badgeText: 'text-[#FF9900]',
    difficultyTarget: { easy: 30, medium: 50, hard: 10 },
    topicWeights: {
      'hash table': 22,
      'arrays': 20,
      'trees': 18,
      'sliding window': 14,
      'strings': 12,
      'two pointers': 8,
      'dynamic programming': 6,
    },
    recommendedProblems: [
      {
        title: 'LRU Cache',
        topic: 'hash table',
        difficulty: 'Medium',
        platform: 'leetcode',
        url: 'https://leetcode.com/problems/lru-cache/',
      },
      {
        title: 'K Closest Points to Origin',
        topic: 'arrays',
        difficulty: 'Medium',
        platform: 'leetcode',
        url: 'https://leetcode.com/problems/k-closest-points-to-origin/',
      },
      {
        title: 'Longest Substring Without Repeating Characters',
        topic: 'sliding window',
        difficulty: 'Medium',
        platform: 'leetcode',
        url: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/',
      },
      {
        title: 'Number of Islands',
        topic: 'dfs/bfs',
        difficulty: 'Medium',
        platform: 'leetcode',
        url: 'https://leetcode.com/problems/number-of-islands/',
      },
    ],
  },
  {
    id: 'meta',
    name: 'Meta',
    tagline: 'High Speed: Binary Search, Intervals, Graphs & Two Pointers',
    logoColor: '#0081FB',
    badgeBg: 'bg-[#0081FB]/15 border-[#0081FB]/30',
    badgeText: 'text-[#0081FB]',
    difficultyTarget: { easy: 25, medium: 55, hard: 15 },
    topicWeights: {
      'binary search': 20,
      'two pointers': 18,
      'trees': 18,
      'graphs': 15,
      'arrays': 14,
      'dynamic programming': 10,
      'strings': 5,
    },
    recommendedProblems: [
      {
        title: 'Valid Palindrome II',
        topic: 'two pointers',
        difficulty: 'Easy',
        platform: 'leetcode',
        url: 'https://leetcode.com/problems/valid-palindrome-ii/',
      },
      {
        title: 'Kth Largest Element in an Array',
        topic: 'arrays',
        difficulty: 'Medium',
        platform: 'leetcode',
        url: 'https://leetcode.com/problems/kth-largest-element-in-an-array/',
      },
      {
        title: 'Minimum Remove to Make Valid Parentheses',
        topic: 'strings',
        difficulty: 'Medium',
        platform: 'leetcode',
        url: 'https://leetcode.com/problems/minimum-remove-to-make-valid-parentheses/',
      },
      {
        title: 'Binary Tree Right Side View',
        topic: 'trees',
        difficulty: 'Medium',
        platform: 'leetcode',
        url: 'https://leetcode.com/problems/binary-tree-right-side-view/',
      },
    ],
  },
  {
    id: 'microsoft',
    name: 'Microsoft',
    tagline: 'Linked Lists, Strings, DFS/BFS & Array Traversals',
    logoColor: '#00A4EF',
    badgeBg: 'bg-[#00A4EF]/15 border-[#00A4EF]/30',
    badgeText: 'text-[#00A4EF]',
    difficultyTarget: { easy: 35, medium: 45, hard: 10 },
    topicWeights: {
      'arrays': 22,
      'strings': 20,
      'linked list': 18,
      'trees': 16,
      'hash table': 12,
      'dfs/bfs': 8,
      'dynamic programming': 4,
    },
    recommendedProblems: [
      {
        title: 'Reverse Linked List',
        topic: 'linked list',
        difficulty: 'Easy',
        platform: 'leetcode',
        url: 'https://leetcode.com/problems/reverse-linked-list/',
      },
      {
        title: 'Group Anagrams',
        topic: 'strings',
        difficulty: 'Medium',
        platform: 'leetcode',
        url: 'https://leetcode.com/problems/group-anagrams/',
      },
      {
        title: 'Spiral Matrix',
        topic: 'arrays',
        difficulty: 'Medium',
        platform: 'leetcode',
        url: 'https://leetcode.com/problems/spiral-matrix/',
      },
      {
        title: 'Copy List with Random Pointer',
        topic: 'linked list',
        difficulty: 'Medium',
        platform: 'leetcode',
        url: 'https://leetcode.com/problems/copy-list-with-random-pointer/',
      },
    ],
  },
  {
    id: 'uber',
    name: 'Uber',
    tagline: 'Graphs, System Data Structures & Monotonic Queues',
    logoColor: '#FFFFFF',
    badgeBg: 'bg-white/10 border-white/30',
    badgeText: 'text-white',
    difficultyTarget: { easy: 15, medium: 55, hard: 25 },
    topicWeights: {
      'graphs': 25,
      'arrays': 20,
      'dynamic programming': 18,
      'hash table': 15,
      'sliding window': 12,
      'trees': 10,
    },
    recommendedProblems: [
      {
        title: 'Bus Routes',
        topic: 'graphs',
        difficulty: 'Hard',
        platform: 'leetcode',
        url: 'https://leetcode.com/problems/bus-routes/',
      },
      {
        title: 'Meeting Rooms II',
        topic: 'arrays',
        difficulty: 'Medium',
        platform: 'leetcode',
        url: 'https://leetcode.com/problems/meeting-rooms-ii/',
      },
      {
        title: 'Design Underground System',
        topic: 'hash table',
        difficulty: 'Medium',
        platform: 'leetcode',
        url: 'https://leetcode.com/problems/design-underground-system/',
      },
    ],
  },
];

/**
 * Normalizes user topic strings into standard company interview categories
 */
export function normalizeTag(tag: string): string {
  const t = tag.toLowerCase().trim();
  if (t.includes('dynamic') || t === 'dp') return 'dynamic programming';
  if (t.includes('graph')) return 'graphs';
  if (t.includes('tree') || t.includes('bst')) return 'trees';
  if (t.includes('array') || t.includes('sorting') || t.includes('math')) return 'arrays';
  if (t.includes('search') || t.includes('binary search')) return 'binary search';
  if (t.includes('two pointers') || t.includes('pointer')) return 'two pointers';
  if (t.includes('window') || t.includes('sliding')) return 'sliding window';
  if (t.includes('string')) return 'strings';
  if (t.includes('hash') || t.includes('map') || t.includes('set')) return 'hash table';
  if (t.includes('dfs') || t.includes('bfs') || t.includes('traversal')) return 'dfs/bfs';
  if (t.includes('list') || t.includes('linked list')) return 'linked list';
  return t;
}

/**
 * Computes readiness metrics for all target companies based on user solves and topic frequencies
 */
export function calculateCompanyReadiness(
  userTopics: { tag: string; count: number }[],
  totalSolved: number,
  difficultyBreakdown: { easy: number; medium: number; hard: number }
): CompanyReadinessResult[] {
  // Aggregate user counts into normalized topic buckets
  const normalizedUserCounts: Record<string, number> = {};
  for (const item of userTopics) {
    const key = normalizeTag(item.tag);
    normalizedUserCounts[key] = (normalizedUserCounts[key] || 0) + item.count;
  }

  return TARGET_COMPANIES.map((company) => {
    let weightedScoreSum = 0;
    const topicBreakdown: TopicReadiness[] = [];
    const gaps: { topic: string; gapCount: number; potentialBoost: number }[] = [];

    // Evaluate each weighted topic
    for (const [topic, weight] of Object.entries(company.topicWeights)) {
      const userCount = normalizedUserCounts[topic] || 0;
      // Recommended benchmark for readiness: ~6 to 12 targeted solves per key topic
      const targetCount = Math.max(4, Math.round((weight / 100) * 35));
      const matchScore = Math.min(100, Math.round((userCount / targetCount) * 100));

      weightedScoreSum += (matchScore * weight) / 100;

      topicBreakdown.push({
        topic,
        userSolved: userCount,
        targetCount,
        matchScore,
        weight,
      });

      if (matchScore < 60) {
        const gapCount = Math.max(1, targetCount - userCount);
        const potentialBoost = Math.round(((targetCount - userCount) / targetCount) * weight);
        gaps.push({ topic, gapCount, potentialBoost });
      }
    }

    // Difficulty weighting factor:
    // Company target ratio gives extra credit for Medium/Hard solves
    const medRatio = totalSolved > 0 ? (difficultyBreakdown.medium + difficultyBreakdown.hard * 1.5) / totalSolved : 0;
    const difficultyMultiplier = Math.min(1.15, Math.max(0.7, 0.7 + medRatio * 0.4));

    const finalRawScore = Math.round(weightedScoreSum * difficultyMultiplier);
    const overallScore = Math.min(98, Math.max(totalSolved > 0 ? 12 : 5, finalRawScore));

    let status: CompanyReadinessResult['status'] = 'Foundational Gap';
    let statusColor = 'text-[#FF5A65] bg-[#FF5A65]/15 border-[#FF5A65]/30';

    if (overallScore >= 75) {
      status = 'Interview Ready';
      statusColor = 'text-[#14CA74] bg-[#14CA74]/15 border-[#14CA74]/30';
    } else if (overallScore >= 55) {
      status = 'Near Ready';
      statusColor = 'text-[#00C2FF] bg-[#00C2FF]/15 border-[#00C2FF]/30';
    } else if (overallScore >= 35) {
      status = 'Needs Practice';
      statusColor = 'text-[#FDB52A] bg-[#FDB52A]/15 border-[#FDB52A]/30';
    }

    // Sort gaps by highest potential boost
    gaps.sort((a, b) => b.potentialBoost - a.potentialBoost);

    return {
      company,
      overallScore,
      status,
      statusColor,
      topicBreakdown: topicBreakdown.sort((a, b) => b.weight - a.weight),
      topGaps: gaps.slice(0, 3),
      curatedSuggestions: company.recommendedProblems,
    };
  });
}
