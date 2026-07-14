import { useState, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bus, MapPin, ShieldCheck, ChevronLeft } from 'lucide-react'

const slides = [
  {
    title: 'مواصلاتك أصبحت أسهل',
    desc: 'احجز اشتراكك وتابع رحلتك اليومية بكل سهولة مع مشوارك',
    icon: Bus,
    accent: '#3B82F6',
    gradients: ['#EFF6FF', '#DBEAFE'],
    bgMain: ['#0B1E4A', '#1A3D8F'],
    decorColor: '#60A5FA',
    image: (
      <svg width="200" height="200" viewBox="0 0 200 200" fill="none" className="w-44 h-44 sm:w-52 sm:h-52">
        {/* Background circle */}
        <circle cx="100" cy="100" r="96" fill="#DBEAFE" />
        <circle cx="100" cy="100" r="86" fill="#EFF6FF" />
        {/* Road */}
        <rect x="10" y="128" width="180" height="12" rx="6" fill="#BFDBFE" />
        <rect x="40" y="124" width="24" height="6" rx="3" fill="#93C5FD" />
        <rect x="90" y="124" width="24" height="6" rx="3" fill="#93C5FD" />
        <rect x="140" y="124" width="24" height="6" rx="3" fill="#93C5FD" />
        {/* Bus */}
        <rect x="48" y="50" width="104" height="60" rx="10" fill="#FBBF24" />
        <rect x="48" y="50" width="104" height="60" rx="10" fill="url(#sb1)" />
        <rect x="60" y="30" width="80" height="24" rx="6" fill="#F59E0B" />
        <rect x="64" y="36" width="28" height="12" rx="3" fill="#1E3A5F" opacity="0.4" />
        <rect x="108" y="36" width="28" height="12" rx="3" fill="#1E3A5F" opacity="0.4" />
        <rect x="52" y="56" width="16" height="14" rx="2" fill="#1E3A5F" opacity="0.3" />
        <rect x="72" y="56" width="16" height="14" rx="2" fill="#1E3A5F" opacity="0.3" />
        <rect x="92" y="56" width="16" height="14" rx="2" fill="#1E3A5F" opacity="0.3" />
        <rect x="112" y="56" width="16" height="14" rx="2" fill="#1E3A5F" opacity="0.3" />
        <rect x="132" y="56" width="16" height="14" rx="2" fill="#1E3A5F" opacity="0.3" />
        <rect x="48" y="76" width="104" height="6" fill="#D97706" opacity="0.3" />
        <rect x="56" y="96" width="20" height="16" rx="3" fill="#1F2937" />
        <rect x="124" y="96" width="20" height="16" rx="3" fill="#1F2937" />
        <circle cx="66" cy="104" r="6" fill="#374151" />
        <circle cx="134" cy="104" r="6" fill="#374151" />
        <rect x="145" y="60" width="6" height="8" rx="1" fill="#93C5FD" opacity="0.8" />
        <rect x="49" y="60" width="6" height="8" rx="1" fill="#EF4444" opacity="0.6" />
        {/* Small buildings */}
        <rect x="14" y="100" width="12" height="24" rx="1" fill="#93C5FD" opacity="0.4" />
        <rect x="174" y="94" width="14" height="30" rx="1" fill="#93C5FD" opacity="0.4" />
        <rect x="160" y="104" width="10" height="20" rx="1" fill="#93C5FD" opacity="0.3" />
        <defs>
          <linearGradient id="sb1" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#FCD34D" />
            <stop stopColor="#F59E0B" />
          </linearGradient>
        </defs>
      </svg>
    ),
  },
  {
    title: 'تابع رحلتك لحظة بلحظة',
    desc: 'اعرف موقع الباص وتواصل مع السائق مباشرة عند الحاجة',
    icon: MapPin,
    accent: '#10B981',
    gradients: ['#ECFDF5', '#D1FAE5'],
    bgMain: ['#064E3B', '#065F46'],
    decorColor: '#34D399',
    image: (
      <svg width="200" height="200" viewBox="0 0 200 200" fill="none" className="w-44 h-44 sm:w-52 sm:h-52">
        {/* Background */}
        <circle cx="100" cy="100" r="96" fill="#D1FAE5" />
        <circle cx="100" cy="100" r="86" fill="#ECFDF5" />
        {/* Map lines */}
        <line x1="30" y1="60" x2="80" y2="120" stroke="#A7F3D0" strokeWidth="3" strokeLinecap="round" />
        <line x1="80" y1="120" x2="160" y2="70" stroke="#A7F3D0" strokeWidth="3" strokeLinecap="round" />
        <line x1="50" y1="140" x2="140" y2="100" stroke="#A7F3D0" strokeWidth="3" strokeLinecap="round" strokeDasharray="6 4" />
        {/* Map dots */}
        <circle cx="30" cy="60" r="4" fill="#6EE7B7" opacity="0.6" />
        <circle cx="160" cy="70" r="4" fill="#6EE7B7" opacity="0.6" />
        <circle cx="50" cy="140" r="4" fill="#6EE7B7" opacity="0.6" />
        <circle cx="140" cy="100" r="4" fill="#6EE7B7" opacity="0.6" />
        {/* Main pin */}
        <path d="M100 40C85 40 72 52 72 66C72 86 100 120 100 120C100 120 128 86 128 66C128 52 115 40 100 40Z" fill="#10B981" />
        <circle cx="100" cy="66" r="12" fill="white" />
        <path d="M96 66 L100 60 L104 66 L100 72Z" fill="#10B981" />
        {/* Pulse ring */}
        <circle cx="100" cy="66" r="22" stroke="#10B981" strokeWidth="1.5" opacity="0.2" />
        {/* Bus icon on map */}
        <rect x="72" y="130" width="20" height="12" rx="2" fill="#FBBF24" />
        <circle cx="78" cy="140" r="2.5" fill="#374151" />
        <circle cx="86" cy="140" r="2.5" fill="#374151" />
        {/* Phone indicator */}
        <rect x="152" y="110" width="6" height="14" rx="1" fill="#34D399" opacity="0.4" />
        <rect x="154" y="112" width="2" height="3" rx="0.5" fill="#D1FAE5" opacity="0.6" />
      </svg>
    ),
  },
  {
    title: 'رحلة آمنة ومنظمة',
    desc: 'نظام متكامل لإدارة المواصلات الجامعية بكل احترافية',
    icon: ShieldCheck,
    accent: '#8B5CF6',
    gradients: ['#F5F3FF', '#EDE9FE'],
    bgMain: ['#3B0764', '#5B21B6'],
    decorColor: '#A78BFA',
    image: (
      <svg width="200" height="200" viewBox="0 0 200 200" fill="none" className="w-44 h-44 sm:w-52 sm:h-52">
        {/* Background */}
        <circle cx="100" cy="100" r="96" fill="#EDE9FE" />
        <circle cx="100" cy="100" r="86" fill="#F5F3FF" />
        {/* Shield */}
        <path d="M100 30L155 55V100C155 135 130 165 100 175C70 165 45 135 45 100V55L100 30Z" fill="#8B5CF6" />
        <path d="M100 40L145 60V100C145 130 125 155 100 163C75 155 55 130 55 100V60L100 40Z" fill="#A78BFA" />
        {/* Checkmark */}
        <path d="M78 100 L92 114 L122 84" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Sparkles */}
        <circle cx="60" cy="65" r="2" fill="#C4B5FD" />
        <circle cx="145" cy="55" r="2.5" fill="#C4B5FD" />
        <circle cx="70" cy="145" r="1.5" fill="#C4B5FD" />
        <circle cx="140" cy="120" r="2" fill="#C4B5FD" />
        <line x1="62" y1="63" x2="62" y2="67" stroke="#C4B5FD" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="60" y1="65" x2="64" y2="65" stroke="#C4B5FD" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="143" y1="53" x2="143" y2="57" stroke="#C4B5FD" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="141" y1="55" x2="145" y2="55" stroke="#C4B5FD" strokeWidth="1.5" strokeLinecap="round" />
        {/* Small bus silhouettes in back */}
        <rect x="20" y="80" width="10" height="8" rx="1" fill="#C4B5FD" opacity="0.3" />
        <rect x="170" y="90" width="12" height="8" rx="1" fill="#C4B5FD" opacity="0.3" />
      </svg>
    ),
  },
]

const bgColors = [
  'linear-gradient(160deg, #0B1E4A 0%, #1A3D8F 35%, #2563EB 70%, #3B82F6 100%)',
  'linear-gradient(160deg, #064E3B 0%, #065F46 35%, #059669 70%, #10B981 100%)',
  'linear-gradient(160deg, #3B0764 0%, #5B21B6 35%, #7C3AED 70%, #8B5CF6 100%)',
]

const decorShapes = [
  [
    'M-20,-20 Q40,0 0,60 Q-40,120 -100,100 Q-160,80 -120,20 Z',
    'M160,180 Q120,140 140,100 Q160,60 200,80 Q240,100 220,140 Z',
  ],
  [
    'M-30,-30 Q30,-10 10,50 Q-10,110 -80,90 Q-150,70 -110,10 Z',
    'M140,170 Q100,130 120,90 Q140,50 180,70 Q220,90 200,130 Z',
  ],
  [
    'M-40,-20 Q20,0 0,60 Q-20,120 -90,100 Q-160,80 -130,20 Z',
    'M150,190 Q110,150 130,110 Q150,70 190,90 Q230,110 210,150 Z',
  ],
]

export default function Onboarding({ onComplete }) {
  const [current, setCurrent] = useState(0)
  const [direction, setDirection] = useState(1)
  const touchStart = useRef(null)
  const [slideTilt, setSlideTilt] = useState({ x: 0, y: 0 })

  const goNext = useCallback(() => {
    if (current < slides.length - 1) {
      setDirection(1)
      setCurrent(prev => prev + 1)
    } else {
      onComplete()
    }
  }, [current, onComplete])

  const goPrev = useCallback(() => {
    if (current > 0) {
      setDirection(-1)
      setCurrent(prev => prev - 1)
    }
  }, [])

  const handleTouchStart = useCallback((e) => {
    touchStart.current = e.touches[0].clientX
  }, [])

  const handleTouchEnd = useCallback((e) => {
    if (!touchStart.current) return
    const diff = touchStart.current - e.changedTouches[0].clientX
    const threshold = 50
    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        setDirection(1)
        setCurrent(prev => Math.min(prev + 1, slides.length - 1))
      } else {
        setDirection(-1)
        setCurrent(prev => Math.max(prev - 1, 0))
      }
    }
    touchStart.current = null
  }, [])

  const handleMouseMove = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 8
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -8
    setSlideTilt({ x, y })
  }, [])

  const handleMouseLeave = useCallback(() => {
    setSlideTilt({ x: 0, y: 0 })
  }, [])

  const progress = useMemo(() => ((current + 1) / slides.length) * 100, [current])

  const slideVariants = {
    enter: (dir) => ({ x: dir > 0 ? 320 : -320, opacity: 0, scale: 0.92 }),
    center: { x: 0, opacity: 1, scale: 1 },
    exit: (dir) => ({ x: dir > 0 ? -320 : 320, opacity: 0, scale: 0.92 }),
  }

  const slide = slides[current]
  const isLast = current === slides.length - 1
  const isFirst = current === 0

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col overflow-hidden" dir="rtl">
      <div
        className="absolute inset-0 transition-all duration-700 ease-in-out"
        style={{ background: bgColors[current] }}
      />

      {/* Dot grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Decorative curved shapes */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.06]">
        {decorShapes[current].map((d, i) => (
          <path key={i} d={d} fill="white" opacity="0.5" />
        ))}
      </svg>

      {/* Glow orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[400px] h-[400px] rounded-full opacity-[0.08] blur-3xl"
          style={{ background: slide?.decorColor }}
        />
        <div className="absolute -bottom-48 -left-48 w-[500px] h-[500px] rounded-full opacity-[0.06] blur-3xl"
          style={{ background: slide?.decorColor }}
        />
        {/* Corner accent */}
        <div className="absolute top-0 right-0 w-48 h-48 opacity-[0.04] blur-2xl"
          style={{ background: `radial-gradient(circle at top right, ${slide?.decorColor}, transparent)` }}
        />
      </div>

      {/* Progress bar */}
      <div className="relative z-20 pt-3 sm:pt-4 px-6 sm:px-8">
        <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: slide?.accent }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[10px] text-white/30 font-medium">
            {current + 1} / {slides.length}
          </span>
          {!isLast && (
            <button onClick={onComplete} className="text-[10px] text-white/40 hover:text-white/70 transition-colors">
              تخطي
            </button>
          )}
        </div>
      </div>

      {/* Slide content */}
      <div
        className="relative z-10 flex-1 flex items-center justify-center overflow-hidden px-4 sm:px-6"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={current}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 260, damping: 28, mass: 1 }}
            style={{ perspective: '800px' }}
            className="flex flex-col items-center text-center w-full max-w-sm"
          >
            {/* Image area */}
            <motion.div
              style={{
                rotateX: slideTilt.y,
                rotateY: slideTilt.x,
                transition: 'rotateX 0.1s, rotateY 0.1s',
              }}
              className="mb-6 sm:mb-8"
            >
              {/* Glow ring */}
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="absolute w-48 h-48 sm:w-56 sm:h-56 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                style={{
                  background: slide?.accent,
                  opacity: 0.12,
                  top: '50%',
                  left: '50%',
                }}
              />
              {slide.image}
            </motion.div>

            {/* Floating decorative dots */}
            <div className="absolute top-[18%] right-[12%] pointer-events-none opacity-30">
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="w-2 h-2 rounded-full" style={{ background: slide?.decorColor }} />
              </motion.div>
            </div>
            <div className="absolute bottom-[35%] left-[10%] pointer-events-none opacity-20">
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              >
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: slide?.decorColor }} />
              </motion.div>
            </div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
              className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 leading-tight"
            >
              {slide.title}
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25, ease: 'easeOut' }}
              className="text-sm sm:text-base text-white/70 leading-relaxed max-w-xs mx-auto"
            >
              {slide.desc}
            </motion.p>

            {/* Subtle tagline */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35, ease: 'easeOut' }}
              className="mt-5 px-4 py-1.5 rounded-full"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            >
              <span className="text-xs text-white/40" style={{ letterSpacing: '0.02em' }}>
                {current === 0 && 'انطلق مع مشوارك'}
                {current === 1 && 'ابقَ على اطلاع دائم'}
                {current === 2 && 'سلامتك أولاً'}
              </span>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom controls */}
      <div className="relative z-10 px-6 pb-6 sm:pb-8 flex flex-col items-center gap-5">
        {/* Dots */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex gap-3"
        >
          {slides.map((_, i) => {
            const isActive = i === current
            return (
              <button
                key={i}
                onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i) }}
                className="relative flex items-center h-5"
              >
                {isActive ? (
                  <motion.div
                    layoutId="activeDot"
                    className="h-2.5 rounded-full"
                    style={{
                      width: '28px',
                      background: slide?.accent,
                      boxShadow: `0 0 8px ${slide?.accent}40`,
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  />
                ) : (
                  <div
                    className="h-2 w-2 rounded-full transition-all duration-300 hover:scale-125"
                    style={{
                      background: 'rgba(255,255,255,0.2)',
                    }}
                  />
                )}
              </button>
            )
          })}
        </motion.div>

        {/* Navigation buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="flex items-center gap-3 w-full max-w-xs"
        >
          {!isFirst && (
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={goPrev}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl text-sm font-medium text-white/60 border border-white/15 hover:bg-white/10 hover:text-white/80 transition-all duration-200"
            >
              <ChevronLeft size={18} className="rotate-180" />
              السابق
            </motion.button>
          )}

          {isFirst && <div className="flex-1" />}

          <motion.button
            onClick={goNext}
            whileTap={{ scale: 0.96 }}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold text-white transition-all duration-200 relative overflow-hidden ${
              isFirst ? 'shadow-lg' : ''
            }`}
            style={{
              background: isLast
                ? `linear-gradient(135deg, ${slide?.accent}, ${slide?.accent}dd)`
                : 'rgba(255,255,255,0.12)',
              boxShadow: isLast
                ? `0 4px 20px ${slide?.accent}40`
                : 'none',
            }}
          >
            {/* Shimmer on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-all duration-500" />
            {isLast ? (
              <>
                ابدأ الآن
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="rotate-180">
                  <path d="M2 8H14M14 8L8 2M14 8L8 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </>
            ) : (
              <>
                التالي
                <ChevronLeft size={18} className="group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </motion.button>

          {isFirst && <div className="flex-1" />}
        </motion.div>
      </div>
    </div>
  )
}
