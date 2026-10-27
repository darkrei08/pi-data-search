# Reusable Data Search

`skills/reusable-data-search` is the Pi instruction contract and `skills/reusable-data-search/bin/search.mjs` is its credential-safe, deterministic evidence helper.

The standalone repository owns these reusable assets. The [Data Research Stack](https://github.com/darkrei08/data-research-stack) owns service deployment and provider infrastructure. Use the stack's documented service endpoints when configured; do not copy its compose files, credentials, browser profiles, volumes, or generated setup files into this repository.

## Install

```bash
ln -sfn "$PWD/skills/reusable-data-search" ~/.pi/agent/skills/reusable-data-search
```

Reload Pi after changing its skill configuration. The helper uses only Node.js built-ins and can be run directly:

```bash
node skills/reusable-data-search/bin/search.mjs \
  --url https://example.com \
  --max-results 10 --max-chars 12000 --json
```

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `RESEARCH_HTTP_TIMEOUT_MS` | `10000` | Per-provider request timeout |
| `RESEARCH_MAX_BYTES` | `2000000` | Maximum response bytes before parsing |
| `RESEARCH_MAX_AGE_DAYS` | `30` | Freshness threshold when no publication/update date is available |
| `CRAWL4AI_URL` | unset | Full Crawl4AI endpoint, normally `http://127.0.0.1:11235/crawl` in the stack |
| `CRAWL4AI_API_TOKEN` | unset | Crawl4AI bearer token; keep it in ignored environment configuration |
| `PLAYWRIGHT_URL` | unset | Full Playwright endpoint, normally `http://127.0.0.1:3000/scrape` in the stack |
| `RESEARCH_ENABLE_PLAYWRIGHT` | unset | Must be `1` to permit the last fallback |

Do not put tokens in skill files, command arguments, fixtures, citations, or output. Firecrawl is consumed through the configured local Pi MCP bridge; inspect its live tool list and use only the tools it advertises. BrowserOS login use requires explicit human authorization and a dedicated profile.

## Research workflow

- **Discovery**: use an available Pi search tool to find candidate URLs; verify each candidate with the helper or configured MCP provider.
- **Technical documentation**: prefer an official documentation URL or Context7 when available. Record the library/version and retrieval time.
- **GitHub**: prefer repository, release, issue, or source URLs. Keep canonical URLs and distinguish source facts from inferred behavior.
- **Comparisons**: collect at least two independent canonical sources, deduplicate them, record disagreements, and cite every conclusion.
- **Freshness**: `fresh` means the retrieved or known source date is within `RESEARCH_MAX_AGE_DAYS`; `stale` means older; `unknown` means no trustworthy date. Do not silently treat unknown as fresh.
- **Fallback**: HTTP -> configured Crawl4AI/Firecrawl -> Lightpanda or explicitly authorized BrowserOS -> Playwright only when needed. If a provider is unavailable, preserve its attempt error and continue without inventing evidence.

## Output contract

The helper emits `records`, `failures`, `truncated`, and `omitted`. Each record includes `citation`, `freshness`, `provider`, `sourceType`, and bounded `text`.

## Verification

Run the exact commands recorded in [`evidence-and-blockers.md`](evidence-and-blockers.md). The functional tests use loopback mocks, no real credentials, and assert citations, freshness, deduplication, context limits, Crawl4AI fallback, and credential-safe provider exhaustion.
