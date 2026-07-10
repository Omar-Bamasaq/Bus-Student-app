import { useState, useEffect } from 'react'

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [deviceType, setDeviceType] = useState('desktop')
  const [isInstalled, setIsInstalled] = useState(false)
  const [visible, setVisible] = useState(false)
  const [installedDismissed, setInstalledDismissed] = useState(false)

  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
    }
    if (window.navigator && window.navigator.standalone) setIsInstalled(true)

    const ua = navigator.userAgent.toLowerCase()
    if (/android/.test(ua)) setDeviceType('android')
    else if (/iphone|ipad|ipod/.test(ua)) setDeviceType('ios')
    else setDeviceType('desktop')

    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setVisible(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function handleInstall() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setIsInstalled(true)
      setVisible(false)
    }
    setDeferredPrompt(null)
  }

  function handleOpen() {
    window.location.href = '/'
  }

  if (isInstalled && !installedDismissed) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between shadow">
          <div>
            <div className="font-semibold text-green-700">✅ التطبيق مثبت بالفعل على جهازك</div>
            <div className="text-xs text-green-600">يمكنك الوصول إليه من الشاشة الرئيسية</div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setInstalledDismissed(true)} className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 rounded-lg">حسناً</button>
            <button onClick={handleOpen} className="px-3 py-1.5 bg-green-600 text-white rounded-lg">افتح التطبيق</button>
          </div>
        </div>
      </div>
    )
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-4 flex items-center justify-between">
        <div className="text-sm">
          <div className="font-semibold text-slate-800">ثبّت التطبيق</div>
          {deviceType === 'android' ? (
            <div className="text-slate-500">استمتع بسرعة أكبر وإشعارات فورية.</div>
          ) : (
            <div className="text-slate-500">هذا الجهاز لا يدعم التثبيت بضغطة واحدة. اتبع التعليمات من صفحة التنزيل.</div>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={() => setVisible(false)} className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 rounded-lg">تخطي</button>
          {deviceType === 'android' && (
            <button onClick={handleInstall} className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg font-medium">تثبيت</button>
          )}
          {deviceType === 'ios' && (
            <a href="/admin/download-app" className="px-3 py-1.5 text-xs bg-slate-100 text-slate-700 rounded-lg">اعرض التعليمات</a>
          )}
        </div>
      </div>
    </div>
  )
}
