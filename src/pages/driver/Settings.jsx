import ChangePassword from '../auth/ChangePassword'

export default function DriverSettings() {
  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-lg font-bold text-slate-800 mb-4">الإعدادات</h1>
      <ChangePassword />
    </div>
  )
}
