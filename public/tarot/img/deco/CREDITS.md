# 裝飾圖樣來源與授權

本目錄的 SVG 向量圖皆為「星語塔羅」專案**原創手寫**；唯一的第三方素材是星雲照片 `nebula-ngc6751.webp`，見下方「第三方素材」。
作者：本專案（由 Claude 協助繪製），日期：2026-10-15。授權：與本專案相同授權。

| 檔案 | 說明 | 來源 / 作者 | 授權 | 連結 |
|---|---|---|---|---|
| hero-sky.svg | 首頁橫幅：八個月相、北斗與仙后座線稿、星芒 | 原創 | 與本專案相同授權 | 無（專案內建） |
| divider.svg | 金色星芒分隔線（頁尾） | 原創 | 與本專案相同授權 | 無 |
| emblem.svg | 日月十二星座環徽章（每日一牌浮水印） | 原創 | 與本專案相同授權 | 無 |

說明：星座線稿為示意性的原創簡化圖，並非精確星圖。SVG 皆為白色單色，於 CSS 以 `mask-image` 套上主題金色，故深色與淺色主題都適用。

## 第三方素材

| 檔案 | 說明 | 來源 | 原始圖片 | 作者 / 署名 | 授權 |
|---|---|---|---|---|---|
| nebula-ngc6751.webp | 深色主題背景用的行星狀星雲 NGC 6751（「發光之眼」）。已放大至 640px、輕微模糊、轉 WebP，並在 CSS 中以低透明度與漸層遮罩使用 | Stellarium 專案的星雲貼圖 `nebulae/default/n6751.png`（https://github.com/Stellarium/stellarium ，於 2026-10-15 取得），其 `textures.json` 記載了此圖的署名與原始連結 | ESA/Hubble 圖片 opo0012a：https://www.spacetelescope.org/images/opo0012a/ | NASA/ESA and The Hubble Heritage Team (STScI/AURA) | ESA/Hubble 圖片採 CC BY 4.0（https://creativecommons.org/licenses/by/4.0/ ），需署名；NASA 與 ESA 為來源機構。本檔為縮放、模糊處理後的衍生版本 |

注意：Stellarium 的貼圖檔本身是其再處理過的版本（解析度僅 128px），我們未能自 ESA/Hubble 官方站點下載原檔（網路限制），授權判斷依據為 `textures.json` 的署名與原始 ESA/Hubble 連結；若需更嚴謹的授權確認，請以上述 opo0012a 原頁面為準。
