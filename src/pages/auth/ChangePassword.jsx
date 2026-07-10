import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, Eye, EyeOff, Save, KeyRound } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const { user, updateUser, logout } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('جميع الحقول مطلوبة')
      return
    }

    if (newPassword.length < 8) {
      setError('كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('كلمة المرور الجديدة وتأكيدها غير متطابقين')
      return
    }

    setLoading(true)
    try {
      const data = await api.auth.changePassword(currentPassword, newPassword)
      localStorage.setItem('token', data.token)
      updateUser({ mustChangePassword: false })
      setSuccess('تم تغيير كلمة المرور بنجاح')
      setTimeout(() => {
        navigate(`/${user.role}`, { replace: true })
      }, 1000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-primary-dark)]/10 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-[var(--color-accent)] to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
              <KeyRound size={28} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-[var(--color-text)]">تغيير كلمة المرور</h1>
            <p className="text-sm text-[var(--color-text-muted)] mt-0.5">يجب تغيير كلمة المرور قبل الاستمرار</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-1">كلمة المرور الحالية</label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="input-field pl-9"
                  required
                  autoFocus
                />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-1">كلمة المرور الجديدة</label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input-field pl-9"
                  placeholder="8 أحرف على الأقل"
                  required
                  minLength={8}
                />
                <button type="button" onClick={() => setShowNew(!showNew)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-1">تأكيد كلمة المرور الجديدة</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-field"
                required
              />
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                className="bg-red-50 text-[var(--color-danger)] text-sm p-3 rounded-xl border border-red-100">
                {error}
              </motion.div>
            )}

            {success && (
              <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                className="bg-green-50 text-green-700 text-sm p-3 rounded-xl border border-green-100">
                {success}
              </motion.div>
            )}

            <button type="submit" disabled={loading}
              className="btn-primary w-full justify-center py-2.5">
              {loading ? 'جاري الحفظ...' : 'تغيير كلمة المرور'}
            </button>

            {!user?.mustChangePassword && (
              <button type="button" onClick={() => navigate(-1)}
                className="btn-ghost w-full justify-center text-sm">
                رجوع
              </button>
            )}
          </form>
        </div>
      </motion.div>
    </div>
  )
}
