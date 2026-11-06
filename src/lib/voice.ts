/** Thin wrapper over the Web Speech API (Chrome/Edge/Android). */
type RecognitionResult = { transcript: string }
type RecognitionEvent = {
  resultIndex: number
  results: ArrayLike<ArrayLike<RecognitionResult> & { isFinal: boolean }>
}
export type Recognition = {
  lang: string
  continuous: boolean
  interimResults: boolean
  start: () => void
  stop: () => void
  onresult: ((e: RecognitionEvent) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
}

export function getRecognitionCtor(): (new () => Recognition) | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as Record<string, unknown>
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as
    (new () => Recognition) | null
}
