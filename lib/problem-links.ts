/** Builds a link to a problem on its platform from the stored problem_id. */
export function problemUrl(platform: string | null | undefined, problemId: string | null | undefined): string | null {
  if (!platform || !problemId) return null;
  const p = platform.toLowerCase();
  if (p === 'leetcode') return `https://leetcode.com/problems/${encodeURIComponent(problemId)}/`;
  if (p === 'codechef') return `https://www.codechef.com/problems/${encodeURIComponent(problemId)}`;
  if (p === 'codeforces') {
    // Stored as `${contestId}${index}`, e.g. "1872B" or "1950A1"
    const m = problemId.match(/^(\d+)([A-Za-z][A-Za-z0-9]*)$/);
    return m ? `https://codeforces.com/problemset/problem/${m[1]}/${m[2]}` : null;
  }
  return null;
}
