#!/usr/bin/env node
// Validates data/axes.json, data/questions.json, data/ideologies.json against
// docs/data-contract.md. Exits non-zero on the first failing group of checks.
// Usage (from repo root): node scripts/validate-data.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const load = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, 'data', f), 'utf8'));

const CANON = [
  'federal-unitary', 'democratic-autocratic', 'internationalist-nationalist', 'militarist-pacifist',
  'security-freedom', 'equality-markets', 'secular-religious', 'progressive-traditional',
  'assimilationist-multiculturalist', 'planned-laissezfaire', 'protectionist-globalist',
  'acceleration-bioconservative',
];
const COORD_AXES = ['equality-markets', 'security-freedom', 'internationalist-nationalist', 'progressive-traditional'];

const errors = [];
const expect = (cond, msg) => { if (!cond) errors.push(msg); };

// --- axes ---
const axes = load('axes.json');
expect(Array.isArray(axes) && axes.length === 12, `axes: expected 12, got ${axes.length}`);
axes.forEach((a, i) => {
  expect(a.id === CANON[i], `axes[${i}].id is "${a.id}", expected "${CANON[i]}"`);
  expect(a.index === i, `axes[${i}].index is ${a.index}`);
  expect(Array.isArray(a.labels_en) && a.labels_en.length === 7 && a.labels_en.every((s) => typeof s === 'string' && s.trim()),
    `axes[${i}].labels_en must be 7 non-empty strings`);
  for (const p of ['first', 'second']) {
    expect(a[p] && a[p].id && a[p].name_en, `axes[${i}].${p} missing id/name_en`);
  }
});
expect(new Set(axes.map((a) => a.id)).size === axes.length, 'axes: duplicate ids');

// --- questions ---
const questions = load('questions.json');
expect(questions.length === 288, `questions: expected 288, got ${questions.length}`);
expect(new Set(questions.map((q) => q.id)).size === questions.length, 'questions: duplicate ids');
const perAxis = new Map();
const perCell = new Map();
for (const q of questions) {
  const where = `question ${q.id}`;
  expect(CANON.includes(q.axis), `${where}: unknown axis "${q.axis}"`);
  expect(Number.isInteger(q.level) && q.level >= 1 && q.level <= 8, `${where}: level ${q.level} not in 1..8`);
  expect(q.pole === (q.level <= 4 ? 'first' : 'second'), `${where}: pole "${q.pole}" does not match level ${q.level}`);
  expect(typeof q.text_en === 'string' && q.text_en.trim().length > 0, `${where}: empty text_en`);
  expect(typeof q.text_zh === 'string', `${where}: text_zh must be a string`);
  perAxis.set(q.axis, (perAxis.get(q.axis) || 0) + 1);
  const key = `${q.axis}|${q.level}`;
  perCell.set(key, (perCell.get(key) || 0) + 1);
}
for (const id of CANON) {
  expect(perAxis.get(id) === 24, `questions: axis ${id} has ${perAxis.get(id) || 0}, expected 24`);
  for (let L = 1; L <= 8; L++) {
    expect(perCell.get(`${id}|${L}`) === 3, `questions: ${id} level ${L} has ${perCell.get(`${id}|${L}`) || 0}, expected 3`);
  }
}

// --- ideologies ---
const ideologies = load('ideologies.json');
expect(ideologies.length === 38, `ideologies: expected 38, got ${ideologies.length}`);
expect(new Set(ideologies.map((i) => i.id)).size === ideologies.length, 'ideologies: duplicate ids');
for (const it of ideologies) {
  const where = `ideology ${it.id}`;
  expect(typeof it.name_en === 'string' && it.name_en.trim(), `${where}: empty name_en`);
  expect(typeof it.desc_en === 'string' && it.desc_en.trim(), `${where}: empty desc_en`);
  const keys = Object.keys(it.coords || {}).sort();
  expect(JSON.stringify(keys) === JSON.stringify([...COORD_AXES].sort()), `${where}: coords keys ${keys.join(',')}`);
  for (const k of COORD_AXES) {
    const v = it.coords?.[k];
    expect(typeof v === 'number' && v >= 0 && v <= 100, `${where}: coords.${k} = ${v} not in [0,100]`);
  }
}

if (errors.length) {
  console.error(`FAIL (${errors.length} problems):`);
  for (const e of errors.slice(0, 50)) console.error('  - ' + e);
  process.exit(1);
}
console.log('axes: 12 in canonical order, 7 labels each');
console.log('questions: 288 total, 24 per axis, 3 per (axis, level), levels 1-8, pole/level consistent');
console.log('ideologies: 38, 4 coords each in [0,100]');
console.log('PASS');
