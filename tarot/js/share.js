// 分享結果圖片：以 Canvas 繪製占卜結果並輸出 PNG（不使用任何外部圖片，canvas 不會被污染）
(function () {
  "use strict";

  var FONT = '"Noto Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif';
  var W = 1080, PAD = 60;
  var GOLD = "#d6ba78", GOLD2 = "#f1dca4", TEXT = "#ece6f5", MUTED = "#a69fb8", BG = "#120f1f";
  var ACCENT = { major: "#c49bea", wands: "#e0794f", cups: "#5aa4e0", swords: "#b6bdd1", pentacles: "#8fc76a" };
  var SYMBOL = { wands: "♣", cups: "♥", swords: "♠", pentacles: "♦" };
  var ROMAN = ["0", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI"];

  function font(size, weight) { return (weight || 400) + " " + size + "px " + FONT; }
  function pad2(n) { return (n < 10 ? "0" : "") + n; }

  function findCard(id) {
    var list = window.TAROT_CARDS || [];
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }
  function findSpread(id) {
    var list = window.TAROT_SPREADS || [];
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }
  function cardLabel(card) {
    if (card.arcana === "major") return ROMAN[card.number];
    var courts = { 1: "A", 11: "侍者", 12: "騎士", 13: "皇后", 14: "國王" };
    return courts[card.number] || String(card.number);
  }

  // CJK 友善換行：逐字量測
  function wrap(ctx, text, maxW) {
    var lines = [];
    String(text).split(/\r?\n/).forEach(function (para) {
      var line = "";
      for (var i = 0; i < para.length; i++) {
        var ch = para[i];
        if (line && ctx.measureText(line + ch).width > maxW) {
          lines.push(line);
          line = ch;
        } else {
          line += ch;
        }
      }
      lines.push(line);
    });
    return lines;
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  // 畫一張牌，中心為 (cx, cy)，width w，高 w*1.65；rot 為整張牌的旋轉（弧度）
  function drawCard(ctx, card, reversed, cx, cy, w, rot) {
    var h = Math.round(w * 1.65);
    var key = card ? (card.suit || "major") : "major";
    var accent = ACCENT[key];
    ctx.save();
    ctx.translate(cx, cy);
    if (rot) ctx.rotate(rot);
    ctx.translate(-w / 2, -h / 2);
    // 陰影
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,.55)";
    ctx.shadowBlur = 14; ctx.shadowOffsetY = 4;
    roundRect(ctx, 0, 0, w, h, w * 0.06);
    ctx.fillStyle = "#17132a";
    ctx.fill();
    ctx.restore();
    var g = ctx.createLinearGradient(0, 0, w * 0.4, h);
    g.addColorStop(0, "#2a2342");
    g.addColorStop(1, "#17132a");
    roundRect(ctx, 0, 0, w, h, w * 0.06);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = GOLD;
    ctx.stroke();
    // 內框
    roundRect(ctx, w * 0.04, w * 0.04, w * 0.92, h - w * 0.08, w * 0.045);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = accent;
    ctx.stroke();

    // 內容（逆位則旋轉 180°）
    ctx.translate(w / 2, h / 2);
    if (reversed) ctx.rotate(Math.PI);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if (card) {
      ctx.fillStyle = accent;
      ctx.font = font(Math.round(w * 0.13), 600);
      ctx.fillText(cardLabel(card), 0, -h / 2 + h * 0.1);
      ctx.font = font(Math.round(w * 0.4));
      ctx.fillText(card.arcana === "major" ? "✦" : (SYMBOL[card.suit] || "✦"), 0, -h * 0.08);
      var ns = Math.round(w * 0.16);
      ctx.font = font(ns, 600);
      while (ns > 10 && ctx.measureText(card.name).width > w * 0.86) { ns--; ctx.font = font(ns, 600); }
      ctx.fillStyle = GOLD2;
      ctx.fillText(card.name, 0, h * 0.16);
      var es = Math.round(w * 0.085);
      ctx.font = font(es);
      while (es > 7 && ctx.measureText(card.nameEn).width > w * 0.86) { es--; ctx.font = font(es); }
      ctx.fillStyle = MUTED;
      ctx.fillText(card.nameEn, 0, h * 0.16 + ns * 0.95 + 4);
    }
    ctx.restore();
  }

  function fmtDate(d) {
    return d.getFullYear() + "/" + pad2(d.getMonth() + 1) + "/" + pad2(d.getDate()) + " " + pad2(d.getHours()) + ":" + pad2(d.getMinutes());
  }

  function firstSentence(s) {
    s = String(s || "");
    var i = s.indexOf("。");
    return i >= 0 ? s.slice(0, i + 1) : s;
  }

  function fitText(ctx, text, maxW, size, weight) {
    ctx.font = font(size, weight);
    while (size > 12 && ctx.measureText(text).width > maxW) { size--; ctx.font = font(size, weight); }
  }

  function layoutAndDraw(ctx, canvas, record, draw) {
    // draw=false 只計算高度；draw=true 實際繪製。回傳總高度
    var spread = findSpread(record.spreadId);
    var cards = record.cards || [];
    var positions = spread ? spread.positions : cards.map(function (c, i) { return { name: c.position, col: i + 1, row: 1 }; });
    var cols = spread ? spread.cols : Math.max(cards.length, 1);
    var rows = spread ? spread.rows : 1;
    var y = 0;

    if (draw) {
      var bg = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, canvas.height * 0.8);
      bg.addColorStop(0, "#2a2148");
      bg.addColorStop(0.6, BG);
      bg.addColorStop(1, BG);
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, canvas.height);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, canvas.height);
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 2;
      roundRect(ctx, 18, 18, W - 36, canvas.height - 36, 18);
      ctx.stroke();
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = 1;
      roundRect(ctx, 26, 26, W - 52, canvas.height - 52, 12);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.textBaseline = "alphabetic";

    // 標題
    y = 120;
    if (draw) {
      ctx.textAlign = "center";
      ctx.fillStyle = GOLD2;
      ctx.font = font(52, 700);
      ctx.fillText("✦ 星語塔羅", W / 2, y);
    }
    y += 62;
    if (draw) {
      ctx.fillStyle = GOLD;
      ctx.font = font(34, 600);
      ctx.fillText(record.spreadName || (spread && spread.name) || "塔羅占卜", W / 2, y);
    }
    y += 44;
    var d = new Date(record.time);
    if (isNaN(d.getTime())) d = new Date();
    if (draw) {
      ctx.fillStyle = MUTED;
      ctx.font = font(24);
      ctx.fillText(fmtDate(d), W / 2, y);
    }
    y += 30;

    // 問題
    var q = (record.question || "").trim();
    if (q) {
      ctx.font = font(28);
      var qLines = wrap(ctx, q, W - PAD * 2 - 80);
      var boxH = qLines.length * 42 + 36;
      y += 20;
      if (draw) {
        roundRect(ctx, PAD, y, W - PAD * 2, boxH, 14);
        ctx.fillStyle = "rgba(214,186,120,.08)";
        ctx.fill();
        ctx.strokeStyle = "rgba(214,186,120,.4)";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = TEXT;
        ctx.font = font(28);
        ctx.textAlign = "center";
        qLines.forEach(function (l, i) { ctx.fillText(l, W / 2, y + 18 + 31 + i * 42 - 6); });
      }
      y += boxH;
    }
    y += 40;

    // 牌陣
    var hasCross = positions.some(function (p) { return p.cross; });
    var avail = W - PAD * 2;
    var cw = Math.min(170, Math.floor((avail - (cols - 1) * 24) / cols));
    if (hasCross) cw = Math.min(cw, 130);
    var ch = Math.round(cw * 1.65);
    var pitchX = cw + 24;
    if (hasCross) pitchX = Math.round(ch / 2 + cw / 2 + 16);
    if (cols * cw + (cols - 1) * 24 > avail || (cols - 1) * pitchX + cw > avail) {
      pitchX = Math.floor((avail - cw) / Math.max(cols - 1, 1));
    }
    var labelH = 44, pitchY = ch + labelH + 22;
    var gridW = (cols - 1) * pitchX + cw;
    var gx = Math.round((W - gridW) / 2) + cw / 2;
    var gy = y + ch / 2;

    // 先收集每格的標籤（cross 併入前一格）
    var cellLabel = {};
    positions.forEach(function (p, i) {
      var k = p.col + "," + p.row;
      var t = (i + 1) + ". " + (p.name || "");
      if (p.cross && cellLabel[k] !== undefined) cellLabel[k] += " ／ " + t; else cellLabel[k] = t;
    });

    if (draw) {
      positions.forEach(function (p, i) {
        var c = cards[i];
        if (!c) return;
        var card = findCard(c.cardId);
        var cx = gx + (p.col - 1) * pitchX;
        var cy = gy + (p.row - 1) * pitchY;
        if (p.cross) {
          drawCard(ctx, card, !!c.reversed, cx + 10, cy + 8, cw, Math.PI / 2);
        } else {
          drawCard(ctx, card, !!c.reversed, cx, cy, cw, 0);
        }
      });
      Object.keys(cellLabel).forEach(function (k) {
        var pc = k.split(",");
        var cx = gx + (+pc[0] - 1) * pitchX;
        var cy = gy + (+pc[1] - 1) * pitchY;
        ctx.textAlign = "center";
        ctx.fillStyle = GOLD;
        fitText(ctx, cellLabel[k], Math.max(pitchX - 6, cw + 10), 22, 500);
        ctx.fillText(cellLabel[k], cx, cy + ch / 2 + 32);
      });
    }
    y = gy - ch / 2 + (rows - 1) * pitchY + ch + labelH + 18;

    // 分隔線
    y += 14;
    if (draw) {
      ctx.strokeStyle = "rgba(214,186,120,.45)";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(W - PAD, y); ctx.stroke();
    }
    y += 24;

    // 牌義清單
    var textW = W - PAD * 2;
    cards.forEach(function (c, i) {
      var card = findCard(c.cardId);
      var key = c.reversed ? "reversed" : "upright";
      var head = (i + 1) + ". " + (c.position || (positions[i] && positions[i].name) || "") + "｜" +
        (card ? card.name : c.cardId) + "（" + (c.reversed ? "逆位" : "正位") + "）";
      var kw = card ? (card.keywords[key] || []).join("、") : "";
      var body = card ? firstSentence(card[key]) : "";
      y += 8;
      if (draw) {
        ctx.textAlign = "left";
        ctx.fillStyle = card ? ACCENT[card.suit || "major"] : GOLD;
        ctx.font = font(30, 700);
        ctx.fillText(head, PAD, y + 30);
      }
      y += 44;
      if (kw) {
        ctx.font = font(24, 500);
        wrap(ctx, kw, textW).forEach(function (l) {
          if (draw) { ctx.fillStyle = GOLD2; ctx.font = font(24, 500); ctx.fillText(l, PAD, y + 22); }
          y += 36;
        });
      }
      if (body) {
        ctx.font = font(24);
        wrap(ctx, body, textW).forEach(function (l) {
          if (draw) { ctx.fillStyle = TEXT; ctx.font = font(24); ctx.fillText(l, PAD, y + 22); }
          y += 38;
        });
      }
      y += 14;
      if (i < cards.length - 1 && draw) {
        ctx.strokeStyle = "rgba(214,186,120,.15)";
        ctx.beginPath(); ctx.moveTo(PAD, y - 6); ctx.lineTo(W - PAD, y - 6); ctx.stroke();
      }
    });

    // 頁尾
    y += 34;
    if (draw) {
      ctx.textAlign = "center";
      ctx.fillStyle = MUTED;
      ctx.font = font(22);
      ctx.fillText("塔羅僅供參考與自我探索", W / 2, y);
    }
    y += 64;
    return y;
  }

  function renderReading(record) {
    var fontsReady = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
    return fontsReady.catch(function () {}).then(function () {
      var canvas = document.createElement("canvas");
      canvas.width = W; canvas.height = 400;
      var ctx = canvas.getContext("2d");
      var h = layoutAndDraw(ctx, canvas, record, false);
      canvas.height = h; // 重設尺寸會清空並重置 context 狀態
      ctx = canvas.getContext("2d");
      layoutAndDraw(ctx, canvas, record, true);
      return new Promise(function (resolve, reject) {
        canvas.toBlob(function (blob) {
          if (blob) resolve(blob); else reject(new Error("無法產生圖片"));
        }, "image/png");
      });
    });
  }

  function download(blob, name) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function shareReading(record) {
    return renderReading(record).then(function (blob) {
      var d = new Date(record.time);
      if (isNaN(d.getTime())) d = new Date();
      var name = "xingyu-tarot-" + d.getFullYear() + pad2(d.getMonth() + 1) + pad2(d.getDate()) + "-" + pad2(d.getHours()) + pad2(d.getMinutes()) + ".png";
      var file = new File([blob], name, { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        return navigator.share({ files: [file], title: "我的塔羅占卜", text: record.spreadName || "" })
          .then(function () { return "shared"; })
          .catch(function (err) {
            if (err && err.name === "AbortError") return "cancelled";
            download(blob, name);
            return "downloaded";
          });
      }
      download(blob, name);
      return "downloaded";
    });
  }

  window.TarotShare = { renderReading: renderReading, shareReading: shareReading };
})();
