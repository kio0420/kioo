(function () {
  "use strict";
  var root = document.getElementById("quiz-root");
  if (!root) return;
  var CARDS = window.TAROT_CARDS || [];
  var Store = window.TarotStore;
  var UI = function () { return window.TarotUI || {}; };

  var MODES = [["pick", "看牌選關鍵字"], ["guess", "看關鍵字猜牌"], ["mixed", "混合"], ["flash", "閃卡"]];
  var POOLS = [["all", "全部"], ["major", "大阿爾克那"], ["minor", "小阿爾克那"]];

  // ---------- 資料 ----------
  function load() {
    var d = Store ? Store.get("quiz", null) : null;
    if (!d || typeof d !== "object" || !d.cards) d = {};
    d.version = 1;
    d.cards = d.cards || {};
    d.totals = d.totals || { answered: 0, correct: 0 };
    d.settings = d.settings || { mode: "pick", pool: "all", reversed: true };
    return d;
  }
  var data = load();
  function save() { if (Store) Store.set("quiz", data); }

  var session = { answered: 0, correct: 0, streak: 0, best: 0 };
  var current = null;   // 目前題目
  var lastId = null;
  var flashRevealed = false;

  // ---------- 工具 ----------
  function esc(s) {
    var f = UI().escapeHtml;
    if (f) return f(s);
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function rnd() {
    try {
      var a = new Uint32Array(1);
      crypto.getRandomValues(a);
      return a[0] / 4294967296;
    } catch (e) { return Math.random(); }
  }
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function byId(id) { return CARDS.filter(function (c) { return c.id === id; })[0]; }
  function pool() {
    var p = data.settings.pool;
    var list = CARDS.filter(function (c) { return p === "all" || c.arcana === p; });
    return list.length ? list : CARDS;
  }
  function weightOf(id) {
    var r = data.cards[id];
    return r ? (r.weight || 1) : 3;
  }
  function pickCard() {
    var list = pool().filter(function (c) { return c.id !== lastId; });
    if (!list.length) list = pool();
    var total = 0, i;
    for (i = 0; i < list.length; i++) total += weightOf(list[i].id);
    var r = rnd() * total;
    for (i = 0; i < list.length; i++) {
      r -= weightOf(list[i].id);
      if (r <= 0) return list[i];
    }
    return list[list.length - 1];
  }
  function kwText(card, rev) {
    return (card.keywords[rev ? "reversed" : "upright"] || []).join("、");
  }
  function shortMeaning(card, rev) {
    var t = (rev ? card.reversed : card.upright) || "";
    var m = t.match(/^[^。！？]*[。！？]?/);
    return m ? m[0] : t;
  }
  function record(id, ok) {
    var r = data.cards[id] || { seen: 0, correct: 0, wrong: 0, weight: 1 };
    r.seen++;
    if (ok) { r.correct++; r.weight = Math.max(1, (r.weight || 1) / 2); }
    else { r.wrong++; r.weight = Math.min((r.weight || 1) * 2 + 1, 16); }
    data.cards[id] = r;
    data.totals.answered++;
    if (ok) data.totals.correct++;
    session.answered++;
    if (ok) { session.correct++; session.streak++; if (session.streak > session.best) session.best = session.streak; }
    else session.streak = 0;
    save();
  }

  // ---------- 出題 ----------
  function newQuestion() {
    var s = data.settings;
    var card = pickCard();
    lastId = card.id;
    var rev = s.reversed && rnd() < 0.5;
    if (s.mode === "flash") {
      current = { type: "flash", card: card, reversed: rev };
      flashRevealed = false;
      return;
    }
    var type = s.mode === "mixed" ? (rnd() < 0.5 ? "pick" : "guess") : s.mode;
    var others = shuffle(CARDS.filter(function (c) { return c.id !== card.id; }));
    var opts = [], seen = {};
    var correctText = type === "pick" ? kwText(card, rev) : card.name;
    seen[correctText] = true;
    opts.push({ text: correctText, correct: true });
    for (var i = 0; i < others.length && opts.length < 4; i++) {
      var t = type === "pick" ? kwText(others[i], rev) : others[i].name;
      if (!t || seen[t]) continue;
      seen[t] = true;
      opts.push({ text: t, correct: false });
    }
    current = { type: type, card: card, reversed: rev, options: shuffle(opts), answered: null };
  }

  // ---------- 渲染 ----------
  function chips(list, active, attr) {
    return '<div class="chips">' + list.map(function (x) {
      return '<button type="button" class="chip' + (x[0] === active ? " active" : "") + '" data-' + attr + '="' + x[0] + '">' + x[1] + "</button>";
    }).join("") + "</div>";
  }
  function orientTag(rev) {
    return '<span class="orient ' + (rev ? "reversed" : "upright") + '">' + (rev ? "逆位" : "正位") + "</span>";
  }
  function cardVisual(card, rev) {
    var f = UI().cardHtml;
    return f ? f(card, { reversed: rev, faceUp: true, small: false }) : '<div class="quiz-fallback">' + esc(card.name) + "</div>";
  }

  function settingsHtml() {
    var s = data.settings;
    return '<div class="panel quiz-settings">' +
      '<h2>學習測驗</h2>' +
      '<div class="quiz-row"><span class="muted">模式</span>' + chips(MODES, s.mode, "mode") + "</div>" +
      '<div class="quiz-row"><span class="muted">範圍</span>' + chips(POOLS, s.pool, "pool") + "</div>" +
      '<label class="check quiz-row"><input type="checkbox" id="quiz-rev"' + (s.reversed ? " checked" : "") + "> 包含逆位</label>" +
      "</div>";
  }

  function questionHtml() {
    var q = current, c = q.card, h;
    if (q.type === "flash") return flashHtml();
    h = '<div class="panel quiz-question">';
    if (q.type === "pick") {
      h += '<div class="quiz-prompt"><div class="quiz-visual">' + cardVisual(c, q.reversed) + "</div>" +
        '<div><p class="muted">這張牌的' + (q.reversed ? "逆位" : "正位") + "關鍵字是？</p>" +
        '<div class="card-title">' + esc(c.name) + " " + orientTag(q.reversed) + "</div>" +
        '<div class="muted">' + esc(c.nameEn || "") + "</div></div></div>";
    } else {
      h += '<div class="quiz-prompt"><div><p class="muted">這組關鍵字屬於哪張牌？ ' + orientTag(q.reversed) + "</p>" +
        '<div class="keywords quiz-big-kw">' + (c.keywords[q.reversed ? "reversed" : "upright"] || []).map(function (k) {
          return "<span>" + esc(k) + "</span>";
        }).join("") + "</div></div></div>";
    }
    h += '<div class="quiz-options" role="group">' + q.options.map(function (o, i) {
      var cls = "quiz-option";
      if (q.answered !== null) {
        if (o.correct) cls += " correct";
        else if (q.answered === i) cls += " wrong";
      }
      return '<button type="button" class="' + cls + '" data-opt="' + i + '"' + (q.answered !== null ? " disabled" : "") + ">" +
        '<span class="quiz-key">' + (i + 1) + "</span><span>" + esc(o.text) + "</span></button>";
    }).join("") + "</div>";
    if (q.answered !== null) {
      var ok = q.options[q.answered].correct;
      h += '<div class="quiz-feedback ' + (ok ? "ok" : "bad") + '" role="status">' +
        "<strong>" + (ok ? "答對了！" : "答錯了") + "</strong> 正確答案：" + esc(c.name) + "（" + (q.reversed ? "逆位" : "正位") + "）" +
        "<p>" + esc(shortMeaning(c, q.reversed)) + "</p>" +
        '<div class="actions"><button type="button" class="btn" data-act="detail">查看完整牌義</button>' +
        '<button type="button" class="btn primary" data-act="next">下一題 ↵</button></div></div>';
    }
    return h + "</div>";
  }

  function flashHtml() {
    var q = current, c = q.card, h = '<div class="panel quiz-question quiz-flash">';
    h += '<div class="quiz-visual">' + cardVisual(c, q.reversed) + "</div>";
    h += '<div class="card-title">' + esc(c.name) + " " + orientTag(q.reversed) + "</div>";
    if (!flashRevealed) {
      h += '<p class="muted">先回想這張牌的關鍵字與意義，再翻面確認。</p>' +
        '<button type="button" class="btn primary" data-act="reveal">顯示答案</button>';
    } else {
      h += '<div class="keywords">' + (c.keywords[q.reversed ? "reversed" : "upright"] || []).map(function (k) {
        return "<span>" + esc(k) + "</span>";
      }).join("") + "</div><p>" + esc(shortMeaning(c, q.reversed)) + "</p>" +
        '<div class="actions quiz-center"><button type="button" class="btn primary" data-act="know">記得</button>' +
        '<button type="button" class="btn" data-act="unsure">不熟</button>' +
        '<button type="button" class="btn" data-act="detail">查看完整牌義</button></div>';
    }
    return h + "</div>";
  }

  function pct(a, b) { return b ? Math.round(a / b * 100) + "%" : "—"; }

  function statsHtml() {
    var t = data.totals;
    var mastered = CARDS.filter(function (c) { return data.cards[c.id] && data.cards[c.id].correct > 0; }).length;
    var total = CARDS.length || 78;
    var weak = CARDS.filter(function (c) { return data.cards[c.id] && data.cards[c.id].seen > 0; })
      .sort(function (a, b) { return data.cards[b.id].weight - data.cards[a.id].weight; })
      .slice(0, 5);
    var h = '<div class="panel quiz-stats"><h3>學習統計</h3><div class="quiz-stat-grid">' +
      '<div><b>' + pct(t.correct, t.answered) + '</b><span class="muted">總正確率（' + t.correct + "/" + t.answered + "）</span></div>" +
      '<div><b>' + pct(session.correct, session.answered) + '</b><span class="muted">本次正確率（' + session.correct + "/" + session.answered + "）</span></div>" +
      '<div><b>' + session.streak + '</b><span class="muted">連續答對（最高 ' + session.best + "）</span></div></div>" +
      '<div class="quiz-progress-label"><span>學習進度</span><span>' + mastered + " / " + total + "</span></div>" +
      '<div class="quiz-progress" role="progressbar" aria-valuemin="0" aria-valuemax="' + total + '" aria-valuenow="' + mastered + '"><i style="width:' + (mastered / total * 100) + '%"></i></div>' +
      "<h3>最需要加強</h3>";
    if (!weak.length) h += '<p class="muted">還沒有紀錄，開始作答吧！</p>';
    else h += '<ol class="quiz-weak">' + weak.map(function (c) {
      var r = data.cards[c.id];
      return '<li><button type="button" class="link" data-card="' + c.id + '">' + esc(c.name) + "</button>" +
        '<span class="muted">答對 ' + r.correct + "／答錯 " + r.wrong + "（權重 " + (Math.round(r.weight * 10) / 10) + "）</span></li>";
    }).join("") + "</ol>";
    h += '<button type="button" class="btn quiz-reset" data-act="reset">重設學習紀錄</button></div>';
    return h;
  }

  function render() {
    if (!current) newQuestion();
    root.innerHTML = '<div class="quiz">' + settingsHtml() + questionHtml() + statsHtml() + "</div>";
  }

  // ---------- 事件 ----------
  function answer(i) {
    var q = current;
    if (!q || q.type === "flash" || q.answered !== null || !q.options[i]) return;
    q.answered = i;
    record(q.card.id, q.options[i].correct);
    render();
  }
  function next() { newQuestion(); render(); }
  function detail() { var o = UI().openCard; if (o && current) o(current.card.id); }

  root.addEventListener("click", function (e) {
    var t = e.target.closest("button");
    if (!t || !root.contains(t)) return;
    var s = data.settings;
    if (t.dataset.mode) { s.mode = t.dataset.mode; save(); current = null; render(); return; }
    if (t.dataset.pool) { s.pool = t.dataset.pool; save(); current = null; render(); return; }
    if (t.dataset.opt !== undefined) { answer(+t.dataset.opt); return; }
    if (t.dataset.card) { var o = UI().openCard; if (o) o(t.dataset.card); return; }
    switch (t.dataset.act) {
      case "next": next(); break;
      case "detail": detail(); break;
      case "reveal": flashRevealed = true; render(); break;
      case "know": case "unsure":
        record(current.card.id, t.dataset.act === "know"); next(); break;
      case "reset":
        if (confirm("確定要清除所有學習紀錄嗎？此動作無法復原。")) {
          data.cards = {}; data.totals = { answered: 0, correct: 0 };
          session = { answered: 0, correct: 0, streak: 0, best: 0 };
          lastId = null; save(); current = null; render();
        }
        break;
    }
  });
  root.addEventListener("change", function (e) {
    if (e.target.id === "quiz-rev") { data.settings.reversed = e.target.checked; save(); current = null; render(); }
  });
  document.addEventListener("keydown", function (e) {
    var view = document.getElementById("view-quiz");
    if (!view || !view.classList.contains("active")) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var d = document.getElementById("card-dialog");
    if (d && d.open) return;
    var tag = (e.target.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea" || tag === "select") return;
    if (!current) return;
    if (e.key >= "1" && e.key <= "4") { answer(+e.key - 1); }
    else if (e.key === "Enter") {
      if (current.type === "flash") return;
      if (current.answered !== null) { e.preventDefault(); next(); }
    }
  });

  render();
})();
