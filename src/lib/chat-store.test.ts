import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

async function freshStore() {
  vi.resetModules()
  return import('./chat-store')
}
const flush = async (ms: number) => {
  await vi.advanceTimersByTimeAsync(ms)
}

describe('chat store', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
  })
  afterEach(() => vi.useRealTimers())

  it('seeds sample conversations on first run', async () => {
    const s = await freshStore()
    s.initChats()
    const conv = s.getChatState().conversations
    expect(conv.length).toBe(2)
    expect(conv.every((c) => c.sample)).toBe(true)
  })

  it('streams a demo reply, titles the chat and persists it', async () => {
    const s = await freshStore()
    s.initChats()
    const id = s.createConversation('study')
    s.sendMessage(id, 'Explain photosynthesis')
    expect(s.getChatState().generating[id]).toBe(true)
    await flush(20_000)
    const c = s.getChatState().conversations.find((x) => x.id === id)!
    expect(c.title).toBe('Explain photosynthesis')
    expect(c.messages).toHaveLength(2)
    expect(c.messages[1].status).toBe('done')
    expect(c.messages[1].content).toContain('Demo reply')
    expect(s.getChatState().generating[id]).toBeUndefined()
    const saved = JSON.parse(localStorage.getItem('ng-conversations-v1')!)
    expect(
      saved.find((x: { id: string }) => x.id === id).messages,
    ).toHaveLength(2)
  })

  it('stops a reply mid-stream and can regenerate it', async () => {
    const s = await freshStore()
    s.initChats()
    const id = s.createConversation('chat')
    s.sendMessage(id, 'Hello there')
    await flush(700)
    s.stopReply(id)
    await flush(100)
    let c = s.getChatState().conversations.find((x) => x.id === id)!
    expect(c.messages[1].status).toBe('stopped')
    const partial = c.messages[1].content.length
    s.regenerate(id)
    await flush(20_000)
    c = s.getChatState().conversations.find((x) => x.id === id)!
    expect(c.messages).toHaveLength(2)
    expect(c.messages[1].status).toBe('done')
    expect(c.messages[1].content.length).toBeGreaterThan(partial)
  })

  it('runs replies in separate conversations independently', async () => {
    const s = await freshStore()
    s.initChats()
    const a = s.createConversation('code')
    const b = s.createConversation('study')
    s.sendMessage(a, 'debounce in js')
    s.sendMessage(b, 'solve 2x=4')
    expect(Object.keys(s.getChatState().generating).sort()).toEqual(
      [a, b].sort(),
    )
    s.stopReply(a)
    await flush(20_000)
    const ca = s.getChatState().conversations.find((x) => x.id === a)!
    const cb = s.getChatState().conversations.find((x) => x.id === b)!
    expect(ca.messages[1].status).toBe('stopped')
    expect(cb.messages[1].status).toBe('done')
  })

  it('renames and deletes conversations', async () => {
    const s = await freshStore()
    s.initChats()
    const id = s.createConversation('chat')
    s.renameConversation(id, '  My plan  ')
    expect(s.getChatState().conversations.find((x) => x.id === id)!.title).toBe(
      'My plan',
    )
    s.renameConversation(id, '   ')
    expect(s.getChatState().conversations.find((x) => x.id === id)!.title).toBe(
      'My plan',
    )
    s.deleteConversation(id)
    expect(
      s.getChatState().conversations.find((x) => x.id === id),
    ).toBeUndefined()
  })

  it('restores saved chats on reload and marks interrupted replies as stopped', async () => {
    let s = await freshStore()
    s.initChats()
    const id = s.createConversation('chat')
    s.sendMessage(id, 'Long answer please')
    await flush(900) // persist debounce fires mid-stream
    s = await freshStore()
    s.initChats()
    const c = s.getChatState().conversations.find((x) => x.id === id)!
    expect(c).toBeDefined()
    expect(c.messages[1].status).toBe('stopped')
  })
})

describe('file validation', () => {
  it('rejects oversized, empty and unsupported files', async () => {
    const { validateFile } = await import('./files')
    const big = new File([new Uint8Array(11 * 1024 * 1024)], 'big.pdf', {
      type: 'application/pdf',
    })
    expect(validateFile(big)).toMatch(/limit is 10 MB/)
    expect(validateFile(new File([], 'empty.txt'))).toMatch(/empty/)
    expect(validateFile(new File(['x'], 'run.exe'))).toMatch(/isn’t supported/)
    expect(
      validateFile(new File(['x'], 'notes.pdf', { type: 'application/pdf' }), {
        imagesOnly: true,
      }),
    ).toMatch(/image/)
    expect(
      validateFile(new File(['x'], 'a.png', { type: 'image/png' }), {
        imagesOnly: true,
      }),
    ).toBeNull()
    expect(
      validateFile(new File(['x'], 'notes.pdf', { type: 'application/pdf' })),
    ).toBeNull()
  })
})
