import { DEFAULT_ORDER_ITEMS } from './orders'
 
export async function downloadOrderPDF(submission, orderItems) {
  // Dynamically load jsPDF and autoTable
  const { jsPDF } = await import('jspdf')
  await import('jspdf-autotable')
 
  const items = orderItems.length > 0 ? orderItems : DEFAULT_ORDER_ITEMS.map((t, i) => ({
    ...t, id: String(i), name: t.nameEn, name_en: t.nameEn,
    name_ar: t.nameAr, item_no: t.no, uom: t.uom, code: t.code
  }))
 
  const today = new Date().toLocaleDateString('en-CA')
  const empName = submission?.employee_name || '_______________'
  const date = submission?.date || today
  const totalOrdered = submission
    ? Object.values(submission.entries || {}).filter(e => e.qty).length
    : 0
 
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
 
  // ── Header ──
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('ORIGINAL SHAWARMA - Mississauga', 14, 18)
 
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100)
  doc.text('Purchase Order Form', 14, 24)
  doc.setTextColor(0)
 
  // Meta right side
  doc.setFontSize(10)
  doc.text(`Date: ${date}`, pageW - 14, 14, { align: 'right' })
  doc.text(`Ordered By: ${empName}`, pageW - 14, 20, { align: 'right' })
  doc.text(`Location: Mississauga`, pageW - 14, 26, { align: 'right' })
 
  // Divider
  doc.setDrawColor(0)
  doc.setLineWidth(0.5)
  doc.line(14, 28, pageW - 14, 28)
 
  // Stats
  doc.setFontSize(9)
  doc.setTextColor(100)
  doc.text(`Total Items Ordered: ${totalOrdered} / ${items.length}`, 14, 34)
  doc.setTextColor(0)
 
  // ── Build table rows grouped by category ──
  const categories = [...new Set(items.map(i => i.category))]
  const tableBody = []
 
  categories.forEach(cat => {
    // Category header row
    tableBody.push([
      { content: cat, colSpan: 6, styles: { fillColor: [26, 26, 26], textColor: 255, fontStyle: 'bold', fontSize: 9, halign: 'left' } }
    ])
    // Item rows
    items.filter(i => i.category === cat).forEach((item, idx) => {
      const qty = submission?.entries?.[item.id]?.qty || ''
      const isOrdered = qty !== ''
      tableBody.push([
        { content: item.item_no || item.no || '', styles: { halign: 'center', fontStyle: 'bold', fontSize: 9 } },
        { content: item.code || '', styles: { halign: 'center', fontSize: 8, textColor: [100, 100, 100] } },
        { content: item.uom || '', styles: { halign: 'center', fontSize: 8 } },
        { content: item.name_en || item.nameEn || item.name || '', styles: { fontSize: 8 } },
        { content: item.name_ar || item.nameAr || '', styles: { halign: 'right', fontSize: 9, fontStyle: 'bold' } },
        {
          content: qty || '',
          styles: {
            halign: 'center', fontStyle: 'bold', fontSize: 11,
            textColor: isOrdered ? [255, 107, 53] : [200, 200, 200],
            fillColor: isOrdered ? [255, 240, 235] : (idx % 2 === 0 ? [255, 255, 255] : [249, 249, 249])
          }
        }
      ])
    })
  })
 
  doc.autoTable({
    startY: 38,
    head: [[
      { content: 'Item No.', styles: { halign: 'center', fontStyle: 'bold', fontSize: 9, fillColor: [240, 240, 240] } },
      { content: 'Code',     styles: { halign: 'center', fontStyle: 'bold', fontSize: 9, fillColor: [240, 240, 240] } },
      { content: 'UoM',      styles: { halign: 'center', fontStyle: 'bold', fontSize: 9, fillColor: [240, 240, 240] } },
      { content: 'Description', styles: { fontStyle: 'bold', fontSize: 9, fillColor: [240, 240, 240] } },
      { content: 'Arabic Des.', styles: { halign: 'right', fontStyle: 'bold', fontSize: 9, fillColor: [240, 240, 240] } },
      { content: 'QTY',      styles: { halign: 'center', fontStyle: 'bold', fontSize: 9, fillColor: [255, 240, 235], textColor: [255, 107, 53] } },
    ]],
    body: tableBody,
    columnStyles: {
      0: { cellWidth: 16 },
      1: { cellWidth: 28 },
      2: { cellWidth: 20 },
      3: { cellWidth: 'auto' },
      4: { cellWidth: 32 },
      5: { cellWidth: 16 },
    },
    margin: { left: 14, right: 14 },
    styles: { fontSize: 8, cellPadding: 2, lineColor: [220, 220, 220], lineWidth: 0.1 },
    alternateRowStyles: { fillColor: [249, 249, 249] },
    headStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold' },
    didDrawPage: (data) => {
      // Footer on each page
      const pageCount = doc.internal.getNumberOfPages()
      doc.setFontSize(8)
      doc.setTextColor(150)
      doc.text(
        `Original Shawarma © ${new Date().getFullYear()}   |   Page ${data.pageNumber} of ${pageCount}   |   Signature: _______________________`,
        pageW / 2, doc.internal.pageSize.getHeight() - 8,
        { align: 'center' }
      )
      doc.setTextColor(0)
    }
  })
 
  // ── Save ──
  doc.save(`Order_${empName}_${date}.pdf`)
}
 
// Keep HTML version as fallback
export function generateOrderHTML(submission, orderItems) {
  const items = orderItems.length > 0 ? orderItems : DEFAULT_ORDER_ITEMS.map((t, i) => ({
    ...t, id: String(i), name: t.nameEn, name_en: t.nameEn,
    name_ar: t.nameAr, item_no: t.no, uom: t.uom, code: t.code
  }))
  const today = new Date().toLocaleDateString('en-CA')
  const empName = submission?.employee_name || '_______________'
  const date = submission?.date || today
  const totalOrdered = submission ? Object.values(submission.entries || {}).filter(e => e.qty).length : 0
  const categories = [...new Set(items.map(i => i.category))]
  let tableRows = ''
  categories.forEach(cat => {
    tableRows += `<tr><td colspan="6" style="background:#1a1a1a;color:white;font-weight:800;font-size:11px;padding:6px 10px;">${cat}</td></tr>`
    items.filter(i => i.category === cat).forEach((item, idx) => {
      const qty = submission?.entries?.[item.id]?.qty || ''
      const isOrdered = qty !== ''
      tableRows += `<tr style="background:${isOrdered ? '#fffbeb' : idx % 2 === 0 ? '#fff' : '#f9f9f9'};">
        <td style="padding:4px 8px;border:1px solid #ddd;text-align:center;font-weight:600;font-size:11px;">${item.item_no || item.no || ''}</td>
        <td style="padding:4px 8px;border:1px solid #ddd;text-align:center;font-size:10px;color:#555;">${item.code || ''}</td>
        <td style="padding:4px 8px;border:1px solid #ddd;text-align:center;font-size:10px;">${item.uom || ''}</td>
        <td style="padding:4px 8px;border:1px solid #ddd;font-size:10px;">${item.name_en || item.nameEn || item.name || ''}</td>
        <td style="padding:4px 8px;border:1px solid #ddd;text-align:right;font-size:11px;font-weight:600;direction:rtl;">${item.name_ar || item.nameAr || ''}</td>
        <td style="padding:4px 8px;border:2px solid ${isOrdered ? '#FF6B35' : '#ddd'};text-align:center;font-weight:800;font-size:13px;color:${isOrdered ? '#FF6B35' : '#ccc'};background:${isOrdered ? '#fff0eb' : 'white'};">${qty || ''}</td>
      </tr>`
    })
  })
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Order-${date}</title>
  <style>*{box-sizing:border-box;margin:0;padding:0;}@page{size:A4;margin:15mm 12mm;}@media print{.no-print{display:none!important;}body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}body{font-family:Arial,sans-serif;font-size:11px;}.page{padding:20px;max-width:900px;margin:0 auto;}.header{display:flex;justify-content:space-between;margin-bottom:14px;border-bottom:3px solid #000;padding-bottom:10px;}.company-name{font-size:20px;font-weight:900;}table{width:100%;border-collapse:collapse;}thead th{background:#f0f0f0;padding:6px 8px;border:1px solid #ddd;font-weight:700;font-size:10px;text-transform:uppercase;}.footer{margin-top:16px;border-top:2px solid #000;padding-top:10px;display:flex;justify-content:space-between;font-size:10px;color:#555;}.btn-pdf{position:fixed;bottom:24px;right:24px;background:#FF6B35;color:white;border:none;padding:14px 28px;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;}</style></head>
  <body><div class="page">
  <div class="header"><div><div class="company-name">ORIGINAL SHAWARMA - Mississauga</div><div style="color:#555;margin-top:3px;">Purchase Order Form</div></div>
  <div style="text-align:right;font-size:11px;"><div><b>Date:</b> ${date}</div><div><b>Ordered By:</b> ${empName}</div><div><b>Location:</b> Mississauga</div></div></div>
  <table><thead><tr><th style="width:45px;text-align:center;">Item No.</th><th style="width:100px;text-align:center;">Code</th><th style="width:70px;text-align:center;">UoM</th><th>Description</th><th style="width:140px;text-align:right;">Arabic Des.</th><th style="width:50px;text-align:center;background:#fff0eb;color:#FF6B35;">QTY</th></tr></thead><tbody>${tableRows}</tbody></table>
  <div class="footer"><div>Total: ${totalOrdered}/${items.length} items</div><div>Original Shawarma © ${new Date().getFullYear()}</div><div>Signature: _______________________</div></div>
  </div><button class="btn-pdf no-print" onclick="window.print()">🖨️ Save as PDF</button>
  <script>window.onload=()=>setTimeout(()=>window.print(),500)</script></body></html>`
