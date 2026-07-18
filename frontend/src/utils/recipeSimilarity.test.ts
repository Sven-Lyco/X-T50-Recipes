import { describe, it, expect } from 'vitest'
import type { Recipe } from '../api/types'
import { computeSimilarity, similarityColor } from './recipeSimilarity'

function recipe(overrides: Partial<Recipe> = {}): Recipe {
  return {
    id: 'test',
    name: 'Test',
    filmSimulation: 'PROVIA',
    dynamicRange: 'DR100',
    highlightTone: 0,
    shadowTone: 0,
    color: 0,
    sharpness: 0,
    noiseReduction: 0,
    grainStrength: 'OFF',
    grainSize: null,
    colorChromeEffect: 'OFF',
    colorChromeFxBlue: 'OFF',
    whiteBalanceMode: 'AUTO',
    wbShiftRed: 0,
    wbShiftBlue: 0,
    colorTempKelvin: null,
    clarity: 0,
    monochromeWarmCool: null,
    monochromeGreenMagenta: null,
    isoMode: null,
    isoNote: null,
    expCompNote: null,
    description: null,
    inspirationSource: null,
    tags: [],
    cameraSlot: null,
    favorite: false,
    aiGenerated: false,
    shootingScenario: null,
    images: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('computeSimilarity', () => {
  it('identical recipes return 100', () => {
    const r = recipe()
    expect(computeSimilarity(r, r)).toBe(100)
  })

  it('same film simulation with maximum tone curve difference lowers score', () => {
    const a = recipe({ highlightTone: -2, shadowTone: -2 })
    const b = recipe({ highlightTone: 4, shadowTone: 4 })
    const score = computeSimilarity(a, b)
    expect(score).toBeGreaterThan(70)
    expect(score).toBeLessThan(100)
  })

  it('same film simulation with grain OFF vs STRONG lowers score', () => {
    const a = recipe({ grainStrength: 'OFF' })
    const b = recipe({ grainStrength: 'STRONG' })
    const score = computeSimilarity(a, b)
    expect(score).toBeGreaterThan(70)
    expect(score).toBeLessThan(100)
  })

  it('monochrome vs color gives significantly lower score than same-group comparison', () => {
    const a = recipe({ filmSimulation: 'ACROS' })
    const b = recipe({ filmSimulation: 'PROVIA' })
    const score = computeSimilarity(a, b)
    // filmSimDist = 1.0 (max), weight 4 out of ~17 total → score around 76
    expect(score).toBeLessThan(80)
    expect(score).toBeGreaterThan(50)
  })

  it('same monochrome group (ACROS variants) gives high score', () => {
    const a = recipe({ filmSimulation: 'ACROS' })
    const b = recipe({ filmSimulation: 'ACROS_YE' })
    const score = computeSimilarity(a, b)
    expect(score).toBeGreaterThan(85)
  })

  it('ACROS vs MONOCHROME (both mono, different groups) gives mid score', () => {
    const a = recipe({ filmSimulation: 'ACROS' })
    const b = recipe({ filmSimulation: 'MONOCHROME' })
    const score = computeSimilarity(a, b)
    expect(score).toBeGreaterThan(70)
    expect(score).toBeLessThanOrEqual(95)
  })

  it('CLASSIC_CHROME vs CLASSIC_NEGATIVE (same filmic group) gives high score', () => {
    const a = recipe({ filmSimulation: 'CLASSIC_CHROME' })
    const b = recipe({ filmSimulation: 'CLASSIC_NEGATIVE' })
    const score = computeSimilarity(a, b)
    expect(score).toBeGreaterThan(80)
  })

  it('monochrome warmCool shift is included in score for mono recipes', () => {
    const a = recipe({ filmSimulation: 'ACROS', monochromeWarmCool: -9 })
    const b = recipe({ filmSimulation: 'ACROS', monochromeWarmCool: 9 })
    const score = computeSimilarity(a, b)
    expect(score).toBeGreaterThan(70)
    expect(score).toBeLessThan(100)
  })

  it('monochrome warmCool is ignored for color recipes', () => {
    const a = recipe({ filmSimulation: 'PROVIA', monochromeWarmCool: -9 })
    const b = recipe({ filmSimulation: 'PROVIA', monochromeWarmCool: 9 })
    expect(computeSimilarity(a, b)).toBe(100)
  })

  it('is symmetric', () => {
    const a = recipe({ filmSimulation: 'VELVIA', grainStrength: 'STRONG', color: 4 })
    const b = recipe({ filmSimulation: 'CLASSIC_CHROME', grainStrength: 'OFF', color: -2 })
    expect(computeSimilarity(a, b)).toBe(computeSimilarity(b, a))
  })

  it('NOSTALGIC_NEG and CLASSIC_CHROME are in the same filmic group', () => {
    const a = recipe({ filmSimulation: 'NOSTALGIC_NEG' })
    const b = recipe({ filmSimulation: 'CLASSIC_CHROME' })
    const score = computeSimilarity(a, b)
    expect(score).toBeGreaterThan(75)
  })

  it('ETERNA vs ETERNA_BLEACH_BYPASS are in the same cinema group', () => {
    const a = recipe({ filmSimulation: 'ETERNA' })
    const b = recipe({ filmSimulation: 'ETERNA_BLEACH_BYPASS' })
    const score = computeSimilarity(a, b)
    expect(score).toBeGreaterThan(75)
  })

  it('PRO_NEG_STD vs PRO_NEG_HI gives a high score (same group, close variants)', () => {
    const a = recipe({ filmSimulation: 'PRO_NEG_STD' })
    const b = recipe({ filmSimulation: 'PRO_NEG_HI' })
    const score = computeSimilarity(a, b)
    expect(score).toBeGreaterThan(82)
  })

  it('PROVIA vs ASTIA gives a high score (same group)', () => {
    const a = recipe({ filmSimulation: 'PROVIA' })
    const b = recipe({ filmSimulation: 'ASTIA' })
    const score = computeSimilarity(a, b)
    expect(score).toBeGreaterThan(78)
  })

  it('both recipes with STRONG grain and different sizes differs in score', () => {
    const a = recipe({ grainStrength: 'STRONG', grainSize: 'SMALL' })
    const b = recipe({ grainStrength: 'STRONG', grainSize: 'LARGE' })
    const score = computeSimilarity(a, b)
    expect(score).toBeGreaterThan(90)
    expect(score).toBeLessThan(100)
  })

  it('unknown film simulation falls back gracefully (other group)', () => {
    // Covers the fallback "return 'other'" branch in filmSimGroup
    const a = recipe({ filmSimulation: 'FUTURE_SIM' as any })
    const b = recipe({ filmSimulation: 'PROVIA' })
    const score = computeSimilarity(a, b)
    expect(typeof score).toBe('number')
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(100)
  })
})

describe('similarityColor', () => {
  it('returns red for score >= 85', () => {
    expect(similarityColor(100)).toBe('red')
    expect(similarityColor(85)).toBe('red')
  })

  it('returns yellow for score 65–84', () => {
    expect(similarityColor(84)).toBe('yellow')
    expect(similarityColor(65)).toBe('yellow')
  })

  it('returns green for score < 65', () => {
    expect(similarityColor(64)).toBe('green')
    expect(similarityColor(0)).toBe('green')
  })
})
