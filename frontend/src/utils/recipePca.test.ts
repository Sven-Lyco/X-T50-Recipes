import { describe, it, expect } from 'vitest'
import { buildFeatureVector, computeMds, computePca } from './recipePca'
import type { Recipe } from '../api/types'

function makeRecipe(overrides: Partial<Recipe> = {}): Recipe {
  return {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Test',
    filmSimulation: 'PROVIA',
    dynamicRange: 'DR_AUTO',
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

describe('buildFeatureVector', () => {
  it('returns array of length 12', () => {
    expect(buildFeatureVector(makeRecipe())).toHaveLength(12)
  })

  it('maps all-zero recipe to expected values', () => {
    const v = buildFeatureVector(makeRecipe())
    expect(v[0]).toBe(0)  // highlightTone
    expect(v[1]).toBe(0)  // shadowTone
    expect(v[8]).toBe(0)  // grainStrength OFF → index 0
    expect(v[11]).toBe(0) // dynamicRange DR_AUTO → index 0
  })

  it('reflects non-default enum values', () => {
    const v = buildFeatureVector(makeRecipe({ grainStrength: 'STRONG', dynamicRange: 'DR400' }))
    expect(v[8]).toBe(2)  // STRONG → index 2
    expect(v[11]).toBe(3) // DR400 → index 3
  })
})

describe('computeMds', () => {
  it('returns empty array for empty input', () => {
    expect(computeMds([])).toEqual([])
  })

  it('returns single coordinate pair for one recipe', () => {
    const result = computeMds([makeRecipe()])
    expect(result).toHaveLength(1)
    expect(result[0]).toHaveLength(2)
  })

  it('returns coordinate pairs for multiple recipes', () => {
    const recipes = [
      makeRecipe({ id: '1', filmSimulation: 'PROVIA' }),
      makeRecipe({ id: '2', filmSimulation: 'VELVIA', color: 4 }),
      makeRecipe({ id: '3', filmSimulation: 'ACROS', grainStrength: 'STRONG' }),
    ]
    const result = computeMds(recipes)
    expect(result).toHaveLength(3)
    for (const coord of result) {
      expect(coord).toHaveLength(2)
      expect(typeof coord[0]).toBe('number')
      expect(typeof coord[1]).toBe('number')
    }
  })

  it('identical recipes cluster at the same coordinates', () => {
    const r = makeRecipe()
    const result = computeMds([r, r])
    // Both points should have the same coordinates (distance 0)
    expect(result[0][0]).toBeCloseTo(result[1][0], 5)
    expect(result[0][1]).toBeCloseTo(result[1][1], 5)
  })
})

describe('computePca', () => {
  it('returns 2-column output for multi-row input', () => {
    const data = [
      [1, 2, 3, 4],
      [2, 3, 4, 5],
      [3, 4, 5, 6],
      [4, 5, 6, 7],
    ]
    const result = computePca(data)
    expect(result).toHaveLength(4)
    for (const coord of result) {
      expect(coord).toHaveLength(2)
    }
  })

  it('returns finite numbers for all coordinates', () => {
    const data = [
      [0, 1, 0, 2, 1, 0, -1, 0, 0, 0, 1, 0],
      [1, 0, 2, 0, -1, 1, 0, 1, 0, 2, 0, 1],
      [2, 1, 1, -1, 0, 2, 1, 0, 1, 1, -1, 0],
    ]
    const result = computePca(data)
    for (const [x, y] of result) {
      expect(isFinite(x)).toBe(true)
      expect(isFinite(y)).toBe(true)
    }
  })
})
