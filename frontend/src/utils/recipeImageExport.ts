import type { Recipe } from '../api/types'
import { MONOCHROME_SIMS } from '../filmSimLabel'

function signed(n: number): string {
  return n > 0 ? `+${n}` : String(n)
}

function drLabel(v: string): string {
  if (v === 'DR_AUTO') return 'AUTO'
  return v  // DR100, DR200, DR400 as-is
}

function strengthEn(v: string): string {
  if (v === 'STRONG') return 'STRONG'
  if (v === 'WEAK') return 'WEAK'
  return 'OFF'
}

const WB_EN: Record<string, string> = {
  AUTO_WHITE: 'AUTO WHITE PRIORITY',
  AUTO: 'AUTO',
  AUTO_AMBIENT: 'AUTO AMBIENCE',
  DAYLIGHT: 'DAYLIGHT',
  SHADE: 'SHADE',
  FLUORESCENT_1: 'FLUORESCENT 1',
  FLUORESCENT_2: 'FLUORESCENT 2',
  FLUORESCENT_3: 'FLUORESCENT 3',
  INCANDESCENT: 'INCANDESCENT',
  UNDERWATER: 'UNDERWATER',
  COLOR_TEMP: 'COLOR TEMP',
  CUSTOM_1: 'CUSTOM 1',
  CUSTOM_2: 'CUSTOM 2',
  CUSTOM_3: 'CUSTOM 3',
}

export function exportRecipeAsPng(recipe: Recipe): void {
  const isMonochrome = MONOCHROME_SIMS.includes(recipe.filmSimulation)

  // Build WB line: "DAYLIGHT, +2 RED & -5 BLUE" or "5500K, +2 RED & -5 BLUE"
  const wbMode = recipe.whiteBalanceMode === 'COLOR_TEMP' && recipe.colorTempKelvin != null
    ? `${recipe.colorTempKelvin}K`
    : (WB_EN[recipe.whiteBalanceMode] ?? recipe.whiteBalanceMode)
  const wbLine = `${wbMode}, ${signed(recipe.wbShiftRed)} RED & ${signed(recipe.wbShiftBlue)} BLUE`

  // Build grain line: "WEAK, SMALL" or "OFF"
  const grainLine = recipe.grainStrength === 'OFF'
    ? 'OFF'
    : `${strengthEn(recipe.grainStrength)}${recipe.grainSize ? ', ' + recipe.grainSize : ''}`

  // Film simulation: replace underscores, uppercase
  const simLine = recipe.filmSimulation.replace(/_/g, ' ')

  const lines: string[] = [
    `FILM SIM: ${simLine}`,
    `DYNAMIC RANGE: ${drLabel(recipe.dynamicRange)}`,
    `HIGHLIGHT TONE: ${signed(recipe.highlightTone)}`,
    `SHADOW TONE: ${signed(recipe.shadowTone)}`,
    `COLOR: ${signed(recipe.color)}`,
    `NOISE REDUCTION: ${signed(recipe.noiseReduction)}`,
    `SHARPNESS: ${signed(recipe.sharpness)}`,
    `CLARITY: ${signed(recipe.clarity)}`,
    `GRAIN EFFECT: ${grainLine}`,
    `COLOR CHROME EFFECT: ${strengthEn(recipe.colorChromeEffect)}`,
    `COLOR CHROME EFFECT BLUE: ${strengthEn(recipe.colorChromeFxBlue)}`,
    `WB: ${wbLine}`,
  ]

  if (isMonochrome) {
    if (recipe.monochromeWarmCool != null)
      lines.push(`MONOCHROME WARM/COOL: ${signed(recipe.monochromeWarmCool)}`)
    if (recipe.monochromeGreenMagenta != null)
      lines.push(`MONOCHROME GREEN/MAGENTA: ${signed(recipe.monochromeGreenMagenta)}`)
  }

  if (recipe.isoNote) lines.push(`ISO: ${recipe.isoNote.toUpperCase()}`)

  // ── Canvas layout ─────────────────────────────────────────────────────────
  const W = 900
  const PADDING = 56
  const TITLE_H = 80   // recipe name
  const LINE_H = 42
  const FOOTER_H = 48
  const H = PADDING + TITLE_H + lines.length * LINE_H + FOOTER_H + PADDING

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  // Background
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, W, H)

  let y = PADDING

  // Recipe name
  ctx.fillStyle = '#111827'
  ctx.font = 'bold 30px Arial, sans-serif'
  ctx.fillText(recipe.name, PADDING, y + 30)
  y += TITLE_H

  // Parameter lines — label and value placed adjacently so OCR reads them as one unit
  for (const line of lines) {
    const colonIdx = line.indexOf(': ')
    const label = line.substring(0, colonIdx + 2)
    const value = line.substring(colonIdx + 2)

    ctx.font = '18px Arial, sans-serif'
    ctx.fillStyle = '#6b7280'
    ctx.fillText(label, PADDING, y + 18)
    const labelW = ctx.measureText(label).width

    ctx.font = 'bold 18px Arial, sans-serif'
    ctx.fillStyle = '#111827'
    ctx.fillText(value, PADDING + labelW, y + 18)
    y += LINE_H
  }

  // Footer
  y += 12
  ctx.fillStyle = '#d1d5db'
  ctx.fillRect(PADDING, y, W - PADDING * 2, 1)
  y += 12
  ctx.fillStyle = '#9ca3af'
  ctx.font = '13px Arial, sans-serif'
  ctx.fillText(`X-T50 Recipes · ${new Date().toLocaleDateString('de-DE')}`, PADDING, y + 13)

  const dataUrl = canvas.toDataURL('image/png')
  const safeName = recipe.name.replace(/[<>:"/\\|?*]/g, '_')

  // iOS (including PWA standalone) does not honor the download attribute —
  // open in new tab so the user can save via the share sheet ("Bild sichern")
  const isIos =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  if (isIos) {
    window.open(dataUrl, '_blank')
    return
  }

  const a = document.createElement('a')
  a.download = `${safeName}.png`
  a.href = dataUrl
  a.click()
}
