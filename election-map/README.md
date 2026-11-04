# 2026 期中選舉地圖

互動式美國選舉地圖，分參議院、眾議院、州長三個分頁。點「驢子」或「大象」會只顯示該黨具優勢的州，點地圖上的州會放大成該州的眾議院選區圖（每個選區依評級上色），並顯示候選人、民調和評級。

- 線上版（Claude Artifact）：https://claude.ai/artifact/K3UGnGZZZr4GfxXZW7G187
- 本機：2026 預測可直接用瀏覽器開啟 `index.html`；要切換到 2020–2024 年需透過伺服器開啟（例如在此資料夾執行 `python3 -m http.server`）

## 檔案

| 路徑 | 用途 |
|---|---|
| `template.html` | 頁面原始碼（樣式與程式） |
| `data/senate.json` `data/governor.json` `data/house.json` | 民調與評級資料 |
| `data/districts.json` | 435 個眾議院選區的評級、現任者與候選人（Likely/Lean/拉鋸取自 Cook，穩固席次依選區政黨傾向判定） |
| `data/results.json` | 實際開票結果層（見下方「實際結果」） |
| `data/district-map-sources.json` | 各州選區邊界的來源與採用的 2026 選區圖 |
| `geo/states-paths.json` | 各州 SVG 路徑，由 `tools/topo2svg.py` 從 us-atlas 的 `states-albers-10m.json` 轉出 |
| `geo/districts-paths.json` | 各州選區 SVG 路徑，由 `tools/districts2svg.mjs` 投影、`tools/thinpaths.py` 精簡 |
| `build.py` | 把模板、地圖與資料組成 `index.html`，並在 `seed/` 產生資料庫寫入批次 |
| `data/history/` | 2020–2024 選後結果：總統、參議院、州長（含奇數年州長選舉）、眾議院各選區 |
| `build_history.py` | 把歷史結果與當年選區圖組成 `history/<年>.json`，頁面切換年份時才載入 |
| `build_history_538.py` | 從 FiveThirtyEight election-results 的四個 CSV 產生 2000–2018 的 `history/<年>.json`（執行：`python3 build_history_538.py <CSV 資料夾>`；CSV 下載自 raw.githubusercontent.com/fivethirtyeight/election-results/main/） |
| `geo/districts-<年>.json` | 2020、2022、2024 當年實際使用的眾議院選區圖 |

## 資料更新方式

線上版會即時讀取 Artifact 資料庫（`races/<chamber>-<州>` 與 `meta/summary`），所以更新資料不需要重新發布頁面。只有擁有者（編輯權限）能寫入，檢視者唯讀。

定期更新的步驟：

1. 用網路搜尋最新民調與評級（Cook Political Report、RealClearPolling、Decision Desk HQ、Silver Bulletin、Polymarket、Kalshi、新聞），更新 `data/*.json`（含 `districts.json` 的選區評級）中有變動的欄位與各檔的 `updated` 日期。`build.py` 會依完整的選區清單重算各州的評級分類數。不得編造民調；查不到的就保留原值。
2. 用 `ArtifactData` 的 `list` 讀取 `races`（`limit: 1000`）與 `meta` 兩個集合，把每份文件的 `version` 寫成 `seed/versions.json`，格式為 `{"races/senate-TX": 3, "meta/summary": 1}`。
3. 執行 `python3 build.py`，再把 `seed/batch*.json` 的內容逐批當作 `ArtifactData` `batch` 的 `writes` 送出。
4. commit 並 push `data/` 與 `index.html`。

資料欄位格式：見各 JSON 檔；評級只能是 `Safe D`、`Likely D`、`Lean D`、`Toss-up`、`Lean R`、`Likely R`、`Safe R`。

## 實際結果（預測 vs 實際）

`data/results.json` 存放開票結果，不會改動任何預測、民調或評級欄位。結構：`updated`、`source`、`asOf`、`races`、`totals`。`races` 的鍵為 `senate-XX`、`gov-XX`、`house-XX-N`（N 為 `districts.json` 的選區號，全州一席者為 1），每筆含 `status`（pending / counting / called）、`called`（D / R / I / null）、`calledBy`、`dem` `rep` `other`（票數）、`demPct` `repPct`、`pctReporting`、`note`、`asOf`。檔案已預填所有競賽（皆 pending）。

- `build.py` 把結果併入：參議院、州長文件新增 `actual`；眾議院州文件新增 `actual`（以選區號為鍵）；`meta/summary` 新增 `results`（updated、asOf、source 與已確定席次 totals，totals 由 build 依已確定競賽重算）。缺檔或缺鍵一律視為 pending。
- 頁面右上角「預測 / 實際」切換地圖模式：實際模式依確定勝者上色（斜線 = 計票中、依領先者），並顯示計分板（各院已確定席次、預測命中率不含拉鋸、賽前控制權機率）。州與選區面板有「預測 vs 實際」對照與命中／落空判定。參議院與州長席次僅計本次改選。
- 更新流程：編輯 `data/results.json` → `python3 build.py` → 依上方步驟用 `ArtifactData` 批次寫入（頁面會即時同步，不必重新發布）；僅在 `template.html` 有改動時才需重新發布頁面。
