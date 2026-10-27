#!/usr/bin/env node

import { createHash } from 'node:crypto';

const DEFAULT_MAX_BYTES = 2_000_000;
const DEFAULT_TIMEOUT_MS = 10_000;
const TRACKING_PARAMS = new Set(['fbclid', 'gclid', 'ref', 'referrer']);

function requireHttpUrl(value) {
  const url = new URL(String(value));
  if (!/^https?:$/.test(url.protocol)) throw new Error(`url must use http or https: ${value}`);
  return url;
}

export function canonicalizeUrl(value) {
  const url = requireHttpUrl(value);
  url.hash = '';
  for (const key of [...url.searchParams.keys()]) {
    if (key.toLowerCase().startsWith('utm_') || TRACKING_PARAMS.has(key.toLowerCase())) url.searchParams.delete(key);
  }
  url.searchParams.sort();
  return url.toString();
}

export function classifySource(value) {
  const host = requireHttpUrl(value).hostname.toLowerCase();
  if (host === 'github.com' || host.endsWith('.github.com') || host === 'raw.githubusercontent.com') return 'github';
  if (host.startsWith('docs.') || host.includes('developer') || host.includes('readthedocs')) return 'documentation';
  return 'web';
}

function parseDate(value) {
  const time = value ? Date.parse(value) : NaN;
  return Number.isFinite(time) ? time : null;
}

export function freshness({ retrievedAt, publishedAt = null, updatedAt = null, now = new Date().toISOString(), maxAgeDays = 30 } = {}) {
  const sourceTime = parseDate(updatedAt) ?? parseDate(publishedAt) ?? parseDate(retrievedAt);
  const nowTime = parseDate(now);
  if (sourceTime === null || nowTime === null || sourceTime > nowTime) return { status: 'unknown', ageDays: null };
  const ageDays = Math.floor((nowTime - sourceTime) / 86_400_000);
  return { status: ageDays <= Number(maxAgeDays) ? 'fresh' : 'stale', ageDays };
}

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function textFingerprint(value) {
  return createHash('sha256').update(normalizeText(value).toLowerCase()).digest('hex');
}

export function deduplicate(records) {
  const byKey = new Map();
  const byFingerprint = new Map();
  for (const input of records) {
    const record = { ...input, url: canonicalizeUrl(input.url) };
    const key = byKey.has(record.url) ? record.url : `text:${textFingerprint(record.text)}`;
    const existing = byKey.get(record.url) || byFingerprint.get(key);
    if (!existing) {
      record.providers = [...new Set([record.provider, ...(record.providers || [])].filter(Boolean))];
      byKey.set(record.url, record);
      byFingerprint.set(`text:${textFingerprint(record.text)}`, record);
      continue;
    }
    existing.providers = [...new Set([...existing.providers, record.provider, ...(record.providers || [])].filter(Boolean))];
    existing.duplicateUrls = [...new Set([...(existing.duplicateUrls || []), record.url])];
  }
  return [...byKey.values()];
}

export function boundContext(records, { maxResults = 20, maxChars = 12_000 } = {}) {
  const result = [];
  let remaining = Math.max(0, Number(maxChars) || 0);
  let truncated = false;
  for (const record of records.slice(0, Math.max(0, Number(maxResults) || 0))) {
    if (remaining <= 0) { truncated = true; break; }
    const text = normalizeText(record.text);
    const clipped = text.length > remaining;
    const nextText = clipped ? `${text.slice(0, Math.max(0, remaining - 1))}…` : text;
    result.push({ ...record, text: nextText });
    remaining -= nextText.length;
    truncated ||= clipped;
  }
  return { records: result, truncated, omitted: Math.max(0, records.length - result.length) };
}

function decodeEntities(value) {
  return value.replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&#39;/g, "'").replace(/&quot;/gi, '"');
}

function htmlText(html) {
  return normalizeText(decodeEntities(String(html).replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ')));
}

function htmlTitle(html) {
  return normalizeText(decodeEntities(String(html).match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || ''));
}

async function readBody(response, maxBytes) {
  if (!response.body) return '';
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      throw new Error(`response exceeds ${maxBytes} bytes`);
    }
    chunks.push(value);
  }
  return new TextDecoder().decode(Buffer.concat(chunks));
}

async function request(url, init = {}, { timeoutMs = DEFAULT_TIMEOUT_MS, maxBytes = DEFAULT_MAX_BYTES } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal, redirect: 'follow' });
    const body = await readBody(response, maxBytes);
    if (!response.ok) throw new Error(`HTTP ${response.status} from ${url}`);
    return { response, body };
  } finally {
    clearTimeout(timer);
  }
}

function providerRecord({ url, provider, title, text, retrievedAt, maxAgeDays }) {
  const canonicalUrl = canonicalizeUrl(url);
  return {
    url: canonicalUrl,
    title: normalizeText(title) || canonicalUrl,
    text: normalizeText(text),
    provider,
    sourceType: classifySource(canonicalUrl),
    retrievedAt,
    freshness: freshness({ retrievedAt, maxAgeDays }),
    citation: { url: canonicalUrl, title: normalizeText(title) || canonicalUrl, retrievedAt },
  };
}

function crawlPayload(payload, requestedUrl) {
  const candidates = Array.isArray(payload) ? payload : Array.isArray(payload?.results) ? payload.results : [payload];
  const item = candidates.find((entry) => entry && (!entry.url || canonicalizeUrl(entry.url) === canonicalizeUrl(requestedUrl))) || candidates[0] || {};
  const text = item.markdown || item.content || item.text || item.html || '';
  return { url: item.url || requestedUrl, title: item.title || '', text: item.html ? htmlText(item.html) : text };
}

async function fetchHttp(url, options) {
  const { response, body } = await request(url, { headers: { accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8' } }, options);
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('json')) {
    const payload = JSON.parse(body);
    return providerRecord({ url, provider: 'http', title: payload.title || '', text: payload.text || payload.content || JSON.stringify(payload), retrievedAt: new Date().toISOString(), maxAgeDays: options.maxAgeDays });
  }
  return providerRecord({ url: response.url || url, provider: 'http', title: htmlTitle(body), text: htmlText(body), retrievedAt: new Date().toISOString(), maxAgeDays: options.maxAgeDays });
}

async function fetchCrawl4ai(url, options) {
  if (!options.crawl4aiUrl || !options.crawl4aiToken) throw new Error('Crawl4AI is not configured');
  const { body } = await request(options.crawl4aiUrl, {
    method: 'POST',
    headers: { authorization: `Bearer ${options.crawl4aiToken}`, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ urls: [url] }),
  }, options);
  const payload = JSON.parse(body);
  const extracted = crawlPayload(payload, url);
  return providerRecord({ ...extracted, provider: 'crawl4ai', retrievedAt: new Date().toISOString(), maxAgeDays: options.maxAgeDays });
}

async function fetchPlaywright(url, options) {
  if (!options.playwrightUrl || options.enablePlaywright !== true) throw new Error('Playwright fallback is disabled');
  const { body } = await request(options.playwrightUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ url }),
  }, options);
  const payload = JSON.parse(body);
  return providerRecord({ url: payload.url || url, provider: 'playwright', title: payload.title || '', text: payload.text || '', retrievedAt: new Date().toISOString(), maxAgeDays: options.maxAgeDays });
}

export async function fetchResearch(url, overrides = {}) {
  const options = {
    timeoutMs: Number(overrides.timeoutMs || process.env.RESEARCH_HTTP_TIMEOUT_MS || DEFAULT_TIMEOUT_MS),
    maxBytes: Number(overrides.maxBytes || process.env.RESEARCH_MAX_BYTES || DEFAULT_MAX_BYTES),
    maxAgeDays: Number(overrides.maxAgeDays ?? process.env.RESEARCH_MAX_AGE_DAYS ?? 30),
    crawl4aiUrl: overrides.crawl4aiUrl ?? process.env.CRAWL4AI_URL ?? '',
    crawl4aiToken: overrides.crawl4aiToken ?? process.env.CRAWL4AI_API_TOKEN ?? '',
    playwrightUrl: overrides.playwrightUrl ?? process.env.PLAYWRIGHT_URL ?? '',
    enablePlaywright: overrides.enablePlaywright ?? process.env.RESEARCH_ENABLE_PLAYWRIGHT === '1',
  };
  const attempts = [];
  for (const [provider, fn] of [['http', fetchHttp], ['crawl4ai', fetchCrawl4ai], ['playwright', fetchPlaywright]]) {
    try {
      const record = await fn(url, options);
      if (!record.text) throw new Error(`${provider} returned no text`);
      return { record, attempts };
    } catch (error) {
      attempts.push({ provider, error: String(error.message || error) });
    }
  }
  const error = new Error(`provider_unavailable: ${url}`);
  error.code = 'PROVIDER_UNAVAILABLE';
  error.attempts = attempts;
  throw error;
}

export async function collect(urls, options = {}) {
  const records = [];
  const failures = [];
  for (const url of urls) {
    try { records.push((await fetchResearch(url, options)).record); }
    catch (error) { failures.push({ url: canonicalizeUrl(url), code: error.code || 'FETCH_FAILED', attempts: error.attempts || [] }); }
  }
  const bounded = boundContext(deduplicate(records), options);
  return { records: bounded.records, failures, truncated: bounded.truncated, omitted: bounded.omitted };
}

function parseArgs(argv) {
  const urls = [];
  const options = { json: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--url') urls.push(argv[++i]);
    else if (arg === '--max-results') options.maxResults = Number(argv[++i]);
    else if (arg === '--max-chars') options.maxChars = Number(argv[++i]);
    else if (arg === '--max-age-days') options.maxAgeDays = Number(argv[++i]);
    else if (arg === '--json') options.json = true;
    else if (arg === '--help') options.help = true;
    else throw new Error(`unknown option: ${arg}`);
  }
  if (!options.help && !urls.length) throw new Error('usage: search.mjs --url <http(s)://...> [--url <...>] [--json]');
  return { urls, options };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const { urls, options } = parseArgs(process.argv.slice(2));
    if (options.help) { console.log('Usage: node skills/reusable-data-search/bin/search.mjs --url <http(s)://...> [--url <...>] [--json]'); process.exit(0); }
    const result = await collect(urls, options);
    if (options.json) console.log(JSON.stringify(result, null, 2));
    else for (const record of result.records) console.log(`[${record.provider}] ${record.title}\n${record.citation.url}\n${record.text}\n`);
    if (!result.records.length && result.failures.length) {
      if (!options.json) console.error(JSON.stringify({ error: 'provider_unavailable', failures: result.failures }, null, 2));
      else console.error(JSON.stringify({ error: 'provider_unavailable', failures: result.failures }));
      process.exitCode = 1;
    }
  } catch (error) {
    const output = { error: error.code === 'PROVIDER_UNAVAILABLE' ? 'provider_unavailable' : 'invalid_request', message: error.message };
    if (error.attempts) output.attempts = error.attempts;
    console.error(JSON.stringify(output));
    process.exitCode = 1;
  }
}
