"""Inline data/*.json into template.html -> index.html (standalone) and dist/artifact.html (fragment)."""
import json, pathlib
root = pathlib.Path(__file__).parent
chapters = [json.loads((root / f"data/ch{i}.json").read_text("utf-8")) for i in range(2, 7)]
traps = json.loads((root / "data/traps.json").read_text("utf-8"))
data = json.dumps({"chapters": chapters, "traps": traps}, ensure_ascii=False).replace("</", "<\\/")
frag = (root / "template.html").read_text("utf-8").replace("__DATA__", data)
(root / "dist").mkdir(exist_ok=True)
(root / "dist/artifact.html").write_text(frag, "utf-8")
page = ('<!doctype html>\n<html lang="zh-Hant">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
        '<style>:root{padding-block:env(safe-area-inset-top,0px) env(safe-area-inset-bottom,0px)}body{margin:0}[hidden]{display:none!important}</style>\n'
        '</head>\n<body>\n' + frag + '\n</body>\n</html>\n')
(root / "index.html").write_text(page, "utf-8")
print("built", len(page), "bytes")
