// 占卜紀錄／塔羅日記：占卜結果存在 localStorage 的 tarot.readings，每日一牌存在 tarot.daily
(function () {
  "use strict";

  const Store = window.TarotStore;
  const UI = window.TarotUI;
  const SPREADS = window.TAROT_SPREADS;
  const TOPIC_LABEL = { general: "綜合", love: "感情", career: "事業" };

  const $ = (sel, root = document) => root.querySelector(sel);
  const esc = UI.escapeHtml;

  // ---------- 資料 ----------
  function all() {
    const list = Store.get("readings", []);
    return Array.isArray(list) ? list : [];
  }

  function saveAll(list) {
    return Store.set("readings", list);
  }

  function get(id) {
    return all().find((r) => r.id === id) || null;
  }

  function add(record) {
    const list = all();
    list.unshift(record);
    const ok = saveAll(list);
    renderList();
    return ok;
  }

  function update(id, patch) {
    const list = all();
    const r = list.find((x) => x.id === id);
    if (!r) return false;
    Object.assign(r, patch);
    return saveAll(list);
  }

  function remove(id) {
    return saveAll(all().filter((r) => r.id !== id));
  }

  function isValidRecord(r) {
    return r && typeof r.id === "string" && typeof r.time === "string" && Array.isArray(r.cards) &&
      r.cards.every((c) => c && UI.getCard(c.cardId) && typeof c.reversed === "boolean");
  }

  // ---------- 匯出／匯入 ----------
  function exportJSON() {
    const data = {
      app: "xingyu-tarot",
      version: 1,
      exportedAt: new Date().toISOString(),
      readings: all(),
      daily: Store.get("daily", {})
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `xingyu-tarot-journal-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function importJSON(text) {
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error("檔案不是有效的 JSON。");
    }
    const readings = Array.isArray(data) ? data : data && data.readings;
    if (!Array.isArray(readings)) throw new Error("找不到占卜紀錄資料。");

    const list = all();
    const ids = new Set(list.map((r) => r.id));
    let added = 0, skipped = 0;
    readings.forEach((r) => {
      if (!isValidRecord(r) || ids.has(r.id)) { skipped++; return; }
      list.push({
        id: r.id, time: r.time, spreadId: String(r.spreadId || ""), spreadName: String(r.spreadName || ""),
        question: String(r.question || ""), topic: String(r.topic || "general"),
        cards: r.cards.map((c) => ({ position: String(c.position || ""), cardId: c.cardId, reversed: c.reversed })),
        note: String(r.note || "")
      });
      ids.add(r.id);
      added++;
    });
    list.sort((a, b) => b.time.localeCompare(a.time));
    saveAll(list);

    let dailyAdded = 0;
    if (data && data.daily && typeof data.daily === "object") {
      const daily = Store.get("daily", {});
      Object.entries(data.daily).forEach(([date, d]) => {
        if (/^\d{4}-\d{2}-\d{2}$/.test(date) && !daily[date] && d && UI.getCard(d.cardId)) {
          daily[date] = { cardId: d.cardId, reversed: !!d.reversed, revealedAt: String(d.revealedAt || "") };
          dailyAdded++;
        }
      });
      Store.set("daily", daily);
    }
    return { added, skipped, dailyAdded };
  }

  // ---------- 畫面 ----------
  function formatTime(iso) {
    const d = new Date(iso);
    if (isNaN(d)) return iso;
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function cardBrief(c) {
    const card = UI.getCard(c.cardId);
    return `${card.name}${c.reversed ? "（逆）" : ""}`;
  }

  let selectedId = null;

  function renderList() {
    const listEl = $("#journal-list");
    if (!listEl) return;
    const list = all();
    const daily = Store.get("daily", {});
    const dailyDates = Object.keys(daily).filter((k) => daily[k].revealedAt).sort().reverse();

    const readingsHtml = list.length ? list.map((r) => `
      <button class="journal-item ${r.id === selectedId ? "active" : ""}" data-record="${esc(r.id)}">
        <span class="journal-meta">${formatTime(r.time)}・${esc(r.spreadName)}・${TOPIC_LABEL[r.topic] || "綜合"}</span>
        <strong>${r.question ? esc(r.question) : "（未填寫問題）"}</strong>
        <span class="journal-cards">${r.cards.map(cardBrief).join("、")}</span>
        ${r.note ? `<span class="journal-note-flag">✎ 有筆記</span>` : ""}
      </button>`).join("")
      : `<p class="muted">還沒有占卜紀錄。完成一次抽牌並翻開所有牌後，會自動存在這裡。</p>`;

    const dailyHtml = dailyDates.length ? `
      <h3 class="journal-subhead">每日一牌</h3>
      <div class="daily-log">
        ${dailyDates.slice(0, 30).map((date) => {
          const d = daily[date];
          const card = UI.getCard(d.cardId);
          return `<button class="daily-log-item" data-card="${card.id}" title="${card.name}${d.reversed ? " 逆位" : " 正位"}">
            <span class="muted">${date.slice(5).replace("-", "/")}</span>
            ${UI.cardHtml(card, { reversed: d.reversed, faceUp: true, small: true })}
          </button>`;
        }).join("")}
      </div>` : "";

    listEl.innerHTML = `<h3 class="journal-subhead">占卜紀錄（${list.length}）</h3>${readingsHtml}${dailyHtml}`;
  }

  function show(id) {
    const r = get(id);
    const box = $("#journal-detail");
    selectedId = r ? id : null;
    renderList();
    if (!r) { box.innerHTML = ""; return; }
    const spread = SPREADS.find((s) => s.id === r.spreadId);
    box.innerHTML = `
      <div class="panel journal-detail">
        <div class="journal-head">
          <div>
            <h2>${esc(r.spreadName)}</h2>
            <p class="muted">${formatTime(r.time)}・${TOPIC_LABEL[r.topic] || "綜合"}</p>
          </div>
          <div class="actions">
            ${window.TarotShare ? `<button class="btn small primary" data-share-record="${esc(r.id)}">分享圖片</button>` : ""}
            <button class="btn small danger" data-delete="${esc(r.id)}">刪除</button>
          </div>
        </div>
        ${r.question ? `<p class="question">問題：「${esc(r.question)}」</p>` : ""}
        <div class="entries">
          ${r.cards.map((c, i) => {
            const card = UI.getCard(c.cardId);
            const k = c.reversed ? "reversed" : "upright";
            const meaning = spread && spread.positions[i] ? spread.positions[i].meaning : "";
            return `
              <article class="entry shown">
                <h3>${i + 1}. ${esc(c.position)} <small class="muted">${meaning}</small></h3>
                <div class="entry-body">
                  ${UI.cardHtml(card, { reversed: c.reversed, faceUp: true, small: true })}
                  <div>
                    <p class="card-title">${card.name}　<span class="orient ${k}">${UI.orientationText(c.reversed)}</span></p>
                    ${UI.keywordChips(card.keywords[k])}
                    <p>${card[k]}</p>
                    <button class="link" data-card="${card.id}">查看完整牌義 →</button>
                  </div>
                </div>
              </article>`;
          }).join("")}
        </div>
        <label class="field">
          <span>我的筆記</span>
          <textarea id="journal-note" rows="5" maxlength="5000" placeholder="寫下你的感受、後續發展或對這次占卜的想法……">${esc(r.note || "")}</textarea>
        </label>
        <div class="actions">
          <button class="btn primary small" data-save-note="${esc(r.id)}">儲存筆記</button>
          <span id="note-status" class="muted" aria-live="polite"></span>
        </div>
      </div>`;
    box.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function init() {
    if (!Store.available()) $("#storage-warning").hidden = false;

    $("#journal-list").addEventListener("click", (e) => {
      const item = e.target.closest("[data-record]");
      if (item) show(item.dataset.record);
    });

    $("#journal-detail").addEventListener("click", (e) => {
      const save = e.target.closest("[data-save-note]");
      if (save) {
        const ok = update(save.dataset.saveNote, { note: $("#journal-note").value });
        $("#note-status").textContent = ok ? "已儲存" : "無法寫入瀏覽器儲存空間，請匯出備份";
        renderList();
      }
      const del = e.target.closest("[data-delete]");
      if (del && confirm("確定要刪除這筆紀錄嗎？此動作無法復原。")) {
        remove(del.dataset.delete);
        show(null);
      }
    });

    $("#btn-export").addEventListener("click", exportJSON);
    $("#import-file").addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      file.text().then((text) => {
        try {
          const res = importJSON(text);
          alert(`匯入完成：新增 ${res.added} 筆占卜紀錄、${res.dailyAdded} 筆每日一牌${res.skipped ? `，略過 ${res.skipped} 筆重複或格式錯誤的資料` : ""}。`);
          renderList();
        } catch (err) {
          alert("匯入失敗：" + err.message);
        }
      }).finally(() => { e.target.value = ""; });
    });

    document.addEventListener("tarot:view", (e) => { if (e.detail === "journal") renderList(); });
    document.addEventListener("tarot:daily", renderList);
    renderList();
  }

  window.TarotJournal = { all, get, add, update, remove, show, exportJSON, importJSON };
  init();
})();
