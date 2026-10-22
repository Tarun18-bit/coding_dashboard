export interface FollowUpQuestion {
  question: string;
  interviewerIntent: string;
  suggestedApproach: string;
}

export interface ReviewResult {
  timeComplexity: string;
  timeExplanation: string;
  spaceComplexity: string;
  spaceExplanation: string;
  qualityScore: number; // 0 to 100
  verdict: 'Optimal' | 'Suboptimal' | 'Needs Optimization' | 'Brute Force';
  strengths: string[];
  bottlenecks: string[];
  edgeCasesToWatch: string[];
  optimizedCode: string;
  optimizationSummary: string;
  followUpQuestions: FollowUpQuestion[];
}

export interface PresetSample {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  topic: string;
  language: string;
  code: string;
  company: string;
}

export const PRESET_SAMPLES: PresetSample[] = [
  {
    id: 'two-sum',
    title: 'Two Sum',
    difficulty: 'Easy',
    topic: 'Hash Map',
    language: 'python',
    company: 'Amazon',
    code: `def twoSum(nums: list[int], target: int) -> list[int]:
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []`,
  },
  {
    id: 'trapping-rain-water',
    title: 'Trapping Rain Water',
    difficulty: 'Hard',
    topic: 'Two Pointers',
    language: 'cpp',
    company: 'Google',
    code: `int trap(vector<int>& height) {
    int left = 0, right = height.size() - 1;
    int leftMax = 0, rightMax = 0;
    int water = 0;
    
    while (left < right) {
        if (height[left] < height[right]) {
            if (height[left] >= leftMax) leftMax = height[left];
            else water += leftMax - height[left];
            left++;
        } else {
            if (height[right] >= rightMax) rightMax = height[right];
            else water += rightMax - height[right];
            right--;
        }
    }
    return water;
}`,
  },
  {
    id: 'lru-cache',
    title: 'LRU Cache',
    difficulty: 'Medium',
    topic: 'Design & Linked List',
    language: 'typescript',
    company: 'Meta',
    code: `class LRUCache {
    private capacity: number;
    private map = new Map<number, number>();

    constructor(capacity: number) {
        this.capacity = capacity;
    }

    get(key: number): number {
        if (!this.map.has(key)) return -1;
        const val = this.map.get(key)!;
        this.map.delete(key);
        this.map.set(key, val);
        return val;
    }

    put(key: number, value: number): void {
        if (this.map.has(key)) {
            this.map.delete(key);
        } else if (this.map.size >= this.capacity) {
            const firstKey = this.map.keys().next().value;
            if (firstKey !== undefined) this.map.delete(firstKey);
        }
        this.map.set(key, value);
    }
}`,
  },
  {
    id: 'course-schedule',
    title: 'Course Schedule',
    difficulty: 'Medium',
    topic: 'Graph / Topo Sort',
    language: 'java',
    company: 'Microsoft',
    code: `public boolean canFinish(int numCourses, int[][] prerequisites) {
    List<List<Integer>> adj = new ArrayList<>();
    for (int i = 0; i < numCourses; i++) adj.add(new ArrayList<>());
    int[] inDegree = new int[numCourses];
    
    for (int[] pre : prerequisites) {
        adj.get(pre[1]).add(pre[0]);
        inDegree[pre[0]]++;
    }
    
    Queue<Integer> q = new LinkedList<>();
    for (int i = 0; i < numCourses; i++) {
        if (inDegree[i] == 0) q.offer(i);
    }
    
    int count = 0;
    while (!q.isEmpty()) {
        int curr = q.poll();
        count++;
        for (int next : adj.get(curr)) {
            if (--inDegree[next] == 0) q.offer(next);
        }
    }
    return count == numCourses;
}`,
  },
  {
    id: 'valid-anagram',
    title: 'Valid Anagram',
    difficulty: 'Easy',
    topic: 'Hash Array',
    language: 'python',
    company: 'Apple',
    code: `def isAnagram(s: str, t: str) -> bool:
    if len(s) != len(t):
        return False
        
    counts = [0] * 26
    for c1, c2 in zip(s, t):
        counts[ord(c1) - ord('a')] += 1
        counts[ord(c2) - ord('a')] -= 1
        
    return all(c == 0 for c in counts)`,
  },
  {
    id: 'suboptimal-subarray',
    title: 'Subarray Sum (Brute Force)',
    difficulty: 'Medium',
    topic: 'Prefix Sum Need',
    language: 'python',
    company: 'Netflix',
    code: `def subarraySum(nums: list[int], k: int) -> int:
    count = 0
    # Quadratic brute force
    for i in range(len(nums)):
        curr_sum = 0
        for j in range(i, len(nums)):
            curr_sum += nums[j]
            if curr_sum == k:
                count += 1
    return count`,
  },
];

export function analyzeSolutionLocally(
  code: string,
  language: string,
  targetCompany: string = 'General'
): ReviewResult {
  const cleanCode = code.trim();
  const lower = cleanCode.toLowerCase();

  // Heuristic analysis based on pattern matching
  let hasNestedLoop = false;
  let hasSingleLoop = false;
  let hasHashMap = false;
  let hasSorting = false;
  let hasRecursion = false;
  let hasTwoPointers = false;
  let hasBinarySearch = false;

  if (
    lower.includes('for ') ||
    lower.includes('while ') ||
    lower.includes('forEach') ||
    lower.includes('.map(')
  ) {
    hasSingleLoop = true;
  }

  // Count loops
  const loopMatches = lower.match(/(for\s*\(|while\s*\(|for\s+[a-z0-9_]+\s+in)/g);
  if (loopMatches && loopMatches.length >= 2) {
    hasNestedLoop = true;
  }

  if (
    lower.includes('map<') ||
    lower.includes('unordered_map') ||
    lower.includes('new map') ||
    lower.includes('dict') ||
    lower.includes('seen') ||
    lower.includes('hashmap') ||
    lower.includes('{}')
  ) {
    hasHashMap = true;
  }

  if (
    lower.includes('.sort(') ||
    lower.includes('sort(') ||
    lower.includes('sorted(') ||
    lower.includes('arrays.sort')
  ) {
    hasSorting = true;
  }

  if (
    lower.includes('left') &&
    lower.includes('right') &&
    (lower.includes('left++') || lower.includes('right--') || lower.includes('left += 1') || lower.includes('right -= 1'))
  ) {
    hasTwoPointers = true;
  }

  if (
    lower.includes('mid') &&
    (lower.includes('binary') || lower.includes('mid =') || lower.includes('mid :='))
  ) {
    hasBinarySearch = true;
  }

  // Derive time & space complexity
  let timeComp = 'O(N)';
  let timeExpl = 'Processes elements in a linear scan through the input.';
  let spaceComp = 'O(1)';
  let spaceExpl = 'Operates in-place with constant additional memory.';
  let quality = 85;
  let verdict: ReviewResult['verdict'] = 'Optimal';

  if (hasNestedLoop) {
    timeComp = 'O(N²)';
    timeExpl = 'Contains nested iterations which square the required operations for size N.';
    quality = 65;
    verdict = 'Suboptimal';
  } else if (hasSorting) {
    timeComp = 'O(N log N)';
    timeExpl = 'Dominated by comparison-based sorting of the dataset.';
    quality = 88;
    verdict = 'Optimal';
  } else if (hasBinarySearch) {
    timeComp = 'O(log N)';
    timeExpl = 'Halves the search space at each iteration via binary subdivision.';
    quality = 95;
    verdict = 'Optimal';
  }

  if (hasHashMap) {
    spaceComp = 'O(N)';
    spaceExpl = 'Allocates hash table structures scaling linearly with input cardinality.';
  }

  if (hasTwoPointers && !hasHashMap) {
    spaceComp = 'O(1)';
    spaceExpl = 'Optimal two-pointer traversal avoiding extra buffer allocations.';
    quality = 94;
    verdict = 'Optimal';
  }

  const strengths: string[] = [];
  const bottlenecks: string[] = [];
  const edgeCases: string[] = [];

  if (hasHashMap) {
    strengths.push('Employs hash-table lookups for amortized O(1) average access times.');
  }
  if (hasTwoPointers) {
    strengths.push('Excellent pointer convergence minimizing unnecessary memory allocations.');
  }
  if (!hasNestedLoop) {
    strengths.push('Avoids quadratic brute-force nested looping, scaling well to large inputs (N = 10⁵).');
  } else {
    bottlenecks.push('Nested loop may trigger Time Limit Exceeded (TLE) when input size exceeds 10,000 elements.');
  }

  if (lower.includes('vector<') || lower.includes('.push(') || lower.includes('.append(')) {
    bottlenecks.push('Dynamic reallocation overhead: consider pre-allocating buffer capacity if length is known beforehand.');
  }

  edgeCases.push('Empty or single-element inputs (length 0 or 1).');
  edgeCases.push('Duplicate or identical values causing collision or premature convergence.');
  edgeCases.push('Extreme bounds / Integer overflow: numbers exceeding 32-bit signed limits ([-2³¹, 2³¹ - 1]).');

  const followUpQuestions: FollowUpQuestion[] = [
    {
      question: `How would your solution change if the input is an infinite incoming data stream that cannot fit entirely in memory?`,
      interviewerIntent: 'Evaluates system-design awareness, reservoir sampling, sliding window, or chunk-based caching.',
      suggestedApproach: 'Use an eviction strategy (LRU / LFU cache), streaming window, or external disk-based merge sort.',
    },
    {
      question: `What if the input contains massive numbers of duplicate elements?`,
      interviewerIntent: 'Checks if you recognize frequency maps, count arrays, or early pruning opportunities.',
      suggestedApproach: 'Group duplicates upfront into counts or skip identical adjacent entries to reduce search branches.',
    },
    {
      question: `Can you parallelize this algorithm across multiple CPU cores or worker threads?`,
      interviewerIntent: `Standard ${targetCompany} question testing distributed computing intuition and race-condition awareness.`,
      suggestedApproach: 'Partition the input into chunks, run worker threads on disjoint slices, and reduce the partial results with atomic locks or concurrent maps.',
    },
    {
      question: `How would you prove correctness for negative numbers and zero?`,
      interviewerIntent: 'Tests mathematical rigor and boundary testing.',
      suggestedApproach: 'Step through an explicit trace with [-3, 0, 3] target = 0 to verify pointer increments and sign-inversion safety.',
    },
    {
      question: `If memory was extremely constrained (embedded system with < 100 KB RAM), what trade-offs would you make?`,
      interviewerIntent: 'Assesses architectural flexibility between time-memory trade-offs.',
      suggestedApproach: 'Sacrifice O(N) hash-map speed for an in-place sort O(N log N) or two-pointer scan to guarantee O(1) space.',
    },
  ];

  // Build optimized code implementation
  let optimizedCode = '';
  let optimizationSummary = '';

  if (hasNestedLoop) {
    if (language === 'python') {
      optimizedCode = `# Optimal Refactoring: Linear O(N) Time, O(N) Space
def findDuplicates(nums: list[int]) -> list[int]:
    seen = set()
    duplicates = []
    
    for x in nums:
        if x in seen:
            duplicates.append(x)
        else:
            seen.add(x)
            
    return duplicates`;
    } else {
      optimizedCode = `// Optimal Refactoring: Linear O(N) Time, O(N) Space
#include <vector>
#include <unordered_set>

std::vector<int> findDuplicates(const std::vector<int>& nums) {
    std::unordered_set<int> seen;
    std::vector<int> duplicates;
    duplicates.reserve(nums.size() / 2); // Pre-allocate buffer to avoid reallocations
    
    for (int x : nums) {
        if (seen.find(x) != seen.end()) {
            duplicates.push_back(x);
        } else {
            seen.insert(x);
        }
    }
    return duplicates;
}`;
    }
    optimizationSummary = 'Eliminated the nested O(N²) loop by switching to a hash set for amortized O(1) membership checks, reducing total execution time from quadratic O(N²) to linear O(N). Added capacity pre-allocation to prevent dynamic vector resizing.';
  } else if (hasTwoPointers) {
    if (language === 'python') {
      optimizedCode = `# Optimal Two-Pointer Refactoring: O(N) Time, O(1) Auxiliary Space
def trap(height: list[int]) -> int:
    if not height:
        return 0
        
    left, right = 0, len(height) - 1
    left_max, right_max = height[left], height[right]
    water = 0
    
    while left < right:
        if left_max < right_max:
            left += 1
            left_max = max(left_max, height[left])
            water += left_max - height[left]
        else:
            right -= 1
            right_max = max(right_max, height[right])
            water += right_max - height[right]
            
    return water`;
    } else {
      optimizedCode = `// Optimal Two-Pointer Refactoring: O(N) Time, O(1) Auxiliary Space
#include <vector>
#include <algorithm>

int trap(const std::vector<int>& height) {
    if (height.empty()) return 0;
    
    int left = 0, right = static_cast<int>(height.size()) - 1;
    int leftMax = height[left], rightMax = height[right];
    int water = 0;
    
    while (left < right) {
        if (leftMax < rightMax) {
            left++;
            leftMax = std::max(leftMax, height[left]);
            water += leftMax - height[left];
        } else {
            right--;
            rightMax = std::max(rightMax, height[right]);
            water += rightMax - height[right];
        }
    }
    return water;
}`;
    }
    optimizationSummary = 'Achieved peak theoretical efficiency: O(N) time with O(1) constant auxiliary space. Added guard clauses for empty inputs and const-reference parameters to avoid copying memory.';
  } else {
    if (language === 'python') {
      optimizedCode = `# Optimal Idiomatic Refactoring: O(N) Time, O(N) Space
def twoSum(nums: list[int], target: int) -> list[int]:
    seen: dict[int, int] = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []`;
    } else {
      optimizedCode = `// Optimal Idiomatic Refactoring: O(N) Time, O(N) Space
#include <vector>
#include <unordered_map>

std::vector<int> twoSum(const std::vector<int>& nums, int target) {
    std::unordered_map<int, int> seen;
    seen.reserve(nums.size()); // Pre-allocate hash buckets
    
    for (int i = 0; i < static_cast<int>(nums.size()); ++i) {
        int complement = target - nums[i];
        auto it = seen.find(complement);
        if (it != seen.end()) {
            return {it->second, i};
        }
        seen[nums[i]] = i;
    }
    return {};
}`;
    }
    optimizationSummary = 'Maintained optimal linear complexity while optimizing cache locality with unordered_map bucket reservations and explicit type safety.';
  }

  return {
    timeComplexity: timeComp,
    timeExplanation: timeExpl,
    spaceComplexity: spaceComp,
    spaceExplanation: spaceExpl,
    qualityScore: quality,
    verdict,
    strengths,
    bottlenecks,
    edgeCasesToWatch: edgeCases,
    optimizedCode,
    optimizationSummary,
    followUpQuestions,
  };
}
