import os

from PIL import Image

import tarot_core as core

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def _opts(**kw):
    return core.TarotOptions(**kw)


def test_pixel_size_standard():
    assert _opts().pixel_size() == (827, 1417)
    assert _opts(bleed_mm=3).pixel_size() == (898, 1488)


def test_smart_within_limit_only_squeezes():
    # 比例 70:110，與 70:120 差約 9% → 只壓縮不裁切
    img = Image.new("RGB", (700, 1100), "red")
    out, info = core.make_tarot(img, _opts(max_squeeze=0.15))
    assert out.size == (827, 1417)
    assert info.crop_ratio == 0
    assert 0 < info.squeeze <= 0.15


def test_smart_beyond_limit_squeezes_then_crops_less_than_crop_mode():
    img = Image.new("RGB", (1200, 978))  # 橫向圖
    smart, s_info = core.make_tarot(img, _opts(max_squeeze=0.15))
    crop, c_info = core.make_tarot(img, _opts(mode=core.MODE_CROP))
    assert smart.size == crop.size == (827, 1417)
    assert abs(s_info.squeeze - (1 - 1 / 1.15)) < 1e-9
    assert 0 < s_info.crop_ratio < c_info.crop_ratio


def test_smart_tall_image():
    img = Image.new("RGB", (300, 1200))
    out, info = core.make_tarot(img, _opts(max_squeeze=0.2))
    assert out.size == (827, 1417)
    assert info.crop_ratio > 0


def test_fit_keeps_whole_image():
    img = Image.new("RGB", (1000, 500), "blue")
    out, info = core.make_tarot(img, _opts(mode=core.MODE_FIT, fill=core.FILL_COLOR))
    assert out.size == (827, 1417)
    assert info.padded and info.crop_ratio == 0
    assert out.getpixel((0, 0)) == (255, 255, 255)
    assert out.getpixel((413, 708)) == (0, 0, 255)


def test_auto_rotate():
    img = Image.new("RGB", (1200, 700))
    _, info = core.make_tarot(img, _opts(auto_rotate=True))
    assert info.rotated and info.crop_ratio == 0


def test_process_real_files(tmp_path):
    for name, fmt in (("test.png", "PNG"), ("OIP.jpg", "JPEG")):
        src = os.path.join(HERE, name)
        dest, _ = core.process_file(src, str(tmp_path), _opts(out_format=fmt))
        with Image.open(dest) as im:
            assert im.size == (827, 1417)
            assert round(im.info["dpi"][0]) == 300
    # 同名不覆蓋
    dest2, _ = core.process_file(os.path.join(HERE, "test.png"), str(tmp_path), _opts())
    assert dest2.endswith("test_tarot_2.png")


def test_collect_images(tmp_path):
    Image.new("RGB", (10, 10)).save(tmp_path / "a.png")
    (tmp_path / "note.txt").write_text("x")
    assert core.collect_images([str(tmp_path)]) == [str(tmp_path / "a.png")]
