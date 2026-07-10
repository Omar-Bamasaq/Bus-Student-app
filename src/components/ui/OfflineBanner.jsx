import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WifiOff, RefreshCw } from 'lucide-react'

export default function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine)
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    function handleOnline() { setOffline(false); checkPending() }
    function handleOffline() { setOffline(true) }
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  async function checkPending() {
    try {
      if (window.syncManager?.pending) {
        const count = await window.syncManager.pending
        setPendingCount(count)
      }
    } catch { /* ignore */ }
  }

  return (
    <AnimatePresence>
      {offline && (
        <motion.div
          initial={{ y: -60 }}
          animate={{ y: 0 }}
          exit={{ y: -60 }}
          className="fixed top-0 left-0 right-0 z-[200] bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-center gap-3 text-sm text-amber-800"
        >
          <WifiOff className="w-4 h-4" />
          <span>لا يوجد اتصال بالإنترنت</span>
          {pendingCount > 0 && <span className="badge-orange">{pendingCount} معلقة</span>}
          <button onClick={() => window.location.reload()} className="flex items-center gap-1.5 text-amber-700 font-medium hover:text-amber-900">
            <RefreshCw className="w-3.5 h-3.5" />
            إعادة المحاولة
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
