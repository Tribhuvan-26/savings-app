// Adapted from Ink Bleed by Codemure (MIT, see LICENSE-ink-bleed.txt): src/gl/shaders.ts
// Same ink shape (domain-warped blob, curling tendrils, paper-fibre edge, thin band, haze, speckles, pigment rim),
// but instead of bleeding one page screenshot into another, it floods the screen with the *new theme's paper colour*
// (alpha = ink coverage). No screenshots means nothing to capture: memes, the 3D coin and long lists can't glitch.
import { NOISE_CELLS } from './noise'

export const VERT = `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`

export const FRAG = `#version 300 es
precision highp float;

uniform float uCanvasScale; // device px per CSS px
uniform vec2 uRes;          // canvas device px
uniform vec2 uCenter;       // CSS px
uniform float uRadius;      // CSS px, eased base radius
uniform float uCleanup;     // CSS px, extra reach that guarantees full coverage at the end
uniform float uTime;
uniform float uRef;         // CSS px, noise reference length
uniform vec2 uSeed;
uniform mat2 uSeedRot;
uniform vec3 uColor;        // the new theme's paper colour
uniform vec3 uRimColor;     // pigment pooled at the frontier
uniform sampler2D uNoise;

out vec4 outColor;

const float A_LOBE = 0.22;
const float A_BLOB = 0.20;
const float A_SUM = A_LOBE + A_BLOB;
const float TENDRIL_REACH = 0.24;
const float FIBRE_PX = 1.8;
const float THIN_MAX_PX = 26.0;
const float SPECK_PX = 18.0;
const float HAZE_PX = 16.0;
const float SOFT = 1.4;
const float INV_CELLS = 1.0 / ${NOISE_CELLS.toFixed(1)};

float gnoise(vec2 p) { return textureLod(uNoise, p * INV_CELLS, 0.0).r * 2.0 - 1.0; }
float gnoise2(vec2 p) { return textureLod(uNoise, p * INV_CELLS, 0.0).g * 2.0 - 1.0; }
const mat2 OCT = mat2(0.8, 0.6, -0.6, 0.8) * 2.03;
float fbm3(vec2 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 3; i++) { s += a * gnoise(p); p = OCT * p + 17.13; a *= 0.5; } return s / 0.875; }
float fbm4(vec2 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { s += a * gnoise(p); p = OCT * p + 17.13; a *= 0.5; } return s / 0.9375; }
float fbm5(vec2 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { s += a * gnoise(p); p = OCT * p + 17.13; a *= 0.5; } return s / 0.96875; }

void main() {
  vec2 devPx = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec2 css = devPx / uCanvasScale;
  vec2 rel = css - uCenter;
  float d = length(rel);
  float R = uRadius;

  // Skip the noise far from the frontier: solid ink inside, clear outside.
  float inner = R * (1.0 - A_SUM) + uCleanup - FIBRE_PX - THIN_MAX_PX - SOFT * 2.0;
  float outer = R * (1.0 + A_SUM) * (1.0 + TENDRIL_REACH) + uCleanup + FIBRE_PX + SPECK_PX + SOFT * 2.0;
  if (d < inner) { outColor = vec4(uColor, 1.0); return; }
  if (d > outer) { outColor = vec4(0.0); return; }

  float t = uTime;
  vec2 p = rel / uRef;
  vec2 dir = uSeedRot * (rel / max(d, 1e-3));

  vec2 q = p * 2.4 + uSeed;
  vec2 w = vec2(fbm3(q + vec2(0.0, 0.31 * t)), fbm3(q + vec2(5.2, 1.3) - vec2(0.27 * t, 0.0)));
  float blob = fbm5(q + 2.3 * w + vec2(0.12 * t, -0.08 * t));
  vec2 lq = dir * 0.9 + uSeed.yx * 0.37 + vec2(0.06 * t);
  float lobes = gnoise(lq) * 0.75 + gnoise(lq * 2.1 + 9.1) * 0.25;
  float reach = clamp(1.0 + A_LOBE * 1.6 * lobes + A_BLOB * 1.5 * blob, 1.0 - A_SUM, 1.0 + A_SUM);
  float f = d - R * reach;

  // Tendrils that curl and fork as they travel outward.
  float gate = smoothstep(-0.35, 0.4, fbm3(dir * 1.6 + uSeed * 0.61 + 3.7));
  vec2 tq = dir * 2.2 + (d / uRef) * vec2(2.6, -1.9) + 1.2 * w + uSeed * 1.7 + vec2(0.0, 0.18 * t);
  float n = fbm4(tq);
  float ridgePx = abs(n) * max(d, 24.0) / 4.0;
  float lenN = gnoise(dir * 3.1 + uSeed * 0.43 + vec2(0.1 * t)) * 0.5 + 0.5;
  float L = TENDRIL_REACH * R * gate * (0.35 + 0.65 * lenN);
  float along = clamp(f / max(L, 1.0), 0.0, 1.0);
  float width = clamp(R * 0.022, 1.5, 9.0) * (1.0 - along * along) * gate;
  float ft = max(f - L, ridgePx - width);
  float k = 6.0;
  float hh = clamp(0.5 + 0.5 * (ft - f) / k, 0.0, 1.0);
  f = mix(ft, f, hh) - k * hh * (1.0 - hh);

  vec2 fq = css * 0.34 + uSeed * 13.0;
  float fibre = gnoise2(fq) * 0.65 + gnoise2(OCT * fq + 5.3) * 0.35;
  f += fibre * FIBRE_PX;
  f -= uCleanup;

  float inked = 1.0 - smoothstep(-SOFT, SOFT, f);
  float thinW = mix(3.0, THIN_MAX_PX, clamp(blob * 0.8 + 0.3, 0.0, 1.0));
  float cov = inked * mix(0.6, 1.0, smoothstep(0.0, thinW, -f));
  float hazeW = mix(4.0, HAZE_PX, clamp(0.5 + 0.5 * blob, 0.0, 1.0));
  float haze = (1.0 - smoothstep(0.0, hazeW, f)) * smoothstep(-0.3, 0.6, 0.35 * fibre + w.x);
  cov = max(cov, haze * 0.24 * step(0.0, f));
  float ahead = clamp(f / SPECK_PX, 0.0, 1.0);
  if (f > 0.0 && ahead < 1.0) {
    float sn = gnoise2(css * 0.55 + uSeed * 7.0 + 41.0) * 0.5 + 0.5;
    float th = mix(0.80, 0.96, ahead);
    cov = max(cov, smoothstep(th, th + 0.04, sn) * 0.75 * (1.0 - ahead));
  }

  float rimX = (f + SOFT * 1.1) / (SOFT * 1.4 + 1.2);
  float rim = exp(-rimX * rimX) * inked;
  vec3 col = mix(uColor, uRimColor, rim * 0.45);
  outColor = vec4(col, clamp(cov, 0.0, 1.0));
}`
