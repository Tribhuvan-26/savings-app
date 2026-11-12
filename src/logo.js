// The app's logo: a pop-art comic "POW!" explosion. Rendered to PNG by scripts/icons.mjs for the Android
// launcher icon, splash and the in-app header (public/logo.png), since a bundled PNG keeps the comic lettering
// exact on every phone (an SVG <img> can't use the app's web fonts).

// Jagged burst: alternating long/short spikes with a little irregularity, like a hand-inked comic SFX.
const jag = [1, .74, .96, .7, 1.04, .78, .92, .66, 1, .76, .98, .72, 1.06, .7, .94, .78, 1, .68]
function burst(r, cx = 32, cy = 32) {
  return jag.map((k, i) => {
    const a = (i / jag.length) * Math.PI * 2 - Math.PI / 2 + 0.1
    return `${(cx + r * k * Math.cos(a)).toFixed(2)},${(cy + r * k * Math.sin(a)).toFixed(2)}`
  }).join(' ')
}

const lines = Array.from({ length: 20 }, (_, i) => {
  const a = (i / 20) * Math.PI * 2, w = 0.05
  const p = (r, d) => `${(32 + r * Math.cos(a + d)).toFixed(2)},${(32 + r * Math.sin(a + d)).toFixed(2)}`
  return `<polygon points="${p(20, 0)} ${p(50, -w)} ${p(50, w)}"/>`
}).join('')

/** `shape`: 'square' | 'round' tile. */
export function logoSvg({ shape = 'square', size = 64 } = {}) {
  const clip = shape === 'round' ? '<circle cx="32" cy="32" r="32"/>' : '<rect width="64" height="64" rx="14"/>'
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${size}" height="${size}">
  <defs>
    <pattern id="dots" width="3.2" height="3.2" patternUnits="userSpaceOnUse" patternTransform="rotate(20)">
      <circle cx="1.6" cy="1.6" r="1.05" fill="#0B4FA8"/>
    </pattern>
    <clipPath id="tile">${clip}</clipPath>
  </defs>
  <g clip-path="url(#tile)">
    <rect width="64" height="64" fill="#2D8CF0"/>
    <rect width="64" height="64" fill="url(#dots)" opacity=".55"/>
    <g fill="#fff" opacity=".55">${lines}</g>
  </g>
  <polygon points="${burst(30)}" fill="#E8130C" stroke="#0D0D0D" stroke-width="2.2" stroke-linejoin="miter"/>
  <polygon points="${burst(24)}" fill="#FFE419" stroke="#0D0D0D" stroke-width="2" stroke-linejoin="miter"/>
  <g transform="rotate(-10 32 33)" font-family="Impact, 'Anton', 'Arial Black', sans-serif" font-size="17" text-anchor="middle">
    <text x="33.3" y="39.6" fill="#0D0D0D">POW!</text>
    <text x="32" y="38.3" fill="#E8130C" stroke="#0D0D0D" stroke-width="2.6" paint-order="stroke" stroke-linejoin="round">POW!</text>
  </g>
  <g fill="#fff" stroke="#0D0D0D" stroke-width=".8" stroke-linejoin="round">
    <path d="M9 10l1.3 3 3 1.3-3 1.3L9 18.6l-1.3-3-3-1.3 3-1.3z"/>
    <path d="M54.5 47l1 2.3 2.3 1-2.3 1-1 2.3-1-2.3-2.3-1 2.3-1z"/>
  </g>
</svg>`
}
