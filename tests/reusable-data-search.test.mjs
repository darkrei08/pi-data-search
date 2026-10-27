import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import {
  canonicalizeUrl,
  classifySource,
  freshness,
  deduplicate,
  boundContext,
} from '../skills/reusable-data-search/bin/search.mjs';

const execFileAsync = promisify(execFile);
const cli = new URL('../skills/reusable-data-search/bin/search.mjs', import.meta.url);

async function listen(handler) {
  const server = createServer(handler);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return { server, url: `http://127.0.0.1:${server.address().port}` };
}

function close(server) {
  return new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}

test('canonicalizes sources and reports freshness without guessing publication dates', () => {
  assert.equal(canonicalizeUrl('https://github.com/acme/repo?utm_source=x&b=2&a=1#readme'), 'https://github.com/acme/repo?a=1&b=2');
  assert.equal(classifySource('https://github.com/acme/repo/blob/main/README.md'), 'github');
  assert.equal(classifySource('https://docs.example.test/api'), 'documentation');
  assert.deepEqual(freshness({ retrievedAt: '2026-10-27T00:00:00Z', now: '2026-10-27T01:00:00Z', maxAgeDays: 1 }), { status: 'fresh', ageDays: 0 });
  assert.deepEqual(freshness({ retrievedAt: null, now: '2026-10-27T01:00:00Z', maxAgeDays: 1 }), { status: 'unknown', ageDays: null });
});

test('deduplicates canonical URLs and repeated content, then bounds context', () => {
  const records = [
    { url: 'https://example.test/a?utm_campaign=x', title: 'A', text: 'same text', provider: 'http' },
    { url: 'https://example.test/a#fragment', title: 'A copy', text: 'same text', provider: 'crawl4ai' },
    { url: 'https://example.test/b', title: 'B', text: 'different text', provider: 'http' },
  ];
  const unique = deduplicate(records);
  assert.equal(unique.length, 2);
  assert.deepEqual(unique[0].providers, ['http', 'crawl4ai']);
  const bounded = boundContext(unique, { maxResults: 1, maxChars: 8 });
  assert.equal(bounded.records.length, 1);
  assert.equal(bounded.records[0].text, 'same te…');
  assert.equal(bounded.truncated, true);
});

test('CLI returns citations and freshness for a successful HTTP fetch', async () => {
  const fixture = await listen((req, res) => {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end('<html><head><title>Fixture docs</title></head><body><h1>Official answer</h1><p>Use the documented API.</p></body></html>');
  });
  try {
    const { stdout } = await execFileAsync(process.execPath, [cli.pathname, '--url', `${fixture.url}/docs`, '--json'], { env: { ...process.env, CRAWL4AI_URL: '' } });
    const result = JSON.parse(stdout);
    assert.equal(result.records.length, 1);
    assert.equal(result.records[0].provider, 'http');
    assert.equal(result.records[0].citation.url, `${fixture.url}/docs`);
    assert.equal(result.records[0].freshness.status, 'fresh');
    assert.match(result.records[0].text, /Official answer/);
  } finally {
    await close(fixture.server);
  }
});

test('CLI falls back to the configured Crawl4AI route after HTTP failure', async () => {
  const target = await listen((req, res) => {
    res.writeHead(503, { 'content-type': 'text/plain' });
    res.end('unavailable');
  });
  const crawl = await listen(async (req, res) => {
    assert.equal(req.url, '/crawl');
    assert.equal(req.headers.authorization, 'Bearer test-token');
    let body = '';
    for await (const chunk of req) body += chunk;
    assert.deepEqual(JSON.parse(body).urls, [`${target.url}/page`]);
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ results: [{ url: `${target.url}/page`, markdown: '# Crawled answer' }] }));
  });
  try {
    const { stdout } = await execFileAsync(process.execPath, [cli.pathname, '--url', `${target.url}/page`, '--json'], {
      env: { ...process.env, CRAWL4AI_URL: `${crawl.url}/crawl`, CRAWL4AI_API_TOKEN: 'test-token' },
    });
    const result = JSON.parse(stdout);
    assert.equal(result.records[0].provider, 'crawl4ai');
    assert.match(result.records[0].text, /Crawled answer/);
    assert.doesNotMatch(stdout, /test-token/);
  } finally {
    await close(target.server);
    await close(crawl.server);
  }
});

test('CLI reports provider exhaustion without leaking credentials', async () => {
  const target = await listen((req, res) => {
    res.writeHead(503);
    res.end('no');
  });
  try {
    await assert.rejects(
      execFileAsync(process.execPath, [cli.pathname, '--url', `${target.url}/page`, '--json'], {
        env: { ...process.env, CRAWL4AI_URL: `${target.url}/crawl`, CRAWL4AI_API_TOKEN: 'secret-token', RESEARCH_ENABLE_PLAYWRIGHT: '0' },
      }),
      (error) => {
        assert.equal(error.code, 1);
        assert.doesNotMatch(error.stdout + error.stderr, /secret-token/);
        assert.match(error.stdout + error.stderr, /provider_unavailable/);
        return true;
      },
    );
  } finally {
    await close(target.server);
  }
});
