'use client';

/**
 * Runs Python (Pyodide) and TypeScript (types stripped with Sucrase) inside a
 * Web Worker in the user's own browser: free, unlimited, and isolated from the page.
 * A run that exceeds the time limit kills the worker (the next run starts a fresh one).
 */

const PYODIDE_URL = 'https://cdn.jsdelivr.net/npm/pyodide@0.29.5/';
const SUCRASE_URL = 'https://esm.sh/sucrase@3.35.0';

const WORKER_SOURCE = `
let pyodidePromise = null;
let sucrasePromise = null;

function getPyodide() {
  if (!pyodidePromise) {
    pyodidePromise = import('${PYODIDE_URL}pyodide.mjs').then((m) =>
      m.loadPyodide({ indexURL: '${PYODIDE_URL}' })
    );
  }
  return pyodidePromise;
}

function getSucrase() {
  if (!sucrasePromise) sucrasePromise = import('${SUCRASE_URL}');
  return sucrasePromise;
}

self.onmessage = async (event) => {
  const { id, language, program, userCode, harness } = event.data;
  const lines = [];
  try {
    if (language === 'python') {
      const py = await getPyodide();
      self.postMessage({ id, type: 'ready' });
      py.setStdout({ batched: (s) => lines.push(s) });
      py.setStderr({ batched: (s) => lines.push(s) });
      const ns = py.globals.get('dict')();
      try {
        py.runPython(program, { globals: ns });
      } finally {
        ns.destroy();
      }
      self.postMessage({ id, type: 'done', stdout: lines.join('\\n') });
    } else {
      const sucrase = await getSucrase();
      self.postMessage({ id, type: 'ready' });
      let js;
      try {
        js = sucrase.transform(userCode, { transforms: ['typescript'], disableESTransforms: true }).code;
      } catch (e) {
        self.postMessage({ id, type: 'compileError', message: String(e && e.message ? e.message : e) });
        return;
      }
      let fn;
      try {
        fn = new Function('__out', 'console', js + '\\n' + harness);
      } catch (e) {
        self.postMessage({ id, type: 'compileError', message: String(e) });
        return;
      }
      const log = (...a) => lines.push(a.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join(' '));
      fn((line) => lines.push(line), { log, error: log, warn: log, info: log });
      self.postMessage({ id, type: 'done', stdout: lines.join('\\n') });
    }
  } catch (e) {
    const msg = String(e && e.message ? e.message : e);
    // Python syntax/indentation errors surface here before any test runs
    if (language === 'python' && /SyntaxError|IndentationError/.test(msg)) {
      self.postMessage({ id, type: 'compileError', message: msg.split('\\n').slice(-4).join('\\n') });
    } else {
      self.postMessage({ id, type: 'done', stdout: lines.join('\\n'), fatal: msg.split('\\n').slice(-4).join('\\n') });
    }
  }
};
`;

export interface BrowserRunResult {
  stdout: string;
  compileError?: string;
  /** Uncaught error that stopped the program (tests after it get no result) */
  fatal?: string;
  timedOut?: boolean;
}

let worker: Worker | null = null;
let workerUrl: string | null = null;
let nextId = 1;

function getWorker(): Worker {
  if (!worker) {
    if (!workerUrl) {
      workerUrl = URL.createObjectURL(new Blob([WORKER_SOURCE], { type: 'text/javascript' }));
    }
    worker = new Worker(workerUrl, { type: 'module' });
  }
  return worker;
}

function killWorker() {
  worker?.terminate();
  worker = null;
}

/**
 * @param timeLimitMs time allowed for the code itself, counted after the runtime has loaded
 */
export function runInBrowser(
  params:
    | { language: 'python'; program: string }
    | { language: 'typescript'; userCode: string; harness: string },
  onStatus?: (status: 'loading' | 'running') => void,
  timeLimitMs = 6000
): Promise<BrowserRunResult> {
  const id = nextId++;
  const w = getWorker();
  onStatus?.('loading');

  return new Promise((resolve) => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    // Generous limit while the runtime downloads (first Python run fetches ~10 MB)
    const loadTimer = setTimeout(() => finish({ stdout: '', fatal: 'Timed out loading the code runtime. Check your connection and try again.' }, true), 60000);

    const finish = (result: BrowserRunResult, kill = false) => {
      clearTimeout(loadTimer);
      if (timer) clearTimeout(timer);
      w.removeEventListener('message', onMessage);
      w.removeEventListener('error', onError);
      if (kill) killWorker();
      resolve(result);
    };

    const onMessage = (event: MessageEvent) => {
      const data = event.data;
      if (data.id !== id) return;
      if (data.type === 'ready') {
        clearTimeout(loadTimer);
        onStatus?.('running');
        timer = setTimeout(() => finish({ stdout: '', timedOut: true }, true), timeLimitMs);
      } else if (data.type === 'compileError') {
        finish({ stdout: '', compileError: data.message });
      } else if (data.type === 'done') {
        finish({ stdout: data.stdout ?? '', fatal: data.fatal });
      }
    };
    const onError = (event: ErrorEvent) => {
      finish({ stdout: '', fatal: event.message || 'The code runner failed to start.' }, true);
    };

    w.addEventListener('message', onMessage);
    w.addEventListener('error', onError);
    w.postMessage({ id, ...params });
  });
}
