import { h } from 'preact'
import { useState, useEffect } from 'preact/hooks'
import htm from 'htm'
import { S, toast } from './state.js'
import * as M from './model.js'
import { Icon, Stat, Bars, Empty, Field, Stepper, Seg } from './ui.js'
import { hasYearData, drawYearCard, downloadCard } from './share.js'

const html = htm.bind(h)
const todayRange = () => ({ start: new Date(new Date().setHours(0, 0, 0, 0)), end: new Date(new Date().setHours(23, 59, 59, 0)) })

/* ================= ONBOARDING ================= */
const OB = [
  { mark: 'Enough', h: '你的决定，本来就已经够好了。', p: '纠结不是因为你优柔寡断，是因为决定没有预算。' },
  { mark: '01', h: '给每个决定设个预算', p: '时间预算 + 信息源上限。到点就提交，不再多想。\n\n犹豫不是你的错，是没有边界。' },
  { mark: '02', h: '你的数据只在这台设备', p: '不联网、不需要账号、不上传。你可以随时导出，也可以随时删除。' }
]

export function Onboard() {
  const [n, setN] = useState(0)
  const st = OB[n]
  return html`<div class="ob"><div class="ob-in">
    <div class="fade-in" key=${n}>
      <div class="ob-mark">${st.mark}</div>
      <h1 class="ob-h">${st.h}</h1>
      <p class="ob-p" style="white-space:pre-line">${st.p}</p>
    </div>
    <div class="ob-ft">
      <div class="ob-dots">${OB.map((_, k) => html`<i key=${k} class=${k === n ? 'on' : ''}></i>`)}</div>
      ${n < OB.length - 1
        ? html`<button class="btn btn-p btn-l" onClick=${() => setN(n + 1)}>继续</button>`
        : html`<button class="btn btn-p btn-l" onClick=${() => { M.commit((s) => { s.onboarded = true }); S.go('today') }}>开始使用</button>`}
      ${n > 0 ? html`<button class="btn btn-g" style="width:100%;margin-top:8px" onClick=${() => setN(n - 1)}>返回</button>` : null}
    </div>
  </div></div>`
}

/* ================= 今天 ================= */
export function Today() {
  const [, force] = useState(0)
  const s = M.load()
  const todays = s.decisions.filter((d) => M.inRange(d.submittedAt, todayRange()))
  const st = M.decisionStats(todays)
  const spent = s.ledger.filter((e) => M.inRange(e.createdAt, todayRange())).reduce((a, e) => a + e.amount, 0)
  const pending = M.pendingLookback(s)

  return html`<div class="stack-l">
    <div>
      <div class="h1">今天</div>
      ${st.n ? html`<p class="sub">你今天做了 ${st.n} 个决定，平均用了 ${st.avgSec} 秒。</p>`
            : html`<p class="sub">今天还没有决定，从一个小事开始。</p>`}
    </div>

    <${DrawCard} />

    <button class="btn btn-p btn-l" onClick=${() => { S.route('resolve'); force(x => x + 1) }}>做一个决定</button>

    <div class="grid2">
      <button class="btn btn-s" onClick=${() => { S.route('quick'); force(x => x + 1) }}>快速了断小事</button>
      <button class="btn btn-s" onClick=${() => S.go('plan')}>今天要做的 3 件事</button>
    </div>

    ${st.n || spent ? html`<div class="card">
      <div class="row" style="justify-content:space-around">
        <${Stat} n=${st.n} l="今日决定" />
        <${Stat} n=${st.n ? Math.round(st.avgSec / 60) + ' 分' : '—'} l="平均耗时" />
        <${Stat} n=${spent ? M.fmt(spent) : '—'} l="今日花费" />
      </div>
    </div>` : null}

    ${pending.length ? html`<button class="card-quiet" style="text-align:left;width:100%" onClick=${() => S.route('lookback')}>
      <div class="row-b"><div class="h3">有 ${pending.length} 个决定等着回访</div><span style="color:var(--brand);display:flex">${Icon.back()}</span></div>
      <div class="mut" style="text-align:left">那个决定后来怎么样了？</div>
    </button>` : null}
  </div>`
}

const BINS = { do: '今天做什么', eat: '吃什么', play: '玩什么' }
const EMOJI = { do: '🎋', eat: '🍜', play: '🧭' }

function DrawCard() {
  const [bin, setBin] = useState('do')
  const [result, setResult] = useState(null)
  const [editing, setEditing] = useState(null)
  const [draft, setDraft] = useState('')
  const [, force] = useState(0)
  const list = M.load().bins[bin] || []

  if (editing) return html`<div class="card stack-s">
    <div class="row-b"><div class="h3">编辑「${BINS[editing]}」</div><button class="btn btn-g btn-sm" onClick=${() => setEditing(null)}>取消</button></div>
    <textarea class="fld" value=${draft} onInput=${(e) => setDraft(e.currentTarget.value)} placeholder="一行一个，换行分隔"></textarea>
    <button class="btn btn-p" onClick=${() => { M.setBin(editing, draft.split('\n')); setEditing(null); force(x => x + 1) }}>保存</button>
  </div>`

  return html`<div class="card-quiet stack-s">
    <div class="row-b"><div class="h2">摇一签</div><button class="btn btn-g btn-sm" onClick=${() => { setEditing(bin); setDraft(list.join('\n')) }}>${Icon.plus} 编辑</button></div>
    <div class="mut">选不出的时候，让签筒替你决定。摇完就忘，不留记录。</div>
    <div class="chip-row" style="margin-top:4px">
      ${Object.keys(BINS).map((k) => html`<button key=${k} class="chip" aria-pressed=${bin === k} onClick=${() => { setBin(k); setResult(null) }}>${BINS[k]}</button>`)}
    </div>
    <div class="urn ${result ? '' : ''}" style="margin-top:6px">
      <div class="urn-icon">${EMOJI[bin]}</div>
      <div class="urn-res">${result || (list.length ? '还没摇' : '签筒是空的，去编辑')}</div>
      <div class="urn-hint">${result ? '就这样，别再想了' : '点下方摇一次'}</div>
    </div>
    <button class="btn btn-s" style="width:100%" disabled=${!list.length} onClick=${() => setResult(M.draw(bin))}>摇一次</button>
  </div>`
}

/* ================= 快判 ================= */
export function Quick() {
  const [text, setText] = useState('')
  const [saved, setSaved] = useState(false)
  if (saved) return html`<div class="stack-l">
    <div><h1 class="h1">记下了</h1><p class="sub">这种小事，不值得多想。</p></div>
    <button class="btn btn-p btn-l" onClick=${() => S.go('today')}>回到今天</button>
  </div>`
  return html`<div class="stack-l">
    <div><button class="btn btn-g btn-sm" onClick=${() => S.back()}>${Icon.back()} 返回</button></div>
    <div><h1 class="h1">快速了断</h1><p class="sub">小事不倒计时。记下来，然后放过它。</p></div>
    <${Field} label="在纠结什么？" value=${text} onInput=${setText} placeholder="比如：要不要回这条消息" max=${60} />
    <button class="btn btn-p btn-l" disabled=${!text.trim()} onClick=${() => {
      M.commit((s) => { s.urges = s.urges || []; s.urges.push({ id: M.uid(), text: text.trim(), createdAt: Date.now() }) })
      setSaved(true)
    }}>记下来，放过它</button>
  </div>`
}

/* ================= 了断（大决定） ================= */
export function Resolve() {
  const [step, setStep] = useState(0)
  const [desc, setDesc] = useState('')
  const [src, setSrc] = useState(3)
  const [min, setMin] = useState(5)
  const [conf, setConf] = useState(5)
  const [worry, setWorry] = useState('')
  const [start, setStart] = useState(0)

  if (step === 0) return html`<div class="stack-l">
    <div><button class="btn btn-g btn-sm" onClick=${() => S.back()}>${Icon.back()} 返回</button></div>
    <div><h1 class="h1">这是个什么决定？</h1><p class="sub">写一行字。别写小作文。</p></div>
    <${Field} value=${desc} onInput=${setDesc} placeholder="比如：要不要给前同事发个微信…" max=${80} />
    <${Stepper} label="信息来源上限" value=${src} onChange=${setSrc} min=${1} max=${6} suffix=" 个" />
    <div><div class="lbl">时间预算</div><${Seg} items=${['2 分钟', '5 分钟', '15 分钟', '30 分钟']} value=${min + ' 分钟'} onPick=${(v) => setMin(parseInt(v))} /></div>
    <button class="btn btn-p btn-l" disabled=${!desc.trim()} onClick=${() => { setStart(Date.now()); setStep(1) }}>开始倒计时</button>
  </div>`

  if (step === 1) return html`<${Countdown} min=${min} desc=${desc} onDone=${() => setStep(2)} onAbort=${() => setStep(0)} />`

  return html`<div class="stack-l">
    <div><h1 class="h1">这就够了</h1><p class="sub">决定已记下。三天后我会问你这事怎么样。</p></div>
    <${Stepper} label="当时的信心" value=${conf} onChange=${setConf} min=${1} max=${10} />
    <${Field} label="最担心什么？" value=${worry} onInput=${setWorry} placeholder="比如：怕被拒绝" max=${40} />
    <button class="btn btn-p btn-l" onClick=${() => {
      M.addDecision({ description: desc.trim(), budgetTimeMin: min, sourcesLimit: src, startedAt: start, submittedAt: Date.now(), confidence: conf, worry: worry.trim() })
      toast('已记下'); S.go('today')
    }}>保存</button>
  </div>`
}

function Countdown({ min, desc, onDone, onAbort }) {
  const [start] = useState(() => Date.now())
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  const left = Math.max(0, min * 60 - Math.floor((now - start) / 1000))
  const mm = String(Math.floor(left / 60)).padStart(2, '0')
  const ss = String(left % 60).padStart(2, '0')
  return html`<div class="stack-l" style="text-align:center;padding-top:36px">
    <div class="h2" style="color:var(--ink-600)">预算耗尽就提交</div>
    <p class="sub">"${desc}"</p>
    <div class="num" style="font-size:64px;font-weight:600;letter-spacing:-.03em;margin:22px 0">${mm}:${ss}</div>
    <p class="mut">深呼吸——这已经够了</p>
    ${left <= 0 ? html`<div class="tag tag-b" style="margin-top:10px">预算到了</div>` : null}
    <div class="stack-s" style="margin-top:26px">
      <button class="btn btn-p btn-l" onClick=${onDone}>就是它了</button>
      <button class="btn btn-g" onClick=${onAbort}>重来</button>
    </div>
  </div>`
}

/* ================= 规划 ================= */
export function Plan() {
  const [tab, setTab] = useState(S.sub === 'big' ? 'big' : 'small')
  const today = M.dayKey(), week = M.weekKey()
  const s = M.load()
  return html`<div class="stack-l">
    <div><h1 class="h1">规划</h1><p class="sub">只填三件。填不进去，本身就是答案。</p></div>
    <${Seg} items=${['小规划', '大规划']} value=${tab === 'small' ? '小规划' : '大规划'} onPick=${(v) => { S.sub(v === '小规划' ? '' : 'big'); setTab(v === '小规划' ? 'small' : 'big') }} />
    ${tab === 'small'
      ? html`<div class="stack-l">
          <${PlanList} title="今天" items=${s.plans.filter((p) => p.date === today)} date=${today} />
          <${PlanList} title="本周" items=${s.plans.filter((p) => p.date === week)} date=${week} />
        </div>`
      : html`<${Goals} />`}
  </div>`
}

function PlanList({ title, items, date }) {
  const [text, setText] = useState('')
  const full = items.length >= 3
  return html`<div class="card">
    <div class="row-b" style="margin-bottom:12px"><div class="h2">${title}</div><span class="mut num">${items.filter((i) => i.done).length}/${items.length}</span></div>
    ${items.length ? html`<div class="list">
      ${items.map((p) => html`<div class="row" key=${p.id}>
        <button class="chip" style="width:28px;height:28px;justify-content:center;padding:0;border-radius:7px;flex-shrink:0;background:${p.done ? 'var(--brand)' : 'var(--ink-100)'};color:${p.done ? '#fff' : 'var(--ink-400)'}" onClick=${() => { M.togglePlan(p.id) }}>
          ${p.done ? Icon.check() : ''}
        </button>
        <div style="flex:1" class=${p.done ? 'li mut' : 'li'}><div class="li-t">${p.text}</div></div>
      </div>`)}
    </div>` : html`<div class="mut">还没有计划。</div>`}
    <div style="margin-top:12px">
      ${full ? html`<div class="mut">已经三件了。今天够了。</div>`
        : html`<div class="row"><input class="fld" value=${text} onInput=${(e) => setText(e.currentTarget.value)} placeholder="加一件…" max=${40} />
          <button class="btn btn-s" disabled=${!text.trim()} onClick=${() => { M.addPlan(text.trim(), date); setText('') }}>${Icon.plus}</button></div>`}
    </div>
  </div>`
}

function Goals() {
  const s = M.load()
  const [text, setText] = useState('')
  const [hz, setHz] = useState('季度')
  return html`<div class="stack-l">
    <div class="card-quiet"><div class="h3">大规划不打勾</div><div class="mut">只记「围绕它做过的决定」。看得见走了多远，比一个进度条诚实。</div></div>
    ${s.goals.map((g) => {
      const rel = M.goalDecisions(g)
      return html`<div class="card" key=${g.id}>
        <div class="row-b"><div class="h3">${g.text}</div><button class="btn btn-g btn-sm" onClick=${() => M.removeGoal(g.id)}>${Icon.trash()}</button></div>
        <div class="mut">${g.horizon} · 围绕它做过 ${rel.length} 个决定</div>
        ${rel.length ? html`<div class="list" style="margin-top:10px">${rel.slice(-3).map((d) => html`<div class="li" key=${d.id}><div class="li-t">${d.description}</div></div>`)}</div>` : null}
      </div>`
    })}
    <div class="card">
      <${Field} value=${text} onInput=${setText} placeholder="比如：今年想去一次北欧" max=${40} />
      <div style="margin-top:10px"><${Seg} items=${['季度', '年度']} value=${hz} onPick=${setHz} /></div>
      <button class="btn btn-p" style="margin-top:12px;width:100%" disabled=${!text.trim()} onClick=${() => { M.addGoal(text.trim(), hz); setText('') }}>加入大规划</button>
    </div>
  </div>`
}

/* ================= 账本 ================= */
export function Ledger() {
  const [amount, setAmount] = useState('')
  const [cat, setCat] = useState(M.CATS[0])
  const [note, setNote] = useState('')
  const s = M.load()
  const now = new Date()
  const mk = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0')
  const thisMonth = s.ledger.filter((e) => {
    const d = new Date(e.createdAt)
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') === mk
  })
  const st = M.ledgerStats(thisMonth)
  const recent = s.ledger.slice().sort((a, b) => b.createdAt - a.createdAt).slice(0, 8)

  return html`<div class="stack-l">
    <div><h1 class="h1">账本</h1><p class="sub">只记大的，和犹豫过的。两下点击完成。</p></div>
    <div class="card">
      <div class="row" style="align-items:flex-end;gap:10px">
        <div style="flex:1"><label class="lbl">金额</label><input class="fld" type="number" inputmode="decimal" value=${amount} onInput=${(e) => setAmount(e.currentTarget.value)} placeholder="0" /></div>
        <div style="flex:1"><label class="lbl">分类</label><select class="fld" value=${cat} onChange=${(e) => setCat(e.currentTarget.value)}>${M.CATS.map((c) => html`<option key=${c}>${c}</option>`)}</select></div>
      </div>
      <div style="margin-top:10px"><${Field} placeholder="一句话（可选）" value=${note} onInput=${setNote} max=${30} /></div>
      <button class="btn btn-p" style="margin-top:12px;width:100%" disabled=${!amount} onClick=${() => { M.addEntry(amount, cat, note); setAmount(''); setNote(''); toast('已记下') }}>记一笔</button>
    </div>
    ${thisMonth.length ? html`<div class="card">
      <div class="row-b"><div class="h2">本月</div><div class="num" style="font-weight:600">${M.fmt(st.total)}</div></div>
      <div style="margin-top:14px"><${Bars} rows=${st.top.map(([c, v]) => [c, v, M.fmt(v), 0, M.COLOR[c]])} /></div>
    </div>` : null}
    ${recent.length ? html`<div class="card">
      <div class="h2" style="margin-bottom:12px">最近</div>
      <div class="list">
        ${recent.map((e) => html`<div class="row-b" key=${e.id}>
          <div><div class="li-t">${e.note || e.cat}</div><div class="li-m">${new Date(e.createdAt).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}</div></div>
          <div class="row"><span class="tag" style="background:${M.COLOR[e.cat]}1A;color:${M.COLOR[e.cat]}">${e.cat}</span><span class="num" style="font-weight:600">${M.fmt(e.amount)}</span></div>
        </div>`)}
      </div>
    </div>` : html`<${Empty} t="还没有记录" d="记第一笔大的，或者犹豫过的。" />`}
  </div>`
}

/* ================= 复盘 / 报表 ================= */
export function Review() {
  const [kind, setKind] = useState(['week', 'month', 'year'].includes(S.sub) ? S.sub : 'week')
  const [off, setOff] = useState(0)
  const [card, setCard] = useState('')
  const rep = M.buildReport(kind, off)
  const name = kind === 'week' ? '周报' : kind === 'month' ? '月报' : '年报'

  return html`<div class="stack-l">
    <div><h1 class="h1">${name}</h1><p class="sub">${rep.r.label}${off ? '（历史）' : ''}</p></div>
    <div class="row-b">
      <${Seg} items=${['周报', '月报', '年报']} value=${name} onPick=${(v) => { const k = v === '周报' ? 'week' : v === '月报' ? 'month' : 'year'; S.sub(k === 'week' ? '' : k); setKind(k); setOff(0) }} />
      <div class="row" style="gap:6px">
        <button class="chip" style="width:30px;justify-content:center" onClick=${() => setOff(off - 1)}>−</button>
        <button class="chip" style="width:30px;justify-content:center" disabled=${off >= 0} onClick=${() => setOff(off + 1)}>+</button>
      </div>
    </div>

    <div class="card"><div class="row" style="justify-content:space-around">
      <${Stat} n=${rep.dstat.n} l="决定" />
      <${Stat} n=${rep.dstat.thought ? rep.dstat.thought + ' 分' : '—'} l="纠结时长" />
      <${Stat} n=${rep.ans.length ? Math.round(rep.bad / rep.ans.length * 100) + '%' : '—'} l="担忧成真" />
    </div></div>

    ${rep.ans.length ? html`<div class="card">
      <div class="h2">你的担忧，成真率</div>
      <div class="num" style="font-size:30px;font-weight:600;margin:8px 0">${Math.round(rep.bad / rep.ans.length * 100)}%</div>
      <p class="mut">${rep.worried} 次你担心的事没有发生，${rep.bad} 次发生了。</p>
    </div>` : html`<div class="card"><${Empty} t="还没有回访" d="决定提交三天后回来填。" /></div>`}

    ${rep.lstat.count ? html`<div class="card">
      <div class="row-b"><div class="h2">钱</div><div class="num" style="font-weight:600">${M.fmt(rep.lstat.total)}</div></div>
      <div style="margin-top:12px"><${Bars} rows=${rep.lstat.top.map(([c, v]) => [c, v, M.fmt(v), 0, M.COLOR[c]])} /></div>
    </div>` : null}

    ${rep.pstat.total ? html`<div class="card">
      <div class="row-b"><div class="h2">计划</div><div class="num" style="font-weight:600">${rep.pstat.done}/${rep.pstat.total}</div></div>
    </div>` : null}

    ${rep.hourTop ? html`<div class="card">
      <div class="h2">你最容易纠结的时刻</div>
      <p class="mut">${rep.hourTop.h}:00 前后，你做了 ${rep.hourTop.n} 个决定。</p>
    </div>` : null}

    ${kind === 'year' ? html`<button class="btn btn-p btn-l" disabled=${!hasYearData(rep)} onClick=${() => setCard(drawYearCard(rep, new Date().getFullYear()).toDataURL('image/png'))}>生成分享图</button>` : null}

    ${card ? html`<${Modal} title="你的年度卡片" onClose=${() => setCard('')}>
      <img src=${card} alt="年度卡片" style="width:100%;border-radius:12px;border:1px solid var(--ink-200);display:block" />
      <div class="mut" style="margin:12px 0 14px">这张卡可以直接发到小红书 / 朋友圈。</div>
      <button class="btn btn-p btn-l" onClick=${() => downloadCard(M.buildReport('year', off), new Date().getFullYear())}>下载 PNG</button>
    </${Modal}>` : null}
  </div>`
}

/* ================= 回访 ================= */
export function Lookback() {
  const list = M.pendingLookback()
  const [, force] = useState(0)
  if (!list.length) return html`<div class="stack-l">
    <div><button class="btn btn-g btn-sm" onClick=${() => S.back()}>${Icon.back()} 返回</button></div>
    <div><h1 class="h1">回访</h1><p class="sub">还没有等着你的决定。</p></div>
  </div>`
  const d = list[0]
  return html`<div class="stack-l">
    <div><button class="btn btn-g btn-sm" onClick=${() => S.back()}>${Icon.back()} 返回</button></div>
    <div><h1 class="h1">那个决定后来怎么样了？</h1><p class="sub">还有 ${list.length} 个等着回访</p></div>
    <div class="card-quiet"><div class="h3">${d.description}</div>${d.worry ? html`<div class="mut" style="margin-top:4px">你当时担心：${d.worry}</div>` : null}</div>
    <div><div class="lbl">你担心的事发生了吗？</div><${Seg} items=${['没发生', '部分发生', '成真了']} value=${null} onPick=${(v) => {
      M.resolveDecision(d.id, { resolved: true, concern: v === '成真了' ? 'yes' : v === '部分发生' ? 'part' : 'no' })
      toast(v === '成真了' ? '已记录' : '又少操心了几天')
      force(x => x + 1)
    }} /></div>
  </div>`
}

/* ================= 我的 ================= */
export function Me() {
  const s = M.load()
  const [confirm, setConfirm] = useState(false)
  const n = s.decisions.length + (s.plans || []).length + s.ledger.length
  return html`<div class="stack-l">
    <div><h1 class="h1">我的</h1><p class="sub">数据在你手里。</p></div>
    <div class="card"><div class="row" style="justify-content:space-around">
      <${Stat} n=${s.decisions.length} l="决定" />
      <${Stat} n=${(s.plans || []).length} l="计划" />
      <${Stat} n=${s.ledger.length} l="记账" />
    </div></div>
    <div class="card stack-s">
      <div class="row-b"><span class="h3">数据存储</span><span class="tag tag-b">本机</span></div>
      <div class="mut">不联网、不需要账号、不上传。共 ${n} 条记录。</div>
    </div>
    <div class="card stack-s">
      <button class="btn btn-s" style="width:100%" onClick=${() => {
        const blob = new Blob([M.exportJSON()], { type: 'application/json' })
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob); a.download = 'enough-data.json'; a.click()
        toast('已导出')
      }}>导出全部数据（JSON）</button>
      ${confirm ? html`<button class="btn btn-s" style="width:100%;color:var(--danger)" onClick=${() => { M.clearAll(); setConfirm(false); toast('已清空'); S.go('today') }}>确认清空，不可恢复</button>`
        : html`<button class="btn btn-s" style="width:100%;color:var(--danger)" onClick=${() => setConfirm(true)}>清空所有数据</button>`}
    </div>
    <div class="card-quiet"><div class="mut">Enough · Web MVP · ${new Date().getFullYear()}</div></div>
  </div>`
}