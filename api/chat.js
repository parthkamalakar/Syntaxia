const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MAX_MESSAGES = 12;
const MAX_MESSAGE_CHARS = 4000;
const MAX_TOTAL_CHARS = 16000;
const REQUEST_TIMEOUT_MS = 15000;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Missing GROQ_API_KEY environment variable' });
  }

  const { messages } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Missing messages array' });
  }

  const totalChars = messages.reduce((sum, message) => (
    sum + (typeof message?.content === 'string' ? message.content.length : 0)
  ), 0);
  if (totalChars > MAX_TOTAL_CHARS) {
    return res.status(413).json({ error: 'Message is too large' });
  }

  const safeMessages = messages
    .filter((message) => message && typeof message.content === 'string')
    .slice(-MAX_MESSAGES)
    .map((message) => ({
      role: ['system', 'user', 'assistant'].includes(message.role) ? message.role : 'user',
      content: message.content.slice(0, MAX_MESSAGE_CHARS),
    }));

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const groqRes = await fetch(GROQ_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
        messages: safeMessages,
        max_tokens: 600,
        temperature: 0.7,
      }),
    });

    const data = await groqRes.json().catch(() => ({}));
    if (!groqRes.ok) {
      const message = data.error?.message || `Groq request failed with status ${groqRes.status}`;
      return res.status(groqRes.status).json({ error: message });
    }

    const reply = data.choices?.[0]?.message?.content || '';
    return res.status(200).json({ reply });
  } catch (error) {
    if (error.name === 'AbortError') {
      return res.status(504).json({ error: 'Groq request timed out' });
    }
    return res.status(500).json({ error: error.message || 'Groq request failed' });
  } finally {
    clearTimeout(timeout);
  }
};
