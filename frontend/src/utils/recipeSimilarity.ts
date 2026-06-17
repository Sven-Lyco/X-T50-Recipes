import type { Recipe } from '../api/types'

const DR_VALS = ['DR_AUTO', 'DR100', 'DR200', 'DR400'] as const
const STRENGTH_3 = ['OFF', 'WEAK', 'STRONG'] as const

function ordDiff(a: string, b: string, vals: readonly string[]): number {
  const ia = vals.indexOf(a), ib = vals.indexOf(b)
  if (ia < 0 || ib < 0) return a === b ? 0 : 1
  return Math.abs(ia - ib) / (vals.length - 1)
}

export function computeSimilarity(a: Recipe, b: Recipe): number {
  let total = 0
  let diff = 0

  const num = (va: number, vb: number, range: number, w: number) => {
    diff += (Math.abs(va - vb) / range) * w; total += w
  }
  const ord = (va: string, vb: string, vals: readonly string[], w: number) => {
    diff += ordDiff(va, vb, vals) * w; total += w
  }
  const bin = (va: string, vb: string, w: number) => {
    diff += (va === vb ? 0 : 1) * w; total += w
  }

  bin(a.filmSimulation, b.filmSimulation, 3)
  ord(a.dynamicRange, b.dynamicRange, DR_VALS, 1)
  num(a.highlightTone, b.highlightTone, 6, 1)
  num(a.shadowTone, b.shadowTone, 6, 1)
  num(a.color, b.color, 8, 1)
  num(a.sharpness, b.sharpness, 8, 0.5)
  num(a.noiseReduction, b.noiseReduction, 8, 0.5)
  num(a.clarity, b.clarity, 10, 0.5)
  ord(a.grainStrength, b.grainStrength, STRENGTH_3, 1)
  ord(a.colorChromeEffect, b.colorChromeEffect, STRENGTH_3, 1)
  ord(a.colorChromeFxBlue, b.colorChromeFxBlue, STRENGTH_3, 0.5)
  bin(a.whiteBalanceMode, b.whiteBalanceMode, 1.5)
  num(a.wbShiftRed, b.wbShiftRed, 18, 0.5)
  num(a.wbShiftBlue, b.wbShiftBlue, 18, 0.5)

  return Math.round((1 - diff / total) * 100)
}

export function similarityColor(score: number): string {
  if (score >= 85) return 'green'
  if (score >= 65) return 'yellow'
  return 'red'
}
