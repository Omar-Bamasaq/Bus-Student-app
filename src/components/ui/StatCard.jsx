import { motion } from 'framer-motion'

const iconColors = {
  blue: 'bg-blue-50 text-primary',
  orange: 'bg-orange-50 text-accent',
  green: 'bg-green-50 text-green-600',
  red: 'bg-red-50 text-red-600',
  yellow: 'bg-yellow-50 text-yellow-600',
  purple: 'bg-purple-50 text-purple-600',
  indigo: 'bg-indigo-50 text-indigo-600',
}

export default function StatCard({ icon: Icon, label, value, subtitle, trend, trendLabel, color = 'blue', progress, onClick }) {
  const colorClass = iconColors[color] || iconColors.blue

  return (
    <motion.div
      whileHover={{ y: -3, boxShadow: '0 12px 24px -8px rgba(0,0,0,0.1)' }}
      className="card p-5 cursor-pointer relative overflow-hidden"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-11 h-11 rounded-xl ${colorClass} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend != null && (
          <span className={`text-xs font-semibold flex items-center gap-0.5 ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="space-y-1">
        <div className="stat-value">{value ?? '—'}</div>
        <div className="stat-label">{label}</div>
        {subtitle && <div className="text-xs text-slate-400">{subtitle}</div>}
        {trendLabel && <div className="text-xs text-slate-400">{trendLabel}</div>}
      </div>
      {progress != null && (
        <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(progress, 100)}%` }}
            transition={{ duration: 1, delay: 0.3 }}
            className={`h-full rounded-full ${progress > 80 ? 'bg-green-500' : progress > 50 ? 'bg-yellow-500' : 'bg-primary'}`}
          />
        </div>
      )}
    </motion.div>
  )
}
