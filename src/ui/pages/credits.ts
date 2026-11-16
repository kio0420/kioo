import { h } from '../dom';
import { getLang, t } from '../i18n';
import { mountPage } from '../layout';

const UPSTREAM_NOTICE = "MIT License\n\nCopyright (c) 2020 8values (SapplyValues)\n\nPermission is hereby granted, free of charge, to any person obtaining a copy\nof this software and associated documentation files (the \"Software\"), to deal\nin the Software without restriction, including without limitation the rights\nto use, copy, modify, merge, publish, distribute, sublicense, and/or sell\ncopies of the Software, and to permit persons to whom the Software is\nfurnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all\ncopies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\nIMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\nFITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\nAUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\nLIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\nOUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE\nSOFTWARE.";

export function render(): void {
  mountPage({
    nav: 'credits',
    title: () => t('creditsTitle'),
    render(main) {
      const zh = getLang() === 'zh';
      const wrap = h('div', { class: 'wrap prose' }, h('h1', null, t('creditsTitle')));
      wrap.append(
        h('h2', null, zh ? '本站授權' : 'This site'),
        h('p', null, zh
          ? '本站程式碼以 MIT 授權釋出（Copyright (c) 2026 the kioo project contributors）。「十二向度：政治光譜自省」為獨立作品，與 12axes.site 及其名稱、標誌、版面無關。'
          : 'The code of this site is released under the MIT license (Copyright (c) 2026 the kioo project contributors). It is an independent work, unaffiliated with 12axes.site and its name, logo or layout.'),
        h('h2', null, zh ? '資料來源' : 'Sources'),
        h('p', null, zh
          ? '題目、軸線標籤與意識形態資料衍生自 12axes（politicaltests.github.io，commit 5a508de）；12axes 以 9axes 為基礎，9axes 又以 8values 為基礎。上游採 MIT 授權，授權全文如下：'
          : 'Questions, axis labels and ideology data are derived from 12axes (politicaltests.github.io, commit 5a508de), which is based on 9axes, which is based on 8values. The upstream MIT notice, verbatim:'),
        h('pre', { class: 'license', tabindex: '0' }, UPSTREAM_NOTICE),
        h('h2', null, zh ? '本站所做的修改' : 'What we changed'),
        h('ul', null,
          (zh
            ? ['翻譯：題目、軸名、標籤與意識形態說明的繁體中文翻譯為本專案所作，可能與英文原意有出入。',
               '外交座標重新對應：意識形態的外交座標改與「國際主義 vs 民族主義」軸比較，而非貿易軸。',
               '計分正規化：以每軸實際作答題數正規化，使完整版、快速版與迷你版的百分比可相互比較。',
               '新增迷你版（每軸 3 題）與人物配對功能。']
            : ['Translation: the Traditional Chinese text is this project\'s own and may differ from the English meaning.',
               'Diplomatic coordinate remapped: ideologies are compared on Internationalist vs Nationalist rather than the trade axis.',
               'Scoring normalised by the number of questions answered per axis, so all modes are comparable.',
               'Added the Mini mode (3 questions per axis) and figure matching.']
          ).map((x) => h('li', null, x))),
        h('h2', null, zh ? '人物資料' : 'Figures'),
        h('p', null, zh
          ? '人物座標為編輯群依公開文獻所做的估計值，並非當事人自評，也不來自上游資料。'
          : 'Figure coordinates are editorial estimates from public records, not self-reported and not from the upstream data.'));
      main.append(wrap);
    },
  });
}
