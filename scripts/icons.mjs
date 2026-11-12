// Writes the logo pages that the launcher icon / splash PNGs are rendered from (headless Chrome screenshots,
// then resized into android/app/src/main/res/mipmap-*). Usage: node scripts/icons.mjs <outdir>
import { writeFileSync } from 'node:fs'
import { logoSvg } from '../src/logo.js'

const out = process.argv[2] || '.'
const big = svg => svg.replace(/width="\d+" height="\d+"/, 'width="1024" height="1024"')
const page = svg => `<html><body style="margin:0;background:transparent">${big(svg)}</body></html>`
writeFileSync(`${out}/square.html`, page(logoSvg({ shape: 'square' })))
writeFileSync(`${out}/round.html`, page(logoSvg({ shape: 'round' })))
// Adaptive icon foreground: 108-unit canvas, art inside the 66-unit safe zone.
const inner = logoSvg({ shape: 'square' }).replace(/^<svg[^>]*>|<\/svg>$/g, '')
writeFileSync(`${out}/fg.html`, page(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108" width="1024" height="1024"><g transform="translate(10.8 10.8) scale(1.35)">${inner}</g></svg>`))
