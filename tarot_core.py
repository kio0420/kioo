"""塔羅牌尺寸轉換核心邏輯（與 GUI 分離，方便測試）。

策略重點：優先「壓縮」（非等比縮放）而不是裁切。
  1. 若原圖比例與塔羅牌比例差距在「最大壓縮比例」以內 → 直接壓縮成牌面大小，完全不裁切。
  2. 若差距超過上限 → 先壓縮到上限，剩下無法吸收的部分才做最小量的置中裁切。
另外提供「完整保留（補邊）」與「傳統裁切填滿」兩種模式。
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Iterable, Optional, Tuple

from PIL import Image, ImageFilter, ImageOps

MM_PER_INCH = 25.4

# 名稱: (寬 mm, 高 mm)
SIZE_PRESETS = {
    "標準塔羅 70 × 120 mm": (70.0, 120.0),
    "Rider-Waite 2.75 × 4.75 in": (69.85, 120.65),
    "大尺寸塔羅 80 × 135 mm": (80.0, 135.0),
    "撲克牌尺寸 63 × 88 mm": (63.0, 88.0),
    "迷你塔羅 44 × 70 mm": (44.0, 70.0),
}

MODE_SMART = "smart"      # 優先壓縮，超出上限才少量裁切
MODE_FIT = "fit"          # 完整保留，等比縮放後補邊（不裁切、不變形）
MODE_CROP = "crop"        # 等比縮放後裁切填滿（傳統做法）

MODE_LABELS = {
    MODE_SMART: "智慧壓縮（優先壓縮，必要時才少量裁切）",
    MODE_FIT: "完整保留（等比縮放＋補邊，不裁切）",
    MODE_CROP: "裁切填滿（等比縮放＋置中裁切）",
}

FILL_BLUR = "blur"
FILL_COLOR = "color"

SUPPORTED_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".gif", ".webp", ".tif", ".tiff"}


@dataclass
class TarotOptions:
    width_mm: float = 70.0
    height_mm: float = 120.0
    dpi: int = 300
    mode: str = MODE_SMART
    max_squeeze: float = 0.15          # 最多允許 15% 的變形壓縮
    fill: str = FILL_BLUR               # 補邊方式（僅 fit 模式）
    fill_color: Tuple[int, int, int] = (255, 255, 255)
    bleed_mm: float = 0.0               # 出血（每邊）
    auto_rotate: bool = False           # 橫向圖自動轉成直向
    out_format: str = "PNG"             # PNG / JPEG
    jpeg_quality: int = 95

    def pixel_size(self) -> Tuple[int, int]:
        w = self.width_mm + 2 * self.bleed_mm
        h = self.height_mm + 2 * self.bleed_mm
        return (
            max(1, round(w / MM_PER_INCH * self.dpi)),
            max(1, round(h / MM_PER_INCH * self.dpi)),
        )


@dataclass
class ProcessInfo:
    """描述一張圖實際做了什麼處理，顯示給使用者看。"""
    squeeze: float = 0.0       # 實際變形比例（0.08 = 8%）
    crop_ratio: float = 0.0    # 被裁掉的面積比例
    padded: bool = False
    rotated: bool = False

    def describe(self) -> str:
        parts = []
        if self.rotated:
            parts.append("已旋轉")
        if self.squeeze > 0.0005:
            parts.append(f"壓縮 {self.squeeze * 100:.1f}%")
        if self.crop_ratio > 0.0005:
            parts.append(f"裁切 {self.crop_ratio * 100:.1f}%")
        if self.padded:
            parts.append("補邊")
        return "、".join(parts) if parts else "比例相符，直接縮放"


def is_supported(path: str) -> bool:
    return os.path.splitext(path)[1].lower() in SUPPORTED_EXTS


def collect_images(paths: Iterable[str]) -> list:
    """展開資料夾並過濾出支援的圖片檔。"""
    result = []
    for p in paths:
        if os.path.isdir(p):
            for root, _dirs, files in os.walk(p):
                for f in sorted(files):
                    full = os.path.join(root, f)
                    if is_supported(full):
                        result.append(full)
        elif os.path.isfile(p) and is_supported(p):
            result.append(p)
    return result


def _load(path_or_image) -> Image.Image:
    img = path_or_image if isinstance(path_or_image, Image.Image) else Image.open(path_or_image)
    img = ImageOps.exif_transpose(img)
    if img.mode not in ("RGB", "RGBA"):
        img = img.convert("RGBA" if "A" in img.getbands() or "transparency" in img.info else "RGB")
    return img


def _center_crop(img: Image.Image, crop_w: int, crop_h: int) -> Image.Image:
    w, h = img.size
    left = (w - crop_w) // 2
    top = (h - crop_h) // 2
    return img.crop((left, top, left + crop_w, top + crop_h))


def _smart(img: Image.Image, tw: int, th: int, max_squeeze: float, info: ProcessInfo) -> Image.Image:
    w, h = img.size
    src_ratio = w / h
    dst_ratio = tw / th
    # d > 1：原圖比牌面「寬」，需要水平壓縮；d < 1：原圖比較「高」，需要垂直壓縮
    d = src_ratio / dst_ratio
    limit = 1.0 + max(0.0, max_squeeze)

    if 1 / limit <= d <= limit:
        info.squeeze = abs(1 - 1 / d) if d > 1 else abs(1 - d)
        return img.resize((tw, th), Image.LANCZOS)

    if d > limit:
        # 太寬：先壓縮到上限，剩下的寬度才裁掉
        crop_w = max(1, min(w, round(dst_ratio * limit * h)))
        cropped = _center_crop(img, crop_w, h)
        info.crop_ratio = 1 - crop_w / w
    else:
        # 太高：先壓縮到上限，剩下的高度才裁掉
        crop_h = max(1, min(h, round(w * limit / dst_ratio)))
        cropped = _center_crop(img, w, crop_h)
        info.crop_ratio = 1 - crop_h / h
    info.squeeze = 1 - 1 / limit
    return cropped.resize((tw, th), Image.LANCZOS)


def _fit(img: Image.Image, tw: int, th: int, opts: TarotOptions, info: ProcessInfo) -> Image.Image:
    w, h = img.size
    scale = min(tw / w, th / h)
    nw, nh = max(1, round(w * scale)), max(1, round(h * scale))
    fg = img.resize((nw, nh), Image.LANCZOS)

    if opts.fill == FILL_BLUR:
        bg = _crop_fill(img.convert("RGB"), tw, th)
        bg = bg.filter(ImageFilter.GaussianBlur(radius=max(tw, th) / 30))
    else:
        bg = Image.new("RGB", (tw, th), opts.fill_color)

    if img.mode == "RGBA":
        bg = bg.convert("RGBA")
    pos = ((tw - nw) // 2, (th - nh) // 2)
    bg.paste(fg, pos, fg if fg.mode == "RGBA" else None)
    info.padded = (nw, nh) != (tw, th)
    return bg


def _crop_fill(img: Image.Image, tw: int, th: int, info: Optional[ProcessInfo] = None) -> Image.Image:
    w, h = img.size
    scale = max(tw / w, th / h)
    nw, nh = max(tw, round(w * scale)), max(th, round(h * scale))
    resized = img.resize((nw, nh), Image.LANCZOS)
    if info is not None:
        info.crop_ratio = 1 - (tw * th) / (nw * nh)
    return _center_crop(resized, tw, th)


def make_tarot(path_or_image, opts: TarotOptions) -> Tuple[Image.Image, ProcessInfo]:
    img = _load(path_or_image)
    tw, th = opts.pixel_size()
    info = ProcessInfo()

    if opts.auto_rotate and (img.width > img.height) != (tw > th):
        img = img.rotate(90, expand=True)
        info.rotated = True

    if opts.mode == MODE_FIT:
        out = _fit(img, tw, th, opts, info)
    elif opts.mode == MODE_CROP:
        out = _crop_fill(img, tw, th, info)
    else:
        out = _smart(img, tw, th, opts.max_squeeze, info)
    return out, info


def output_path(src: str, out_dir: str, opts: TarotOptions, suffix: str = "_tarot") -> str:
    base = os.path.splitext(os.path.basename(src))[0]
    ext = ".jpg" if opts.out_format.upper() == "JPEG" else ".png"
    candidate = os.path.join(out_dir, f"{base}{suffix}{ext}")
    n = 2
    while os.path.exists(candidate):
        candidate = os.path.join(out_dir, f"{base}{suffix}_{n}{ext}")
        n += 1
    return candidate


def save_tarot(img: Image.Image, dest: str, opts: TarotOptions) -> None:
    dpi = (opts.dpi, opts.dpi)
    if opts.out_format.upper() == "JPEG":
        if img.mode == "RGBA":
            flat = Image.new("RGB", img.size, opts.fill_color)
            flat.paste(img, mask=img.split()[3])
            img = flat
        img.save(dest, "JPEG", quality=opts.jpeg_quality, dpi=dpi, subsampling=0)
    else:
        img.save(dest, "PNG", dpi=dpi)


def process_file(src: str, out_dir: str, opts: TarotOptions) -> Tuple[str, ProcessInfo]:
    os.makedirs(out_dir, exist_ok=True)
    img, info = make_tarot(src, opts)
    dest = output_path(src, out_dir, opts)
    save_tarot(img, dest, opts)
    return dest, info
