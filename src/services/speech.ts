export function canSpeak(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export function stopSpeaking(): void {
  if (canSpeak()) window.speechSynthesis.cancel()
}

export function speak(text: string, lang = 'fa-IR'): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!canSpeak()) {
      reject(new Error('Speech synthesis is not supported by this browser.'))
      return
    }
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    utterance.onend = () => resolve()
    utterance.onerror = () => reject(new Error('Speech synthesis failed.'))
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  })
}
