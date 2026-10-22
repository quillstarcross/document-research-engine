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
  context.results = [
    { title: 'Introduction to quantum sensors', url: 'https://example.org/a', key: 'a', category: 'web', source: 'Open web' },
    { title: 'Introduction to quantum sensors and medicine', url: 'https://example.org/b', key: 'b', category: 'research', source: 'Crossref' },
    { title: 'Quantum sensors for archaeology', url: 'https://example.org/c', key: 'c', category: 'news', source: 'GDELT' },
    { title: 'Introduction to systems and methods', url: 'https://example.org/d', key: 'd', category: 'books', source: 'Open Library' }
  ];
  const connections = context.deriveConnections();
  assert.ok(connections.length > 0);
  assert.ok(connections.every(x => x.a.category !== x.b.category));
  assert.ok(connections.every(x => x.shared.length >= 1));
  assert.ok(connections.every(x => typeof x.reason === 'string' && x.reason.length > 0));
  assert.ok(!connections.some(x => x.shared.length === 1 && ['introduction', 'systems', 'methods'].includes(x.shared[0])));
});
