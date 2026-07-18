import { describe, it, expect } from 'vitest'
import { FILM_SIMS, MONOCHROME_SIMS, filmSimLabel } from './filmSimLabel'

describe('FILM_SIMS', () => {
  it('has 20 entries', () => {
    expect(FILM_SIMS).toHaveLength(20)
  })

  it('contains PROVIA, VELVIA and all ACROS variants', () => {
    expect(FILM_SIMS).toContain('PROVIA')
    expect(FILM_SIMS).toContain('VELVIA')
    expect(FILM_SIMS).toContain('ACROS')
    expect(FILM_SIMS).toContain('ACROS_YE')
    expect(FILM_SIMS).toContain('ACROS_R')
    expect(FILM_SIMS).toContain('ACROS_G')
  })
})

describe('MONOCHROME_SIMS', () => {
  it('has 8 entries', () => {
    expect(MONOCHROME_SIMS).toHaveLength(8)
  })

  it('every entry contains ACROS or MONOCHROME', () => {
    for (const sim of MONOCHROME_SIMS) {
      expect(sim).toMatch(/ACROS|MONOCHROME/)
    }
  })
})

describe('filmSimLabel', () => {
  it('replaces _YE suffix with +Ye', () => {
    expect(filmSimLabel('ACROS_YE')).toBe('ACROS +Ye')
    expect(filmSimLabel('MONOCHROME_YE')).toBe('MONOCHROME +Ye')
  })

  it('replaces _R suffix with +R', () => {
    expect(filmSimLabel('ACROS_R')).toBe('ACROS +R')
    expect(filmSimLabel('MONOCHROME_R')).toBe('MONOCHROME +R')
  })

  it('replaces _G suffix with +G', () => {
    expect(filmSimLabel('ACROS_G')).toBe('ACROS +G')
    expect(filmSimLabel('MONOCHROME_G')).toBe('MONOCHROME +G')
  })

  it('replaces underscores with spaces for multi-word sims', () => {
    expect(filmSimLabel('CLASSIC_CHROME')).toBe('CLASSIC CHROME')
    expect(filmSimLabel('CLASSIC_NEGATIVE')).toBe('CLASSIC NEGATIVE')
    expect(filmSimLabel('ETERNA_BLEACH_BYPASS')).toBe('ETERNA BLEACH BYPASS')
    expect(filmSimLabel('PRO_NEG_HI')).toBe('PRO NEG HI')
    expect(filmSimLabel('NOSTALGIC_NEG')).toBe('NOSTALGIC NEG')
    expect(filmSimLabel('REALA_ACE')).toBe('REALA ACE')
  })

  it('leaves single-word sims unchanged', () => {
    expect(filmSimLabel('PROVIA')).toBe('PROVIA')
    expect(filmSimLabel('VELVIA')).toBe('VELVIA')
    expect(filmSimLabel('ASTIA')).toBe('ASTIA')
    expect(filmSimLabel('ACROS')).toBe('ACROS')
    expect(filmSimLabel('MONOCHROME')).toBe('MONOCHROME')
    expect(filmSimLabel('SEPIA')).toBe('SEPIA')
    expect(filmSimLabel('ETERNA')).toBe('ETERNA')
  })
})
