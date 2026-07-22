// Code execution proxy (serverless) via the public Judge0 CE instance.
// (The public Piston API became whitelist-only in Feb 2026, so we use Judge0.)
// Swappable via EXEC_URL (e.g. a self-hosted Judge0 or Piston). ESM so it can be
// unit-tested by Vitest.
export const MAX_CODE = 8000;
export const TIMEOUT_MS = 9000; // fits within Vercel Hobby's 10s function limit

// Judge0 language_id per our LANGS id (verified against ce.judge0.com/languages).
export const RUNTIMES = {
  python: 71,
  typescript: 94,
  java: 62,
  cpp: 54,
  go: 95,
  rust: 73,
  ruby: 72,
  php: 68,
  swift: 83,
  kotlin: 78,
  lua: 64,
  dart: 90,
  r: 80,
  csharp: 51,
};

export function validateInput(language, code, runtimes) {
  if (typeof language !== 'string' || typeof code !== 'string') {
    return { ok: false, status: 400, error: 'Missing language or code' };
  }
  if (!runtimes[language]) {
    return { ok: false, status: 400, error: 'Unsupported language' };
  }
  if (code.length > MAX_CODE) {
    return { ok: false, status: 413, error: 'Code too large' };
  }
  return { ok: true };
}

const EXEC_URL =
  process.env.EXEC_URL || 'https://ce.judge0.com/submissions/?base64_encoded=true&wait=true';

// Judge0 returns stdout/stderr/compile_output base64-encoded when base64_encoded=true
// (required: gcc/javac emit non-UTF-8 bytes that otherwise 400 the request).
const b64d = (s) => (s ? Buffer.from(s, 'base64').toString('utf8') : '');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { language, code } = req.body || {};
  const v = validateInput(language, code, RUNTIMES);
  if (!v.ok) return res.status(v.status).json({ error: v.error });

  const languageId = RUNTIMES[language];
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const execRes = await fetch(EXEC_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language_id: languageId, source_code: Buffer.from(code, 'utf8').toString('base64') }),
    });
    const data = await execRes.json().catch(() => ({}));
    if (!execRes.ok) {
      return res.status(502).json({ error: 'Execution service error' });
    }
    const statusId = data.status?.id;
    const stderr = [b64d(data.compile_output), b64d(data.stderr)].filter(Boolean).join('\n');
    return res.status(200).json({
      stdout: b64d(data.stdout),
      stderr,
      exitCode: statusId === 3 ? 0 : 1, // 3 = Accepted in Judge0
    });
  } catch (e) {
    if (e.name === 'AbortError') return res.status(504).json({ error: 'Execution timed out' });
    return res.status(500).json({ error: 'Execution failed' });
  } finally {
    clearTimeout(timer);
  }
}
