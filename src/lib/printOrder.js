import { DEFAULT_ORDER_ITEMS } from '../lib/orders'

export function generateOrderHTML(submission, orderItems) {
  // Use items in PDF order if no submission, or match submitted items
  const items = orderItems.length > 0 ? orderItems : DEFAULT_ORDER_ITEMS.map((t, i) => ({ ...t, id: String(i), name: t.nameEn, name_en: t.nameEn, name_ar: t.nameAr, item_no: t.no, uom: t.uom, code: t.code }))

  const categories = [...new Set(items.map(i => i.category))]
  const today = new Date().toLocaleDateString('en-CA')
  const empName = submission?.employee_name || '_______________'
  const date = submission?.date || today

  const rows = items.map((item, idx) => {
    const qty = submission?.entries?.[item.id]?.qty || ''
    const isOrdered = qty !== ''
    return `
    <tr style="background:${idx % 2 === 0 ? '#ffffff' : '#f9f9f9'}; ${isOrdered ? 'background:#fffbeb;' : ''}">
      <td style="padding:5px 8px;border:1px solid #ddd;text-align:center;font-weight:600;color:#333;">${item.item_no || item.no || ''}</td>
      <td style="padding:5px 8px;border:1px solid #ddd;text-align:center;font-size:11px;color:#666;">${item.code || ''}</td>
      <td style="padding:5px 8px;border:1px solid #ddd;text-align:center;font-size:11px;white-space:nowrap;">${item.uom || ''}</td>
      <td style="padding:5px 8px;border:1px solid #ddd;font-size:11px;">${item.name_en || item.nameEn || item.name || ''}</td>
      <td style="padding:5px 8px;border:1px solid #ddd;text-align:right;font-size:12px;font-weight:600;direction:rtl;">${item.name_ar || item.nameAr || ''}</td>
      <td style="padding:5px 8px;border:1px solid #ddd;text-align:center;font-weight:800;font-size:14px;color:${isOrdered ? '#e55a26' : '#ccc'};">${qty || ''}</td>
    </tr>`
  }).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Order Form - Original Shawarma</title>
<style>
  @media print {
    body { margin: 0; }
    .no-print { display: none !important; }
    table { page-break-inside: auto; }
    tr { page-break-inside: avoid; }
  }
  body { font-family: Arial, sans-serif; font-size: 12px; color: #000; margin: 20px; direction: ltr; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; border-bottom: 3px solid #000; padding-bottom: 12px; }
  .company { font-size: 18px; font-weight: 900; letter-spacing: 1px; }
  .subtitle { font-size: 13px; color: #555; margin-top: 3px; }
  .meta { text-align: right; font-size: 12px; }
  .meta-row { margin-bottom: 4px; }
  .meta-label { font-weight: 700; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  .cat-row td { background: #1a1a1a !important; color: white !important; font-weight: 800; font-size: 12px; padding: 7px 10px; text-transform: uppercase; letter-spacing: 0.5px; }
  thead tr th { background: #f0f0f0; padding: 7px 8px; border: 1px solid #ddd; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.3px; }
  .footer { margin-top: 20px; border-top: 2px solid #000; padding-top: 10px; display: flex; justify-content: space-between; font-size: 11px; color: #555; }
  .btn-print { position: fixed; top: 20px; right: 20px; background: #FF6B35; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 12px rgba(255,107,53,0.4); z-index: 999; }
  .btn-print:hover { background: #E55A26; }
</style>
</head>
<body>
<button class="btn-print no-print" onclick="window.print()">🖨️ Print / Save PDF</button>

<div class="header">
  <div>
    <div class="company">ORIGINAL SHAWARMA - Mississauga</div>
    <div class="subtitle">Purchase Order Form</div>
  </div>
  <div class="meta">
    <div class="meta-row"><span class="meta-label">Date:</span> ${date}</div>
    <div class="meta-row"><span class="meta-label">Ordered By:</span> ${empName}</div>
    <div class="meta-row"><span class="meta-label">Location:</span> Mississauga</div>
  </div>
</div>

<table>
  <thead>
    <tr>
      <th style="width:50px;text-align:center;">Item No.</th>
      <th style="width:110px;text-align:center;">Code</th>
      <th style="width:80px;text-align:center;">UoM</th>
      <th>Description</th>
      <th style="width:150px;text-align:right;">Arabic Des.</th>
      <th style="width:55px;text-align:center;background:#fff0eb;color:#e55a26;">QTY</th>
    </tr>
  </thead>
  <tbody>
    ${rows}
  </tbody>
</table>

<div class="footer">
  <div>Total Items Ordered: <strong>${submission ? Object.values(submission.entries || {}).filter(e => e.qty).length : 0}</strong></div>
  <div>Original Shawarma © ${new Date().getFullYear()}</div>
  <div>Signature: ___________________</div>
</div>

</body>
</html>`
}
