import { describe, it, expect } from 'vitest'
import {
  dynamicRangeLabel,
  strengthLabel,
  grainSizeLabel,
  wbModeLabel,
  isoModeLabel,
  scenarioLabel,
  DR_DATA,
  STRENGTH_DATA,
  GRAIN_SIZE_DATA,
  SCENARIO_DATA,
} from './labels'

describe('dynamicRangeLabel', () => {
  it('maps all DR values to German camera menu labels', () => {
    expect(dynamicRangeLabel('DR_AUTO')).toBe('Auto')
    expect(dynamicRangeLabel('DR100')).toBe('100%')
    expect(dynamicRangeLabel('DR200')).toBe('200%')
    expect(dynamicRangeLabel('DR400')).toBe('400%')
  })

  it('returns unknown value unchanged', () => {
    expect(dynamicRangeLabel('UNKNOWN')).toBe('UNKNOWN')
  })
})

describe('strengthLabel', () => {
  it('maps all strength values', () => {
    expect(strengthLabel('OFF')).toBe('Aus')
    expect(strengthLabel('WEAK')).toBe('Schwach')
    expect(strengthLabel('STRONG')).toBe('Stark')
  })

  it('returns unknown value unchanged', () => {
    expect(strengthLabel('MEDIUM')).toBe('MEDIUM')
  })
})

describe('grainSizeLabel', () => {
  it('maps both grain sizes', () => {
    expect(grainSizeLabel('SMALL')).toBe('Klein')
    expect(grainSizeLabel('LARGE')).toBe('Groß')
  })

  it('returns unknown value unchanged', () => {
    expect(grainSizeLabel('MEDIUM')).toBe('MEDIUM')
  })
})

describe('wbModeLabel', () => {
  it('maps key white balance modes', () => {
    expect(wbModeLabel('AUTO_WHITE')).toBe('WA Priorität Weiß')
    expect(wbModeLabel('AUTO')).toBe('Auto')
    expect(wbModeLabel('AUTO_AMBIENT')).toBe('AA Priorität Umgebung')
    expect(wbModeLabel('DAYLIGHT')).toBe('Tageslicht')
    expect(wbModeLabel('COLOR_TEMP')).toBe('Farbtemperatur')
    expect(wbModeLabel('CUSTOM_1')).toBe('Ben.einst. 1')
    expect(wbModeLabel('INCANDESCENT')).toBe('Glühlampenlicht')
  })

  it('returns unknown value unchanged', () => {
    expect(wbModeLabel('MOONLIGHT')).toBe('MOONLIGHT')
  })
})

describe('isoModeLabel', () => {
  it('maps all ISO modes', () => {
    expect(isoModeLabel('MANUAL')).toBe('Manuell')
    expect(isoModeLabel('AUTO_1')).toBe('Auto 1')
    expect(isoModeLabel('AUTO_2')).toBe('Auto 2')
    expect(isoModeLabel('AUTO_3')).toBe('Auto 3')
  })

  it('returns unknown value unchanged', () => {
    expect(isoModeLabel('AUTO_4')).toBe('AUTO_4')
  })
})

describe('scenarioLabel', () => {
  it('maps selected scenarios', () => {
    expect(scenarioLabel('PORTRAIT')).toBe('Portrait')
    expect(scenarioLabel('STREET')).toBe('Street')
    expect(scenarioLabel('FOG')).toBe('Nebel / Mist')
    expect(scenarioLabel('GOLDEN_HOUR')).toBe('Golden Hour')
    expect(scenarioLabel('WEDDING')).toBe('Hochzeit')
  })

  it('returns unknown value unchanged', () => {
    expect(scenarioLabel('UNDERWATER')).toBe('UNDERWATER')
  })
})

describe('data arrays', () => {
  it('DR_DATA has 4 entries with label and value', () => {
    expect(DR_DATA).toHaveLength(4)
    DR_DATA.forEach(entry => {
      expect(entry).toHaveProperty('label')
      expect(entry).toHaveProperty('value')
    })
  })

  it('DR_DATA values match dynamicRangeLabel', () => {
    DR_DATA.forEach(entry => {
      expect(entry.label).toBe(dynamicRangeLabel(entry.value))
    })
  })

  it('STRENGTH_DATA has 3 entries', () => {
    expect(STRENGTH_DATA).toHaveLength(3)
    STRENGTH_DATA.forEach(entry => {
      expect(entry).toHaveProperty('label')
      expect(entry).toHaveProperty('value')
    })
  })

  it('GRAIN_SIZE_DATA has 2 entries', () => {
    expect(GRAIN_SIZE_DATA).toHaveLength(2)
  })

  it('SCENARIO_DATA contains all 19 scenarios', () => {
    expect(SCENARIO_DATA).toHaveLength(19)
    expect(SCENARIO_DATA.map(d => d.value)).toContain('STREET')
    expect(SCENARIO_DATA.map(d => d.value)).toContain('FOG')
  })
})
