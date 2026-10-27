# Provider contract

This file records the provider routes the skill is allowed to use. The route evidence was verified against `data-research-stack@346faba` on 2026-10-27. That repository owns service deployment; this standalone repository owns only the reusable skill and helper.

| Provider | Verified route | Use | Credential / limit |
| --- | --- | --- | --- |
| HTTP | The requested `http(s)` URL | First attempt for public pages and APIs | `search.mjs` caps responses at 2,000,000 bytes and defaults to a 10s timeout |
| Crawl4AI | `POST ${CRAWL4AI_URL}`; the stack default is `http://127.0.0.1:11235/crawl`; health `GET /health` | JS-capable crawl and structured extraction | Bearer token from `CRAWL4AI_API_TOKEN`; never print it. The configured route accepts `{ "urls": [...] }`. |
| Firecrawl MCP | The configured local MCP bridge, normally `http://127.0.0.1:3010/mcp` | Search/scrape/crawl/parse through Pi's configured MCP tools | Use only tools returned by live MCP `tools/list`; do not guess a REST route or pass credentials in prompts. |
| Lightpanda | `GET http://127.0.0.1:9222/json/version` by default | Lightweight CDP rendering | CDP is an integration boundary. Use an existing CDP adapter such as Scrape_01; do not hand-roll a browser protocol in the skill. |
| BrowserOS neo | Viewer `http://127.0.0.1:6080/`; MCP `http://127.0.0.1:9010` by default | Interactive pages and explicitly authorized authenticated sessions | Never assume login. Use a dedicated profile and explicit human authorization. |
| Playwright service | `GET ${PLAYWRIGHT_URL}/health`; `POST ${PLAYWRIGHT_URL}` with `{ "url": "https://..." }` | Last compatibility fallback | Enable explicitly with `RESEARCH_ENABLE_PLAYWRIGHT=1` and `PLAYWRIGHT_URL`; service accepts only HTTP(S). |
| Scrape_01 | `GET http://127.0.0.1:8787/api/ping`, `/api/summary` by default | Durable dataset extraction, checkpoints, deduplication, and repair | Not a general search endpoint. Use its CLI/API for persistent datasets, not ad hoc search. |

## Escalation and unavailable providers

The deterministic helper tries direct HTTP, then configured Crawl4AI, then configured Playwright. Lightpanda and BrowserOS are intentionally delegated to existing Pi MCP/CDP integrations because their live protocol/session bindings are not a generic HTTP scrape contract. The SKILL decision order remains HTTP -> Crawl4AI/Firecrawl -> Lightpanda/BrowserOS -> Playwright.

If a provider is absent, disabled, unauthorized, or returns an error, retain the failure in `failures[].attempts`, continue to the next allowed provider, and report the limitation. Never fabricate a result.

## Evidence sources

- Canonical service owner: https://github.com/darkrei08/data-research-stack
- Pinned route evidence: `data-research-stack@346faba`.
- Crawl4AI self-hosting/API: https://docs.crawl4ai.com/core/self-hosting/
- Firecrawl MCP: https://docs.firecrawl.dev/mcp-server
- Playwright Docker: https://playwright.dev/docs/docker
- Lightpanda CDP source: https://github.com/lightpanda-io/browser
