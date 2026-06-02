export function SkeletonCard() {
  return (
    <div className="glass-strong rounded-2xl p-5">
      <div className="h-3 w-24 rounded-full bg-white/10 animate-shimmer" />
      <div className="mt-3 h-9 w-20 rounded-lg bg-white/10 animate-shimmer" />
      <div className="mt-2 h-3 w-16 rounded-full bg-white/10 animate-shimmer" />
    </div>
  );
}
