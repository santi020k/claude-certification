export function AmbientBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 ">
      <div
        className="
        blob-1 absolute -top-48 -left-48 size-[700px] rounded-full
        bg-orange-800/10 blur-[130px]
      "
      />
      <div
        className="
        blob-2 absolute -right-48 -bottom-64 size-[800px] rounded-full
        bg-stone-300/6 blur-[150px]
      "
      />
      <div
        className="
        blob-3 absolute top-1/3 left-1/2 size-[500px] -translate-x-1/2
        rounded-full bg-amber-900/8 blur-[110px]
      "
      />
    </div>
  );
}
