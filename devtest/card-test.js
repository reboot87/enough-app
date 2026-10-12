import { drawYearCard } from '../src/share.js'
import * as M from '../src/model.js'

const now = Date.now()
const D = 864e5
const yr = new Date().getFullYear()

const seed = { v: 1, onboarded: true, decisions: [], urges: [], plans: [], goals: [], ledger: [], bins: { do: [], eat: [], play: [] } }

// 全年 214 个决定，其中 38 个已回访，5 件成真
for (let i = 0; i < 214; i++) {
  const t = new Date(yr, 0, 1 + (i % 358), 8 + (i % 14), (i * 7) % 60).getTime()
  const ans = i < 38
  seed.decisions.push({
    id: 'd' + i,
    description: '决定 #' + (i + 1),
    budgetTimeMin: [2, 5, 15][i % 3],
    sourcesLimit: 3,
    startedAt: t - (3 + (i % 9) * 4) * 60e3,
    submittedAt: t,
    confidence: 3 + (i % 8),
    worry: '',
    resolved: ans,
    concern: ans ? (i % 8 === 0 ? 'yes' : i % 8 === 1 ? 'part' : 'no') : undefined
  })
}
const CATS = ['娱乐', '学习', '交通', '小吃', '人情']
for (let i = 0; i < 60; i++) {
  seed.ledger.push({
    id: 'e' + i,
    amount: 20 + ((i * 137) % 1800),
    cat: CATS[i % CATS.length],
    note: '',
    createdAt: new Date(yr, 0, 1 + (i % 358), 12).getTime()
  })
}
localStorage.setItem('enough.v1', JSON.stringify(seed))

const rep = M.buildReport('year', 0, new Date(yr, 6, 1))
const cv = drawYearCard(rep, yr)

const out = document.createElement('div')
out.id = 'card-out'
out.setAttribute('data-url', cv.toDataURL('image/png'))
out.setAttribute('data-w', String(cv.width))
out.setAttribute('data-h', String(cv.height))
document.body.appendChild(out)
document.title = 'CARD_OK'