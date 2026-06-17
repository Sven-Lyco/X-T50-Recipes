import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import type { Recipe } from '../api/types'
import { MONOCHROME_SIMS, filmSimLabel } from '../filmSimLabel'
import { dynamicRangeLabel, grainSizeLabel, isoModeLabel, strengthLabel, wbModeLabel } from '../utils/labels'

function signed(n: number) {
  return n > 0 ? `+${n}` : String(n)
}

const C = {
  text: '#1a1a1a',
  muted: '#6b7280',
  border: '#e5e7eb',
  sectionBg: '#f9fafb',
}

const s = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 40,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: C.text,
  },
  image: {
    width: '100%',
    height: 210,
    objectFit: 'cover',
    borderRadius: 6,
    marginBottom: 18,
  },
  name: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 6,
  },
  badgesRow: {
    flexDirection: 'row',
    marginBottom: 18,
  },
  badge: {
    backgroundColor: '#1a1a1a',
    color: '#ffffff',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    marginRight: 6,
  },
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: C.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 5,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    borderBottomStyle: 'solid',
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
    borderBottomStyle: 'solid',
  },
  rowLabel: {
    width: '42%',
    color: C.muted,
  },
  rowValue: {
    flex: 1,
    fontFamily: 'Helvetica-Bold',
  },
  descriptionBox: {
    marginTop: 4,
    padding: 10,
    backgroundColor: C.sectionBg,
    borderRadius: 4,
  },
  descriptionTitle: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: C.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 5,
  },
  descriptionText: {
    fontSize: 9,
    lineHeight: 1.6,
    color: '#374151',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  tag: {
    backgroundColor: '#f3f4f6',
    color: '#374151',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 3,
    fontSize: 8,
    marginRight: 4,
    marginBottom: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: C.muted,
  },
})

function ParamRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (value == null) return null
  return (
    <View style={s.row}>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={s.rowValue}>{value}</Text>
    </View>
  )
}

interface RecipePdfProps {
  recipe: Recipe
  previewImageDataUri: string | null
}

export function RecipePdf({ recipe, previewImageDataUri }: RecipePdfProps) {
  const isMonochrome = MONOCHROME_SIMS.includes(recipe.filmSimulation)
  const today = new Date().toLocaleDateString('de-DE')

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {previewImageDataUri && (
          <Image src={previewImageDataUri} style={s.image} />
        )}

        <Text style={s.name}>{recipe.name}</Text>
        <View style={s.badgesRow}>
          <Text style={s.badge}>{filmSimLabel(recipe.filmSimulation)}</Text>
          {recipe.cameraSlot && <Text style={s.badge}>{recipe.cameraSlot}</Text>}
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Bildparameter</Text>
          <ParamRow label="Dynamikbereich" value={dynamicRangeLabel(recipe.dynamicRange)} />
          {recipe.isoMode && <ParamRow label="ISO-Modus" value={isoModeLabel(recipe.isoMode)} />}
          <ParamRow label="Spitzlichter" value={signed(recipe.highlightTone)} />
          <ParamRow label="Schatten" value={signed(recipe.shadowTone)} />
          <ParamRow label="Farbe" value={signed(recipe.color)} />
          <ParamRow label="Schärfe" value={signed(recipe.sharpness)} />
          <ParamRow label="Hohe ISO-NR" value={signed(recipe.noiseReduction)} />
          <ParamRow label="Klarheit" value={signed(recipe.clarity)} />
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Körnung & Effekte</Text>
          <ParamRow label="Körnungseffekt" value={strengthLabel(recipe.grainStrength)} />
          {recipe.grainSize && <ParamRow label="Körnung Größe" value={grainSizeLabel(recipe.grainSize)} />}
          <ParamRow label="Farbe Chrome-Effekt" value={strengthLabel(recipe.colorChromeEffect)} />
          <ParamRow label="Farbe Chrom FX Blau" value={strengthLabel(recipe.colorChromeFxBlue)} />
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Weißabgleich</Text>
          <ParamRow label="Modus" value={wbModeLabel(recipe.whiteBalanceMode)} />
          <ParamRow label="WA Verschieben R/B" value={`${signed(recipe.wbShiftRed)} / ${signed(recipe.wbShiftBlue)}`} />
          {recipe.colorTempKelvin && <ParamRow label="Farbtemperatur" value={`${recipe.colorTempKelvin} K`} />}
        </View>

        {isMonochrome && (recipe.monochromeWarmCool != null || recipe.monochromeGreenMagenta != null) && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Monochrome Farbe</Text>
            {recipe.monochromeWarmCool != null && <ParamRow label="Warm/Cool" value={signed(recipe.monochromeWarmCool)} />}
            {recipe.monochromeGreenMagenta != null && <ParamRow label="Grün/Magenta" value={signed(recipe.monochromeGreenMagenta)} />}
          </View>
        )}

        {(recipe.isoNote || recipe.expCompNote || recipe.inspirationSource) && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Notizen</Text>
            {recipe.isoNote && <ParamRow label="ISO Details" value={recipe.isoNote} />}
            {recipe.expCompNote && <ParamRow label="Belichtung" value={recipe.expCompNote} />}
            {recipe.inspirationSource && <ParamRow label="Referenz" value={recipe.inspirationSource} />}
          </View>
        )}

        {recipe.description && (
          <View style={s.descriptionBox}>
            <Text style={s.descriptionTitle}>Beschreibung</Text>
            <Text style={s.descriptionText}>{recipe.description}</Text>
          </View>
        )}

        {recipe.tags.length > 0 && (
          <View style={s.tagsRow}>
            {recipe.tags.map((tag) => (
              <Text key={tag} style={s.tag}>{tag}</Text>
            ))}
          </View>
        )}

        <View style={s.footer} fixed>
          <Text>X-T50 Recipes</Text>
          <Text>{today}</Text>
        </View>

      </Page>
    </Document>
  )
}
