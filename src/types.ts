export type CharacterGender = 'male' | 'female' | 'unknown'

export interface Character {
  id: string
  name: string
  color?: string
  gender?: CharacterGender
}

export type DialoguePart =
  | { type: 'speech'; text: string }
  | { type: 'direction'; text: string }

export interface DialogueBlock {
  id: string
  type: 'dialogue'
  characterId: string
  characterIds?: string[]
  parts: DialoguePart[]
}

export interface StageDirectionBlock {
  id: string
  type: 'stage-direction'
  text: string
}

export interface SectionBlock {
  id: string
  type: 'section'
  title: string
}

export type PlayBlock = DialogueBlock | StageDirectionBlock | SectionBlock

export interface Scene {
  id: string
  title: string
  blocks: PlayBlock[]
}

export interface Act {
  id: string
  title: string
  scenes: Scene[]
}

export interface Play {
  id: string
  title: string
  author?: string
  translator?: string
  genres?: string[]
  characters: Character[]
  acts: Act[]
}

export type ReaderMode = 'read' | 'rehearsal' | 'table-read'
export type RehearsalRevealMode = 'hidden' | 'first-words' | 'progressive'
export type ReaderFont =
  | 'system'
  | 'sans'
  | 'serif'
  | 'vazirmatn'
  | 'noto-sans-arabic'
  | 'noto-naskh-arabic'
  | 'amiri'
  | 'lalezar'
  | 'katibeh'
  | 'parastoo'

export interface ReaderSettings {
  fontSize: number
  lineHeight: number
  font: ReaderFont
  theme: 'light' | 'dark'
  hideStageDirections: boolean
  keepAwake: boolean
  rehearsalRevealMode: RehearsalRevealMode
  rehearsalCueOnly: boolean
}

export interface ReadingState {
  playId: string
  currentBlockId?: string
  selectedCharacterIds: string[]
  myCharacterId?: string
  narratorSelected?: boolean
  narratorIsMine?: boolean
  narratorColor?: string
  mode: ReaderMode
}

export interface NoteRecord {
  id: string
  playId: string
  blockId: string
  text: string
  createdAt: string
  updatedAt: string
}


export type ProofreadingBlockType = PlayBlock['type']

export interface ProofreadingCorrection {
  id: string
  playId: string
  playTitle: string
  blockId: string
  blockIndex: number
  blockType: ProofreadingBlockType
  dialogueNumber?: number
  originalOffset?: number
  originalText: string
  correctedText: string
  createdAt: string
}
