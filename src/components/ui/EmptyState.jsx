import { motion } from 'framer-motion'
import { Inbox } from 'lucide-react'

export default function EmptyState({ icon: Icon = Inbox, title, description, action, actionText }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="empty-state"
    >
      <Icon className="empty-icon" strokeWidth={1.5} />
      <h3 className="empty-title">{title || 'لا توجد بيانات'}</h3>
      {description && <p className="empty-text">{description}</p>}
      {action && actionText && (
        <button onClick={action} className="btn-primary mt-4">
          {actionText}
        </button>
      )}
    </motion.div>
  )
}
