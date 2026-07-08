import type { Recipe } from '../api/types'
import { computeSimilarity } from './recipeSimilarity'

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

// Konvergenz-Check: bricht ab, sobald sich der Vektor kaum noch ändert (Winkel zur Vorrunde ~0),
// statt blind alle maxIters Runden durchzurechnen. maxIters ist nur ein Sicherheitsnetz für
// Fälle mit sehr kleinem Eigenwert-Abstand (typ. bei sehr kleinen Bibliotheken, < 5 Recipes).
function powerIter(A: number[][], maxIters = 500, tol = 1e-10): number[] {
  let v = normalize(A[0].map((_, i) => i === 0 ? 1 : 0.01 * (i + 1)))
  for (let i = 0; i < maxIters; i++) {
    const next = normalize(matVec(A, v))
    const dot = next.reduce((s, x, j) => s + x * v[j], 0)
    v = next
    if (Math.abs(dot) >= 1 - tol) return v
  }
  console.warn(`[recipePca] Power Iteration nicht konvergiert nach ${maxIters} Iterationen — Ähnlichkeits-Map kann ungenau sein`)
  return v
}

function rayleigh(A: number[][], v: number[]): number {
  return matVec(A, v).reduce((s, x, i) => s + x * v[i], 0)
}

function deflate(A: number[][], v: number[], lam: number): number[][] {
  return A.map((row, i) => row.map((val, j) => val - lam * v[i] * v[j]))
}

export function computeMds(recipes: Recipe[]): [number, number][] {
  const n = recipes.length

  // Distanzmatrix: 0 = identisch, 1 = völlig verschieden
  const D2: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => {
      if (i === j) return 0
      const sim = computeSimilarity(recipes[i], recipes[j]) / 100
      return (1 - sim) ** 2
    })
  )

  // Double centering: B[i][j] = -0.5 * (D²[i][j] - rowMean[i] - colMean[j] + grandMean)
  const rowMeans = D2.map(row => row.reduce((s, v) => s + v, 0) / n)
  const colMeans = Array.from({ length: n }, (_, j) => D2.reduce((s, row) => s + row[j], 0) / n)
  const grandMean = rowMeans.reduce((s, v) => s + v, 0) / n
  const B: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) =>
      -0.5 * (D2[i][j] - rowMeans[i] - colMeans[j] + grandMean)
    )
  )

  // Top 2 Eigenvektoren + Eigenwerte
  const ev1 = powerIter(B)
  const lam1 = rayleigh(B, ev1)
  const B2 = deflate(B, ev1, lam1)
  const ev2 = powerIter(B2)
  const lam2 = rayleigh(B2, ev2)

  const s1 = Math.sqrt(Math.max(lam1, 0))
  const s2 = Math.sqrt(Math.max(lam2, 0))

  return ev1.map((_, i) => [ev1[i] * s1, ev2[i] * s2])
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
