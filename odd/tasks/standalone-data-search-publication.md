# Standalone Data Search publication
Feature specification and work log for the authorized standalone publication of the reusable Data Search Pi skill.
Source of truth for implementation, verification, delivery, and Task 3 handoff.

## Specs

1. **S1**: "Extract the reusable Data Search Pi skill outside the service stack, make it independently installable and testable, publish it, and preserve explicit links back to the Data Research Stack for service deployment, evidence, and blockers."
2. **S2**: "Standalone skills/reusable-data-search/SKILL.md with valid LLM-first frontmatter. Use darkrei08 as repository author, preserve the trigger contract, and keep the main skill concise."
3. **S3**: "Helper, provider references, functional tests, README installation/usage, and a minimal package.json or equivalent test entrypoint if it makes standalone use clearer without adding dependencies."
4. **S4**: "Explicit canonical link to https://github.com/darkrei08/data-research-stack and explain that the stack owns services while this repository owns the reusable skill."
5. **S5**: "A docs/evidence-and-blockers.md (or equivalent) recording provenance from data-research-stack commit 346faba, verified provider surfaces, exact checks already run, known limitations, and how to resolve them: Crawl4AI requires configured CRAWL4AI_URL + CRAWL4AI_API_TOKEN; Scrape_01 smoke requires its worktree-local data directory; BrowserOS authenticated use remains explicit; live provider/cache measurements were not performed."
6. **S6**: "Preserve citation, freshness, deduplication, bounded context, fallback, credential-safe errors, and unavailable-provider behavior."
7. **S7**: "Run exactly and record:\n   - node --check skills/reusable-data-search/bin/search.mjs\n   - node --test tests/reusable-data-search.test.mjs\n   - node skills/reusable-data-search/bin/search.mjs --url https://example.com --json\n   - git diff --check"
8. **S8**: "Run a local smoke/config check proportionate to this standalone repo. Do not invent or print credentials. Mark stack-dependent checks explicitly NOT RUN or BLOCKED with the exact reason."
9. **S9**: "Inspect diff/status. Commit one focused Conventional Commit, e.g. \"feat: publish standalone data search skill\". Update the task document commit fields."
10. **S10**: "Push feat/standalone-data-search to origin. Create a PR for issue #1 with exact test plan and blocker notes. Because the user explicitly authorized publication and all delivery steps, merge only after the checks and PR state are verified, then push/verify the default branch if appropriate. Do not close issue #1 until the final public repository state and links are verified."
11. **S11**: "Use ORCH_RUN=standalone-data-search-publication-20261027, ORCH_AGENT=standalone_data_search, ORCH_MASTER=master_chief. Report WORKING at lifecycle changes and at least every 10 minutes via orch_report. Use orch_ask for blockers. Final action must be READY, CLOSED, BLOCKED, or FAILED with commit, PR/merge URL if created, exact checks, public paths, limitations, memory state, and next action. Do not close the pane; the master decides after final reconciliation."

## Tasks

- T1 (S1-S6): Port only the verified skill, helper, provider references, and functional tests from `data-research-stack@346faba`; adapt standalone paths and author metadata. Route: `skills/reusable-data-search`, `tests`, `references`. Commit: `HEAD` (`feat: publish standalone data search skill`).
- T2 (S3-S8): Add zero-dependency package/test entrypoint, README installation and usage, and evidence/blocker documentation with exact verification state. Route: `package.json`, `README.md`, `docs`. Commit: `HEAD` (`feat: publish standalone data search skill`).
- T3 (S7-S10): Run required checks, local smoke/config verification, inspect status/diff, commit, push, open and verify the issue-linked PR, and merge only after target checks are verified. Route: repository delivery. Commit: `HEAD` (`feat: publish standalone data search skill`); remote delivery pending.

## Log

L1: You are the dedicated Pi worker for the authorized standalone Data Search publication task.

REPOSITORY / WORKTREE
- Repository: /root/git/personale/pi-data-search
- Branch: feat/standalone-data-search
- Herdr workspace/pane: w2T:p1, agent: standalone_data_search
- Remote: https://github.com/darkrei08/pi-data-search
- Issue: https://github.com/darkrei08/pi-data-search/issues/1
- Do not edit the source data-research-stack base worktree or any unrelated repository.

OBJECTIVE
Extract the reusable Data Search Pi skill outside the service stack, make it independently installable and testable, publish it, and preserve explicit links back to the Data Research Stack for service deployment, evidence, and blockers.

SOURCE OF TRUTH
Read the exact source from /root/git/personale/data-research-stack branch feat/reusable-data-search-skill at commit 346faba:
- skills/reusable-data-search/SKILL.md
- skills/reusable-data-search/bin/search.mjs
- skills/reusable-data-search/references/providers.md
- tests/reusable-data-search.test.mjs
- docs/reusable-data-search.md
- odd/tasks/reusable-data-search.md
Do not copy unrelated stack services, credentials, browser profiles, compose files, volumes, or generated setup files.

REQUIRED CONTENT
- Standalone skills/reusable-data-search/SKILL.md with valid LLM-first frontmatter. Use darkrei08 as repository author, preserve the trigger contract, and keep the main skill concise.
- Helper, provider references, functional tests, README installation/usage, and a minimal package.json or equivalent test entrypoint if it makes standalone use clearer without adding dependencies.
- Explicit canonical link to https://github.com/darkrei08/data-research-stack and explain that the stack owns services while this repository owns the reusable skill.
- A docs/evidence-and-blockers.md (or equivalent) recording provenance from data-research-stack commit 346faba, verified provider surfaces, exact checks already run, known limitations, and how to resolve them: Crawl4AI requires configured CRAWL4AI_URL + CRAWL4AI_API_TOKEN; Scrape_01 smoke requires its worktree-local data directory; BrowserOS authenticated use remains explicit; live provider/cache measurements were not performed.
- Preserve citation, freshness, deduplication, bounded context, fallback, credential-safe errors, and unavailable-provider behavior.

PROCESS / QUALITY
1. Read AGENTS.md and issue #1 requirements. Create odd/tasks/standalone-data-search-publication.md before the first source write and mirror durable state to Engram.
2. Copy/adapt only the verified skill files from commit 346faba. Add tests for standalone public behavior and no credential leakage. Keep dependencies zero unless strictly necessary.
3. Run exactly and record:
   - node --check skills/reusable-data-search/bin/search.mjs
   - node --test tests/reusable-data-search.test.mjs
   - node skills/reusable-data-search/bin/search.mjs --url https://example.com --json
   - git diff --check
4. Run a local smoke/config check proportionate to this standalone repo. Do not invent or print credentials. Mark stack-dependent checks explicitly NOT RUN or BLOCKED with the exact reason.
5. Inspect diff/status. Commit one focused Conventional Commit, e.g. "feat: publish standalone data search skill". Update the task document commit fields.
6. Push feat/standalone-data-search to origin. Create a PR for issue #1 with exact test plan and blocker notes. Because the user explicitly authorized publication and all delivery steps, merge only after the checks and PR state are verified, then push/verify the default branch if appropriate. Do not close issue #1 until the final public repository state and links are verified.

REPORTING
Use ORCH_RUN=standalone-data-search-publication-20261027, ORCH_AGENT=standalone_data_search, ORCH_MASTER=master_chief. Report WORKING at lifecycle changes and at least every 10 minutes via orch_report. Use orch_ask for blockers. Final action must be READY, CLOSED, BLOCKED, or FAILED with commit, PR/merge URL if created, exact checks, public paths, limitations, memory state, and next action. Do not close the pane; the master decides after final reconciliation.

L2: 2026-10-27: Verified issue #1 is OPEN with `status:approved` and `enhancement`; source of truth is the Git object at `data-research-stack@346faba` because the requested source branch is not checked out in the base worktree.
L3: 2026-10-27: Target branch is unborn and contains only pre-existing agent scaffolding; those files remain untouched. CodeGraph is indexed for the parent tree, not this worktree, so source was verified directly from the pinned Git commit.
L4: 2026-10-27: Scout confirmed the source helper is zero-dependency ESM and the source tests cover canonicalization, freshness, deduplication, bounded output, HTTP success, Crawl4AI fallback, and credential-safe provider exhaustion. No live Crawl4AI, Firecrawl, Lightpanda, BrowserOS, Playwright, or Scrape_01 measurements have been performed here.
L5: 2026-10-27: Required syntax, functional, example.com HTTP, and diff checks passed. `npm test` passed 5/5 and `npm pack --dry-run` was constrained to the intended eight package files. Commit is `HEAD` with message `feat: publish standalone data search skill`; remote delivery remains pending.

## Commit Evidence

- T1: `HEAD` (`feat: publish standalone data search skill`)
- T2: `HEAD` (`feat: publish standalone data search skill`)
- T3: `HEAD` (`feat: publish standalone data search skill`), remote delivery pending
