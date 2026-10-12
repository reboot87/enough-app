import { h, render } from 'preact'
import htm from 'htm'
import { S } from './state.js'
import { load } from './model.js'
import { Tabs, Icon } from './ui.js'
import * as V from './views.js'

const html = htm.bind(h)

const SUB_ROUTES = { resolve: V.Resolve, quick: V.Quick, lookback: V.Lookback }
const TAB_VIEWS = { today: V.Today, plan: V.Plan, ledger: V.Ledger, review: V.Review, me: V.Me }

const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1)

function Shell() {
  const s = load()
  if (!s.onboarded) return html`<${V.Onboard} />`

  const Sub = SUB_ROUTES[S.tab]
  const isTab = !Sub
  const View = isTab ? TAB_VIEWS[S.tab] : Sub

  return html`<div class="shell">
    <header class="topbar"><div class="topbar-in">
      ${isTab
        ? html`<div class="brand">Enough<span>${S.tab === 'me' ? '设置' : ''}</span></div>`
        : html`<button class="btn btn-g btn-sm" onClick=${() => S.back()}>${Icon.back()} 返回</button>`}
      <div></div>
    </div></header>

    <main class="main fade-in" key=${S.tab + '/' + S.sub}>
      ${View ? html`<${View} />` : null}
    </main>

    ${isTab ? html`<${Tabs} />` : null}
    ${S.toast ? html`<div class="toast">${S.toast}</div>` : null}
  </div>`
}

export function mount(root) {
  S.rerender = () => render(html`<${Shell} />`, root)
  S.init()
  S.rerender()
}