import { motion } from 'framer-motion'
import { AlertTriangle, AlertCircle, Info, CheckCircle, X } from 'lucide-react'

export default function AlertCard({ type = 'warning', title, description, onClick, onDismiss }) {
  const icons = {
    warning: { icon: AlertTriangle, color: 'var(--color-warning)', bg: 'var(--color-warning-light)' },
    danger: { icon: AlertCircle, color: 'var(--color-danger)', bg: 'var(--color-danger-light)' },
    info: { icon: Info, color: 'var(--color-info)', bg: 'var(--color-info-light)' },
    success: { icon: CheckCircle, color: 'var(--color-success)', bg: 'var(--color-success-light)' },
  }
  const { icon: Icon, color, bg } = icons[type] || icons.warning

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer hover:shadow-sm transition-shadow ${onClick ? '' : ''}`}
      style={{ background: bg }}
      onClick={onClick}
    >
      <Icon size={18} style={{ color, flexShrink: 0 }} strokeWidth={2} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium" style={{ color }}>{title}</p>
        {description && <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{description}</p>}
      </div>
      {onDismiss && (
        <button onClick={(e) => { e.stopPropagation(); onDismiss() }} className="shrink-0 p-0.5 rounded hover:bg-black/5">
          <X size={14} style={{ color: 'var(--color-text-muted)' }} />
        </button>
      )}
    </motion.div>
  )
}
