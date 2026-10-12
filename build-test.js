import { build } from 'esbuild'
import fs from 'node:fs'

const js = await build({
  entryPoints: ['devtest/render-all.js'],
  bundle: true, format: 'iife', target: 'es2019', minify: false, write: false, outfile: 'out.js'
})
const css = await build({
  entryPoints: ['src/styles.css'],
  bundle: true, minify: false, write: false, outfile: 'out.css'
})

let jsText = '', cssText = ''
for (const f of js.outputFiles) jsText = f.text
for (const f of css.outputFiles) cssText = f.text

fs.mkdirSync('dist', { recursive: true })
fs.writeFileSync('dist/test-all.js', jsText)
fs.writeFileSync('dist/test-all.css', cssText)
fs.writeFileSync('dist/test-all.html', `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>test</title><link rel="stylesheet" href="test-all.css"></head><body><div id="root"></div><script src="test-all.js"></script></body></html>`)

const now = Date.now()
const D = 864e5
const seedJs = `var now=${now}, D=${D};
var seed={v:1,onboarded:true,
decisions:[
{id:'d1',description:'要不要换工作',budgetTimeMin:15,sourcesLimit:3,startedAt:now-4*D-900e3,submittedAt:now-4*D-600e3,confidence:4,worry:'怕适应不了',resolved:true,concern:'no'},
{id:'d2',description:'买不买那台显示器',budgetTimeMin:5,sourcesLimit:2,startedAt:now-2*D-400e3,submittedAt:now-2*D-100e3,confidence:7,worry:'怕浪费钱',resolved:true,concern:'part'},
{id:'d3',description:'要不要给前同事发消息',budgetTimeMin:2,sourcesLimit:1,startedAt:now-3*D,submittedAt:now-3*D,confidence:6,worry:'怕被拒绝',resolved:false}],
urges:[],plans:[{id:'p1',text:'写完周报',date:'',done:false,createdAt:now}],
goals:[{id:'g1',text:'今年换城市',horizon:'年度',createdAt:now-30*D}],
ledger:[{id:'e1',amount:1299,cat:'娱乐',note:'显示器',createdAt:now-2*D},{id:'e2',amount:38,cat:'小吃',note:'午饭',createdAt:now-D}],
bins:{do:['出门走走','整理桌面','读 20 页书'],eat:['面','饺子'],play:['散步','发呆']}};
localStorage.setItem('enough.v1',JSON.stringify(seed));
location.replace('index.html'+(location.hash||'#/today'));`

fs.writeFileSync('dist/seed.html', `<!doctype html><html><head><meta charset="utf-8"><title>seed</title></head><body><script>${seedJs}</script></body></html>`)
console.log('test bundle ready (含 seed.html)')