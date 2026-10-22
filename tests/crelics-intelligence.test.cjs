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
    { year: 'not-a-date', title: 'Invalid date', url: 'https://example.org/c', key: 'c', category: 'news' }
  ];
  const timeline = context.deriveTemporalPatterns();
  assert.equal(timeline.length, 1);
  assert.equal(timeline[0].dateLabel, '2024-05-02');
  assert.equal(timeline[0].title, 'Dated paper');
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
