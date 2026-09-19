let wakeLock: WakeLockSentinel | null = null

export function wakeLockSupported(): boolean {
  return typeof navigator !== 'undefined' && 'wakeLock' in navigator
}

export async function requestWakeLock(): Promise<boolean> {
  if (!wakeLockSupported()) return false
  try {
    wakeLock = await navigator.wakeLock.request('screen')
    wakeLock.addEventListener('release', () => { wakeLock = null })
    return true
  } catch {
    wakeLock = null
    return false
  }
}

export async function releaseWakeLock(): Promise<void> {
  if (wakeLock) await wakeLock.release()
  wakeLock = null
}
