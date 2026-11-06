/**
 * Conversation store (client-side, milestone 1).
 *
 * Conversations persist in this device's localStorage so they survive reloads,
 * offline use and app updates. Milestone 2 moves them to Netlify Database per
 * signed-in user, keeping this module's public API so screens don't change.
 */
import { createStore, useStore } from './external-store'
import { SEED_CONVERSATIONS, type AssistantMode } from './fixtures'
import { streamDemoReply, type StreamReply } from './demo-engine'

export type Attachment = {
  id: string
  name: string
  size: number
  type: string
  kind: 'image' | 'file'
  /** Session-only object URL for image previews; not persisted. */
  previewUrl?: string
}

export type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: number
  attachments?: Attachment[]
  status?: 'streaming' | 'done' | 'stopped' | 'error'
  demo?: boolean
}

export type Conversation = {
  id: string
  title: string
  mode: AssistantMode
  createdAt: number
  updatedAt: number
  messages: Message[]
  sample?: boolean
}

type ChatState = {
  ready: boolean
  conversations: Conversation[]
  generating: Record<string, boolean>
}

const KEY = 'ng-conversations-v1'
const store = createStore<ChatState>({
  ready: false,
  conversations: [],
  generating: {},
})
const controllers = new Map<string, AbortController>()
/** Swap point for milestone 3 (server streaming). */
const streamReply: StreamReply = streamDemoReply

export const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`

let saveTimer: ReturnType<typeof setTimeout> | undefined
function persist() {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    try {
      const data = store.get().conversations.map((c) => ({
        ...c,
        messages: c.messages.map(({ attachments, ...m }) => ({
          ...m,
          attachments: attachments?.map((a) => ({
            id: a.id,
            name: a.name,
            size: a.size,
            type: a.type,
            kind: a.kind,
          })),
        })),
      }))
      localStorage.setItem(KEY, JSON.stringify(data))
    } catch {
      /* storage full or unavailable — keep working in memory */
    }
  }, 400)
}

function update(fn: (s: ChatState) => ChatState) {
  store.set(fn)
  persist()
}

function updateConversation(id: string, fn: (c: Conversation) => Conversation) {
  update((s) => ({
    ...s,
    conversations: s.conversations.map((c) => (c.id === id ? fn(c) : c)),
  }))
}

export function initChats() {
  if (store.get().ready) return
  let conversations: Conversation[]
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      conversations = (JSON.parse(raw) as Conversation[]).map((c) => ({
        ...c,
        messages: c.messages.map((m) =>
          m.status === 'streaming' ? { ...m, status: 'stopped' as const } : m,
        ),
      }))
    } else {
      const now = Date.now()
      conversations = SEED_CONVERSATIONS.map((seed) => {
        const t = now - seed.hoursAgo * 3_600_000
        return {
          id: uid(),
          title: seed.title,
          mode: seed.mode,
          createdAt: t,
          updatedAt: t,
          sample: true,
          messages: seed.messages.map((m, i) => ({
            id: uid(),
            role: m.role,
            content: m.content,
            createdAt: t + i * 1000,
            status: 'done' as const,
            demo: m.role === 'assistant',
          })),
        }
      })
    }
  } catch {
    conversations = []
  }
  store.set({ ready: true, conversations, generating: {} })
  persist()
}

const titleFrom = (text: string) => {
  const t = text.replace(/\s+/g, ' ').trim()
  return t ? (t.length > 48 ? `${t.slice(0, 48)}…` : t) : 'New conversation'
}

export function createConversation(mode: AssistantMode): string {
  const id = uid()
  const now = Date.now()
  update((s) => ({
    ...s,
    conversations: [
      {
        id,
        title: 'New conversation',
        mode,
        createdAt: now,
        updatedAt: now,
        messages: [],
      },
      ...s.conversations,
    ],
  }))
  return id
}

export function setConversationMode(id: string, mode: AssistantMode) {
  updateConversation(id, (c) => ({ ...c, mode }))
}

export function renameConversation(id: string, title: string) {
  const clean = title.trim().slice(0, 80)
  if (!clean) return
  updateConversation(id, (c) => ({ ...c, title: clean }))
}

export function deleteConversation(id: string) {
  stopReply(id)
  update((s) => ({
    ...s,
    conversations: s.conversations.filter((c) => c.id !== id),
  }))
}

export function clearAllConversations() {
  controllers.forEach((c) => c.abort())
  controllers.clear()
  update((s) => ({ ...s, conversations: [], generating: {} }))
}

/** Adds a user message and starts a reply. */
export function sendMessage(
  id: string,
  content: string,
  attachments: Attachment[] = [],
) {
  const now = Date.now()
  updateConversation(id, (c) => ({
    ...c,
    title:
      c.messages.length === 0 && c.title === 'New conversation'
        ? titleFrom(content || attachments[0]?.name || '')
        : c.title,
    updatedAt: now,
    messages: [
      ...c.messages,
      {
        id: uid(),
        role: 'user',
        content,
        createdAt: now,
        attachments,
        status: 'done',
      },
    ],
  }))
  void runReply(id)
}

/** Removes the last assistant reply and generates it again. */
export function regenerate(id: string) {
  updateConversation(id, (c) => {
    const msgs = [...c.messages]
    if (msgs.at(-1)?.role === 'assistant') msgs.pop()
    return { ...c, messages: msgs }
  })
  void runReply(id)
}

export function stopReply(id: string) {
  controllers.get(id)?.abort()
}

async function runReply(id: string) {
  const conv = store.get().conversations.find((c) => c.id === id)
  const lastUser = conv?.messages.filter((m) => m.role === 'user').at(-1)
  if (!conv || !lastUser || controllers.has(id)) return

  const controller = new AbortController()
  controllers.set(id, controller)
  const replyId = uid()
  store.set((s) => ({ ...s, generating: { ...s.generating, [id]: true } }))
  updateConversation(id, (c) => ({
    ...c,
    messages: [
      ...c.messages,
      {
        id: replyId,
        role: 'assistant',
        content: '',
        createdAt: Date.now(),
        status: 'streaming',
        demo: true,
      },
    ],
  }))

  const patchReply = (fn: (m: Message) => Message) =>
    updateConversation(id, (c) => ({
      ...c,
      updatedAt: Date.now(),
      messages: c.messages.map((m) => (m.id === replyId ? fn(m) : m)),
    }))

  try {
    await streamReply({
      mode: conv.mode,
      prompt: lastUser.content,
      attachments: (lastUser.attachments ?? []).map((a) => ({
        name: a.name,
        type: a.type,
      })),
      signal: controller.signal,
      onToken: (chunk) =>
        patchReply((m) => ({ ...m, content: m.content + chunk })),
    })
    patchReply((m) => ({
      ...m,
      status: controller.signal.aborted ? 'stopped' : 'done',
    }))
  } catch {
    patchReply((m) => ({ ...m, status: 'error' }))
  } finally {
    controllers.delete(id)
    store.set((s) => {
      const rest = { ...s.generating }
      delete rest[id]
      return { ...s, generating: rest }
    })
  }
}

export function useChats() {
  return useStore(store)
}

export function useConversation(id: string | undefined) {
  const { conversations, generating, ready } = useStore(store)
  return {
    ready,
    conversation: conversations.find((c) => c.id === id),
    generating: id ? Boolean(generating[id]) : false,
  }
}

/** Snapshot accessor (tests and non-React callers). */
export function getChatState() {
  return store.get()
}
