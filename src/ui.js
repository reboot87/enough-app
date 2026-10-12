import { h } from 'preact'
import htm from 'htm'
import { S } from './state.js'

const html = htm.bind(h)

const SVG = { fill: 'none', stroke: 'currentColor', 'stroke-width': 1.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }

export const Icon = {
  today: () => html`<svg viewBox="0 0 24 24" ...${SVG}><path d="M3 10.5 12 4l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>`,
  plan: () => html`<svg viewBox="0 0 24 24" ...${SVG}><rect x="3.5" y="5" width="17" height="16" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>`,
  book: () => html`<svg viewBox="0 0 24 24" ...${SVG}><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H19v16H5.5A1.5 1.5 0 0 1 4 18.5z"/><path d="M8 4v16"/></svg>`,
  review: () => html`<svg viewBox="0 0 24 24" ...${SVG}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>`,
  me: () => html`<svg viewBox="0 0 24 24" ...${SVG}><circle cx="12" cy="8" r="3.6"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/></svg>`,
  check: () => html`<svg viewBox="0 0 24 24" ...${SVG} width="14" height="14"><path d="M5 12.5 9.5 17 19 7.5"/></svg>`,
  plus: () => html`<svg viewBox="0 0 24 24" ...${SVG} width="13" height="13"><path d="M12 5v14M5 12h14"/></svg>`,
  back: () => html`<svg viewBox="0 0 24 24" ...${SVG} width="18" height="18"><path d="M14 6l-6 6 6 6"/></svg>`,
  trash: () => html`<svg viewBox="0 0 24 24" ...${SVG} width="13" height="13"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/></svg>`
}

export const Tabs = () => {
  const items = [
    { id: 'today', label: '今天', I: Icon.today },
    { id: 'plan', label: '规划', I: Icon.plan },
    { id: 'ledger', label: '账本', I: Icon.book },
    { id: 'review', label: '复盘', I: Icon.review },
    { id: 'me', label: '我的', I: Icon.me }
  ]
  return html`<nav class="tabbar"><div class="tabbar-in">
    ${items.map((t) => html`<button class="tab" aria-current=${S.tab === t.id} onClick=${() => S.go(t.id)}>
      <${t.I} /><span>${t.label}</span>
    </button>`)}
  </div></nav>`
}

export const Stat = ({ n, l }) => html`<div class="stat"><div class="stat-n num">${n}</div><div class="stat-l">${l}</div></div>`

export const Bars = ({ rows }) => {
  const max = Math.max(...rows.map((r) => r[1]), 1)
  return html`<div class="bars">
    ${rows.map((r) => html`<div class="bar">
      <span style="color:var(--ink-600)">${r[0]}</span>
      <span class="bar-track"><span class="bar-fill" style=${`width:${Math.max(6, (r[1] / max) * 100)}%;background:${r[4] || 'var(--brand)'}`}></span></span>
      <span class="bar-v">${r[2]}</span>
    </div>`)}
  </div>`
}

export const Empty = ({ t, d }) => html`<div class="empty"><div class="empty-t">${t}</div>${d ? html`<div class="empty-d">${d}</div>` : null}</div>`

export const Modal = ({ title, onClose, children }) => html`<div class="fade-in" style="position:fixed;inset:0;z-index:50;background:rgba(15,23,42,.34);display:flex;align-items:flex-end;justify-content:center" onClick=${(e) => { if (e.target === e.currentTarget) onClose() }}>
  <div style="width:100%;max-width:430px;background:var(--surface);border-radius:18px 18px 0 0;padding:20px 18px calc(20px + env(safe-area-inset-bottom));max-height:86vh;overflow:auto">
    <div class="row-b" style="margin-bottom:14px"><div class="h2">${title}</div><button class="btn btn-g btn-sm" onClick=${onClose}>关闭</button></div>
    ${children}
  </div>
</div>`

export const Field = ({ label, value, onInput, placeholder, type = 'text', max, inputmode }) => html`<div>
  ${label ? html`<label class="lbl">${label}</label>` : null}
  <input class="fld" type=${type} value=${value} inputmode=${inputmode} maxlength=${max} placeholder=${placeholder}
    onInput=${(e) => onInput(e.currentTarget.value)} />
</div>`

export const Stepper = ({ label, value, onChange, min = 1, max = 10, suffix = '' }) => html`<div class="row-b">
  <span class="h3">${label}</span>
  <div class="row" style="gap:6px">
    <button class="chip" style="width:32px;justify-content:center" onClick=${() => onChange(Math.max(min, value - 1))}>−</button>
    <span class="num" style="min-width:34px;text-align:center;font-weight:600">${value}${suffix}</span>
    <button class="chip" style="width:32px;justify-content:center" onClick=${() => onChange(Math.min(max, value + 1))}>+</button>
  </div>
</div>`

export const Seg = ({ items, value, onPick }) => html`<div class="chip-row">
  ${items.map((i) => html`<button key=${i} class="chip" aria-pressed=${value === i} onClick=${() => onPick(i)}>${i}</button>`)}
</div>`