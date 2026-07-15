# Aloha Build Club

A daily body-doubling room for people building with AI. Standalone Vercel project, sibling brand under Aloha AI / RN Collins LLC.

Live target: **https://aloha-build-club.vercel.app**

## Structure
```
aloha-build-club/
├── index.html          # landing page (evidenced, Build-Standards compliant)
├── api/
│   └── lead.js         # POST lead + analytics → Upstash + Slack
├── vercel.json         # security headers + asset caching
├── sitemap.xml
├── robots.txt
├── research/
│   └── EVIDENCE.md      # every site claim mapped to a primary source
└── README.md
```

## Deploy (HARD RULE: git push only — never the Vercel CLI)
Per the deploy-guard standard, `vercel`/`vercel --prod` is banned across all RN Collins projects (free-tier daily deploy cap). Deploys happen through GitHub → Vercel auto-build on push to `main`.

**First-time setup**
1. Create a new GitHub repo `aloha-build-club`, push these files to `main`.
   ```bash
   git init && git add . && git commit -m "Aloha Build Club: initial landing"
   git branch -M main
   git remote add origin git@github.com:rn-collins/aloha-build-club.git
   git push -u origin main
   ```
2. In Vercel: **Add New → Project → Import** the repo. Framework preset: **Other** (static + serverless functions; no build step).
3. Add environment variables (Project → Settings → Environment Variables):
   - `UPSTASH_REDIS_REST_URL` = `https://amusing-hippo-92821.upstash.io`
   - `UPSTASH_REDIS_REST_TOKEN` = *(from Upstash console)*
   - `SLACK_WEBHOOK_URL` = *(webhook for #all-AI-alerts)*
   - `ALERT_EMAIL` = `rayven.nikkita.collins@gmail.com`
4. Deploy. Thereafter, every `git push origin main` auto-deploys.

**Ongoing**
```bash
git add . && git commit -m "…" && git push origin main
```

## Build Standards checklist (met)
- [x] Lead capture `api/lead.js` → Upstash + Slack, CORS enabled
- [x] Vercel Analytics + Speed Insights in `<head>`
- [x] GA4 placeholder (`G-XXXXXXXXXX` — replace when property exists)
- [x] Custom `/api/track` behavior folded into `/api/lead` (page_view, scroll_depth, CTA)
- [x] UTM capture on load, stored with every lead/event
- [x] Enroll modal captures email before any checkout redirect
- [x] "Contact the Architect" fixed gold pill → `/api/lead`
- [x] RN Builds + rncollins.com links in footer
- [x] Lighthouse: skip link, one H1, focus-visible, OG/Twitter/canonical, JSON-LD, favicon, robots meta, sitemap
- [x] `vercel.json` security headers + immutable asset caching
- [x] `og.png` social image — 1200×630, generated and in repo root
- [x] Checkout redirect wired — set `CHECKOUT_URL.{monthly,annual}` in `index.html` to your Stan/Gumroad links; blank = lead-capture-only fallback
- [ ] GA4 Measurement ID — pending RN creating the property
- [ ] Paste actual Stan/Gumroad URLs into `CHECKOUT_URL` (mechanism is done, URLs are blank)

## After deploy
Update the **Deployed Vercel Projects** table in the Notion CLAUDE CONTEXT page (canonical site inventory).

## Notes / open decisions
- **Payments:** enroll modal captures the lead, then should redirect to a Stan/Gumroad checkout — not yet wired (no listing URL). Add as a named constant in `index.html`.
- **AI co-pilot** is described as the product's core but is not built here — this is the marketing front door + validation funnel. Ship the page, collect founding-cohort emails, run the room manually first (see EVIDENCE.md §5 validation logic and the aloha-ai-brief validation plan).
