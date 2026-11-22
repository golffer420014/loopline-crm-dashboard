// Headless Chrome over CDP (no puppeteer): node capture.mjs <baseUrl> <outDir>
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const [base, out] = process.argv.slice(2)
mkdirSync(out, { recursive: true })
const PORT = 9333
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new', `--remote-debugging-port=${PORT}`, '--hide-scrollbars', '--no-first-run',
  `--user-data-dir=${mkdtempSync(join(tmpdir(), 'cap-'))}`, 'about:blank',
], { stdio: 'ignore' })

const wait = ms => new Promise(r => setTimeout(r, ms))
let wsUrl
for (let i = 0; i < 50 && !wsUrl; i++) {
  await wait(200)
  try { wsUrl = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()).find(t => t.type === 'page')?.webSocketDebuggerUrl } catch {}
}
if (!wsUrl) { chrome.kill(); throw new Error('chrome did not start') }

const ws = new WebSocket(wsUrl)
await new Promise(r => ws.addEventListener('open', r))
let id = 0
const pending = new Map()
ws.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id) } })
const send = (method, params = {}) => new Promise((res, rej) => {
  const n = ++id; pending.set(n, m => (m.error ? rej(new Error(`${method}: ${m.error.message}`)) : res(m.result)))
  ws.send(JSON.stringify({ id: n, method, params }))
})
const js = async expr => (await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result.value

await send('Page.enable')
await send('Runtime.enable')
// reduced motion: entrances are off and the deal room line holds still, so shots are stable
await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] })

async function shot(name, { path, w, h, dpr = 1, mobile = false, full = false }) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile })
  // land on the route, clear saved pipeline moves, then reload so every shot starts from the demo data
  await send('Page.navigate', { url: base + '/#' + path }); await wait(1500)
  await js('localStorage.clear(); true')
  await send('Page.reload', { ignoreCache: false }); await wait(3000)
  let clip
  if (full) clip = { x: 0, y: 0, width: w, height: await js('document.documentElement.scrollHeight'), scale: 1 }
  const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: full, ...(clip && { clip }) })
  writeFileSync(join(out, name), Buffer.from(data, 'base64'))
  console.log('saved', name, full ? '(full page)' : `${w}x${h}`)
}

try {
  await shot('01-dashboard-1920x1080.png', { path: '/', w: 1920, h: 1080 })
  await shot('02-dashboard-full-page.png', { path: '/', w: 1440, h: 900, full: true })
  await shot('03-contacts-1440x900.png', { path: '/contacts', w: 1440, h: 900 })
  await shot('04-contact-drawer-1440x900.png', { path: '/contacts?open=c1', w: 1440, h: 900 })
  await shot('05-pipeline-1440x900.png', { path: '/pipeline', w: 1440, h: 900 })
  await shot('06-mobile-dashboard.png', { path: '/', w: 390, h: 844, dpr: 2, mobile: true })
  await shot('07-mobile-contacts.png', { path: '/contacts', w: 390, h: 844, dpr: 2, mobile: true })
} finally {
  ws.close(); chrome.kill()
}
