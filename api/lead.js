// POST /api/lead — lead + analytics capture for Aloha Build Club
// Per RN Collins Build Standards: store in Upstash, fire Slack alert, CORS enabled.
//
// FAIL-LOUD CONTRACT (so the client can fall back to mailto and never lose a lead):
//   - Analytics pings (source starts "analytics_") are best-effort → always 200.
//   - Real leads MUST be durably stored. If Upstash isn't configured OR the write
//     fails, we return 503 (not a fake 200). The client then opens a prefilled
//     mailto so the lead is never silently dropped.
//
// Env vars (set in Vercel project settings):
//   UPSTASH_REDIS_REST_URL   e.g. https://amusing-hippo-92821.upstash.io
//   UPSTASH_REDIS_REST_TOKEN
//   SLACK_WEBHOOK_URL        webhook for #all-AI-alerts
//   ALERT_EMAIL              rayven.nikkita.collins@gmail.com (informational)

export default async function handler(req, res) {
  // ---- CORS ----
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
      email, name, message, source, ts,
      ip: (req.headers['x-forwarded-for'] || '').split(',')[0] || null,
      ua: req.headers['user-agent'] || null,
      referrer: req.headers['referer'] || null,
    };

    const U = process.env.UPSTASH_REDIS_REST_URL;
    const T = process.env.UPSTASH_REDIS_REST_TOKEN;
    const SLACK = process.env.SLACK_WEBHOOK_URL;

    async function store() {
      const key = `leads:${source}:${ts}`;
      const r = await fetch(`${U}/set/${encodeURIComponent(key)}/${encodeURIComponent(JSON.stringify(record))}`, {
        headers: { Authorization: `Bearer ${T}` },
      });
      return r.ok;
    }

    // ---- Analytics: best-effort, never fail the request ----
    if (isAnalytics) {
      if (U && T) { try { await store(); } catch (e) {} }
      return res.status(200).json({ ok: true, analytics: true });
    }

    // ---- Real lead: must be durably captured, or tell the client to fall back ----
    let stored = false;
    if (U && T) {
      try { stored = await store(); } catch (e) { stored = false; }
    }

    // Slack alert is best-effort and does not gate success (email is the source of truth).
    if (SLACK) {
      const text = `🌴 *Build Club lead* — <mailto:${email}|${email}>` +
        (name ? ` (${name})` : '') +
        `\nsource: \`${source}\`` +
        (message ? `\n${message}` : '');
      try {
        await fetch(SLACK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });
      } catch (e) {}
    }

    if (!stored) {
      // Not configured or the write failed — do NOT pretend success.
      return res.status(503).json({ ok: false, error: 'lead-store-unavailable' });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: 'server error' });
  }
}
