# 十二向度：政治光譜自省

一個純靜態的 12 軸政治傾向自我反思測驗（繁體中文，可切換英文原文）。
題目與意識形態座標來自開源的 12axes 專案（politicaltests.github.io，MIT），其上游為 9axes 與 8values；詳見 `LICENSE`、`NOTICE` 與網站的「授權與來源」頁。

> 這是自我反思工具，不是經過驗證的心理測量工具。題目由英文翻譯，原始脈絡為美國政治；快速版與迷你版的結果波動較大。

## 開發

```bash
npm install
npm run dev      # 開發伺服器
npm test         # Vitest 單元測試
npm run build    # 型別檢查 + 產生 dist/（可部署到任何靜態主機）
```

## 結構

- `src/engine/`：純函式（抽題、鏡像、計分、標籤、類型、RMS 配對、網址編碼），不碰 DOM。
- `src/ui/`、`src/pages/`：頁面與元件，只呼叫 engine。
- `data/`：`questions.json`（288 題）、`axes.json`、`ideologies.json`（38 種）、`figures.json`（人物估計值）。
- `data/i18n/zh-TW/`：翻譯原始檔；修改後執行 `node scripts/merge-translations.mjs` 合併。
- `scripts/extract-12axes.mjs`：從上游原始檔重新產生資料；`scripts/validate-data.mjs`：資料完整性檢查。
- `docs/data-contract.md`：資料格式。

## 設計決定

- **等級組合**（`src/engine/config.ts` 的 `MODE_CONFIG`，可調）：快速版用等級 2、3、4、6、8（沿用原版 12axes 快速版的抽題索引 1、2、3、5、7）；迷你版用 2、4、6（快速版的子集，同一端強烈＋溫和題、另一端中等題）。鏡像把等級 l 換成 9−l，每次剛好 6 軸（一半）鏡像。
- **外交座標**：原版把意識形態的 `dipl` 跟貿易軸比較；本站依規格改為跟「國際主義 vs 民族主義」比較。
- **完整版計分**：原版完整版未正規化（50 + 總和），本站一律使用 50 + 50 × 總和 ÷ (2 × 題數)。
- **分數精度**：各軸分數四捨五入到 0.1，與結果網址的精度一致，確保分享網址能還原出完全相同的標籤、類型、結果句與配對。
- **軸方向**：依題目內容判定（上游 CHEATSHEET 對部分軸的端點順序與題目相反，未採用）。
