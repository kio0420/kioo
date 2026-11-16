# 塔羅網站功能調研報告

調研日期：2026-10-02。
方法說明：Labyrinthos、Biddy Tarot、Golden Thread Tarot、Trusted Tarot、塔羅療癒日記的官網在本環境被網路代理封鎖，無法直接抓取。以下內容主要來自 WebSearch 回傳的搜尋摘要與 App Store / Google Play 商店頁面標題及評測文章，並輔以業界通用做法判斷；標示「（通用）」者表示非逐站親眼確認，僅為常見標準功能。

## 一、功能總表

| 功能名稱 | 說明 | 哪些網站有 | 可純前端實作 | 難度 | 優先度 |
|---|---|---|---|---|---|
| 每日一牌 | 依日期固定抽一張牌，當日重複開啟結果相同（以日期做種子） | Trusted Tarot、塔羅療癒日記、塔羅GO、塔羅AI、愛塔羅、Labyrinthos | 是 | 低 | P1 |
| 占卜紀錄／塔羅日記 | 儲存每次抽牌結果、牌陣、問題與個人筆記，可回顧與刪除 | Labyrinthos（reading journal）、Biddy Tarot（card journal）、塔羅療癒日記、塔羅GO（日曆）、塔羅AI（高級版解讀記錄） | 是（localStorage，僅限單一裝置） | 中 | P1 |
| 牌義測驗／閃卡學習模式 | 以閃卡、選擇題練習牌名與牌義，附正確率統計 | Labyrinthos（Learn 分頁、Major Arcana 課程含測驗）、Biddy Tarot（學習課程） | 是 | 中 | P1 |
| 分享結果圖片 | 將牌陣結果以 canvas 輸出為圖片下載／分享 | 多數 App 具備（通用）；塔羅GO、塔羅AI 有分享結果 | 是（canvas / Web Share API） | 中 | P1 |
| 深色模式 | 依系統偏好或手動切換主題；塔羅站常以暗色營造氛圍 | 多數 App（通用） | 是 | 低 | P1 |
| 牌陣動畫與音效 | 洗牌、翻牌動畫，環境音／翻牌音效，可關閉 | 塔羅AI、愛塔羅等 App（通用）、Trusted Tarot 互動抽牌 | 是 | 中 | P2 |
| PWA 離線使用 | manifest + Service Worker，可安裝到主畫面並離線使用 | 無（調研站台多為原生 App），屬於純前端替代原生 App 的標準做法 | 是 | 中 | P2 |
| 牌組／牌面切換 | 多套牌面（Rider-Waite、Marseille 等）可選 | 塔羅療癒日記（六個牌組選擇）、Trusted Tarot（無邊框 1909 風格牌面）、Labyrinthos | 部分（需版權合法的牌面圖片素材） | 中 | P3 |
| 牌與牌的組合解讀 | 偵測相鄰牌、重複花色／大牌比例、元素對立等並給出規則式提示 | Biddy Tarot（教學文章）、Labyrinthos（教學）；規則式實作為自訂 | 部分（規則式可行，深度解讀需 AI） | 高 | P2 |
| 元素／數字學統計（「Your Mirror」式） | 統計歷史紀錄中大牌、花色、元素、正逆位、高頻牌，呈現模式 | Labyrinthos（Your Mirror 跨紀錄找規律）、塔羅GO（結合生命靈數） | 是（依賴占卜紀錄） | 中 | P2 |
| 自訂牌陣 | 使用者自行定義位置數量與每個位置的意義，並可儲存 | Labyrinthos（含多種牌陣）、塔羅AI／愛塔羅（9 種牌陣，僅內建）；自訂為進階功能 | 是 | 高 | P3 |
| AI 解讀 | 以大型語言模型針對問題與牌面產生個人化解讀 | 塔羅療癒日記、塔羅AI、塔羅GO、Biddy Tarot（AI 閱讀）、Tarotoo | 否（需後端與 API 金鑰；純前端會洩漏金鑰） | 高 | P3 |
| 月相／占星連動 | 顯示當日月相、星座，建議抽牌時機或搭配星座運勢 | 塔羅GO（星座與生命靈數）、塔羅AI（星座運勢）、Labyrinthos（占星測驗） | 部分（月相可用演算法離線計算，星象需函式庫或資料表） | 中 | P3 |
| 牌義資料庫搜尋／篩選 | 依關鍵字、花色、牌號、元素篩選牌義；單張牌詳細頁 | Trusted Tarot（Meanings Library）、愛塔羅（78 張正逆位）、Labyrinthos（card database） | 是 | 低 | P1 |
| 主題式牌陣（愛情、事業、週運） | 依主題預設問題與牌陣，如愛情、事業、週運 | Trusted Tarot（14 種讀牌、愛情／週運）、塔羅AI（愛情運、事業運） | 是 | 低 | P2 |
| 引導式牌陣教學／持實體牌輔助 | 使用實體牌時，由站台引導每個位置並輸入抽到的牌 | Labyrinthos（guided readings with your own physical deck） | 是 | 中 | P2 |
| 紀錄匯出／匯入備份 | 將 localStorage 紀錄匯出為 JSON，換裝置時匯入 | （通用，補足無帳號限制） | 是 | 低 | P2 |
| 每日提醒通知 | 每日推播提醒抽牌 | 塔羅AI、塔羅療癒日記等 App（通用） | 部分（PWA 本地通知受限，iOS 支援有限） | 高 | P3 |
| 牌陣內「重抽一次」與每日重抽限制 | 控制重抽次數，鼓勵專注提問 | 塔羅療癒日記（每日可重抽一次） | 是 | 低 | P3 |

## 二、建議下一步（P1 前五項）

1. **每日一牌**：用「YYYY-MM-DD + 站台鹽值」雜湊出種子，以可播種的偽隨機函式（如 mulberry32）從 78 張選牌與正逆位，同一天結果穩定。首頁放置卡片，點擊翻牌後顯示牌義並連到牌義詳細頁；同時把當日結果寫入 localStorage，供日記功能共用。
2. **占卜紀錄／塔羅日記**：每次完成抽牌時，將 `{id, 時間, 牌陣, 問題, 牌[{位置, 牌id, 正逆}], 筆記}` 以 JSON 陣列存入 localStorage，另做一個「紀錄」頁，支援列表、單筆詳情、編輯筆記與刪除。需包 try/catch 處理無痕模式，並提供 JSON 匯出／匯入以避免資料遺失。
3. **牌義測驗／閃卡學習模式**：直接重用既有 78 張牌資料，產生兩種題型：看牌圖／牌名選關鍵字、看關鍵字猜牌。以 localStorage 記錄每張牌答對次數，用簡化間隔重複（答錯的牌提高出現權重），並顯示正確率與進度。
4. **分享結果圖片**：以 `<canvas>` 依牌陣版面繪製牌圖、位置名稱與簡短牌義，再用 `canvas.toBlob` 提供下載，支援 Web Share API 的裝置則呼叫 `navigator.share({files})`。注意牌圖需同源或允許跨域，避免 canvas 污染；中文字型以系統字型或預載網頁字型繪製。
5. **深色模式**：以 CSS 變數定義色票，預設跟隨 `prefers-color-scheme`，並在頁首提供手動切換，選擇存入 localStorage。需確認牌圖在深色背景下的對比與陰影，並在 `<head>` 內嵌小段腳本避免載入時閃白。

（補充：牌義資料庫搜尋／篩選同為 P1 且難度低，可與上列併行實作。）

## 三、資料來源

實際查閱（皆為搜尋結果摘要或商店頁面標題，官網本體被代理封鎖）：

- https://labyrinthos.co/ 、https://www.biddytarot.com/ 、https://goldenthreadtarot.com/ 、https://www.trustedtarot.com/ 、https://www.tarothealingdiary.com/ ：直接抓取失敗（EGRESS_BLOCKED），僅透過搜尋摘要取得資訊
- https://www.tarothealingdiary.com/ （搜尋摘要：AI 解讀、每日一抽、療癒日記）
- https://gomedia.asia/zh/free_daily_tarot/ （塔羅GO，搜尋摘要）
- https://www.ryansdaily.com/free-tarot-reading/ （搜尋結果標題）
- https://apps.apple.com/tw/app/%E5%A1%94%E7%BE%85ai-%E6%AF%8F%E6%97%A5%E7%89%8C%E5%8D%A1%E8%A7%A3%E8%AE%80/id6447095993 （塔羅AI）
- https://apps.apple.com/tw/app/%E6%84%9B%E5%A1%94%E7%BE%85/id585564221 （愛塔羅）
- https://apps.apple.com/hk/app/%E5%A1%94%E7%BE%85%E7%89%8C-ai-%E8%AE%80%E7%89%8C-%E6%AF%8F%E6%97%A5%E4%B8%80%E6%8A%BD-%E7%99%82%E7%99%92%E6%97%A5%E8%A8%98/id6474285453
- https://apps.apple.com/us/app/-/id1155180220 （Labyrinthos Tarot Reading）
- https://play.google.com/store/apps/details/labyrinthos+tarot?id=com.labyrinthos.app
- https://labyrinthos.co/products/golden-thread-tarot-deck-cards
- https://apps.apple.com/us/app/trusted-tarot/id1441553118
- https://www.trustedtarot.com/free-reading/ 、https://www.trustedtarot.com/app/
- https://aimag.me/blog/best-tarot-apps 、https://astratrainer.com/blog/spiritual/best-apps-to-learn-tarot 、https://blog.whisper.day/reviews/best-tarot-apps-2026/ （評測文章）
