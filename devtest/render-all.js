import { h, render } from 'preact'
import htm from 'htm'
import { S } from '../src/state.js'
import * as M from '../src/model.js'
import * as V from '../src/views.js'

const html = htm.bind(h)

const now = Date.now()
const D = 864e5
const seed = {
  v: 1,
  onboarded: true,
  decisions: [
    { id: 'd1', description: '要不要换工作', budgetTimeMin: 15, sourcesLimit: 3, startedAt: now - 4 * D - 900e3, submittedAt: now - 4 * D - 600e3, confidence: 4, worry: '怕适应不了', resolved: true, concern: 'no' },
    { id: 'd2', description: '买不买那台显示器', budgetTimeMin: 5, sourcesLimit: 2, startedAt: now - 2 * D - 400e3, submittedAt: now - 2 * D - 100e3, confidence: 7, worry: '怕浪费钱', resolved: true, concern: 'part' },
    { id: 'd3', description: '要不要给前同事发消息', budgetTimeMin: 2, sourcesLimit: 1, startedAt: now - 3 * D, submittedAt: now - 3 * D, confidence: 6, worry: '怕被拒绝', resolved: false },
    { id: 'd4', description: '中午吃什么', budgetTimeMin: 2, sourcesLimit: 1, startedAt: now - 36e5, submittedAt: now - 36e5, confidence: 8, worry: '', resolved: false },
    { id: 'd5', description: '要不要报名那个课', budgetTimeMin: 5, sourcesLimit: 2, startedAt: now - 22 * 36e5, submittedAt: now - 22 * 36e5, confidence: 5, worry: '怕学不完', resolved: false },
    { id: 'd6', description: '要不要告诉家里', budgetTimeMin: 15, sourcesLimit: 3, startedAt: now - 25 * 36e5, submittedAt: now - 25 * 36e5, confidence: 3, worry: '怕他们担心', resolved: true, concern: 'yes' }
  ],
  urges: [{ id: 'u1', text: '要不要回消息', createdAt: now - 36e5 }],
  plans: [
    { id: 'p1', text: '写完周报', date: M.dayKey(), done: false, createdAt: now },
    { id: 'p2', text: '出门跑步', date: M.dayKey(), done: true, createdAt: now }
  ],
  goals: [{ id: 'g1', text: '换城市', horizon: '年度', createdAt: now - 30 * D }],
  ledger: [
    { id: 'e1', amount: 1299, cat: '娱乐', note: '显示器', createdAt: now - 2 * D },
    { id: 'e2', amount: 38, cat: '小吃', note: '午饭', createdAt: now - D },
    { id: 'e3', amount: 268, cat: '学习', note: '买书', createdAt: now - 3 * D },
    { id: 'e4', amount: 620, cat: '人情', note: '随份子', createdAt: now - 6 * D },
    { id: 'e5', amount: 156, cat: '交通', note: '打车', createdAt: now - 12 * 36e5 }
  ],
  bins: { do: ['出门走走', '整理桌面', '读 20 页书', '给朋友打电话'], eat: ['面', '饺子', '火锅'], play: ['散步', '看电影'] }
}

localStorage.setItem('enough.v1', JSON.stringify(seed))

const CASES = [
  ['onboard', V.Onboard],
  ['today', V.Today],
  ['plan-small', V.Plan],
  ['ledger', V.Ledger],
  ['review-week', V.Review],
  ['lookback', V.Lookback],
  ['me', V.Me],
  ['resolve', V.Resolve],
  ['quick', V.Quick]
]

S.rerender = () => {}

const root = document.getElementById('root')
root.innerHTML = CASES.map(([n]) => '<section id="case-' + n + '"><h2 data-case="' + n + '">CASE:' + n + '</h2><div id="v-' + n + '"></div></section>').join('')

for (const [name, Cmp] of CASES) {
  const host = document.getElementById('v-' + name)
  if (name === 'onboard') { M.load().onboarded = false; render(html`<${Cmp} />`, host); M.load().onboarded = true }
  else render(html`<${Cmp} />`, host)
}

document.title = 'RENDERED:' + CASES.length