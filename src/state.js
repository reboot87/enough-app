const TABS = ['today', 'plan', 'ledger', 'review', 'me']
const ROUTES = ['resolve', 'quick', 'lookback']

export function parseHash() {
  const raw = (location.hash || '').replace(/^#\/?/, '')
  const seg = raw.split('/').filter(Boolean)
  let tab = seg[0] || 'today'
  if (!TABS.includes(tab) && !ROUTES.includes(tab)) tab = 'today'
  return { tab, sub: seg[1] || '', id: seg[2] || '' }
}

export const S = {
  tab: 'today',
  sub: '',
  id: '',
  params: {},
  toast: '',
  rerender: () => {},

  go(tab) {
    location.hash = '#/' + tab
  },
  route(name) {
    location.hash = '#/' + name
  },
  sub(sub) {
    location.hash = '#/' + S.tab + (sub ? '/' + sub : '')
  },

  sync() {
    const h = parseHash()
    const changedTab = h.tab !== S.tab || h.sub !== S.sub || h.id !== S.id
    S.tab = h.tab
    S.sub = h.sub
    S.id = h.id
    if (changedTab) S.params = {}
    S.rerender()
  },

  init() {
    if (!location.hash) location.replace('#/today')
    S.sync()
    window.addEventListener('hashchange', () => S.sync())
  },

  back(fallback = 'today') {
    if (history.length > 1) history.back()
    else S.go(fallback)
  }
}

let toastTimer = null
export function toast(msg) {
  S.toast = msg
  S.rerender()
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    S.toast = ''
    S.rerender()
  }, 1600)
}