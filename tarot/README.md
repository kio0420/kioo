# 星語塔羅

純前端的繁體中文塔羅網站，不需要安裝或建置，直接用瀏覽器開啟 `index.html` 即可。

## 功能
- **每日一牌**（首頁）：用「YYYY-MM-DD + 站台鹽值」雜湊出種子，再用 mulberry32 抽牌和正逆位，所以同一天結果固定。翻開後會記到 localStorage，「我的紀錄」也看得到。
- **塔羅占卜**：8 種牌陣（單張牌、是非題、時間之流、身心靈、二選一、五張十字、關係牌陣、凱爾特十字）。可以選問題類型和是否包含逆位，翻完牌後會顯示整體能量統計。
- **牌義圖鑑**：78 張牌的正逆位牌義、關鍵字，以及感情和事業解讀，可以篩選和搜尋。每張牌都有自己的網址（`#card/<id>`），例如 `index.html#card/major-13`。
- **我的紀錄**：每次占卜翻完牌後會自動存檔，可以寫筆記、刪除、匯出或匯入 JSON。無痕模式下沒辦法長期保存，會改存在記憶體並提醒使用者。
- **學習測驗**：有「看牌選關鍵字」、「看關鍵字猜牌」、混合和閃卡四種模式，用簡化的間隔重複安排出題，答錯的牌會比較常出現，並顯示正確率和學習進度。
- **分享結果圖片**：用 canvas 畫出牌陣和牌義。裝置支援 Web Share API 就直接分享，不支援就下載 PNG。
- **主題**：可以切換跟隨系統、淺色、深色，設定會記住，載入頁面時不會先閃一下其他主題。

## localStorage 鍵值
| 鍵 | 內容 |
|---|---|
| `tarot.readings` | 占卜紀錄陣列 `{id, time, spreadId, spreadName, question, topic, cards[{position, cardId, reversed}], note}` |
| `tarot.daily` | 每日一牌 `{ "YYYY-MM-DD": {cardId, reversed, revealedAt} }` |
| `tarot.quiz` | 測驗進度與每張牌的權重 |
| `tarot.theme` | `"light"` 或 `"dark"`（沒有這個鍵就是跟隨系統） |

## 檔案結構
```
index.html
css/style.css
css/quiz.css
js/data/major.js                    大阿爾克那
js/data/minor-wands-cups.js         權杖、聖杯
js/data/minor-swords-pentacles.js   寶劍、錢幣
js/store.js                         localStorage 包裝（無痕模式不會出錯）
js/spreads.js                       牌陣定義（新增牌陣只要在這裡加一筆）
js/app.js                           介面、占卜、每日一牌、主題、牌義網址
js/journal.js                       我的紀錄
js/quiz.js                          學習測驗
js/share.js                         分享結果圖片
FEATURES.md                         延伸功能調研與後續建議
```
