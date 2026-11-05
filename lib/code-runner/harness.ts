/**
 * Test harness generation for the mock-interview runner.
 *
 * Each question declares a RunnerSpec (function signature or design class) and
 * structured test cases. From those we generate a small driver program per
 * language that calls the user's code and prints one marker line per test:
 *
 *   __CPD__|R|<testId>|<json result>
 *   __CPD__|E|<testId>|<error message>
 *
 * The same parser grades output from every runtime (browser or Judge0).
 * This module is pure (no DOM / Node APIs) so both client and server can use it.
 */

export type ParamType = 'int' | 'int[]' | 'int[][]' | 'char[][]' | 'string[]';
export type ValueType = ParamType | 'void';

export type RunnerSpec =
  | {
      kind: 'function';
      method: string;
      params: { name: string; type: ParamType }[];
      returns: ValueType;
      /** Compare list results ignoring order */
      unordered?: boolean;
    }
  | {
      kind: 'design';
      className: string;
      ctorParams: ParamType[];
      methods: Record<string, { params: ParamType[]; returns: ValueType }>;
    };

export interface RunnableTest {
  id: number;
  /** Function questions: positional arguments */
  args?: unknown[];
  /** Design questions: [methodName, args][]; the first entry is the constructor */
  ops?: [string, unknown[]][];
  /** Expected result (for design questions: the return value of the last op) */
  expected: unknown;
}

export type RunLanguage = 'python' | 'typescript' | 'cpp' | 'java';

export const MARKER = '__CPD__';

export interface TestOutcome {
  id: number;
  passed: boolean;
  status: 'Accepted' | 'Wrong Answer' | 'Runtime Error' | 'Time Limit Exceeded' | 'Compile Error' | 'Not Run';
  output: string;
}

// ───────────────────────── Python ─────────────────────────

export function buildPythonProgram(userCode: string, spec: RunnerSpec, tests: RunnableTest[]): string {
  // JSON.stringify of a JSON string yields a valid Python string literal
  const testsLiteral = JSON.stringify(JSON.stringify(tests));
  const runBody =
    spec.kind === 'function'
      ? `    __target = Solution().${spec.method} if 'Solution' in globals() else globals()['${spec.method}']
    return __target(*t["args"])`
      : `    __ops = t["ops"]
    __obj = ${spec.className}(*__ops[0][1])
    __last = None
    for __name, __a in __ops[1:]:
        __last = getattr(__obj, __name)(*__a)
    return __last`;

  return `${userCode}

import json as __json
__TESTS = __json.loads(${testsLiteral})

def __run(t):
${runBody}

for __t in __TESTS:
    try:
        __r = __run(__t)
        print("${MARKER}|R|" + str(__t["id"]) + "|" + __json.dumps(__r))
    except BaseException as __e:
        print("${MARKER}|E|" + str(__t["id"]) + "|" + type(__e).__name__ + ": " + str(__e).replace("\\n", " "))
`;
}

// ─────────────────────── JavaScript (from TS) ───────────────────────

/**
 * Appended to the user's type-stripped TypeScript. Expects `__out(line)` to be in scope.
 */
export function buildJsHarness(spec: RunnerSpec, tests: RunnableTest[]): string {
  const runBody =
    spec.kind === 'function'
      ? `const __fn = (typeof ${spec.method} === 'function') ? ${spec.method}
      : (typeof Solution === 'function' ? (...a) => new Solution().${spec.method}(...a) : undefined);
    if (!__fn) throw new Error('Function ${spec.method} is not defined');
    return __fn(...JSON.parse(JSON.stringify(t.args)));`
      : `const __obj = new ${spec.className}(...t.ops[0][1]);
    let __last = null;
    for (const [__name, __a] of t.ops.slice(1)) __last = __obj[__name](...__a);
    return __last;`;

  return `
;(() => {
  const __TESTS = ${JSON.stringify(tests)};
  const __run = (t) => {
    ${runBody}
  };
  for (const __t of __TESTS) {
    try {
      let __r = __run(__t);
      if (__r === undefined) __r = null;
      __out('${MARKER}|R|' + __t.id + '|' + JSON.stringify(__r));
    } catch (__e) {
      __out('${MARKER}|E|' + __t.id + '|' + String(__e && __e.message ? __e.name + ': ' + __e.message : __e));
    }
  }
})();
`;
}

// ───────────────────────── C++ ─────────────────────────

function cppLiteral(type: ParamType, value: unknown): string {
  switch (type) {
    case 'int':
      return String(Number(value));
    case 'int[]':
      return `std::vector<int>{${(value as number[]).join(',')}}`;
    case 'int[][]':
      return `std::vector<std::vector<int>>{${(value as number[][]).map((r) => `{${r.join(',')}}`).join(',')}}`;
    case 'char[][]':
      return `std::vector<std::vector<char>>{${(value as string[][])
        .map((r) => `{${r.map((c) => charLiteral(c)).join(',')}}`)
        .join(',')}}`;
    case 'string[]':
      return `std::vector<std::string>{${(value as string[]).map((s) => JSON.stringify(s)).join(',')}}`;
  }
}

function charLiteral(c: string): string {
  const ch = c.charAt(0);
  if (ch === "'" || ch === '\\') return `'\\${ch}'`;
  return `'${ch}'`;
}

export function buildCppProgram(userCode: string, spec: RunnerSpec, tests: RunnableTest[]): string {
  const blocks = tests.map((t) => {
    let body: string;
    if (spec.kind === 'function') {
      const decls = spec.params.map((p, i) => `auto __a${i} = ${cppLiteral(p.type, t.args?.[i])};`).join(' ');
      const call = `__s.${spec.method}(${spec.params.map((_, i) => `__a${i}`).join(', ')})`;
      body =
        spec.returns === 'void'
          ? `${decls} Solution __s; ${call}; std::cout << "${MARKER}|R|${t.id}|null\\n";`
          : `${decls} Solution __s; auto __r = ${call}; std::cout << "${MARKER}|R|${t.id}|"; __p(__r); std::cout << "\\n";`;
    } else {
      const ops = t.ops ?? [];
      const ctorArgs = (ops[0]?.[1] ?? []).map((v, i) => cppLiteral(spec.ctorParams[i], v)).join(', ');
      const lines = [`${spec.className} __o(${ctorArgs});`];
      ops.slice(1).forEach(([name, args], idx) => {
        const m = spec.methods[name];
        const argList = args.map((v, i) => cppLiteral(m.params[i], v)).join(', ');
        const isLast = idx === ops.length - 2;
        if (isLast && m.returns !== 'void') {
          lines.push(`auto __r = __o.${name}(${argList}); std::cout << "${MARKER}|R|${t.id}|"; __p(__r); std::cout << "\\n";`);
        } else {
          lines.push(`__o.${name}(${argList});`);
          if (isLast) lines.push(`std::cout << "${MARKER}|R|${t.id}|null\\n";`);
        }
      });
      body = lines.join(' ');
    }
    return `  try { ${body} }
  catch (const std::exception& __e) { std::cout << "${MARKER}|E|${t.id}|" << __e.what() << "\\n"; }
  catch (...) { std::cout << "${MARKER}|E|${t.id}|unknown exception\\n"; }
  std::cout.flush();`;
  });

  return `#include <bits/stdc++.h>
using namespace std;

${userCode}

static void __p(int v) { std::cout << v; }
static void __p(long long v) { std::cout << v; }
static void __p(bool v) { std::cout << (v ? "true" : "false"); }
static void __p(const std::string& s) {
  std::cout << '"';
  for (char c : s) { if (c == '"' || c == '\\\\') std::cout << '\\\\'; std::cout << c; }
  std::cout << '"';
}
template <typename T> static void __p(const std::vector<T>& v) {
  std::cout << '[';
  for (size_t i = 0; i < v.size(); ++i) { if (i) std::cout << ','; __p(v[i]); }
  std::cout << ']';
}

int main() {
${blocks.join('\n')}
  return 0;
}
`;
}

// ───────────────────────── Java ─────────────────────────

function javaLiteral(type: ParamType, value: unknown): string {
  switch (type) {
    case 'int':
      return String(Number(value));
    case 'int[]':
      return `new int[]{${(value as number[]).join(',')}}`;
    case 'int[][]':
      return `new int[][]{${(value as number[][]).map((r) => `{${r.join(',')}}`).join(',')}}`;
    case 'char[][]':
      return `new char[][]{${(value as string[][]).map((r) => `{${r.map((c) => charLiteral(c)).join(',')}}`).join(',')}}`;
    case 'string[]':
      return `new String[]{${(value as string[]).map((s) => JSON.stringify(s)).join(',')}}`;
  }
}

export function buildJavaProgram(userCode: string, spec: RunnerSpec, tests: RunnableTest[]): string {
  // Judge0 compiles Main.java, so user classes must not be public
  const code = userCode.replace(/^public\s+((?:final\s+|abstract\s+)*)class\s+/gm, '$1class ');

  const blocks = tests.map((t) => {
    let body: string;
    if (spec.kind === 'function') {
      const decls = spec.params.map((p, i) => `var __a${i} = ${javaLiteral(p.type, t.args?.[i])};`).join(' ');
      const call = `new Solution().${spec.method}(${spec.params.map((_, i) => `__a${i}`).join(', ')})`;
      body =
        spec.returns === 'void'
          ? `${decls} ${call}; System.out.println("${MARKER}|R|${t.id}|null");`
          : `${decls} var __r = ${call}; System.out.print("${MARKER}|R|${t.id}|"); __p(__r); System.out.println();`;
    } else {
      const ops = t.ops ?? [];
      const ctorArgs = (ops[0]?.[1] ?? []).map((v, i) => javaLiteral(spec.ctorParams[i], v)).join(', ');
      const lines = [`${spec.className} __o = new ${spec.className}(${ctorArgs});`];
      ops.slice(1).forEach(([name, args], idx) => {
        const m = spec.methods[name];
        const argList = args.map((v, i) => javaLiteral(m.params[i], v)).join(', ');
        const isLast = idx === ops.length - 2;
        if (isLast && m.returns !== 'void') {
          lines.push(`var __r = __o.${name}(${argList}); System.out.print("${MARKER}|R|${t.id}|"); __p(__r); System.out.println();`);
        } else {
          lines.push(`__o.${name}(${argList});`);
          if (isLast) lines.push(`System.out.println("${MARKER}|R|${t.id}|null");`);
        }
      });
      body = lines.join(' ');
    }
    return `    try { ${body} } catch (Throwable __e) { System.out.println("${MARKER}|E|${t.id}|" + String.valueOf(__e).replace('\\n', ' ')); }`;
  });

  return `${code}

public class Main {
    static void __p(int v) { System.out.print(v); }
    static void __p(long v) { System.out.print(v); }
    static void __p(boolean v) { System.out.print(v); }
    static void __p(String s) {
        StringBuilder b = new StringBuilder("\\"");
        for (char c : s.toCharArray()) { if (c == '"' || c == '\\\\') b.append('\\\\'); b.append(c); }
        System.out.print(b.append('"'));
    }
    static void __p(java.util.List<?> v) {
        System.out.print('[');
        for (int i = 0; i < v.size(); i++) { if (i > 0) System.out.print(','); __pAny(v.get(i)); }
        System.out.print(']');
    }
    static void __p(int[] v) {
        System.out.print('[');
        for (int i = 0; i < v.length; i++) { if (i > 0) System.out.print(','); System.out.print(v[i]); }
        System.out.print(']');
    }
    static void __p(String[] v) { __p(java.util.Arrays.asList(v)); }
    static void __pAny(Object o) {
        if (o instanceof String) __p((String) o);
        else if (o instanceof java.util.List) __p((java.util.List<?>) o);
        else System.out.print(o);
    }

    public static void main(String[] args) {
${blocks.join('\n')}
        System.out.flush();
    }
}
`;
}

// ───────────────────────── Grading ─────────────────────────

function normalize(value: unknown, unordered: boolean): string {
  if (unordered && Array.isArray(value)) {
    return JSON.stringify([...value].map((v) => JSON.stringify(v)).sort());
  }
  return JSON.stringify(value);
}

/**
 * Parse marker lines from program stdout and grade each test.
 * `fallbackStatus` is used for tests that produced no marker line
 * (e.g. the process crashed or timed out before reaching them).
 */
export function gradeOutput(
  stdout: string,
  spec: RunnerSpec,
  tests: RunnableTest[],
  fallbackStatus: TestOutcome['status'] = 'Runtime Error',
  fallbackMessage = 'No output (program crashed or was stopped before this test)'
): { outcomes: TestOutcome[]; consoleOutput: string } {
  const unordered = spec.kind === 'function' && !!spec.unordered;
  const found = new Map<number, { kind: 'R' | 'E'; payload: string }>();
  const consoleLines: string[] = [];

  for (const line of stdout.split(/\r?\n/)) {
    if (line.startsWith(MARKER + '|')) {
      const [, kind, id, ...rest] = line.split('|');
      const testId = Number(id);
      if (!found.has(testId)) found.set(testId, { kind: kind as 'R' | 'E', payload: rest.join('|') });
    } else if (line.trim()) {
      consoleLines.push(line);
    }
  }

  const outcomes = tests.map((t): TestOutcome => {
    const hit = found.get(t.id);
    if (!hit) return { id: t.id, passed: false, status: fallbackStatus, output: fallbackMessage };
    if (hit.kind === 'E') return { id: t.id, passed: false, status: 'Runtime Error', output: hit.payload };

    let actual: unknown;
    try {
      actual = JSON.parse(hit.payload);
    } catch {
      return { id: t.id, passed: false, status: 'Wrong Answer', output: hit.payload };
    }
    const passed = normalize(actual, unordered) === normalize(t.expected, unordered);
    return { id: t.id, passed, status: passed ? 'Accepted' : 'Wrong Answer', output: JSON.stringify(actual) };
  });

  return { outcomes, consoleOutput: consoleLines.join('\n').slice(0, 4000) };
}
