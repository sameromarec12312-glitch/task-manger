export async function downloadOrderPDF(submission, orderItems) {
  const { jsPDF } = await import('jspdf')
  await import('jspdf-autotable')
 
  const items = orderItems || []
 
  const today = new Date().toLocaleDateString('en-CA')
  const empName = submission?.employee_name || '_______________'
  const date = submission?.date || today
  const totalOrdered = submission
    ? Object.values(submission.entries || {}).filter(e => e.qty).length
    : 0
 
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
 
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('ORIGINAL SHAWARMA - Mississauga', 14, 18)
 
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100)
  doc.text('Purchase Order Form', 14, 24)
  doc.setTextColor(0)
 
  doc.setFontSize(10)
  doc.text('Date: ' + date, pageW - 14, 14, { align: 'right' })
  doc.text('Ordered By: ' + empName, pageW - 14, 20, { align: 'right' })
  doc.text('Location: Mississauga', pageW - 14, 26, { align: 'right' })
 
  doc.setDrawColor(0)
  doc.setLineWidth(0.5)
  doc.line(14, 28, pageW - 14, 28)
 
  doc.setFontSize(9)
  doc.setTextColor(100)
  doc.text('Total Items Ordered: ' + totalOrdered + ' / ' + items.length, 14, 34)
  doc.setTextColor(0)
 
  const categories = [...new Set(items.map(i => i.category))]
  const tableBody = []
 
  categories.forEach(cat => {
    tableBody.push([
      { content: cat, colSpan: 6, styles: { fillColor: [26, 26, 26], textColor: 255, fontStyle: 'bold', fontSize: 9, halign: 'left' } }
    ])
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
      { content: 'Code', styles: { halign: 'center', fontStyle: 'bold', fontSize: 9, fillColor: [240, 240, 240] } },
      { content: 'UoM', styles: { halign: 'center', fontStyle: 'bold', fontSize: 9, fillColor: [240, 240, 240] } },
      { content: 'Description', styles: { fontStyle: 'bold', fontSize: 9, fillColor: [240, 240, 240] } },
      { content: 'Arabic Des.', styles: { halign: 'right', fontStyle: 'bold', fontSize: 9, fillColor: [240, 240, 240] } },
      { content: 'QTY', styles: { halign: 'center', fontStyle: 'bold', fontSize: 9, fillColor: [255, 240, 235], textColor: [255, 107, 53] } },
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
      const pageCount = doc.internal.getNumberOfPages()
      doc.setFontSize(8)
      doc.setTextColor(150)
      doc.text(
        'Original Shawarma ' + new Date().getFullYear() + '   |   Page ' + data.pageNumber + ' of ' + pageCount + '   |   Signature: _______________________',
        pageW / 2,
        doc.internal.pageSize.getHeight() - 8,
        { align: 'center' }
      )
      doc.setTextColor(0)
    }
  })
 
  doc.save('Order_' + empName + '_' + date + '.pdf')
}
