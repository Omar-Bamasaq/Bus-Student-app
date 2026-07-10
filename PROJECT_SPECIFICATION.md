# PROJECT_SPECIFICATION.md — توثيق نظام تنسيقية مواصلات فلك

> **الملف المرجعي الرسمي الوحيد للمشروع.**  
> أي تعديل مستقبلي يجب أن يسبقه تحديث لهذه الوثيقة.  
> يجب الحفاظ على توافق الوثيقة مع الكود بنسبة 100%.

---

## 1. نظرة عامة

### 1.1 فكرة النظام
نظام متكامل لإدارة مواصلات الطلاب، يشمل:
- إدارة الباصات والطلاب والسائقين
- إنشاء عمليات التشغيل اليومية (Morning Operations)
- تسجيل الحضور والغياب
- إدارة رحلات العودة (Return Trips)
- نظام اشتراكات (يومي، 3 أسابيع، 4 أسابيع، شهري)
- نظام تتبع الباص المباشر بدون GPS (يعتمد على ترتيب الطلاب)
- نظام الطوارئ (أعطال، نقل طلاب، استبدال باصات)
- التحويلات المؤقتة والدائمة
- الكشوف الأسبوعية المطبوعة
- الحملات (خصومات التسجيل المبكر)
- نظام إشعارات متكامل
- نظام الإدارة المالية للطلاب (إيقاف، مهلة، تذكير، تصنيف مالي)
- ثلاث بوابات: مشرف، سائق، طالب

### 1.2 الهدف
أتمتة وإدارة جميع عمليات النقل المدرسي والجامعي، من تسجيل الطلاب وصولاً إلى إنهاء الرحلة اليومية، مع دعم كامل للحالات الخاصة والطوارئ.

### 1.3 أنواع المستخدمين

| الدور | الوصف | البوابة |
|-------|-------|---------|
| `admin` | مشرف النظام / مدير | `/admin/*` |
| `driver` | سائق الباص | `/driver/*` |
| `student` | طالب | `/student/*` |

### 1.4 تقنيات المشروع

**Frontend:**
- React 19 + Vite 8 + Tailwind CSS 4
- React Router v7 (راوتر متداخل)
- Framer Motion (أنيمشن)
- Socket.IO Client (WebSocket للتتبع المباشر)
- Lucide React (أيقونات)
- jsPDF + html2canvas (طباعة الكشوف)
- QRCode (إنشاء أكواد QR للكشوف)

**Backend:**
- Node.js + Express 4
- Prisma 6 (ORM)
- PostgreSQL
- Socket.IO (WebSocket سيرفر)
- JWT (مصادقة)
- bcryptjs (تشفير كلمات المرور)

---

## 2. هيكل النظام

### 2.1 وحدات النظام

#### Authentication
- تسجيل الدخول باسم المستخدم وكلمة المرور
- JWT (صلاحية 7 أيام)
- قفل الحساب بعد 5 محاولات فاشلة (لمدة 15 دقيقة)
- إجبار تغيير كلمة المرور (`mustChangePassword`)
- تسجيل آخر تسجيل دخول و IP
- `backend/src/services/authService.js`
- `backend/src/routes/auth.js`
- `backend/src/middleware/auth.js`

#### Admin Portal
- لوحة تحكم رئيسية (إحصائيات، مدفوعات حديثة)
- إدارة الطلاب (إضافة، تعديل، حذف)
- إدارة الباصات مع تفاصيل (سائق، حمولة)
- إدارة الاشتراكات والمدفوعات
- التسعير حسب المناطق
- الحملات (خصومات)
- الموافقات على طلبات الاشتراك
- تشغيل اليوم (إنشاء، إدارة، تعديل)
- سجل التشغيل (تاريخي)
- مركز الطوارئ (أعطال، نقل، استبدال)
- رحلات العودة (إدارة، توزيع)
- الكشوف الأسبوعية (إنشاء، طباعة، أرشيف)
- التحويلات (مؤقتة، دائمة)
- سجل الحركات (Audit)
- الإدارة المالية (إيقاف، منح مهلة، تذكير، تقارير مالية)
- إدارة المستخدمين
- الإعدادات العامة

#### Student Portal
- الصفحة الرئيسية (مرحلة الرحلة، تتبع الباص)
- الاشتراكات (طلب اشتراك جديد، عرض الاشتراكات، تبويبات: يومي/أسبوعي/أسعار/السجل)
- الإشعارات
- الإعدادات

#### Driver Portal
- لوحة التحكم (قائمة الطلاب، تسجيل الحضور، تتبع)
- رحلات العودة
- الإعدادات

#### Daily Operations
- إنشاء عمليات اليوم لكل باص
- إضافة/إزالة الطلاب من الباصات
- تعديل وقت الاستلام
- تغيير الخط (بحري/جبلي)
- نقل الطلاب بين الباصات
- إنهاء رحلة الذهاب
- `backend/src/services/operationService.js`
- `backend/src/routes/operations.js`

#### Notifications
- نظام إشعارات داخلي موحّد يعبر `notificationService.createAndBroadcast()`
- `notificationConfig.js` يحدد لكل نوع: الأولوية (INFO/WARNING/CRITICAL)، الأيقونة، والمسار المستهدف
- إشعارات لحظية عبر Socket.IO (`notification:new`, `notification:unread-count`)
- مزامعة بين الأجهزة (قراءة `notification:read`، حذف `notification:deleted`)
- Popup بسلوك مختلف حسب الأولوية (INFO 4s, WARNING 6s, CRITICAL باقٍ)
- أصوات مختلفة حسب الأولوية (`info.wav`, `warning.wav`, `emergency-alarm.wav`)
- إعادة اتصال تلقائي مع استرجاع الإشعارات الفائتة
- Pagination/Infinite Scroll (20 عنصراً)
- `backend/src/services/notificationService.js`
- `backend/src/services/socketService.js`
- `backend/src/config/notificationConfig.js`
- `src/context/NotificationContext.jsx`
- `src/components/ui/NotificationPopup.jsx`
- `src/components/ui/NotificationCenter.jsx`

#### Weekly Sheets
- إنشاء كشوف أسبوعية لكل باص
- حفظ نسخة احتياطية (snapshot) مع الترقيم
- طباعة مع QR code
- أرشيف مع بحث
- `backend/src/services/weeklySheetService.js`

#### Attendance
- تسجيل الحضور (present, absent, late)
- تسجيل جماعي
- إنهاء رحلة الذهاب للباص
- `backend/src/routes/attendance.js`

#### Return Trips
- إنشاء عملية العودة
- قائمة انتظار الطلاب
- تحميل الطلاب على باصات العودة
- إعادة الترتيب
- انطلاق الباص
- تسجيل الإنزال (dropoff)
- إكمال رحلة العودة
- `backend/src/routes/return.js`

#### Emergency System
- عرض جميع الباصات مع حالتها
- إعلان تعطل باص (`BROKEN_DOWN`)
- النقل التلقائي للطلاب لباصات أخرى
- النقل اليدوي
- استبدال الباص بالكامل
- سجل الطوارئ
- إشعارات للمشرفين والطلاب المتأثرين
- `backend/src/services/emergencyService.js`
- `backend/src/routes/emergency.js`

#### Temporary Transfers
- إنشاء تحويل مؤقت لطالب لباص آخر
- صلاحية بتاريخ بداية ونهاية
- انتهاء تلقائي (Auto-expire كل 15 دقيقة)
- إلغاء يدوي
- `backend/src/routes/tempTransfers.js`

#### Notifications
- إشعارات داخلية للمستخدمين
- أنواع: `subscription_approved`, `subscription_rejected`, `subscription_expired`, `subscription_expiring_soon`, `emergency_breakdown`, `emergency_transfer`, `tracking_next`
- قراءة / تحديد الكل كمقروء
- `backend/src/routes/notifications.js`

#### Pricing
- مناطق تسعير (PricingArea)
- أسعار حسب الخطة (MONTHLY, THREE_WEEKS, FOUR_WEEKS, DAILY)
- رسوم توصيل منزلي (قريب, متوسط, بعيد)
- نسخ التسعير بين المناطق
- `backend/src/routes/pricing.js`

#### Financial Control
- **نظام الإدارة المالية** — مستقل تماماً عن حالة الطالب الأساسية
- تحديد الحالة المالية لكل طالب ديناميكياً من 3 مصادر: `StudentFinancial` (إيقاف/مهلة)، الاشتراكات النشطة، حالة الدفع
- أربع حالات مالية: `SETTLED` (مسدد)، `OVERDUE` (متأخر)، `GRACE_PERIOD` (مهلة)، `SUSPENDED` (موقوف)
- إيقاف الطالب مالياً (يمنع من التشغيل والكشوف تماماً)
- منح مهلة سداد مع تاريخ انتهاء
- انتهاء المهلة تلقائياً كل 5 دقائق
- إرسال تذكير للطالب المتأخر
- لوحة إحصائيات مالية (عدد المسددين، المتأخرين، الموقوفين، أصحاب المهلة)
- جميع الإجراءات تُسجل في AuditLog (7 أنواع)
- التكامل مع النظام: فلترة الطلاب الموقوفين من التشغيل والكشوف، تلوين المتأخرين في الكشوف باللون الأحمر
- `backend/src/services/financialService.js`
- `backend/src/routes/financial.js`
- `src/pages/admin/FinancialControl.jsx`

#### Home Delivery
- وضع نقل الطالب: LINE (خط) أو HOME (توصيل منزلي)
- رسوم توصيل منزلي لكل خطة اشتراك
- عنوان منزلي، ملاحظات

#### Reports
- Dashboard إحصائيات
- Dashboard إيرادات شهرية
- Dashboard مدفوعات حديثة
- Dashboard تكليفات اليوم

---

## 3. قاعدة البيانات

### 3.1 قائمة الـ Enums

```
UserRole:     admin | driver | student
RecordStatus: active | inactive | suspended
AssignmentStatus: scheduled | in_progress | completed | cancelled
BusLine:      JEBALI | BAHRY
TripPeriod:   MORNING | RETURN
SubscriptionType: MONTHLY | THREE_WEEKS | FOUR_WEEKS | DAILY
PaymentStatus: paid | partial | unpaid | overdue
SubscriptionStatus: pending | active | expired | rejected | cancelled
PaymentMethod: cash | transfer | card
BusStatus:    active | maintenance | inactive
AttendanceStatus: present | absent | late
TransportMode: LINE | HOME
OperationStatus: OPEN | CLOSED
ActiveBusStatus: AVAILABLE | LOADING | DEPARTED | ARRIVED | CANCELLED | BROKEN_DOWN | REPLACED
ReturnStatus: WAITING | ASSIGNED | DEPARTED
DistanceCategory: NEAR | MEDIUM | FAR
TransferType: PERMANENT | TEMPORARY
ReceiptStatus: PENDING | APPROVED | REJECTED
CampaignStatus: ACTIVE | EXPIRED | CANCELLED
FinancialStatus: SETTLED | OVERDUE | GRACE_PERIOD | SUSPENDED
```

### 3.2 نموذج User (`users`)

| الحقل | النوع | الوصف |
|-------|------|-------|
| id | String (uuid) | المفتاح الأساسي |
| username | String (unique) | اسم المستخدم |
| password | String | كلمة المرور (bcrypt hash) |
| name | String | الاسم الكامل |
| phone | String? | رقم الهاتف |
| role | UserRole | دور المستخدم |
| status | RecordStatus | الحالة (active/inactive/suspended) |
| mustChangePassword | Boolean | إجبار تغيير كلمة المرور |
| failedAttempts | Int | عدد محاولات الدخول الفاشلة |
| lockedUntil | DateTime? | وقت انتهاء القفل |
| lastLogin | DateTime? | آخر تسجيل دخول |
| lastIp | String? | آخر عنوان IP |
| studentId | String? (unique) | رابط لجدول الطلاب (للطلاب فقط) |

**العلاقات:** buses[], operations[] (منشئ), activeBuses[] (سائق), busLoads[] (مُحمّل), approvals[], auditLogs[], weeklySheets[], notifications[], emergencyLogs[]

**مكان الاستخدام:** `authService.js`, `auth.js`, `users.js`

### 3.3 نموذج PricingArea (`pricing_areas`)

| الحقل | النوع | الوصف |
|-------|------|-------|
| id | String (uuid) | المفتاح الأساسي |
| name | String (unique) | اسم المنطقة |
| dailyPrice | Decimal? | سعر اليومي (قديم) |
| threeWeeksPrice | Decimal? | سعر 3 أسابيع (قديم) |
| fourWeeksPrice | Decimal? | سعر 4 أسابيع (قديم) |
| homeNearSurcharge | Decimal? | رسوم توصيل منزلي قريب |
| homeMediumSurcharge | Decimal? | رسوم توصيل منزلي متوسط |
| homeFarSurcharge | Decimal? | رسوم توصيل منزلي بعيد |
| isActive | Boolean | نشط/غير نشط |

**العلاقات:** enrollments[], prices[]

**مكان الاستخدام:** `pricing.js`, `Pricing.jsx`

### 3.4 نموذج Pricing (`pricing`)

| الحقل | النوع | الوصف |
|-------|------|-------|
| id | String (uuid) | المفتاح الأساسي |
| zoneId | String | رابط للمنطقة |
| plan | SubscriptionType | الخطة (MONTHLY/THREE_WEEKS/FOUR_WEEKS/DAILY) |
| price | Decimal | السعر |

**Unique:** `[zoneId, plan]`

**مكان الاستخدام:** `pricing.js`, حساب سعر الاشتراك

### 3.5 نموذج Student (`students`)

| الحقل | النوع | الوصف |
|-------|------|-------|
| id | String (uuid) | المفتاح الأساسي |
| name | String | اسم الطالب |
| phone | String? | رقم الجوال |
| whatsapp | String? | واتساب |
| parentName | String? | اسم ولي الأمر |
| parentPhone | String? | هاتف ولي الأمر |
| parentRelation | String? | صلة القرابة |
| address | String? | العنوان |
| zone | String? | المنطقة (نص حر، يطابق PricingArea.name) |
| major | String? | التخصص |
| level | String? | المستوى الدراسي |
| institutionName | String? | اسم المؤسسة التعليمية |
| offDays | Json | أيام الإجازة (مصفوفة: ["FRIDAY", ...]) |
| pickupLocation | String? | نقطة الالتقاء |
| status | RecordStatus | الحالة |
| transportMode | TransportMode | LINE أو HOME |
| homeAddress | String? | العنوان المنزلي (للتوصيل) |
| homeDeliveryFee | Decimal | رسوم التوصيل المنزلي (شامل) |
| homeDeliveryFeeDaily | Decimal? | رسوم التوصيل لليومي |
| homeDeliveryFeeThreeWeeks | Decimal? | رسوم التوصيل لـ3 أسابيع |
| homeDeliveryFeeFourWeeks | Decimal? | رسوم التوصيل لـ4 أسابيع |
| homeNotes | String? | ملاحظات التوصيل |
| homeDeliveryActive | Boolean | تفعيل التوصيل المنزلي |

**العلاقات:** user, assignments[], subscriptions[], attendances[], returnQueue[], busLoads[], busStudents[], enrollments[], transfers[], busStudentOrders[]

**مكان الاستخدام:** `students.js`, `studentService.js`, `operationService.js`, `weeklySheetService.js`, `trackingService.js`

### 3.6 نموذج Bus (`buses`)

| الحقل | النوع | الوصف |
|-------|------|-------|
| id | String (uuid) | المفتاح الأساسي |
| busNumber | String? (unique) | رقم الباص |
| plateNumber | String? (unique) | رقم اللوحة |
| capacity | Int | السعة (عدد المقاعد) |
| vehicleType | String? | نوع المركبة |
| driverName | String? | اسم السائق (قديم) |
| model | String? | الموديل |
| color | String? | اللون |
| status | BusStatus | الحالة |
| driverId | String? | رابط للسائق (User) |
| primaryPhone | String? | جوال أساسي |
| secondaryPhone | String? | جوال احتياطي |

**العلاقات:** driver (User), assignments[], attendances[], activeBuses[], templateStudents (BusStudent[]), outgoingTransfers[], incomingTransfers[], weeklySheets[], busStudentOrders[]

**مكان الاستخدام:** `buses.js`, `operationService.js`, `trackingService.js`, `emergencyService.js`

### 3.7 نموذج BusStudent (`bus_students`)

| الحقل | النوع | الوصف |
|-------|------|-------|
| id | String (uuid) | المفتاح الأساسي |
| busId | String | رابط الباص |
| studentId | String (unique) | رابط الطالب (واحد لكل طالب) |
| isActive | Boolean | نشط |
| pickupTime | String? | وقت الاستلام (مثل "06:30") |

**Unique:** `[studentId]` — كل طالب ينتمي لباص واحد فقط.

**مكان الاستخدام:** `busStudents.js`, `operationService.js` (template للطلاب الأساسيين)

### 3.8 نموذج StudentTransfer (`student_transfers`)

| الحقل | النوع | الوصف |
|-------|------|-------|
| id | String (uuid) | المفتاح الأساسي |
| studentId | String | رابط الطالب |
| fromBusId | String | الباص المصدر |
| toBusId | String | الباص الهدف |
| startDate | DateTime (Date) | تاريخ البداية |
| endDate | DateTime (Date) | تاريخ النهاية |
| type | TransferType | PERMANENT أو TEMPORARY |
| reason | String? | السبب |
| isActive | Boolean | نشط/منتهي |

**مكان الاستخدام:** `transfers.js`, `tempTransfers.js`, `operationService.js`, `weeklySheetService.js`

### 3.9 نموذج Assignment (`assignments`)

| الحقل | النوع | الوصف |
|-------|------|-------|
| id | String (uuid) | المفتاح الأساسي |
| studentId | String | رابط الطالب |
| busId | String | رابط الباص |
| date | DateTime (Date) | التاريخ |
| period | TripPeriod | MORNING أو RETURN |
| line | BusLine | JEBALI أو BAHRY |
| pickupTime | String? | وقت الاستلام |
| dropoffTime | String? | وقت الإنزال |
| status | AssignmentStatus | scheduled/in_progress/completed/cancelled |
| isGenerated | Boolean | تم إنشاؤه تلقائياً |
| sortOrder | Int | ترتيب العرض |
| notes | String? | ملاحظات |

**Unique:** `[studentId, date, period]` — طالب واحد لكل تاريخ وفترة.

**مكان الاستخدام:** `assignments.js`, `operations.js`, `operationService.js`, `emergencyService.js`, `trackingService.js`

### 3.10 نموذج DailyOperation (`daily_operations`)

| الحقل | النوع | الوصف |
|-------|------|-------|
| id | String (uuid) | المفتاح الأساسي |
| operationDate | DateTime (unique Date) | تاريخ التشغيل |
| createdById | String | منشئ العملية |
| status | OperationStatus | OPEN أو CLOSED |
| notes | String? | ملاحظات |

**العلاقات:** createdBy (User), activeBuses[], returnQueue[]

**مكان الاستخدام:** `operations.js`, `operationService.js`, `return.js`

### 3.11 نموذج ActiveBus (`active_buses`)

| الحقل | النوع | الوصف |
|-------|------|-------|
| id | String (uuid) | المفتاح الأساسي |
| operationId | String | رابط العملية |
| busId | String | رابط الباص |
| driverId | String | رابط السائق |
| line | BusLine? | الخط (لرحلات العودة) |
| capacitySnapshot | Int | سعة الباص عند الإنشاء |
| status | ActiveBusStatus | حالة الباص النشط |
| returnCompletedAt | DateTime? | وقت إكمال العودة |
| currentStudentIdx | Int | مؤشر الطالب الحالي (للتتبع) |
| skippedStudentIds | String (JSON) | قائمة IDs الطلاب المتجاوز عنهم |

**مكان الاستخدام:** `operations.js`, `return.js`, `trackingService.js`, `emergencyService.js`

### 3.12 نموذج ReturnQueue (`return_queue`)

| الحقل | النوع | الوصف |
|-------|------|-------|
| id | String (uuid) | المفتاح الأساسي |
| operationId | String | رابط العملية |
| studentId | String | رابط الطالب |
| enteredAt | DateTime | وقت الدخول |
| preferredLine | BusLine? | الخط المفضل |
| transportMode | TransportMode | LINE/HOME |
| notes | String? | ملاحظات |
| status | ReturnStatus | WAITING/ASSIGNED/DEPARTED |

**مكان الاستخدام:** `return.js`

### 6.8 العودة (`/api/return`)

| الطريقة | المسار | المدخلات | الغرض |
|---------|--------|----------|-------|
| GET | `/operation` | — | عملية العودة الحالية |
| POST | `/operation` | — | إنشاء عملية عودة |
| PATCH | `/operation/:id/close` | — | إغلاق عملية العودة |
| GET | `/queue` | — | قائمة انتظار العودة |
| POST | `/queue` | `{ studentId, notes }` | إضافة طالب للانتظار |
| DELETE | `/queue/:id` | — | إزالة من الانتظار |
| GET | `/active-buses` | — | باصات العودة النشطة |
| POST | `/active-buses` | `{ busId }` | إضافة باص للعودة |
| PATCH | `/active-buses/:id/status` | `{ status }` | تغيير حالة باص العودة |
| DELETE | `/active-buses/:id` | — | إزالة باص عودة |
| POST | `/load` | `{ activeBusId, studentId, exceptionReason }` | تحميل طالب |
| DELETE | `/load/:activeBusId/:studentId` | — | إزالة طالب من التحميل |
| POST | `/active-buses/:id/reorder` | `{ studentIds }` | إعادة ترتيب |
| POST | `/active-buses/:id/dispatch` | `{ line, studentIds }` | انطلاق باص |
| PATCH | `/load/:activeBusId/:studentId/dropoff` | — | تسجيل الإنزال |
| PATCH | `/active-buses/:id/complete` | — | إكمال العودة |
| GET | `/departed` | — | الباصات المنطلقة |

**ملاحظة:** استجابة `/queue` تعرض `student` مضمّناً مع الحقول: `phone`, `whatsapp`, `transportMode`, `homeAddress`, `pickupLocation`, `address`.

### 3.13 نموذج BusLoad (`bus_loads`)

| الحقل | النوع | الوصف |
|-------|------|-------|
| id | String (uuid) | المفتاح الأساسي |
| activeBusId | String | رابط الباص النشط |
| studentId | String | رابط الطالب |
| assignedAt | DateTime | وقت التحميل |
| assignedById | String | محمّل الباص |
| exceptionReason | String? | سبب استثنائي |
| departedAt | DateTime? | وقت الانطلاق |
| droppedOffAt | DateTime? | وقت الإنزال |
| sortOrder | Int | ترتيب |

**Unique:** `[activeBusId, studentId]`

**مكان الاستخدام:** `return.js`

### 3.14 نموذج Campaign (`campaigns`)

| الحقل | النوع | الوصف |
|-------|------|-------|
| id | String (uuid) | المفتاح الأساسي |
| name | String? | الاسم (قديم) |
| title | String | العنوان |
| description | String? | الوصف |
| type | String | نوع الحملة (مثلاً "discount", "subscription_3weeks", "subscription_4weeks") |
| startDate | DateTime (Date) | تاريخ بداية الحملة |
| endDate | DateTime (Date) | تاريخ نهاية الحملة |
| discountAmount | Decimal | قيمة الخصم |
| discountPercent | Decimal? | نسبة الخصم |
| discountExpiry | DateTime? | تاريخ انتهاء الخصم المبكر |
| hasEarlyDiscount | Boolean | يوجد خصم تسجيل مبكر |
| discountStart | DateTime? | تاريخ بداية الخصم المبكر |
| maxStudents | Int? | الحد الأقصى للطلاب |
| isActive | Boolean | نشط |
| status | CampaignStatus | ACTIVE/EXPIRED/CANCELLED |
| enableExtraRegistrationFee | Boolean | تفعيل رسوم التسجيل الإضافية |
| extraRegistrationFee | Decimal | قيمة رسوم التسجيل الإضافية (افتراضي 2000) |
| extraFeeStart | DateTime? | تاريخ بدء رسوم التسجيل الإضافية (إذا null تبدأ فور التفعيل) |

**مكان الاستخدام:** `campaigns.js`, `enrollments.js`

### 3.15 نموذج CampaignEnrollment (`campaign_enrollments`)

| الحقل | النوع | الوصف |
|-------|------|-------|
| id | String (uuid) | المفتاح الأساسي |
| campaignId | String | رابط الحملة |
| studentId | String | رابط الطالب |
| areaId | String? | رابط المنطقة |
| baseAmount | Decimal | السعر الأساسي |
| surcharge | Decimal | رسوم التوصيل المنزلي |
| discount | Decimal | الخصم |
| extraFeeType | String? | NEW_STUDENT / LATE_REGISTRATION / null |
| extraFeeAmount | Decimal? | قيمة رسم التسجيل الإضافي |
| finalAmount | Decimal | المبلغ النهائي (baseAmount - discount + surcharge + extraFeeAmount) |
| receiptImage | String? | صورة السند (base64) |
| receiptStatus | ReceiptStatus | PENDING/APPROVED/REJECTED |
| rejectionReason | String? | سبب الرفض |
| approvedById | String? | الموافق |
| approvedAt | DateTime? | وقت الموافقة |

**مكان الاستخدام:** `enrollments.js`, `approvals.js`

### 3.16 نموذج Subscription (`subscriptions`)

| الحقل | النوع | الوصف |
|-------|------|-------|
| id | String (uuid) | المفتاح الأساسي |
| studentId | String | رابط الطالب |
| type | SubscriptionType | MONTHLY/THREE_WEEKS/FOUR_WEEKS/DAILY |
| startDate | DateTime (Date) | تاريخ البداية |
| endDate | DateTime (Date) | تاريخ النهاية |
| executionDate | DateTime? (Date) | تاريخ التنفيذ (قديم) |
| amount | Decimal | المبلغ |
| paidAmount | Decimal | المبلغ المدفوع |
| paymentStatus | PaymentStatus | حالة الدفع |
| status | SubscriptionStatus | pending/active/expired/rejected/cancelled |
| homeDeliveryFee | Decimal? | رسوم التوصيل المنزلي |
| notes | String? | ملاحظات (JSON) |
| durationWeeks | Int? | مدة الاشتراك بالأسابيع (لليومي) |
| selectedDays | String? (JSON) | الأيام المختارة (لليومي) |

**العلاقات:** payments[], executionDates[]

**مكان الاستخدام:** `subscriptions.js`, `studentPortal.js`, `approvals.js`, `subscriptionService.js`, `studentService.js`

### 3.17 نموذج DailyExecutionDate (`daily_execution_dates`)

| الحقل | النوع | الوصف |
|-------|------|-------|
| id | String (uuid) | المفتاح الأساسي |
| subscriptionId | String | رابط الاشتراك |
| executionDate | DateTime (Date) | تاريخ التنفيذ |
| status | String | pending/expired/completed |

**Unique:** `[subscriptionId, executionDate]`

**مكان الاستخدام:** `subscriptionService.js`, `studentService.js` (في `canStudentOperateOnDate`)

### 3.18 نموذج Payment (`payments`)

| الحقل | النوع | الوصف |
|-------|------|-------|
| id | String (uuid) | المفتاح الأساسي |
| subscriptionId | String | رابط الاشتراك |
| amount | Decimal | المبلغ |
| date | DateTime (Date) | التاريخ |
| method | PaymentMethod | cash/transfer/card |
| reference | String? | مرجع الدفع (أو صورة السند base64) |
| notes | String? | ملاحظات |

**مكان الاستخدام:** `payments.js`

### 3.19 نموذج Attendance (`attendances`)

| الحقل | النوع | الوصف |
|-------|------|-------|
| id | String (uuid) | المفتاح الأساسي |
| studentId | String | رابط الطالب |
| busId | String | رابط الباص |
| date | DateTime (Date) | التاريخ |
| status | AttendanceStatus | present/absent/late |
| contacted | Boolean | تم الاتصال |
| contactTime | String? | وقت الاتصال |
| notes | String? | ملاحظات |

**Unique:** `[studentId, date]`

**مكان الاستخدام:** `attendance.js`, `operationStage.js`, `trackingService.js`

### 3.20 نموذج AuditLog (`audit_logs`)

| الحقل | النوع | الوصف |
|-------|------|-------|
| id | String (uuid) | المفتاح الأساسي |
| userId | String? | المستخدم |
| action | String | الإجراء |
| entityType | String | نوع الكيان |
| entityId | String? | معرف الكيان |
| oldValue | Json? | القيمة القديمة |
| newValue | Json? | القيمة الجديدة |
| reason | String? | السبب |

**مكان الاستخدام:** `audit.js`, `audit.js` (lib)

### 3.21 نموذج WeeklySheet (`weekly_sheets`)

| الحقل | النوع | الوصف |
|-------|------|-------|
| id | String (uuid) | المفتاح الأساسي |
| busId | String | رابط الباص |
| weekStart | DateTime (Date) | بداية الأسبوع |
| weekEnd | DateTime (Date) | نهاية الأسبوع |
| version | Int | رقم النسخة |
| generatedById | String | المنشئ |
| studentCount | Int | عدد الطلاب |
| notes | String? | ملاحظات |

**Unique:** `[busId, weekStart]`

**العلاقات:** students[], versions[]

**مكان الاستخدام:** `weeklySheets.js`, `weeklySheetService.js`

### 3.22 نموذج WeeklySheetStudent (`weekly_sheet_students`)

| الحقل | النوع | الوصف |
|-------|------|-------|
| id | String (uuid) | المفتاح الأساسي |
| sheetId | String | رابط الكشف |
| studentId | String | معرف الطالب |
| studentName | String | اسم الطالب |
| major | String? | التخصص |
| level | String? | المستوى |
| institutionName | String? | المؤسسة |
| pickupLocation | String? | نقطة الالتقاء |
| pickupTime | String? | وقت الاستلام |
| transportMode | TransportMode | LINE/HOME |
| sortOrder | Int | الترتيب |
| isTransfer | Boolean | تحويل مؤقت |
| transferFrom | String? | من باص |
| offDays | Json? (JSON) | أيام الإجازة |
| homeNotes | String? | ملاحظات التوصيل |
| notes | String? | ملاحظات |

### 3.23 نموذج WeeklySheetVersion (`weekly_sheet_versions`)

| الحقل | النوع | الوصف |
|-------|------|-------|
| id | String (uuid) | المفتاح الأساسي |
| sheetId | String | رابط الكشف |
| version | Int | رقم النسخة |
| generatedById | String | المنشئ |
| studentCount | Int | عدد الطلاب وقت النسخة |
| snapshot | Json? | لقطة من البيانات |
| createdAt | DateTime | وقت الإنشاء |

**Unique:** `[sheetId, version]`

### 3.28 نموذج StudentFinancial (`student_financial`)

| الحقل | النوع | الوصف |
|-------|------|-------|
| id | String (uuid) | المفتاح الأساسي |
| studentId | String (unique) | رابط الطالب (واحد لكل طالب) |
| isSuspended | Boolean | هل الطالب موقوف مالياً؟ |
| suspendedAt | DateTime? | وقت الإيقاف |
| suspendedById | String? | رابط المستخدم الذي قام بالإيقاف |
| suspensionReason | String? | سبب الإيقاف |
| reactivatedAt | DateTime? | وقت إعادة التفعيل |
| gracePeriodEnd | DateTime? (Date) | تاريخ انتهاء المهلة |
| graceReason | String? | سبب المهلة |
| lastReminderSentAt | DateTime? | تاريخ آخر تذكير أُرسل |
| reminderCount | Int | عدد التذكيرات المُرسلة (default 0) |

**العلاقات:**
- `student` ← `Student` (1:1، كل طالب له سجل مالي واحد)
- `suspendedBy` ← `User` (جهة الإيقاف، باسم "FinancialSuspender")

**فريد:** `studentId` — طالب واحد لكل سجل مالي.

**مكان الاستخدام:** `financialService.js`، `operationService.js` (استبعاد الموقوفين)، `weeklySheetService.js` (استبعاد الموقوفين + تلوين المتأخرين)

**ملاحظة:** هذا الجدول وليد نظام الإدارة المالية الجديد (يوليو 2026). الحالة المالية لا تُحسب من هذا الجدول وحده بل من 3 مصادر:
1. **`StudentFinancial.isSuspended`** — يحدد إذا كان الطالب موقوفاً (SUSPENDED)
2. **`StudentFinancial.gracePeriodEnd`** — إذا كان أكبر من اليوم → المهلة (GRACE_PERIOD)
3. **الاشتراكات النشطة (`Subscription`)** — أحدث اشتراك نشط للطالب: إذا `endDate < today` → OVERDUE، وإلا → SETTLED

### 3.24 نموذج BusStudentOrder (`bus_student_orders`)

| الحقل | النوع | الوصف |
|-------|------|-------|
| id | String (uuid) | المفتاح الأساسي |
| busId | String | رابط الباص |
| studentId | String | رابط الطالب |
| sortOrder | Int | ترتيب الطالب |
| isTemporary | Boolean | ترتيب مؤقت |
| date | DateTime (Date) | تاريخ الترتيب |

**مكان الاستخدام:** `busStudentOrder.js`

### 3.25 نموذج Notification (`notifications`)

| الحقل | النوع | الوصف |
|-------|------|-------|
| id | String (uuid) | المفتاح الأساسي |
| userId | String | المستلم |
| type | String | نوع الإشعار (مطابق لمفتاح في `NOTIFICATION_CONFIG`) |
| title | String | العنوان |
| message | String | الرسالة |
| data | Json? | بيانات إضافية (يتضمن `icon` تلقائياً من `notificationConfig`) |
| priority | String `INFO\|WARNING\|CRITICAL` | الأولوية (تُحتسب تلقائياً من `notificationConfig`) |
| targetRoute | String? | المسار عند النقر على الإشعار (من `notificationConfig`) |
| dedupKey | String? | مفتاح لمنع التكرار خلال 30 ثانية |
| isRead | Boolean | مقروء |
| createdAt | DateTime | وقت الإنشاء |

**مكان الاستخدام:** `notificationService.js`, `socketService.js`, `notificationConfig.js`, `NotificationContext.jsx`, `NotificationPopup.jsx`, `NotificationCenter.jsx`, `subscriptionService.js`, `emergencyService.js`, `trackingService.js`, `financialService.js`

### 3.26 نموذج MessageTemplate (`message_templates`)

| الحقل | النوع | الوصف |
|-------|------|-------|
| id | String (uuid) | المفتاح الأساسي |
| key | String (unique) | المفتاح |
| name | String | الاسم |
| message | String | القالب |
| isActive | Boolean | نشط |

**مكان الاستخدام:** `messageTemplates.js`

### 3.27 نموذج EmergencyLog (`emergency_logs`)

| الحقل | النوع | الوصف |
|-------|------|-------|
| id | String (uuid) | المفتاح الأساسي |
| busId | String | الباص المتعطل |
| busNumber | String? | رقم الباص |
| action | String | الإجراء (DECLARE_BREAKDOWN, AUTO_TRANSFER, MANUAL_TRANSFER, REPLACEMENT, CANCEL_EMERGENCY) |
| reason | String? | السبب (MECHANICAL, ACCIDENT, DRIVER_ABSENT, OTHER) |
| details | Json? | تفاصيل إضافية |
| performedById | String | المنفذ |
| createdAt | DateTime | وقت الإنشاء |

**مكان الاستخدام:** `emergencyService.js`, `emergency.js`

---

## 4. قواعد العمل (Business Rules)

### 4.1 متى يظهر الطالب في التشغيل اليومي؟

تتحقق الدالة `canStudentOperateOnDate(studentId, date)` في `studentService.js`:
1. **التحقق من DailyExecutionDate:** إذا كان للطالب اشتراك يومي نشط مع `DailyExecutionDate` يطابق التاريخ → `true`
2. **التحقق من الاشتراك اليومي القديم:** إذا كان للطالب اشتراك يومي نشط و `executionDate` يطابق التاريخ → `true`. إذا لم يكن `executionDate` محدداً (قديم)، يتحقق من `startDate` و `endDate` فقط → `true`
3. **الجمعة:** إذا كان اليوم هو الجمعة (`FRIDAY`) → `false`
4. **OFF Days:** إذا كان الطالب لديه `offDays` (JSON Array) تحتوي على اسم اليوم → `false`
5. **خلاف ذلك:** → `true`

### 4.2 كيف يعمل OFF DAYS؟

- حقل `offDays` في Student هو JSON Array: `["FRIDAY", "SATURDAY"]`
- تتحقق `canStudentOperateOnDate` من هذا الحقل قبل السماح بالتشغيل
- إذا كان اليوم في `offDays`، لا يظهر الطالب في التشغيل ولا في الكشوف الأسبوعية

### 4.3 كيف يعمل الاشتراك اليومي؟

- المستخدم يختار أيام (سبت-خميس) ومدة (1-4 أسابيع) وخيار البدء من هذا الأسبوع أو القادم
- الدالة `generateExecutionDates()` في `subscriptionService.js` تُنشئ قائمة تواريخ فعلية
- تُحفظ التواريخ كسجلات `DailyExecutionDate` مرتبطة بالاشتراك
- `canStudentOperateOnDate` تتحقق من هذه التواريخ أولاً
- عند الموافقة على الاشتراك، يُحول `startDate` و `endDate` من أول وآخر تاريخ تنفيذ
- التوافق العكسي: الاشتراكات القديمة التي ليس لها `DailyExecutionDate` تستمر بالعمل

### 4.4 متى يحق للطالب طلب العودة؟

- لا يوجد شرط محدد في الكود — الطالب يمكنه الانضمام لقائمة انتظار العودة عبر `/return-queue/join` في `studentPortal.js`
- يحق للطالب المغادر (تم تسجيل حضوره ورحلته الصباحية) طلب العودة

### 4.5 كيف تعمل الموافقات؟

1. يرسل الطالب طلب اشتراك (مع سند التحويل)
2. يظهر الطلب في `/approvals` للأدمن
3. للأدمن خياران: **قبول** أو **رفض** (مع سبب)
4. عند القبول:
   - للاشتراكات اليومية: يتم تفعيل الاشتراك، وإذا كان اليوم ضمن التواريخ، يُعرض خيار إضافة الطالب للتشغيل فوراً
   - للحملات: يتم قبول التسجيل في الحملة
5. يتم إرسال إشعار للطالب بنتيجة الطلب

### 4.6 كيف يتم إنشاء التشغيل اليومي؟

`generateTodayOperations(userId, busIds)` في `operationService.js`:
1. يبحث عن `DailyOperation` لليوم — إن لم يوجد، يُنشئه
2. يتحقق من عدم وجود عمليات مولّدة مسبقاً
3. يجلب الباصات المختارة مع طلابها الأساسيين (BusStudent) وتحويلاتها
4. لكل طالب:
   - إذا كان لديه تحويل خارجي (outgoing transfer) → يُتخطى
   - إذا كان `canStudentOperateOnDate` → `false` → يُتخطى
   - يُنشئ Assignment جديد
5. للتحويلات الواردة (incoming transfers) → يُنشئ Assignment دون pickupTime
6. يُنشئ ActiveBus لكل باص للسائق (لرحلات العودة)

### 4.7 كيف يعمل النقل المؤقت (Temporary Transfer)؟

- `type: TEMPORARY` في StudentTransfer
- له `startDate` و `endDate`
- أثناء إنشاء التشغيل: طلاب التحويل الخارجي لا يُضافون لباصهم الأصلي، والتحويل الوارد يُضاف للباص الجديد
- انتهاء تلقائي: كل 15 دقيقة يجري `updateMany` لإنهاء التحويلات المنتهية (`endDate < today`)
- يمكن للمشرف إلغاء التحويل يدوياً

### 4.8 كيف تعمل الطوارئ؟

**نظام كامل في `emergencyService.js` يتضمن 6 دوال:**

1. **`getEmergencyBuses()`** — يعرض كل باص في تشغيل اليوم مع حالته وطلابه
2. **`declareBreakdown(busId, userId, reason)`** — يُغير حالة ActiveBus إلى `BROKEN_DOWN`، يُسجل في EmergencyLog، يُرسل إشعارات للمشرفين
3. **`autoTransferStudents(fromBusId, toBusIds, userId, reason)`** — يوزع الطلاب تلقائياً على الباصات المتاحة حسب السعة المتبقية، يحذف الـ Assignments القديمة ويُنشئ جديدة
4. **`manualTransferStudents(fromBusId, transfers, userId, reason)`** — ينقل طلاب محددين إلى باصات معينة
5. **`replaceBus(fromBusId, toBusId, userId, reason)`** — ينقل جميع الطلاب من باص لآخر، يُغير حالة الباص القديم إلى `REPLACED`
6. **`getEmergencyLogs()`** — يعرض سجل الطوارئ

**حالات ActiveBus:** AVAILABLE → LOADING → DEPARTED → ARRIVED (للرحلة الصباحية)، أو BROKEN_DOWN → REPLACED (للطوارئ)

### 4.9 كيف يعمل التتبع المباشر (بدون GPS)؟

`trackingService.js`:
- يحسب حالة كل طالب ديناميكياً من Attendance + `skippedStudentIds` المخزنة في ActiveBus
- ترتيب الحالات: PICKED_UP (تم الاستلام) ← CURRENT (الحالي) ← PENDING (قادم) ← SKIPPED (متجاوز عنه) ← ABSENT (غائب)
- `currentStudentIdx` في ActiveBus يُستخدم لتحديد الطالب الحالي
- زر Skip في لوحة السائق يضيف الطالب إلى `skippedStudentIds`
- عند تسجيل الحضور، تُستدعى `advanceTrackingAfterAttendance()` للبث الفوري عبر WebSocket
- يُبث التحديث عبر Socket.IO في غرفة `bus:{activeBusId}`
- إشعارات: "أنت التالي" و "الباص وصل إلى نقطة الاستلام" تُرسل مرة واحدة فقط لليوم

### 4.10 اكتمال رحلة الذهاب

- يمكن للسائق إنهاء رحلة الذهاب للباص عبر POST `/attendance/complete-morning/:busId` أو المشرف عبر POST `/operations/today/bus/:busId/complete-morning`
- كلاهما يستدعي `completeMorningTrip(busId)` في `trackingService.js` — النقطة الوحيدة لإنهاء الرحلة
- `completeMorningTrip()`:
  1. يحول جميع الطلاب بدون حالة حضور إلى `absent`
  2. يُغير حالة ActiveBus إلى `ARRIVED`
  3. يُحدّث جميع Assignments للباص إلى `completed` عبر `updateAssignmentsStatusByBus()`
  4. يستدعي `broadcastTrackingUpdate()` لبث الحالة الجديدة عبر Socket.IO لكل العملاء

### 4.11 دورة حياة حالة الرحلة (Trip Status Lifecycle)

حالة الرحلة تُحتسب من `ActiveBus.status` وهي المصدر الوحيد للحقيقة (SSOT):

| الحدث | المسار | ActiveBus.status | عرض الواجهات |
|---|---|---|---|
| إنشاء التشغيل اليومي | `generateTodayOperations()` | `AVAILABLE` | مجدولة |
| ضغط السائق "بدء الرحلة" | `POST /attendance/start-morning/:busId` ← `startMorningTrip()` | `DEPARTED` | قيد التنفيذ |
| إنهاء الرحلة | `completeMorningTrip()` | `ARRIVED` | مكتملة |
| إلغاء الرحلة | `POST /operations/today/bus/:busId/cancel` ← `cancelMorningTrip()` | `CANCELLED` | ملغية |

**قواعد صارمة:**
- لا يُسمح لأي واجهة بتعديل حالة الرحلة يدوياً (لا قائمة منسدلة ولا إدخال نصي)
- `startMorningTrip()` متاح للسائق فقط عبر `/attendance/start-morning/:busId`
- `cancelMorningTrip()` متاح للمشرف فقط عبر `/operations/today/bus/:busId/cancel` مع نافذة تأكيد
- جميع التغييرات تُبث فوراً عبر Socket.IO عبر `broadcastTrackingUpdate()`
- `updateAssignmentsStatusByBus(busId, status)` في `operationService.js` تُحدّث جميع Assignments تلقائياً تبعاً لحالة الباص

### 4.12 كيف تعمل الكشوف الأسبوعية؟

`generateWeeklySheets(weekStart, userId)` في `weeklySheetService.js`:
1. يجلب كل الباصات النشطة مع طلابها وتحويلاتها
2. لكل باص: ينشئ صفوف طلاب (أساسيون + تحويلات واردة)
3. لكل طالب، يحسب `canStudentOperateOnDate` لكل يوم من أيام الأسبوع
4. يستبعد الطلاب الموقوفين مالياً (SUSPENDED) ويحسب الحالة المالية لباقي الطلاب
5. يحفظ الكشف مع نسخة احتياطية (snapshot) وترقيم
6. إذا كان الكشف موجوداً مسبقاً، ينشئ نسخة جديدة (version +1) ويحفظ القديم كـ snapshot

### 4.13 كيف تُحدد الحالة المالية للطالب؟

`computeFinancialStatus(studentId, checkDate)` في `financialService.js` — مصدر الحقيقة الوحيد:

1. **SUSPENDED:** إذا كان `StudentFinancial.isSuspended === true` ← `{ status: 'SUSPENDED' }`
2. **GRACE_PERIOD:** إذا كان `StudentFinancial.gracePeriodEnd >= checkDate` ← `{ status: 'GRACE_PERIOD', graceEnd }`
3. **SETTLED/OVERDUE:** يبحث عن أحدث اشتراك نشط:
   - إذا وجد اشتراكاً نشطاً
     - `endDate >= checkDate` ← `{ status: 'SETTLED', delayDays: 0 }`
     - `endDate < checkDate` ← `{ status: 'OVERDUE', delayDays }`
   - إذا لم يجد اشتراكاً نشطاً ← `{ status: 'OVERDUE', delayDays: 0 }`

### 4.14 متى يصبح الطالب متأخراً (OVERDUE)؟
- عندما ينتهي آخر اشتراك نشط له (`Subscription.endDate < today`)
- عندما لا يكون له أي اشتراك نشط أصلاً
- التأخير لا يمنع التشغيل — يظهر مع شارة "متأخر" فقط
- في الكشوف الأسبوعية: الصف بأكمله يُلون بالأحمر

### 4.15 متى يصبح ضمن المهلة (GRACE_PERIOD)؟
- عندما يمنحه المشرف مهلة عبر POST `/api/financial/students/:studentId/grace-period`
- شرط المنح: الطالب غير موقوف وغير حاصل على مهلة مسبقاً
- المهلة لها تاريخ انتهاء — الطالب يظهر طبيعياً مع شارة "مهلة" (برتقالي)
- يمكن للمشرف إلغاء المهلة يدوياً

### 4.16 متى يصبح الطالب موقوفاً (SUSPENDED)؟
- عندما يقوم المشرف بإيقافه عبر POST `/api/financial/students/:studentId/suspend`
- الإيقاف المالي مستقل تماماً عن `Student.status`
- الموقوف مالياً:
  - **لا يظهر** في التشغيل اليومي (`generateTodayOperations` يستبعدهم)
  - **لا يظهر** في الكشوف الأسبوعية (`generateWeeklySheets` يستبعدهم)
  - **لا يمكن إضافته** يدوياً (`addStudentToOperation` يمنعهم)
- إعادة التفعيل عبر POST `/api/financial/students/:studentId/reactivate`

### 4.17 كيف تنتهي المهلة تلقائياً؟
- `autoExpireGracePeriods()` تعمل كل 5 دقائق
- تبحث عن `gracePeriodEnd < today` وتُفرغ الحقلين
- تُسجل `FINANCIAL_GRACE_EXPIRED` في AuditLog
- بعد انتهاء المهلة، يعود التقييم الطبيعي

### 4.18 كيف يعمل التذكير؟
- المشرف يرسل تذكيراً عبر POST `/api/financial/students/:studentId/send-reminder`
- يُسجل `lastReminderSentAt` ويزيد `reminderCount`
- حالياً التذكير مجرد تسجيل في AuditLog (نواة لإشعار مستقبلي)

### 4.19 كيف يؤثر الإيقاف المالي على التشغيل والكشوف؟
- **`operationService.js`:**
  - `generateTodayOperations()`: تستدعي `getStudentIdsToExclude()`، تتخطى كل موقوف
  - `addStudentToOperation()`: تتحقق من `excludedIds` وترفض الموقوف
  - `getBusOperationDetail()`: تُرجع `financialStatus` لكل طالب
- **`weeklySheetService.js`:**
  - `generateWeeklySheets()`: تستدعي `getStudentIdsToExclude()`، تتخطى الموقوفين
  - تخزن `notes: JSON.stringify({ financialStatus: 'OVERDUE' })` للمتأخرين
  - `WeeklySheetPrint.jsx`: تقرأ `notes` وتُلوّن الصف بالأحمر
- **التأثير المتسلسل:** إلغاء إيقاف طالب ← يعود للتشغيل والكشوف تلقائياً

---

## 5. Workflow — رحلة كاملة في النظام

### 5.1 طالب جديد → إنشاء حساب
1. المشرف يضيف طالباً جديداً في `/admin/students`
2. النظام ينشئ حساب User تلقائياً (username: `الاسم.الاسم` + رقم تسلسلي، password: رقم الجوال)

### 5.2 إضافة طالب لباص
1. المشرف يضيف الطالب لباص عبر `/admin/buses/:id`
2. يُنشئ BusStudent (ربط طالب بباص)

### 5.3 اختيار الاشتراك
1. الطالب يسجل الدخول
2. يذهب إلى `/student/subscriptions`
3. يختار نوع الاشتراك عبر التبويبات:
   - **اليومي:** يختار الأيام والمدة (1-4 أسابيع) ويرفع السند
   - **الأسبوعي:** يعرض اشتراكاته الأسبوعية النشطة أو السابقة
   - **الأسعار:** يعرض أسعار الاشتراكات حسب المنطقة مرتبة تنازلياً حسب سعر 4 أسابيع، مع تمييز منطقة الطالب الحالية
   - **السجل:** يعرض سجل الاشتراكات السابقة
   - **حملة 3/4 أسابيع:** يختار الحملة ويرفع السند

### 5.4 رفع السند → موافقة المشرف
1. الطالب يرفع صورة سند التحويل
2. يظهر الطلب في `/admin/finance/approvals`
3. المشرف يعاين السند ويقبل أو يرفض (مع سبب)
4. يُرسل إشعار للطالب

### 5.5 إنشاء التشغيل اليومي
1. المشرف يذهب إلى `/admin/operations/today`
2. يختار الباصات وينقر "إنشاء التشغيل"
3. النظام يُنشئ Assignments لكل طالب مؤهل
4. النظام يُنشئ ActiveBuses لكل باص

### 5.6 يوم التشغيل — الحضور
1. السائق يسجل الدخول إلى `/driver`
2. يفتح لوحة التحكم، يرى قائمة الطلاب
3. يسجل حضور كل طالب (present/absent/late)
4. النظام يُحدّث التتبع المباشر ويُبث عبر WebSocket

### 5.7 التتبع المباشر
1. الطلاب في `/student` يرون حالتهم (الطلاب بالألوان)
2. السائق يرى الطالب الحالي ويمكنه Skip
3. المشرف يرى كارت تقدم الرحلة في `/admin/operations/today/bus/:id`
4. يُبث التحديث فورياً عند كل تغيير

### 5.8 اكتمال رحلة الذهاب
1. السائق يضغط "إنهاء الرحلة" أو المشرف ينهيها
2. كل الطلاب غير المسجلين يُسجلون كـ absent
3. ActiveBus ← ARRIVED

### 5.9 طلب العودة
1. الطالب يضغط "طلب العودة" في `/student`
2. يُضاف إلى ReturnQueue

### 5.10 تشغيل العودة
1. المشرف يوزع الطلاب على باصات العودة في `/admin/operations/return`
2. يحدد لكل باص خطه (بحري/جبلي)
3. يُرسل الباص للانطلاق
4. السائق يُسجل الإنزال

### 5.11 انتهاء اليوم
1. المشرف يُغلق عملية العودة
2. يُغلق DailyOperation

### 5.12 انتهاء الاشتراك → مراقبة الحالة المالية
1. المشرف يتابع الحالة المالية للطلاب في `/admin/financial-control`
2. النظام يُظهر إحصائيات: عدد المسددين، المتأخرين، الموقوفين، أصحاب المهلة
3. المشرف يُصفّي حسب الحالة المالية (الكل / مسدد / متأخر / موقوف / مهلة)

### 5.13 التعامل مع الطالب المتأخر
1. المشرف يرى الطلاب المتأخرين (OVERDUE) في الجدول مع عدد أيام التأخير
2. خيارات المشرف:
   - **إرسال تذكير** ← يُسجل `lastReminderSentAt` ويزيد `reminderCount`
   - **منح مهلة** ← يحدد تاريخ انتهاء المهلة وسببها ← الطالب يبقى في التشغيل
   - **إيقاف مالي** ← يكتب سبب الإيقاف ← الطالب يُستبعد من التشغيل والكشوف

### 5.14 منح مهلة → انتهاء المهلة
1. المشرف يمنح مهلة للطالب المتأخر
2. الطالب يظهر مع شارة "مهلة" برتقالية في التشغيل
3. المهلة تنتهي تلقائياً بعد تاريخ الانتهاء (فحص كل 5 دقائق)
4. بعد انتهاء المهلة، يعود الطالب لحالة OVERDUE تلقائياً

### 5.15 إيقاف طالب → إعادة التفعيل
1. المشرف يوقف طالباً مالياً مع سبب الإيقاف
2. الطالب يُستبعد فوراً من:
   - التشغيل اليومي الحالي والمستقبلي
   - الكشوف الأسبوعية
3. عند سداد الطالب، المشرف يُعيد تفعيله
4. الطالب يعود للتشغيل والكشوف في اليوم التالي

---

## 6. جميع APIs

### 6.1 Authentication (`/api/auth`)

| الطريقة | المسار | المدخلات | المخرجات | الغرض |
|---------|--------|----------|----------|-------|
| POST | `/login` | `{ username, password }` | `{ token, user }` | تسجيل الدخول |
| POST | `/change-password` | `{ currentPassword, newPassword }` | `{ message }` | تغيير كلمة المرور |
| GET | `/me` | — | `{ user }` | معلومات المستخدم الحالي |

### 6.2 الطلاب (`/api/students`)

| الطريقة | المسار | المدخلات | الغرض |
|---------|--------|----------|-------|
| GET | `/` | params (search, zone, status) | قائمة الطلاب |
| GET | `/:id` | — | تفاصيل طالب |
| POST | `/` | بيانات الطالب | إضافة طالب |
| PUT | `/:id` | بيانات التحديث | تعديل طالب |
| DELETE | `/:id` | — | حذف طالب |

### 6.3 الباصات (`/api/buses`)

| الطريقة | المسار | المدخلات | الغرض |
|---------|--------|----------|-------|
| GET | `/` | params (status, search) | قائمة الباصات |
| GET | `/:id` | — | تفاصيل باص (مع السائق والطلاب) |
| POST | `/` | بيانات الباص | إضافة باص |
| PUT | `/:id` | بيانات التحديث | تعديل باص |
| DELETE | `/:id` | — | حذف باص |

### 6.4 طلاب الباص (`/api/bus-students`)

| الطريقة | المسار | المدخلات | الغرض |
|---------|--------|----------|-------|
| GET | `/all` | — | كل طلاب الباصات |
| GET | `/bus/:busId` | — | طلاب باص معين |
| POST | `/` | `{ busId, studentId, pickupTime }` | إضافة طالب لباص |
| PUT | `/:busId/:studentId` | `{ pickupTime, isActive }` | تعديل |
| DELETE | `/:busId/:studentId` | — | إزالة طالب من باص |
| PATCH | `/bulk-pickup-time/:busId` | `{ adjustment, minutes }` | تعديل جماعي لوقت الاستلام |
| POST | `/transfer` | `{ studentId, fromBusId, toBusId, pickupTime }` | نقل طالب بين باصات |

### 6.5 التعيينات (`/api/assignments`)

| الطريقة | المسار | المدخلات | الغرض |
|---------|--------|----------|-------|
| GET | `/` | params (date, busId, period) | قائمة التعيينات |
| GET | `/:id` | — | تفاصيل تعيين |
| POST | `/` | بيانات التعيين | إنشاء تعيين |
| POST | `/batch` | `{ assignments[] }` | إنشاء جماعي |
| PUT | `/:id` | بيانات التحديث | تعديل |
| PATCH | `/:id/status` | `{ status }` | تغيير الحالة |
| DELETE | `/:id` | — | حذف |
| GET | `/bus/:busId/template-students` | `?date=` | طلاب القالب للباص |

### 6.6 التشغيل (`/api/operations`)

| الطريقة | المسار | المدخلات | الغرض |
|---------|--------|----------|-------|
| POST | `/generate` | `{ busIds }` | إنشاء عمليات اليوم |
| GET | `/today` | — | تشغيل اليوم مع كل الباصات |
| GET | `/today/available-buses` | — | باصات متاحة للإضافة |
| GET | `/today/bus/:busId` | — | تفاصيل باص في التشغيل |
| PATCH | `/today/bus/:busId/line` | `{ line }` | تغيير خط الباص |
| POST | `/today/bus/:busId/assignments` | `{ studentId }` | إضافة طالب لباص |
| DELETE | `/today/bus/:busId/assignments/:assignmentId` | — | إزالة طالب |
| PUT | `/today/bus/:busId/assignments/:assignmentId` | بيانات | تعديل تعيين |
| POST | `/today/add-buses` | `{ busIds }` | إضافة باصات للتشغيل |
| DELETE | `/today/bus/:busId` | — | إزالة باص من التشغيل |
| PATCH | `/today/bus/:busId/bulk-pickup-time` | `{ adjustment, minutes }` | تعديل وقت الاستلام |
| POST | `/today/bus/:busId/transfer` | `{ toBusId, studentId }` | نقل طالب بين باصات |
| POST | `/today/bus/:busId/transfer-all` | `{ toBusId }` | نقل جميع الطلاب |
| POST | `/today/bus/:busId/complete-morning` | — | إنهاء رحلة الذهاب (للمشرف) |
| POST | `/today/bus/:busId/cancel` | — | **جديد** — إلغاء رحلة الذهاب (للمشرف) مع تسجيل الغائبين |
| GET | `/history` | — | سجل التشغيل |

### 6.7 الحضور (`/api/attendance`)

| الطريقة | المسار | المدخلات | الغرض |
|---------|--------|----------|-------|
| GET | `/` | params | قائمة الحضور |
| GET | `/today/:busId` | — | حضور باص اليوم |
| GET | `/student/:studentId` | — | حضور طالب |
| POST | `/` | `{ studentId, busId, status, date }` | تسجيل حضور |
| POST | `/start-morning/:busId` | — | **جديد** — بدء رحلة الذهاب (للسائق): DEPARTED + in_progress |
| POST | `/complete-morning/:busId` | — | إنهاء رحلة الذهاب (للسائق): ARRIVED + completed |
| POST | `/batch` | `{ records[] }` | تسجيل جماعي |

### 6.8 العودة (`/api/return`)

| الطريقة | المسار | المدخلات | الغرض |
|---------|--------|----------|-------|
| GET | `/operation` | — | عملية العودة الحالية |
| POST | `/operation` | — | إنشاء عملية عودة |
| PATCH | `/operation/:id/close` | — | إغلاق عملية العودة |
| GET | `/queue` | — | قائمة انتظار العودة |
| POST | `/queue` | `{ studentId, notes }` | إضافة طالب للانتظار |
| DELETE | `/queue/:id` | — | إزالة من الانتظار |
| GET | `/active-buses` | — | باصات العودة النشطة |
| POST | `/active-buses` | `{ busId }` | إضافة باص للعودة |
| PATCH | `/active-buses/:id/status` | `{ status }` | تغيير حالة باص العودة |
| DELETE | `/active-buses/:id` | — | إزالة باص عودة |
| POST | `/load` | `{ activeBusId, studentId, exceptionReason }` | تحميل طالب |
| DELETE | `/load/:activeBusId/:studentId` | — | إزالة طالب من التحميل |
| POST | `/active-buses/:id/reorder` | `{ studentIds }` | إعادة ترتيب |
| POST | `/active-buses/:id/dispatch` | `{ line, studentIds }` | انطلاق باص |
| PATCH | `/load/:activeBusId/:studentId/dropoff` | — | تسجيل الإنزال |
| PATCH | `/active-buses/:id/complete` | — | إكمال العودة |
| GET | `/departed` | — | الباصات المنطلقة |

### 6.9 الطوارئ (`/api/emergency`)

| الطريقة | المسار | المدخلات | الغرض |
|---------|--------|----------|-------|
| GET | `/buses` | — | حالة جميع الباصات |
| POST | `/breakdown` | `{ busId, reason }` | إعلان تعطل |
| POST | `/auto-transfer` | `{ fromBusId, toBusIds, reason }` | نقل تلقائي |
| POST | `/manual-transfer` | `{ fromBusId, transfers[], reason }` | نقل يدوي |
| POST | `/replace-bus` | `{ fromBusId, toBusId, reason }` | استبدال باص |
| GET | `/logs` | — | سجل الطوارئ |

### 6.10 التتبع (`/api/tracking`)

| الطريقة | المسار | المدخلات | الغرض |
|---------|--------|----------|-------|
| GET | `/:activeBusId` | — | حالة التتبع لباص |
| POST | `/skip` | `{ activeBusId, studentId }` | تجاوز طالب |
| POST | `/unskip` | `{ activeBusId, studentId }` | إلغاء التجاوز |

### 6.11 الاشتراكات (`/api/subscriptions`)

| الطريقة | المسار | المدخلات | الغرض |
|---------|--------|----------|-------|
| GET | `/` | params | قائمة الاشتراكات |
| GET | `/:id` | — | تفاصيل اشتراك |
| POST | `/` | بيانات الاشتراك | إنشاء اشتراك |
| PUT | `/:id` | تحديث | تعديل اشتراك |
| DELETE | `/:id` | — | حذف اشتراك |

### 6.12 المدفوعات (`/api/payments`)

| الطريقة | المسار | المدخلات | الغرض |
|---------|--------|----------|-------|
| GET | `/` | params | قائمة المدفوعات |
| GET | `/:id` | — | تفاصيل دفع |
| POST | `/` | بيانات الدفع | تسجيل دفع |
| DELETE | `/:id` | — | حذف دفع |

### 6.13 التسعير (`/api/pricing`)

| الطريقة | المسار | المدخلات | الغرض |
|---------|--------|----------|-------|
| GET | `/` | — | مناطق التسعير النشطة |
| GET | `/all` | — | كل المناطق |
| GET | `/zones` | — | المناطق مع الأسعار |
| GET | `/zones/:id` | — | تفاصيل منطقة |
| POST | `/` | بيانات المنطقة | إنشاء منطقة |
| PUT | `/:id` | تحديث | تعديل منطقة |
| POST | `/copy` | `{ sourceZoneId, targetZoneId }` | نسخ تسعير |
| DELETE | `/:id` | — | حذف |

### 6.14 الحملات (`/api/campaigns`)

| الطريقة | المسار | المدخلات | الغرض |
|---------|--------|----------|-------|
| GET | `/` | — | كل الحملات |
| GET | `/active` | — | الحملات النشطة |
| POST | `/` | بيانات الحملة | إنشاء حملة |
| PUT | `/:id` | تحديث | تعديل حملة |
| DELETE | `/:id` | — | حذف حملة |

### 6.15 التسجيلات في الحملات (`/api/enrollments`)

| الطريقة | المسار | المدخلات | الغرض |
|---------|--------|----------|-------|
| GET | `/` | params | قائمة التسجيلات |
| POST | `/` | بيانات التسجيل | تسجيل طالب في حملة |
| PATCH | `/:id/approve` | — | قبول التسجيل (مع السند) |
| PATCH | `/:id/reject` | `{ reason }` | رفض التسجيل |
| DELETE | `/:id` | — | حذف تسجيل |

### 6.16 الموافقات (`/api/approvals`)

| الطريقة | المسار | المدخلات | الغرض |
|---------|--------|----------|-------|
| GET | `/` | — | قائمة بانتظار الموافقة (تسجيلات حملات + اشتراكات يومية) |
| POST | `/subscriptions/:id/approve` | — | قبول اشتراك يومي |
| POST | `/subscriptions/:id/reject` | `{ reason }` | رفض اشتراك يومي |
| POST | `/subscriptions/:id/add-now` | `{ busId }` | إضافة طالب للتشغيل فوراً |

### 6.17 البوابة الطلابية (`/api/student-portal`)

| الطريقة | المسار | المدخلات | الغرض |
|---------|--------|----------|-------|
| GET | `/dashboard` | — | لوحة الطالب (المعلومات، الرحلة الحالية) |
| GET | `/pricing` | — | الأسعار حسب المنطقة |
| POST | `/return-queue/join` | — | الانضمام لانتظار العودة |
| POST | `/notify-next` | — | إشعار السائق بالطالب التالي |
| POST | `/subscription-request` | `{ selectedDays[], durationWeeks, startNow, receiptImage }` | طلب اشتراك يومي |
| GET | `/assignments` | — | تعيينات الطالب |
| GET | `/subscriptions` | — | اشتراكات الطالب |

### 6.18 المستخدمون (`/api/users`)

| الطريقة | المسار | المدخلات | الغرض |
|---------|--------|----------|-------|
| GET | `/` | params | قائمة المستخدمين |
| GET | `/:id` | — | تفاصيل مستخدم |
| POST | `/` | بيانات المستخدم | إنشاء مستخدم |
| PUT | `/:id` | تحديث | تعديل مستخدم |
| PATCH | `/:id/status` | `{ status }` | تغيير الحالة |
| POST | `/:id/reset-password` | — | إعادة تعيين كلمة المرور |
| POST | `/:id/force-change-password` | — | إجبار تغيير كلمة المرور |
| POST | `/:id/generate-username` | — | توليد اسم مستخدم |

### 6.19 التحويلات (`/api/transfers`, `/api/temp-transfers`)

| الطريقة | المسار | المدخلات | الغرض |
|---------|--------|----------|-------|
| GET | `/transfers` | params | قائمة التحويلات |
| POST | `/transfers` | بيانات التحويل | إنشاء تحويل دائم |
| DELETE | `/transfers/:id` | — | إلغاء تحويل |
| GET | `/temp-transfers/active` | — | التحويلات المؤقتة النشطة |
| GET | `/temp-transfers/bus/:busId` | — | تحويلات باص |
| POST | `/temp-transfers` | `{ studentId, fromBusId, toBusId, durationDays }` | إنشاء تحويل مؤقت |
| DELETE | `/temp-transfers/:id` | — | إلغاء تحويل مؤقت |
| POST | `/temp-transfers/expire` | — | إنهاء المنتهية |

### 6.20 الإشعارات (`/api/notifications`)

| الطريقة | المسار | المدخلات | الغرض |
|---------|--------|----------|-------|
| GET | `/` | `filter=unread\|read`, `priority=INFO\|WARNING\|CRITICAL`, `limit`, `offset` | إشعارات المستخدم (مع Pagination) |
| GET | `/unread-count` | — | عدد الإشعارات غير المقروءة |
| PATCH | `/:id/read` | — | تحديد كمقروء (يُبث `notification:read` لكل الأجهزة) |
| PATCH | `/read-all` | — | تحديد الكل مقروء (يُبث `notification:read-all` لكل الأجهزة) |
| DELETE | `/:id` | — | حذف إشعار (يُبث `notification:deleted` لكل الأجهزة) |
| DELETE | `/` | — | حذف جميع الإشعارات (يُبث `notification:deleted-all` لكل الأجهزة) |

### 6.21 الكشوف الأسبوعية (`/api/weekly-sheets`)

| الطريقة | المسار | المدخلات | الغرض |
|---------|--------|----------|-------|
| POST | `/generate` | `{ weekStart }` | إنشاء كشوف الأسبوع |
| GET | `/week/:weekStart` | — | كشوف أسبوع |
| GET | `/:id` | — | تفاصيل كشف |
| GET | `/:id/qr` | — | QR data للكشف |
| GET | `/:id/versions` | — | نسخ الكشف |
| GET | `/archive/search` | params | بحث في الأرشيف |
| DELETE | `/:id` | — | حذف كشف |

### 6.22 أخرى

| الطريقة | المسار | المدخلات | الغرض |
|---------|--------|----------|-------|
| GET | `/dashboard/stats` | — | إحصائيات لوحة التحكم |
| GET | `/dashboard/recent-payments` | — | آخر المدفوعات |
| GET | `/audit` | params | سجل الحركات |
| GET | `/sheets/bus/:busId` | — | كشف باص |
| GET | `/message-templates` | — | قوالب الرسائل |

### 6.23 الإدارة المالية (`/api/financial`)

| الطريقة | المسار | المدخلات | المخرجات | الصلاحية |
|---------|--------|----------|----------|----------|
| GET | `/dashboard` | — | `{ settled, overdue, suspended, gracePeriod }` | admin |
| GET | `/students` | `?status=SETTLED\|OVERDUE\|SUSPENDED\|GRACE_PERIOD` | `[{ studentId, studentName, financialStatus, delayDays, institutionName, busNumber, ... }]` | admin |
| GET | `/students/:studentId` | — | تفاصيل الطالب المالية كاملة | admin |
| POST | `/students/:studentId/suspend` | `{ reason }` | `{ studentId, isSuspended, suspendedAt }` | admin |
| POST | `/students/:studentId/reactivate` | — | `{ studentId, isSuspended, reactivatedAt }` | admin |
| POST | `/students/:studentId/grace-period` | `{ endDate, reason }` | `{ studentId, gracePeriodEnd, graceReason }` | admin |
| POST | `/students/:studentId/cancel-grace-period` | — | `{ studentId, gracePeriodEnd: null }` | admin |
| POST | `/students/:studentId/send-reminder` | — | `{ studentId, lastReminderSentAt, reminderCount }` | admin |
| GET | `/excluded-ids` | — | `[studentId1, studentId2, ...]` | admin |

**أنواع AuditLog:** `FINANCIAL_SUSPEND`, `FINANCIAL_REACTIVATE`, `FINANCIAL_GRANT_GRACE`, `FINANCIAL_CANCEL_GRACE`, `FINANCIAL_SEND_REMINDER`, `FINANCIAL_GRACE_EXPIRED`

---

## 7. جميع الخدمات (Services)

### 7.1 `authService.js`
- `hashPassword(password)` — تشفير كلمة المرور (bcrypt, 10 rounds)
- `comparePassword(password, hash)` — مقارنة كلمة المرور
- `signToken(user)` — إنشاء JWT (صلاحية 7 أيام)
- `generateStudentUsername(name)` — توليد اسم مستخدم من اسم الطالب
- `generateDriverUsername(driverName, busNumber)` — توليد اسم مستخدم للسائق
- `ensureUniqueUsername(baseUsername)` — ضمان uniqueness بإضافة رقم تسلسلي
- `handleLoginAttempt(userId, success, ip)` — إدارة محاولات الدخول وقفل الحساب
- `isAccountLocked(user)` — التحقق من قفل الحساب
- `authAudit(action, userId, details)` — تسجيل في سجل الحركات

### 7.2 `operationService.js`
- `generateTodayOperations(userId, busIds)` — إنشاء عمليات اليوم مع التحقق من الصلاحية والأيام
- `getAvailableBuses()` — الباصات المتاحة للإضافة للتشغيل
- `getTodayOperation()` — تشغيل اليوم مع تفاصيل كل باص وطالب
- `getBusOperationDetail(busId)` — تفاصيل باص في التشغيل (مع حالة كل طالب)
- `updateBusLine(busId, line)` — تغيير خط الباص
- `addStudentToOperation(busId, studentId, userId)` — إضافة طالب للتشغيل
- `removeStudentFromOperation(busId, assignmentId)` — إزالة طالب
- `updateAssignment(busId, assignmentId, data)` — تعديل تعيين
- `addBusesToOperation(busIds, userId)` — إضافة باصات للتشغيل
- `removeBusFromOperation(busId, userId)` — إزالة باص
- `transferStudentBetweenBuses(fromBusId, toBusId, studentId, userId)` — نقل طالب
- `transferAllStudentsFromBus(fromBusId, toBusId, userId)` — نقل جميع الطلاب
- `getOperationHistory()` — سجل التشغيل
- `updateAssignmentsStatusByBus(busId, status)` — **جديد**: تحديث جميع Assignments لباص إلى حالة معينة (تستخدمها دوال التتبع لتحديث assignments تلقائياً)

### 7.3 `operationStage.js`
- `getStudentOperationStage(studentId)` — تحديد مرحلة الطالب:
  - `NO_TRIP` — لا توجد رحلة اليوم
  - `BEFORE_PICKUP` — قبل الاستلام
  - `PICKUP_IN_PROGRESS` — جاري الاستلام
  - `BOARDED` — تم الصعود
  - `ABSENT` — غائب
  - `MORNING_COMPLETED` — اكتملت رحلة الذهاب

### 7.4 `trackingService.js`
- `getTrackingState(activeBusId)` — حساب حالة التتبع (عند `busStatus === 'ARRIVED'` يُجبر `allDone=true` ويُصفّر `currentStudent`/`nextStudent`)
- `skipStudent(activeBusId, studentId)` — تجاوز طالب
- `unskipStudent(activeBusId, studentId)` — إلغاء التجاوز
- `advanceTrackingAfterAttendance(activeBusId, studentId)` — تقدم التتبع بعد تسجيل الحضور
- `startMorningTrip(busId)` — **جديد**: يبدأ رحلة الذهاب: يُغيّر ActiveBus إلى `DEPARTED`، يُحدّث assignments إلى `in_progress`، يبث socket
- `cancelMorningTrip(busId)` — **جديد**: يلغي رحلة الذهاب: يسجل الغائبين، يُغيّر ActiveBus إلى `CANCELLED`، يُحدّث assignments إلى `cancelled`، يبث socket
- `completeMorningTrip(busId)` — **مُحدّث**: يُنهي رحلة الذهاب: يسجل الغائبين، يُغيّر ActiveBus إلى `ARRIVED`، يُحدّث assignments إلى `completed`، يبث socket
- `checkAndSendNotifications(state, activeBusId)` — إرسال إشعارات "أنت التالي"

### 7.5 `socketService.js`
- `initSocketServer(app)` — تهيئة WebSocket مع JWT auth
- `getIO()` — الحصول على كائن Socket.IO
- `broadcastTrackingUpdate(activeBusId, data)` — بث تحديث التتبع للغرفة

### 7.6 `studentService.js`
- `canStudentOperateOnDate(studentId, checkDate)` — هل يمكن للطالب التشغيل في تاريخ معين؟
- `getStudentOffDays(studentId)` — أيام الإجازة

### 7.7 `subscriptionService.js`
- `parseSubscriptionNotes(notes)` — تحليل ملاحظات الاشتراك (JSON)
- `generateExecutionDates(selectedDays, durationWeeks, startNow, referenceDate)` — توليد تواريخ التنفيذ
- `setExecutionDates(subscriptionId, dates)` — حفظ تواريخ التنفيذ
- `getExecutionDates(subscriptionId)` — جلب تواريخ التنفيذ
- `hasDailyExecutionForDate(studentId, date)` — هل للطالب تاريخ تنفيذ؟
- `isSubscriptionActiveForDate(subscription, date)` — هل الاشتراك نشط في تاريخ؟
- `buildDailySubscriptionDateRange(selectedDays, weeks, referenceDate)` — حساب نطاق تاريخ الاشتراك اليومي
- `expireSubscriptions()` — إنهاء الاشتراكات المنتهية وإرسال إشعارات
- `hasActiveSameTypeSubscription(studentId, type)` — هل يوجد اشتراك نشط من نفس النوع؟
- `canTransitionSubscription(subscription, newStatus)` — هل يمكن تغيير الحالة؟
- `createSubscriptionNotification(userId, type, title, message, data)` — إنشاء إشعار

### 7.8 `emergencyService.js`
- `getEmergencyBuses()` — حالة جميع باصات اليوم
- `declareBreakdown(busId, userId, reason)` — إعلان تعطل
- `autoTransferStudents(fromBusId, toBusIds, userId, reason)` — نقل تلقائي
- `manualTransferStudents(fromBusId, transfers, userId, reason)` — نقل يدوي
- `replaceBus(fromBusId, toBusId, userId, reason)` — استبدال باص
- `getEmergencyLogs()` — سجل الطوارئ

### 7.9 `weeklySheetService.js`
- `generateWeeklySheets(weekStart, userId)` — إنشاء كشوف أسبوعية
- `getSheetsForWeek(weekStart)` — كشوف أسبوع
- `getSheetDetail(id)` — تفاصيل كشف
- `getSheetArchive(page, pageSize, search, busId, weekStart)` — أرشيف
- `getSheetVersionSnapshots(id)` — نسخ الكشف
- `getSheetQRData(id)` — بيانات QR

### 7.11 `financialService.js` — الخدمة المالية
- `computeFinancialStatus(studentId, date)` — **مصدر الحقيقة الوحيد**، يُرجع `{ status: FinancialStatus, activeSub, delayDays, graceEnd }`
- `getFinancialDashboard()` — إحصائيات: عدد المسددين، المتأخرين، الموقوفين، أصحاب المهلة
- `getStudentsByFinancialStatus(targetStatus, date)` — قائمة الطلاب مصفاة حسب الحالة المالية مع تفاصيل الباص والاشتراك
- `getStudentFinancialDetail(studentId, date)` — تفاصيل مالية كاملة لطالب واحد
- `suspendStudent(studentId, userId, reason)` — إيقاف طالب مع AuditLog
- `reactivateStudent(studentId, userId)` — إعادة تفعيل موقوف مع AuditLog
- `grantGracePeriod(studentId, userId, endDate, reason)` — منح مهلة مع AuditLog
- `cancelGracePeriod(studentId, userId)` — إلغاء مهلة مع AuditLog
- `sendReminder(studentId, userId)` — إرسال تذكير مع AuditLog
- `autoExpireGracePeriods()` — إنهاء المهل المنتهية تلقائياً كل 5 دقائق
- `getStudentIdsToExclude()` — قائمة IDs الطلاب الموقوفين للاستخدام في فلترة التشغيل والكشوف

### 7.10 `audit.js` (lib)
- `createAuditLog({ userId, action, entityType, entityId, oldValue, newValue, reason })` — تسجيل في AuditLog

---

## 8. صفحات الواجهة

### 8.1 بوابة المشرف (`/admin/*`)

| المسار | الصفحة | الغرض |
|--------|--------|-------|
| `/admin` | Dashboard | إحصائيات عامة (عدد الطلاب، الباصات، الإيرادات) |
| `/admin/students` | Students | إدارة الطلاب (إضافة، تعديل، حذف، بحث) |
| `/admin/buses` | Buses | إدارة الباصات مع سعة وتفاصيل |
| `/admin/buses/:id` | BusDetails | تفاصيل باص (سائق، طلاب، كشف) |
| `/admin/operations/today` | DailyOperation | تشغيل اليوم — إنشاء، إدارة باصات، إضافة/إزالة طلاب |
| `/admin/operations/history` | OperationHistory | سجل التشغيل السابق |
| `/admin/operations/return` | ReturnDispatchCenter | مركز توزيع رحلات العودة |
| `/admin/operations/departed` | DepartedTrips | الباصات المنطلقة للعودة |
| `/admin/emergency` | EmergencyCenter | مركز الطوارئ — باصات، أعطال، نقل |
| `/admin/emergency/:busId` | EmergencyBusDetail | تفاصيل باص في الطوارئ |
| `/admin/subscriptions` | SubscriptionsPage | إدارة الاشتراكات والمدفوعات والحملات |
| `/admin/finance/pricing` | AdminPricing | تسعير المناطق |
| `/admin/finance/payments` | AdminPayments | المدفوعات |
| `/admin/finance/subscriptions` | AdminSubscriptions | الاشتراكات |
| `/admin/finance/campaigns` | AdminCampaigns | الحملات |
| `/admin/finance/approvals` | AdminApprovals | الموافقات على طلبات الاشتراك |
| `/admin/reports/weekly-sheets` | AdminSheets | إنشاء وعرض الكشوف الأسبوعية |
| `/admin/reports/weekly-sheets/:id` | WeeklySheetPrint | طباعة كشف + QR |
| `/admin/reports/archive` | WeeklySheetArchive | أرشيف الكشوف |
| `/admin/manage/users` | AdminUsers | إدارة المستخدمين |
| `/admin/manage/settings` | AdminSettings | الإعدادات العامة |
| `/admin/control/transfers` | AdminTransfers | التحويلات |
| `/admin/control/audit` | AdminAudit | سجل الحركات |
| `/admin/financial-control` | FinancialControl | **جديد** — الإدارة المالية: إحصائيات (مسددون/متأخرون/موقوفون/مهلة)، تصفية حسب الحالة، جدول طلاب مع إجراءات (إيقاف، إعادة تفعيل، منح مهلة، إلغاء مهلة، إرسال تذكير) |

**الصفحات المُحدّثة (Financial Integration):**
- **Dashboard** (`/admin`): كارت "متأخرون عن السداد" مع عدد المتأخرين + تنبيه أحمر عند وجود متأخرين
- **BusOperationDetail** (`/admin/operations/today/bus/:id`): شارة "متأخر" حمراء و "مهلة" برتقالية لكل طالب (مأخوذة من `financialStatus` في API)
- **WeeklySheetPrint** (`/admin/reports/weekly-sheets/:id`): صفوف الطلاب المتأخرين (OVERDUE) بالكامل باللون الأحمر (`#dc2626`) مع خلفية `#fef2f2`

### 8.2 بوابة السائق (`/driver/*`)

| المسار | الصفحة | الغرض |
|--------|--------|-------|
| `/driver` | DriverDashboard | لوحة السائق: قائمة الطلاب، تسجيل الحضور، Skip، تتبع |
| `/driver/return` | DriverReturnTrip | رحلة العودة للسائق |
| `/driver/settings` | DriverSettings | الإعدادات |

### 8.3 بوابة الطالب (`/student/*`)

| المسار | الصفحة | الغرض |
|--------|--------|-------|
| `/student` | StudentHome | الصفحة الرئيسية: مرحلة الرحلة، تتبع الباص، قائمة ملونة |
| `/student/subscriptions` | StudentSubscriptions | الاشتراكات: اشتراك يومي (مدة+أيام)، حملات |
| `/student/notifications` | StudentNotifications | الإشعارات |
| `/student/settings` | StudentSettings | الإعدادات |

### 8.4 صفحات عامة

| المسار | الصفحة | الغرض |
|--------|--------|-------|
| `/login` | Login | تسجيل الدخول |
| `/settings/change-password` | ChangePassword | تغيير كلمة المرور (إجباري عند أول دخول) |

---

## 9. الصلاحيات

### 9.1 صلاحيات الوصول

| المسار | admin | driver | student |
|--------|-------|--------|---------|
| `/admin/*` | ✅ | ❌ | ❌ |
| `/driver/*` | ❌ | ✅ | ❌ |
| `/student/*` | ❌ | ❌ | ✅ |
| `/login` | ✅ | ✅ | ✅ |
| `/settings/change-password` | ✅ | ✅ | ✅ |
| `/api/auth/*` | ✅ | ✅ | ✅ |
| `/api/health` | ✅ | ✅ | ✅ |

### 9.2 صلاحيات API (via `authorize` middleware)

| Endpoint | الصلاحية |
|----------|---------|
| `/api/students/*` | admin |
| `/api/buses/*` | admin |
| `/api/assignments/*` | admin, driver |
| `/api/operations/*` | admin |
| `/api/approvals/*` | admin |
| `/api/users/*` | admin |
| `/api/pricing/*` | admin |
| `/api/campaigns/*` | admin |
| `/api/weekly-sheets/*` | admin |
| `/api/transfers/*` | admin |
| `/api/temp-transfers/*` | admin |
| `/api/audit/*` | admin |
| `/api/emergency/*` | admin |
| `/api/student-portal/*` | student (via `req.user.role === 'student'`) |
| `/api/dashboard/*` | admin |
| `/api/return/*` | admin, driver |
| `/api/attendance/*` | driver, admin |
| `/api/tracking/*` | admin, driver, student (يعتمد على JWT) |
| `/api/financial/*` | admin — جميع نقاط الإدارة المالية (8 endpoints) |

### 9.3 صلاحيات الإدارة المالية

| الإجراء | الصلاحية | ملاحظة |
|---------|---------|--------|
| عرض لوحة الإحصائيات المالية | admin | في `/api/financial/dashboard` |
| عرض الطلاب مع الحالة المالية | admin | في `/api/financial/students` |
| عرض تفاصيل طالب | admin | في `/api/financial/students/:id` |
| إيقاف طالب مالياً | admin | يُسجل في AuditLog |
| إعادة تفعيل طالب | admin | يُسجل في AuditLog |
| منح مهلة | admin | يُسجل في AuditLog |
| إلغاء مهلة | admin | يُسجل في AuditLog |
| إرسال تذكير | admin | يُسجل في AuditLog |

**ملاحظة:** لا توجد صلاحية "مشرف مالي" منفصلة عن "مشرف نظام" حالياً. أي مستخدم بدور `admin` يمكنه الوصول للإدارة المالية.

---

## 10. التسعير

### 10.1 نظام الأسعار الحالي

- **PricingArea:** منطقة تسعير (اسم + أسعار قديمة في الحقول المباشرة)
- **Pricing:** جدول منفصل يربط المنطقة بالخطة (plan) والسعر
- أربع خطط: `MONTHLY`, `THREE_WEEKS`, `FOUR_WEEKS`, `DAILY`
- فريد لكل منطقة وخطة: `@@unique([zoneId, plan])`

### 10.2 رسوم التوصيل المنزلي

التصنيف | الحقل | الاستخدام
--------|-------|----------
قريب (NEAR) | `homeNearSurcharge` | في PricingArea
متوسط (MEDIUM) | `homeMediumSurcharge` | في PricingArea
بعيد (FAR) | `homeFarSurcharge` | في PricingArea

- يتم تطبيق الرسوم على الطلاب الذين `homeDeliveryActive = true`
- تُضاف إلى السعر الأساسي لحساب المبلغ النهائي

### 10.3 التسعير في واجهة الطالب

- الطالب يرى الأسعار حسب منطقته (`zone` من Student)
- المناطق تُجلب من `/api/pricing/zones`
- الأسعار تُفلتر حسب `prices[].plan`

---

## 11. الحالات الخاصة

### 11.1 OFF Days
- حقل `offDays` في Student: JSON Array بأسماء الأيام (`["FRIDAY", "SATURDAY"]`)
- تمنع ظهور الطالب في التشغيل والكشوف
- الجمعة دائماً OFF (في `canStudentOperateOnDate`)

### 11.2 الاشتراك اليومي
- يمكن للطالب اختيار أيام متعددة (سبت-خميس) لفترة 1-4 أسابيع
- يُنشئ `DailyExecutionDate` لكل تاريخ
- `canStudentOperateOnDate` تتحقق من `DailyExecutionDate` أولاً
- `resolveExecutionDate()`: دالة مركزية لحساب التاريخ الفعلي مع Cutoff = 12 ظهراً — إذا اختار الطالب اليوم الحالي والوقت ≥ 12:00، يُسجل للأسبوع القادم
- `generateExecutionDates()` و `buildDailySubscriptionDateRange()` تستخدمان `resolveExecutionDate()` حصراً
- التوافق العكسي مع الاشتراكات القديمة (بدون `DailyExecutionDate`)

### 11.3 التوصيل المنزلي
- `transportMode: HOME` مع `homeDeliveryActive: true`
- عنوان منزلي منفصل (`homeAddress`)
- رسوم إضافية حسب المسافة (قريب/متوسط/بعيد)
- ملاحظات للتوصيل (`homeNotes`)

### 11.4 الطوارئ
- إعلان تعطل (BROKEN_DOWN) ← نقل تلقائي أو يدوي ← استبدال (REPLACED)
- سجل كامل في EmergencyLog
- إشعارات للمشرفين والطلاب المتأثرين

### 11.5 النقل المؤقت
- تحويل طالب لباص آخر لفترة محددة
- انتهاء تلقائي عند تجاوز `endDate`
- الطالب يظهر في الباص الجديد أثناء إنشاء التشغيل

### 11.6 اكتمال الرحلة
- إنهاء رحلة الذهاب ← جميع الطلاب غير المسجلين ← `absent`
- تغيير ActiveBus.status ← `ARRIVED`

### 11.7 الغياب
- تسجيل الطالب كـ `absent` في Attendance
- يظهر في التتبع باللون الأحمر
- لا يظهر في رحلة العودة

### 11.8 العودة
- قائمة انتظار منفصلة (`ReturnQueue`)
- باصات عودة منفصلة مع تحميل الطلاب
- إنزال (dropoff) ← إكمال العودة

---

## 12. ما تم تنفيذه

### ✅ تم — جميع الميزات التالية موجودة فعلياً في الكود:

1. نظام مصادقة كامل (JWT، قفل حسابات، تغيير كلمة المرور)
2. إدارة الطلاب (CRUD كامل مع بحث)
3. إدارة الباصات (CRUD مع سائق وطلاب)
4. إدارة طلاب الباصات (إضافة، نقل، تعديل وقت الاستلام)
5. نظام الاشتراكات (شهري، 3 أسابيع، 4 أسابيع، يومي)
6. الاشتراك اليومي (مدة + أيام + تواريخ تنفيذ + توافق عكسي)
7. نظام التسعير (مناطق، خطط، رسوم توصيل منزلي)
8. الحملات (خصومات التسجيل المبكر)
9. الموافقات على طلبات الاشتراك (مع رفع سند التحويل)
10. إنشاء وتشغيل اليوم (مع فلترة حسب الأيام والإجازات)
11. إدارة رحلة الذهاب (إضافة/إزالة طلاب، تعديل، نقل بين باصات)
12. تسجيل الحضور (فردي، جماعي)
13. تتبع الباص المباشر بدون GPS (Socket.IO، Skip/Unskip، إشعارات)
14. مراحل الرحلة (قبل الاستلام، الاستلام، الصعود، الغياب، الإكمال)
15. إلغاء الرحلة (إنهاء الرحلة، تسجيل الغائبين)
16. رحلات العودة (قائمة انتظار، تحميل، ترتيب، انطلاق، إنزال)
17. نظام الطوارئ (تعطل، نقل تلقائي/يدوي، استبدال، سجل)
18. التحويلات المؤقتة (إنشاء، انتهاء تلقائي، إلغاء)
19. التحويلات الدائمة
20. الكشوف الأسبوعية (إنشاء، نسخ احتياطي، طباعة مع QR، أرشيف)
21. نظام الإشعارات الداخلي — إشعارات لحظية عبر Socket.IO مع `createAndBroadcast()`، مزامعة بين الأجهزة (قراءة/حذف)، Popup حسب الأولوية (INFO 4s, WARNING 6s, CRITICAL باقٍ)، أصوات مختلفة، استرجاع تلقائي عند إعادة الاتصال، Pagination
22. سجل الحركات (Audit Log)
23. إدارة المستخدمين (CRUD، إعادة تعيين كلمة المرور)
24. ثلاث بوابات (مشرف، سائق، طالب) مع صلاحيات
25. دعم PWA (Service Worker)
26. خاصية Offline (IndexedDB للتخزين المحلي)
27. البوابة الطلابية (لوحة، اشتراكات، إشعارات، عودة)
28. **نظام الإدارة المالية** — الحالة المالية المستقلة (4 حالات)، إيقاف/إعادة تفعيل، مهلة بانتهاء تلقائي، تذكير، إحصائيات، لوحة تحكم مالية
29. التكامل المالي مع التشغيل — فلترة الموقوفين من التشغيل والكشوف مع تلوين المتأخرين
30. شارات مالية في BusOperationDetail + تلوين الكشوف الأسبوعية (أحمر للمتأخرين)
31. كارت + تنبيه مالي في Dashboard
32. **إدارة تشغيل السبت** — صفحة مستقلة (`SaturdayOperation.jsx`) مع اختيار باصات وإنشاء تشغيل وتوزيع طلاب وتحديث لحظي عبر Socket.IO
33. **إعادة تصميم الاشتراكات اليومية** — تبويبان (السبت / الأيام العادية) في `DailySubscriptionManagement.jsx`
34. **Cutoff Time 12 ظهراً** — `resolveExecutionDate()` تمنع تسجيل اليوم الحالي بعد 12 ظهراً وتؤجل للأسبوع القادم
35. **عداد مؤهل دقيق** — `getAvailableBuses()` يحسب الطلاب المؤهلين فعلاً بدلاً من جميع طلاب القالب
36. **نظام رسوم التسجيل الإضافية** — رسم إضافي واحد للحملات يتغير اسمه حسب حالة الطالب (رسوم طالب جديد / رسوم طالب متأخر)، مع دالة مركزية `computeExtraRegistrationFee()`. يمكن للأدمن تحديد تاريخ بدء للرسوم (`extraFeeStart`)؛ إذا تُرك فارغًا تبدأ فور التفعيل. تنتهي الرسوم مع نهاية الحملة تلقائيًا.

---

## 13. القيود الحالية

- لا يوجد نظام دفع إلكتروني (الدفع نقدي أو تحويل بنكي مع رفع سند)
- لا يوجد نظام خرائط أو GPS (التتبع يعتمد على ترتيب الطلاب فقط)
- لا يوجد إشعارات خارجية (Email, SMS, WhatsApp) — الإشعارات داخلية فقط عبر Socket.IO (تظهر في التطبيق نفسه مع أصوات)
- لا يوجد نظام متعدد اللغات (العربية فقط)
- لا يوجد واجهة برمجة تطبيقات عامة (API عامة) — جميع النقاط تتطلب JWT
- لا يوجد تقارير Excel/CSV تصدير
- لا يوجد نظام حضور بالبصمة أو QR
- لا يوجد تكامل مع أنظمة خارجية
- جميع الصور (سندات التحويل) تُخزن كـ base64 في قاعدة البيانات
- لا يوجد صلاحية "مشرف مالي" منفصل عن "مشرف نظام"
- التذكير المالي حالياً مجرد تسجيل في AuditLog (لا يُرسل للطالب)
- لا يوجد تصدير لتقارير الحالة المالية (Excel/PDF)
- لا يوجد كشف حساب مالي للطالب

---

## 14. خطة التطوير المستقبلية

> هذا القسم مخصص لتسجيل الميزات الجديدة المخطط لها مستقبلاً.

### ✅ نُفذت ضمن هذه المرحلة
- نظام الإدارة المالية (الحالة المالية، إيقاف، مهلة، تذكير) — يوليو 2026

### 📋 مقترحات مستقبلية
- إشعار تلقائي للطالب عند اقتراب انتهاء الاشتراك (3 أيام، 7 أيام قبل)
- إرسال التذكير المالي للطالب عبر واتساب أو SMS (باستخدام قوالب MessageTemplate)
- صلاحية "مشرف مالي" منفصلة عن الأدمن العام
- تصدير تقارير مالية (Excel/PDF) لكشف حسابات الطلاب
- كشف حساب مالي لكل طالب (سجل المدفوعات، فترات التأخير، الإيقافات)
- تعريف أسعار متأخرة (Late Fees / غرامات)
- نظام تقسيط تلقائي مع جدولة دفعات
- إشعارات للمشرفين عن المهل التي ستنتهي قريباً (جاهزة في `computeFinancialStatus`، تحتاج واجهة)

---

## 15. ملفات المشروع الهامة

### Backend

| المسار | الوصف |
|--------|-------|
| `backend/src/index.js` | نقطة الدخول الرئيسية (مُحدّث: تسجيل financial route + auto-expire كل 5 دقائق) |
| `backend/src/lib/prisma.js` | اتصال Prisma |
| `backend/src/lib/audit.js` | دالة تسجيل الحركات |
| `backend/src/middleware/auth.js` | Middleware المصادقة |
| `backend/src/utils/dateUtils.js` | دوال التاريخ |
| `backend/src/services/authService.js` | خدمة المصادقة |
| `backend/src/services/operationService.js` | خدمة التشغيل (مُحدّثة: `getAvailableBuses()` يحتسب الطلاب المؤهلين فعلاً، `updateAssignmentsStatusByBus`، إضافة `activeBusId`+`busStatus` في `getTodayOperation`) |
| `backend/src/services/operationStage.js` | مراحل الطالب |
| `backend/src/services/trackingService.js` | خدمة التتبع (مُحدّثة: `startMorningTrip`، `cancelMorningTrip`، `completeMorningTrip` تبث socket، تستخدم `notificationService`) |
| `backend/src/services/notificationService.js` | خدمة الإشعارات الموحّدة (`createAndBroadcast`، `markAsRead`، `markAllAsRead`، `deleteNotification`، `deleteAllNotifications`، `listNotifications` مع pagination) |
| `backend/src/services/socketService.js` | WebSocket (مُحدّث: انضمام تلقائي لغرفة المستخدم، `broadcastNotification`، `broadcastUnreadCount`، أحداث مزامعة الأجهزة: `broadcastNotificationRead`, `broadcastNotificationReadAll`, `broadcastNotificationDeleted`, `broadcastNotificationDeletedAll`, معالج `notification:get-missed`) |
| `backend/src/services/studentService.js` | خدمة الطلاب |
| `backend/src/services/subscriptionService.js` | خدمة الاشتراكات (مُحدّثة: `resolveExecutionDate()` مع Cutoff 12، `generateExecutionDates()` مبسّطة) |
| `backend/src/services/campaignService.js` | **جديد** — خدمة الحملات (`computeExtraRegistrationFee()` مع شرط `extraFeeStart`، `isLateRegistration()`، `isNewStudent()`) |
| `backend/src/services/emergencyService.js` | خدمة الطوارئ |
| `backend/src/services/weeklySheetService.js` | خدمة الكشوف الأسبوعية (مُحدّثة: استبعاد الموقوفين، تخزين الحالة المالية) |
| `backend/src/services/financialService.js` | **جديد** — الخدمة المالية (11 دالة) |
| `backend/src/routes/financial.js` | **جديد** — نقاط API المالية (9 endpoints) |
| `backend/src/routes/campaigns.js` | **مُحدّث** — POST/PUT تقبل `enableExtraRegistrationFee`، `extraRegistrationFee`، `extraFeeStart` |
| `backend/src/routes/enrollments.js` | **مُحدّث** — POST تحسب رسوم التسجيل الإضافية عبر `computeExtraRegistrationFee()`، PATCH approve تخزّن معلومات الرسم |
| `backend/src/routes/cartApprovals.js` | **مُحدّث** — تخزين `extraFeeType` و `extraFeeAmount` في subscription notes |
| `backend/prisma/schema.prisma` | مخطط قاعدة البيانات (مُحدّث: StudentFinancial model، Campaign + CampaignEnrollment مع حقول الرسوم الإضافية، إضافة `extraFeeStart` إلى Campaign) |
| `backend/prisma/seed.js` | بيانات تجريبية |

### Frontend

| المسار | الوصف |
|--------|-------|
| `src/main.jsx` | نقطة الدخول (React + BrowserRouter + AuthProvider) |
| `src/App.jsx` | الراوتر الرئيسي مع حماية المسارات (مُحدّث: إضافة route `/admin/saturday/operation`) |
| `src/index.css` | Tailwind + CSS Utilities |
| `src/context/AuthContext.jsx` | حالة المصادقة |
| `src/lib/api.js` | جميع دوال API |
| `src/lib/socket.js` | عميل WebSocket (مُحدّث: إعادة اتصال تلقائي `reconnection: true`، أحداث مزامعة: `onNotificationRead`, `onNotificationReadAll`, `onNotificationDeleted`, `onNotificationDeletedAll`, `emitGetMissedNotifications`، أحداث السبت: `onSaturdayUpdate`, `offSaturdayUpdate`) |
| `src/context/NotificationContext.jsx` | **جديد** — سياق الإشعارات (إدارة `unreadCount`، `popups`، أصوات حسب الأولوية، استرجاع الفائتة عند إعادة الاتصال، مزامعة الأجهزة) |
| `src/components/ui/NotificationPopup.jsx` | مكون Popup الإشعارات (سلوك مختلف حسب الأولوية: INFO 4s, WARNING 6s, CRITICAL لا ينتهي) |
| `src/components/ui/NotificationCenter.jsx` | مركز الإشعارات المنسدل (مُحدّث: Pagination 20 عنصراً مع Infinite Scroll، مزامعة الأجهزة) |
| `src/lib/format.js` | تنسيق العملة |
| `src/lib/db.js` | IndexedDB للتخزين المحلي |
| `src/components/layout/Sidebar.jsx` | الشريط الجانبي للمشرف (مُحدّث: إضافة "الإدارة المالية" + "تشغيل السبت") |
| `src/components/layout/MobileDrawer.jsx` | **مُحدّث** — إضافة رابط "تشغيل السبت" |
| `src/components/layout/TopNavbar.jsx` | **مُحدّث** — إضافة عنوان "تشغيل السبت" |
| `src/components/layout/AdminLayout.jsx` | تخطيط المشرف |
| `src/components/layout/DriverLayout.jsx` | تخطيط السائق |
| `src/components/layout/StudentLayout.jsx` | تخطيط الطالب |
| `src/components/layout/AuthLayout.jsx` | تخطيط تسجيل الدخول |
| `src/components/ui/PageHeader.jsx` | رأس الصفحة |
| `src/components/ui/DataTable.jsx` | جدول بيانات عام |
| `src/components/ui/GlobalSearch.jsx` | بحث عام |
| `src/components/ui/InstallPWA.jsx` | تثبيت PWA |
| `src/pages/admin/DailySubscriptionManagement.jsx` | **مُحدّث** — إدارة الاشتراكات اليومية (تبويبان: السبت + الأيام العادية) |
| `src/pages/admin/Campaigns.jsx` | **مُحدّث** — قسم "الرسوم الإضافية" مع checkbox تفعيل + حقل قيمة الرسوم + حقل تاريخ بدء الرسوم |
| `src/pages/admin/Approvals.jsx` | **مُحدّث** — إظهار نوع الرسم الإضافي (طالب جديد / طالب متأخر) مع القيمة |
| `src/pages/student/Subscriptions.jsx` | **مُحدّث** — حساب وعرض بند "رسوم طالب جديد/متأخر" في كرت الحملة، مع مراعاة `extraFeeStart` |
| `src/pages/admin/SaturdayOperation.jsx` | **جديد** — صفحة إدارة تشغيل السبت (اختيار باصات، توزيع طلاب، إنهاء) |
| `src/pages/admin/FinancialControl.jsx` | **جديد** — صفحة الإدارة المالية (إحصائيات، جدول، إجراءات) |
| `src/pages/admin/Dashboard.jsx` | **مُحدّث** — كارت المتأخرين عن السداد + تنبيه مالي |
| `src/pages/admin/BusOperationDetail.jsx` | **مُحدّث** — شارات مالية لكل طالب + شارة حالة الرحلة من `tracking?.busStatus` (SSOT واحد) + زر إلغاء الرحلة (بدون قائمة منسدلة للحالة) |
| `src/pages/admin/DailyOperation.jsx` | **مُحدّث** — نصوص CreateOperationDialog: "طالب مؤهل" بدلاً من "طالب"، تحذير الباص بدون مؤهلين |
| `src/pages/admin/WeeklySheetPrint.jsx` | **مُحدّث** — تلوين المتأخرين بالأحمر |

### Assets

| المسار | الوصف |
|--------|-------|
| `public/sounds/info.wav` | صوت إشعار INFO (خفيف، 880Hz) |
| `public/sounds/warning.wav` | صوت إشعار WARNING (متوسط، 660Hz) |
| `public/sounds/emergency-alarm.wav` | صوت إشعار CRITICAL (إنذار) |

### Config

| المسار | الوصف |
|--------|-------|
| `package.json` | Frontend dependencies |
| `backend/package.json` | Backend dependencies |
| `vite.config.js` | إعدادات Vite |
| `backend/.env` | المتغيرات البيئية |
| `.env.example` | مثال للمتغيرات البيئية |
| `.oxlintrc.json` | إعدادات linter |
