#!/usr/bin/env node
// Converts the upstream 12axes source into data/axes.json, data/questions.json
// and data/ideologies.json (schema: docs/data-contract.md).
//
// The upstream files are parsed as TEXT only: comments are stripped with a
// string-aware scanner, the `name =` assignment is removed, and the body is
// fed to JSON.parse. Only if strict JSON fails do we apply a text-level
// relaxation (single quotes, bare keys, trailing commas). Nothing is evaluated.
//
// Usage (from repo root):  node scripts/extract-12axes.mjs <srcdir>
//   <srcdir> is either the upstream repo root (contains 12axes/) or the 12axes/ folder itself.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'data');

const srcArg = process.argv[2];
if (!srcArg) {
  console.error('usage: node scripts/extract-12axes.mjs <srcdir>');
  process.exit(2);
}
const SRC = fs.existsSync(path.join(srcArg, '12axes', 'questions.js'))
  ? path.join(srcArg, '12axes')
  : srcArg;

const readText = (f) => fs.readFileSync(path.join(SRC, f), 'utf8');
const fail = (msg) => { throw new Error(msg); };
const check = (cond, msg) => { if (!cond) fail(msg); };

// ---------------------------------------------------------------------------
// Text-level parsing helpers
// ---------------------------------------------------------------------------

// Remove // and /* */ comments without touching string literals (so URLs such
// as "https://en.wikipedia.org/..." survive intact).
function stripComments(src) {
  let out = '';
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < n && src[j] !== c) { if (src[j] === '\\') j++; j++; }
      if (j >= n) fail(`unterminated string literal at offset ${i}`);
      out += src.slice(i, j + 1);
      i = j + 1;
      continue;
    }
    if (c === '/' && src[i + 1] === '/') {
      while (i < n && src[i] !== '\n') i++;
      continue;
    }
    if (c === '/' && src[i + 1] === '*') {
      const e = src.indexOf('*/', i + 2);
      if (e < 0) fail(`unterminated block comment at offset ${i}`);
      i = e + 2;
      continue;
    }
    out += c;
    i++;
  }
  return out;
}

// Returns the literal that follows `name =` (the array/object), without the
// trailing semicolon.
function extractLiteral(text, name) {
  const m = new RegExp(`\\b${name}\\s*=`).exec(text);
  if (!m) fail(`no "${name} =" assignment found`);
  const rest = text.slice(m.index + m[0].length);
  const start = rest.search(/[[{]/);
  if (start < 0) fail(`no literal after "${name} ="`);
  return rest.slice(start).trim().replace(/;\s*$/, '');
}

// Text transform used only when strict JSON fails: converts single-quoted
// strings to double-quoted, quotes bare identifiers and drops trailing commas.
// Operates on tokens outside strings only; never evaluates anything.
function relaxToJson(s) {
  let out = '';
  let i = 0;
  const n = s.length;
  while (i < n) {
    const c = s[i];
    if (c === '"' || c === "'") {
      let j = i + 1;
      let buf = '';
      while (j < n && s[j] !== c) {
        if (s[j] === '\\') {
          const nx = s[j + 1];
          buf += c === "'" && nx === "'" ? "'" : '\\' + nx;
          j += 2;
          continue;
        }
        buf += s[j] === '"' ? '\\"' : s[j];
        j++;
      }
      if (j >= n) fail('unterminated string during relaxed parse');
      out += `"${buf}"`;
      i = j + 1;
      continue;
    }
    if (/[A-Za-z_$]/.test(c)) {
      let j = i;
      while (j < n && /[\w$]/.test(s[j])) j++;
      const word = s.slice(i, j);
      out += ['true', 'false', 'null'].includes(word) ? word : `"${word}"`;
      i = j;
      continue;
    }
    if (c === ',') {
      let k = i + 1;
      while (k < n && /\s/.test(s[k])) k++;
      if (s[k] === ']' || s[k] === '}') { i++; continue; }
    }
    out += c;
    i++;
  }
  return out;
}

function parseLiteral(body, label) {
  try {
    const v = JSON.parse(body);
    console.log(`${label}: strict JSON parse ok`);
    return v;
  } catch (e) {
    console.log(`${label}: strict JSON failed (${e.message}); applying text relaxation`);
    return JSON.parse(relaxToJson(body));
  }
}

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// ---------------------------------------------------------------------------
// Canonical axes (docs/data-contract.md). Source axis order == canonical order.
// ---------------------------------------------------------------------------

const AXES = [
  { id: 'federal-unitary', category: 'government',
    first: { id: 'federal', name_en: 'Federal' }, second: { id: 'unitary', name_en: 'Unitary' } },
  { id: 'democratic-autocratic', category: 'government',
    first: { id: 'democratic', name_en: 'Democratic' }, second: { id: 'autocratic', name_en: 'Autocratic' } },
  { id: 'internationalist-nationalist', category: 'foreign',
    first: { id: 'internationalist', name_en: 'Internationalist' }, second: { id: 'nationalist', name_en: 'Nationalist' } },
  { id: 'militarist-pacifist', category: 'foreign',
    first: { id: 'militarist', name_en: 'Militarist' }, second: { id: 'pacifist', name_en: 'Pacifist' } },
  { id: 'security-freedom', category: 'government',
    first: { id: 'security', name_en: 'Security' }, second: { id: 'freedom', name_en: 'Freedom' } },
  { id: 'equality-markets', category: 'economy',
    first: { id: 'equality', name_en: 'Equality' }, second: { id: 'markets', name_en: 'Markets' } },
  { id: 'secular-religious', category: 'society',
    first: { id: 'secular', name_en: 'Secular' }, second: { id: 'religious', name_en: 'Religious' } },
  { id: 'progressive-traditional', category: 'society',
    first: { id: 'progressive', name_en: 'Progressive' }, second: { id: 'traditional', name_en: 'Traditional' } },
  { id: 'assimilationist-multiculturalist', category: 'society',
    first: { id: 'assimilationist', name_en: 'Assimilationist' }, second: { id: 'multiculturalist', name_en: 'Multiculturalist' } },
  { id: 'planned-laissezfaire', category: 'economy',
    first: { id: 'planned-economy', name_en: 'Planned Economy' }, second: { id: 'laissez-faire', name_en: 'Laissez-faire' } },
  { id: 'protectionist-globalist', category: 'economy',
    first: { id: 'protectionist', name_en: 'Protectionist' }, second: { id: 'globalist', name_en: 'Globalist (Free Trade)' } },
  { id: 'acceleration-bioconservative', category: 'society',
    first: { id: 'technological-acceleration', name_en: 'Technological Acceleration' }, second: { id: 'bioconservative', name_en: 'Bioconservative' } },
];

// ---------------------------------------------------------------------------
// 1. Questions: orientation decision per axis.
// idx 0 = "+4" statements (source's first pole when flip=false). Decided by
// reading the level +4 statements against the CANONICAL first pole.
// flip=true means idx 0 favours the canonical SECOND pole: level = 8 - idx.
// ---------------------------------------------------------------------------

const QUESTION_ORIENTATION = [
  { flip: false, example: 'There is no need for a national government.',
    why: 'idx0 favours Federal (decentralised); canonical first = Federal' },
  { flip: false, example: 'Direct democracy is the best form of government.',
    why: 'idx0 favours Democratic; canonical first = Democratic' },
  { flip: false, example: 'A united world government would be beneficial to mankind.',
    why: 'idx0 favours Internationalist; canonical first = Internationalist' },
  { flip: false, example: 'War is needed to make an economy thrive.',
    why: 'idx0 favours Militarist; canonical first = Militarist' },
  { flip: false, example: 'Those who disagree with the government should be removed from the country.',
    why: 'idx0 favours Security (surveillance, removal of dissent); canonical first = Security. CHEATSHEET "e - Freedom" is NOT followed' },
  { flip: false, example: 'Communism, if implemented correctly, would be a good form of economics.',
    why: 'idx0 favours Equality (collectivisation); canonical first = Equality' },
  { flip: false, example: 'Religion should be banned.',
    why: 'idx0 favours Secular; canonical first = Secular' },
  { flip: false, example: 'We should pay reperations for the descendants of slaves.',
    why: 'idx0 favours Progressive; canonical first = Progressive' },
  { flip: false, example: 'Foreigners should never enter the country.',
    why: 'idx0 favours Assimilationist (closed, national-culture); canonical first = Assimilationist. CHEATSHEET "i - Multicultural" is NOT followed' },
  { flip: false, example: 'I prefer a planned economy over a free and open economy.',
    why: 'idx0 favours Planned Economy; canonical first = Planned Economy' },
  { flip: false, example: 'All products should be made in my country.',
    why: 'idx0 favours Protectionist; canonical first = Protectionist. CHEATSHEET "k - Globalism" is NOT followed' },
  { flip: false, example: 'If AI could rule more effectively than humans, then AI should rule.',
    why: 'idx0 favours Technological Acceleration; canonical first = Technological Acceleration' },
];

// ---------------------------------------------------------------------------
// 2. Labels (results.html aArray..lArray). ary[0] must be the canonical first
// pole extreme (>90%). reverse=true would reverse the array.
// ---------------------------------------------------------------------------

const LABEL_LETTERS = 'abcdefghijkl';
const LABEL_ORIENTATION = {
  a: { reverse: false, why: 'ary[0]="Confederal" is the Federal extreme' },
  b: { reverse: false, why: 'ary[0]="Liquid Democracy" is the Democratic extreme' },
  c: { reverse: false, why: 'ary[0]="World Government" is the Internationalist extreme' },
  d: { reverse: false, why: 'ary[0]="Expansionist" is the Militarist extreme' },
  e: { reverse: false, why: 'ary[0]="Totalitarian" is the Security extreme' },
  f: { reverse: false, why: 'ary[0]="Communist" is the Equality extreme' },
  g: { reverse: false, why: 'ary[0]="Antitheist" is the Secular extreme' },
  h: { reverse: false, why: 'ary[0]="Revolutionary" is the Progressive extreme' },
  i: { reverse: false, why: 'ary[0]="Ethnonationalist" is the Assimilationist extreme' },
  j: { reverse: false, why: 'ary[0]="Planned Economy" is the Planned extreme' },
  k: { reverse: false, why: 'ary[0]="Isolationist" is the Protectionist extreme' },
  l: { reverse: false, why: 'ary[0]="Transhumanist" is the Technological Acceleration extreme' },
};

// ---------------------------------------------------------------------------
// 3. Ideologies: stat -> canonical axis. All four stats are stored as % toward
// the canonical FIRST pole, so no 100-x conversion is applied. Evidence:
//  econ (Equality high):  Leninism 100, Anarcho-Communism 90 | Anarcho-Capitalism 10, Objectivism 20
//  govt (Security high):  Stalinism 100, Fascism 90, Authoritarian Capitalism 90 |
//                         Anarcho-Communism 5, Anarcho-Mutualism 0, Anarcho-Capitalism 0, Voluntaryism 5
//  dipl (Internationalist high): Trotskyism 100, Libertarian Socialism 80 |
//                         Fascism 10, Stalinism 20, Reactionary 40
//  scty (Progressive high): Progressivism 100, Social Liberalism 80 | Reactionary 10, Fascism 10
// Sanity assertions below enforce these.
// ---------------------------------------------------------------------------

const STAT_MAP = {
  econ: { axis: 'equality-markets', flip: false },
  govt: { axis: 'security-freedom', flip: false },
  dipl: { axis: 'internationalist-nationalist', flip: false },
  scty: { axis: 'progressive-traditional', flip: false },
};

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

// --- questions ---
const qRaw = readText('questions.js');
console.log('question axis headers (source order):');
for (const m of qRaw.matchAll(/\[\/\/([A-Za-z][^\n]*)/g)) console.log('  ', m[1].trim());
const questionsSrc = parseLiteral(extractLiteral(stripComments(qRaw), 'questions'), 'questions.js');
check(Array.isArray(questionsSrc) && questionsSrc.length === 12, 'questions: expected 12 axes');

const questions = [];
const axesOut = AXES.map((a, index) => ({ index, ...a }));
for (let ax = 0; ax < 12; ax++) {
  const dec = QUESTION_ORIENTATION[ax];
  const levels = questionsSrc[ax];
  check(levels.length === 8, `axis ${ax}: expected 8 levels`);
  check(levels[0][0] === dec.example,
    `axis ${ax}: source idx0 statement changed; re-check orientation.\n  got: ${levels[0][0]}`);
  for (let idx = 0; idx < 8; idx++) {
    const stmts = levels[idx];
    check(Array.isArray(stmts) && stmts.length === 3, `axis ${ax} idx ${idx}: expected 3 statements`);
    const level = dec.flip ? 8 - idx : idx + 1;
    stmts.forEach((text, k) => {
      questions.push({
        id: `A${String(ax).padStart(2, '0')}-L${level}-Q${k + 1}`,
        axis: AXES[ax].id,
        level,
        pole: level <= 4 ? 'first' : 'second',
        text_en: text,
        text_zh: '',
      });
    });
  }
}
questions.sort((a, b) => a.id.localeCompare(b.id));

// --- labels ---
const resRaw = readText('results.html');
const labelArrays = {};
for (const m of resRaw.matchAll(/^\s*([a-l])Array\s*=\s*(\[[^\]\n]*\])/gm)) {
  labelArrays[m[1]] = parseLiteral(m[2], `results.html ${m[1]}Array`);
}
for (let ax = 0; ax < 12; ax++) {
  const letter = LABEL_LETTERS[ax];
  let labels = labelArrays[letter];
  check(Array.isArray(labels) && labels.length === 7, `labels ${letter}Array missing or not 7 long`);
  if (LABEL_ORIENTATION[letter].reverse) labels = [...labels].reverse();
  axesOut[ax].labels_en = labels;
  axesOut[ax].labels_zh = [];
}

const axes = axesOut.map((a) => ({
  id: a.id,
  index: a.index,
  category: a.category,
  first: { id: a.first.id, name_en: a.first.name_en, name_zh: '', adj_en: '', noun_en: '', adj_zh: '', noun_zh: '' },
  second: { id: a.second.id, name_en: a.second.name_en, name_zh: '', adj_en: '', noun_en: '', adj_zh: '', noun_zh: '' },
  labels_en: a.labels_en,
  labels_zh: a.labels_zh,
}));

// --- ideologies ---
const ideoRaw = readText('ideologies.js');
const ideoSrc = parseLiteral(extractLiteral(stripComments(ideoRaw), 'ideologies'), 'ideologies.js');
check(Array.isArray(ideoSrc) && ideoSrc.length === 38, `ideologies: expected 38 entries, got ${ideoSrc.length}`);

const byName = (name) => {
  const hit = ideoSrc.find((x) => x.name === name);
  check(hit, `sanity: ideology "${name}" not found`);
  return hit;
};
// Orientation sanity assertions (see STAT_MAP evidence).
const sanity = [
  ['Leninism', 'econ', (v) => v === 100],
  ['Anarcho-Capitalism', 'econ', (v) => v <= 20],
  ['Anarcho-Communism', 'govt', (v) => v <= 10],
  ['Stalinism', 'govt', (v) => v === 100],
  ['Fascism', 'govt', (v) => v >= 80],
  ['Trotskyism', 'dipl', (v) => v >= 80],
  ['Fascism', 'dipl', (v) => v <= 20],
  ['Progressivism', 'scty', (v) => v >= 80],
  ['Reactionary', 'scty', (v) => v <= 20],
];
for (const [name, stat, ok] of sanity) {
  const v = byName(name).stats[stat];
  check(ok(v), `sanity failed: ${name}.${stat} = ${v}; orientation assumption wrong`);
}

const ideologies = ideoSrc.map((x) => {
  const coords = {};
  for (const [stat, { axis, flip }] of Object.entries(STAT_MAP)) {
    const v = x.stats?.[stat];
    check(typeof v === 'number' && v >= 0 && v <= 100, `${x.name}.${stat} invalid: ${v}`);
    coords[axis] = flip ? 100 - v : v;
  }
  return {
    id: slug(x.name),
    name_en: x.name,
    name_zh: '',
    link: x.link,
    desc_en: x.desc,
    desc_zh: '',
    coords,
  };
});
check(new Set(ideologies.map((i) => i.id)).size === ideologies.length, 'duplicate ideology ids');

// --- write ---
fs.mkdirSync(OUT_DIR, { recursive: true });
const write = (name, value) => {
  fs.writeFileSync(path.join(OUT_DIR, name), JSON.stringify(value, null, 2) + '\n');
  console.log(`wrote data/${name}`);
};
write('axes.json', axes);
write('questions.json', questions);
write('ideologies.json', ideologies);
console.log(`summary: ${axes.length} axes, ${questions.length} questions, ${ideologies.length} ideologies`);
