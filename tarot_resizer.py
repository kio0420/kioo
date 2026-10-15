"""塔羅牌圖片轉換器 — 單張或批量把圖片轉成塔羅牌尺寸。

執行：python tarot_resizer.py
打包：pyinstaller --onefile --windowed --name TarotResizer tarot_resizer.py
"""

from __future__ import annotations

import os
import queue
import sys
import threading
import tkinter as tk
from tkinter import colorchooser, filedialog, messagebox, ttk

from PIL import Image, ImageTk

import tarot_core as core

try:  # 拖放功能為選配：有安裝 tkinterdnd2 就啟用
    from tkinterdnd2 import DND_FILES, TkinterDnD
    HAS_DND = True
except Exception:  # pragma: no cover - 依環境而定
    HAS_DND = False

CUSTOM_SIZE = "自訂尺寸"
PREVIEW_W, PREVIEW_H = 260, 420


class TarotApp:
    def __init__(self, root: tk.Tk):
        self.root = root
        root.title("塔羅牌圖片轉換器")
        root.geometry("980x640")
        root.minsize(860, 560)

        self.files: list = []
        self.fill_color = (255, 255, 255)
        self.msg_queue: "queue.Queue" = queue.Queue()
        self.worker = None
        self._preview_photo = None
        self._preview_job = None

        self._build_ui()
        self._on_size_change()
        self._on_mode_change()
        root.after(100, self._poll_queue)

    # ------------------------------------------------------------------ UI
    def _build_ui(self):
        main = ttk.Frame(self.root, padding=10)
        main.pack(fill="both", expand=True)
        main.columnconfigure(0, weight=1)
        main.rowconfigure(0, weight=1)

        # 左：檔案清單
        left = ttk.LabelFrame(main, text="圖片清單" + ("（可直接拖放檔案／資料夾）" if HAS_DND else ""), padding=6)
        left.grid(row=0, column=0, sticky="nsew", padx=(0, 8))
        left.rowconfigure(1, weight=1)
        left.columnconfigure(0, weight=1)

        btns = ttk.Frame(left)
        btns.grid(row=0, column=0, sticky="ew", pady=(0, 6))
        ttk.Button(btns, text="加入圖片…", command=self.add_files).pack(side="left")
        ttk.Button(btns, text="加入資料夾…", command=self.add_folder).pack(side="left", padx=4)
        ttk.Button(btns, text="移除選取", command=self.remove_selected).pack(side="left")
        ttk.Button(btns, text="清空", command=self.clear_files).pack(side="left", padx=4)

        cols = ("name", "size", "status")
        self.tree = ttk.Treeview(left, columns=cols, show="headings", selectmode="extended")
        self.tree.heading("name", text="檔名")
        self.tree.heading("size", text="原始尺寸")
        self.tree.heading("status", text="狀態")
        self.tree.column("name", width=230)
        self.tree.column("size", width=90, anchor="center")
        self.tree.column("status", width=200)
        self.tree.grid(row=1, column=0, sticky="nsew")
        sb = ttk.Scrollbar(left, orient="vertical", command=self.tree.yview)
        sb.grid(row=1, column=1, sticky="ns")
        self.tree.configure(yscrollcommand=sb.set)
        self.tree.bind("<<TreeviewSelect>>", lambda e: self.schedule_preview())

        if HAS_DND:
            self.tree.drop_target_register(DND_FILES)
            self.tree.dnd_bind("<<Drop>>", self._on_drop)

        # 中：設定
        mid = ttk.LabelFrame(main, text="設定", padding=8)
        mid.grid(row=0, column=1, sticky="ns", padx=(0, 8))

        r = 0
        ttk.Label(mid, text="牌卡尺寸").grid(row=r, column=0, sticky="w")
        self.size_var = tk.StringVar(value=next(iter(core.SIZE_PRESETS)))
        size_cb = ttk.Combobox(mid, textvariable=self.size_var, state="readonly", width=28,
                               values=list(core.SIZE_PRESETS) + [CUSTOM_SIZE])
        size_cb.grid(row=r, column=1, columnspan=3, sticky="ew", pady=2)
        size_cb.bind("<<ComboboxSelected>>", lambda e: self._on_size_change())

        r += 1
        ttk.Label(mid, text="寬 / 高 (mm)").grid(row=r, column=0, sticky="w")
        self.w_var = tk.DoubleVar(value=70.0)
        self.h_var = tk.DoubleVar(value=120.0)
        self.w_spin = ttk.Spinbox(mid, from_=10, to=500, increment=0.5, textvariable=self.w_var, width=7)
        self.h_spin = ttk.Spinbox(mid, from_=10, to=500, increment=0.5, textvariable=self.h_var, width=7)
        self.w_spin.grid(row=r, column=1, sticky="w", pady=2)
        ttk.Label(mid, text="×").grid(row=r, column=2)
        self.h_spin.grid(row=r, column=3, sticky="w", pady=2)

        r += 1
        ttk.Label(mid, text="解析度 DPI").grid(row=r, column=0, sticky="w")
        self.dpi_var = tk.IntVar(value=300)
        ttk.Combobox(mid, textvariable=self.dpi_var, values=[150, 300, 350, 600], width=7).grid(
            row=r, column=1, sticky="w", pady=2)

        r += 1
        ttk.Label(mid, text="出血 (mm/邊)").grid(row=r, column=0, sticky="w")
        self.bleed_var = tk.DoubleVar(value=0.0)
        ttk.Spinbox(mid, from_=0, to=10, increment=0.5, textvariable=self.bleed_var, width=7).grid(
            row=r, column=1, sticky="w", pady=2)

        r += 1
        self.px_label = ttk.Label(mid, text="", foreground="#555")
        self.px_label.grid(row=r, column=0, columnspan=4, sticky="w", pady=(0, 6))

        r += 1
        ttk.Separator(mid).grid(row=r, column=0, columnspan=4, sticky="ew", pady=4)

        r += 1
        ttk.Label(mid, text="處理方式").grid(row=r, column=0, columnspan=4, sticky="w")
        self.mode_var = tk.StringVar(value=core.MODE_SMART)
        for key in (core.MODE_SMART, core.MODE_FIT, core.MODE_CROP):
            r += 1
            ttk.Radiobutton(mid, text=core.MODE_LABELS[key], value=key, variable=self.mode_var,
                            command=self._on_mode_change).grid(row=r, column=0, columnspan=4, sticky="w")

        r += 1
        self.squeeze_label = ttk.Label(mid, text="最大壓縮變形")
        self.squeeze_label.grid(row=r, column=0, sticky="w", pady=(6, 0))
        self.squeeze_var = tk.IntVar(value=15)
        self.squeeze_scale = ttk.Scale(mid, from_=0, to=40, variable=self.squeeze_var,
                                       command=lambda v: self._on_setting_change())
        self.squeeze_scale.grid(row=r, column=1, columnspan=2, sticky="ew", pady=(6, 0))
        self.squeeze_val = ttk.Label(mid, text="15%", width=5)
        self.squeeze_val.grid(row=r, column=3, sticky="w", pady=(6, 0))

        r += 1
        self.fill_label = ttk.Label(mid, text="補邊方式")
        self.fill_label.grid(row=r, column=0, sticky="w", pady=2)
        self.fill_var = tk.StringVar(value=core.FILL_BLUR)
        self.fill_blur_rb = ttk.Radiobutton(mid, text="模糊背景", value=core.FILL_BLUR,
                                            variable=self.fill_var, command=self._on_setting_change)
        self.fill_color_rb = ttk.Radiobutton(mid, text="純色", value=core.FILL_COLOR,
                                             variable=self.fill_var, command=self._on_setting_change)
        self.fill_blur_rb.grid(row=r, column=1, sticky="w")
        self.fill_color_rb.grid(row=r, column=2, sticky="w")
        self.color_btn = tk.Button(mid, width=3, bg="#ffffff", command=self.pick_color)
        self.color_btn.grid(row=r, column=3, sticky="w")

        r += 1
        self.rotate_var = tk.BooleanVar(value=False)
        ttk.Checkbutton(mid, text="橫向圖片自動旋轉成直向", variable=self.rotate_var,
                        command=self._on_setting_change).grid(row=r, column=0, columnspan=4, sticky="w", pady=(6, 0))

        r += 1
        ttk.Separator(mid).grid(row=r, column=0, columnspan=4, sticky="ew", pady=6)

        r += 1
        ttk.Label(mid, text="輸出格式").grid(row=r, column=0, sticky="w")
        self.fmt_var = tk.StringVar(value="PNG")
        ttk.Radiobutton(mid, text="PNG", value="PNG", variable=self.fmt_var).grid(row=r, column=1, sticky="w")
        ttk.Radiobutton(mid, text="JPG", value="JPEG", variable=self.fmt_var).grid(row=r, column=2, sticky="w")

        r += 1
        ttk.Label(mid, text="輸出資料夾").grid(row=r, column=0, sticky="w", pady=2)
        self.out_var = tk.StringVar(value="")
        ttk.Entry(mid, textvariable=self.out_var, width=20).grid(row=r, column=1, columnspan=2, sticky="ew")
        ttk.Button(mid, text="…", width=3, command=self.pick_out_dir).grid(row=r, column=3, sticky="w")
        r += 1
        ttk.Label(mid, text="（留空＝原圖資料夾下的 tarot_output）", foreground="#777").grid(
            row=r, column=0, columnspan=4, sticky="w")

        for var in (self.w_var, self.h_var, self.dpi_var, self.bleed_var):
            var.trace_add("write", lambda *a: self._on_setting_change())

        # 右：預覽
        right = ttk.LabelFrame(main, text="預覽", padding=6)
        right.grid(row=0, column=2, sticky="ns")
        self.preview = tk.Canvas(right, width=PREVIEW_W, height=PREVIEW_H, bg="#2b2b2b", highlightthickness=0)
        self.preview.pack()
        self.preview_info = ttk.Label(right, text="選取清單中的圖片以預覽", wraplength=PREVIEW_W)
        self.preview_info.pack(pady=(6, 0))

        # 下：執行
        bottom = ttk.Frame(main)
        bottom.grid(row=1, column=0, columnspan=3, sticky="ew", pady=(10, 0))
        bottom.columnconfigure(0, weight=1)
        self.progress = ttk.Progressbar(bottom, mode="determinate")
        self.progress.grid(row=0, column=0, sticky="ew", padx=(0, 8))
        self.status_label = ttk.Label(bottom, text="尚未加入圖片", width=24)
        self.status_label.grid(row=0, column=1, padx=(0, 8))
        self.run_btn = ttk.Button(bottom, text="開始轉換", command=self.start)
        self.run_btn.grid(row=0, column=2)
        ttk.Button(bottom, text="開啟輸出資料夾", command=self.open_out_dir).grid(row=0, column=3, padx=(4, 0))

    # ------------------------------------------------------------- 設定
    def _on_size_change(self):
        name = self.size_var.get()
        custom = name == CUSTOM_SIZE
        state = "normal" if custom else "disabled"
        self.w_spin.configure(state=state)
        self.h_spin.configure(state=state)
        if not custom:
            w, h = core.SIZE_PRESETS[name]
            self.w_var.set(w)
            self.h_var.set(h)
        self._on_setting_change()

    def _on_mode_change(self):
        mode = self.mode_var.get()
        smart = "normal" if mode == core.MODE_SMART else "disabled"
        fit = "normal" if mode == core.MODE_FIT else "disabled"
        self.squeeze_scale.configure(state=smart)
        self.squeeze_label.configure(state=smart)
        self.squeeze_val.configure(state=smart)
        for w in (self.fill_label, self.fill_blur_rb, self.fill_color_rb):
            w.configure(state=fit)
        self.color_btn.configure(state=fit)
        self._on_setting_change()

    def _on_setting_change(self):
        self.squeeze_val.configure(text=f"{int(float(self.squeeze_var.get()))}%")
        try:
            opts = self.get_options()
            w, h = opts.pixel_size()
            self.px_label.configure(text=f"輸出像素：{w} × {h} px")
        except (tk.TclError, ValueError):
            self.px_label.configure(text="輸出像素：—")
            return
        self.schedule_preview()

    def get_options(self) -> core.TarotOptions:
        w, h, dpi = float(self.w_var.get()), float(self.h_var.get()), int(self.dpi_var.get())
        if w <= 0 or h <= 0 or not 30 <= dpi <= 1200:
            raise ValueError("尺寸或 DPI 不正確")
        return core.TarotOptions(
            width_mm=w,
            height_mm=h,
            dpi=dpi,
            mode=self.mode_var.get(),
            max_squeeze=int(float(self.squeeze_var.get())) / 100,
            fill=self.fill_var.get(),
            fill_color=self.fill_color,
            bleed_mm=max(0.0, float(self.bleed_var.get())),
            auto_rotate=self.rotate_var.get(),
            out_format=self.fmt_var.get(),
        )

    def pick_color(self):
        rgb, hexv = colorchooser.askcolor(color="#%02x%02x%02x" % self.fill_color, parent=self.root)
        if rgb:
            self.fill_color = tuple(int(c) for c in rgb)
            self.color_btn.configure(bg=hexv)
            self.fill_var.set(core.FILL_COLOR)
            self._on_setting_change()

    def pick_out_dir(self):
        d = filedialog.askdirectory(parent=self.root)
        if d:
            self.out_var.set(d)

    # ------------------------------------------------------------- 檔案
    def add_files(self):
        exts = " ".join(f"*{e}" for e in sorted(core.SUPPORTED_EXTS))
        paths = filedialog.askopenfilenames(parent=self.root, title="選擇圖片",
                                            filetypes=[("圖片", exts), ("所有檔案", "*.*")])
        self._add_paths(paths)

    def add_folder(self):
        d = filedialog.askdirectory(parent=self.root, title="選擇圖片資料夾")
        if d:
            self._add_paths([d])

    def _on_drop(self, event):
        self._add_paths(self.root.tk.splitlist(event.data))

    def _add_paths(self, paths):
        added = 0
        known = set(self.files)
        for p in core.collect_images(paths):
            p = os.path.abspath(p)
            if p in known:
                continue
            try:
                with Image.open(p) as im:
                    size = f"{im.width}×{im.height}"
            except Exception:
                size = "無法讀取"
            self.files.append(p)
            known.add(p)
            self.tree.insert("", "end", iid=p, values=(os.path.basename(p), size, "等待中"))
            added += 1
        self._update_count()
        if added and not self.tree.selection():
            first = self.tree.get_children()[0]
            self.tree.selection_set(first)

    def remove_selected(self):
        for iid in self.tree.selection():
            self.tree.delete(iid)
            self.files.remove(iid)
        self._update_count()
        self.schedule_preview()

    def clear_files(self):
        self.tree.delete(*self.tree.get_children())
        self.files.clear()
        self._update_count()
        self.schedule_preview()

    def _update_count(self):
        self.status_label.configure(text=f"共 {len(self.files)} 張圖片" if self.files else "尚未加入圖片")

    # ------------------------------------------------------------- 預覽
    def schedule_preview(self):
        if self._preview_job:
            self.root.after_cancel(self._preview_job)
        self._preview_job = self.root.after(200, self.update_preview)

    def update_preview(self):
        self._preview_job = None
        self.preview.delete("all")
        sel = self.tree.selection()
        if not sel:
            self.preview_info.configure(text="選取清單中的圖片以預覽")
            return
        try:
            opts = self.get_options()
            # 預覽用低 DPI 加速
            opts.dpi = 72
            img, info = core.make_tarot(sel[0], opts)
        except Exception as e:
            self.preview_info.configure(text=f"無法預覽：{e}")
            return
        img.thumbnail((PREVIEW_W - 10, PREVIEW_H - 10), Image.LANCZOS)
        self._preview_photo = ImageTk.PhotoImage(img)
        x, y = PREVIEW_W // 2, PREVIEW_H // 2
        self.preview.create_image(x, y, image=self._preview_photo)
        self.preview.create_rectangle(x - img.width // 2, y - img.height // 2,
                                      x + img.width // 2, y + img.height // 2, outline="#888")
        self.preview_info.configure(text=f"{os.path.basename(sel[0])}\n{info.describe()}")

    # ------------------------------------------------------------- 執行
    def _resolve_out_dir(self, src: str) -> str:
        out = self.out_var.get().strip()
        return out if out else os.path.join(os.path.dirname(src), "tarot_output")

    def start(self):
        if self.worker and self.worker.is_alive():
            return
        if not self.files:
            messagebox.showinfo("提示", "請先加入圖片。", parent=self.root)
            return
        try:
            opts = self.get_options()
        except Exception as e:
            messagebox.showerror("設定錯誤", str(e), parent=self.root)
            return
        jobs = [(p, self._resolve_out_dir(p)) for p in self.files]
        for p in self.files:
            self.tree.set(p, "status", "等待中")
        self.progress.configure(maximum=len(jobs), value=0)
        self.run_btn.configure(state="disabled")
        self.worker = threading.Thread(target=self._work, args=(jobs, opts), daemon=True)
        self.worker.start()

    def _work(self, jobs, opts):
        ok = fail = 0
        for src, out_dir in jobs:
            self.msg_queue.put(("status", src, "處理中…"))
            try:
                dest, info = core.process_file(src, out_dir, opts)
                self.msg_queue.put(("status", src, f"完成：{info.describe()}"))
                ok += 1
            except Exception as e:
                self.msg_queue.put(("status", src, f"失敗：{e}"))
                fail += 1
            self.msg_queue.put(("step",))
        self.msg_queue.put(("done", ok, fail))

    def _poll_queue(self):
        try:
            while True:
                msg = self.msg_queue.get_nowait()
                if msg[0] == "status" and self.tree.exists(msg[1]):
                    self.tree.set(msg[1], "status", msg[2])
                elif msg[0] == "step":
                    self.progress.step(1)
                elif msg[0] == "done":
                    _, ok, fail = msg
                    self.run_btn.configure(state="normal")
                    self.status_label.configure(text=f"完成 {ok} 張，失敗 {fail} 張")
                    messagebox.showinfo("完成", f"轉換完成！\n成功：{ok} 張\n失敗：{fail} 張", parent=self.root)
        except queue.Empty:
            pass
        self.root.after(100, self._poll_queue)

    def open_out_dir(self):
        out = self.out_var.get().strip()
        if not out and self.files:
            out = self._resolve_out_dir(self.files[0])
        if not out or not os.path.isdir(out):
            messagebox.showinfo("提示", "輸出資料夾尚不存在，請先轉換。", parent=self.root)
            return
        if sys.platform.startswith("win"):
            os.startfile(out)  # type: ignore[attr-defined]
        elif sys.platform == "darwin":
            os.system(f'open "{out}"')
        else:
            os.system(f'xdg-open "{out}"')


def main():
    root = TkinterDnD.Tk() if HAS_DND else tk.Tk()
    app = TarotApp(root)
    # 支援把圖片直接拖到 exe 圖示上開啟
    if len(sys.argv) > 1:
        app._add_paths(sys.argv[1:])
    root.mainloop()


if __name__ == "__main__":
    main()
