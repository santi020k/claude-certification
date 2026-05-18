export function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="
            inline-block size-1.5 animate-bounce rounded-full bg-orange-400/60
          "
          style={{ animationDelay: `${i * 140}ms`, animationDuration: '0.9s' }}
        />
      ))}
    </span>
  )
}
