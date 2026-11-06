/**
 * Stubbed product data for milestone 1.
 *
 * Everything in this file is sample content so the product can be explored
 * before the AI providers and database are connected. Later milestones replace
 * these exports with real data (see PLAN.md). Keep stubs here — not scattered
 * through components — so they are easy to find and remove.
 */

export type AssistantMode = 'chat' | 'study' | 'code' | 'docs' | 'research'

export type ModeInfo = {
  id: AssistantMode
  label: string
  short: string
  tagline: string
  placeholder: string
  suggestions: string[]
}

export const MODES: Record<AssistantMode, ModeInfo> = {
  chat: {
    id: 'chat',
    label: 'Assistant',
    short: 'Chat',
    tagline: 'Ask anything, draft anything, think out loud.',
    placeholder: 'Message NEXTGEN AI…',
    suggestions: [
      'Plan a 3-day trip to Jaipur on a student budget',
      'Write a polite follow-up email after a job interview',
      'Compare electric scooters vs. bikes for city commuting',
    ],
  },
  study: {
    id: 'study',
    label: 'Study Assistant',
    short: 'Study',
    tagline: 'Step-by-step explanations, practice and quizzes.',
    placeholder: 'Ask a study question or paste a problem…',
    suggestions: [
      'Explain photosynthesis step by step for Class 10',
      'Solve: 2x² − 7x + 3 = 0 and show every step',
      'न्यूटन के गति के तीन नियम सरल भाषा में समझाइए',
    ],
  },
  code: {
    id: 'code',
    label: 'Coding Assistant',
    short: 'Code',
    tagline: 'Explain, debug, format and plan code safely.',
    placeholder: 'Paste code or describe what you want to build…',
    suggestions: [
      'Debug: my JavaScript fetch returns undefined',
      'Write a Python function to remove duplicates from a list',
      'Plan the file structure for a small HTML/CSS portfolio',
    ],
  },
  docs: {
    id: 'docs',
    label: 'Document Assistant',
    short: 'Docs',
    tagline: 'Summarize, question and extract from your files.',
    placeholder: 'Attach a document and ask about it…',
    suggestions: [
      'Summarize the attached PDF in 5 bullet points',
      'Extract all dates and deadlines from this document',
      'Turn these meeting notes into action items',
    ],
  },
  research: {
    id: 'research',
    label: 'Research Assistant',
    short: 'Research',
    tagline: 'Structured briefs with questions worth asking.',
    placeholder: 'What should we research?',
    suggestions: [
      'Research brief: impact of AI on Indian agriculture',
      'Pros and cons of solar rooftops for apartments',
      'What questions should I ask before choosing a college?',
    ],
  },
}

export const MODE_ORDER: AssistantMode[] = [
  'chat',
  'study',
  'code',
  'docs',
  'research',
]

/** AI provider status. Milestone 3 replaces this with a live server check. */
export const PROVIDER_STATUS = {
  demo: true,
  textProvider: null as string | null,
  imageProvider: 'Gemini · Netlify AI Gateway' as string | null,
  dailyMessageLimit: 50,
  dailyImageLimit: 10,
}

export type SeedMessage = { role: 'user' | 'assistant'; content: string }
export type SeedConversation = {
  title: string
  mode: AssistantMode
  hoursAgo: number
  messages: SeedMessage[]
}

export const SEED_CONVERSATIONS: SeedConversation[] = [
  {
    title: 'Quadratic equations — factorisation',
    mode: 'study',
    hoursAgo: 3,
    messages: [
      { role: 'user', content: 'How do I solve x² − 5x + 6 = 0?' },
      {
        role: 'assistant',
        content: `## Solving x² − 5x + 6 = 0 by factorisation

**Step 1 — Find two numbers** that multiply to **+6** and add to **−5**.
Those are **−2** and **−3**.

**Step 2 — Split and factor**

\`\`\`
x² − 2x − 3x + 6 = 0
x(x − 2) − 3(x − 2) = 0
(x − 2)(x − 3) = 0
\`\`\`

**Step 3 — Set each factor to zero:** x = 2 or x = 3.

> ✅ Check: 2² − 5·2 + 6 = 0 ✓

*Sample conversation — connect an AI provider for live answers.*`,
      },
    ],
  },
  {
    title: 'Debounce helper in JavaScript',
    mode: 'code',
    hoursAgo: 28,
    messages: [
      { role: 'user', content: 'Write a debounce function in JavaScript.' },
      {
        role: 'assistant',
        content: `Here's a small, dependency-free **debounce**:

\`\`\`js
export function debounce(fn, wait = 300) {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), wait)
  }
}
\`\`\`

**How it works**
1. Every call clears the previous timer.
2. \`fn\` runs only after \`wait\` ms of silence.

*Sample conversation — connect an AI provider for live answers.*`,
      },
    ],
  },
]

export type GalleryItem = {
  id: string
  src: string
  prompt: string
  style: string
  ratio: string
}

/** Sample artwork shown in the Image Studio gallery until generation is live. */
export const SAMPLE_GALLERY: GalleryItem[] = [
  {
    id: 's1',
    src: '/img/sample-1.jpg',
    prompt: 'Misty bioluminescent forest at blue hour, glowing teal mushrooms',
    style: 'Cinematic',
    ratio: '1:1',
  },
  {
    id: 's2',
    src: '/img/sample-2.jpg',
    prompt: 'Tiny floating island city with glass towers and a lime waterfall',
    style: '3D render',
    ratio: '1:1',
  },
  {
    id: 's3',
    src: '/img/sample-3.jpg',
    prompt: 'Ceramic robot reading in a sunlit library',
    style: 'Editorial',
    ratio: '1:1',
  },
  {
    id: 's4',
    src: '/img/sample-4.jpg',
    prompt: 'Swirling ink in deep navy, chartreuse and coral',
    style: 'Abstract',
    ratio: '1:1',
  },
]

export type TaskStatus = 'queued' | 'running' | 'done' | 'failed'
export type SampleTask = {
  id: string
  title: string
  kind: 'document' | 'study' | 'image' | 'code' | 'research'
  status: TaskStatus
  progress: number
  detail: string
  result?: string
  error?: string
  minutesAgo: number
}

/** Sample tasks for the Task Manager preview (milestone 6 makes these real). */
export const SAMPLE_TASKS: SampleTask[] = [
  {
    id: 't1',
    title: 'Summarize “Physics Ch. 4 — Motion.pdf”',
    kind: 'document',
    status: 'running',
    progress: 64,
    detail: 'Reading page 9 of 14',
    minutesAgo: 2,
  },
  {
    id: 't2',
    title: 'Generate 20 MCQs — Indian History (Medium)',
    kind: 'study',
    status: 'done',
    progress: 100,
    detail: 'Completed in 38s',
    result: '20 questions with answers and explanations',
    minutesAgo: 12,
  },
  {
    id: 't3',
    title: 'Remove background — product-photo.png',
    kind: 'image',
    status: 'failed',
    progress: 30,
    detail: 'Stopped at upload validation',
    error: 'File is 14.2 MB — the limit is 10 MB.',
    minutesAgo: 25,
  },
  {
    id: 't4',
    title: 'Explain and refactor script.py',
    kind: 'code',
    status: 'queued',
    progress: 0,
    detail: 'Waiting for a free slot',
    minutesAgo: 1,
  },
  {
    id: 't5',
    title: 'Research brief — rooftop solar costs',
    kind: 'research',
    status: 'done',
    progress: 100,
    detail: 'Completed in 1m 12s',
    result: '6-section brief with open questions',
    minutesAgo: 64,
  },
]

export const STUDY_TOOLS = [
  {
    id: 'explain',
    label: 'Explain a topic',
    hint: 'Step by step, with examples',
    template: 'Explain "{topic}" step by step with simple examples.',
  },
  {
    id: 'math',
    label: 'Solve a math problem',
    hint: 'Every step shown',
    template: 'Solve this problem and explain each step clearly: {topic}',
  },
  {
    id: 'science',
    label: 'Science concept',
    hint: 'Intuition first, then detail',
    template:
      'Explain the science concept "{topic}" — start with intuition, then the detail.',
  },
  {
    id: 'practice',
    label: 'Practice questions',
    hint: 'Short and long answer',
    template: 'Create practice questions on "{topic}" with model answers.',
  },
  {
    id: 'mcq',
    label: 'MCQ generator',
    hint: '10 questions with answers',
    template:
      'Generate 10 multiple-choice questions on "{topic}" with the correct answer and a one-line explanation for each.',
  },
  {
    id: 'notes',
    label: 'Notes generator',
    hint: 'Revision-ready notes',
    template:
      'Write concise revision notes on "{topic}" with headings, key terms and a summary.',
  },
  {
    id: 'chapter',
    label: 'Chapter-wise help',
    hint: 'Key ideas per chapter',
    template:
      'Give chapter-wise study help for "{topic}": key ideas, formulas and likely exam questions.',
  },
  {
    id: 'quiz',
    label: 'Quiz mode',
    hint: 'One question at a time',
    template:
      'Quiz me on "{topic}". Ask one question at a time and wait for my answer before revealing it.',
  },
] as const

export const CODE_TOOLS = [
  {
    id: 'explain',
    label: 'Explain code',
    hint: 'Line by line',
    template: 'Explain this code line by line:\n\n{topic}',
  },
  {
    id: 'debug',
    label: 'Debug',
    hint: 'Find and fix the bug',
    template:
      'Find the bug in this code, explain the cause and give a fixed version:\n\n{topic}',
  },
  {
    id: 'format',
    label: 'Format & clean up',
    hint: 'Readable, idiomatic',
    template:
      'Format and clean up this code without changing its behaviour:\n\n{topic}',
  },
  {
    id: 'generate',
    label: 'Generate code',
    hint: 'Safe, commented',
    template: 'Write safe, well-commented code for: {topic}',
  },
  {
    id: 'plan',
    label: 'Plan a project',
    hint: 'Files, steps, stack',
    template:
      'Plan a project: {topic}. Give the file structure, steps and recommended stack.',
  },
] as const

export const CODE_LANGUAGES = [
  'HTML',
  'CSS',
  'JavaScript',
  'Python',
  'TypeScript',
  'Other',
] as const
