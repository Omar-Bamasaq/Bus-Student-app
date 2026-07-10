import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../../lib/api'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

const dayHeaders = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس']

export default function WeeklySheetPrint() {
  const { id } = useParams()
  const [sheet, setSheet] = useState(null)
  const [loading, setLoading] = useState(true)
  const sheetRef = useRef(null)

  const getDayHeadersWithDates = () => {
    if (!sheet) return dayHeaders
    const [y, m, d] = sheet.weekStart.split('-').map(Number)
    return dayHeaders.map((day, index) => {
      const dayDate = new Date(y, m - 1, d)
      dayDate.setDate(dayDate.getDate() + index)
      return {
        day,
        date: `${dayDate.getDate()}/${dayDate.getMonth() + 1}`
      }
    })
  }

  useEffect(() => {
    async function load() {
      try {
        const data = await api.weeklySheets.get(id)
        setSheet(data)
      } catch (err) {
        alert(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  function isOffDay(student, dayKey) {
    if (!student) return false
    const offDays = student.effectiveOffDays || student.offDays
    if (!offDays || !Array.isArray(offDays)) return false
    return offDays.includes(dayKey)
  }

  function getFinancialStatus(student) {
    if (!student?.notes) return null
    try {
      const parsed = JSON.parse(student.notes)
      return parsed.financialStatus || null
    } catch {
      return null
    }
  }

  async function captureSheetCanvas(scale = 2) {
    if (!sheetRef.current) return null
    const element = sheetRef.current
    return await html2canvas(element, {
      scale,
      useCORS: true,
      backgroundColor: '#ffffff',
      scrollX: -window.scrollX,
      scrollY: -window.scrollY,
      windowWidth: document.documentElement.clientWidth,
      windowHeight: document.documentElement.clientHeight
    })
  }

  async function handleExportPNG() {
    const canvas = await captureSheetCanvas(3)
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `كشف_أسبوعي_${sheet?.bus?.busNumber || 'باص'}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  async function handleExportPDF() {
    const canvas = await captureSheetCanvas(2)
    if (!canvas) return
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    })
    const imgWidth = 280
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight)
    pdf.save(`كشف_أسبوعي_${sheet?.bus?.busNumber || 'باص'}.pdf`)
  }

  if (loading) return <div className="text-center py-12 text-slate-400">جاري التحميل...</div>
  if (!sheet) return <div className="text-center py-12 text-slate-400">الكشف غير موجود</div>

  const driverName = sheet.bus?.driver?.name || sheet.bus?.driverName || 'غير محدد'
  const busNumber = sheet.bus?.busNumber || '-'
  const busPlate = sheet.bus?.plateNumber || '-'
  const driverPhone = sheet.bus?.driver?.phone || ''
  const primaryPhone = sheet.bus?.primaryPhone || ''
  const supervisorName = sheet.generatedBy?.name || 'غير محدد'
  const supervisorPhone = sheet.generatedBy?.phone || ''
  const busCapacity = Number(sheet.bus?.capacity) || sheet.students.length
  const rowCount = Math.max(sheet.students.length, busCapacity)

  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>
      <div className="no-print p-4 bg-white border-b flex items-center justify-between sticky top-0 z-10">
        <Link to="/admin/reports/weekly-sheets" className="text-sm text-slate-500 hover:text-slate-700">&larr; الكشوف الأسبوعية</Link>
        <div className="flex gap-2">
          <button
            onClick={handleExportPDF}
            className="bg-blue-800 text-white px-6 py-2 rounded text-sm font-bold hover:bg-blue-900"
          >
            تصدير PDF
          </button>
          <button
            onClick={handleExportPNG}
            className="bg-orange-500 text-white px-6 py-2 rounded text-sm font-bold hover:bg-orange-600"
          >
            تصدير صورة PNG
          </button>
        </div>
      </div>

      <div className="max-sm:overflow-x-auto max-sm:whitespace-nowrap">
      <div ref={sheetRef} id="weekly-sheet" style={{
        width: '850px',
        margin: '0 auto',
        direction: 'rtl',
        fontFamily: 'Arial, sans-serif',
        backgroundColor: '#ffffff'
      }}>
        {/* Logo & Orange Box - Same Row */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 16px 4px 16px'
        }}>
          {/* Logo area */}
          <div style={{ backgroundColor: '#ffffff' }}>
            <img
              src="/logo.svg"
              alt="شعار الشركة"
              style={{ width: '140px', height: 'auto', maxHeight: '140px', objectFit: 'contain', display: 'block' }}
            />
          </div>

          {/* Bus Info (Orange Box) - Larger text */}
          <div style={{
            backgroundColor: '#f97316',
            color: '#ffffff',
            padding: '16px 24px',
            textAlign: 'center',
            fontSize: '20px',
            fontWeight: 'bold'
          }}>
            باص رقم ({busNumber}) / السائق : {driverName} {primaryPhone}
          </div>
        </div>

        {/* Supervisors Info - Small margin from above */}
        <div style={{
          padding: '10px 16px',
          backgroundColor: '#f0e6d2',
          fontSize: '16px',
          fontWeight: 'bold',
          lineHeight: '1.6',
          textAlign: 'right',
          marginTop: '4px'
        }}>
          مشرفين الحركة:
          <br />
          عند الذهاب فقط: م.خالد (733456483 - 778966422)
          <br />
          عند العودة: أبو خالد (730889962 - 774304506) + العم عدنان (730622881 - 772107725)
        </div>



        {/* Alert */}
        <div style={{
          padding: '6px 16px',
          backgroundColor: '#fee2e2',
          color: '#991b1b',
          border: '1px solid #f87171',
          fontSize: '15px',
          lineHeight: '1.4',
          fontWeight: 'bold',
          textAlign: 'center'
        }}>
          طلابنا الأعزاء: نرجوا الالتزام بزمن الحضور في نقطة الانتظار ومن تأخر وراح عليه الباص فليلحقه بأي وسيلة
        </div>

        {/* Table */}
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '14px'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#1e3a5f', color: '#ffffff' }}>
              <th style={{ border: '1px solid #000', padding: '8px 6px', width: '40px', textAlign: 'center', fontWeight: 'bold' }}>م</th>
              <th style={{ border: '1px solid #000', padding: '8px 6px', width: '250px', textAlign: 'center', fontWeight: 'bold' }}>أسم الطالب</th>
              <th style={{ border: '1px solid #000', padding: '8px 6px', width: '80px', textAlign: 'center', fontWeight: 'bold' }}>التخصص</th>
              <th style={{ border: '1px solid #000', padding: '8px 6px', width: '80px', textAlign: 'center', fontWeight: 'bold' }}>المستوى</th>
              <th style={{ border: '1px solid #000', padding: '8px 6px', width: '120px', textAlign: 'center', fontWeight: 'bold' }}>نقطة الانتظار</th>
              <th style={{ border: '1px solid #000', padding: '8px 6px', width: '60px', textAlign: 'center', fontWeight: 'bold' }}>الوقت</th>
              {getDayHeadersWithDates().map((header, index) => (
                <th key={index} style={{ border: '1px solid #000', padding: '8px 6px', width: '60px', textAlign: 'center', fontSize: '13px', lineHeight: '1.5', fontWeight: 'bold' }}>
                  {typeof header === 'string' ? header : (
                    <>
                      <div>{header.day}</div>
                      <div>{header.date}</div>
                    </>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rowCount }).map((_, index) => {
              const student = sheet.students[index]
              const finStatus = getFinancialStatus(student)
              const isOverdue = finStatus === 'OVERDUE'
              const rowBackground = isOverdue ? '#fef2f2' : (index % 2 === 1 ? '#fff7ed' : '#ffffff')
              const rowColor = isOverdue ? '#dc2626' : '#000'
              return (
                <tr key={student?.id || index}>
                  <td style={{ border: '1px solid #000', padding: '8px 6px', textAlign: 'center', fontWeight: 'bold', backgroundColor: rowBackground, color: rowColor }}>{index + 1}</td>
                  <td style={{
                    border: '1px solid #000',
                    padding: '8px 6px',
                    textAlign: 'right',
                    fontWeight: 'bold',
                    fontSize: '17px',
                    lineHeight: '1.2',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    backgroundColor: rowBackground,
                    color: rowColor
                  }}>
                    {student?.studentName || ''}
                  </td>
                  <td style={{ border: '1px solid #000', padding: '8px 6px', textAlign: 'center', fontSize: '14px', fontWeight: 'bold', backgroundColor: rowBackground, color: rowColor }}>{student?.major || ''}</td>
                  <td style={{ border: '1px solid #000', padding: '8px 6px', textAlign: 'center', fontSize: '14px', fontWeight: 'bold', backgroundColor: rowBackground, color: rowColor }}>{student?.level || ''}</td>
                  <td style={{
                    border: '1px solid #000',
                    padding: '8px 6px',
                    textAlign: 'right',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    backgroundColor: rowBackground,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    color: rowColor
                  }}>{student?.pickupLocation || ''}</td>
                  <td style={{
                    border: '1px solid #000',
                    padding: '8px 6px',
                    textAlign: 'center',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    backgroundColor: rowBackground,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    color: rowColor
                  }}>{student?.pickupTime || ''}</td>
                  {['SATURDAY', 'SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY'].map((dayKey) => {
                    const offDay = student && isOffDay(student, dayKey)
                    const bg = offDay ? '#fee2e2' : rowBackground
                    return (
                      <td key={dayKey} style={{
                        border: '1px solid #000',
                        padding: '8px 6px',
                        textAlign: 'center',
                        color: offDay ? '#991b1b' : rowColor,
                        fontWeight: 'bold',
                        backgroundColor: bg,
                        fontSize: '14px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {offDay ? 'OFF' : ''}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* Footer */}
        <div style={{
          marginTop: '8px',
          padding: '10px 16px',
          backgroundColor: '#1e3a5f',
          color: '#ffffff',
          fontSize: '13px',
          fontWeight: 'bold',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>📍</span>
            <span>حضرموت - المكلا - فوة</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>مختص التسجيل</span>
            <span>💬</span>
            <span>734904945</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>المدير العام</span>
            <span>📞</span>
            <span>778966422</span>
          </div>
        </div>
      </div>
      </div>

      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 10mm; }
          body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          #weekly-sheet { width: 100%; }
        }
        @media (max-width: 640px) {
          #weekly-sheet { font-size: 10px !important; }
          #weekly-sheet table { font-size: 9px !important; }
          #weekly-sheet td, #weekly-sheet th { padding: 4px 3px !important; }
          #weekly-sheet td:nth-child(2) { font-size: 11px !important; }
          #weekly-sheet > div:first-child img { width: 80px !important; }
          #weekly-sheet > div:first-child > div:last-child { font-size: 12px !important; padding: 8px 12px !important; }
        }
      `}</style>
    </div>
  )
}
