import { motion } from 'framer-motion'
import { User, Shield, LogOut, KeyRound } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../../components/ui/PageHeader'
import Section from '../../components/ui/Section'

const roleLabels = { admin: 'مشرف', driver: 'سائق', student: 'طالب' }

export default function AdminSettings() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div>
      <PageHeader title="الإعدادات" subtitle="إعدادات النظام والحساب" />
      <Section>
        <div className="divide-y">
          <div className="flex items-center gap-3 py-4">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-lighter)] flex items-center justify-center">
              <User size={20} className="text-[var(--color-primary-dark)]" />
            </div>
            <div>
              <p className="font-semibold">{user?.name}</p>
              <p className="text-xs text-[var(--color-text-muted)]">{user?.phone || ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 py-4">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-accent-light)] flex items-center justify-center">
              <Shield size={20} className="text-[var(--color-accent)]" />
            </div>
            <div>
              <p className="font-semibold">نوع الحساب</p>
              <p className="text-xs text-[var(--color-text-muted)] capitalize">{roleLabels[user?.role] || user?.role}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 py-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <KeyRound size={20} className="text-blue-600" />
            </div>
            <div>
              <button onClick={() => navigate('/settings/change-password')} className="font-semibold text-[var(--color-primary)] hover:underline text-sm">
                تغيير كلمة المرور
              </button>
              <p className="text-xs text-[var(--color-text-muted)]">تحديث كلمة المرور الخاصة بك</p>
            </div>
          </div>
          <div className="pt-4">
            <button onClick={handleLogout} className="btn-ghost text-[var(--color-danger)]">
              <LogOut size={16} /> تسجيل الخروج
            </button>
          </div>
        </div>
      </Section>
    </div>
  )
}
