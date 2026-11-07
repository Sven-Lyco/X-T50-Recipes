import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../test-utils'
import RecipeDifferenceList from './RecipeDifferenceList'
import type { Recipe } from '../api/types'

function recipe(overrides: Partial<Recipe> = {}): Recipe {
  return {
    id: 'r', name: 'R', filmSimulation: 'PROVIA', dynamicRange: 'DR_AUTO',
    highlightTone: 0, shadowTone: 0, color: 0, sharpness: 0, noiseReduction: 0,
    grainStrength: 'OFF', grainSize: null, colorChromeEffect: 'OFF', colorChromeFxBlue: 'OFF',
    whiteBalanceMode: 'AUTO', wbShiftRed: 0, wbShiftBlue: 0, colorTempKelvin: null, clarity: 0,
    monochromeWarmCool: null, monochromeGreenMagenta: null, isoMode: null, isoNote: null,
    expCompNote: null, description: null, inspirationSource: null, tags: [], cameraSlot: null,
    favorite: false, aiGenerated: false, shootingScenario: null, images: [],
    createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('RecipeDifferenceList', () => {
  it('shows one line per difference as "Label: value A → value B", largest first', () => {
    renderWithProviders(
      <RecipeDifferenceList a={recipe()} b={recipe({ grainStrength: 'STRONG', grainSize: 'SMALL', color: 2 })} />
    )
    const lines = screen.getAllByText(/→/).map(e => e.textContent)
    expect(lines).toEqual(['Körnungseffekt: Aus → Stark', 'Farbe: 0 → +2'])
  })

  it('shows at most 3 differences', () => {
    renderWithProviders(
      <RecipeDifferenceList a={recipe()} b={recipe({ filmSimulation: 'VELVIA', color: 2, shadowTone: 2, highlightTone: 2, sharpness: 2 })} />
    )
    expect(screen.getAllByText(/→/)).toHaveLength(3)
  })

  it('shows "Keine Unterschiede" when no compared setting differs', () => {
    renderWithProviders(<RecipeDifferenceList a={recipe()} b={recipe({ name: 'Other' })} />)
    expect(screen.getByText('Keine Unterschiede')).toBeTruthy()
    expect(screen.queryByText(/→/)).toBeNull()
  })
})
