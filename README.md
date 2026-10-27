# pi-data-search

Standalone reusable Data Search Pi skill with a zero-dependency Node.js evidence helper.

This repository owns the reusable skill, helper, tests, and documentation. The [Data Research Stack](https://github.com/darkrei08/data-research-stack) owns service deployment, provider infrastructure, and stack-specific evidence. This repository does not include stack services, credentials, browser profiles, compose files, or data volumes.

## Install

Clone the repository and install the skill for Pi:

```bash
git clone https://github.com/darkrei08/pi-data-search.git
cd pi-data-search
ln -sfn "$PWD/skills/reusable-data-search" ~/.pi/agent/skills/reusable-data-search
```

Reload Pi after changing its skill configuration. The helper has no runtime dependencies. The package metadata also exposes it as `pi-data-search` when installed or linked with npm:

```bash
npm install
npm test
```

## Usage

Fetch a known public URL with bounded JSON evidence:

```bash
node skills/reusable-data-search/bin/search.mjs \
  --url https://example.com \
  --max-results 10 --max-chars 12000 --json
```

The helper returns `records`, `failures`, `truncated`, and `omitted`. Each record includes a canonical citation URL, title, provider, source type, retrieval time, freshness status, and bounded text.

For a known public URL, the helper attempts direct HTTP first. Configure the optional service fallbacks only when their endpoints are available:

| Variable | Default | Purpose |
| --- | --- | --- |
| `RESEARCH_HTTP_TIMEOUT_MS` | `10000` | Per-provider request timeout |
| `RESEARCH_MAX_BYTES` | `2000000` | Maximum response bytes before parsing |
| `RESEARCH_MAX_AGE_DAYS` | `30` | Freshness threshold |
| `CRAWL4AI_URL` | unset | Full Crawl4AI endpoint |
| `CRAWL4AI_API_TOKEN` | unset | Crawl4AI bearer token; never print or commit it |
| `PLAYWRIGHT_URL` | unset | Full Playwright scrape endpoint |
| `RESEARCH_ENABLE_PLAYWRIGHT` | unset | Must be `1` to enable the last fallback |

Firecrawl MCP, Lightpanda, and BrowserOS are Pi integrations documented in [`providers.md`](skills/reusable-data-search/references/providers.md), not additional standalone services. BrowserOS authenticated use always requires explicit human authorization.

## Skill behavior

Use the skill for source discovery, technical documentation, GitHub research, and evidence-based comparisons. Preserve citations, freshness classification, canonical URL and content deduplication, bounded context, provider fallback, credential-safe errors, and explicit unavailable-provider failures.

See [`docs/reusable-data-search.md`](docs/reusable-data-search.md) for the detailed workflow and [`docs/evidence-and-blockers.md`](docs/evidence-and-blockers.md) for pinned provenance and verification evidence.
