export function dynamicRangeLabel(v: string): string {
  if (v === 'DR_AUTO') return 'Auto'
  if (v === 'DR100') return '100%'
  if (v === 'DR200') return '200%'
  if (v === 'DR400') return '400%'
  return v
}

export function strengthLabel(v: string): string {
  if (v === 'STRONG') return 'Stark'
  if (v === 'WEAK') return 'Schwach'
  if (v === 'OFF') return 'Aus'
  return v
}

export function grainSizeLabel(v: string): string {
  if (v === 'LARGE') return 'Groß'
  if (v === 'SMALL') return 'Klein'
  return v
}

const WB_LABELS: Record<string, string> = {
  AUTO_WHITE: 'WA Priorität Weiß',
  AUTO: 'Auto',
  AUTO_AMBIENT: 'AA Priorität Umgebung',
  DAYLIGHT: 'Tageslicht',
  SHADE: 'Bewölkt',
  FLUORESCENT_1: 'Neonlicht 1',
  FLUORESCENT_2: 'Neonlicht 2',
  FLUORESCENT_3: 'Neonlicht 3',
  INCANDESCENT: 'Glühlampenlicht',
  UNDERWATER: 'Tauchen',
  COLOR_TEMP: 'Farbtemperatur',
  CUSTOM_1: 'Ben.einst. 1',
  CUSTOM_2: 'Ben.einst. 2',
  CUSTOM_3: 'Ben.einst. 3',
}

export function wbModeLabel(v: string): string {
  return WB_LABELS[v] ?? v
}

export const DR_DATA = [
  { label: 'Auto', value: 'DR_AUTO' },
  { label: '100%', value: 'DR100' },
  { label: '200%', value: 'DR200' },
  { label: '400%', value: 'DR400' },
]

export const STRENGTH_DATA = [
  { label: 'Aus', value: 'OFF' },
  { label: 'Schwach', value: 'WEAK' },
  { label: 'Stark', value: 'STRONG' },
]

export const GRAIN_SIZE_DATA = [
  { label: 'Klein', value: 'SMALL' },
  { label: 'Groß', value: 'LARGE' },
]

const ISO_MODE_LABELS: Record<string, string> = {
  MANUAL: 'Manuell',
  AUTO_1: 'Auto 1',
  AUTO_2: 'Auto 2',
  AUTO_3: 'Auto 3',
}

export function isoModeLabel(v: string): string {
  return ISO_MODE_LABELS[v] ?? v
}

export const ISO_MODE_DATA = [
  { label: 'Manuell', value: 'MANUAL' },
  { label: 'Auto 1', value: 'AUTO_1' },
  { label: 'Auto 2', value: 'AUTO_2' },
  { label: 'Auto 3', value: 'AUTO_3' },
]
