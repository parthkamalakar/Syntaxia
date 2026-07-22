// Hybrid compiler: in-browser JS/HTML/CSS + Piston proxy for everything else.

export function normalize(s) {
  return String(s)
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.replace(/\s+$/, ''))
    .join('\n')
    .replace(/\n+$/, '');
}

export function matchesExpected(actual, expected) {
  if (!expected) return true;
  return normalize(actual) === normalize(expected);
}

function fmt(arg) {
  if (typeof arg === 'string') return arg;
  if (arg instanceof Error) return arg.stack || arg.message;
  try {
    return JSON.stringify(arg);
  } catch (e) {
    return String(arg);
  }
}

// In-browser JavaScript runner with a captured console.
export function runJS(code) {
  const stdout = [];
  const stderr = [];
  const sandboxConsole = {
    log: (...a) => stdout.push(a.map(fmt).join(' ')),
    info: (...a) => stdout.push(a.map(fmt).join(' ')),
    debug: (...a) => stdout.push(a.map(fmt).join(' ')),
    warn: (...a) => stderr.push(a.map(fmt).join(' ')),
    error: (...a) => stderr.push(a.map(fmt).join(' ')),
  };
  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function('console', `"use strict";\n${code}`);
    fn(sandboxConsole);
    return { stdout: stdout.join('\n'), stderr: stderr.join('\n'), exitCode: 0 };
  } catch (e) {
    return { stdout: stdout.join('\n'), stderr: fmt(e), exitCode: 1 };
  }
}

// HTML/CSS → srcdoc for an <iframe> preview.
export function runHTML(code) {
  const hasHtmlTag = /<html[\s>]/i.test(code);
  const doc = hasHtmlTag
    ? code
    : `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:Inter,system-ui,sans-serif;color:#0b0c10;background:#fff;padding:16px;}</style></head><body>${code}</body></html>`;
  return { rendered: doc };
}

// Remote execution via the /api/run Piston proxy.
export async function runRemote(language, code) {
  try {
    const res = await fetch('/api/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language, code }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { stdout: '', stderr: data.error || 'Execution failed', exitCode: 1 };
    }
    return {
      stdout: data.stdout || '',
      stderr: data.stderr || '',
      exitCode: typeof data.exitCode === 'number' ? data.exitCode : 0,
    };
  } catch (e) {
    return { stdout: '', stderr: String(e.message || e), exitCode: 1 };
  }
}

// Languages that can't execute in-browser or via a code backend get a
// reference-output preview (e.g. SQL needs a live database).
const PREVIEW_ONLY = new Set(['sql', 'phaser']);

// Route execution by language id. Returns { stdout, stderr, exitCode, rendered?, previewOnly? }.
export async function runCodeForLesson(langId, code) {
  if (langId === 'javascript') {
    return runJS(code);
  }
  if (langId === 'html' || langId === 'css') {
    return runHTML(code);
  }
  if (PREVIEW_ONLY.has(langId)) {
    return { stdout: '', stderr: '', exitCode: 0, previewOnly: true };
  }
  return runRemote(langId, code);
}
