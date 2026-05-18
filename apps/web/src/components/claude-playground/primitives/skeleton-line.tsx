export function SkeletonLine({
  w = "100%",
  delay = 0,
}: {
  w?: string;
  delay?: number;
}) {
  return (
    <div
      className="shimmer h-3 rounded-full"
      style={{ width: w, animationDelay: `${delay}ms` }}
    />
  );
}
