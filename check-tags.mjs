import fs from 'node:fs'

const OK = new Set(('a abbr address area article aside audio b base bdi bdo blockquote body br button canvas caption cite code col colgroup data datalist dd del details dfn dialog div dl dt em embed fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 head header hgroup hr html i iframe img input ins kbd label legend li link main map mark menu meta meter nav noscript object ol optgroup option output p param picture pre progress q rp rt ruby s samp script section select slot small source span strong style sub summary sup table tbody td template textarea tfoot th thead time title tr track u ul var video wbr svg path rect circle line polyline polygon g defs text tspan marker linearGradient radialGradient stop clipPath mask pattern use symbol image foreignObject')
  .split(' '))

const files = process.argv.slice(2)
let bad = 0

for (const file of files) {
  const dom = fs.readFileSync(file, 'utf8')
  const found = new Map()
  for (const m of dom.matchAll(/<([a-zA-Z][a-zA-Z0-9-]*)/g)) {
    const tag = m[1]
    const lower = tag.toLowerCase()
    if (OK.has(lower)) continue
    // 允许 svg camelCase 保留标签
    if (OK.has(tag)) continue
    if (/^[a-z]+$/.test(lower) && !/[A-Z}]/.test(tag)) continue
    found.set(tag, (found.get(tag) || 0) + 1)
  }
  const list = [...found.entries()]
  if (list.length) {
    bad++
    console.log('FAIL ' + file.split(/[\\/]/).pop())
    for (const [t, n] of list) console.log('     未解析标签 <' + t + '>  x' + n)
  } else {
    console.log('PASS ' + file.split(/[\\/]/).pop() + '  无未解析标签')
  }
}

console.log(bad ? '\n发现 ' + bad + ' 个文件有未解析标签' : '\n全部通过')
process.exit(bad ? 1 : 0)