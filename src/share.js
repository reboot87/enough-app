import * as M from './model.js'

const W = 1080
const H = 1280
const PAD = 88

const FONT = '"PingFang SC","Microsoft YaHei","Segoe UI",system-ui,sans-serif'

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function wrap(ctx, text, x, y, maxW, lh) {
  let line = ''
  let yy = y
  for (const ch of text) {
    if (ch === '\n') { ctx.fillText(line, x, yy); line = ''; yy += lh; continue }
    if (ctx.measureText(line + ch).width > maxW && line) {
      ctx.fillText(line, x, yy); line = ch; yy += lh
    } else line += ch
  }
  if (line) ctx.fillText(line, x, yy)
  return yy + lh
}

export function hasYearData(rep) {
  return rep.dec.length > 0 || rep.led.length > 0
}

export function drawYearCard(rep, year) {
  const cv = document.createElement('canvas')
  cv.width = W
  cv.height = H
  const c = cv.getContext('2d')

  c.fillStyle = '#F8FAFC'
  c.fillRect(0, 0, W, H)

  c.fillStyle = '#4F46E5'
  c.fillRect(0, 0, W, 14)

  let y = PAD + 30

  c.fillStyle = '#0F172A'
  c.font = `600 46px ${FONT}`
  c.textBaseline = 'top'
  c.fillText('Enough', PAD, y)
  c.fillStyle = '#94A3B8'
  c.font = `400 30px ${FONT}`
  c.fillText(String(year), PAD + 210, y + 12)

  y += 110
  c.fillStyle = '#0F172A'
  c.font = `600 76px ${FONT}`
  c.fillText(year + ' 年的决定报告', PAD, y)

  y += 132
  c.strokeStyle = '#E2E8F0'
  c.lineWidth = 2
  c.beginPath(); c.moveTo(PAD, y); c.lineTo(W - PAD, y); c.stroke()

  y += 56
  const d = rep.dstat
  const hrs = Math.round((d.thought / 60) * 10) / 10
  const cards = [
    [String(d.n), '个决定'],
    [hrs >= 1 ? hrs + ' 小时' : d.thought + ' 分钟', '花在纠结上'],
    [rep.ans.length ? Math.round(rep.bad / rep.ans.length * 100) + '%' : '—', '担忧成真率']
  ]
  const cw = (W - PAD * 2 - 32) / 3
  cards.forEach((it, i) => {
    const x = PAD + i * (cw + 16)
    c.fillStyle = '#FFFFFF'
    roundRect(c, x, y, cw, 200, 22)
    c.fill()
    c.strokeStyle = '#E2E8F0'; c.lineWidth = 2; c.stroke()
    c.fillStyle = '#0F172A'
    c.font = `600 60px ${FONT}`
    c.textAlign = 'center'
    c.fillText(it[0], x + cw / 2, y + 48)
    c.fillStyle = '#94A3B8'
    c.font = `400 26px ${FONT}`
    c.fillText(it[1], x + cw / 2, y + 128)
    c.textAlign = 'left'
  })

  y += 268
  c.fillStyle = '#0F172A'
  c.font = `600 46px ${FONT}`
  const headline = rep.ans.length
    ? '你最担心的事，只有 ' + rep.bad + ' 件成真。'
    : '这一年，你还没有回访过。'
  y = wrap(c, headline, PAD, y, W - PAD * 2, 64)

  y += 18
  c.fillStyle = '#475569'
  c.font = `400 32px ${FONT}`
  const part = rep.ans.length - rep.bad - rep.worried
  const sub = !rep.ans.length
    ? '决定提交三天后回来填一句，就能看到你的担心有多少成真。'
    : rep.worried + ' 次担心的事根本没有发生' + (part > 0 ? '，' + part + ' 次只发生了一部分。' : '。')
  y = wrap(c, sub, PAD, y, W - PAD * 2, 48)

  if (rep.lstat.count) {
    y += 44
    c.fillStyle = '#0F172A'
    c.font = `600 34px ${FONT}`
    c.fillText('这一年花了 ' + M.fmt(rep.lstat.total), PAD, y)
    y += 60
    c.fillStyle = '#94A3B8'
    c.font = `400 26px ${FONT}`
    c.fillText(rep.lstat.top.slice(0, 3).map(([k, v]) => k + ' ' + M.fmt(v)).join('   ·   '), PAD, y)
  }

  c.fillStyle = '#94A3B8'
  c.font = `400 26px ${FONT}`
  c.fillText('那些没发生的，操心的时间白花了。', PAD, H - PAD - 40)
  c.fillStyle = '#4F46E5'
  c.font = `500 26px ${FONT}`
  c.fillText('Enough · 你的决定，本来就已经够好了', PAD, H - PAD + 2)

  return cv
}

export function downloadCard(rep, year) {
  const cv = drawYearCard(rep, year)
  cv.toBlob((blob) => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'enough-' + year + '.png'
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }, 'image/png')
}