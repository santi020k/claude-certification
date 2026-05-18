export function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span className="relative flex size-2.5 shrink-0">
      {ok ? (
        <span
          className="
            absolute inline-flex size-full animate-ping rounded-full
            bg-emerald-400 opacity-50
          "
        />
      ) : null}
      <span
        className={`
        relative inline-flex size-2.5 rounded-full
        ${ok ? "bg-emerald-500" : "bg-rose-500"}
      `}
      />
    </span>
  );
}
