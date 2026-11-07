import { MONOCHROME_SIMS, filmSimLabel } from '../filmSimLabel'
import { dynamicRangeLabel, grainSizeLabel, strengthLabel } from './labels'
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

interface Setting {
  label: string
  weight: number
  // Wenn gesetzt: Einstellung zählt nur, wenn die Bedingung für beide Recipes gilt
  appliesTo?: (r: Recipe) => boolean
  // Unterschied 0..1
  distance: (a: Recipe, b: Recipe) => number
  display: (r: Recipe) => string
}

const numDist = (get: (r: Recipe) => number, range: number) =>
  (a: Recipe, b: Recipe) => Math.abs(get(a) - get(b)) / range
const ordDist = (get: (r: Recipe) => string, vals: readonly string[]) =>
  (a: Recipe, b: Recipe) => ordDiff(get(a), get(b), vals)
const signed = (n: number) => (n > 0 ? `+${n}` : String(n))
const hasGrain = (r: Recipe) => r.grainStrength !== 'OFF'
const isMonochrome = (r: Recipe) => MONOCHROME_SIMS.includes(r.filmSimulation)

// Einzige Quelle der Gewichte; Reihenfolge = Tie-Break-Reihenfolge von topDifferences
const SETTINGS: Setting[] = [
  // Filmsimulation – visuelle DNA des Recipes (Distanzmatrix statt binär)
  { label: 'Filmsimulation', weight: 4, distance: (a, b) => filmSimDist(a.filmSimulation, b.filmSimulation), display: r => filmSimLabel(r.filmSimulation) },
  // Tonkurve – definiert die Stimmung des Bildes
  { label: 'Spitzlichter', weight: 1.5, distance: numDist(r => r.highlightTone, 6), display: r => signed(r.highlightTone) },
  { label: 'Schatten', weight: 1.5, distance: numDist(r => r.shadowTone, 6), display: r => signed(r.shadowTone) },
  { label: 'Dynamikbereich', weight: 1.0, distance: ordDist(r => r.dynamicRange, DR_VALS), display: r => dynamicRangeLabel(r.dynamicRange) },
  // Farbe & Sättigung – sehr sichtbarer Unterschied
  { label: 'Farbe', weight: 1.5, distance: numDist(r => r.color, 8), display: r => signed(r.color) },
  { label: 'Farbe Chrome-Effekt', weight: 1.5, distance: ordDist(r => r.colorChromeEffect, STRENGTH_3), display: r => strengthLabel(r.colorChromeEffect) },
  { label: 'Farbe Chrom FX Blau', weight: 0.8, distance: ordDist(r => r.colorChromeFxBlue, STRENGTH_3), display: r => strengthLabel(r.colorChromeFxBlue) },
  // Körnung – OFF vs STRONG ist dramatisch sichtbar
  { label: 'Körnungseffekt', weight: 2.0, distance: ordDist(r => r.grainStrength, STRENGTH_3), display: r => strengthLabel(r.grainStrength) },
  { label: 'Körnung Größe', weight: 0.5, appliesTo: hasGrain, distance: ordDist(r => r.grainSize ?? 'SMALL', GRAIN_SIZE_VALS), display: r => grainSizeLabel(r.grainSize ?? 'SMALL') },
  { label: 'Klarheit', weight: 0.8, distance: numDist(r => r.clarity, 10), display: r => signed(r.clarity) },
  // Weißabgleich-Verschiebung (Farbstich) – subtil aber sichtbar
  { label: 'WA Verschieben R', weight: 0.8, distance: numDist(r => r.wbShiftRed, 18), display: r => signed(r.wbShiftRed) },
  { label: 'WA Verschieben B', weight: 0.8, distance: numDist(r => r.wbShiftBlue, 18), display: r => signed(r.wbShiftBlue) },
  // Feindetail – geringster Einfluss auf den Gesamtlook
  { label: 'Schärfe', weight: 0.3, distance: numDist(r => r.sharpness, 8), display: r => signed(r.sharpness) },
  { label: 'Hohe ISO-NR', weight: 0.3, distance: numDist(r => r.noiseReduction, 8), display: r => signed(r.noiseReduction) },
  // Monochrome Farbtönung – nur bei Mono-Sims relevant
  { label: 'Warm / Cool', weight: 1.0, appliesTo: isMonochrome, distance: numDist(r => r.monochromeWarmCool ?? 0, 18), display: r => signed(r.monochromeWarmCool ?? 0) },
  { label: 'Grün / Magenta', weight: 1.0, appliesTo: isMonochrome, distance: numDist(r => r.monochromeGreenMagenta ?? 0, 18), display: r => signed(r.monochromeGreenMagenta ?? 0) },
]

function comparedSettings(a: Recipe, b: Recipe): Setting[] {
  return SETTINGS.filter(s => !s.appliesTo || (s.appliesTo(a) && s.appliesTo(b)))
}

export function computeSimilarity(a: Recipe, b: Recipe): number {
  let total = 0, diff = 0
  for (const s of comparedSettings(a, b)) {
    diff += s.distance(a, b) * s.weight
    total += s.weight
  }
  return Math.round((1 - diff / total) * 100)
}

export interface RecipeDifference {
  label: string
  valueA: string
  valueB: string
}

// Die n Einstellungen mit dem größten gewichteten Unterschied (gleiche Gewichte wie computeSimilarity)
export function topDifferences(a: Recipe, b: Recipe, n = 3): RecipeDifference[] {
  return comparedSettings(a, b)
    .map(s => ({ s, weighted: s.distance(a, b) * s.weight }))
    .filter(x => x.weighted > 0)
    .sort((x, y) => y.weighted - x.weighted) // stabil: Gleichstand behält SETTINGS-Reihenfolge
    .slice(0, n)
    .map(({ s }) => ({ label: s.label, valueA: s.display(a), valueB: s.display(b) }))
}

export function similarityColor(score: number): string {
  if (score >= 85) return 'red'
  if (score >= 65) return 'yellow'
  return 'green'
}
