// Ported from Ink Bleed by Codemure (MIT, see LICENSE-ink-bleed.txt): src/gl/noiseTexture.ts
// Tileable gradient-noise texture, so the shader pays one bilinear fetch per octave instead of four hashes.
// SIZE×SIZE texels, CELLS×CELLS lattice cells, four decorrelated channels mapped from [-1, 1] to [0, 255].

export const NOISE_SIZE = 256
export const NOISE_CELLS = 32

function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function channel(rand) {
  const n = NOISE_CELLS * NOISE_CELLS
  const gx = new Float32Array(n), gy = new Float32Array(n)
  for (let i = 0; i < n; i++) { const a = rand() * Math.PI * 2; gx[i] = Math.cos(a); gy[i] = Math.sin(a) }
  const per = NOISE_SIZE / NOISE_CELLS
  const out = new Float32Array(NOISE_SIZE * NOISE_SIZE)
  const fade = t => t * t * t * (t * (t * 6 - 15) + 10)
  const at = (cx, cy) => ((cy + NOISE_CELLS) % NOISE_CELLS) * NOISE_CELLS + ((cx + NOISE_CELLS) % NOISE_CELLS)
  for (let y = 0; y < NOISE_SIZE; y++) {
    const py = (y + 0.5) / per, cy = Math.floor(py), fy = py - cy, v = fade(fy)
    for (let x = 0; x < NOISE_SIZE; x++) {
      const px = (x + 0.5) / per, cx = Math.floor(px), fx = px - cx, u = fade(fx)
      const i00 = at(cx, cy), i10 = at(cx + 1, cy), i01 = at(cx, cy + 1), i11 = at(cx + 1, cy + 1)
      const n00 = gx[i00] * fx + gy[i00] * fy
      const n10 = gx[i10] * (fx - 1) + gy[i10] * fy
      const n01 = gx[i01] * fx + gy[i01] * (fy - 1)
      const n11 = gx[i11] * (fx - 1) + gy[i11] * (fy - 1)
      const nx0 = n00 + (n10 - n00) * u, nx1 = n01 + (n11 - n01) * u
      out[y * NOISE_SIZE + x] = nx0 + (nx1 - nx0) * v
    }
  }
  for (let i = 0; i < out.length; i++) out[i] = Math.max(-1, Math.min(1, out[i] * 1.45))
  return out
}

export function createNoiseTexture(gl) {
  const rand = mulberry32(0x1b1eed) // fixed: per-tap variety comes from the shader seed
  const ch = [channel(rand), channel(rand), channel(rand), channel(rand)]
  const data = new Uint8Array(NOISE_SIZE * NOISE_SIZE * 4)
  for (let i = 0; i < NOISE_SIZE * NOISE_SIZE; i++) for (let c = 0; c < 4; c++) data[i * 4 + c] = Math.round((ch[c][i] * 0.5 + 0.5) * 255)
  const tex = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, tex)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, NOISE_SIZE, NOISE_SIZE, 0, gl.RGBA, gl.UNSIGNED_BYTE, data)
  return tex
}
