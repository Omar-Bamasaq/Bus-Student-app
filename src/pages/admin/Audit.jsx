import { useState, useEffect, useMemo } from 'react'
import { api } from '../../lib/api'
import PageHeader from '../../components/ui/PageHeader'
import DataTable from '../../components/ui/DataTable'
import StatusBadge from '../../components/ui/StatusBadge'

const actionLabels = {
  CREATE: 'إنشاء', UPDATE: 'تحديث', DELETE: 'حذف',
  TRANSFER_CREATE: 'تحويل', TRANSFER_CANCEL: 'إلغاء تحويل',
}

export default function AdminAudit() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.audit.list({}).then(setLogs).catch(console.error).finally(() => setLoading(false))
  }, [])

  const columns = useMemo(() => [
    { key: 'createdAt', label: 'التاريخ', render: (row) => new Date(row.createdAt).toLocaleString('ar-SA') },
    { key: 'user', label: 'المستخدم', render: (row) => row.user?.name || 'النظام' },
    { key: 'action', label: 'الإجراء', render: (row) => <StatusBadge status={row.action === 'DELETE' ? 'error' : row.action === 'CREATE' ? 'success' : 'info'} label={actionLabels[row.action] || row.action} /> },
    { key: 'entityType', label: 'النوع' },
    { key: 'reason', label: 'السبب', render: (row) => row.reason || '-' },
  ], [])

  return (
    <div>
      <PageHeader title="سجل الحركات" subtitle="تتبع جميع الإجراءات في النظام" />
      <DataTable columns={columns} data={logs} loading={loading}
        emptyTitle="لا يوجد سجلات" emptyDescription="لم يتم تسجيل أي إجراءات بعد" />
    </div>
  )
}
