import type { Recipe } from '../api/types'

const DR_ORDER = ['DR_AUTO', 'DR100', 'DR200', 'DR400']
const STR_ORDER = ['OFF', 'WEAK', 'STRONG']

export function buildFeatureVector(r: Recipe): number[] {
  return [
    r.highlightTone,
    r.shadowTone,
    r.color,
    r.sharpness,
    r.noiseReduction,
    r.clarity,
    r.wbShiftRed,
    r.wbShiftBlue,
    STR_ORDER.indexOf(r.grainStrength),
    STR_ORDER.indexOf(r.colorChromeEffect),
    STR_ORDER.indexOf(r.colorChromeFxBlue),
    DR_ORDER.indexOf(r.dynamicRange),
  ]
}

function matVec(A: number[][], v: number[]): number[] {
  return A.map(row => row.reduce((s, a, j) => s + a * v[j], 0))
}

function normalize(v: number[]): number[] {
  const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1
  return v.map(x => x / norm)
}

function powerIter(A: number[][], iters = 200): number[] {
  let v = normalize(A[0].map((_, i) => i === 0 ? 1 : 0.01 * (i + 1)))
  for (let i = 0; i < iters; i++) v = normalize(matVec(A, v))
  return v
}

function rayleigh(A: number[][], v: number[]): number {
  return matVec(A, v).reduce((s, x, i) => s + x * v[i], 0)
}

function deflate(A: number[][], v: number[], lam: number): number[][] {
  return A.map((row, i) => row.map((val, j) => val - lam * v[i] * v[j]))
}

export function computePca(data: number[][]): [number, number][] {
  const n = data.length
  const d = data[0].length

  // Z-score normalization
  const mean = Array(d).fill(0)
  for (const row of data) for (let j = 0; j < d; j++) mean[j] += row[j] / n
  const centered = data.map(row => row.map((v, j) => v - mean[j]))
  const std = Array(d).fill(0)
  for (const row of centered) for (let j = 0; j < d; j++) std[j] += row[j] ** 2
  for (let j = 0; j < d; j++) std[j] = Math.sqrt(std[j] / Math.max(n - 1, 1)) || 1
  const scaled = centered.map(row => row.map((v, j) => v / std[j]))

  // Covariance matrix
  const C: number[][] = Array.from({ length: d }, () => Array(d).fill(0))
  for (let i = 0; i < d; i++)
    for (let j = i; j < d; j++) {
      for (const row of scaled) C[i][j] += row[i] * row[j]
      C[i][j] /= Math.max(n - 1, 1)
      C[j][i] = C[i][j]
    }

  // Top 2 eigenvectors via power iteration + deflation
  const ev1 = powerIter(C)
  const lam1 = rayleigh(C, ev1)
  const ev2 = powerIter(deflate(C, ev1, lam1))

  return scaled.map(row => [
    row.reduce((s, v, j) => s + v * ev1[j], 0),
    row.reduce((s, v, j) => s + v * ev2[j], 0),
  ])
}
