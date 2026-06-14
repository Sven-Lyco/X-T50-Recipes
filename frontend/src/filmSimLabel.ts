import type { FilmSimulation } from './api/types'

export const FILM_SIMS: FilmSimulation[] = [
  'PROVIA', 'VELVIA', 'ASTIA', 'CLASSIC_CHROME', 'CLASSIC_NEGATIVE',
  'REALA_ACE', 'PRO_NEG_HI', 'PRO_NEG_STD',
  'ACROS', 'ACROS_YE', 'ACROS_R', 'ACROS_G',
  'MONOCHROME', 'MONOCHROME_YE', 'MONOCHROME_R', 'MONOCHROME_G',
  'SEPIA', 'NOSTALGIC_NEG', 'ETERNA', 'ETERNA_BLEACH_BYPASS',
]

export const MONOCHROME_SIMS: FilmSimulation[] = [
  'ACROS', 'ACROS_YE', 'ACROS_R', 'ACROS_G',
  'MONOCHROME', 'MONOCHROME_YE', 'MONOCHROME_R', 'MONOCHROME_G',
]

export function filmSimLabel(fs: string): string {
  return fs
    .replace(/_YE$/, ' +Ye')
    .replace(/_R$/, ' +R')
    .replace(/_G$/, ' +G')
    .replace(/_/g, ' ')
}
