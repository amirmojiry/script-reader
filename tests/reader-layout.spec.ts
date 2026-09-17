import { describe, expect, it } from 'vitest'
import css from '../src/styles-v13.css?raw'

describe('collapsed reader layout', () => {
  it('expands reader main content when the roles panel is closed', () => {
    expect(css).toMatch(/\.reader-layout\.sidebar-closed \.reader-main\s*\{[^}]*width:\s*min\(1400px,\s*calc\(100% - 48px\)\)/s)
    expect(css).toMatch(/\.reader-layout\.sidebar-closed \.reader-main\s*\{[^}]*margin-inline:\s*auto/s)
  })
})
