# 塔羅牌圖片轉換器 TarotResizer

把單張或大量圖片一次轉成塔羅牌尺寸的小工具（Windows exe）。

![test](test.png)

## 功能
- **單張／批量**：加入圖片、加入整個資料夾（含子資料夾）、拖放檔案到清單，或直接把圖片拖到 exe 圖示上開啟。
- **尺寸預設**：標準塔羅 70×120 mm、Rider-Waite 2.75×4.75 in、大尺寸 80×135 mm、撲克牌 63×88 mm、迷你 44×70 mm，或自訂尺寸。
- **DPI／出血**：預設 300 DPI（70×120 mm → 827×1417 px），可加出血 (mm/邊) 方便印刷。
- **即時預覽**：選取圖片即可看到結果，並顯示壓縮／裁切了多少。
- 輸出 PNG 或 JPG（寫入 DPI 資訊）。同名檔案不會被覆蓋。

## 處理方式
| 模式 | 說明 |
| --- | --- |
| **智慧壓縮（預設）** | 優先「壓縮」：比例差距在「最大壓縮變形」（預設 15%，可調 0–40%）以內就直接壓成牌面大小，**完全不裁切**；差距更大時先壓縮到上限，剩下的部分才做最少量的置中裁切。 |
| 完整保留 | 等比縮放、不變形也不裁切，空白處用模糊背景或純色補滿。 |
| 裁切填滿 | 傳統做法：等比放大填滿後置中裁切。 |

另可勾選「橫向圖片自動旋轉成直向」，避免橫圖被大量裁切。

## 取得 exe
- **GitHub Actions**：推送後到 Actions →「Build Windows exe」→ 下載 `TarotResizer` artifact。
- **自行打包**（Windows，需 Python 3.9+）：執行 `build.bat`，產物在 `dist\TarotResizer.exe`。

## 直接用 Python 執行
```bash
pip install -r requirements.txt
python tarot_resizer.py
```

## 測試
```bash
pip install pytest
python -m pytest
```
