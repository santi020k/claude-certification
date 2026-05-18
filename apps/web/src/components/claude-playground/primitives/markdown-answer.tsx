import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'

import remarkGfm from 'remark-gfm'

// Beautiful custom hook for dynamic, character-by-character typing emulation during streaming
function useTypingEffect(rawText: string, isStreaming: boolean) {
  const [displayedText, setDisplayedText] = useState(() => isStreaming ? '' : rawText)
  const rawTextRef = useRef(rawText)
  const displayedTextRef = useRef(isStreaming ? '' : rawText)

  useEffect(() => {
    rawTextRef.current = rawText
  }, [rawText])

  useEffect(() => {
    if (!isStreaming) {
      const target = rawText
      void Promise.resolve().then(() => {
        setDisplayedText(target)
      })

      displayedTextRef.current = rawText

      return
    }

    let animationFrameId: number
    let lastTick = Date.now()

    const tick = () => {
      const targetText = rawTextRef.current
      const currentText = displayedTextRef.current

      if (currentText === targetText) {
        animationFrameId = requestAnimationFrame(tick)

        return
      }

      const now = Date.now()
      const delta = now - lastTick
      const charsBehind = targetText.length - currentText.length
      // Dynamic typing speed based on how far behind we are:
      // - Small queue (close to live): smooth typing (12ms/char)
      // - Medium queue (slightly behind): faster typing (5ms/char)
      // - Large queue (very behind or stream chunk burst): hyper-catchup (1-2ms/char)
      let msPerChar = 12

      if (charsBehind > 100) {
        msPerChar = 1
      } else if (charsBehind > 30) {
        msPerChar = 4
      }

      const charsToAppend = Math.max(1, Math.floor(delta / msPerChar))

      if (charsToAppend > 0) {
        const nextText = targetText.slice(0, currentText.length + charsToAppend)

        setDisplayedText(nextText)

        displayedTextRef.current = nextText

        lastTick = now
      }

      animationFrameId = requestAnimationFrame(tick)
    }

    animationFrameId = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [isStreaming])

  // If we suddenly toggle or stop streaming, make sure we sync instantly
  useEffect(() => {
    if (!isStreaming) {
      const target = rawText
      void Promise.resolve().then(() => {
        setDisplayedText(target)
      })

      displayedTextRef.current = rawText
    }
  }, [rawText, isStreaming])

  return displayedText
}

export function MarkdownAnswer({
  content,
  isStreaming = false
}: {
  content: string
  isStreaming?: boolean
}) {
  const displayedContent = useTypingEffect(content, isStreaming)

  return (
    <div className={isStreaming ? 'prose-streaming' : ''}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1
              className="
                mt-2 text-2xl/tight font-semibold text-foreground
                first:mt-0
              "
            >
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2
              className="
                mt-7 border-b border-white/8 pb-2 text-xl/tight font-semibold
                text-foreground
                first:mt-0
              "
            >
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3
              className="
                mt-6 text-base/tight font-semibold text-orange-100
                first:mt-0
              "
            >
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4
              className="
                mt-5 text-sm font-semibold tracking-wide text-muted-foreground
                uppercase
                first:mt-0
              "
            >
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p
              className="
                my-3 leading-7 text-foreground/85
                first:mt-0
                last:mb-0
              "
            >
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul
              className="
                my-3 space-y-2 pl-5 text-foreground/85
                marker:text-orange-300/70
              "
            >
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol
              className="
                my-3 list-decimal space-y-2 pl-5 text-foreground/85
                marker:text-orange-300/70
              "
            >
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="pl-1 leading-7">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote
              className="
                my-4 border-l-2 border-orange-300/40 pl-4 text-muted-foreground
              "
            >
              {children}
            </blockquote>
          ),
          code: ({ children, className }) => {
            const isBlock =
              typeof className === 'string' && className.includes('language-')

            if (isBlock) {
              return (
                <code
                  className="
                    block rounded-xl border border-white/8 bg-[#15110e] p-4
                    font-mono text-xs/6 text-orange-50/90
                  "
                >
                  {children}
                </code>
              )
            }

            return (
              <code
                className="
                  rounded-md border border-white/8 bg-white/4 px-1.5 py-0.5
                  font-mono text-[0.85em] text-orange-100
                "
              >
                {children}
              </code>
            )
          },
          pre: ({ children }) => <pre className="my-4">{children}</pre>,
          table: ({ children }) => (
            <div className="my-4 rounded-xl border border-white/8">
              <table className="w-full border-collapse text-left text-sm">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th
              className="
                border-b border-white/8 bg-white/4 px-3 py-2 font-semibold
                text-foreground
              "
            >
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td
              className="
                border-b border-white/6 px-3 py-2 text-foreground/80
                last:border-b-0
              "
            >
              {children}
            </td>
          ),
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="
                text-orange-200 underline decoration-orange-300/40
                underline-offset-4 transition
                hover:text-orange-100
              "
            >
              {children}
            </a>
          ),
          hr: () => <hr className="my-6 border-white/8" />
        }}
      >
        {displayedContent}
      </ReactMarkdown>
    </div>
  )
}
