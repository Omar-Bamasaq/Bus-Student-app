# CHANGELOG.md — سجل تعديلات مشروع تنسيقية مواصلات فلك

> يُسجل هذا الملف كل تعديل يُجرى على المشروع.  
> أي تغيير في الكود، قاعدة البيانات، أو الواجهة يجب أن يُسجل هنا.

---

## الإطار الزمني

التاريخ | الإصدار | الوصف
--------|---------|------
2026-07-10 | — | تجهيز الإنتاج (Production): أمان، توثيق، اختبارات
2026-07-10 | — | إضافة `extraFeeStart` للرسوم الإضافية في الحملات
2026-07-04 | — | إنشاء PROJECT_SPECIFICATION.md و CHANGELOG.md
2026-07-04 | — | إعادة تصميم الاشتراك اليومي + نظام تتبع الباص المباشر
2026-07-04 | — | إعادة بناء رحلة العودة + نظام الطوارئ + OFF Days

---

## 2026-07-10

### إصلاح: `addNotification` غير موجودة في صفحات السائق

**الوصف:** `DriverDashboard.jsx` و `ReturnTrip.jsx` تستخرجان `addNotification` من `useNotifications()` ولكن `NotificationContext` لم يكن يصدرها، مما يسبب `TypeError` عند استقبال حدث `driver:operation-update` بحالة CRITICAL.

**الملفات الم changed:**
- `src/context/NotificationContext.jsx` — إضافة دالة `addNotification()` تنشئ نافذة منبثقة محلية مع صوت

**التصنيف:** إصلاح خطأ

### إصلاح: سوء حساب `hasMore` في تصفّح الإشعارات

**الوصف:** `NotificationCenter.jsx` و `student/Notifications.jsx` يستخدمان `notifications.length` من closure في `useCallback` مما يسبب offset قديم عند التحميل المتكرر.

**الملفات الم changed:**
- `src/components/ui/NotificationCenter.jsx` — استخدام `useRef` بدلاً من `notifications.length` في `fetchNotifications`
- `src/pages/student/Notifications.jsx` — نفس الإصلاح

**التصنيف:** إصلاح خطأ

### ميزة جديدة: إضافة `extraFeeStart` للرسوم الإضافية في الحملات

**الوصف:** إضافة حقل تاريخ بدء للرسوم الإضافية (`extraFeeStart`) في الحملات، يمكن للأدمن تحديده يدويًا عبر حقل `datetime-local` في النموذج. إذا تُرك فارغًا تبدأ الرسوم فور التفعيل (توافق عكسي). تنتهي الرسوم تلقائيًا مع نهاية الحملة. دالة `computeExtraRegistrationFee()` تتحقق من `extraFeeStart` قبل فرض الرسوم.

**الملفات الم changed:**
- `backend/prisma/schema.prisma` — إضافة `extraFeeStart DateTime?` إلى `Campaign`
- `backend/src/services/campaignService.js` — إضافة شرط `extraFeeStart` في `computeExtraRegistrationFee()`: إذا الوقت الحالي قبل `extraFeeStart` ← لا رسوم
- `backend/src/routes/campaigns.js` — POST و PUT تقبل `extraFeeStart` وتخزنه
- `src/pages/admin/Campaigns.jsx` — إضافة حقل `datetime-local` لتاريخ بدء الرسوم في النموذج
- `src/pages/student/Subscriptions.jsx` — إضافة شرط `extraFeeStart` في `getExtraFeeInfo()` (جهة الطالب)
- `PROJECT_SPECIFICATION.md` — تحديث جداول Campaign و CampaignEnrollment ووصف الميزة
- `CHANGELOG.md` — هذا الإدخال

**التصنيف:** ميزة جديدة
**Backward Compatibility:** نعم — الحملات الحالية `extraFeeStart = null` تعمل كما هي

### تجهيز الإنتاج (Production)

**الوصف:** تجهيز المشروع للنشر في بيئة الإنتاج - أمان، توثيق، اختبارات.

**الإجراءات:**

**الأمان:**
- إضافة `helmet` لتأمين headers (CSP, X-Frame-Options, إلخ)
- إضافة `express-rate-limit` لحماية `/api/auth` (200 طلب/15 دقيقة)
- إزالة fallback الـ JWT_SECRET الافتراضي من جميع الملفات (`authService.js`, `auth.js`, `socketService.js`) — الآن يرمي خطأ إذا كان `JWT_SECRET` غير معرّف
- تقييد CORS: في الإنتاج `CORS_ORIGIN` يجب أن يُحدد يدويًا، وإلا يُرفض الطلب
- CORS لـ Socket.IO يستخدم نفس إعدادات `CORS_ORIGIN`
- تحسين معالج الأخطاء: في الإنتاج لا يُظهر رسالة الخطأ الحقيقية
- إضافة `.env` و `cookies.txt` إلى `.gitignore`

**التوثيق:**
- إنشاء `README.md` بديل عن النموذج الافتراضي — يشرح التشغيل السريع والبنية
- إنشاء `DEPLOYMENT.md` دليل نشر كامل (PostgreSQL, Backend, Frontend, Nginx, SSL, Security, Backup)
- إنشاء `backend/.env.example` — جميع متغيرات البيئة المطلوبة
- تحديث `.env.example` — إضافة `VITE_SOCKET_URL`

**PWA:**
- تحديث `public/manifest.json` — إضافة 512x512 icon و `maskable` purpose
- تحديث `public/sw.js` — إضافة cached assets إضافية (sounds, SVG, icons)، تحسين استراتيجية التخزين المؤقت

**قاعدة البيانات:**
- تحديث `prisma/seed.js` — إضافة `deleteMany` لـ `Destination`, `PricingArea`, `Pricing` لمنع فشل إعادة التشغيل
- مراجعة الـ indexes — جميع الموديلات الـ 30 تحتوي على indexes مناسبة

**اختبارات:**
- تشغيل `vite build` — ✅ 700 modules, 4.53s
- تشغيل `node --check` على جميع ملفات الـ backend — ✅
- تشغيل الخادم والتحقق من API endpoints — ✅ (login, students, dashboard, health)
- حالياً لا توجد اختبارات وحدة (unit tests) — `backend/src/services/__tests__/` فارغ

**الملفات الم changed:**
- `backend/src/index.js` — إضافة helmet, rate-limit, تحسين CORS + error handler
- `backend/src/middleware/auth.js` — إزالة fallback secret
- `backend/src/services/authService.js` — إزالة fallback secret
- `backend/src/services/socketService.js` — إزالة fallback secret + تحسين CORS
- `backend/package.json` — إضافة `helmet`, `express-rate-limit`
- `backend/.env.example` — إنشاء جديد
- `backend/prisma/seed.js` — إضافة deleteMany للجداول المفقودة
- `.env.example` — إضافة `VITE_SOCKET_URL`
- `.gitignore` — إضافة `.env` و `cookies.txt`
- `public/manifest.json` — تحديث الأيقونات
- `public/sw.js` — تحسين التخزين المؤقت
- `README.md` — إعادة كتابة كاملة
- `DEPLOYMENT.md` — إنشاء جديد
- `CHANGELOG.md` — هذا الإدخال

**التصنيف:** مهام إنتاج
**Backward Compatibility:** نعم

---

## 2026-07-04

### إعادة تصميم الاشتراك اليومي — Daily Subscription Redesign

**الوصف:** استبدال Calendar Date Picker القديم بنظام مدة + أيام Checkbox + تواريخ تنفيذ فعلية

**الملفات الم changed:**
- `backend/prisma/schema.prisma` — إضافة نموذج `DailyExecutionDate`، حقول `durationWeeks` و `selectedDays` في Subscription
- `backend/src/services/subscriptionService.js` — إضافة دوال `generateExecutionDates()`، `setExecutionDates()`، `getExecutionDates()`، `hasDailyExecutionForDate()`، تحديث `isSubscriptionActiveForDate()` و `buildDailySubscriptionDateRange()`
- `backend/src/services/studentService.js` — تحديث `canStudentOperateOnDate()` ليتحقق من `DailyExecutionDate` أولاً
- `backend/src/routes/studentPortal.js` — تحديث `/subscription-request` ليقبل `selectedDays` + `durationWeeks` + `startNow`
- `backend/src/routes/approvals.js` — عرض `executionDates` في القائمة، التحقق من التواريخ عند الموافقة
- `backend/src/routes/subscriptions.js` — تضمين `executionDates` في الاستعلامات
- `backend/src/services/weeklySheetService.js` — الاستفادة من `canStudentOperateOnDate()` المحدّثة
- `src/pages/student/Subscriptions.jsx` — إعادة كتابة كاملة: Duration Selector + Day Checkboxes + سؤال "هذا الأسبوع أم القادم؟" + ملخص التواريخ والتكلفة
- `src/pages/admin/Approvals.jsx` — تحديث عرض الاشتراكات اليومية: أيام، مدة، تواريخ تنفيذ، سعر إجمالي
- `src/lib/api.js` — إضافة `studentPortal.subscriptionRequest`

**السبب:** تحسين تجربة المستخدم وإزالة الـ Calendar Date Picker الذي كان معقداً وغير دقيق

**Backward Compatibility:** الاشتراكات القديمة بدون `DailyExecutionDate` تستمر بالعمل عبر `startDate/endDate` + `notes.days`

---

### نظام تتبع الباص المباشر — Bus Tracking System (بدون GPS)

**الوصف:** نظام تتبع يعتمد على ترتيب الطلاب في الباص مع WebSocket فوري، بدون GPS أو خرائط

**الملفات الم changed:**
- `backend/prisma/schema.prisma` — إضافة `currentStudentIdx` (Int) و `skippedStudentIds` (String JSON) إلى ActiveBus
- `backend/src/services/socketService.js` — إنشاء WebSocket server مع JWT auth وغرف `bus:{id}`
- `backend/src/services/trackingService.js` — إنشاء: `getTrackingState()`، `skipStudent()`، `unskipStudent()`، `advanceTrackingAfterAttendance()`، `checkAndSendNotifications()`
- `backend/src/routes/tracking.js` — إنشاء: GET `/:activeBusId`، POST `/skip`، POST `/unskip`
- `backend/src/routes/attendance.js` — استدعاء `advanceTrackingAfterAttendance()` بعد تسجيل الحضور
- `backend/src/index.js` — إضافة `trackingRoutes`
- `src/lib/socket.js` — إنشاء عميل WebSocket (اتصال، غرف، استقبال تحديثات)
- `src/lib/api.js` — إضافة `api.tracking.{get, skip, unskip}`
- `src/pages/student/Home.jsx` — إعادة كتابة: قائمة طلاب بالألوان (🟢/🟡/🔴/🟠)، "أنت التالي"/"بقي X طلاب"، WebSocket
- `src/pages/driver/Dashboard.jsx` — إضافة زر "تجاوز الطالب" (Skip)، قائمة بحالة كل طالب
- `src/pages/admin/BusOperationDetail.jsx` — إضافة كارت تقدم الرحلة مع النسبة والطالب الحالي

**السبب:** توفير تجربة تتبع مباشر بدون الحاجة لـ GPS أو أجهزة إضافية

**ملاحظة:** حالة التتبع تُحتسب ديناميكياً من Attendance + `skippedStudentIds` — لا حاجة لنموذج PickupProgress منفصل

---

### إعادة بناء رحلة العودة — Return Trip Refactoring

**الوصف:** إعادة تنظيم نظام رحلة العودة مع API موحدة وواجهة جديدة

**الملفات الم changed:**
- `backend/src/routes/return.js` — إعادة هيكلة: نقاط نهاية منفصلة للـ operation، queue، active-buses، loads، dispatch، complete
- `backend/src/routes/studentPortal.js` — إضافة `POST /return-queue/join`
- `backend/prisma/schema.prisma` — إضافة `ReturnQueue` model، تحديث `ActiveBus` مع `returnCompletedAt`
- `src/pages/admin/ReturnDispatchCenter.jsx` — إنشاء مركز توزيع العودة
- `src/pages/admin/DepartedTrips.jsx` — إنشاء صفحة المنطلقات
- `src/pages/driver/ReturnTrip.jsx` — إنشاء واجهة سائق لرحلة العودة
- `src/pages/student/Home.jsx` — إضافة زر طلب العودة مع شرطية حسب المرحلة

**السبب:** فصل منطق العودة عن التشغيل الصباحي لتسهيل الصيانة

---

### نظام الطوارئ — Emergency System

**الوصف:** نظام كامل للتعامل مع أعطال الباصات ونقل الطلاب

**الملفات الم changed:**
- `backend/prisma/schema.prisma` — إضافة نموذج `EmergencyLog`، تحديث `ActiveBusStatus` مع `BROKEN_DOWN` و `REPLACED`
- `backend/src/services/emergencyService.js` — إنشاء 6 دوال: `getEmergencyBuses()`، `declareBreakdown()`، `autoTransferStudents()`، `manualTransferStudents()`، `replaceBus()`، `getEmergencyLogs()`
- `backend/src/routes/emergency.js` — إنشاء 6 endpoints
- `src/pages/admin/EmergencyCenter.jsx` — إنشاء مركز الطوارئ
- `src/pages/admin/EmergencyBusDetail.jsx` — إنشاء تفاصيل باص في الطوارئ
- `backend/src/index.js` — إضافة `emergencyRoutes`

**السبب:** توفير حل سريع لأعطال الباصات دون تعطيل الرحلة اليومية

---

### نظام OFF Days — Student Off Days System

**الوصف:** توحيد منطق التحقق من إجازات الطلاب في دالة واحدة

**الملفات الم changed:**
- `backend/src/services/studentService.js` — إنشاء `canStudentOperateOnDate()` كمرجع وحيد لكل الأنظمة
- `backend/src/services/operationService.js` — استخدام `canStudentOperateOnDate()` في `generateTodayOperations()`
- `backend/src/services/weeklySheetService.js` — استخدام `canStudentOperateOnDate()` في `getStudentWeeklyStatus()`
- `backend/src/routes/approvals.js` — استخدام `canStudentOperateOnDate()` عند إضافة طالب للتشغيل

**السبب:** توحيد المنطق في دالة واحدة لتجنب التناقض بين الأنظمة المختلفة

---

### Debug Logs — سجلات التصحيح

**الوصف:** إضافة سجلات DEBUG تفصيلية لعملية إنشاء التشغيل

**الملفات الم changed:**
- `backend/src/services/operationService.js` — إضافة PRE-FILTER logs لكل طالب مع سبب الإزالة في `generateTodayOperations()`

**السبب:** تسهيل تتبع لماذا لا يظهر طالب معين في التشغيل

---

### 2026-07-04 — الوثائق

**الوصف:** إنشاء وثائق المشروع الرسمية

**الملفات الجديدة:**
- `PROJECT_SPECIFICATION.md` — الوثيقة الرسمية للمشروع (مرجع لكل تطوير مستقبلي)
- `CHANGELOG.md` — سجل تعديلات المشروع

**السبب:** توثيق النظام بالكامل وتحديد مرجع رسمي للتطوير المستقبلي

---

### 2026-07-04 — مزامنة حالة الرحلة بين البوابات (Socket + SSOT)

**الوصف:** إصلاح خلل عدم تحديث حالة الرحلة فورياً بين السائق والطالب والمشرف عند انتهاء رحلة الذهاب. جعل `ActiveBus.status` المصدر الوحيد للحقيقة لحالة الرحلة، مع بث فوري عبر Socket.IO عند أي تغيير في الحالة.

**المشكلة:** عند إنهاء الرحلة من لوحة السائق، لم يكن يُبث أي حدث Socket.IO، مما جعل الطالب يرى التقدم مستمراً لـ 10 ثوانٍ (انتظار الاستعلام الدوري).

**الملفات الم changed:**
- `backend/src/services/trackingService.js` — `getTrackingState()`: عندما `busStatus === 'ARRIVED'` تُجبر `allDone=true` وتُصفّر `currentStudent`/`nextStudent`. إضافة دوال `startMorningTrip()` (تبدأ الرحلة، تحدث الحالة إلى DEPARTED، تبث socket)، `cancelMorningTrip()` (تلغي الرحلة، تسجل الغائبين، تحدث assignments، تبث socket)، `completeMorningTrip()` (تسجل الغائبين، تحدث الحالة إلى ARRIVED وتُحدّث assignments إلى completed، تبث socket)
- `backend/src/services/operationService.js` — إضافة `updateAssignmentsStatusByBus(busId, status)` لتحديث assignments تلقائياً
- `backend/src/routes/attendance.js` — إضافة `POST /start-morning/:busId` (للسائق)، تحديث `POST /complete-morning/:busId` لاستخدام `completeMorningTrip()`
- `backend/src/routes/operations.js` — تحديث `POST /today/bus/:busId/complete-morning` لاستخدام `completeMorningTrip()`، إضافة `POST /today/bus/:busId/cancel` (للمشرف)
- `src/pages/driver/Dashboard.jsx` — استدعاء `api.attendance.startMorning()` عند النقر على "بدء الرحلة"، تحديث مستمع socket لفحص `state.busStatus === 'ARRIVED'`
- `src/pages/student/Home.jsx` — عند استقبال `busStatus === 'ARRIVED'` عبر socket، استدعاء `load()` فوراً لتحديث المرحلة
- `src/pages/admin/BusOperationDetail.jsx` — تحديث قسم التتبع: إخفاء عناصر التقدم وعرض "اكتملت رحلة الذهاب" عند `ARRIVED`
- `src/lib/api.js` — إضافة `api.attendance.startMorning()` و `api.operations.cancelTrip()`

**السبب:** منع تعارض حالة الرحلة بين البوابات، وضمان تحديث فوري ومتزامن لجميع المستخدمين.

---

### 2026-07-04 — إدارة حالة رحلة الذهاب (إزالة القائمة المنسدلة + دورة حياة تلقائية)

**الوصف:** إزالة إمكانية تعديل حالة رحلة الذهاب يدوياً من لوحة المشرف عبر القائمة المنسدلة لكل طالب، واستبدالها بشارة عرض فقط مع دورة حياة تلقائية تستند إلى `ActiveBus.status`. إضافة زر "إلغاء الرحلة" مستقل مع نافذة تأكيد.

**المشكلة:** القائمة المنسدلة لكل طالب (`scheduled/in_progress/completed/cancelled`) كانت تسمح للمشرف بتغيير حالة الرحلة يدوياً، مما يتعارض مع الحالة الفعلية للرحلة ويسبب عدم اتساق بين الواجهات.

**الملفات الم changed:**
- `backend/src/services/operationService.js` — إرجاع `activeBusStatus` في `getBusOperationDetail()`
- `src/pages/admin/BusOperationDetail.jsx` — إزالة القائمة المنسدلة لكل طالب واستبدالها بـ `StatusBadge` للعرض فقط؛ إضافة شارة حالة الرحلة في أعلى النافذة (مشتقة من `detail.activeBusStatus`) مع زر "إلغاء الرحلة" (يظهر فقط للحالات القابلة للإلغاء) ومودال تأكيد الإلغاء؛ إزالة دالة `handleStatusChange()` و `statusMap` غير المستخدمة

**سبب إزالة القائمة المنسدلة:**
- حالة الرحلة يجب أن تعكس الواقع التشغيلي وليس تعديلاً يدوياً
- لا يجوز تعديل حالتي `in_progress` و `completed` يدوياً
- `ActiveBus.status` هو المصدر الوحيد للحقيقة (SSOT)

**دورة الحالة التلقائية:**
| الحدث | ActiveBus.status | عرض المشرف |
|---|---|---|
| إنشاء التشغيل اليومي | AVAILABLE | مجدولة |
| ضغط السائق "بدء الرحلة" → `startMorningTrip()` | DEPARTED | قيد التنفيذ |
| `completeMorningTrip()` | ARRIVED | مكتملة |
| زر "إلغاء الرحلة" → `cancelMorningTrip()` | CANCELLED | ملغية |

---

### تحسين واجهة اشتراكات الطالب — Student Subscriptions UI Updates

**الوصف:** تحديث صفحة اشتراكات الطالب لتقديم تبويب `الأسعار` بدل `الحالي` وعرض أسعار الاشتراكات حسب المنطقة بترتيب تنازلي حسب سعر 4 أسابيع، مع تمييز المنطقة الخاصة بالطالب باللون الأزرق وإزالة النص الإرشادي غير الضروري.

**الملفات الم changed:**
- `src/pages/student/Subscriptions.jsx` — تغيير تسمية التبويب إلى `الأسعار`، عرض جدول الأسعار حسب المنطقة، ترتيب الأسعار تنازلياً حسب سعر 4 أسابيع، تمييز المنطقة الحالية للطالب، وإزالة النص الإضافي من الواجهة.

**السبب:** تحسين وضوح المعلومات المقدمة للطالب وجعل صفحة الاشتراكات أكثر بساطة وفعالية.

---

### 2026-07-05 — إصلاح قائمة انتظار رحلات العودة ومعلومات الاتصال

**الوصف:** إصلاح عرض بطاقة الطالب في مركز توزيع الرحلات، بحيث يتم عرض أزرار اتصال وواتساب سريعة فقط، واستدعاء بيانات الطلاب من قائمة الانتظار مع حقول `whatsapp`, `pickupLocation`, و `address`.

**الملفات الم changed:**
- `src/pages/admin/ReturnDispatchCenter.jsx` — إزالة العنصر الفارغ من بطاقة الاتصال، وتحسين أزرار الاتصال والواتساب.
- `backend/src/routes/return.js` — توسيع `student` select في `/return/queue` و`POST /queue` ليشمل `whatsapp`, `pickupLocation`, و `address`.

**السبب:** ضمان أن بيانات الاتصال والعنوان تُعرض بشكل صحيح في واجهة المشرف لرحلات العودة.

### 2026-07-05 — إزالة التكرار المعماري + بنية الإشعارات الموحّدة

**الوصف:** إزالة `detail.activeBusStatus` كمصدر مكرر للحقيقة، وجعل `tracking.busStatus` هو SSOT الوحيد لحالة الرحلة عبر جميع الواجهات. إضافة بنية إشعارات موحّدة عبر `notificationService.createAndBroadcast()` مع بث فوري عبر Socket.IO.

**المشكلة المعمارية:** `detail.activeBusStatus` و `tracking.busStatus` كانا يمثلان نفس القيمة (`ActiveBus.status`) ولكن `detail.activeBusStatus` كان stale (لا يُحدث بعد التحميل الأولي)، مما يسبب تعارضًا بين الواجهات.

**مبادئ الالتزام:**
- لا مصدر ثانٍ للحقيقة (SSOT واحد = `tracking.busStatus`)
- Socket.IO للتحديثات اللحظية فقط، لا لبناء الحالة الابتدائية
- بناء الحالة من Snapshot (API call) أولاً، ثم تحديثات Socket
- بنية إشعارات موحّدة قابلة للتوسع لكل الأنواع (تتبع، طوارئ، عودة، اشتراكات)
- لا منطق مكرر — `notificationService.createAndBroadcast()` تستخدمها جميع الخدمات

**الملفات الم changed:**

*الإزالة المعمارية:*
- `backend/src/services/operationService.js` — إزالة `activeBusStatus` من `getBusOperationDetail()`، إضافة `activeBusId` + `busStatus` إلى `getTodayOperation()` لكل باص
- `src/pages/admin/BusOperationDetail.jsx` — جميع قراءات `detail.activeBusStatus` استُبدلت بـ `tracking?.busStatus` (badge، زر الإلغاء، عمود الحالة في الجدول)

*إصلاح Refresh Driver:*
- `src/pages/driver/Dashboard.jsx` — `setActiveBusId(myBusData.activeBusId)` بدلاً من `myBusData.id`؛ إضافة استدعاء `api.tracking.get(activeBusId)` بعد `loadData()` لاستعادة `tripStatus` من Snapshot
- `src/pages/student/Home.jsx` — استخدام `myBus.activeBusId` بدلاً من `myBus.id` لربط tracking الصحيح

*بنية الإشعارات الموحّدة:*
- `backend/src/services/notificationService.js` — إنشاء: `createAndBroadcast()` (تكتب في DB + تبث عبر Socket)، `getUnreadCount()`، `markAsRead()`، `markAllAsRead()`
- `backend/src/services/socketService.js` — انضمام تلقائي إلى `user:{id}` عند الاتصال، إضافة `broadcastNotification()`، إضافة حدث `notification:join`
- `backend/src/services/trackingService.js` — استبدال الكتابة المباشرة في DB بـ `createAndBroadcast()` في `checkAndSendNotifications()`
- `src/lib/socket.js` — إضافة `onNotificationNew()`، `offNotificationNew()`، `joinNotificationRoom()`
- `src/pages/student/Home.jsx` — إضافة مستمع `notification:new` يستدعي `load()` عند وصول إشعار جديد

**السبب:** إزالة التكرار المعماري بين `detail.activeBusStatus` و `tracking.busStatus`، وإصلاح Refresh Driver/Student، وتوفير بنية إشعارات موحّدة تخدم جميع الأنظمة المستقبلية دون تكرار كود.

---

---

## 2026-07-06 — تحسين نظام الإشعارات V2 (المرحلة الأخيرة)

**الوصف:** تحسين شامل لنظام الإشعارات ليجعله احترافياً، مستقراً، ومتزامناً لحظياً بين الأجهزة، مع الحفاظ الكامل على البنية الحالية (`createAndBroadcast` كمرجع وحيد).

### 1. تحسين إعادة الاتصال (Reconnect Recovery)

عند انقطاع Socket.IO وعودته، النظام يعيد تلقائياً:
1. إعادة الاتصال بالـ Socket (مهيأ بـ `reconnection: true`, `reconnectionAttempts: Infinity`, `reconnectionDelay: 1000ms`)
2. إعادة الانضمام إلى غرفة `user:{id}`
3. تحديث عداد الإشعارات من API
4. طلب الإشعارات الفائتة عبر `notification:get-missed` مع آخر طابع زمني

**الملفات الم changed:**
- `src/lib/socket.js` — إضافة `onReconnect()`، إعدادات إعادة اتصال Socket.IO
- `src/context/NotificationContext.jsx` — استقبال `onReconnect` لاستعادة الحالة، تخزين `lastNotifTimeRef`، الاستجابة لـ `notification:missed-list`
- `backend/src/services/socketService.js` — إضافة معالج `notification:get-missed` socket event (يجلب الإشعارات الفائتة من DB ويعيدها مع العدد غير المقروء)

### 2. مزامنة الإشعارات بين الأجهزة

أحداث Socket جديدة للمزامعة اللحظية:

| الحدث | التوقيت | الغرض |
|-------|---------|-------|
| `notification:read` | عند قراءة إشعار | تحديث `isRead: true` في جميع الأجهزة |
| `notification:read-all` | عند قراءة الكل | تحديث الكل كمقروء في جميع الأجهزة |
| `notification:deleted` | عند حذف إشعار | إزالة الإشعار من جميع الأجهزة |
| `notification:deleted-all` | عند حذف الكل | إفراغ القائمة في جميع الأجهزة |

**الملفات الم changed:**
- `backend/src/services/socketService.js` — إضافة `broadcastNotificationRead()`, `broadcastNotificationReadAll()`, `broadcastNotificationDeleted()`, `broadcastNotificationDeletedAll()`
- `backend/src/services/notificationService.js` — استدعاء دوال البث بعد كل عملية (markAsRead, markAllAsRead, deleteNotification, deleteAllNotifications)
- `src/lib/socket.js` — إضافة `onNotificationRead`, `offNotificationRead`, `onNotificationReadAll`, `offNotificationReadAll`, `onNotificationDeleted`, `offNotificationDeleted`, `onNotificationDeletedAll`, `offNotificationDeletedAll`
- `src/context/NotificationContext.jsx` — تحديث الحالة محلياً عند استقبال أحداث المزامعة
- `src/components/ui/NotificationCenter.jsx` — تحديث القائمة عند استقبال أحداث المزامعة
- `src/pages/student/Notifications.jsx` — تحديث القائمة عند استقبال أحداث المزامعة

### 3. تحسين Popup حسب الأولوية

| الأولوية | المدة | السلوك |
|----------|-------|--------|
| INFO | 4 ثوانٍ | شريط تقدم 4s، يختفي تلقائياً |
| WARNING | 6 ثوانٍ | شريط تقدم 6s، يختفي تلقائياً |
| CRITICAL | لا ينتهي | لا شريط تقدم، لا يختفي تلقائياً، يبقى حتى يغلقه المستخدم. زر الإغلاق معطل أثناء الأنيميشن (300ms). السحب للرفض معطل أيضاً أثناء الأنيميشن. |

**الملفات الم changed:**
- `src/components/ui/NotificationPopup.jsx` — إخفاء شريط التقدم لـ CRITICAL، ضبط المدة حسب الأولوية، تعطيل الإغلاق أثناء الأنيميشن
- `src/context/NotificationContext.jsx` — استخدام `POPUP_DURATION = { INFO: 4000, WARNING: 6000, CRITICAL: Infinity }`

### 4. تحسين الأصوات

- **INFO**: `sounds/info.wav` (صوت خفيف 880Hz، 300ms)
- **WARNING**: `sounds/warning.wav` (صوت متوسط 660Hz، 500ms)
- **CRITICAL**: `sounds/emergency-alarm.wav` (إنذار قائم)
- الصوت يُشغل **مرة واحدة** لكل إشعار عبر `lastSoundIdRef`

**الملفات الم changed:**
- `public/sounds/info.wav` — **جديد** — صوت تنبيه خفيف
- `public/sounds/warning.wav` — **جديد** — صوت متوسط
- `src/context/NotificationContext.jsx` — إضافة `playNotificationSound()`، تشغيل الصوت مع `playNotificationSound` في `handleNewNotification`

### 5. Pagination / Infinite Scroll

- حجم الصفحة: 20 إشعاراً
- يستخدم IntersectionObserver للتحميل التلقائي عند الوصول لنهاية القائمة
- زر "عرض المزيد" كاحتياطي

**الملفات الم changed:**
- `src/components/ui/NotificationCenter.jsx` — إضافة `hasMore`، `loadingMore`، `fetchNotifications(true)` مع `offset`، IntersectionObserver للـ infinite scroll
- `src/pages/student/Notifications.jsx` — نفس التغييرات مع `sentinelRef`

### 6. تحسين الأداء العام

- **لا مستمعين مكررين**: جميع دوال `on*` تستدعي `socket.off()` قبل `socket.on()`
- **تنظيف شامل عند Unmount**: جميع `off*`، `clearTimeout`، إيقاف الصوت، تصفير المراجع
- **لا استعلامات مكررة**: `connectSocket` تعيد الكائن الموجود إذا كان متصلاً
- **IntersectionObserver**: يُفصل في cleanup

### الملفات الكاملة المعدلة

| الملف | التعديل |
|-------|---------|
| `backend/src/services/socketService.js` | إضافة دوال البث للمزامعة + معالج `notification:get-missed` |
| `backend/src/services/notificationService.js` | استدعاء دوال البث بعد كل عملية تعديل |
| `src/lib/socket.js` | إعادة اتصال + أحداث مزامعة + `emitGetMissedNotifications` |
| `src/context/NotificationContext.jsx` | استرجاع الفائتة + مزامعة + أصوات + توقيت حسب الأولوية |
| `src/components/ui/NotificationPopup.jsx` | سلوك مختلف حسب الأولوية |
| `src/components/ui/NotificationCenter.jsx` | Pagination + مزامعة |
| `src/pages/student/Notifications.jsx` | Pagination + مزامعة |
| `public/sounds/info.wav` | **جديد** — صوت INFO |
| `public/sounds/warning.wav` | **جديد** — صوت WARNING |

**Backward Compatibility:** 100%. جميع التعديلات فوق البنية الحالية. `createAndBroadcast` لم يُمس. جميع Socket Events الحالية لم تُمس.

---

---

## 2026-07-07

### نظام الوجهات + إعادة هيكلة التسعير — Destination & Pricing Restructure

**الوصف:** إضافة نظام الوجهات (Destinations) المستقل، ربط الطالب بوجهة، إعادة هيكلة Pricing ليصبح unique(zoneId, destinationId, plan) بدلاً من unique(zoneId, plan)، مع إنشاء `PricingService.getPrice()` الموحد.

**التغييرات الرئيسية:**
1. **قاعدة البيانات:**
   - نموذج `Destination` جديد (name, isActive, sortOrder)
   - حقل `destinationId` اختياري في `Student` (FK → Destination, onDelete: SetNull)
   - حقل `destinationId` اختياري في `Pricing` (FK → Destination, onDelete: Cascade)
   - Unique constraint في Pricing: `(zoneId, destinationId, plan)` بدلاً من `(zoneId, plan)`

2. **Backend:**
   - `backend/src/services/pricingService.js` — **جديد**: دالة `getPrice(zoneId, destinationId, plan)` الموحدة + `getPriceByZoneName()` + `ensurePricingRows()`
   - `backend/src/routes/destinations.js` — **جديد**: CRUD كامل للوجهات
   - `backend/src/routes/students.js` — إضافة `destinationId` في create/update/query
   - `backend/src/routes/pricing.js` — إعادة هيكلة لدعم destinationId: إضافة `/price` endpoint، تعديل upsert إلى `zone_dest_plan_unique`
   - `backend/src/routes/studentPortal.js` — إضافة `/pricing-by-destination` endpoint، تضمين `destination` في dashboard
   - `backend/src/index.js` — تسجيل مسار `/api/destinations`
   - `backend/src/services/studentService.js` — `canStudentOperateOnDate()`: استبعاد السبت للاشتراكات الأسبوعية
   - `backend/src/services/subscriptionService.js` — `generateExecutionDates()` + `buildDailySubscriptionDateRange()`: استبعاد السبت تلقائياً

3. **Frontend:**
   - `src/pages/admin/Destinations.jsx` — **جديد**: صفحة CRUD للوجهات (إضافة، تعديل، تنشيط/تعطيل، حذف)
   - `src/pages/admin/Pricing.jsx` — إعادة تصميم كاملة: اختيار منطقة ← اختيار وجهة ← أسعار خاصة بالوجهة، مع جدول ملخص
   - `src/pages/admin/Students.jsx` — إضافة حقل الوجهة في النموذج والجدول
   - `src/pages/student/Subscriptions.jsx` — عرض أسعار خاصة بالوجهة بدلاً من الأسعار العامة
   - `src/components/layout/Sidebar.jsx` — إضافة رابط "الوجهات"
   - `src/App.jsx` — إضافة route `/admin/destinations`
   - `src/lib/api.js` — إضافة `destinations.*` و `pricing.getPrice()` و `pricing.updateZone()`

4. **Seed:**
   - `backend/prisma/seed.js` — 3 وجهات افتراضية: جامعة حضرموت (فلك)، جامعة العلوم والتكنولوجيا (بويش)، كلية الريان التقنية (جول مسحة)

**المبادئ المعمارية:**
- `PricingService.getPrice()` هو الواجهة الوحيدة لحساب السعر — جميع الملفات تستخدمه ولا توجد مقارنة بأسماء نصية
- الوجهة تُنشأ كجدول مستقل مع CRUD كامل — يمكن إضافة وجهة جديدة دون تعديل كود
- السعر يُبحث بالترتيب: (zoneId + destinationId + plan) ← (zoneId + null + plan) ← حقل المنطقة الافتراضي
- الاشتراكات الأسبوعية تعمل الأحد–الخميس فقط (السبت مستبعد)، اليومي يسمح بالسبت–الخميس، الجمعة ممنوع للجميع

**Backward Compatibility:** البيانات الحالية تستمر في العمل لأن `destinationId` اختياري في Pricing و Student. الطلاب الحاليون بلا وجهة سيستخدمون السعر الافتراضي للمنطقة.

---

---

## 2026-07-07 — إعادة تصميم صفحة إدارة الاشتراكات اليومية + تشغيل السبت

### أولاً: إعادة تصميم DailySubscriptionManagement

**الوصف:** تقسيم صفحة إدارة الاشتراكات اليومية إلى تبويبين: "السبت" و "الأيام العادية".

**التفاصيل:**
- **تبويب السبت:** يعرض جميع الطلاب المشتركين ليوم السبت مع زر "بدء تشغيل السبت" الذي ينتقل إلى صفحة الإدارة
- **تبويب الأيام العادية:** يعرض الطلاب ذوي الاشتراك اليومي غير الموزعين مع إمكانية إضافتهم لباص
- شريط سريع للتبديل بين التبويبين مع عداد لكل تبويب
- تحديث تلقائي عبر `dailyExceptions:update`

**الملفات:**
- `src/pages/admin/DailySubscriptionManagement.jsx` — إعادة كتابة كاملة بنظام التبويبات

**السبب:** فصل اشتراكات السبت عن اليومية لتسهيل الإدارة.

---

### ثانياً: إنشاء SaturdayOperation.jsx — صفحة إدارة تشغيل السبت

**الوصف:** صفحة كاملة لإدارة تشغيل السبت تشمل اختيار الباصات وإنشاء التشغيل وتوزيع الطلاب.

**التفاصيل:**
- حالة "لا يوجد تشغيل": عرض المشتركين + زر "بدء تشغيل السبت" الذي يفتح نافذة اختيار الباصات مع خيار "اختر الكل"
- حالة "يوجد تشغيل": تقسيم 2/3 + 1/3
  - يمين: قائمة الباصات العاملة بطاقات تحتوي على رقم الباص، السائق، السعة، الطلاب الموزعين
  - يسار: الطلاب غير الموزعين مع زر "إضافة لباص" لكل طالب
  - نافذة إضافة طالب لباص مع اختيار وقت التوصيل
  - زر "إنهاء التشغيل" في رأس الصفحة
- تحديث تلقائي عبر `saturday:update` socket event
- إضافة `onSaturdayUpdate` / `offSaturdayUpdate` في `socket.js`

**الملفات الجديدة:**
- `src/pages/admin/SaturdayOperation.jsx` — صفحة إدارة تشغيل السبت

**الملفات المعدلة:**
- `src/App.jsx` — إضافة route `/admin/saturday/operation`
- `src/lib/socket.js` — إضافة `onSaturdayUpdate` / `offSaturdayUpdate`
- `src/components/layout/Sidebar.jsx` — إضافة رابط "تشغيل السبت" مع أيقونة Sun
- `src/components/layout/MobileDrawer.jsx` — إضافة رابط "تشغيل السبت"
- `src/components/layout/TopNavbar.jsx` — إضافة عنوان "تشغيل السبت"

**السبب:** تمكين المشرف من إدارة تشغيل يوم السبت بشكل مستقل تماماً عن تشغيل الأحد-الخميس.

---

### ثالثاً: إصلاح Cutoff Time 12 ظهراً لاختيار تاريخ الاشتراك اليومي

**الوصف:** إذا اختار الطالب يوماً والتوقيت الحالي ≥ 12 ظهراً، يُسجل لليوم التالي في الأسبوع القادم بدلاً من اليوم الحالي.

**التفاصيل:**
- إنشاء دالة `resolveExecutionDate(dayName, referenceDate)` مع `CUTOFF_HOUR = 12`
- إذا كان اليوم المطلوب هو اليوم الحالي والوقت ≥ 12:00 → ترجع الأسبوع القادم
- تحديث `generateExecutionDates()` لاستخدام `resolveExecutionDate()` بدلاً من الحساب المباشر
- تحديث `buildDailySubscriptionDateRange()` لاستخدام `resolveExecutionDate()`

**الملفات:**
- `backend/src/services/subscriptionService.js` — إضافة `resolveExecutionDate()`، تحديث `generateExecutionDates()`، تحديث `buildDailySubscriptionDateRange()`

**اختبارات التحقق:**
- الثلاثاء 11:59 صباحاً → الثلاثاء → هذا الثلاثاء ✓
- الثلاثاء 12:00 ظهراً → الثلاثاء → الثلاثاء القادم ✓
- الثلاثاء 9 مساءً → الثلاثاء → الثلاثاء القادم ✓
- الأربعاء → الثلاثاء → الثلاثاء القادم ✓
- الثلاثاء 11:59 صباحاً → الأربعاء → هذا الأربعاء ✓
- الثلاثاء 12 ظهراً → الأربعاء → هذا الأربعاء ✓

**السبب:** منع تسجيل الاشتراك ليوم مضى عملياً (بعد 12 ظهراً)، مما يسبب ارتباكاً للطالب.

---

### رابعاً: إصلاح عداد تشغيل اليوم (getAvailableBuses)

**الوصف:** عداد الطلاب في نافذة إنشاء التشغيل كان يعرض جميع طلاب القالب حتى لو كانوا غير مؤهلين للتشغيل اليوم.

**التفاصيل:**
- `getAvailableBuses()` كان يحسب `_count.templateStudents` فقط (جميع الطلاب)
- الآن يحسب الطلاب المؤهلين فعلاً باستخدام:
  1. `canStudentOperateOnDate()` (إجازات، أيام عطلة، اشتراكات)
  2. استبعاد المحولين مؤقتاً (outgoing transfers)
  3. استبعاد الموقوفين مالياً (`getStudentIdsToExclude()`)
- `templateStudentCount` الآن = العدد الحقيقي الذي سيدخل التشغيل

**الملفات:**
- `backend/src/services/operationService.js` — إعادة كتابة `getAvailableBuses()` ليجلب `templateStudents` و `outgoingTransfers` ويحسب العدد المؤهل

**السبب:** الرقم الظاهر في النافذة يجب أن يطابق العدد الفعلي للطلاب بعد إنشاء التشغيل لمنع ارتباك المشرف.

---

### خامساً: تحسين واجهة إنشاء التشغيل

**الوصف:** تحديث النصوص والتنبيهات في CreateOperationDialog.

**التفاصيل:**
- "X طالب متوقع" ← "X طالب مؤهل"
- الباص بدون طلاب مؤهلين: يعرض "لا يوجد طلاب مؤهلون اليوم" مع تنسيق برتقالي (border, bg, icon)
- شريط التحديد السفلي: يعرض "لا يوجد طلاب مؤهلون في الباصات المختارة" إذا كان العدد الكلي صفراً
- الباصات بدون مؤهلين تظهر باهتة (opacity 60%) مع إمكانية اختيارها

**الملفات:**
- `src/pages/admin/DailyOperation.jsx` — تحديث نصوص CreateOperationDialog + تنسيق البطاقات

**السبب:** الشفافية التامة للمشرف حول عدد الطلاب الحقيقيين المؤهلين للتشغيل.

---

---

## 2026-07-08 — نظام رسوم التسجيل الإضافية (رسوم طالب جديد / رسوم طالب متأخر)

### الوصف
إضافة رسم إضافي واحد للحملات يتغير اسمه تلقائياً حسب حالة الطالب:
- **رسوم طالب متأخر:** إذا كان التسجيل بعد انتهاء فترة التسجيل المبكر (بغض النظر هل الطالب جديد أو قديم)
- **رسوم طالب جديد:** إذا كان الطالب يسجل أول مرة في النظام (ولا ينطبق عليه الشرط أعلاه)
- **لا توجد رسوم:** إذا لم ينطبق أي من الشرطين

### التغييرات

#### قاعدة البيانات
- **Campaign:** إضافة `enableExtraRegistrationFee` (Boolean) و `extraRegistrationFee` (Decimal default 2000)
- **CampaignEnrollment:** إضافة `extraFeeType` (String? — `NEW_STUDENT` أو `LATE_REGISTRATION`) و `extraFeeAmount` (Decimal?)

#### الخدمة المركزية (جديد)
- إنشاء `backend/src/services/campaignService.js` مع دوال:
  - `computeExtraRegistrationFee(campaign, studentId)` — تحسب نوع الرسم الإضافي وقيمته
  - `isLateRegistration(campaign)` — تتحقق إذا انتهت فترة التسجيل المبكر
  - `isNewStudent(studentId)` — تتحقق إذا الطالب ليس لديه أي اشتراك سابق

#### واجهة الأدمن — إدارة الحملات (`Campaigns.jsx`)
- قسم جديد "الرسوم الإضافية" بعد الخصم المبكر
- Checkbox "تفعيل الرسوم الإضافية" + حقل قيمة الرسوم (افتراضي 2000 ريال)
- القيمة قابلة للتعديل وتعطيل كامل

#### واجهة الأدمن — الموافقات (`Approvals.jsx`)
- إظهار نوع الرسم الإضافي (طالب جديد / طالب متأخر) وقيمته في عمود التسعير

#### واجهة الطالب — الاشتراكات (`Subscriptions.jsx`)
- إضافة `getExtraFeeInfo()` و `isNewStudent()` و `isLateRegistration()` — حساب الرسم في الواجهة
- إظهار بند "رسوم طالب جديد" أو "رسوم طالب متأخر" مع القيمة في كرت الحملة
- إرسال `extraFeeType` و `extraFeeAmount` مع بيانات السلة

#### نقاط API
- **campaigns.js:** POST/PUT تقبل `enableExtraRegistrationFee` و `extraRegistrationFee`
- **enrollments.js:** POST تحسب الرسم عبر `computeExtraRegistrationFee()` وتخزنه مع التسجيل
- **enrollments.js:** PATCH approve تضيف معلومات الرسم إلى ملاحظات الاشتراك
- **cartApprovals.js:** تخزين `extraFeeType` و `extraFeeAmount` في `notes` عند الموافقة

### اختبارات التحقق
- اختبار 1: طالب جديد + تسجيل قبل انتهاء التسجيل المبكر → رسوم طالب جديد
- اختبار 2: طالب قديم + قبل انتهاء التسجيل المبكر → لا توجد رسوم
- اختبار 3: طالب جديد + بعد انتهاء التسجيل المبكر → رسوم طالب متأخر
- اختبار 4: طالب قديم + بعد انتهاء التسجيل المبكر → رسوم طالب متأخر
- اختبار 5: إلغاء تفعيل الرسوم الإضافية → لا تظهر أي رسوم
- اختبار 6: تغيير القيمة إلى 3500 → تستخدم القيمة الجديدة فوراً

**ملاحظة:** تم إصلاح duplicate `discountExpiry` في Prisma schema (كان موجوداً مرتين).

---

## 2026-07-08 — توحيد نظام السلة + تفاصيل بطاقات الموافقات + تبسيط تفعيل الحملات

### الوصف
توسعة نظام السلة ليشمل الاشتراكات اليومية (بدلاً من الإرسال المباشر)، إضافة بطاقات تفصيلية لعناصر السلة في صفحة الموافقات، تبسيط إضافة الحملات إلى السلة (نقرة واحدة بدلاً من خطوتين)، إصلاح أعطال السلة، وتنظيف المسارات القديمة.

### التغييرات

#### توحيد الاشتراكات عبر السلة
- **`backend/src/routes/cart.js`:** إزالة الحظر الذي كان يمنع العناصر اليومية (DAILY) من الدخول إلى السلة
- **`src/pages/student/Subscriptions.jsx`:** استبدال `handleSubmitDailyRequest` بـ `handleAddDailyToCart` — الاشتراكات اليومية تذهب إلى السلة أولاً
- إزالة `dailyReceipt` state وإيصال التحميل من التبويب اليومي
- إزالة استدعاء `subscriptionRequest` API المباشر من التبويب اليومي
- **`backend/src/routes/cartApprovals.js` GET:** تقسيم العربات المعلقة إلى `dailyCarts` و `weeklyCarts` و `mixedCarts`
- **`src/pages/admin/Approvals.jsx`:** استبدال قسم "طلبات السلة" الواحد بثلاثة `CartSection` مستقلة (يومي / أسبوعي / مختلط)
- تخزين `computedDates` (نصوص ISO) في `data` لعناصر السلة اليومية — لقطة زمنية ثابتة للمواعيد عند الموافقة
- استخدام `computedDates` المخزنة في الموافقات مع fallback إلى `resolveDailyExecutionDates()` للعربات القديمة

#### إيقاف المسار القديم
- **`backend/src/routes/studentPortal.js`:** `POST /subscription-request` يُرجع خطأ 400 (تم إيقاف هذا المسار) مع توجيه إلى السلة
- نقل الكود الأصلي إلى `/subscription-request-legacy` للتوافق الرجعي فقط

#### تبسيط تفعيل الحملات (نقرة واحدة)
- **`src/pages/student/Subscriptions.jsx`:**
  - إزالة `if (!student?.id) return` — كان يمنع إضافة الحملات صامتاً عندما لا يكون الطالب جاهزاً
  - تغيير زر "إضافة إلى السلة" الأولي من تدفق خطوتين (نموذج → زر "إلغاء") إلى نقرة واحدة (استدعاء `handleAddCampaignToCart` المباشر، مثل اليومي)
  - الاحتفاظ بنموذج الخطوتين فقط لحالة إعادة المحاولة بعد الرفض
  - إضافة رسائل نجاح/خطأ في منطقة كرت الحملة الأولي
- تخزين `startDate` و `endDate` (نصوص ISO) في `itemData` لعناصر الحملة — للعرض فقط في لوحة الأدمن

#### بطاقات تفصيلية لعناصر السلة في الموافقات
- **`src/pages/admin/Approvals.jsx`:** مكون `CartItemDetail` جديد مع عرض حسب النوع:
  - **DAILY:** شارة `[يومي]`، عدد الأسابيع، الأيام المختارة (أسماء عربية)، نطاق التواريخ المحسوبة + جميع التواريخ كـ chips، التسعير (القيمة + رسوم التوصيل المنزلي)، المنطقة / الوجهة
  - **THREE_WEEKS / FOUR_WEEKS:** شارة `[٣ أسابيع]`/`[٤ أسابيع]`، عنوان الحملة، لقطة start/end date، المدة، أيام التشغيل (الأحد - الخميس)، تفصيل التسعير (الأساس → الخصم → الرسوم الإضافية → التوصيل → المجموع)، المنطقة / الوجهة
- تحديث `CartCard` بشارة نوع العربة (مختلط / يومي / أسبوعي) وتاريخ التقديم + تاريخ الإيصال

#### إصلاح أعطال السلة
- **إصلاح `handleRemoveItem`:** إعادة جلب السلة كاملة عبر `api.cart.get()` بعد الحذف — لأن `res.cart` من الـ API لا تحتوي على `items` دائماً
- **حراس `cart.items`:** استخدام `(cart.items || []).length` و `(cart.items || []).map(...)` لمنع الأعطال عندما تكون `undefined`

#### توثيق الملفات المتأثرة
- `backend/src/routes/cart.js` — إزالة حظر DAILY
- `backend/src/routes/cartApprovals.js` — تقسيم العربات، تخزين `computedDates`، إضافة `student.phone`
- `backend/src/routes/studentPortal.js` — إيقاف `subscriptionRequest`
- `src/pages/student/Subscriptions.jsx` — توحيد اليومي + الحملة بنقرة واحدة
- `src/pages/admin/Approvals.jsx` — ثلاثة أقسام + `CartItemDetail` + `CartCard` محدث

### ملاحظات التوافق
- العربات القديمة (بدون `computedDates`) تستخدم fallback إلى `resolveDailyExecutionDates()` — متوافقة مع الإصدارات السابقة
- أي طلب مباشر `POST /subscription-request` يفشل مع 400 — **تغيير مكسّر للتوافق** (متعمد)
- `handleRemoveItem` يعيد جلب السلة بالكامل بعد الحذف — غير مكسّر
- واجهة الموافقات الجديدة لا تزال تحتفظ بأقسام `dailyApprovals` و `enrollments` القديمة للتوافق الرجعي

---

## قواعد التحديث المستقبلية

1. **كل تعديل** يُسجل في هذا الملف قبل أو مع تنفيذ التعديل
2. **التنسيق:** التاريخ | الميزة المضافة | الملفات الم changed (نسبي) | السبب
3. **التصنيف:** ميزة جديدة / تحسين / إصلاح خطأ / توثيق / إعادة هيكلة
4. **Backward Compatibility:** يُذكر صراحةً إذا كان التعديل مكسّراً للتوافق العكسي
5. **مرجع:** يُذكر رقم Issue أو PR إن وُجد
