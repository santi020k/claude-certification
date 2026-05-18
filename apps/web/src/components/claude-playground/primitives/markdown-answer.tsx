import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export function MarkdownAnswer({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h1 className="
            text-foreground mt-2 text-2xl/tight font-semibold
            first:mt-0
          "
          >
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="
            text-foreground mt-7 border-b border-white/8 pb-2 text-xl/tight
            font-semibold
            first:mt-0
          "
          >
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="
            mt-6 text-base/tight font-semibold text-orange-100
            first:mt-0
          "
          >
            {children}
          </h3>
        ),
        h4: ({ children }) => (
          <h4 className="
            text-muted-foreground mt-5 text-sm font-semibold tracking-wide
            uppercase
            first:mt-0
          "
          >
            {children}
          </h4>
        ),
        p: ({ children }) => (
          <p className="
            text-foreground/85 my-3 leading-7
            first:mt-0
            last:mb-0
          "
          >
            {children}
          </p>
        ),
        ul: ({ children }) => (
          <ul className="
            text-foreground/85 my-3 space-y-2 pl-5
            marker:text-orange-300/70
          "
          >
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="
            text-foreground/85 my-3 list-decimal space-y-2 pl-5
            marker:text-orange-300/70
          "
          >
            {children}
          </ol>
        ),
        li: ({ children }) => <li className="pl-1 leading-7">{children}</li>,
        blockquote: ({ children }) => (
          <blockquote className="
            text-muted-foreground my-4 border-l-2 border-orange-300/40 pl-4
          "
          >
            {children}
          </blockquote>
        ),
        code: ({ children, className }) => {
          const isBlock = typeof className === 'string' && className.includes('language-')

          if (isBlock) {
            return (
              <code className="
                block overflow-x-auto rounded-xl border border-white/8
                bg-[#15110e] p-4 font-mono text-xs/6 text-orange-50/90
              "
              >
                {children}
              </code>
            )
          }

          return (
            <code className="
              rounded-md border border-white/8 bg-white/4 px-1.5 py-0.5
              font-mono text-[0.85em] text-orange-100
            "
            >
              {children}
            </code>
          )
        },
        pre: ({ children }) => <pre className="my-4 overflow-x-auto">{children}</pre>,
        table: ({ children }) => (
          <div className="my-4 overflow-x-auto rounded-xl border border-white/8">
            <table className="w-full border-collapse text-left text-sm">{children}</table>
          </div>
        ),
        th: ({ children }) => (
          <th className="
            text-foreground border-b border-white/8 bg-white/4 px-3 py-2
            font-semibold
          "
          >
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="
            text-foreground/80 border-b border-white/6 px-3 py-2
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
      {content}
    </ReactMarkdown>
  )
}
