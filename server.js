import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.join(process.cwd(), 'dist')
const PORT = process.env.PORT || 5180
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json' }

http.createServer((req, res) => {
  const url = req.url.split('?')[0]
  const file = url === '/' ? 'index.html' : url.slice(1)
  const p = path.join(ROOT, file)
  if (!p.startsWith(ROOT) || !fs.existsSync(p)) {
    res.writeHead(404); res.end('not found'); return
  }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' })
  fs.createReadStream(p).pipe(res)
}).listen(PORT, '127.0.0.1', () => console.log('http://127.0.0.1:' + PORT))