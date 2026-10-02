(function () {
  "use strict";

  const CARDS = window.TAROT_CARDS;
  const SPREADS = window.TAROT_SPREADS;
  const MAYBE = new Set(window.TAROT_MAYBE_IDS);

  const SUITS = {
    wands: { name: "權杖", symbol: "♣" },
    cups: { name: "聖杯", symbol: "♥" },
    swords: { name: "寶劍", symbol: "♠" },
    pentacles: { name: "錢幣", symbol: "♦" }
  };
  const ROMAN = ["0", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X",
    "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI"];
  const TOPIC_LABEL = { love: "感情", career: "事業" };

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  // ---------- 隨機 ----------
  function randomInt(max) {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return buf[0] % max;
  }

  function shuffle(arr, rand = randomInt) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = rand(i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // 每日一牌：「YYYY-MM-DD + 站台鹽值」雜湊成種子，再用 mulberry32 產生穩定的亂數
  const DAILY_SALT = "xingyu-tarot-v1";

  function hashSeed(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 16777619);
    }
    return h >>> 0;
  }

  function mulberry32(seed) {
    let t = seed >>> 0;
    return function (max) {
      t = (t + 0x6d2b79f5) >>> 0;
      let r = Math.imul(t ^ (t >>> 15), t | 1);
      r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
      return Math.floor((((r ^ (r >>> 14)) >>> 0) / 4294967296) * max);
    };
  }

  function todayKey(d = new Date()) {
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  function dailyDraw(dateKey) {
    const rand = mulberry32(hashSeed(dateKey + DAILY_SALT));
    return { cardId: CARDS[rand(CARDS.length)].id, reversed: rand(2) === 1 };
  }

  // ---------- 牌面 ----------
  function cardLabel(card) {
    if (card.arcana === "major") return ROMAN[card.number];
    const courts = { 1: "A", 11: "侍者", 12: "騎士", 13: "皇后", 14: "國王" };
    return courts[card.number] || String(card.number);
  }

  function cardSymbol(card) {
    return card.arcana === "major" ? "✦" : SUITS[card.suit].symbol;
  }

  function cardHtml(card, { reversed = false, faceUp = false, small = false } = {}) {
    const suitClass = card ? "suit-" + (card.suit || "major") : "";
    const front = card ? `
      <div class="face front ${suitClass}">
        <div class="face-content">
          <span class="corner">${cardLabel(card)}</span>
          <span class="symbol">${cardSymbol(card)}</span>
          <span class="cname">${card.name}</span>
          <span class="ename">${card.nameEn}</span>
        </div>
      </div>` : "";
    return `
      <div class="tcard ${faceUp ? "flipped" : ""} ${reversed ? "reversed" : ""} ${small ? "small" : ""}">
        <div class="inner">
          <div class="face back"><span>✦</span></div>
          ${front}
        </div>
      </div>`;
  }

  function orientationText(reversed) {
    return reversed ? "逆位" : "正位";
  }

  function keywordChips(list) {
    return `<div class="keywords">${list.map((k) => `<span>${k}</span>`).join("")}</div>`;
  }

  // ---------- 分頁 ----------
  function showView(name) {
    $$(".tab").forEach((t) => t.classList.toggle("active", t.dataset.view === name));
    $$(".view").forEach((v) => v.classList.toggle("active", v.id === "view-" + name));
    document.dispatchEvent(new CustomEvent("tarot:view", { detail: name }));
  }

  function initTabs() {
    $$(".tab").forEach((tab) => {
      tab.addEventListener("click", () => showView(tab.dataset.view));
    });
  }

  // 牌義詳細頁網址：#card/<id>，可直接分享或加入書籤
  function routeFromHash() {
    const m = location.hash.match(/^#card\/([\w-]+)$/);
    if (m && getCard(m[1])) openCard(m[1]);
  }

  // ---------- 占卜 ----------
  let currentSpread = SPREADS[0];
  let currentDraw = [];
  let currentMeta = {};

  function initReading() {
    const list = $("#spread-list");
    list.innerHTML = SPREADS.map((s) => `
      <button class="spread-btn" data-id="${s.id}">
        <strong>${s.name}</strong><small>${s.positions.length} 張</small>
      </button>`).join("");
    list.addEventListener("click", (e) => {
      const btn = e.target.closest(".spread-btn");
      if (btn) selectSpread(btn.dataset.id);
    });
    selectSpread(currentSpread.id);

    $("#btn-draw").addEventListener("click", draw);
    $("#btn-reveal").addEventListener("click", () => {
      $$("#board .slot").forEach((slot, i) => flipSlot(slot, i));
    });
  }

  function selectSpread(id) {
    currentSpread = SPREADS.find((s) => s.id === id);
    $$(".spread-btn").forEach((b) => b.classList.toggle("active", b.dataset.id === id));
    $("#spread-desc").textContent = currentSpread.desc;
    renderBoard(false);
    $("#result").innerHTML = "";
    $("#btn-reveal").hidden = true;
    $("#board-hint").hidden = true;
  }

  function renderBoard(withCards) {
    const s = currentSpread;
    const board = $("#board");
    board.className = "board spread-" + s.id;
    board.style.setProperty("--cols", s.cols);
    board.style.setProperty("--rows", s.rows);
    board.innerHTML = s.positions.map((p, i) => {
      const draw = withCards ? currentDraw[i] : null;
      return `
        <div class="slot ${p.cross ? "cross" : ""} ${withCards ? "dealt" : "empty"}"
             style="grid-column:${p.col};grid-row:${p.row};animation-delay:${i * 90}ms"
             data-index="${i}">
          ${withCards ? cardHtml(draw.card, { reversed: draw.reversed }) : `<div class="placeholder">${i + 1}</div>`}
          <span class="pos-label">${i + 1}. ${p.name}${s.positions[i + 1] && s.positions[i + 1].cross ? ` ／ ${i + 2}. ${s.positions[i + 1].name}` : ""}</span>
        </div>`;
    }).join("");

    if (withCards) {
      $$(".slot", board).forEach((slot, i) => {
        slot.addEventListener("click", () => flipSlot(slot, i));
      });
    }
  }

  function draw() {
    const allowReversed = $("#allow-reversed").checked;
    const deck = shuffle(CARDS);
    currentDraw = currentSpread.positions.map((_, i) => ({
      card: deck[i],
      reversed: allowReversed && randomInt(2) === 1,
      revealed: false
    }));
    currentMeta = { question: $("#question").value.trim(), topic: $("#topic").value, recordId: null };
    renderBoard(true);
    renderResultSkeleton();
    $("#btn-reveal").hidden = false;
    $("#board-hint").hidden = false;
    $("#btn-draw").textContent = "重新抽牌";
  }

  function flipSlot(slot, i) {
    const d = currentDraw[i];
    if (!d || d.revealed) return;
    d.revealed = true;
    $(".tcard", slot).classList.add("flipped");
    const entry = $(`#result [data-index="${i}"]`);
    entry.innerHTML = interpretationHtml(i);
    entry.classList.add("shown");
    if (currentDraw.every((x) => x.revealed)) {
      $("#btn-reveal").hidden = true;
      $("#board-hint").hidden = true;
      const record = buildRecord();
      const saved = window.TarotJournal ? window.TarotJournal.add(record) : false;
      currentMeta.recordId = record.id;
      $("#result-summary").innerHTML = summaryHtml() + `
        <div class="result-actions">
          ${window.TarotShare ? `<button class="btn primary" data-share-record="${record.id}">分享結果圖片</button>` : ""}
          <button class="btn" data-goto-record="${record.id}">在紀錄中寫筆記</button>
          <span class="muted">${saved ? "已自動存入「我的紀錄」" : "無法儲存紀錄"}</span>
        </div>`;
    }
  }

  function buildRecord() {
    return {
      id: "r" + Date.now().toString(36) + randomInt(1e6).toString(36),
      time: new Date().toISOString(),
      spreadId: currentSpread.id,
      spreadName: currentSpread.name,
      question: currentMeta.question,
      topic: currentMeta.topic,
      cards: currentDraw.map((d, i) => ({
        position: currentSpread.positions[i].name,
        cardId: d.card.id,
        reversed: d.reversed
      })),
      note: ""
    };
  }

  function renderResultSkeleton() {
    const q = currentMeta.question;
    $("#result").innerHTML = `
      <div class="panel">
        <h2>解讀</h2>
        ${q ? `<p class="question">問題：「${escapeHtml(q)}」</p>` : ""}
        <div class="entries">
          ${currentSpread.positions.map((p, i) => `
            <article class="entry" data-index="${i}">
              <h3>${i + 1}. ${p.name}</h3>
              <p class="muted">${p.meaning}——尚未翻牌</p>
            </article>`).join("")}
        </div>
        <div id="result-summary"></div>
      </div>`;
  }

  function interpretationHtml(i) {
    const p = currentSpread.positions[i];
    const { card, reversed } = currentDraw[i];
    const key = reversed ? "reversed" : "upright";
    const topic = currentMeta.topic;
    let extra = "";
    if (TOPIC_LABEL[topic]) {
      extra = `<p class="topic"><b>${TOPIC_LABEL[topic]}：</b>${card[topic][key]}</p>`;
    }
    let verdict = "";
    if (currentSpread.yesNo) {
      const v = MAYBE.has(card.id) ? ["maybe", "時機未明"] : reversed ? ["no", "否"] : ["yes", "是"];
      verdict = `<p class="verdict ${v[0]}">答案傾向：${v[1]}</p>`;
    }
    return `
      <h3>${i + 1}. ${p.name} <small class="muted">${p.meaning}</small></h3>
      <div class="entry-body">
        ${cardHtml(card, { reversed, faceUp: true, small: true })}
        <div>
          <p class="card-title">${card.name}　<span class="orient ${key}">${orientationText(reversed)}</span></p>
          ${verdict}
          ${keywordChips(card.keywords[key])}
          <p>${card[key]}</p>
          ${extra}
          <button class="link" data-card="${card.id}">查看完整牌義 →</button>
        </div>
      </div>`;
  }

  function summaryHtml() {
    if (currentDraw.length < 3) return "";
    const n = currentDraw.length;
    const majors = currentDraw.filter((d) => d.card.arcana === "major").length;
    const reversed = currentDraw.filter((d) => d.reversed).length;
    const suitCount = {};
    currentDraw.forEach((d) => { if (d.card.suit) suitCount[d.card.suit] = (suitCount[d.card.suit] || 0) + 1; });
    const notes = [];
    if (majors / n >= 0.5) notes.push("大阿爾克那佔了一半以上，這件事牽涉人生的重要課題或轉折。");
    else if (majors === 0) notes.push("沒有出現大阿爾克那，事情多半屬於日常層面，掌握在你自己手中。");
    if (reversed / n >= 0.5) notes.push("逆位牌較多，代表目前能量受阻，或需要向內調整。");
    const suitHints = {
      wands: "權杖較多：行動力與熱情是關鍵。",
      cups: "聖杯較多：情感與人際關係是重點。",
      swords: "寶劍較多：需要理性思考，也留意壓力與衝突。",
      pentacles: "錢幣較多：與金錢、工作或身體等現實層面有關。"
    };
    Object.entries(suitCount).forEach(([s, c]) => { if (c >= 2 && c / n >= 0.3) notes.push(suitHints[s]); });
    if (!notes.length) notes.push("各種能量分布平均，可以綜合每個位置的訊息來看整體方向。");
    return `
      <div class="summary">
        <h3>整體能量</h3>
        <p class="muted">大阿爾克那 ${majors} 張・逆位 ${reversed} 張・${Object.entries(SUITS).map(([k, v]) => `${v.name} ${suitCount[k] || 0}`).join("・")}</p>
        <ul>${notes.map((t) => `<li>${t}</li>`).join("")}</ul>
      </div>`;
  }

  // ---------- 每日一牌 ----------
  function initDaily() {
    const key = todayKey();
    const log = window.TarotStore.get("daily", {});
    const today = log[key] || dailyDraw(key);
    const card = getCard(today.cardId);
    const k = today.reversed ? "reversed" : "upright";
    const [y, m, d] = key.split("-").map(Number);
    $("#daily-date").textContent = `${y} 年 ${m} 月 ${d} 日`;
    const box = $("#daily-card");
    box.innerHTML = cardHtml(card, { reversed: today.reversed });

    function reveal(save) {
      $(".tcard", box).classList.add("flipped");
      box.removeAttribute("role");
      box.tabIndex = -1;
      $("#daily-text").innerHTML = `
        <p class="card-title">${card.name}　<span class="orient ${k}">${orientationText(today.reversed)}</span></p>
        ${keywordChips(card.keywords[k])}
        <p>${card[k]}</p>
        <button class="link" data-card="${card.id}">查看完整牌義 →</button>`;
      if (save) {
        // 寫入每日紀錄，供「我的紀錄」共用
        const latest = window.TarotStore.get("daily", {});
        latest[key] = { cardId: card.id, reversed: today.reversed, revealedAt: new Date().toISOString() };
        window.TarotStore.set("daily", latest);
        document.dispatchEvent(new CustomEvent("tarot:daily", { detail: key }));
      }
    }

    if (log[key] && log[key].revealedAt) {
      reveal(false);
      return;
    }
    const onReveal = (e) => {
      if (e.type === "keydown" && e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      box.removeEventListener("click", onReveal);
      box.removeEventListener("keydown", onReveal);
      reveal(true);
    };
    box.addEventListener("click", onReveal);
    box.addEventListener("keydown", onReveal);
  }

  // ---------- 圖鑑 ----------
  let suitFilter = "all";

  function initLibrary() {
    $("#suit-filter").addEventListener("click", (e) => {
      const chip = e.target.closest(".chip");
      if (!chip) return;
      suitFilter = chip.dataset.suit;
      $$(".chip").forEach((c) => c.classList.toggle("active", c === chip));
      renderLibrary();
    });
    $("#search").addEventListener("input", renderLibrary);
    $("#library-grid").addEventListener("click", (e) => {
      const item = e.target.closest("[data-card]");
      if (item) openCard(item.dataset.card);
    });
    renderLibrary();
  }

  function renderLibrary() {
    const q = $("#search").value.trim().toLowerCase();
    const list = CARDS.filter((c) => {
      if (suitFilter === "major" && c.arcana !== "major") return false;
      if (suitFilter !== "all" && suitFilter !== "major" && c.suit !== suitFilter) return false;
      if (!q) return true;
      const hay = [c.name, c.nameEn, ...c.keywords.upright, ...c.keywords.reversed].join(" ").toLowerCase();
      return hay.includes(q);
    });
    $("#library-grid").innerHTML = list.length
      ? list.map((c) => `
        <button class="lib-item" data-card="${c.id}">
          ${cardHtml(c, { faceUp: true, small: true })}
        </button>`).join("")
      : `<p class="muted">找不到符合的牌。</p>`;
  }

  function getCard(id) {
    return CARDS.find((x) => x.id === id);
  }

  function openCard(id) {
    const c = getCard(id);
    if (!c) return;
    if (location.hash !== "#card/" + id) history.replaceState(null, "", "#card/" + id);
    const meta = c.arcana === "major" ? `大阿爾克那 ${ROMAN[c.number]}` : `小阿爾克那・${SUITS[c.suit].name}`;
    const side = (key) => `
      <section class="side ${key}">
        <h3><span class="orient ${key}">${key === "upright" ? "正位" : "逆位"}</span></h3>
        ${keywordChips(c.keywords[key])}
        <p>${c[key]}</p>
        <p class="topic"><b>感情：</b>${c.love[key]}</p>
        <p class="topic"><b>事業：</b>${c.career[key]}</p>
      </section>`;
    $("#dialog-body").innerHTML = `
      <div class="dialog-head">
        ${cardHtml(c, { faceUp: true })}
        <div>
          <h2>${c.name}</h2>
          <p class="muted">${c.nameEn}・${meta}・元素：${c.element}</p>
          <p class="image-desc">${c.image}</p>
        </div>
      </div>
      <div class="sides">${side("upright")}${side("reversed")}</div>`;
    const dlg = $("#card-dialog");
    if (!dlg.open) dlg.showModal();
    dlg.scrollTop = 0;
  }

  function initDialog() {
    const dlg = $("#card-dialog");
    $(".close", dlg).addEventListener("click", () => dlg.close());
    dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener("close", () => {
      if (location.hash.startsWith("#card/")) history.replaceState(null, "", location.pathname + location.search);
    });
    window.addEventListener("hashchange", routeFromHash);
    // 解讀區與每日一牌中的「查看完整牌義」
    document.addEventListener("click", (e) => {
      const link = e.target.closest("button.link[data-card]");
      if (link) openCard(link.dataset.card);
      const share = e.target.closest("[data-share-record]");
      if (share && window.TarotShare && window.TarotJournal) {
        const rec = window.TarotJournal.get(share.dataset.shareRecord);
        if (rec) {
          share.disabled = true;
          window.TarotShare.shareReading(rec).finally(() => { share.disabled = false; });
        }
      }
      const goto = e.target.closest("[data-goto-record]");
      if (goto && window.TarotJournal) {
        showView("journal");
        window.TarotJournal.show(goto.dataset.gotoRecord);
      }
    });
  }

  // ---------- 主題 ----------
  const THEMES = { system: "◐ 跟隨系統", light: "☀ 淺色", dark: "☾ 深色" };

  function applyTheme(t) {
    if (t === "light" || t === "dark") document.documentElement.setAttribute("data-theme", t);
    else document.documentElement.removeAttribute("data-theme");
    const btn = $("#theme-toggle");
    btn.textContent = THEMES[t];
    btn.title = "主題：" + THEMES[t].slice(2) + "（點擊切換）";
  }

  function initTheme() {
    let t = window.TarotStore.get("theme", "system");
    if (!THEMES[t]) t = "system";
    applyTheme(t);
    $("#theme-toggle").addEventListener("click", () => {
      const order = Object.keys(THEMES);
      t = order[(order.indexOf(t) + 1) % order.length];
      if (t === "system") window.TarotStore.remove("theme");
      else window.TarotStore.set("theme", t);
      applyTheme(t);
    });
  }

  window.TarotUI = { cardHtml, openCard, getCard, escapeHtml, keywordChips, orientationText, showView, SUITS, ROMAN };

  initTheme();
  initTabs();
  initReading();
  initDaily();
  initLibrary();
  initDialog();
  routeFromHash();
})();
