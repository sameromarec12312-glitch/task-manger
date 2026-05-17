export async function downloadOrderPDF(submission, orderItems) {
  const items = orderItems || []
  const today = new Date().toLocaleDateString('en-CA')
  const empName = submission?.employee_name || '_______________'
  const date = submission?.date || today
  const totalOrdered = submission
    ? Object.values(submission.entries || {}).filter(e => e.qty).length
    : 0
 
  // Get unique items only (deduplicate by id)
  const seen = new Set()
  const uniqueItems = items.filter(i => {
    if (seen.has(i.id)) return false
    seen.add(i.id)
    return true
  })
 
  const categories = [...new Set(uniqueItems.map(i => i.category))]
 
  let tableRows = ''
  categories.forEach(cat => {
    tableRows += `<tr><td colspan="6" style="background:#1a1a1a;color:white;font-weight:800;font-size:11px;padding:6px 10px;letter-spacing:0.3px;">${cat}</td></tr>`
    uniqueItems.filter(i => i.category === cat).forEach((item, idx) => {
      const qty = submission?.entries?.[item.id]?.qty || ''
      const isOrdered = qty !== ''
      const bg = isOrdered ? '#fffbeb' : (idx % 2 === 0 ? '#ffffff' : '#f9f9f9')
      const qtyColor = isOrdered ? '#FF6B35' : '#cccccc'
      const qtyBg = isOrdered ? '#fff0eb' : bg
      tableRows += `<tr style="background:${bg};">
        <td style="padding:4px 8px;border:1px solid #e0e0e0;text-align:center;font-weight:700;font-size:11px;">${item.item_no || item.no || ''}</td>
        <td style="padding:4px 8px;border:1px solid #e0e0e0;text-align:center;font-size:9px;color:#666;">${item.code || ''}</td>
        <td style="padding:4px 8px;border:1px solid #e0e0e0;text-align:center;font-size:10px;white-space:nowrap;">${item.uom || ''}</td>
        <td style="padding:4px 8px;border:1px solid #e0e0e0;font-size:10px;">${item.name_en || item.nameEn || item.name || ''}</td>
        <td style="padding:4px 8px;border:1px solid #e0e0e0;text-align:right;font-size:11px;font-weight:600;direction:rtl;font-family:Arial,sans-serif;">${item.name_ar || item.nameAr || ''}</td>
        <td style="padding:4px 8px;border:2px solid ${isOrdered ? '#FF6B35' : '#e0e0e0'};text-align:center;font-weight:800;font-size:13px;color:${qtyColor};background:${qtyBg};">${qty}</td>
      </tr>`
    })
  })
 
  const html = [
    '<!DOCTYPE html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="UTF-8">',
    '<title>Order_' + empName + '_' + date + '</title>',
    '<style>',
    '* { box-sizing: border-box; margin: 0; padding: 0; }',
    '@page { size: A4; margin: 12mm 10mm; }',
    '@media print { .no-print { display: none !important; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }',
    'body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #000; background: white; }',
    '.page { padding: 16px; max-width: 900px; margin: 0 auto; }',
    '.header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; border-bottom: 3px solid #000; padding-bottom: 10px; }',
    '.co-name { font-size: 20px; font-weight: 900; letter-spacing: 0.5px; }',
    '.co-sub { font-size: 12px; color: #666; margin-top: 3px; }',
    '.meta { text-align: right; font-size: 11px; line-height: 1.8; }',
    '.stats { display: flex; gap: 12px; margin-bottom: 12px; }',
    '.stat { background: #f5f5f5; border: 1px solid #ddd; border-radius: 6px; padding: 5px 14px; font-size: 11px; }',
    '.stat b { font-size: 15px; color: #FF6B35; display: block; }',
    'table { width: 100%; border-collapse: collapse; }',
    'thead th { background: #f0f0f0; padding: 6px 8px; border: 1px solid #ddd; font-weight: 700; font-size: 10px; text-transform: uppercase; }',
    '.footer { margin-top: 16px; border-top: 2px solid #000; padding-top: 8px; display: flex; justify-content: space-between; font-size: 10px; color: #666; }',
    '.btn { position: fixed; bottom: 20px; right: 20px; background: #FF6B35; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 12px rgba(255,107,53,0.4); }',
    '</style>',
    '</head>',
    '<body>',
    '<div class="page">',
    '<div class="header">',
    '<div><div class="co-name">ORIGINAL SHAWARMA - Mississauga</div><div class="co-sub">Purchase Order Form</div></div>',
    '<div class="meta"><div><b>Date:</b> ' + date + '</div><div><b>Ordered By:</b> ' + empName + '</div><div><b>Location:</b> Mississauga</div></div>',
    '</div>',
    '<div class="stats">',
    '<div class="stat"><b>' + totalOrdered + '</b>Items Ordered</div>',
    '<div class="stat"><b>' + uniqueItems.length + '</b>Total Items</div>',
    '<div class="stat"><b>' + date + '</b>Order Date</div>',
    '</div>',
    '<table>',
    '<thead><tr>',
    '<th style="width:42px;text-align:center;">Item No.</th>',
    '<th style="width:95px;text-align:center;">Code</th>',
    '<th style="width:65px;text-align:center;">UoM</th>',
    '<th>Description</th>',
    '<th style="width:130px;text-align:right;">Arabic Des.</th>',
    '<th style="width:48px;text-align:center;background:#fff0eb;color:#FF6B35;">QTY</th>',
    '</tr></thead>',
    '<tbody>' + tableRows + '</tbody>',
    '</table>',
    '<div class="footer">',
    '<div>Total Ordered: <b>' + totalOrdered + ' / ' + uniqueItems.length + '</b></div>',
    '<div>Original Shawarma &copy; ' + new Date().getFullYear() + '</div>',
    '<div>Signature: _______________________</div>',
    '</div>',
    '</div>',
    '<button class="btn no-print" onclick="window.print()">&#x1F5A8; Print / Save PDF</button>',
    '</body>',
    '</html>'
  ].join('\n')
 
  // Open in new tab and trigger print
  const w = window.open('', '_blank')
  w.document.open()
  w.document.write(html)
  w.document.close()
  setTimeout(() => w.print(), 800)
}
