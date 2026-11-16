// Merge zh-TW translation files (data/i18n/zh-TW/*.json) into data/axes.json, questions.json, ideologies.json.
// axis-<axisId>.json: { axis, first:{name,adj,noun}, second:{name,adj,noun}, labels:[7], questions:{ <qid>: text } }
// ideologies.json:    { <ideologyId>: { name, desc } }
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
const dir = 'data/i18n/zh-TW';
const read = (p) => JSON.parse(readFileSync(p, 'utf8'));
const write = (p, v) => writeFileSync(p, JSON.stringify(v, null, 2) + '\n');
const axes = read('data/axes.json'), questions = read('data/questions.json'), ideologies = read('data/ideologies.json');
const qById = new Map(questions.map((q) => [q.id, q]));
const problems = [];
for (const f of readdirSync(dir).filter((f) => f.startsWith('axis-'))) {
  const t = read(`${dir}/${f}`);
  const axis = axes.find((a) => a.id === t.axis);
  if (!axis) { problems.push(`${f}: unknown axis ${t.axis}`); continue; }
  for (const side of ['first', 'second']) {
    axis[side].name_zh = t[side].name; axis[side].adj_zh = t[side].adj; axis[side].noun_zh = t[side].noun;
    if (t[side].adj_en) axis[side].adj_en = t[side].adj_en;
    if (t[side].noun_en) axis[side].noun_en = t[side].noun_en;
  }
  if (t.title) axis.title_zh = t.title;
  if (!Array.isArray(t.labels) || t.labels.length !== 7) problems.push(`${f}: labels must have 7`);
  axis.labels_zh = t.labels;
  for (const [id, text] of Object.entries(t.questions)) {
    const q = qById.get(id);
    if (!q || q.axis !== t.axis) problems.push(`${f}: bad question id ${id}`); else q.text_zh = text;
  }
}
if (existsSync(`${dir}/ideologies.json`)) {
  const t = read(`${dir}/ideologies.json`);
  for (const i of ideologies) {
    if (t[i.id]) { i.name_zh = t[i.id].name; i.desc_zh = t[i.id].desc; } else problems.push(`ideology missing: ${i.id}`);
  }
}
for (const q of questions) if (!q.text_zh) problems.push(`untranslated: ${q.id}`);
write('data/axes.json', axes); write('data/questions.json', questions); write('data/ideologies.json', ideologies);
console.log(problems.length ? `${problems.length} problems:\n` + problems.slice(0, 50).join('\n') : 'merge OK, no problems');
