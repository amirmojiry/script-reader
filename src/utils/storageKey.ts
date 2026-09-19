export function makePairKey(playId: string, blockId: string): string {
  return JSON.stringify([playId, blockId])
}

export function parsePairKey(value: string): [string, string] | undefined {
  try {
    const parsed: unknown = JSON.parse(value)
    if (
      Array.isArray(parsed) &&
      parsed.length === 2 &&
      typeof parsed[0] === 'string' &&
      typeof parsed[1] === 'string'
    ) {
      return [parsed[0], parsed[1]]
    }
  } catch {
    // Ignore keys written by older development builds or unrelated values.
  }
  return undefined
}
