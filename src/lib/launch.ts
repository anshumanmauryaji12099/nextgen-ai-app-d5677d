import { useNavigate } from '@tanstack/react-router'
import { createConversation, sendMessage, type Attachment } from './chat-store'
import type { AssistantMode } from './fixtures'

/** Starts a new conversation in a given mode and opens it in Chat. */
export function useLaunchAssistant() {
  const navigate = useNavigate()
  return (
    mode: AssistantMode,
    prompt: string,
    attachments: Attachment[] = [],
  ) => {
    const id = createConversation(mode)
    sendMessage(id, prompt, attachments)
    void navigate({ to: '/chat', search: { c: id } })
  }
}
