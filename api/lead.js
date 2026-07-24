// POST /api/lead — lead + analytics capture for Aloha Build Club
// Per RN Collins Build Standards: store in Upstash, fire Slack alert, CORS enabled.
// Env vars (set in Vercel project settings):
//   UPSTASH_REDIS_REST_URL   e.g. https://amusing-hippo-92821.upstash.io
//   UPSTASH_REDIS_REST_TOKEN
//   SLACK_WEBHOOK_URL        webhook for #all-AI-alerts
//   ALERT_EMAIL              rayven.nikkita.collins@gmail.com (informational)

export default async function handler(req, res) {
  // ---- CORS (so static pages on other origins can post) ----
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { email, name = '', message = '', source = 'unknown' } = body;
    if (!email) return res.status(400).json({ error: 'email required' });

    const isAnalytics = source.startsWith('analytics_');
    const ts = Date.now();
    const record = {
      email, name, message, source,
      ts,
      ip: (req.headers['x-forwarded-for'] || '').split(',')[0] || null,
      ua: req.headers['user-agent'] || null,
      referrer: req.headers['referer'] || null,
    };

    // ---- Store in Upstash (REST) ----
    const U = process.env.UPSTASH_REDIS_REST_URL;
    const T = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (U && T) {
      const key = `leads:${source}:${ts}`;
      await fetch(`${U}/set/${encodeURIComponent(key)}/${encodeURIComponent(JSON.stringify(record))}`, {
        headers: { Authorization: `Bearer ${T}` },
      }).catch(() => {});
    }

    // ---- Slack alert (skip pure analytics pings to avoid noise) ----
    const SLACK = process.env.SLACK_WEBHOOK_URL;
    if (SLACK && !isAnalytics) {
      const text = `🌅 *Build Club lead* — <mailto:${email}|${email}>` +
        (name ? ` (${name})` : '') +
        `\nsource: \`${source}\`` +
        (message ? `\n${message}` : '');
      await fetch(SLACK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      }).catch(() => {});
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: 'server error' });
  }
}
