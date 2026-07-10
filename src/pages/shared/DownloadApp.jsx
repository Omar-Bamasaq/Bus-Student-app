import { useState, useEffect } from 'react'
import { Smartphone, Download, Globe, Share2, PlusSquare, CheckCircle, Bell, Zap } from 'lucide-react'

export default function DownloadApp() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [deviceType, setDeviceType] = useState('desktop')
  const [isInstalled, setIsInstalled] = useState(false)
  const [installing, setInstalling] = useState(false)
  const [showIosStepsImages, setShowIosStepsImages] = useState(false)

  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }
    if (window.navigator && window.navigator.standalone) {
      setIsInstalled(true)
      return
    }

    const ua = navigator.userAgent.toLowerCase()
    if (/android/.test(ua)) setDeviceType('android')
    else if (/iphone|ipad|ipod/.test(ua)) setDeviceType('ios')
    else setDeviceType('desktop')

    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function handleInstall() {
    if (!deferredPrompt) return
    setInstalling(true)
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setIsInstalled(true)
    setDeferredPrompt(null)
    setInstalling(false)
  }

  function handleOpen() {
    window.location.href = '/'
  }

  const androidSteps = [
    { title: 'افتح متصفح Chrome', desc: 'ثم انتقل إلى صفحة التطبيق' },
    { title: 'اضغط على أيقونة القائمة', desc: 'ثلاث نقاط ⋮ في الزاوية العلوية' },
    { title: 'اختر تثبيت التطبيق', desc: '"تثبيت التطبيق" أو "Add to Home screen"' },
    { title: 'اضغط على تثبيت', desc: 'في النافذة المنبثقة لتأكيد التثبيت' },
  ]

  return (
    <div dir="rtl" className="max-w-3xl mx-auto space-y-6 py-4">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-800">📱 ثبّت تطبيق تنسيقية مواصلاتك</h1>
        <p className="text-sm text-slate-500 mt-1">استمتع بسرعة أكبر، وإشعارات فورية، وتجربة استخدام أفضل.</p>
        <div className="mt-3">
          {deviceType === 'android' ? (
            deferredPrompt ? (
              <button onClick={handleInstall} disabled={installing} className="px-5 py-3 bg-blue-600 text-white rounded-xl font-medium">
                {installing ? 'جاري التثبيت...' : 'تثبيت التطبيق'}
              </button>
            ) : (
              <button className="px-5 py-3 bg-blue-600 text-white rounded-xl font-medium">تثبيت التطبيق</button>
            )
          ) : deviceType === 'ios' ? (
            <div className="text-sm text-slate-600">هذا الجهاز لا يدعم التثبيت بضغطة واحدة. اتبع التعليمات أدناه.</div>
          ) : (
            <div className="text-sm text-slate-600">افتح هذه الصفحة على هاتفك المحمول لعرض تعليمات التثبيت.</div>
          )}
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Android Card */}
        <div className={`bg-white rounded-2xl border p-0 overflow-hidden shadow-sm ${deviceType === 'android' ? '' : 'opacity-80'}`}>
          <div className="bg-gradient-to-l from-blue-600 to-blue-700 px-4 py-3 flex items-center gap-2.5">
            <Smartphone size={20} className="text-white" />
            <h2 className="font-semibold text-white text-sm">🤖 Android</h2>
            {deviceType === 'android' && (
              <span className="mr-auto text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full">جهازك</span>
            )}
          </div>
          <div className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center">
                <Download size={28} className="text-slate-600" />
              </div>
              <div>
                <div className="font-semibold text-slate-800">ثبّت التطبيق على جهاز Android</div>
                <div className="text-sm text-slate-500">التثبيت مباشر من المتصفح ويوفر تجربة سريعة وإشعارات.</div>
              </div>
            </div>
            <div className="mt-6">
              {deferredPrompt ? (
                <button onClick={handleInstall} disabled={installing} className="w-full px-4 py-3 bg-blue-600 text-white rounded-xl font-medium">
                  <Download size={16} /> <span className="mr-2">{installing ? 'جاري التثبيت...' : 'تثبيت التطبيق'}</span>
                </button>
              ) : (
                <div>
                  <p className="text-sm text-slate-600 mb-3">اتبع هذه الخطوات:</p>
                  <ol className="space-y-3">
                    {androidSteps.map((step, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                        <div>
                          <p className="text-sm font-medium text-slate-700">{step.title}</p>
                          <p className="text-xs text-slate-500">{step.desc}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* iOS Card */}
        <div className={`bg-white rounded-2xl border p-0 overflow-hidden shadow-sm ${deviceType === 'ios' ? '' : 'opacity-80'}`}>
          <div className="bg-gradient-to-l from-slate-700 to-slate-800 px-4 py-3 flex items-center gap-2.5">
            <Smartphone size={20} className="text-white" />
            <h2 className="font-semibold text-white text-sm">🍎 iPhone</h2>
            {deviceType === 'ios' && (
              <span className="mr-auto text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full">جهازك</span>
            )}
          </div>
          <div className="p-6">
            <div className="font-semibold text-slate-800">تثبيت على iPhone / iPad</div>
            <div className="text-sm text-slate-500 mt-1">هذا الجهاز يطلب خطوات من متصفح Safari.</div>

            <div className="mt-4 text-sm text-slate-700">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center">①</span>
                  <div>افتح الموقع في Safari</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center">②</span>
                  <div>اضغط زر المشاركة</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center">③</span>
                  <div>اختر "Add to Home Screen"</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center">④</span>
                  <div>اضغط "Add" لإكمال التثبيت</div>
                </div>
              </div>
              <button onClick={() => setShowIosStepsImages(v => !v)} className="mt-3 text-xs text-blue-600">{showIosStepsImages ? 'إخفاء الصور' : 'عرض الصور'}</button>
            </div>
          </div>
        </div>
      </div>

      {deviceType === 'desktop' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
          <p className="text-xs text-amber-700">يمكن تثبيت التطبيق على هاتفك المحمول. افتح هذه الصفحة على هاتفك لعرض التعليمات المناسبة.</p>
        </div>
      )}

      {/* Features */}
      <div className="bg-white rounded-2xl border p-5 shadow-sm">
        <h3 className="font-semibold text-slate-800">ميزات التطبيق</h3>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-slate-600">
          <div className="flex items-center gap-2"><Bell size={16} /> إشعارات فورية</div>
          <div className="flex items-center gap-2"><Zap size={16} /> أسرع من المتصفح</div>
          <div className="flex items-center gap-2">✔️ يعمل بدون متجر</div>
          <div className="flex items-center gap-2">✔️ يعمل بملء الشاشة</div>
          <div className="flex items-center gap-2">✔️ تحديث تلقائي</div>
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-white rounded-2xl border p-5 shadow-sm">
        <h3 className="font-semibold text-slate-800">الأسئلة الشائعة</h3>
        <div className="mt-3 space-y-3 text-sm text-slate-700">
          <div>
            <div className="font-medium">لماذا لا يوجد زر تثبيت في الآيفون؟</div>
            <div className="text-slate-500">لأن Apple لا تسمح بذلك، ويتم التثبيت من Safari فقط.</div>
          </div>
          <div>
            <div className="font-medium">هل يحتاج App Store؟</div>
            <div className="text-slate-500">لا.</div>
          </div>
          <div>
            <div className="font-medium">هل سأفقد بياناتي؟</div>
            <div className="text-slate-500">لا.</div>
          </div>
          <div>
            <div className="font-medium">هل سأستقبل الإشعارات؟</div>
            <div className="text-slate-500">نعم.</div>
          </div>
        </div>
      </div>
    </div>
  )
}
