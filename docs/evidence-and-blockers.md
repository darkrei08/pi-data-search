# Evidence and blockers

## Provenance

- Source of truth: `darkrei08/data-research-stack@346faba`, the pinned commit named by the publication task.
- Copied/adapted files: `skills/reusable-data-search/SKILL.md`, `skills/reusable-data-search/bin/search.mjs`, `skills/reusable-data-search/references/providers.md`, and `tests/reusable-data-search.test.mjs`.
- The [Data Research Stack](https://github.com/darkrei08/data-research-stack) owns service deployment and provider infrastructure. This repository owns the reusable skill, zero-dependency helper, tests, and standalone documentation.
- No stack services, credentials, browser profiles, compose files, volumes, or generated setup files were copied.

## Verified provider surfaces

The pinned source evidence records these allowed surfaces:

- HTTP: requested public `http(s)` URL, attempted first.
- Crawl4AI: configured `CRAWL4AI_URL`, with bearer token from `CRAWL4AI_API_TOKEN`.
- Firecrawl MCP: configured Pi MCP bridge, using only tools returned by its live `tools/list`.
- Lightpanda: CDP endpoint consumed by an existing adapter such as Scrape_01.
- BrowserOS neo: interactive or authenticated use only after explicit human authorization and with a dedicated profile.
- Playwright: configured `PLAYWRIGHT_URL`, enabled only with `RESEARCH_ENABLE_PLAYWRIGHT=1`.
- Scrape_01: durable dataset API, not a general search endpoint.

The helper deterministically attempts HTTP, then configured Crawl4AI, then configured Playwright. Lightpanda, BrowserOS, and Firecrawl remain Pi/MCP/CDP integration surfaces rather than duplicated standalone services.

## Exact checks run

| Status | Exact command | Observed result |
| --- | --- | --- |
| PASS | `node --check skills/reusable-data-search/bin/search.mjs` | Exit 0; syntax valid. |
| PASS | `node --test tests/reusable-data-search.test.mjs` | Exit 0; 5 tests passed, 0 failed. |
| PASS | `node skills/reusable-data-search/bin/search.mjs --url https://example.com --json` | Exit 0; HTTP record returned canonical citation, retrieval time, fresh status, and no failures. |
| PASS | `git diff --check` | Exit 0; no whitespace errors. |
| PASS | `npm pack --dry-run` | Package smoke completed; later constrained with `files` so repository scaffolding is excluded. |

The functional tests use loopback mocks and placeholder test tokens only; they assert canonicalization, freshness, deduplication, bounded context, HTTP retrieval, Crawl4AI fallback, provider exhaustion, and credential-safe output.

## Limitations and resolution

- **Crawl4AI is not configured by this repository.** A real Crawl4AI run requires both `CRAWL4AI_URL` and `CRAWL4AI_API_TOKEN`. Resolve it by configuring those values from the service-owning stack or another authorized deployment; never put the token in source, arguments, fixtures, citations, or output.
- **Scrape_01 smoke is stack-dependent.** Its smoke check requires the Scrape_01 worktree-local data directory. Resolve it by running the smoke check from the configured Data Research Stack worktree with that directory present; this standalone repository does not create or copy the dataset.
- **BrowserOS authenticated use remains explicit.** Resolve it only through an explicitly authorized BrowserOS session and dedicated profile. The skill never assumes login state.
- **Live provider/cache measurements were not performed.** The required standalone checks use loopback fixtures and the public `example.com` HTTP route. Resolve this limitation by running the stack-owned provider health and cache measurements in an authorized service environment; do not treat this repository's local checks as service deployment evidence.
- **Stack-dependent checks are not run here.** No Crawl4AI, Firecrawl MCP, Lightpanda, BrowserOS, Playwright service, or Scrape_01 instance was started or measured in this standalone worktree.
