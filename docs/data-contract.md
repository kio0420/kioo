# Data contract (shared by all build stages)

Source: politicaltests.github.io (uploaded zip, commit 5a508de), folder `12axes/`.
MIT — Copyright (c) 2020 8values (SapplyValues); 12axes based on 9axes, based on 8values.

## Canonical axes (order, id, first pole / second pole)
| # | id | first pole | second pole |
|---|----|-----------|-------------|
| 0 | federal-unitary | Federal | Unitary |
| 1 | democratic-autocratic | Democratic | Autocratic |
| 2 | internationalist-nationalist | Internationalist | Nationalist |
| 3 | militarist-pacifist | Militarist | Pacifist |
| 4 | security-freedom | Security | Freedom |
| 5 | equality-markets | Equality | Markets |
| 6 | secular-religious | Secular | Religious |
| 7 | progressive-traditional | Progressive | Traditional |
| 8 | assimilationist-multiculturalist | Assimilationist | Multiculturalist |
| 9 | planned-laissezfaire | Planned Economy | Laissez-faire |
| 10 | protectionist-globalist | Protectionist | Globalist (Free Trade) |
| 11 | acceleration-bioconservative | Technological Acceleration | Bioconservative |

All scores are "% toward FIRST pole" (0–100). Second pole = 100 − first.

## data/axes.json
`[{ "id", "index", "category": "government|foreign|economy|society", "first": {"id","name_en","name_zh"}, "second": {...}, "labels_en": [7], "labels_zh": [7] }]`
labels[0] = first-pole% > 90 … labels[6] = < 10. (`name_zh`/`labels_zh` filled by translator; "" until then.)

## data/questions.json
`[{ "id": "A00-L1-Q1", "axis": "<axis id>", "level": 1..8, "pole": "first"|"second", "text_en", "text_zh" }]`
Level 1 = strongest toward first pole … level 4 = mild first; 5 = mild second … 8 = strongest second.
pole = "first" for levels 1–4, "second" for 5–8. 12 × 24 = 288; 3 per (axis, level).

## data/ideologies.json
`[{ "id", "name_en", "name_zh", "link", "desc_en", "desc_zh", "coords": {"equality-markets","security-freedom","internationalist-nationalist","progressive-traditional"} }]`
coords are % toward the canonical FIRST pole of that axis. 38 entries. Original `dipl` is mapped to
internationalist-nationalist (spec decision; the original site compared it to the trade axis).

## data/figures.json (estimates)
`{ "disclaimer", "figures": [{ "id","name_en","name_zh","country","lean":"left|center|right","coords": {"<axis id>": number|null x12}, "sources": {"<axis id>": "evidence"} }] }`
