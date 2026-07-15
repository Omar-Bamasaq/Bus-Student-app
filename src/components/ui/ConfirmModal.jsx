import Modal from './Modal'

export default function ConfirmModal({ show, onClose, onConfirm, title, children, confirmText = 'تأكيد', cancelText = 'إلغاء', loading, danger }) {
  return (
    <Modal
      show={show}
      onClose={onClose}
      title={title}
      footer={
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 text-white ${
              danger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? 'جاري...' : confirmText}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            {cancelText}
          </button>
        </div>
      }
    >
      <div className="text-sm text-gray-600 leading-relaxed">
        {children}
      </div>
    </Modal>
  )
}
