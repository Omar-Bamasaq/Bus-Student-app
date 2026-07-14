import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function AppSplashScreen({ onFinish }) {
  const [phase, setPhase] = useState('enter')

  // Store flag immediately on mount so refresh during animation doesn't re-trigger
  useEffect(() => {
    sessionStorage.setItem('mashawerk_session_splash', 'true')
  }, [])

  useEffect(() => {
    const exitTimer = setTimeout(() => {
      setPhase('exit')
      setTimeout(onFinish, 400)
    }, 2300)

    return () => clearTimeout(exitTimer)
  }, [onFinish])

  return (
    <AnimatePresence>
      {phase !== 'hidden' && (
        <motion.div
          key="app-splash"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center overflow-hidden"
          style={{ background: 'linear-gradient(160deg, #0B1E4A 0%, #1A3D8F 40%, #2563EB 75%, #3B82F6 100%)' }}
        >
          {/* Dot pattern */}
          <div
            className="absolute inset-0 opacity-[0.035] pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '22px 22px',
            }}
          />

          {/* Glow */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-24 -right-24 w-[350px] h-[350px] rounded-full bg-blue-400/10 blur-3xl" />
            <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full bg-indigo-500/8 blur-3xl" />
          </div>

          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 flex flex-col items-center"
          >
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center shadow-2xl">
              <img src="/app-icon.svg" alt="مشوارك" className="w-20 h-20 sm:w-24 sm:h-24 object-contain" />
            </div>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4, ease: 'easeOut' }}
            className="relative z-10 text-2xl sm:text-3xl font-bold text-white mt-5 tracking-wider"
          >
            مشوارك
          </motion.h1>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.35, ease: 'easeOut' }}
            className="relative z-10 text-sm sm:text-base text-blue-200/80 mt-1.5 font-medium"
          >
            رحلتك اليومية أسهل وأضمن
          </motion.p>

          {/* Road + Bus */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="absolute bottom-[22%] w-[70%] max-w-xs"
          >
            {/* Road surface */}
            <div className="relative h-[5px] bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ delay: 0.55, duration: 1.6, ease: 'easeInOut' }}
                className="h-full rounded-full"
                style={{
                  background: 'linear-gradient(90deg, #60A5FA, #93C5FD)',
                  boxShadow: '0 0 6px rgba(96,165,250,0.3)',
                }}
              />
            </div>

            {/* Lane dashes */}
            <div className="flex gap-1 mt-0.5">
              {Array.from({ length: 14 }).map((_, i) => (
                <div key={i} className="h-[2px] flex-1 rounded-full bg-white/15" />
              ))}
            </div>

            {/* Bus */}
            <motion.div
              initial={{ left: '0%' }}
              animate={{ left: '92%' }}
              transition={{ delay: 0.55, duration: 1.6, ease: 'easeInOut' }}
              className="absolute -top-4 w-7 h-7 -translate-x-1/2"
            >
              <svg viewBox="0 0 24 24" fill="none" className="w-full h-full drop-shadow-lg">
                <rect x="2" y="6" width="20" height="12" rx="2" fill="#FBBF24" />
                <rect x="2" y="6" width="20" height="12" rx="2" fill="url(#busG)" />
                <rect x="4" y="3" width="16" height="5" rx="1.5" fill="#F59E0B" />
                <rect x="5.5" y="4.5" width="5" height="2" rx="0.5" fill="#1E3A5F" opacity="0.35" />
                <rect x="13.5" y="4.5" width="5" height="2" rx="0.5" fill="#1E3A5F" opacity="0.35" />
                <rect x="4" y="8" width="3" height="3" rx="0.5" fill="#1E3A5F" opacity="0.3" />
                <rect x="8.5" y="8" width="3" height="3" rx="0.5" fill="#1E3A5F" opacity="0.3" />
                <rect x="13" y="8" width="3" height="3" rx="0.5" fill="#1E3A5F" opacity="0.3" />
                <rect x="17" y="8" width="3" height="3" rx="0.5" fill="#1E3A5F" opacity="0.3" />
                <rect x="3.5" y="15" width="4" height="3" rx="1" fill="#1F2937" />
                <rect x="16.5" y="15" width="4" height="3" rx="1" fill="#1F2937" />
                <circle cx="5.5" cy="16.5" r="1.2" fill="#374151" />
                <circle cx="18.5" cy="16.5" r="1.2" fill="#374151" />
                <rect x="21" y="8.5" width="1.5" height="1.5" rx="0.3" fill="#93C5FD" opacity="0.7" />
                <defs>
                  <linearGradient id="busG" x1="0" y1="0" x2="0" y2="1">
                    <stop stopColor="#FCD34D" />
                    <stop stopColor="#F59E0B" />
                  </linearGradient>
                </defs>
              </svg>
            </motion.div>
          </motion.div>

          {/* Version */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4, duration: 0.5 }}
            className="absolute bottom-4 text-[9px] text-blue-300/30 tracking-wider"
          >
            تنسيقية مواصلات فلك
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
