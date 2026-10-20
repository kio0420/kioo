# 2026 期中選舉地圖

互動式美國選舉地圖，分參議院、眾議院、州長三個分頁。點「驢子」或「大象」會只顯示該黨具優勢的州，點地圖上的州可以看候選人、民調和評級。

- 線上版（Claude Artifact）：https://claude.ai/artifact/K3UGnGZZZr4GfxXZW7G187
- 本機：直接用瀏覽器開啟 `index.html`（資料已內嵌，不需要伺服器）

## 檔案

| 路徑 | 用途 |
|---|---|
| `template.html` | 頁面原始碼（樣式與程式） |
| `data/senate.json` `data/governor.json` `data/house.json` | 民調與評級資料 |
| `geo/states-paths.json` | 各州 SVG 路徑，由 `tools/topo2svg.py` 從 us-atlas 的 `states-albers-10m.json` 轉出 |
| `build.py` | 把模板、地圖與資料組成 `index.html`，並在 `seed/` 產生資料庫寫入批次 |

## 資料更新方式

線上版會即時讀取 Artifact 資料庫（`races/<chamber>-<州>` 與 `meta/summary`），所以更新資料不需要重新發布頁面。只有擁有者（編輯權限）能寫入，檢視者唯讀。

定期更新的步驟：

1. 用網路搜尋最新民調與評級（Cook Political Report、RealClearPolling、Decision Desk HQ、Silver Bulletin、Polymarket、Kalshi、新聞），更新 `data/*.json` 中有變動的欄位與各檔的 `updated` 日期。不得編造民調；查不到的就保留原值。
2. 用 `ArtifactData` 的 `list` 讀取 `races`（`limit: 1000`）與 `meta` 兩個集合，把每份文件的 `version` 寫成 `seed/versions.json`，格式為 `{"races/senate-TX": 3, "meta/summary": 1}`。
3. 執行 `python3 build.py`，再把 `seed/batch*.json` 的內容逐批當作 `ArtifactData` `batch` 的 `writes` 送出。
4. commit 並 push `data/` 與 `index.html`。

資料欄位格式：見各 JSON 檔；評級只能是 `Safe D`、`Likely D`、`Lean D`、`Toss-up`、`Lean R`、`Likely R`、`Safe R`。
