import Image from "next/image";

export function PlaygroundFooter({ apiBaseUrl }: { apiBaseUrl: string }) {
  return (
    <footer
      className="
        animate-slide-up-fade flex flex-wrap items-center justify-between gap-4
        border-t border-white/6 pt-6 text-xs delay-375
      "
    >
      <div className="flex items-center gap-3">
        <a
          href="https://santi020k.com"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-2 transition-all duration-200"
        >
          <Image
            src="/brand/santi020k.svg"
            alt="santi020k"
            width={18}
            height={18}
            className="
              opacity-40 transition-opacity duration-200
              group-hover:opacity-80
            "
          />
          <span
            className="
              font-medium text-white/30 transition-colors duration-200
              group-hover:text-white/70
            "
          >
            santi020k.com
          </span>
        </a>
        <span className="text-white/10">·</span>
        <a
          href="https://github.com/santi020k/claude-certification"
          target="_blank"
          rel="noopener noreferrer"
          className="
            flex items-center gap-1.5 text-white/25 transition-colors
            duration-200
            hover:text-white/60
          "
        >
          <svg
            viewBox="0 0 16 16"
            className="size-3.5 fill-current"
            aria-hidden="true"
          >
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
          </svg>
          <span>santi020k/claude-certification</span>
        </a>
      </div>

      <div className="flex items-center gap-4">
        <a
          href="https://docs.anthropic.com"
          target="_blank"
          rel="noopener noreferrer"
          className="
            text-white/25 transition-colors duration-200
            hover:text-white/60
          "
        >
          Anthropic docs
        </a>
        <span className="text-white/10">·</span>
        <a
          href={`${apiBaseUrl}/docs`}
          target="_blank"
          rel="noopener noreferrer"
          className="
            text-white/25 transition-colors duration-200
            hover:text-white/60
          "
        >
          API docs ↗
        </a>
      </div>
    </footer>
  );
}
