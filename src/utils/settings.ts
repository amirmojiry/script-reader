import type { ReaderFont, ReaderSettings } from '../types'

export const READER_FONT_OPTIONS: Array<{ value: ReaderFont; label: string; family: string }> = [
  { value: 'vazirmatn', label: 'Vazirmatn', family: "'Vazirmatn', Tahoma, Arial, sans-serif" },
  { value: 'noto-sans-arabic', label: 'Noto Sans Arabic', family: "'Noto Sans Arabic', 'Vazirmatn', Tahoma, sans-serif" },
  { value: 'noto-naskh-arabic', label: 'Noto Naskh Arabic', family: "'Noto Naskh Arabic', 'Amiri', serif" },
  { value: 'amiri', label: 'Amiri', family: "'Amiri', 'Noto Naskh Arabic', serif" },
  { value: 'lalezar', label: 'Lalezar', family: "'Lalezar', 'Vazirmatn', sans-serif" },
  { value: 'katibeh', label: 'Katibeh', family: "'Katibeh', 'Amiri', serif" },
  { value: 'parastoo', label: 'Parastoo', family: "'Parastoo', 'Vazirmatn', Tahoma, sans-serif" }
]

export const DEFAULT_READER_SETTINGS: ReaderSettings = {
  fontSize: 18,
  lineHeight: 1.95,
  font: 'vazirmatn',
  theme: 'light',
  hideStageDirections: false,
  keepAwake: false,
  rehearsalRevealMode: 'hidden',
  rehearsalCueOnly: false
}

const readerFonts = new Set<ReaderFont>(READER_FONT_OPTIONS.map((option) => option.value))
const legacyFontMap: Record<string, ReaderFont> = {
  system: 'vazirmatn',
  sans: 'noto-sans-arabic',
  serif: 'noto-naskh-arabic'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function boundedNumber(value: unknown, fallback: number, min: number, max: number): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.min(max, Math.max(min, value))
    : fallback
}

export function normalizeReaderSettings(value: unknown): ReaderSettings {
  if (!isRecord(value)) return { ...DEFAULT_READER_SETTINGS }

  const rawFont = typeof value.font === 'string' ? value.font : DEFAULT_READER_SETTINGS.font
  const migratedFont = legacyFontMap[rawFont] ?? rawFont
  const font = readerFonts.has(migratedFont as ReaderFont)
    ? migratedFont as ReaderFont
    : DEFAULT_READER_SETTINGS.font

  const reveal = value.rehearsalRevealMode
  const rehearsalRevealMode = reveal === 'first-words' || reveal === 'progressive' || reveal === 'hidden'
    ? reveal
    : DEFAULT_READER_SETTINGS.rehearsalRevealMode

  return {
    fontSize: boundedNumber(value.fontSize, DEFAULT_READER_SETTINGS.fontSize, 14, 30),
    lineHeight: boundedNumber(value.lineHeight, DEFAULT_READER_SETTINGS.lineHeight, 1.4, 2.6),
    font,
    theme: value.theme === 'dark' ? 'dark' : 'light',
    hideStageDirections: typeof value.hideStageDirections === 'boolean' ? value.hideStageDirections : false,
    keepAwake: typeof value.keepAwake === 'boolean' ? value.keepAwake : false,
    rehearsalRevealMode,
    rehearsalCueOnly: typeof value.rehearsalCueOnly === 'boolean' ? value.rehearsalCueOnly : false
  }
}

export function fontFamilyFor(font: ReaderFont): string {
  return READER_FONT_OPTIONS.find((option) => option.value === font)?.family
    ?? READER_FONT_OPTIONS[0].family
}
