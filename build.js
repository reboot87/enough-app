import { build, context } from 'esbuild'

const opts = {
  entryPoints: ['src/main.js'],
  bundle: true,
  format: 'iife',
  target: 'es2019',
  minify: !process.argv.includes('--watch'),
  write: false,
  outfile: 'dist/app.js',
  define: { 'process.env.NODE_ENV': '"production"' }
}

const css = {
  entryPoints: ['src/styles.css'],
  bundle: true,
  minify: !process.argv.includes('--watch'),
  write: false,
  outfile: 'dist/app.css'
}

async function run() {
  const t0 = Date.now()
  const [js, sheet] = await Promise.all([build(opts), build(css)])

  let jsSize = 0
  let cssSize = 0
  let jsText = ''
  let cssText = ''

  for (const f of js.outputFiles) {
    jsSize = f.contents.length
    jsText = f.text
  }
  for (const f of sheet.outputFiles) {
    cssSize = f.contents.length
    cssText = f.text
  }

  const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#4F46E5">
<title>Enough — 你的决定，本来就已经够好了</title>
<meta name="description" content="给纠结一个预算。到点就够好了。">
<link rel="stylesheet" href="app.css">
</head>
<body><div id="root"></div><script src="app.js"></script></body>
</html>`

  const fs = await import('node:fs')
  fs.rmSync('dist', { recursive: true, force: true })
  fs.mkdirSync('dist', { recursive: true })
  fs.writeFileSync('dist/app.js', jsText)
  fs.writeFileSync('dist/app.css', cssText)
  fs.writeFileSync('dist/index.html', html)

  const kb = (n) => (n / 1024).toFixed(1) + ' KB'
  console.log(`built in ${Date.now() - t0}ms  js=${kb(jsSize)}  css=${kb(cssSize)}  total=${kb(jsSize + cssSize)}`)
}

if (process.argv.includes('--watch')) {
  const c = await context({ ...opts, plugins: [] })
  const c2 = await context(css)
  await c.watch()
  await c2.watch()
  console.log('watching...')
} else {
  await run()
}