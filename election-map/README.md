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
| `data/district-map-sources.json` | 各州選區邊界的來源與採用的 2026 選區圖 |
| `geo/states-paths.json` | 各州 SVG 路徑，由 `tools/topo2svg.py` 從 us-atlas 的 `states-albers-10m.json` 轉出 |
| `geo/districts-paths.json` | 各州選區 SVG 路徑，由 `tools/districts2svg.mjs` 投影、`tools/thinpaths.py` 精簡 |
| `build.py` | 把模板、地圖與資料組成 `index.html`，並在 `seed/` 產生資料庫寫入批次 |
| `data/history/` | 2020–2024 選後結果：總統、參議院、州長（含奇數年州長選舉）、眾議院各選區 |
| `build_history.py` | 把歷史結果與當年選區圖組成 `history/<年>.json`，頁面切換年份時才載入 |

## 資料更新方式

線上版會即時讀取 Artifact 資料庫（`races/<chamber>-<州>` 與 `meta/summary`），所以更新資料不需要重新發布頁面。只有擁有者（編輯權限）能寫入，檢視者唯讀。

定期更新的步驟：

1. 用網路搜尋最新民調與評級（Cook Political Report、RealClearPolling、Decision Desk HQ、Silver Bulletin、Polymarket、Kalshi、新聞），更新 `data/*.json`（含 `districts.json` 的選區評級）中有變動的欄位與各檔的 `updated` 日期。`build.py` 會依完整的選區清單重算各州的評級分類數。不得編造民調；查不到的就保留原值。
2. 用 `ArtifactData` 的 `list` 讀取 `races`（`limit: 1000`）與 `meta` 兩個集合，把每份文件的 `version` 寫成 `seed/versions.json`，格式為 `{"races/senate-TX": 3, "meta/summary": 1}`。
3. 執行 `python3 build.py`，再把 `seed/batch*.json` 的內容逐批當作 `ArtifactData` `batch` 的 `writes` 送出。
4. commit 並 push `data/` 與 `index.html`。

資料欄位格式：見各 JSON 檔；評級只能是 `Safe D`、`Likely D`、`Lean D`、`Toss-up`、`Lean R`、`Likely R`、`Safe R`。
