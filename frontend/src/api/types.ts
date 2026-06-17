export type FilmSimulation =
  | 'PROVIA' | 'VELVIA' | 'ASTIA' | 'CLASSIC_CHROME' | 'CLASSIC_NEGATIVE'
  | 'REALA_ACE' | 'PRO_NEG_HI' | 'PRO_NEG_STD'
  | 'ACROS' | 'ACROS_YE' | 'ACROS_R' | 'ACROS_G'
  | 'MONOCHROME' | 'MONOCHROME_YE' | 'MONOCHROME_R' | 'MONOCHROME_G'
  | 'SEPIA' | 'NOSTALGIC_NEG' | 'ETERNA' | 'ETERNA_BLEACH_BYPASS'

export type DynamicRange = 'DR_AUTO' | 'DR100' | 'DR200' | 'DR400'
export type GrainStrength = 'OFF' | 'WEAK' | 'STRONG'
export type GrainSize = 'SMALL' | 'LARGE'
export type EffectStrength = 'OFF' | 'WEAK' | 'STRONG'
export type WhiteBalanceMode =
  | 'AUTO_WHITE' | 'AUTO' | 'AUTO_AMBIENT'
  | 'DAYLIGHT' | 'SHADE' | 'FLUORESCENT_1' | 'FLUORESCENT_2'
  | 'FLUORESCENT_3' | 'INCANDESCENT' | 'UNDERWATER' | 'COLOR_TEMP'
  | 'CUSTOM_1' | 'CUSTOM_2' | 'CUSTOM_3'
export type CameraSlot = 'C1' | 'C2' | 'C3' | 'C4' | 'C5' | 'C6' | 'C7'
export const CAMERA_SLOTS: CameraSlot[] = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7']

export interface RecipeImage {
  id: string
  filename: string
  caption: string | null
  sortOrder: number
}

export interface RecipeListItem {
  id: string
  name: string
  filmSimulation: FilmSimulation
  cameraSlot: CameraSlot | null
  tags: string[]
  previewImageFilename: string | null
  favorite: boolean
}

export interface Recipe {
  id: string
  name: string
  filmSimulation: FilmSimulation
  dynamicRange: DynamicRange
  highlightTone: number
  shadowTone: number
  color: number
  sharpness: number
  noiseReduction: number
  grainStrength: GrainStrength
  grainSize: GrainSize | null
  colorChromeEffect: EffectStrength
  colorChromeFxBlue: EffectStrength
  whiteBalanceMode: WhiteBalanceMode
  wbShiftRed: number
  wbShiftBlue: number
  colorTempKelvin: number | null
  clarity: number
  monochromeWarmCool: number | null
  monochromeGreenMagenta: number | null
  isoMode: string | null
  isoNote: string | null
  expCompNote: string | null
  description: string | null
  inspirationSource: string | null
  tags: string[]
  cameraSlot: CameraSlot | null
  favorite: boolean
  images: RecipeImage[]
  createdAt: string
  updatedAt: string
}

export interface RecipeRequest {
  name: string
  filmSimulation: FilmSimulation
  dynamicRange: DynamicRange
  highlightTone: number
  shadowTone: number
  color: number
  sharpness: number
  noiseReduction: number
  grainStrength: GrainStrength
  grainSize: GrainSize | null
  colorChromeEffect: EffectStrength
  colorChromeFxBlue: EffectStrength
  whiteBalanceMode: WhiteBalanceMode
  wbShiftRed: number
  wbShiftBlue: number
  colorTempKelvin: number | null
  clarity: number
  monochromeWarmCool: number | null
  monochromeGreenMagenta: number | null
  isoMode: string | null
  isoNote: string | null
  expCompNote: string | null
  description: string | null
  inspirationSource: string | null
  tags: string[]
  cameraSlot: CameraSlot | null
}

export interface SlotConflict {
  message: string
  occupiedBy: { id: string; name: string }
}