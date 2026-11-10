import type { RunnerSpec } from '@/lib/code-runner/harness';

export interface MockHint {
  tier: number;
  title: string;
  content: string;
}

export interface MockTestCase {
  id: number;
  /** Human-readable input shown in the UI */
  input: string;
  /** Human-readable expected output shown in the UI */
  expectedOutput: string;
  /** Function questions: positional arguments passed to the solution */
  args?: unknown[];
  /** Design questions: [method, args][]; first entry is the constructor */
  ops?: [string, unknown[]][];
  /** Machine-checked expected value */
  expected: unknown;
  isCustom?: boolean;
}

export interface MockQuestion {
  id: string;
  title: string;
  company: 'Google' | 'Amazon' | 'Meta' | 'Microsoft';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  verifiedRound: string;
  sourceName: string;
  /** Public link to the interview report / OA write-up this question comes from (required) */
  sourceUrl: string;
  frequencyBadge?: string;
  notes?: string;
  description: string;
  constraints: string[];
  examples: {
    input: string;
    output: string;
    explanation?: string;
  }[];
  starterCode: Record<string, string>;
  hints: MockHint[];
  /** How the code runner calls the user's solution */
  runner: RunnerSpec;
  testCases: MockTestCase[];
  optimalComplexity: {
    time: string;
    space: string;
  };
}

export const MOCK_QUESTIONS: MockQuestion[] = [
  {
    id: 'meta-meeting-rooms-ii',
    title: 'Meeting Rooms II (Min Conference Rooms)',
    company: 'Meta',
    difficulty: 'Medium',
    category: 'Intervals & Priority Queues',
    verifiedRound: 'Meta (Facebook) phone screen, Menlo Park',
    sourceName: 'LeetCode Discuss: Facebook Phone Screen: Monotonic Array & Meeting Rooms 2',
    sourceUrl: 'https://leetcode.com/discuss/interview-question/376971/facebook-phone-screen-monotonic-array-meeting-rooms-2',
    notes: 'Asked alongside Monotonic Array and Kth Largest Element. LeetCode 253.',
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
    runner: {
      kind: 'function',
      method: 'minMeetingRooms',
      params: [{ name: 'intervals', type: 'int[][]' }],
      returns: 'int',
    },
    testCases: [
      { id: 1, input: '[[0,30],[5,10],[15,20]]', expectedOutput: '2', args: [[[0, 30], [5, 10], [15, 20]]], expected: 2 },
      { id: 2, input: '[[7,10],[2,4]]', expectedOutput: '1', args: [[[7, 10], [2, 4]]], expected: 1 },
      { id: 3, input: '[[1,5],[2,6],[3,7],[4,8]]', expectedOutput: '4', args: [[[1, 5], [2, 6], [3, 7], [4, 8]]], expected: 4 },
      { id: 4, input: '[[1,4],[4,8],[8,12]]', expectedOutput: '1', args: [[[1, 4], [4, 8], [8, 12]]], expected: 1 },
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
    verifiedRound: 'Amazon SDE 1 onsite, Seattle',
    sourceName: 'LeetCode Discuss: Amazon Onsite SDE1 Seattle',
    sourceUrl: 'https://leetcode.com/discuss/interview-question/1671315/amazon-onsite-sde1-seattle',
    notes: 'Also reported in an Amazon SDE 2 virtual onsite (leetcode.com/discuss/interview-question/1396380). LeetCode 146.',
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
    runner: {
      kind: 'design',
      className: 'LRUCache',
      ctorParams: ['int'],
      methods: {
        get: { params: ['int'], returns: 'int' },
        put: { params: ['int', 'int'], returns: 'void' },
      },
    },
    testCases: [
      {
        id: 1,
        input: 'capacity=2, put(1,1), put(2,2), get(1)',
        expectedOutput: '1',
        ops: [['LRUCache', [2]], ['put', [1, 1]], ['put', [2, 2]], ['get', [1]]],
        expected: 1,
      },
      {
        id: 2,
        input: 'capacity=2, put(1,1), put(2,2), get(1), put(3,3), get(2)',
        expectedOutput: '-1',
        ops: [['LRUCache', [2]], ['put', [1, 1]], ['put', [2, 2]], ['get', [1]], ['put', [3, 3]], ['get', [2]]],
        expected: -1,
      },
      {
        id: 3,
        input: 'capacity=2, put(1,1), put(2,2), get(1), put(3,3), put(4,4), get(1)',
        expectedOutput: '-1',
        ops: [['LRUCache', [2]], ['put', [1, 1]], ['put', [2, 2]], ['get', [1]], ['put', [3, 3]], ['put', [4, 4]], ['get', [1]]],
        expected: -1,
      },
      {
        id: 4,
        input: 'capacity=2, put(1,1), put(2,2), put(1,10), put(3,3), get(1)',
        expectedOutput: '10',
        ops: [['LRUCache', [2]], ['put', [1, 1]], ['put', [2, 2]], ['put', [1, 10]], ['put', [3, 3]], ['get', [1]]],
        expected: 10,
      },
    ],
    optimalComplexity: {
      time: 'O(1) for get and put',
      space: 'O(capacity)',
    },
  },
  {
    id: 'amazon-ship-packages',
    title: 'Capacity To Ship Packages (Amazon Delivery OA)',
    company: 'Amazon',
    difficulty: 'Medium',
    category: 'Binary Search on Answers',
    verifiedRound: 'Amazon India 2022 graduate onsite, Round 1',
    sourceName: 'LeetCode Discuss: Amazon Onsite All Rounds',
    sourceUrl: 'https://leetcode.com/discuss/interview-question/1986422/amazon-onsite-all-rounds',
    notes: 'Also reported in an Amazon SDE-1 India interview (leetcode.com/discuss/interview-experience/2052100). LeetCode 1011.',
    description: `A conveyor belt has packages that must be shipped from one port to another within \`days\` days.

The \`i-th\` package on the conveyor belt has a weight of \`weights[i]\`. Each day, we load the ship with packages on the conveyor belt (in the order given by \`weights\`). We may not load more weight than the maximum weight capacity of the ship.

Return the *least weight capacity of the ship* that will result in all the packages on the conveyor belt being shipped within \`days\` days.`,
    constraints: [
      '1 <= days <= weights.length <= 5 * 10^4',
      '1 <= weights[i] <= 500',
    ],
    examples: [
      {
        input: 'weights = [1,2,3,4,5,6,7,8,9,10], days = 5',
        output: '15',
        explanation: 'A ship capacity of 15 is the minimum to ship all packages in 5 days (Day 1: 1,2,3,4,5=15; Day 2: 6,7=13; Day 3: 8=8; Day 4: 9=9; Day 5: 10=10).',
      },
      {
        input: 'weights = [3,2,2,4,1,4], days = 3',
        output: '6',
        explanation: 'A ship capacity of 6 is the minimum to ship all packages in 3 days.',
      },
    ],
    starterCode: {
      python: `class Solution:
    def shipWithinDays(self, weights: list[int], days: int) -> int:
        pass`,
      cpp: `#include <vector>
#include <numeric>
#include <algorithm>

class Solution {
public:
    int shipWithinDays(std::vector<int>& weights, int days) {
        return 0;
    }
};`,
      java: `import java.util.*;

class Solution {
    public int shipWithinDays(int[] weights, int days) {
        return 0;
    }
}`,
      typescript: `function shipWithinDays(weights: number[], days: number): number {
    return 0;
}`,
    },
    hints: [
      {
        tier: 1,
        title: 'Search Space Recognition',
        content: 'The capacity must be at least max(weights) (otherwise the heaviest package can never be loaded), and at most sum(weights) (ship everything in 1 day).',
      },
      {
        tier: 2,
        title: 'Monotonicity',
        content: 'If capacity C works, any capacity > C also works. This monotonicity lets us binary search for the minimum working capacity.',
      },
      {
        tier: 3,
        title: 'Feasibility Function',
        content: 'Binary search between low = max(weights) and high = sum(weights). In O(N), greedily count how many days are needed for capacity mid. If days <= target, high = mid; else low = mid + 1.',
      },
    ],
    runner: {
      kind: 'function',
      method: 'shipWithinDays',
      params: [
        { name: 'weights', type: 'int[]' },
        { name: 'days', type: 'int' },
      ],
      returns: 'int',
    },
    testCases: [
      { id: 1, input: 'weights=[1,2,3,4,5,6,7,8,9,10], days=5', expectedOutput: '15', args: [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 5], expected: 15 },
      { id: 2, input: 'weights=[3,2,2,4,1,4], days=3', expectedOutput: '6', args: [[3, 2, 2, 4, 1, 4], 3], expected: 6 },
      { id: 3, input: 'weights=[1,2,3,1,1], days=4', expectedOutput: '3', args: [[1, 2, 3, 1, 1], 4], expected: 3 },
    ],
    optimalComplexity: {
      time: 'O(N * log(sum(weights) - max(weights)))',
      space: 'O(1)',
    },
  },
  {
    id: 'meta-subarray-sum-equals-k',
    title: 'Subarray Sum Equals K',
    company: 'Meta',
    difficulty: 'Medium',
    category: 'Prefix Sums & Hash Tables',
    verifiedRound: 'Meta (Facebook) phone interview',
    sourceName: 'LeetCode Discuss: Facebook (Meta) Phone Interview',
    sourceUrl: 'https://leetcode.com/discuss/interview-question/1606822/facebookmeta-phone-interview',
    notes: 'Also reported in a Meta new-grad screening (leetcode.com/discuss/interview-question/1822846). LeetCode 560.',
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
    runner: {
      kind: 'function',
      method: 'subarraySum',
      params: [
        { name: 'nums', type: 'int[]' },
        { name: 'k', type: 'int' },
      ],
      returns: 'int',
    },
    testCases: [
      { id: 1, input: 'nums = [1,1,1], k = 2', expectedOutput: '2', args: [[1, 1, 1], 2], expected: 2 },
      { id: 2, input: 'nums = [1,2,3], k = 3', expectedOutput: '2', args: [[1, 2, 3], 3], expected: 2 },
      { id: 3, input: 'nums = [-1,-1,1], k = 0', expectedOutput: '1', args: [[-1, -1, 1], 0], expected: 1 },
      { id: 4, input: 'nums = [1,-1,0], k = 0', expectedOutput: '3', args: [[1, -1, 0], 0], expected: 3 },
    ],
    optimalComplexity: {
      time: 'O(N)',
      space: 'O(N)',
    },
  },
  {
    id: 'google-rose-garden',
    title: 'Rose Garden (Earliest Day for Bouquets)',
    company: 'Google',
    difficulty: 'Medium',
    category: 'Binary Search on Answer',
    verifiedRound: 'Google Online Assessment',
    sourceName: 'AlgoMonster: Google OA "Rose Garden"',
    sourceUrl: 'https://algo.monster/problems/google_oa_rose_garden',
    notes: 'Same problem as LeetCode 1482 (Minimum Number of Days to Make m Bouquets).',
    description: `A row of roses blooms over time: \`bloomDay[i]\` is the day rose \`i\` blooms. A bouquet needs exactly \`k\` **adjacent** bloomed roses, and each rose can be used in only one bouquet. Return the earliest day on which you can make \`n\` bouquets, or \`-1\` if it is impossible.`,
    constraints: ['1 <= bloomDay.length <= 10^5', '1 <= bloomDay[i] <= 10^9', '1 <= k <= bloomDay.length', '1 <= n <= 10^6'],
    examples: [
      { input: 'bloomDay = [1,2,6,10,3,4,1], k = 2, n = 2', output: '4', explanation: 'On day 4, roses 0-1 and 4-6 have bloomed, which is enough adjacent roses for 2 bouquets of size 2.' },
      { input: 'bloomDay = [1,10,3,10,2], k = 1, n = 3', output: '3' },
    ],
    starterCode: {
      python: `class Solution:
    def minDays(self, bloomDay: list[int], k: int, n: int) -> int:
        # Write your optimal solution here
        pass`,
      cpp: `#include <vector>
#include <string>
#include <unordered_map>
#include <algorithm>

class Solution {
public:
    int minDays(std::vector<int>& bloomDay, int k, int n) {
        // Write your optimal solution here
        return 0;
    }
};`,
      java: `import java.util.*;

class Solution {
    public int minDays(int[] bloomDay, int k, int n) {
        // Write your optimal solution here
        return 0;
    }
}`,
      typescript: `function minDays(bloomDay: number[], k: number, n: number): number {
    // Write your optimal solution here
    return 0;
}`,
    },
    hints: [
      { tier: 1, title: 'High-Level Intuition', content: 'If you can make n bouquets by day d, you can also make them on any later day. That monotonic property is the key.' },
      { tier: 2, title: 'Key Data Structure', content: 'Binary search over the day. For a candidate day, one left-to-right pass counts how many bouquets of k adjacent bloomed roses exist.' },
      { tier: 3, title: 'Optimal Approach', content: 'If k * n > length, return -1 immediately. Otherwise binary search between min(bloomDay) and max(bloomDay); each check is O(N), total O(N log(max day)).' },
    ],
    runner: {
      kind: 'function',
      method: 'minDays',
      params: [{ name: 'bloomDay', type: 'int[]' }, { name: 'k', type: 'int' }, { name: 'n', type: 'int' }],
      returns: 'int',
    },
    testCases: [
      { id: 1, input: 'bloomDay = [1,2,6,10,3,4,1], k = 2, n = 2', expectedOutput: '4', args: [[1,2,6,10,3,4,1],2,2], expected: 4 },
      { id: 2, input: 'bloomDay = [1,10,3,10,2], k = 1, n = 3', expectedOutput: '3', args: [[1,10,3,10,2],1,3], expected: 3 },
      { id: 3, input: 'bloomDay = [1,10,3,10,2], k = 2, n = 3', expectedOutput: '-1', args: [[1,10,3,10,2],2,3], expected: -1 },
      { id: 4, input: 'bloomDay = [7,7,7,7,12,7,7], k = 3, n = 2', expectedOutput: '12', args: [[7,7,7,7,12,7,7],3,2], expected: 12 },
      { id: 5, input: 'bloomDay = [5], k = 1, n = 1', expectedOutput: '5', args: [[5],1,1], expected: 5 },
    ],
    optimalComplexity: { time: 'O(N log D)', space: 'O(1)' },
  },
  {
    id: 'google-pick-up-coupons',
    title: 'Pick Up Coupons (Shortest Window With a Repeat)',
    company: 'Google',
    difficulty: 'Medium',
    category: 'Hash Map & Sliding Window',
    verifiedRound: 'Google Online Assessment',
    sourceName: 'AlgoMonster: Google OA "Pick up Coupons"',
    sourceUrl: 'https://algo.monster/problems/google_oa_pick_up_coupons',
    notes: 'Same idea as LeetCode 2260 (Minimum Consecutive Cards to Pick Up).',
    description: `A scratch card is a row of non-negative integers. You may scratch only a **consecutive** run of numbers, and each scratched number costs $1. You win if you scratch at least two numbers with the same value. Return the minimum cost to win, or \`-1\` if winning is impossible.`,
    constraints: ['1 <= coupons.length <= 10^5', '0 <= coupons[i] <= 10^9'],
    examples: [
      { input: 'coupons = [1,3,4,2,3,4,5]', output: '4', explanation: 'Scratching [3,4,2,3] or [4,2,3,4] wins for $4.' },
      { input: 'coupons = [2,5,0,3,7]', output: '-1', explanation: 'No value appears twice.' },
    ],
    starterCode: {
      python: `class Solution:
    def pickUpCoupons(self, coupons: list[int]) -> int:
        # Write your optimal solution here
        pass`,
      cpp: `#include <vector>
#include <string>
#include <unordered_map>
#include <algorithm>

class Solution {
public:
    int pickUpCoupons(std::vector<int>& coupons) {
        // Write your optimal solution here
        return 0;
    }
};`,
      java: `import java.util.*;

class Solution {
    public int pickUpCoupons(int[] coupons) {
        // Write your optimal solution here
        return 0;
    }
}`,
      typescript: `function pickUpCoupons(coupons: number[]): number {
    // Write your optimal solution here
    return 0;
}`,
    },
    hints: [
      { tier: 1, title: 'High-Level Intuition', content: 'The cheapest win always starts and ends on two equal values, with no closer equal pair inside.' },
      { tier: 2, title: 'Key Data Structure', content: 'For each value, only its previous occurrence matters: the window from that index to the current one.' },
      { tier: 3, title: 'Optimal Approach', content: 'Store the last index of every value in a hash map; answer = min(i - last[x] + 1). One pass, O(N).' },
    ],
    runner: {
      kind: 'function',
      method: 'pickUpCoupons',
      params: [{ name: 'coupons', type: 'int[]' }],
      returns: 'int',
    },
    testCases: [
      { id: 1, input: 'coupons = [1,3,4,2,3,4,5]', expectedOutput: '4', args: [[1,3,4,2,3,4,5]], expected: 4 },
      { id: 2, input: 'coupons = [2,5,0,3,7]', expectedOutput: '-1', args: [[2,5,0,3,7]], expected: -1 },
      { id: 3, input: 'coupons = [7,7]', expectedOutput: '2', args: [[7,7]], expected: 2 },
      { id: 4, input: 'coupons = [1,2,3,1,2,2]', expectedOutput: '2', args: [[1,2,3,1,2,2]], expected: 2 },
      { id: 5, input: 'coupons = [5]', expectedOutput: '-1', args: [[5]], expected: -1 },
    ],
    optimalComplexity: { time: 'O(N)', space: 'O(N)' },
  },
  {
    id: 'google-watering-plants',
    title: 'Watering Plants (Refill Steps)',
    company: 'Google',
    difficulty: 'Medium',
    category: 'Simulation',
    verifiedRound: 'Google Online Assessment',
    sourceName: 'AlgoMonster: Google OA "Watering Plants"',
    sourceUrl: 'https://algo.monster/problems/google_oa_water_plants',
    notes: 'The source frames it as filling soup bowls with a ladle; same as LeetCode 2079 (Watering Plants).',
    description: `Plants stand in a row at positions \`0..n-1\`; the river is at position \`-1\`. You start at the river with a full can of \`capacity\` water and water plants left to right. Each plant \`i\` needs \`plants[i]\` water and must be watered fully in one go. If the can does not hold enough for the next plant, walk back to the river, refill completely, and return. Each move of one position is one step. Return the total number of steps to water every plant.`,
    constraints: ['1 <= plants.length <= 1000', '1 <= plants[i] <= 10^6', 'max(plants) <= capacity <= 10^9'],
    examples: [
      { input: 'plants = [2,4,5,1,2], capacity = 6', output: '17', explanation: 'Water plants 0 and 1, go back to refill, water 2 and 3, refill again, then water plant 4: 17 steps in total.' },
      { input: 'plants = [2,2,3,3], capacity = 5', output: '14' },
    ],
    starterCode: {
      python: `class Solution:
    def wateringPlants(self, plants: list[int], capacity: int) -> int:
        # Write your optimal solution here
        pass`,
      cpp: `#include <vector>
#include <string>
#include <unordered_map>
#include <algorithm>

class Solution {
public:
    int wateringPlants(std::vector<int>& plants, int capacity) {
        // Write your optimal solution here
        return 0;
    }
};`,
      java: `import java.util.*;

class Solution {
    public int wateringPlants(int[] plants, int capacity) {
        // Write your optimal solution here
        return 0;
    }
}`,
      typescript: `function wateringPlants(plants: number[], capacity: number): number {
    // Write your optimal solution here
    return 0;
}`,
    },
    hints: [
      { tier: 1, title: 'High-Level Intuition', content: 'Simulate. The only interesting moment is when the remaining water is less than the next plant needs.' },
      { tier: 2, title: 'Key Data Structure', content: 'Standing just before plant i (at position i-1), a refill trip costs i steps back to the river and i steps back.' },
      { tier: 3, title: 'Optimal Approach', content: 'Keep current water; for each i: if water < plants[i], add 2*i and refill; then add 1 step and subtract. O(N).' },
    ],
    runner: {
      kind: 'function',
      method: 'wateringPlants',
      params: [{ name: 'plants', type: 'int[]' }, { name: 'capacity', type: 'int' }],
      returns: 'int',
    },
    testCases: [
      { id: 1, input: 'plants = [2,4,5,1,2], capacity = 6', expectedOutput: '17', args: [[2,4,5,1,2],6], expected: 17 },
      { id: 2, input: 'plants = [2,2,3,3], capacity = 5', expectedOutput: '14', args: [[2,2,3,3],5], expected: 14 },
      { id: 3, input: 'plants = [1,1,1,4,2,3], capacity = 4', expectedOutput: '30', args: [[1,1,1,4,2,3],4], expected: 30 },
      { id: 4, input: 'plants = [7,7,7,7,7,7,7], capacity = 8', expectedOutput: '49', args: [[7,7,7,7,7,7,7],8], expected: 49 },
      { id: 5, input: 'plants = [3], capacity = 3', expectedOutput: '1', args: [[3],3], expected: 1 },
    ],
    optimalComplexity: { time: 'O(N)', space: 'O(1)' },
  },
  {
    id: 'google-rings-on-rods',
    title: 'Rings on Rods',
    company: 'Google',
    difficulty: 'Easy',
    category: 'Hashing & Strings',
    verifiedRound: 'Google Online Assessment (2021)',
    sourceName: 'AlgoMonster: Google OA 2021 "Rings on Rods"',
    sourceUrl: 'https://algo.monster/problems/google-oa-rings-on-rods',
    notes: 'Same problem as LeetCode 2103.',
    description: `There are 10 rods numbered \`0\` to \`9\`, and rings that are Red (\`R\`), Green (\`G\`) or Blue (\`B\`). The string \`rings\` describes the rings as pairs of characters: the colour, then the rod number. For example \`"R8"\` is a red ring on rod 8. Return the number of rods that hold rings of **all three** colours.`,
    constraints: ['rings.length == 2 * n, 1 <= n <= 100', 'rings[2i] is R, G or B; rings[2i+1] is a digit 0-9'],
    examples: [
      { input: 'rings = "B2R5G2R2"', output: '1', explanation: 'Rod 2 has blue, green and red rings; rod 5 only has red.' },
      { input: 'rings = "B0B6G0R6R0R6G9"', output: '1' },
    ],
    starterCode: {
      python: `class Solution:
    def countPoints(self, rings: str) -> int:
        # Write your optimal solution here
        pass`,
      cpp: `#include <vector>
#include <string>
#include <unordered_map>
#include <algorithm>

class Solution {
public:
    int countPoints(std::string rings) {
        // Write your optimal solution here
        return 0;
    }
};`,
      java: `import java.util.*;

class Solution {
    public int countPoints(String rings) {
        // Write your optimal solution here
        return 0;
    }
}`,
      typescript: `function countPoints(rings: string): number {
    // Write your optimal solution here
    return 0;
}`,
    },
    hints: [
      { tier: 1, title: 'High-Level Intuition', content: 'Process the string two characters at a time: colour, then rod.' },
      { tier: 2, title: 'Key Data Structure', content: 'Track the set of colours seen on each rod.' },
      { tier: 3, title: 'Optimal Approach', content: 'A 10-element array of 3-bit masks (R=1, G=2, B=4) works: count rods whose mask equals 7. O(N).' },
    ],
    runner: {
      kind: 'function',
      method: 'countPoints',
      params: [{ name: 'rings', type: 'string' }],
      returns: 'int',
    },
    testCases: [
      { id: 1, input: 'rings = "B2R5G2R2"', expectedOutput: '1', args: ["B2R5G2R2"], expected: 1 },
      { id: 2, input: 'rings = "B0B6G0R6R0R6G9"', expectedOutput: '1', args: ["B0B6G0R6R0R6G9"], expected: 1 },
      { id: 3, input: 'rings = "G4"', expectedOutput: '0', args: ["G4"], expected: 0 },
      { id: 4, input: 'rings = "R1G1B1R2G2B2R9G9B9"', expectedOutput: '3', args: ["R1G1B1R2G2B2R9G9B9"], expected: 3 },
    ],
    optimalComplexity: { time: 'O(N)', space: 'O(1)' },
  },
  {
    id: 'amazon-number-of-islands',
    title: 'Number of Islands',
    company: 'Amazon',
    difficulty: 'Medium',
    category: 'Graphs & DFS/BFS',
    verifiedRound: 'Amazon SDE 1 Online Assessment (AWS)',
    sourceName: 'LeetCode Discuss: Amazon SDE1 Online Assessment',
    sourceUrl: 'https://leetcode.com/discuss/interview-question/537430/amazon-sde1-online-assesment',
    notes: 'The candidate reports this as the first of two OA questions. LeetCode 200.',
    description: `Given an \`m x n\` grid of \`"1"\` (land) and \`"0"\` (water), return the number of islands. An island is a group of land cells connected **horizontally or vertically**, surrounded by water. Assume the grid edges are water.`,
    constraints: ['1 <= m, n <= 300', 'grid[i][j] is \'0\' or \'1\''],
    examples: [
      { input: 'grid = [["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]', output: '1' },
      { input: 'grid = [["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]', output: '3' },
    ],
    starterCode: {
      python: `class Solution:
    def numIslands(self, grid: list[list[str]]) -> int:
        # Write your optimal solution here
        pass`,
      cpp: `#include <vector>
#include <string>
#include <unordered_map>
#include <algorithm>

class Solution {
public:
    int numIslands(std::vector<std::vector<char>>& grid) {
        // Write your optimal solution here
        return 0;
    }
};`,
      java: `import java.util.*;

class Solution {
    public int numIslands(char[][] grid) {
        // Write your optimal solution here
        return 0;
    }
}`,
      typescript: `function numIslands(grid: string[][]): number {
    // Write your optimal solution here
    return 0;
}`,
    },
    hints: [
      { tier: 1, title: 'High-Level Intuition', content: 'Each unvisited land cell you meet starts a brand-new island.' },
      { tier: 2, title: 'Key Data Structure', content: 'From that cell, flood-fill (DFS or BFS) every connected land cell so it is never counted again.' },
      { tier: 3, title: 'Optimal Approach', content: 'Mark visited cells by turning them to "0". Every cell is visited at most once: O(M*N).' },
    ],
    runner: {
      kind: 'function',
      method: 'numIslands',
      params: [{ name: 'grid', type: 'char[][]' }],
      returns: 'int',
    },
    testCases: [
      { id: 1, input: 'grid = [["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]', expectedOutput: '1', args: [[["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]], expected: 1 },
      { id: 2, input: 'grid = [["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]', expectedOutput: '3', args: [[["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]], expected: 3 },
      { id: 3, input: 'grid = [["0"]]', expectedOutput: '0', args: [[["0"]]], expected: 0 },
      { id: 4, input: 'grid = [["1","0","1"],["0","1","0"],["1","0","1"]]', expectedOutput: '5', args: [[["1","0","1"],["0","1","0"],["1","0","1"]]], expected: 5 },
    ],
    optimalComplexity: { time: 'O(M*N)', space: 'O(M*N)' },
  },
  {
    id: 'amazon-rotting-oranges',
    title: 'Rotting Oranges',
    company: 'Amazon',
    difficulty: 'Medium',
    category: 'Multi-source BFS',
    verifiedRound: 'Amazon Online Assessment (US)',
    sourceName: 'LeetCode Discuss: Amazon Online Assessment US',
    sourceUrl: 'https://leetcode.com/discuss/interview-question/525680/amazon-online-assessment-us',
    notes: 'Reported as one of two OA questions. LeetCode 994; Amazon OAs also use "zombie in a matrix" variants.',
    description: `In an \`m x n\` grid each cell is \`0\` (empty), \`1\` (fresh orange) or \`2\` (rotten orange). Every minute, any fresh orange that is 4-directionally adjacent to a rotten orange becomes rotten. Return the minimum number of minutes until no fresh orange remains, or \`-1\` if that is impossible.`,
    constraints: ['1 <= m, n <= 10', 'grid[i][j] is 0, 1 or 2'],
    examples: [
      { input: 'grid = [[2,1,1],[1,1,0],[0,1,1]]', output: '4' },
      { input: 'grid = [[2,1,1],[0,1,1],[1,0,1]]', output: '-1' },
    ],
    starterCode: {
      python: `class Solution:
    def orangesRotting(self, grid: list[list[int]]) -> int:
        # Write your optimal solution here
        pass`,
      cpp: `#include <vector>
#include <string>
#include <unordered_map>
#include <algorithm>

class Solution {
public:
    int orangesRotting(std::vector<std::vector<int>>& grid) {
        // Write your optimal solution here
        return 0;
    }
};`,
      java: `import java.util.*;

class Solution {
    public int orangesRotting(int[][] grid) {
        // Write your optimal solution here
        return 0;
    }
}`,
      typescript: `function orangesRotting(grid: number[][]): number {
    // Write your optimal solution here
    return 0;
}`,
    },
    hints: [
      { tier: 1, title: 'High-Level Intuition', content: 'All rotten oranges spread at the same time, so they should all start together.' },
      { tier: 2, title: 'Key Data Structure', content: 'Put every rotten orange in a queue first, then BFS level by level; each level is one minute.' },
      { tier: 3, title: 'Optimal Approach', content: 'Count fresh oranges up front and decrement as they rot. If any remain after BFS, return -1. O(M*N).' },
    ],
    runner: {
      kind: 'function',
      method: 'orangesRotting',
      params: [{ name: 'grid', type: 'int[][]' }],
      returns: 'int',
    },
    testCases: [
      { id: 1, input: 'grid = [[2,1,1],[1,1,0],[0,1,1]]', expectedOutput: '4', args: [[[2,1,1],[1,1,0],[0,1,1]]], expected: 4 },
      { id: 2, input: 'grid = [[2,1,1],[0,1,1],[1,0,1]]', expectedOutput: '-1', args: [[[2,1,1],[0,1,1],[1,0,1]]], expected: -1 },
      { id: 3, input: 'grid = [[0,2]]', expectedOutput: '0', args: [[[0,2]]], expected: 0 },
      { id: 4, input: 'grid = [[1]]', expectedOutput: '-1', args: [[[1]]], expected: -1 },
      { id: 5, input: 'grid = [[2,2],[1,1]]', expectedOutput: '1', args: [[[2,2],[1,1]]], expected: 1 },
    ],
    optimalComplexity: { time: 'O(M*N)', space: 'O(M*N)' },
  },
  {
    id: 'amazon-top-k-frequent-words',
    title: 'Top K Frequent Words',
    company: 'Amazon',
    difficulty: 'Medium',
    category: 'Heap & Hash Map',
    verifiedRound: 'Amazon SDE Intern Online Assessment (2019)',
    sourceName: 'LeetCode Discuss: Amazon SDE Summer Intern 2020 offer',
    sourceUrl: 'https://leetcode.com/discuss/interview-experience/424992/',
    notes: 'Reported in the OA technical round; it also appears as "Top K Frequently Mentioned Keywords". LeetCode 692.',
    description: `Given an array of strings \`words\` and an integer \`k\`, return the \`k\` most frequent strings. Sort the answer by frequency from highest to lowest; words with the same frequency are sorted in **lexicographical** order.`,
    constraints: ['1 <= words.length <= 500', '1 <= words[i].length <= 10, lowercase letters', '1 <= k <= number of unique words'],
    examples: [
      { input: 'words = ["i","love","leetcode","i","love","coding"], k = 2', output: '["i","love"]' },
      { input: 'words = ["the","day","is","sunny","the","the","the","sunny","is","is"], k = 4', output: '["the","is","sunny","day"]' },
    ],
    starterCode: {
      python: `class Solution:
    def topKFrequent(self, words: list[str], k: int) -> list[str]:
        # Write your optimal solution here
        pass`,
      cpp: `#include <vector>
#include <string>
#include <unordered_map>
#include <algorithm>

class Solution {
public:
    std::vector<std::string> topKFrequent(std::vector<std::string>& words, int k) {
        // Write your optimal solution here
        return {};
    }
};`,
      java: `import java.util.*;

class Solution {
    public List<String> topKFrequent(String[] words, int k) {
        // Write your optimal solution here
        return new ArrayList<>();
    }
}`,
      typescript: `function topKFrequent(words: string[], k: number): string[] {
    // Write your optimal solution here
    return [];
}`,
    },
    hints: [
      { tier: 1, title: 'High-Level Intuition', content: 'First count how often each word appears.' },
      { tier: 2, title: 'Key Data Structure', content: 'The ordering rule is: higher count first, then alphabetical. Encode that in one comparator.' },
      { tier: 3, title: 'Optimal Approach', content: 'Sort unique words by (-count, word) for O(U log U), or keep a size-k heap for O(N log k).' },
    ],
    runner: {
      kind: 'function',
      method: 'topKFrequent',
      params: [{ name: 'words', type: 'string[]' }, { name: 'k', type: 'int' }],
      returns: 'string[]',
    },
    testCases: [
      { id: 1, input: 'words = ["i","love","leetcode","i","love","coding"], k = 2', expectedOutput: '["i","love"]', args: [["i","love","leetcode","i","love","coding"],2], expected: ["i","love"] },
      { id: 2, input: 'words = ["the","day","is","sunny","the","the","the","sunny","is","is"], k = 4', expectedOutput: '["the","is","sunny","day"]', args: [["the","day","is","sunny","the","the","the","sunny","is","is"],4], expected: ["the","is","sunny","day"] },
      { id: 3, input: 'words = ["a","b","c"], k = 3', expectedOutput: '["a","b","c"]', args: [["a","b","c"],3], expected: ["a","b","c"] },
      { id: 4, input: 'words = ["zebra","apple","zebra","apple","mango"], k = 2', expectedOutput: '["apple","zebra"]', args: [["zebra","apple","zebra","apple","mango"],2], expected: ["apple","zebra"] },
    ],
    optimalComplexity: { time: 'O(N log k)', space: 'O(N)' },
  },
  {
    id: 'meta-valid-palindrome-ii',
    title: 'Valid Palindrome II',
    company: 'Meta',
    difficulty: 'Easy',
    category: 'Two Pointers',
    verifiedRound: 'Meta E4 phone screen',
    sourceName: 'LeetCode Discuss: Meta E4 Onsite',
    sourceUrl: 'https://leetcode.com/discuss/interview-question/1970796/meta-e4-onsite',
    notes: 'Reported in the phone screen. LeetCode 680.',
    description: `Given a string \`s\`, return \`true\` if it can be a palindrome after deleting **at most one** character.`,
    constraints: ['1 <= s.length <= 10^5', 's consists of lowercase English letters'],
    examples: [
      { input: 's = "aba"', output: 'true' },
      { input: 's = "abca"', output: 'true' },
    ],
    starterCode: {
      python: `class Solution:
    def validPalindrome(self, s: str) -> bool:
        # Write your optimal solution here
        pass`,
      cpp: `#include <vector>
#include <string>
#include <unordered_map>
#include <algorithm>

class Solution {
public:
    bool validPalindrome(std::string s) {
        // Write your optimal solution here
        return false;
    }
};`,
      java: `import java.util.*;

class Solution {
    public boolean validPalindrome(String s) {
        // Write your optimal solution here
        return false;
    }
}`,
      typescript: `function validPalindrome(s: string): boolean {
    // Write your optimal solution here
    return false;
}`,
    },
    hints: [
      { tier: 1, title: 'High-Level Intuition', content: 'Compare characters from both ends inward.' },
      { tier: 2, title: 'Key Data Structure', content: 'At the first mismatch you have only two options: skip the left character or skip the right one.' },
      { tier: 3, title: 'Optimal Approach', content: 'Check whether either remaining substring is a plain palindrome. O(N) time, O(1) extra space.' },
    ],
    runner: {
      kind: 'function',
      method: 'validPalindrome',
      params: [{ name: 's', type: 'string' }],
      returns: 'bool',
    },
    testCases: [
      { id: 1, input: 's = "aba"', expectedOutput: 'true', args: ["aba"], expected: true },
      { id: 2, input: 's = "abca"', expectedOutput: 'true', args: ["abca"], expected: true },
      { id: 3, input: 's = "abc"', expectedOutput: 'false', args: ["abc"], expected: false },
      { id: 4, input: 's = "deeee"', expectedOutput: 'true', args: ["deeee"], expected: true },
      { id: 5, input: 's = "eeccccbebaeeabebccceea"', expectedOutput: 'false', args: ["eeccccbebaeeabebccceea"], expected: false },
    ],
    optimalComplexity: { time: 'O(N)', space: 'O(1)' },
  },
  {
    id: 'meta-basic-calculator-ii',
    title: 'Basic Calculator II',
    company: 'Meta',
    difficulty: 'Medium',
    category: 'Stack & Parsing',
    verifiedRound: 'Meta E3/E4 phone screen (April 2022)',
    sourceName: 'LeetCode Discuss: Meta Phone Screen E3/E4',
    sourceUrl: 'https://leetcode.com/discuss/interview-question/1920996/meta-phone-screen-e3e4-min-remove-basic-calculator-ii',
    notes: 'The follow-up in the report added parentheses (LeetCode 224). LeetCode 227.',
    description: `Given a string \`s\` holding a valid expression with non-negative integers, \`+\`, \`-\`, \`*\`, \`/\` and spaces, evaluate it and return the result. Integer division truncates toward zero. Do not use built-in \`eval\`.`,
    constraints: ['1 <= s.length <= 3 * 10^5', 'All intermediate results fit in a 32-bit signed integer'],
    examples: [
      { input: 's = "3+2*2"', output: '7' },
      { input: 's = " 3/2 "', output: '1' },
    ],
    starterCode: {
      python: `class Solution:
    def calculate(self, s: str) -> int:
        # Write your optimal solution here
        pass`,
      cpp: `#include <vector>
#include <string>
#include <unordered_map>
#include <algorithm>

class Solution {
public:
    int calculate(std::string s) {
        // Write your optimal solution here
        return 0;
    }
};`,
      java: `import java.util.*;

class Solution {
    public int calculate(String s) {
        // Write your optimal solution here
        return 0;
    }
}`,
      typescript: `function calculate(s: string): number {
    // Write your optimal solution here
    return 0;
}`,
    },
    hints: [
      { tier: 1, title: 'High-Level Intuition', content: '* and / bind tighter than + and -, so they must be applied before addition happens.' },
      { tier: 2, title: 'Key Data Structure', content: 'Push signed numbers on a stack: + pushes n, - pushes -n, * and / combine with the top of the stack immediately.' },
      { tier: 3, title: 'Optimal Approach', content: 'Apply the previous operator whenever you reach a new operator or the end, then sum the stack. O(N); you can even drop the stack and keep just the last term.' },
    ],
    runner: {
      kind: 'function',
      method: 'calculate',
      params: [{ name: 's', type: 'string' }],
      returns: 'int',
    },
    testCases: [
      { id: 1, input: 's = "3+2*2"', expectedOutput: '7', args: ["3+2*2"], expected: 7 },
      { id: 2, input: 's = " 3/2 "', expectedOutput: '1', args: [" 3/2 "], expected: 1 },
      { id: 3, input: 's = " 3+5 / 2 "', expectedOutput: '5', args: [" 3+5 / 2 "], expected: 5 },
      { id: 4, input: 's = "14-3*2"', expectedOutput: '8', args: ["14-3*2"], expected: 8 },
      { id: 5, input: 's = "100"', expectedOutput: '100', args: ["100"], expected: 100 },
    ],
    optimalComplexity: { time: 'O(N)', space: 'O(N)' },
  },
  {
    id: 'meta-valid-word-abbreviation',
    title: 'Valid Word Abbreviation',
    company: 'Meta',
    difficulty: 'Easy',
    category: 'Two Pointers & Strings',
    verifiedRound: 'Meta new grad phone screen',
    sourceName: 'LeetCode Discuss: Facebook/Meta Phone Screen (New Grad)',
    sourceUrl: 'https://leetcode.com/discuss/interview-experience/1675574/facebookmeta-phone-screen-new-grad-minimum-add-valid-parentheses-pattern-match',
    notes: 'Asked as the second question of the screen. LeetCode 408.',
    description: `An abbreviation replaces any number of non-adjacent, non-empty substrings with their lengths. The lengths must not have leading zeros. For example \`"substitution"\` can be abbreviated as \`"s10n"\` or \`"12"\`, but not \`"s010n"\` or \`"s0ubstitution"\`. Given \`word\` and \`abbr\`, return whether \`abbr\` is a valid abbreviation of \`word\`.`,
    constraints: ['1 <= word.length <= 20', '1 <= abbr.length <= 10', 'abbr numbers fit in a 32-bit integer'],
    examples: [
      { input: 'word = "internationalization", abbr = "i12iz4n"', output: 'true' },
      { input: 'word = "apple", abbr = "a2e"', output: 'false' },
    ],
    starterCode: {
      python: `class Solution:
    def validWordAbbreviation(self, word: str, abbr: str) -> bool:
        # Write your optimal solution here
        pass`,
      cpp: `#include <vector>
#include <string>
#include <unordered_map>
#include <algorithm>

class Solution {
public:
    bool validWordAbbreviation(std::string word, std::string abbr) {
        // Write your optimal solution here
        return false;
    }
};`,
      java: `import java.util.*;

class Solution {
    public boolean validWordAbbreviation(String word, String abbr) {
        // Write your optimal solution here
        return false;
    }
}`,
      typescript: `function validWordAbbreviation(word: string, abbr: string): boolean {
    // Write your optimal solution here
    return false;
}`,
    },
    hints: [
      { tier: 1, title: 'High-Level Intuition', content: 'Walk both strings with two pointers.' },
      { tier: 2, title: 'Key Data Structure', content: 'When abbr has a digit, read the whole number and jump the word pointer forward by it.' },
      { tier: 3, title: 'Optimal Approach', content: 'Reject a number starting with 0. At the end both pointers must land exactly on the ends. O(N).' },
    ],
    runner: {
      kind: 'function',
      method: 'validWordAbbreviation',
      params: [{ name: 'word', type: 'string' }, { name: 'abbr', type: 'string' }],
      returns: 'bool',
    },
    testCases: [
      { id: 1, input: 'word = "internationalization", abbr = "i12iz4n"', expectedOutput: 'true', args: ["internationalization","i12iz4n"], expected: true },
      { id: 2, input: 'word = "apple", abbr = "a2e"', expectedOutput: 'false', args: ["apple","a2e"], expected: false },
      { id: 3, input: 'word = "substitution", abbr = "s010n"', expectedOutput: 'false', args: ["substitution","s010n"], expected: false },
      { id: 4, input: 'word = "substitution", abbr = "12"', expectedOutput: 'true', args: ["substitution","12"], expected: true },
      { id: 5, input: 'word = "a", abbr = "2"', expectedOutput: 'false', args: ["a","2"], expected: false },
    ],
    optimalComplexity: { time: 'O(N)', space: 'O(1)' },
  },
  {
    id: 'microsoft-word-search',
    title: 'Word Search',
    company: 'Microsoft',
    difficulty: 'Medium',
    category: 'Backtracking',
    verifiedRound: 'Microsoft SDE 2 phone screen (Aug 2021)',
    sourceName: 'LeetCode Discuss: Microsoft SDE 2 Mountain View [Offer]',
    sourceUrl: 'https://leetcode.com/discuss/interview-experience/1447245/',
    notes: 'Also reported in a Microsoft round in Dec 2025 (leetcode.com/discuss/interview-experience/7384653). LeetCode 79.',
    description: `Given an \`m x n\` grid of characters \`board\` and a string \`word\`, return \`true\` if \`word\` exists in the grid. The word must be built from letters of sequentially adjacent cells (horizontal or vertical neighbours), and the same cell may not be used more than once.`,
    constraints: ['1 <= m, n <= 6', '1 <= word.length <= 15', 'board and word consist of English letters'],
    examples: [
      { input: 'board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "ABCCED"', output: 'true' },
      { input: 'board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "SEE"', output: 'true' },
    ],
    starterCode: {
      python: `class Solution:
    def exist(self, board: list[list[str]], word: str) -> bool:
        # Write your optimal solution here
        pass`,
      cpp: `#include <vector>
#include <string>
#include <unordered_map>
#include <algorithm>

class Solution {
public:
    bool exist(std::vector<std::vector<char>>& board, std::string word) {
        // Write your optimal solution here
        return false;
    }
};`,
      java: `import java.util.*;

class Solution {
    public boolean exist(char[][] board, String word) {
        // Write your optimal solution here
        return false;
    }
}`,
      typescript: `function exist(board: string[][], word: string): boolean {
    // Write your optimal solution here
    return false;
}`,
    },
    hints: [
      { tier: 1, title: 'High-Level Intuition', content: 'Try every cell as a starting point for the first letter.' },
      { tier: 2, title: 'Key Data Structure', content: 'From a matching cell, recurse into the 4 neighbours for the next letter, marking the cell as used on the way down.' },
      { tier: 3, title: 'Optimal Approach', content: 'Un-mark it when you backtrack. Worst case O(M*N*3^L), with an early exit as soon as a path is found.' },
    ],
    runner: {
      kind: 'function',
      method: 'exist',
      params: [{ name: 'board', type: 'char[][]' }, { name: 'word', type: 'string' }],
      returns: 'bool',
    },
    testCases: [
      { id: 1, input: 'board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "ABCCED"', expectedOutput: 'true', args: [[["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]],"ABCCED"], expected: true },
      { id: 2, input: 'board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "SEE"', expectedOutput: 'true', args: [[["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]],"SEE"], expected: true },
      { id: 3, input: 'board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "ABCB"', expectedOutput: 'false', args: [[["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]],"ABCB"], expected: false },
      { id: 4, input: 'board = [["a"]], word = "a"', expectedOutput: 'true', args: [[["a"]],"a"], expected: true },
      { id: 5, input: 'board = [["a","b"],["c","d"]], word = "abdc"', expectedOutput: 'true', args: [[["a","b"],["c","d"]],"abdc"], expected: true },
    ],
    optimalComplexity: { time: 'O(M*N*3^L)', space: 'O(L)' },
  },
  {
    id: 'microsoft-max-network-rank',
    title: 'Max Network Rank',
    company: 'Microsoft',
    difficulty: 'Medium',
    category: 'Graphs & Degrees',
    verifiedRound: 'Microsoft Online Assessment (Codility)',
    sourceName: 'AlgoMonster: Microsoft OA 2021 "Max Network Rank"',
    sourceUrl: 'https://algo.monster/problems/max_network_rank',
    notes: 'Codility variant: only pairs of cities joined directly by a road are considered.',
    description: `A network has \`n\` cities numbered \`1..n\` and \`m\` two-way roads; road \`i\` joins \`starts[i]\` and \`ends[i]\`. For a pair of cities **directly connected by a road**, its network rank is the number of roads touching either city (the road between them is counted once). Return the maximum network rank over all directly connected pairs.`,
    constraints: ['2 <= n <= 100', '1 <= m <= 4950', 'No duplicate roads, no self-loops'],
    examples: [
      { input: 'starts = [1,2,3,3], ends = [2,3,1,4], n = 4', output: '4', explanation: 'Cities 2 and 3 touch roads (2,1), (2,3), (3,1) and (3,4): rank 4.' },
      { input: 'starts = [1,2,4,5], ends = [2,3,5,6], n = 6', output: '2' },
    ],
    starterCode: {
      python: `class Solution:
    def maxNetworkRank(self, starts: list[int], ends: list[int], n: int) -> int:
        # Write your optimal solution here
        pass`,
      cpp: `#include <vector>
#include <string>
#include <unordered_map>
#include <algorithm>

class Solution {
public:
    int maxNetworkRank(std::vector<int>& starts, std::vector<int>& ends, int n) {
        // Write your optimal solution here
        return 0;
    }
};`,
      java: `import java.util.*;

class Solution {
    public int maxNetworkRank(int[] starts, int[] ends, int n) {
        // Write your optimal solution here
        return 0;
    }
}`,
      typescript: `function maxNetworkRank(starts: number[], ends: number[], n: number): number {
    // Write your optimal solution here
    return 0;
}`,
    },
    hints: [
      { tier: 1, title: 'High-Level Intuition', content: 'The rank of a pair only depends on how many roads touch each city.' },
      { tier: 2, title: 'Key Data Structure', content: 'Compute the degree of every city in one pass over the roads.' },
      { tier: 3, title: 'Optimal Approach', content: 'For each road (a, b) the pair rank is deg[a] + deg[b] - 1. Take the max: O(N + M).' },
    ],
    runner: {
      kind: 'function',
      method: 'maxNetworkRank',
      params: [{ name: 'starts', type: 'int[]' }, { name: 'ends', type: 'int[]' }, { name: 'n', type: 'int' }],
      returns: 'int',
    },
    testCases: [
      { id: 1, input: 'starts = [1,2,3,3], ends = [2,3,1,4], n = 4', expectedOutput: '4', args: [[1,2,3,3],[2,3,1,4],4], expected: 4 },
      { id: 2, input: 'starts = [1,2,4,5], ends = [2,3,5,6], n = 6', expectedOutput: '2', args: [[1,2,4,5],[2,3,5,6],6], expected: 2 },
      { id: 3, input: 'starts = [1], ends = [2], n = 2', expectedOutput: '1', args: [[1],[2],2], expected: 1 },
      { id: 4, input: 'starts = [1,1,1,2], ends = [2,3,4,3], n = 4', expectedOutput: '4', args: [[1,1,1,2],[2,3,4,3],4], expected: 4 },
    ],
    optimalComplexity: { time: 'O(N + M)', space: 'O(N)' },
  },
  {
    id: 'microsoft-largest-k',
    title: 'Largest K With Both K and -K',
    company: 'Microsoft',
    difficulty: 'Easy',
    category: 'Hash Set',
    verifiedRound: 'Microsoft Online Assessment (Codility)',
    sourceName: 'AlgoMonster: Microsoft OA "Largest K such that both K and -K exist"',
    sourceUrl: 'https://algo.monster/problems/largest_k_positive_and_negative',
    notes: 'Same idea as LeetCode 2441.',
    description: `Given an array \`nums\` of integers, return the largest integer \`K > 0\` such that both \`K\` and \`-K\` exist in the array. If there is no such integer, return \`0\`.`,
    constraints: ['1 <= nums.length <= 10^5', '-10^9 <= nums[i] <= 10^9'],
    examples: [
      { input: 'nums = [3,2,-2,5,-3]', output: '3', explanation: 'Both 2/-2 and 3/-3 are present; 3 is larger.' },
      { input: 'nums = [1,2,3,-4]', output: '0', explanation: 'No positive value has its negative in the array.' },
    ],
    starterCode: {
      python: `class Solution:
    def largestK(self, nums: list[int]) -> int:
        # Write your optimal solution here
        pass`,
      cpp: `#include <vector>
#include <string>
#include <unordered_map>
#include <algorithm>

class Solution {
public:
    int largestK(std::vector<int>& nums) {
        // Write your optimal solution here
        return 0;
    }
};`,
      java: `import java.util.*;

class Solution {
    public int largestK(int[] nums) {
        // Write your optimal solution here
        return 0;
    }
}`,
      typescript: `function largestK(nums: number[]): number {
    // Write your optimal solution here
    return 0;
}`,
    },
    hints: [
      { tier: 1, title: 'High-Level Intuition', content: 'For a candidate K you need constant-time membership checks.' },
      { tier: 2, title: 'Key Data Structure', content: 'Put every number in a hash set.' },
      { tier: 3, title: 'Optimal Approach', content: 'Scan values x > 0 and keep the largest one whose -x is in the set. O(N).' },
    ],
    runner: {
      kind: 'function',
      method: 'largestK',
      params: [{ name: 'nums', type: 'int[]' }],
      returns: 'int',
    },
    testCases: [
      { id: 1, input: 'nums = [3,2,-2,5,-3]', expectedOutput: '3', args: [[3,2,-2,5,-3]], expected: 3 },
      { id: 2, input: 'nums = [1,2,3,-4]', expectedOutput: '0', args: [[1,2,3,-4]], expected: 0 },
      { id: 3, input: 'nums = [0,0]', expectedOutput: '0', args: [[0,0]], expected: 0 },
      { id: 4, input: 'nums = [-7,7,7,-1,1]', expectedOutput: '7', args: [[-7,7,7,-1,1]], expected: 7 },
      { id: 5, input: 'nums = [5]', expectedOutput: '0', args: [[5]], expected: 0 },
    ],
    optimalComplexity: { time: 'O(N)', space: 'O(N)' },
  },
  {
    id: 'microsoft-min-deletions-xy',
    title: 'Min Deletions to Get All X Before Y',
    company: 'Microsoft',
    difficulty: 'Medium',
    category: 'Greedy / Prefix DP',
    verifiedRound: 'Microsoft Online Assessment (Codility)',
    sourceName: 'AlgoMonster: Microsoft OA "Min Deletions To Obtain String in Right Format"',
    sourceUrl: 'https://algo.monster/problems/min_deletions_to_obtain_string_in_right_format',
    notes: 'Same idea as LeetCode 1653 (Minimum Deletions to Make String Balanced).',
    description: `Given a string \`s\` made only of the characters \`X\` and \`Y\`, return the minimum number of characters you must delete so that every \`X\` comes before every \`Y\`.`,
    constraints: ['1 <= s.length <= 10^5', 's[i] is \'X\' or \'Y\''],
    examples: [
      { input: 's = "YXXXYXY"', output: '2', explanation: 'Delete the first Y and the last X to get XXXYY.' },
      { input: 's = "YYXYXX"', output: '3', explanation: 'Removing all three Xs (or all three Ys) works.' },
      { input: 's = "XXYYYY"', output: '0', explanation: 'Already in the right format.' },
    ],
    starterCode: {
      python: `class Solution:
    def minDeletions(self, s: str) -> int:
        # Write your optimal solution here
        pass`,
      cpp: `#include <vector>
#include <string>
#include <unordered_map>
#include <algorithm>

class Solution {
public:
    int minDeletions(std::string s) {
        // Write your optimal solution here
        return 0;
    }
};`,
      java: `import java.util.*;

class Solution {
    public int minDeletions(String s) {
        // Write your optimal solution here
        return 0;
    }
}`,
      typescript: `function minDeletions(s: string): number {
    // Write your optimal solution here
    return 0;
}`,
    },
    hints: [
      { tier: 1, title: 'High-Level Intuition', content: 'Look at each X: either delete it, or delete every Y that came before it.' },
      { tier: 2, title: 'Key Data Structure', content: 'Keep a running count of Ys seen so far.' },
      { tier: 3, title: 'Optimal Approach', content: 'For each X: deletions = min(deletions + 1, ysSoFar). One pass, O(N) time, O(1) space.' },
    ],
    runner: {
      kind: 'function',
      method: 'minDeletions',
      params: [{ name: 's', type: 'string' }],
      returns: 'int',
    },
    testCases: [
      { id: 1, input: 's = "YXXXYXY"', expectedOutput: '2', args: ["YXXXYXY"], expected: 2 },
      { id: 2, input: 's = "YYXYXX"', expectedOutput: '3', args: ["YYXYXX"], expected: 3 },
      { id: 3, input: 's = "XXYYYY"', expectedOutput: '0', args: ["XXYYYY"], expected: 0 },
      { id: 4, input: 's = "Y"', expectedOutput: '0', args: ["Y"], expected: 0 },
      { id: 5, input: 's = "YX"', expectedOutput: '1', args: ["YX"], expected: 1 },
      { id: 6, input: 's = "XYXYXY"', expectedOutput: '2', args: ["XYXYXY"], expected: 2 },
    ],
    optimalComplexity: { time: 'O(N)', space: 'O(1)' },
  },
];
