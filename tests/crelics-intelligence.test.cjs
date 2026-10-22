const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync('index.html', 'utf8');
const start = html.indexOf('// CRELICS query intelligence:');
const end = html.indexOf('async function runSearch(', start);
assert.notEqual(start, -1, 'query intelligence section exists');
assert.notEqual(end, -1, 'query intelligence section has a clear end');
const intelligenceSource = html.slice(start, end);
const context = { results: [], history: [], activeQuery: '', norm: s => String(s || '').trim().toLowerCase(), Date, Set, String, Math };
vm.createContext(context);
vm.runInContext(intelligenceSource, context);

test('query-aware ranking rewards exact phrases, title matches, and term coverage', () => {
  const htmlSource = fs.readFileSync('index.html', 'utf8');
  const start = htmlSource.indexOf('function searchTerms(');
  const end = htmlSource.indexOf('function metadataAudit(', start);
  assert.notEqual(start, -1, 'search ranking helpers exist');
  assert.notEqual(end, -1, 'ranking helper section has a clear end');
  const local = {
    activeQuery: 'quantum sensors medicine',
    prefs: { personalization: false, interests: [] },
    norm: s => String(s || '').trim().toLowerCase(),
    Set, String, Array, Math
  };
  vm.createContext(local);
  vm.runInContext(htmlSource.slice(start, end), local);
  const score = title => local.relevanceScore({ title, description: '', author: '' });
  assert.ok(score('Quantum Sensors for Medicine') > score('Quantum methods for physics'));
  assert.ok(score('A guide to quantum sensors in medicine') > score('Quantum sensors'));
  assert.equal(local.relevanceScore({ title: 'Unrelated subject', description: '', author: '' }), 0);
});

test('relevance explanations disclose title, description, and personalization match signals', () => {
  const htmlSource = fs.readFileSync('index.html', 'utf8');
  const start = htmlSource.indexOf('const SEARCH_STOP_WORDS=');
  const end = htmlSource.indexOf('function metadataAudit(', start);
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  const local = {
    activeQuery: 'quantum sensors medicine',
    prefs: { personalization: true, interests: ['quantum'] },
    norm: s => String(s || '').trim().toLowerCase(),
    Set, String, Array, Math
  };
  vm.createContext(local);
  vm.runInContext(htmlSource.slice(start, end), local);
  const reasons = Array.from(local.relevanceReasons({
    title: 'Quantum sensors for medicine',
    description: 'A practical guide to quantum sensors.',
    author: 'Medicine Research Group'
  }));
  assert.ok(reasons.some(x => x.includes('matched in title')));
  assert.ok(reasons.some(x => x.includes('matched in description')));
  assert.ok(reasons.some(x => x.includes('author or publisher')));
  assert.ok(reasons.some(x => x.includes('selected interest')));
  local.activeQuery = 'zzzxqv';
  assert.ok(Array.from(local.relevanceReasons({ title: 'A completely unrelated title', description: '', author: '' }))[0].includes('No strong text overlap'));
});

test('tokenizer handles punctuation and Unicode while ranking ignores common stop words', () => {
  const htmlSource = fs.readFileSync('index.html', 'utf8');
  const start = htmlSource.indexOf('const SEARCH_STOP_WORDS=');
  const end = htmlSource.indexOf('function metadataAudit(', start);
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  const local = {
    activeQuery: 'the café: quantum-sensors!',
    prefs: { personalization: false, interests: [] },
    norm: s => String(s || '').trim().toLowerCase(),
    Set, String, Array, Math
  };
  vm.createContext(local);
  vm.runInContext(htmlSource.slice(start, end), local);
  assert.deepEqual(Array.from(local.searchTerms('café, quantum-sensors!')), ['café', 'quantum', 'sensors']);
  const good = local.relevanceScore({ title: 'Café quantum sensors', description: '', author: '' });
  const weak = local.relevanceScore({ title: 'The guide to sensors', description: '', author: '' });
  assert.ok(good > weak);
});

test('safeURL rejects executable and non-web URL schemes', () => {
  const htmlSource = fs.readFileSync('index.html', 'utf8');
  const safeStart = htmlSource.indexOf('function safeURL(');
  const safeEnd = htmlSource.indexOf('async function jsonFetch(', safeStart);
  assert.notEqual(safeStart, -1, 'safeURL helper exists');
  assert.notEqual(safeEnd, -1, 'safeURL helper has a clear end');
  const safeContext = { URL };
  vm.createContext(safeContext);
  vm.runInContext(htmlSource.slice(safeStart, safeEnd), safeContext);
  assert.equal(safeContext.safeURL('javascript:alert(1)'), null);
  assert.equal(safeContext.safeURL('data:text/html,hello'), null);
  assert.equal(safeContext.safeURL('https://example.org/image.jpg'), 'https://example.org/image.jpg');
  assert.equal(safeContext.safeURL('http://example.org/image.jpg'), 'http://example.org/image.jpg');
});

test('classifies comparison intent', () => {
  assert.equal(context.understandQuery('Compare solar and wind power').intent, 'compare');
});

test('classifies time-sensitive intent', () => {
  assert.equal(context.understandQuery('latest AI safety news').intent, 'current');
});

test('classifies research intent and provides three pathways', () => {
  const info = context.understandQuery('research papers on battery recycling');
  assert.equal(info.intent, 'research');
  assert.equal(context.makePathways(info).length, 3);
});

test('provider routing is intent-aware and deduplicated', () => {
  const compare = context.providerPlan(context.understandQuery('compare two methods'));
  const current = context.providerPlan(context.understandQuery('latest news today'));
  assert.ok(compare.providers.includes('research'));
  assert.ok(current.providers.includes('news'));
  assert.equal(new Set(compare.providers).size, compare.providers.length);
  assert.ok(compare.providers.length > 0);
});

test('temporal lens ignores missing and invalid dates', () => {
  context.results = [
    { year: '2024-05-02', title: 'Dated paper', url: 'https://example.org/a', key: 'a', category: 'research' },
    { year: '', title: 'Undated record', url: 'https://example.org/b', key: 'b', category: 'web' },
    { year: 'not-a-date', title: 'Invalid date', url: 'https://example.org/c', key: 'c', category: 'news' },
    { year: '2026garbage', title: 'Malformed year', url: 'https://example.org/d', key: 'd', category: 'news' },
    { year: '20261022T120000', title: 'Dated news', url: 'https://example.org/e', key: 'e', category: 'news' }
  ];
  const timeline = context.deriveTemporalPatterns();
  assert.equal(timeline.length, 2);
  assert.equal(timeline[0].dateLabel, '2026-10-22');
  assert.equal(timeline[0].title, 'Dated news');
  assert.equal(timeline[1].dateLabel, '2024-05-02');
});

test('temporal lens sorts newest first and caps output at five', () => {
  context.results = Array.from({ length: 8 }, (_, i) => ({
    year: String(2018 + i), title: 'Record ' + i, url: 'https://example.org/' + i,
    key: 'record-' + i, category: 'research'
  }));
  const timeline = context.deriveTemporalPatterns();
  assert.equal(timeline.length, 5);
  assert.equal(timeline[0].dateLabel, '2025-01-01');
  assert.equal(timeline[4].dateLabel, '2021-01-01');
});

test('cross-category connections suppress generic overlap and explain candidate links', () => {
  const htmlSource = fs.readFileSync('index.html', 'utf8');
  const start = htmlSource.indexOf('function deriveConnections(){');
  const end = htmlSource.indexOf('\n const guidance=', start);
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  const local = { results: [
    { title: 'Introduction to quantum sensors', url: 'https://example.org/a', key: 'a', category: 'web', source: 'Open web' },
    { title: 'Introduction to quantum sensors and medicine', url: 'https://example.org/b', key: 'b', category: 'research', source: 'Crossref' },
    { title: 'Quantum sensors for archaeology', url: 'https://example.org/c', key: 'c', category: 'news', source: 'GDELT' },
    { title: 'Introduction to systems and methods', url: 'https://example.org/d', key: 'd', category: 'books', source: 'Open Library' }
  ], norm: s => String(s || '').trim().toLowerCase() };
  vm.createContext(local);
  vm.runInContext(htmlSource.slice(start, end), local);
  const connections = vm.runInContext('deriveConnections()', local);
  assert.ok(connections.length > 0);
  assert.ok(connections.every(x => x.a.category !== x.b.category));
  assert.ok(connections.every(x => x.shared.length >= 1));
  assert.ok(connections.every(x => typeof x.reason === 'string' && x.reason.length > 0));
  assert.ok(!connections.some(x => x.shared.length === 1 && ['introduction', 'systems', 'methods'].includes(x.shared[0])));
});

test('jsonFetch passes an abort signal and returns parsed JSON', async () => {
  const htmlSource = fs.readFileSync('index.html', 'utf8');
  const start = htmlSource.indexOf('async function jsonFetch(');
  const end = htmlSource.indexOf('\nasync \n// CRELICS query intelligence:', start);
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  let receivedSignal;
  const fetch = async (_url, options) => {
    receivedSignal = options.signal;
    return { ok: true, json: async () => ({ answer: 42 }) };
  };
  const context = { fetch, AbortController, setTimeout, clearTimeout };
  vm.createContext(context);
  vm.runInContext(htmlSource.slice(start, end), context);
  assert.deepEqual(await context.jsonFetch('https://example.org/api', 100), { answer: 42 });
  assert.ok(receivedSignal, 'fetch receives an abort signal');
});

test('jsonFetch reports HTTP failures clearly', async () => {
  const htmlSource = fs.readFileSync('index.html', 'utf8');
  const start = htmlSource.indexOf('async function jsonFetch(');
  const end = htmlSource.indexOf('\nasync \n// CRELICS query intelligence:', start);
  const context = {
    fetch: async () => ({ ok: false, status: 429 }),
    AbortController, setTimeout, clearTimeout
  };
  vm.createContext(context);
  vm.runInContext(htmlSource.slice(start, end), context);
  await assert.rejects(context.jsonFetch('https://example.org/api', 100), /HTTP 429/);
});

test('jsonFetch aborts a request that exceeds its timeout', async () => {
  const htmlSource = fs.readFileSync('index.html', 'utf8');
  const start = htmlSource.indexOf('async function jsonFetch(');
  const end = htmlSource.indexOf('\nasync \n// CRELICS query intelligence:', start);
  const fetch = (_url, options) => new Promise((_resolve, reject) => {
    options.signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
  });
  const context = { fetch, AbortController, setTimeout, clearTimeout };
  vm.createContext(context);
  vm.runInContext(htmlSource.slice(start, end), context);
  await assert.rejects(context.jsonFetch('https://example.org/slow', 5), /timed out after 5 ms/);
});
