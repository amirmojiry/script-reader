export type RawPlayRecord = ['s', string] | ['d', string, string]

export interface RawPlaySource {
  id: string
  title: string
  characters: string[]
  records: RawPlayRecord[]
}
