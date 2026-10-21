export interface MockHint {
  tier: number;
  title: string;
  content: string;
}

export interface MockTestCase {
  id: number;
  input: string;
  expectedOutput: string;
  isCustom?: boolean;
}

export interface MockQuestion {
  id: string;
  title: string;
  company: 'Google' | 'Amazon' | 'Meta' | 'Microsoft';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  description: string;
  constraints: string[];
  examples: {
    input: string;
    output: string;
    explanation?: string;
  }[];
  starterCode: Record<string, string>;
  hints: MockHint[];
  testCases: MockTestCase[];
  optimalComplexity: {
    time: string;
    space: string;
  };
}

export const MOCK_QUESTIONS: MockQuestion[] = [
  {
    id: 'google-meeting-rooms-ii',
    title: 'Meeting Rooms II (Min Conference Rooms)',
    company: 'Google',
    difficulty: 'Medium',
    category: 'Intervals & Priority Queues',
    description: `Given an array of meeting time intervals \`intervals\` where \`intervals[i] = [start_i, end_i]\`, return the *minimum number of conference rooms* required to hold all meetings without overlaps.`,
    constraints: [
      '1 <= intervals.length <= 10^4',
      '0 <= start_i < end_i <= 10^6',
    ],
    examples: [
      {
        input: 'intervals = [[0,30],[5,10],[15,20]]',
        output: '2',
        explanation: 'Room 1 holds [0, 30]. Room 2 holds [5, 10] and [15, 20]. Minimum 2 rooms required.',
      },
      {
        input: 'intervals = [[7,10],[2,4]]',
        output: '1',
        explanation: 'Meetings do not overlap, so only 1 room is required.',
      },
    ],
    starterCode: {
      python: `class Solution:
    def minMeetingRooms(self, intervals: list[list[int]]) -> int:
        # Write your optimal solution here
        pass`,
      cpp: `#include <vector>
#include <queue>
#include <algorithm>

class Solution {
public:
    int minMeetingRooms(std::vector<std::vector<int>>& intervals) {
        // Write your optimal solution here
        return 0;
    }
};`,
      java: `import java.util.*;

class Solution {
    public int minMeetingRooms(int[][] intervals) {
        // Write your optimal solution here
        return 0;
    }
}`,
      typescript: `function minMeetingRooms(intervals: number[][]): number {
    // Write your optimal solution here
    return 0;
}`,
    },
    hints: [
      {
        tier: 1,
        title: 'High-Level Intuition',
        content: 'Think about each meeting as two separate events: a start event (+1 room needed) and an end event (-1 room freed).',
      },
      {
        tier: 2,
        title: 'Key Data Structure',
        content: 'Sort start times and end times separately, or use a Min-Heap (Priority Queue) to store end times of ongoing meetings.',
      },
      {
        tier: 3,
        title: 'Optimal Approach',
        content: 'Sort intervals by start time. Iterate through intervals and check if the earliest ending meeting (heap top) has finished before the current meeting starts. If yes, pop it. Always push current end time. The maximum heap size is your answer in O(N log N) time and O(N) space.',
      },
    ],
    testCases: [
      { id: 1, input: '[[0,30],[5,10],[15,20]]', expectedOutput: '2' },
      { id: 2, input: '[[7,10],[2,4]]', expectedOutput: '1' },
      { id: 3, input: '[[1,5],[2,6],[3,7],[4,8]]', expectedOutput: '4' },
      { id: 4, input: '[[1,4],[4,8],[8,12]]', expectedOutput: '1' },
    ],
    optimalComplexity: {
      time: 'O(N log N)',
      space: 'O(N)',
    },
  },
  {
    id: 'amazon-lru-cache',
    title: 'Design In-Memory LRU Cache',
    company: 'Amazon',
    difficulty: 'Medium',
    category: 'Design & Doubly Linked List',
    description: `Design a data structure that follows the constraints of a **Least Recently Used (LRU) cache**.

Implement the \`LRUCache\` class:
- \`LRUCache(int capacity)\` Initialize the LRU cache with positive size \`capacity\`.
- \`int get(int key)\` Return the value of the \`key\` if the key exists, otherwise return \`-1\`.
- \`void put(int key, int value)\` Update the value of the \`key\` if it exists. Otherwise, add the key-value pair to the cache. If the number of keys exceeds the \`capacity\`, evict the least recently used key.

Both \`get\` and \`put\` must run in **O(1) average time complexity**.`,
    constraints: [
      '1 <= capacity <= 3000',
      '0 <= key <= 10^4',
      '0 <= value <= 10^5',
      'At most 2 * 10^5 calls will be made to get and put.',
    ],
    examples: [
      {
        input: 'LRUCache(2); put(1, 1); put(2, 2); get(1); put(3, 3); get(2);',
        output: '[null, null, null, 1, null, -1]',
        explanation: 'key 2 was evicted because key 1 was accessed by get(1), making key 2 the least recently used.',
      },
    ],
    starterCode: {
      python: `class LRUCache:
    def __init__(self, capacity: int):
        self.capacity = capacity

    def get(self, key: int) -> int:
        pass

    def put(self, key: int, value: int) -> None:
        pass`,
      cpp: `#include <unordered_map>
#include <list>

class LRUCache {
public:
    LRUCache(int capacity) {
        
    }
    
    int get(int key) {
        return -1;
    }
    
    void put(int key, int value) {
        
    }
};`,
      java: `import java.util.*;

class LRUCache {
    public LRUCache(int capacity) {
        
    }
    
    public int get(int key) {
        return -1;
    }
    
    public void put(int key, int value) {
        
    }
}`,
      typescript: `class LRUCache {
    constructor(capacity: number) {

    }

    get(key: number): number {
        return -1;
    }

    put(key: number, value: number): void {

    }
}`,
    },
    hints: [
      {
        tier: 1,
        title: 'High-Level Intuition',
        content: 'To achieve O(1) for both lookup and eviction, a simple array or linked list alone is not enough.',
      },
      {
        tier: 2,
        title: 'Key Data Structure',
        content: 'Combine a Hash Map (for O(1) key-to-node lookup) with a Doubly Linked List (for O(1) removal and insertion at head/tail).',
      },
      {
        tier: 3,
        title: 'Optimal Approach',
        content: 'Maintain pseudo-head and pseudo-tail dummy nodes. On get(key), move the accessed node to the front. On put(key, val), if key exists update and move to front; if new, insert at front. If size > capacity, remove node right before the tail dummy node.',
      },
    ],
    testCases: [
      { id: 1, input: 'capacity=2, put(1,1), put(2,2), get(1)', expectedOutput: '1' },
      { id: 2, input: 'put(3,3), get(2)', expectedOutput: '-1' },
      { id: 3, input: 'put(4,4), get(1)', expectedOutput: '-1' },
    ],
    optimalComplexity: {
      time: 'O(1) for get and put',
      space: 'O(capacity)',
    },
  },
  {
    id: 'meta-subarray-sum-equals-k',
    title: 'Subarray Sum Equals K',
    company: 'Meta',
    difficulty: 'Medium',
    category: 'Prefix Sums & Hash Tables',
    description: `Given an array of integers \`nums\` and an integer \`k\`, return *the total number of subarrays whose sum equals to \`k\`*.

A subarray is a contiguous **non-empty** sequence of elements within an array.`,
    constraints: [
      '1 <= nums.length <= 2 * 10^4',
      '-1000 <= nums[i] <= 1000',
      '-10^7 <= k <= 10^7',
    ],
    examples: [
      {
        input: 'nums = [1,1,1], k = 2',
        output: '2',
        explanation: 'Subarrays [1,1] from index 0 to 1 and index 1 to 2 both sum to 2.',
      },
      {
        input: 'nums = [1,2,3], k = 3',
        output: '2',
        explanation: 'Subarrays [1,2] and [3] both sum to 3.',
      },
    ],
    starterCode: {
      python: `class Solution:
    def subarraySum(self, nums: list[int], k: int) -> int:
        pass`,
      cpp: `#include <vector>
#include <unordered_map>

class Solution {
public:
    int subarraySum(std::vector<int>& nums, int k) {
        return 0;
    }
};`,
      java: `import java.util.*;

class Solution {
    public int subarraySum(int[] nums, int k) {
        return 0;
    }
}`,
      typescript: `function subarraySum(nums: number[], k: number): number {
    return 0;
}`,
    },
    hints: [
      {
        tier: 1,
        title: 'High-Level Intuition',
        content: 'Because numbers can be negative, standard two-pointer sliding window does NOT work (expanding window may decrease sum).',
      },
      {
        tier: 2,
        title: 'Key Data Structure',
        content: 'Use Prefix Sums combined with a Hash Map storing the frequencies of cumulative sums seen so far.',
      },
      {
        tier: 3,
        title: 'Optimal Approach',
        content: 'Let prefix_sum[i] be sum from 0 to i. A subarray sum from j to i equals k if prefix_sum[i] - prefix_sum[j-1] == k. Thus, check if (prefix_sum[i] - k) exists in the map. Runs in O(N) time and O(N) space.',
      },
    ],
    testCases: [
      { id: 1, input: 'nums = [1,1,1], k = 2', expectedOutput: '2' },
      { id: 2, input: 'nums = [1,2,3], k = 3', expectedOutput: '2' },
      { id: 3, input: 'nums = [-1,-1,1], k = 0', expectedOutput: '1' },
      { id: 4, input: 'nums = [1,-1,0], k = 0', expectedOutput: '3' },
    ],
    optimalComplexity: {
      time: 'O(N)',
      space: 'O(N)',
    },
  },
  {
    id: 'microsoft-word-search-ii',
    title: 'Word Search II (Boggle with Trie)',
    company: 'Microsoft',
    difficulty: 'Hard',
    category: 'Tries & Backtracking DFS',
    description: `Given an \`m x n\` board of characters and a list of strings \`words\`, return *all words on the board*.

Each word must be constructed from letters of sequentially adjacent cells, where adjacent cells are horizontally or vertically neighboring. The same letter cell may not be used more than once in a word.`,
    constraints: [
      'm == board.length',
      'n == board[i].length',
      '1 <= m, n <= 12',
      '1 <= words.length <= 3 * 10^4',
      '1 <= words[i].length <= 10',
    ],
    examples: [
      {
        input: 'board = [["o","a","a","n"],["e","t","a","e"],["i","h","k","r"],["i","f","l","v"]], words = ["oath","pea","eat","rain"]',
        output: '["eat","oath"]',
      },
    ],
    starterCode: {
      python: `class Solution:
    def findWords(self, board: list[list[str]], words: list[str]) -> list[str]:
        pass`,
      cpp: `#include <vector>
#include <string>

class Solution {
public:
    std::vector<std::string> findWords(std::vector<std::vector<char>>& board, std::vector<std::string>& words) {
        return {};
    }
};`,
      java: `import java.util.*;

class Solution {
    public List<String> findWords(char[][] board, String[] words) {
        return new ArrayList<>();
    }
}`,
      typescript: `function findWords(board: string[][], words: string[]): string[] {
    return [];
}`,
    },
    hints: [
      {
        tier: 1,
        title: 'High-Level Intuition',
        content: 'Searching for each word individually on the board results in massive redundant traversals. Instead, search for all words simultaneously.',
      },
      {
        tier: 2,
        title: 'Key Data Structure',
        content: 'Insert all dictionary words into a Prefix Tree (Trie). Walk the board and the Trie simultaneously.',
      },
      {
        tier: 3,
        title: 'Optimal Approach',
        content: 'Build the Trie. Run DFS backtracking from each cell. If the current character is not in the current Trie node child, prune immediately. When word is found, append to output and remove word marker to avoid duplicates.',
      },
    ],
    testCases: [
      { id: 1, input: 'board = [["o","a","a","n"],["e","t","a","e"],["i","h","k","r"],["i","f","l","v"]], words = ["oath","pea","eat","rain"]', expectedOutput: '["eat","oath"]' },
      { id: 2, input: 'board = [["a","b"],["c","d"]], words = ["abcb"]', expectedOutput: '[]' },
    ],
    optimalComplexity: {
      time: 'O(M * N * 4 * 3^(L-1))',
      space: 'O(Total characters in words for Trie)',
    },
  },
];
