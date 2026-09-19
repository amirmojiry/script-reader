export function timelinePositionPercent(blockIndex: number, maxBlockIndex: number): number {
  if (!Number.isFinite(blockIndex) || blockIndex <= 0) return 0
  const denominator = Math.max(1, maxBlockIndex)
  return Math.min(99, Math.max(0, (blockIndex / denominator) * 100))
}
