export default function ResponsiveKpiGrid({ children, className = '' }) {
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 ${className}`}>
      {children}
    </div>
  )
}
