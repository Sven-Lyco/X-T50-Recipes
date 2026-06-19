import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import type { Recipe } from '../api/types'
import { MONOCHROME_SIMS, filmSimLabel } from '../filmSimLabel'
import { dynamicRangeLabel, grainSizeLabel, isoModeLabel, scenarioLabel, strengthLabel, wbModeLabel } from '../utils/labels'

function signed(n: number) {
  return n > 0 ? `+${n}` : String(n)
}

const C = { text: '#1a1a1a', muted: '#6b7280', border: '#e5e7eb', bg: '#f9fafb' }

const s = StyleSheet.create({
  page: {
    padding: 16,
    fontSize: 8,
    fontFamily: 'Helvetica',
    color: C.text,
  },
  image: {
    width: '100%',
    height: 72,
    objectFit: 'cover',
    borderRadius: 4,
    marginBottom: 8,
  },
  name: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
    gap: 4,
  },
  badge: {
    backgroundColor: '#1a1a1a',
    color: '#fff',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 3,
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
  },
  badgeLight: {
    backgroundColor: C.bg,
    color: C.text,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 3,
    fontSize: 7,
    borderWidth: 0.5,
    borderColor: C.border,
  },
  columns: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
  },
  col: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 6,
    fontFamily: 'Helvetica-Bold',
    color: C.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
    marginTop: 6,
    paddingBottom: 2,
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
    borderBottomStyle: 'solid',
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 2.5,
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
    borderBottomStyle: 'solid',
  },
  rowLabel: {
    flex: 1,
    color: C.muted,
    fontSize: 7,
  },
  rowValue: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7,
  },
  footer: {
    position: 'absolute',
    bottom: 10,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 6,
    color: C.muted,
  },
})

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  if (value == null) return null
  return (
    <View style={s.row}>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={s.rowValue}>{value}</Text>
    </View>
  )
}

interface Props {
  recipe: Recipe
  previewImageDataUri: string | null
}

export function RecipeCardPdf({ recipe, previewImageDataUri }: Props) {
  const isMonochrome = MONOCHROME_SIMS.includes(recipe.filmSimulation)
  const today = new Date().toLocaleDateString('de-DE')

  return (
    <Document>
      <Page size="A6" style={s.page}>

        {previewImageDataUri && (
          <Image src={previewImageDataUri} style={s.image} />
        )}

        <Text style={s.name}>{recipe.name}</Text>
        <View style={s.badgesRow}>
          <Text style={s.badge}>{filmSimLabel(recipe.filmSimulation)}</Text>
          {recipe.cameraSlot && <Text style={s.badge}>{recipe.cameraSlot}</Text>}
          {recipe.shootingScenario && <Text style={s.badgeLight}>{scenarioLabel(recipe.shootingScenario)}</Text>}
        </View>

        <View style={s.columns}>
          {/* Linke Spalte */}
          <View style={s.col}>
            <Text style={s.sectionTitle}>Bildparameter</Text>
            <Row label="Dynamikbereich" value={dynamicRangeLabel(recipe.dynamicRange)} />
            <Row label="Spitzlichter" value={signed(recipe.highlightTone)} />
            <Row label="Schatten" value={signed(recipe.shadowTone)} />
            <Row label="Farbe" value={signed(recipe.color)} />
            <Row label="Schärfe" value={signed(recipe.sharpness)} />
            <Row label="Hohe ISO-NR" value={signed(recipe.noiseReduction)} />
            <Row label="Klarheit" value={signed(recipe.clarity)} />
            {recipe.isoMode && <Row label="ISO-Modus" value={isoModeLabel(recipe.isoMode)} />}
            {recipe.expCompNote && <Row label="Belichtung" value={recipe.expCompNote} />}

            {isMonochrome && (recipe.monochromeWarmCool != null || recipe.monochromeGreenMagenta != null) && (
              <>
                <Text style={s.sectionTitle}>Monochrome</Text>
                {recipe.monochromeWarmCool != null && <Row label="Warm/Cool" value={signed(recipe.monochromeWarmCool)} />}
                {recipe.monochromeGreenMagenta != null && <Row label="Grün/Magenta" value={signed(recipe.monochromeGreenMagenta)} />}
              </>
            )}
          </View>

          {/* Rechte Spalte */}
          <View style={s.col}>
            <Text style={s.sectionTitle}>Körnung & Effekte</Text>
            <Row label="Körnung" value={strengthLabel(recipe.grainStrength)} />
            {recipe.grainSize && <Row label="Größe" value={grainSizeLabel(recipe.grainSize)} />}
            <Row label="Chrome-Effekt" value={strengthLabel(recipe.colorChromeEffect)} />
            <Row label="Chrom FX Blau" value={strengthLabel(recipe.colorChromeFxBlue)} />

            <Text style={s.sectionTitle}>Weißabgleich</Text>
            <Row label="Modus" value={wbModeLabel(recipe.whiteBalanceMode)} />
            <Row label="WA R/B" value={`${signed(recipe.wbShiftRed)} / ${signed(recipe.wbShiftBlue)}`} />
            {recipe.colorTempKelvin && <Row label="Farbtemp." value={`${recipe.colorTempKelvin} K`} />}
          </View>
        </View>

        <View style={s.footer} fixed>
          <Text>X-T50 Recipes</Text>
          <Text>{today}</Text>
        </View>

      </Page>
    </Document>
  )
}
