import { memo, useRef, useState, type ComponentProps } from 'react'
import ReactMarkdown, { type ExtraProps } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { Check, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'

function CodeBlock({ children, ...rest }: ComponentProps<'pre'> & ExtraProps) {
  const props = omitNode(rest)
  const ref = useRef<HTMLPreElement>(null)
  const [copied, setCopied] = useState(false)
  const child = Array.isArray(children) ? children[0] : children
  const cls =
    (child as { props?: { className?: string } })?.props?.className ?? ''
  const lang = /language-([\w-]+)/.exec(cls)?.[1]

  return (
    <div className="group/code not-prose overflow-hidden rounded-xl border border-border bg-muted/50">
      <div className="flex items-center justify-between border-b border-border px-3 py-1.5 text-xs text-muted-foreground">
        <span className="font-mono">{lang ?? 'code'}</span>
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(ref.current?.innerText ?? '')
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
          }}
          className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 transition-colors hover:bg-background hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          aria-label="Copy code"
        >
          {copied ? (
            <Check className="size-3.5" />
          ) : (
            <Copy className="size-3.5" />
          )}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre
        ref={ref}
        {...props}
        className="scrollbar-thin overflow-x-auto p-4 text-[13px] leading-relaxed"
      >
        {children}
      </pre>
    </div>
  )
}

function omitNode<T extends { node?: unknown }>(props: T): Omit<T, 'node'> {
  const copy = { ...props }
  delete copy.node
  return copy
}

export const Markdown = memo(function Markdown({
  children,
  className,
}: {
  children: string
  className?: string
}) {
  return (
    <div className={cn('prose-ng', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeHighlight, { detect: false }]]}
        components={{
          pre: CodeBlock,
          a: (props) => (
            <a {...omitNode(props)} target="_blank" rel="noopener noreferrer" />
          ),
          table: (props) => (
            <div className="scrollbar-thin overflow-x-auto">
              <table {...omitNode(props)} />
            </div>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
})
