import type { PlayBlock } from '../types'
import { blockText, characterDialogueText, dialogueCharacterIds } from './play'

export function isBlockVisible(block: PlayBlock, hideStageDirections: boolean): boolean {
  return !(hideStageDirections && block.type === 'stage-direction')
}

export function searchBlockIndexes(blocks: PlayBlock[], query: string, hideStageDirections: boolean): number[] {
  const normalized = query.trim().toLocaleLowerCase('fa')
  if (!normalized) return []

  return blocks
    .map((block, index) => ({ block, index }))
    .filter(({ block }) => isBlockVisible(block, hideStageDirections) && blockText(block).toLocaleLowerCase('fa').includes(normalized))
    .map(({ index }) => index)
}

export function rehearsalCueIndexesForOwnIndexes(
  blocks: PlayBlock[],
  ownIndexes: number[],
  currentIndex: number,
  activeSearchIndexes: number[] = []
): number[] {
  const all = blocks.map((block, index) => ({ block, index }))
  if (ownIndexes.length === 0) return all.map(({ index }) => index)

  const ownIndex = ownIndexes.includes(currentIndex)
    ? currentIndex
    : ownIndexes.find((index) => index >= currentIndex) ?? ownIndexes[0]
  const previousDialogue = [...all]
    .reverse()
    .find(({ block, index }) => index < ownIndex && block.type === 'dialogue')

  const indexes = new Set([ownIndex])
  if (previousDialogue) indexes.add(previousDialogue.index)
  if (activeSearchIndexes.includes(currentIndex)) indexes.add(currentIndex)

  return all.filter(({ index }) => indexes.has(index)).map(({ index }) => index)
}

export function automaticReadingText(block: PlayBlock): string {
  if (block.type === 'section') return ''
  return blockText(block).trim()
}

export function isCharacterSpeechBlock(block: PlayBlock, characterId: string | undefined): boolean {
  return characterId !== undefined
    && block.type === 'dialogue'
    && dialogueCharacterIds(block).includes(characterId)
    && Boolean(characterDialogueText(block))
}

export function rehearsalCueIndexes(
  blocks: PlayBlock[],
  characterId: string,
  currentIndex: number,
  activeSearchIndexes: number[] = []
): number[] {
  const ownIndexes = blocks
    .map((block, index) => ({ block, index }))
    .filter(({ block }) => isCharacterSpeechBlock(block, characterId))
    .map(({ index }) => index)

  return rehearsalCueIndexesForOwnIndexes(blocks, ownIndexes, currentIndex, activeSearchIndexes)
}

export function visibleOwnedIndexes(
  blocks: PlayBlock[],
  indexes: number[],
  hideStageDirections: boolean
): number[] {
  return indexes.filter((index) => {
    const block = blocks[index]
    return Boolean(block && isBlockVisible(block, hideStageDirections))
  })
}

export function visibleBlockIndexes(blocks: PlayBlock[], hideStageDirections: boolean): number[] {
  return blocks
    .map((block, index) => ({ block, index }))
    .filter(({ block }) => isBlockVisible(block, hideStageDirections))
    .map(({ index }) => index)
}
