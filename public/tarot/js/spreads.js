// 牌陣定義：col / row 為版面格線位置（從 1 開始），cross 表示橫放壓在前一張上
window.TAROT_SPREADS = [
  {
    id: "single",
    name: "單張牌",
    desc: "針對一個問題抽一張牌，快速得到核心指引。",
    cols: 1, rows: 1,
    positions: [
      { name: "指引", meaning: "此刻最需要知道的訊息", col: 1, row: 1 }
    ]
  },
  {
    id: "yesno",
    name: "是非題",
    desc: "適合「是或否」的問題。正位傾向「是」，逆位傾向「否」，部分牌代表時機未明。",
    cols: 1, rows: 1,
    yesNo: true,
    positions: [
      { name: "答案", meaning: "對你的問題的回應", col: 1, row: 1 }
    ]
  },
  {
    id: "three",
    name: "時間之流",
    desc: "經典三張牌：過去、現在、未來，看清事情的來龍去脈。",
    cols: 3, rows: 1,
    positions: [
      { name: "過去", meaning: "造成現況的原因與背景", col: 1, row: 1 },
      { name: "現在", meaning: "目前的狀態與核心課題", col: 2, row: 1 },
      { name: "未來", meaning: "照目前方向發展的可能結果", col: 3, row: 1 }
    ]
  },
  {
    id: "mind",
    name: "身心靈",
    desc: "三張牌檢視自己的身體、心理與靈性狀態。",
    cols: 3, rows: 1,
    positions: [
      { name: "身體", meaning: "身體與物質層面的狀態", col: 1, row: 1 },
      { name: "心理", meaning: "情緒與思緒的狀態", col: 2, row: 1 },
      { name: "靈性", meaning: "內在成長與精神層面的指引", col: 3, row: 1 }
    ]
  },
  {
    id: "choice",
    name: "二選一",
    desc: "在兩個選項之間猶豫時，比較兩條路的發展。",
    cols: 3, rows: 3,
    positions: [
      { name: "現況", meaning: "你目前所處的情況與心態", col: 2, row: 3 },
      { name: "選擇 A", meaning: "選擇 A 的現況與特質", col: 1, row: 2 },
      { name: "A 的結果", meaning: "選擇 A 可能帶來的發展", col: 1, row: 1 },
      { name: "選擇 B", meaning: "選擇 B 的現況與特質", col: 3, row: 2 },
      { name: "B 的結果", meaning: "選擇 B 可能帶來的發展", col: 3, row: 1 }
    ]
  },
  {
    id: "cross",
    name: "五張十字",
    desc: "以十字展開，看見問題的阻礙、根源與最終走向。",
    cols: 3, rows: 3,
    positions: [
      { name: "現況", meaning: "問題的核心與目前狀態", col: 2, row: 2 },
      { name: "阻礙", meaning: "正在妨礙你的因素", col: 3, row: 2 },
      { name: "根源", meaning: "問題的過去或根本原因", col: 1, row: 2 },
      { name: "建議", meaning: "你可以採取的態度與行動", col: 2, row: 1 },
      { name: "結果", meaning: "依照建議行動後的可能結果", col: 2, row: 3 }
    ]
  },
  {
    id: "relationship",
    name: "關係牌陣",
    desc: "探索你與對方的心意、關係現況與未來發展。",
    cols: 3, rows: 2,
    positions: [
      { name: "你的心意", meaning: "你在這段關係中的想法與感受", col: 1, row: 1 },
      { name: "關係現況", meaning: "這段關係目前的狀態", col: 2, row: 1 },
      { name: "對方的心意", meaning: "對方在這段關係中的想法與感受", col: 3, row: 1 },
      { name: "挑戰", meaning: "關係中需要面對的課題", col: 1, row: 2 },
      { name: "建議", meaning: "讓關係更好的方向", col: 2, row: 2 },
      { name: "未來發展", meaning: "關係可能的走向", col: 3, row: 2 }
    ]
  },
  {
    id: "celtic",
    name: "凱爾特十字",
    desc: "最經典的十張牌陣，全面分析一個複雜的問題。",
    cols: 5, rows: 4,
    positions: [
      { name: "現況", meaning: "問題的核心", col: 2, row: 2 },
      { name: "阻礙", meaning: "橫在你面前的挑戰", col: 2, row: 2, cross: true },
      { name: "目標", meaning: "意識層面的期望或最好的可能", col: 2, row: 1 },
      { name: "根基", meaning: "潛意識或事情的根源", col: 2, row: 3 },
      { name: "過去", meaning: "正在離開的影響", col: 1, row: 2 },
      { name: "近未來", meaning: "即將發生的事", col: 3, row: 2 },
      { name: "自我", meaning: "你對這件事的態度", col: 5, row: 4 },
      { name: "環境", meaning: "周遭的人與外在影響", col: 5, row: 3 },
      { name: "希望與恐懼", meaning: "內心的期待與擔憂", col: 5, row: 2 },
      { name: "最終結果", meaning: "綜合以上的可能結局", col: 5, row: 1 }
    ]
  }
];

// 是非題中代表「時機未明」的牌
window.TAROT_MAYBE_IDS = ["major-02", "major-10", "major-12", "major-18", "swords-02", "cups-07", "pentacles-04"];
