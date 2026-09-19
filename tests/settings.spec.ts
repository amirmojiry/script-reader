import { describe, expect, it } from 'vitest'
import { DEFAULT_READER_SETTINGS, READER_FONT_OPTIONS, fontFamilyFor, normalizeReaderSettings } from '../src/utils/settings'

describe('reader settings', () => {
  it('uses Vazirmatn by default and exposes all requested fonts', () => {
    expect(DEFAULT_READER_SETTINGS.font).toBe('vazirmatn')
    expect(READER_FONT_OPTIONS.map((option) => option.value)).toEqual([
      'vazirmatn',
      'noto-sans-arabic',
      'noto-naskh-arabic',
      'amiri',
      'lalezar',
      'katibeh',
      'parastoo'
    ])
    expect(fontFamilyFor('parastoo')).toContain('Parastoo')
  })

  it('migrates legacy font preferences and keeps persisted values', () => {
    expect(normalizeReaderSettings({ font: 'system', fontSize: 22, lineHeight: 2.2, theme: 'dark' })).toMatchObject({
      font: 'vazirmatn',
      fontSize: 22,
      lineHeight: 2.2,
      theme: 'dark'
    })
    expect(normalizeReaderSettings({ font: 'serif' }).font).toBe('noto-naskh-arabic')
  })

  it('rejects invalid persisted values instead of applying them', () => {
    const settings = normalizeReaderSettings({ font: 'url(https://example.com)', fontSize: 500, lineHeight: -2, theme: 'other' })
    expect(settings.font).toBe('vazirmatn')
    expect(settings.fontSize).toBe(30)
    expect(settings.lineHeight).toBe(1.4)
    expect(settings.theme).toBe('light')
  })
})
