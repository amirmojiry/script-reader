import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('collapsed reader layout', () => {
  it('expands reader main content when the roles panel is closed', () => {
    const css = readFileSync(new URL('../src/styles-v13.css', import.meta.url), 'utf8')
    expect(css).toMatch(/\.reader-layout\.sidebar-closed \.reader-main\s*\{[^}]*width:\s*min\(1400px,\s*calc\(100% - 48px\)\)/s)
    expect(css).toMatch(/\.reader-layout\.sidebar-closed \.reader-main\s*\{[^}]*margin-inline:\s*auto/s)
  })
})
