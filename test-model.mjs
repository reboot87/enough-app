const store = {}
globalThis.localStorage = {
  getItem: (k) => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v) },
  removeItem: (k) => { delete store[k] }
}

const M = await import('./src/model.js')

const now = new Date()
const D = 864e5
let pass = 0, fail = 0
const eq = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want)
  if (ok) { pass++; console.log('  PASS  ' + name) }
  else { fail++; console.log('  FAIL  ' + name + '\n        got  ' + JSON.stringify(got) + '\n        want ' + JSON.stringify(want)) }
}

console.log('\n[dates]')
eq('dayKey', M.dayKey(new Date(2026, 0, 5)), '2026-01-05')
eq('weekKey 是周一', M.weekKey(new Date(2026, 0, 7)), '2026-01-05')
eq('weekKey 周日归上周一', M.weekKey(new Date(2026, 0, 11)), '2026-01-05')
const wk = M.periodRange('week', 0, new Date(2026, 0, 7))
eq('week 区间长 7 天', Math.round((wk.end - wk.start) / D), 7)
const mo = M.periodRange('month', 0, new Date(2026, 0, 15))
eq('month 区间', mo.key, '2026-01')
eq('year 区间', M.periodRange('year', 0, now).key, String(now.getFullYear()))

console.log('\n[decisions]')
M.clearAll()
M.commit((s) => { s.onboarded = true })
M.addDecision({ description: 'a', budgetTimeMin: 2, sourcesLimit: 1, startedAt: Date.now() - 120e3, submittedAt: Date.now(), confidence: 8, worry: 'x' })
M.addDecision({ description: 'b', budgetTimeMin: 5, sourcesLimit: 2, startedAt: Date.now() - 60e3, submittedAt: Date.now(), confidence: 4, worry: 'y' })
const st = M.decisionStats(M.load().decisions)
eq('决策数', st.n, 2)
eq('平均耗时秒', st.avgSec, 90)
eq('纠结总时长分钟', st.thought, 3)
eq('平均信心', st.confidence, '6.0')
eq('未回访时成真率', st.worryRate, null)

console.log('\n[lookback]')
eq('24h 内不显示待回访', M.pendingLookback(M.load()).length, 0)
M.addDecision({ description: 'old', budgetTimeMin: 5, sourcesLimit: 1, startedAt: Date.now() - 3 * D, submittedAt: Date.now() - 3 * D, confidence: 5, worry: 'z' })
eq('超 24h 进入待回访', M.pendingLookback(M.load()).length, 1)

console.log('\n[concern 回访]')
const old = M.load().decisions.find((d) => d.description === 'old')
M.resolveDecision(old.id, { resolved: true, concern: 'no' })
eq('回访后移出待办', M.pendingLookback(M.load()).length, 0)
eq('没发生记为 no', M.load().decisions.find((d) => d.id === old.id).concern, 'no')

console.log('\n[plans 限 3 件]')
const d0 = M.dayKey()
M.addPlan('一', d0); M.addPlan('二', d0); M.addPlan('三', d0)
eq('当天 3 件', M.load().plans.length, 3)
eq('完成统计', M.planStats(M.load().plans).done, 0)
M.togglePlan(M.load().plans[0].id)
eq('打勾后完成数', M.planStats(M.load().plans).done, 1)

console.log('\n[ledger]')
M.clearAll()
M.addEntry(1299, '娱乐', '显示器')
M.addEntry(38, '小吃', '午饭')
M.addEntry(268, '学习', '买书')
const ls = M.ledgerStats(M.load().ledger)
eq('总额', ls.total, 1605)
eq('分类数', Object.keys(ls.byCat).length, 3)
eq('最大类目', ls.top[0][0], '娱乐')
eq('格式化', M.fmt(1605), '¥1,605')

console.log('\n[draw 摇签]')
M.clearAll()
M.setBin('eat', ['面', '粥'])
eq('签数', M.load().bins.eat.length, 2)
let ok = true
for (let i = 0; i < 40; i++) { const r = M.draw('eat'); if (!['面', '粥'].includes(r)) ok = false }
eq('40 次均在签内', ok, true)
M.setBin('play', ['   ', ''])
eq('空白签被过滤', M.load().bins.play.length, 0)
eq('空签筒返回 null', M.draw('play'), null)

console.log('\n[goals 关联决策]')
M.clearAll()
M.addGoal('换城市', '年度')
M.addDecision({ description: '要不要换城市工作', budgetTimeMin: 5, sourcesLimit: 1, startedAt: Date.now(), submittedAt: Date.now(), confidence: 5, worry: '' })
M.addDecision({ description: '今天吃什么', budgetTimeMin: 5, sourcesLimit: 1, startedAt: Date.now(), submittedAt: Date.now(), confidence: 5, worry: '' })
eq('按关键词关联到 1 条', M.goalDecisions(M.load().goals[0]).length, 1)

console.log('\n[report 聚合]')
M.clearAll()
const t = Date.now()
M.addDecision({ description: 'r1', budgetTimeMin: 5, sourcesLimit: 1, startedAt: t - 120e3, submittedAt: t, confidence: 5, worry: '' })
M.addEntry(200, '娱乐', 'x')
const rep = M.buildReport('week', 0)
eq('周报决定数', rep.dstat.n, 1)
eq('周报消费', rep.lstat.total, 200)
eq('月报也包含本周', M.buildReport('month', 0).dstat.n, 1)
eq('年报也包含本周', M.buildReport('year', 0).dstat.n, 1)
eq('上月报表为空', M.buildReport('month', -1).dstat.n, 0)
eq('上月报表消费为空', M.buildReport('month', -1).lstat.total, 0)

console.log('\n[persist]')
M.addEntry(50, '交通', '')
M.flush()
eq('写入 localStorage', JSON.parse(localStorage.getItem('enough.v1')).ledger.length, 2)
eq('重载后数据保留', M.load().ledger.length, 2)

console.log('\n' + (fail === 0 ? 'ALL PASS ' : 'HAS FAIL ') + pass + ' passed / ' + fail + ' failed\n')
process.exit(fail ? 1 : 0)