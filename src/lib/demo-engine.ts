/**
 * Demo reply engine — used while no AI provider is connected.
 *
 * It produces clearly labelled sample replies and streams them token by token
 * so the chat experience (streaming, stop, regenerate) can be exercised end to
 * end. Milestone 3 swaps this for a streaming server endpoint; the
 * `StreamReply` signature is the contract the real client will keep.
 */
import type { AssistantMode } from './fixtures'

export type StreamReply = (args: {
  mode: AssistantMode
  prompt: string
  attachments: { name: string; type: string }[]
  signal: AbortSignal
  onToken: (chunk: string) => void
}) => Promise<void>

const hasDevanagari = (s: string) => /[ऀ-ॿ]/.test(s)
const clip = (s: string, n = 80) =>
  s.length > n ? `${s.slice(0, n).trim()}…` : s

function buildReply(
  mode: AssistantMode,
  prompt: string,
  files: { name: string }[],
) {
  const topic = clip(prompt.replace(/\s+/g, ' ').trim()) || 'your request'
  const fileNote = files.length
    ? `\n\n📎 Received ${files.length} attachment${files.length > 1 ? 's' : ''}: ${files
        .map((f) => `\`${f.name}\``)
        .join(', ')}. File reading arrives with the AI provider connection.`
    : ''
  const footer = `\n\n---\n*Demo reply — NEXTGEN AI isn’t connected to an AI provider yet, so this is sample text showing how answers are formatted.*`

  if (hasDevanagari(prompt)) {
    return `## आपका प्रश्न: “${topic}”

**चरण 1 — मूल विचार समझें**
सबसे पहले विषय की परिभाषा और मुख्य शब्दों को पहचानें।

**चरण 2 — उदाहरण से जोड़ें**
रोज़मर्रा के जीवन से एक उदाहरण लें ताकि अवधारणा याद रहे।

**चरण 3 — अभ्यास करें**
1. एक छोटा प्रश्न स्वयं हल करें।
2. अपने उत्तर की जाँच करें।${fileNote}

---
*डेमो उत्तर — AI प्रदाता अभी जुड़ा नहीं है, इसलिए यह केवल नमूना पाठ है।*`
  }

  switch (mode) {
    case 'study':
      return `## Let’s work through: “${topic}”

**Step 1 — Understand the idea.** Restate the question in your own words and list what is given.

**Step 2 — Pick a method.** Choose the rule, formula or concept that connects what you know to what you need.

**Step 3 — Work it out.** Apply the method one line at a time:

\`\`\`
given → rule → substitute → simplify → answer
\`\`\`

**Step 4 — Check.** Substitute your answer back or estimate to see if it’s reasonable.

### Quick practice
1. Try a similar problem with different numbers.
2. Explain the method to a friend in two sentences.${fileNote}${footer}`
    case 'code': {
      const py = /python|\.py\b|def |pandas|list/i.test(prompt)
      const code = py
        ? `def unique(items):
    """Return items without duplicates, keeping order."""
    seen = set()
    return [x for x in items if not (x in seen or seen.add(x))]


print(unique([3, 1, 3, 2, 1]))  # [3, 1, 2]`
        : `// Fetch JSON safely and surface errors
export async function getJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(\`Request failed: \${res.status}\`)
  return res.json() // ← return the promise's value
}`
      return `### Working on: “${topic}”

Here’s the shape of a typical answer — explanation first, then code:

\`\`\`${py ? 'python' : 'js'}
${code}
\`\`\`

**Why this works**
- Each step is small and testable.
- Errors are raised early instead of failing silently.

**Next steps:** add tests, then handle edge cases such as empty input.${fileNote}${footer}`
    }
    case 'docs':
      return `### Document brief

| Section | What you’ll get |
| --- | --- |
| Summary | 5 key points in plain language |
| Details | Dates, names and figures extracted |
| Actions | Follow-ups and open questions |

Your request: **“${topic}”**${fileNote || '\n\nAttach a PDF, DOCX or TXT file with the paperclip to analyse it.'}${footer}`
    case 'research':
      return `## Research brief: ${topic}

1. **Context** — why this matters now.
2. **Key factors** — cost, impact, risks and who is affected.
3. **Evidence to look for** — data sources and how to judge them.
4. **Open questions** — what still needs an answer.

> Live research answers will cite their sources once a provider is connected.${fileNote}${footer}`
    default:
      return `Great question — **“${topic}”**.

Here’s how I’d approach it:

- **Clarify the goal** — what does a good outcome look like?
- **Gather options** — list two or three realistic choices.
- **Decide** — compare them on cost, time and effort.

Want me to turn this into a checklist?${fileNote}${footer}`
  }
}

export const streamDemoReply: StreamReply = async ({
  mode,
  prompt,
  attachments,
  signal,
  onToken,
}) => {
  const text = buildReply(mode, prompt, attachments)
  // Small "thinking" pause, then stream in word-sized chunks.
  await wait(450, signal)
  const parts = text.match(/\s*\S+/g) ?? [text]
  for (const part of parts) {
    if (signal.aborted) return
    onToken(part)
    await wait(14 + Math.random() * 22, signal)
  }
}

function wait(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve) => {
    if (signal.aborted) return resolve()
    const t = setTimeout(resolve, ms)
    signal.addEventListener('abort', () => {
      clearTimeout(t)
      resolve()
    })
  })
}
