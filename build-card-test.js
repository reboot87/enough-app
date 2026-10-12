import { build } from 'esbuild'
import fs from 'node:fs'

const js = await build({
  entryPoints: ['devtest/card-test.js'],
  bundle: true, format: 'iife', target: 'es2019', minify: false, write: false, outfile: 'o.js'
})
let jsText = ''
for (const f of js.outputFiles) jsText = f.text

fs.writeFileSync('dist/card-test.js', jsText)
fs.writeFileSync('dist/card-test.html', `<!doctype html><html><head><meta charset="utf-8"></head><body><script src="card-test.js"></script></body></html>`)
console.log('card test ready')