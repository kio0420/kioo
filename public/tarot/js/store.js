// localStorage 包裝：無痕模式或停用儲存時不會拋錯，改用記憶體暫存
(function () {
  "use strict";

  const PREFIX = "tarot.";
  const memory = {};
  let available = true;
  try {
    const k = PREFIX + "__test";
    localStorage.setItem(k, "1");
    localStorage.removeItem(k);
  } catch (e) {
    available = false;
  }

  function get(key, fallback) {
    try {
      const raw = available ? localStorage.getItem(PREFIX + key) : memory[key];
      return raw == null ? fallback : JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }

  function set(key, value) {
    const raw = JSON.stringify(value);
    memory[key] = raw;
    if (!available) return false;
    try {
      localStorage.setItem(PREFIX + key, raw);
      return true;
    } catch (e) {
      return false; // 容量已滿等情況
    }
  }

  function remove(key) {
    delete memory[key];
    try { if (available) localStorage.removeItem(PREFIX + key); } catch (e) { /* 忽略 */ }
  }

  window.TarotStore = { get, set, remove, available: () => available };
})();
