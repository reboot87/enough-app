import { h, render } from 'preact'
import htm from 'htm'

const html = htm.bind(h)

/* ---------------- storage ---------------- */
const KEY = 'enough.v1'
let mem = null

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

export function load() {
  if (mem) return mem
  try {
    mem = JSON.parse(localStorage.getItem(KEY)) || null
  } catch (e) {
    mem = null
  }
  if (!mem) mem = blank()
  return mem
}

function blank() {
  return {
    v: 1,
    onboarded: false,
    decisions: [],
    urges: [],
    plans: [],
    goals: [],
    ledger: [],
    bins: { do: ['出门走走', '整理桌面', '读 20 页书', '给朋友打电话', '做顿正经饭', '睡个好午觉'], eat: ['面', '米饭', '饺子', '沙拉', '火锅', '粥'], play: ['散步', '看电影', '听歌', '发呆', '骑行', '读书'] }
  }
}

let pending = null

export function flush() {
  if (!pending) return
  clearTimeout(pending)
  pending = null
  try {
    localStorage.setItem(KEY, JSON.stringify(mem))
  } catch (e) {}
}

export function save() {
  if (pending) return
  pending = setTimeout(() => {
    pending = null
    try {
      localStorage.setItem(KEY, JSON.stringify(mem))
    } catch (e) {}
  }, 200)
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', flush)
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flush()
    })
  }
}

export function commit(fn) {
  fn(load())
  save()
}

export function exportJSON() {
  return JSON.stringify(load(), null, 2)
}

export function clearAll() {
  mem = blank()
  mem.onboarded = true
  save()
}

/* ---------------- dates ---------------- */
export const dayKey = (d = new Date()) => {
  const x = d instanceof Date ? d : new Date(d)
  return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0')
}
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }
export const weekKey = (d = new Date()) => {
  const start = addDays(d, -((d.getDay() + 6) % 7))
  return dayKey(start)
}
const mKey = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')

const midnight = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x }

export function periodRange(kind, offset, base = new Date()) {
  let start, end, label
  if (kind === 'week') {
    const monday = midnight(addDays(base, -((base.getDay() + 6) % 7)))
    start = addDays(monday, offset * 7)
    end = addDays(start, 7)
    label = (start.getMonth() + 1) + '月' + start.getDate() + '日'
  } else if (kind === 'month') {
    start = new Date(base.getFullYear(), base.getMonth() + offset, 1)
    end = new Date(base.getFullYear(), base.getMonth() + offset + 1, 1)
    label = base.getFullYear() + '年' + (base.getMonth() + offset + 1) + '月'
  } else {
    start = new Date(base.getFullYear() + offset, 0, 1)
    end = new Date(base.getFullYear() + offset + 1, 0, 1)
    label = base.getFullYear() + offset + '年'
  }
  return { start, end, label, key: kind === 'week' ? weekKey(start) : kind === 'month' ? mKey(start) : String(start.getFullYear()) }
}

export const inRange = (ts, r) => { const t = new Date(ts); return t >= r.start && t < r.end }

/* ---------------- decisions ---------------- */
export function addDecision(d) {
  commit((s) => {
    s.decisions.push(Object.assign({ id: uid(), createdAt: Date.now(), confidence: 5, worry: '', concern: '', resolved: false }, d))
  })
}
export function resolveDecision(id, patch) {
  commit((s) => {
    const x = s.decisions.find((i) => i.id === id)
    if (x) Object.assign(x, patch)
  })
}
export const pendingLookback = (s = load()) => s.decisions.filter((d) => !d.resolved && Date.now() - d.submittedAt > 864e5)

export const decisionStats = (list) => {
  const n = list.length
  const avgSec = n ? Math.round(list.reduce((a, d) => a + ((d.submittedAt - d.startedAt) / 1000), 0) / n) : 0
  const thought = list.reduce((a, d) => a + Math.round((d.submittedAt - d.startedAt) / 60000), 0)
  const answered = list.filter((d) => d.resolved)
  const bad = answered.filter((d) => d.concern === 'yes').length
  return {
    n, avgSec, thought,
    answered: answered.length, bad,
    worryRate: answered.length ? Math.round(bad / answered.length * 100) : null,
    confidence: n ? (list.reduce((a, d) => a + (d.confidence || 5), 0) / n).toFixed(1) : null
  }
}

/* ---------------- plans & goals ---------------- */
export function addPlan(text, date) {
  commit((s) => { s.plans.push({ id: uid(), text, date, done: false, createdAt: Date.now() }) })
}
export function togglePlan(id) {
  commit((s) => { const p = s.plans.find((i) => i.id === id); if (p) p.done = !p.done })
}
export const planStats = (list) => ({ total: list.length, done: list.filter((p) => p.done).length })

export function addGoal(text, horizon) {
  commit((s) => { s.goals.push({ id: uid(), text, horizon, createdAt: Date.now() }) })
}
export function removeGoal(id) {
  commit((s) => { s.goals = s.goals.filter((g) => g.id !== id) })
}
export const goalDecisions = (goal, s = load()) => {
  const kw = goal.text.trim()
  if (!kw) return []
  const key = kw.slice(0, 4)
  return s.decisions.filter((d) => (d.description || '').includes(key))
}

/* ---------------- ledger ---------------- */
export const CATS = ['小吃', '交通', '娱乐', '学习', '人情', '其他']
export const COLOR = { 小吃: '#F59E0B', 交通: '#64748B', 娱乐: '#8B5CF6', 学习: '#3B82F6', 人情: '#EC4899', 其他: '#94A3B8' }

export function addEntry(amount, cat, note) {
  commit((s) => { s.ledger.push({ id: uid(), amount: Number(amount), cat, note: note || '', createdAt: Date.now() }) })
}
export function removeEntry(id) {
  commit((s) => { s.ledger = s.ledger.filter((e) => e.id !== id) })
}
export const ledgerStats = (list) => {
  const total = list.reduce((a, e) => a + e.amount, 0)
  const byCat = {}
  for (const e of list) byCat[e.cat] = (byCat[e.cat] || 0) + e.amount
  const top = Object.entries(byCat).sort((a, b) => b[1] - a[1])
  return { total, byCat, top, count: list.length }
}
export const fmt = (n) => '¥' + (Math.round(n * 100) / 100).toLocaleString('zh-CN')

/* ---------------- draw ---------------- */
export function setBin(k, list) {
  commit((s) => { s.bins[k] = list.filter((x) => x.trim()).map((x) => x.trim()) })
}
export function draw(k) {
  const bin = load().bins[k] || []
  if (!bin.length) return null
  return bin[Math.floor(Math.random() * bin.length)]
}

/* ---------------- reports ---------------- */
export function buildReport(kind, offset, base = new Date()) {
  const s = load()
  const r = periodRange(kind, offset, base)
  const dec = s.decisions.filter((d) => inRange(d.submittedAt, r))
  const led = s.ledger.filter((e) => inRange(e.createdAt, r))
  const pl = s.plans.filter((p) => inRange(p.createdAt, r))
  const ans = dec.filter((d) => d.resolved)
  const bad = ans.filter((d) => d.concern === 'yes').length
  const worried = ans.filter((d) => d.concern === 'no').length

  let hourTop = null
  if (kind !== 'week') {
    const byHour = {}
    for (const d of dec) { const h = new Date(d.submittedAt).getHours(); byHour[h] = (byHour[h] || 0) + 1 }
    const e = Object.entries(byHour).sort((a, b) => b[1] - a[1])[0]
    if (e) hourTop = { h: Number(e[0]), n: e[1] }
  }

  return {
    r, dec, led, pl, ans, bad, worried, hourTop,
    dstat: decisionStats(dec),
    lstat: ledgerStats(led),
    pstat: planStats(pl)
  }
}