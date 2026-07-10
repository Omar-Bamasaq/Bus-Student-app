import { motion } from 'framer-motion'

export function Skeleton({ className = '', width, height, rounded = 'md' }) {
  const roundClass = rounded === 'full' ? 'rounded-full' : rounded === 'lg' ? 'rounded-xl' : 'rounded-lg'
  return (
    <div
      className={`skeleton ${roundClass} ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="card p-4 space-y-3">
      <Skeleton height={16} width="40%" />
      <Skeleton height={32} width="60%" />
      <Skeleton height={12} width="80%" />
    </div>
  )
}

export function SkeletonTable({ rows = 5, cols = 5 }) {
  return (
    <div className="space-y-2">
      <div className="flex gap-4 p-3">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} height={14} width={`${Math.floor(80 / cols)}%`} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 p-3 border-t border-[var(--color-border-light)]">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} height={14} width={`${Math.floor(80 / cols)}%`} />
          ))}
        </div>
      ))}
    </div>
  )
}
