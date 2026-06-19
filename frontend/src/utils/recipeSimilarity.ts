import { MONOCHROME_SIMS } from '../filmSimLabel'
import type { Recipe } from '../api/types'

const DR_VALS = ['DR_AUTO', 'DR100', 'DR200', 'DR400'] as const
const STRENGTH_3 = ['OFF', 'WEAK', 'STRONG'] as const
const GRAIN_SIZE_VALS = ['SMALL', 'LARGE'] as const

function ordDiff(a: string, b: string, vals: readonly string[]): number {
  const ia = vals.indexOf(a), ib = vals.indexOf(b)
  if (ia < 0 || ib < 0) return a === b ? 0 : 1
  return Math.abs(ia - ib) / (vals.length - 1)
}

// Visuelle Ähnlichkeit zwischen Filmsimulationen (0 = identisch, 1 = komplett verschieden)
function filmSimGroup(sim: string): string {
  if (['ACROS', 'ACROS_YE', 'ACROS_R', 'ACROS_G'].includes(sim)) return 'acros'
  if (['MONOCHROME', 'MONOCHROME_YE', 'MONOCHROME_R', 'MONOCHROME_G'].includes(sim)) return 'mono'
  if (sim === 'SEPIA') return 'sepia'
  if (['PROVIA', 'ASTIA', 'PRO_NEG_STD', 'PRO_NEG_HI', 'REALA_ACE'].includes(sim)) return 'neutral'
  if (['CLASSIC_CHROME', 'CLASSIC_NEGATIVE', 'NOSTALGIC_NEG'].includes(sim)) return 'filmic'
  if (['ETERNA', 'ETERNA_BLEACH_BYPASS'].includes(sim)) return 'cinema'
  if (sim === 'VELVIA') return 'vivid'
  return 'other'
}

function filmSimDist(a: string, b: string): number {
  if (a === b) return 0
  const ga = filmSimGroup(a), gb = filmSimGroup(b)
  const MONO = ['acros', 'mono', 'sepia']
  const aMono = MONO.includes(ga), bMono = MONO.includes(gb)

  // Monochrom vs. Farbe → komplett anderes Bild
  if (aMono !== bMono) return 1.0

  if (aMono && bMono) {
    if (ga === gb) return 0.1 // gleiche Gruppe (z.B. ACROS vs ACROS_YE – selbe Basis, nur Filtereffekt)
    if (ga === 'sepia' || gb === 'sepia') return 0.3
    return 0.25 // ACROS vs MONOCHROME – beide B&W, unterschiedliches Rendering
  }

  // Beide Farb-Sims
  if (ga === gb) {
    if ((a === 'PRO_NEG_STD' && b === 'PRO_NEG_HI') || (a === 'PRO_NEG_HI' && b === 'PRO_NEG_STD')) return 0.15
    if ((a === 'PROVIA' && b === 'ASTIA') || (a === 'ASTIA' && b === 'PROVIA')) return 0.2
    if (['CLASSIC_CHROME', 'CLASSIC_NEGATIVE'].includes(a) && ['CLASSIC_CHROME', 'CLASSIC_NEGATIVE'].includes(b)) return 0.2
    return 0.25
  }

  // Gruppen-übergreifend
  const crossDist: Record<string, number> = {
    'cinema-filmic': 0.30,   // beide eher flach/cinematic
    'filmic-neutral': 0.45,
    'cinema-neutral': 0.55,
    'filmic-vivid': 0.75,
    'neutral-vivid': 0.70,
    'cinema-vivid': 0.80,
  }
  return crossDist[[ga, gb].sort().join('-')] ?? 0.5
}

export function computeSimilarity(a: Recipe, b: Recipe): number {
  let total = 0, diff = 0

  const num = (va: number, vb: number, range: number, w: number) => {
    diff += (Math.abs(va - vb) / range) * w; total += w
  }
  const ord = (va: string, vb: string, vals: readonly string[], w: number) => {
    diff += ordDiff(va, vb, vals) * w; total += w
  }

  // Filmsimulation – visuelle DNA des Recipes (Distanzmatrix statt binär)
  diff += filmSimDist(a.filmSimulation, b.filmSimulation) * 4; total += 4

  // Tonkurve – definiert die Stimmung des Bildes
  num(a.highlightTone, b.highlightTone, 6, 1.5)
  num(a.shadowTone, b.shadowTone, 6, 1.5)
  ord(a.dynamicRange, b.dynamicRange, DR_VALS, 1.0)

  // Farbe & Sättigung – sehr sichtbarer Unterschied
  num(a.color, b.color, 8, 1.5)
  ord(a.colorChromeEffect, b.colorChromeEffect, STRENGTH_3, 1.5)
  ord(a.colorChromeFxBlue, b.colorChromeFxBlue, STRENGTH_3, 0.8)

  // Körnung – OFF vs STRONG ist dramatisch sichtbar
  ord(a.grainStrength, b.grainStrength, STRENGTH_3, 2.0)
  if (a.grainStrength !== 'OFF' && b.grainStrength !== 'OFF') {
    ord(a.grainSize ?? 'SMALL', b.grainSize ?? 'SMALL', GRAIN_SIZE_VALS, 0.5)
  }
  num(a.clarity, b.clarity, 10, 0.8)

  // Weißabgleich-Verschiebung (Farbstich) – subtil aber sichtbar
  num(a.wbShiftRed, b.wbShiftRed, 18, 0.8)
  num(a.wbShiftBlue, b.wbShiftBlue, 18, 0.8)

  // Feindetail – geringstem Einfluss auf den Gesamtlook
  num(a.sharpness, b.sharpness, 8, 0.3)
  num(a.noiseReduction, b.noiseReduction, 8, 0.3)

  // Monochrome Farbtönung – nur bei Mono-Sims relevant
  if (MONOCHROME_SIMS.includes(a.filmSimulation) && MONOCHROME_SIMS.includes(b.filmSimulation)) {
    num(a.monochromeWarmCool ?? 0, b.monochromeWarmCool ?? 0, 18, 1.0)
    num(a.monochromeGreenMagenta ?? 0, b.monochromeGreenMagenta ?? 0, 18, 1.0)
  }

  return Math.round((1 - diff / total) * 100)
}

export function similarityColor(score: number): string {
  if (score >= 85) return 'red'
  if (score >= 65) return 'yellow'
  return 'green'
}
