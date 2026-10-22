export interface CompanyProblem {
  title: string;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  platform: 'leetcode' | 'codeforces';
  url: string;
  verifiedRound: string; // e.g. "Google OA 2024 (SWE Intern)", "Amazon SDE-1 OA"
  sourceName: string; // e.g. "CodinzHub", "LeetCode Discuss", "Reddit r/leetcode"
  sourceUrl?: string; // Direct link or verification tag reference
  frequency?: 'Top 1% Asked' | 'High Frequency' | 'Recent 2024-2025 OA' | 'Core Interview Standard';
  notes?: string;
}

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
  recommendedProblems: CompanyProblem[];
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
  curatedSuggestions: CompanyProblem[];
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
        title: 'Course Schedule II',
        topic: 'graphs',
        difficulty: 'Medium',
        platform: 'leetcode',
        url: 'https://leetcode.com/problems/course-schedule-ii/',
        verifiedRound: 'Google Online Assessment (OA) & Onsite Round 1',
        sourceName: 'CodinzHub Google OA',
        sourceUrl: 'https://www.codinzhub.com/',
        frequency: 'Top 1% Asked',
        notes: 'Top topological sort question in Google hiring assessments',
      },
      {
        title: 'Word Break II',
        topic: 'dynamic programming',
        difficulty: 'Hard',
        platform: 'leetcode',
        url: 'https://leetcode.com/problems/word-break-ii/',
        verifiedRound: 'Google SWE Onsite Round 2 (DP & Backtracking)',
        sourceName: 'LeetCode Discuss (Google Tagged)',
        sourceUrl: 'https://leetcode.com/discuss/interview-question?currentPage=1&orderBy=hot&query=google',
        frequency: 'High Frequency',
        notes: 'Classic Google trie/memoization pattern challenge',
      },
      {
        title: 'Meeting Rooms II',
        topic: 'arrays',
        difficulty: 'Medium',
        platform: 'leetcode',
        url: 'https://leetcode.com/problems/meeting-rooms-ii/',
        verifiedRound: 'Google Campus OA 2024 (Intervals)',
        sourceName: 'CodinzHub / Reddit r/csmajors',
        sourceUrl: 'https://www.codinzhub.com/',
        frequency: 'Recent 2024-2025 OA',
        notes: 'Frequently tested in Google SWE Intern/New Grad screening',
      },
      {
        title: 'Lowest Common Ancestor of a Binary Tree',
        topic: 'trees',
        difficulty: 'Medium',
        platform: 'leetcode',
        url: 'https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/',
        verifiedRound: 'Google Technical Phone Screen',
        sourceName: 'LeetCode Discuss',
        sourceUrl: 'https://leetcode.com/discuss/interview-question?currentPage=1&orderBy=hot&query=google',
        frequency: 'Core Interview Standard',
        notes: 'Recurring baseline problem across all Google SWE ladders',
      },
      {
        title: 'Find Median from Data Stream',
        topic: 'graphs',
        difficulty: 'Hard',
        platform: 'leetcode',
        url: 'https://leetcode.com/problems/find-median-from-data-stream/',
        verifiedRound: 'Google L4 Software Engineer Loop',
        sourceName: 'CodinzHub / Reddit r/leetcode',
        sourceUrl: 'https://www.codinzhub.com/',
        frequency: 'High Frequency',
        notes: 'Two-heaps optimization problem heavily tested at Google',
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
        verifiedRound: 'Amazon SDE-1 & SDE-2 Virtual Onsite (All-Time #1)',
        sourceName: 'CodinzHub Amazon Experience',
        sourceUrl: 'https://www.codinzhub.com/',
        frequency: 'Top 1% Asked',
        notes: 'The single most recorded question in Amazon interview history',
      },
      {
        title: 'Capacity To Ship Packages Within D Days',
        topic: 'binary search',
        difficulty: 'Medium',
        platform: 'leetcode',
        url: 'https://leetcode.com/problems/capacity-to-ship-packages-within-d-days/',
        verifiedRound: 'Amazon SDE Online Assessment (OA 2024/2025)',
        sourceName: 'CodinzHub Amazon OA Drive',
        sourceUrl: 'https://www.codinzhub.com/',
        frequency: 'Recent 2024-2025 OA',
        notes: 'Direct match for Amazon logistics / delivery capacity OA questions',
      },
      {
        title: 'Number of Islands',
        topic: 'dfs/bfs',
        difficulty: 'Medium',
        platform: 'leetcode',
        url: 'https://leetcode.com/problems/number-of-islands/',
        verifiedRound: 'Amazon SDE Technical Round 1',
        sourceName: 'LeetCode Discuss (Amazon Tagged)',
        sourceUrl: 'https://leetcode.com/discuss/interview-question?currentPage=1&orderBy=hot&query=amazon',
        frequency: 'Core Interview Standard',
        notes: 'Benchmark 2D grid traversal problem for Amazon technical loops',
      },
      {
        title: 'Sum of Subarray Minimums',
        topic: 'arrays',
        difficulty: 'Medium',
        platform: 'leetcode',
        url: 'https://leetcode.com/problems/sum-of-subarray-minimums/',
        verifiedRound: 'Amazon Fulfillment SDE Online Assessment',
        sourceName: 'CodinzHub / Reddit r/csmajors',
        sourceUrl: 'https://www.codinzhub.com/',
        frequency: 'Recent 2024-2025 OA',
        notes: 'Signature monotonic stack problem frequently reported in Amazon OA',
      },
      {
        title: 'Longest Substring Without Repeating Characters',
        topic: 'sliding window',
        difficulty: 'Medium',
        platform: 'leetcode',
        url: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/',
        verifiedRound: 'Amazon SDE Phone Screen',
        sourceName: 'CodinzHub / LeetCode Discuss',
        sourceUrl: 'https://www.codinzhub.com/',
        frequency: 'High Frequency',
        notes: 'Top sliding window pattern assessment',
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
        title: 'Kth Largest Element in an Array',
        topic: 'arrays',
        difficulty: 'Medium',
        platform: 'leetcode',
        url: 'https://leetcode.com/problems/kth-largest-element-in-an-array/',
        verifiedRound: 'Meta Technical Phone Screen (Quickselect Speed Test)',
        sourceName: 'CodinzHub / LeetCode Discuss',
        sourceUrl: 'https://www.codinzhub.com/',
        frequency: 'Top 1% Asked',
        notes: 'Meta requires O(N) Quickselect expected solution within 20 mins',
      },
      {
        title: 'Subarray Sum Equals K',
        topic: 'hash table',
        difficulty: 'Medium',
        platform: 'leetcode',
        url: 'https://leetcode.com/problems/subarray-sum-equals-k/',
        verifiedRound: 'Meta E4/E5 Technical Interview Round 1',
        sourceName: 'CodinzHub Meta Tagged',
        sourceUrl: 'https://www.codinzhub.com/',
        frequency: 'Top 1% Asked',
        notes: 'Prefix sum + hash map combination most asked at Meta',
      },
      {
        title: 'Minimum Remove to Make Valid Parentheses',
        topic: 'strings',
        difficulty: 'Medium',
        platform: 'leetcode',
        url: 'https://leetcode.com/problems/minimum-remove-to-make-valid-parentheses/',
        verifiedRound: 'Meta Technical Phone Screen',
        sourceName: 'Reddit r/leetcode (Meta Interview Experiences)',
        sourceUrl: 'https://www.reddit.com/r/leetcode/',
        frequency: 'High Frequency',
        notes: 'Standard Meta stack/string cleanup question',
      },
      {
        title: 'Valid Palindrome II',
        topic: 'two pointers',
        difficulty: 'Easy',
        platform: 'leetcode',
        url: 'https://leetcode.com/problems/valid-palindrome-ii/',
        verifiedRound: 'Meta Warm-up Coding Assessment',
        sourceName: 'LeetCode Discuss',
        sourceUrl: 'https://leetcode.com/discuss/interview-question?currentPage=1&orderBy=hot&query=meta',
        frequency: 'Core Interview Standard',
        notes: 'Frequent 10-minute warm-up question before a Medium/Hard problem',
      },
      {
        title: 'Binary Tree Right Side View',
        topic: 'trees',
        difficulty: 'Medium',
        platform: 'leetcode',
        url: 'https://leetcode.com/problems/binary-tree-right-side-view/',
        verifiedRound: 'Meta Virtual Onsite (Coding Round 2)',
        sourceName: 'CodinzHub / LeetCode Discuss',
        sourceUrl: 'https://www.codinzhub.com/',
        frequency: 'High Frequency',
        notes: 'BFS level-order / DFS depth-tracking tree assessment',
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
        title: 'Spiral Matrix',
        topic: 'arrays',
        difficulty: 'Medium',
        platform: 'leetcode',
        url: 'https://leetcode.com/problems/spiral-matrix/',
        verifiedRound: 'Microsoft Codility Online Assessment & Round 1',
        sourceName: 'CodinzHub Microsoft OA',
        sourceUrl: 'https://www.codinzhub.com/',
        frequency: 'Top 1% Asked',
        notes: 'Core boundary traversal question frequently given in Codility OAs',
      },
      {
        title: 'Reverse Linked List',
        topic: 'linked list',
        difficulty: 'Easy',
        platform: 'leetcode',
        url: 'https://leetcode.com/problems/reverse-linked-list/',
        verifiedRound: 'Microsoft Campus Technical Screen',
        sourceName: 'LeetCode Discuss',
        sourceUrl: 'https://leetcode.com/discuss/interview-question?currentPage=1&orderBy=hot&query=microsoft',
        frequency: 'Core Interview Standard',
        notes: 'Pointer manipulation fundamental standard in Microsoft rounds',
      },
      {
        title: 'Group Anagrams',
        topic: 'strings',
        difficulty: 'Medium',
        platform: 'leetcode',
        url: 'https://leetcode.com/problems/group-anagrams/',
        verifiedRound: 'Microsoft SDE Technical Interview Round 2',
        sourceName: 'CodinzHub / LeetCode Discuss',
        sourceUrl: 'https://www.codinzhub.com/',
        frequency: 'High Frequency',
        notes: 'String hashing and sorting frequency test',
      },
      {
        title: 'Copy List with Random Pointer',
        topic: 'linked list',
        difficulty: 'Medium',
        platform: 'leetcode',
        url: 'https://leetcode.com/problems/copy-list-with-random-pointer/',
        verifiedRound: 'Microsoft Technical Loop (Deep Copy)',
        sourceName: 'LeetCode Discuss (Microsoft Tagged)',
        sourceUrl: 'https://leetcode.com/discuss/interview-question?currentPage=1&orderBy=hot&query=microsoft',
        frequency: 'High Frequency',
        notes: 'Classic Microsoft pointer re-wiring and hash map problem',
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
        verifiedRound: 'Uber SDE-2 Technical Onsite (Transit Network BFS)',
        sourceName: 'CodinzHub / Reddit r/leetcode',
        sourceUrl: 'https://www.codinzhub.com/',
        frequency: 'Top 1% Asked',
        notes: 'Direct transit simulation graph problem asked at Uber',
      },
      {
        title: 'Design Underground System',
        topic: 'hash table',
        difficulty: 'Medium',
        platform: 'leetcode',
        url: 'https://leetcode.com/problems/design-underground-system/',
        verifiedRound: 'Uber Machine Coding / System Data Structures',
        sourceName: 'LeetCode Discuss (Uber Tagged)',
        sourceUrl: 'https://leetcode.com/discuss/interview-question?currentPage=1&orderBy=hot&query=uber',
        frequency: 'High Frequency',
        notes: 'Tests average travel time metric calculations and check-in maps',
      },
      {
        title: 'Course Schedule',
        topic: 'graphs',
        difficulty: 'Medium',
        platform: 'leetcode',
        url: 'https://leetcode.com/problems/course-schedule/',
        verifiedRound: 'Uber SDE Technical Screening',
        sourceName: 'CodinzHub Uber Prep',
        sourceUrl: 'https://www.codinzhub.com/',
        frequency: 'High Frequency',
        notes: 'Cycle detection in directed dispatch networks',
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
