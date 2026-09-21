export type ExportMovementRow = {
  entry_type:string; company_name:string; sap_code:string; issue_date:string; service_name:string;
  due_amount:number|string; received_amount:number|string; remaining_amount:number|string;
  payment_status:string; currency:string;
};

export async function exportMovementsExcel(rows:ExportMovementRow[], lang:"ar"|"en") {
  const mod:any = await import("exceljs");
  const ExcelJS = mod.default ?? mod;
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(lang==="ar"?"سجل الحركات":"Movements");
  sheet.views = [{ rightToLeft: lang==="ar" }];
  const headers = lang==="ar"
    ? ["النوع","الشركة","SAP","التاريخ","الخدمة / البيان","المطلوب","المستلم","الباقي","الحالة","العملة"]
    : ["Type","Company","SAP","Date","Service / Description","Due","Received","Remaining","Status","Currency"];
  sheet.addRow(headers);
  rows.forEach(r=>sheet.addRow([r.entry_type,r.company_name,r.sap_code,r.issue_date,r.service_name,Number(r.due_amount),Number(r.received_amount),Number(r.remaining_amount),r.payment_status,r.currency]));
  sheet.getRow(1).font={bold:true};
  sheet.columns.forEach((col:any)=>{col.width=18;});
  sheet.getColumn(2).width=28; sheet.getColumn(5).width=34;
  const buffer=await workbook.xlsx.writeBuffer();
  const blob=new Blob([buffer],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});
  downloadBlob(blob,"SPC-movements-"+new Date().toISOString().slice(0,10)+".xlsx");
}

export function exportMovementsPdf(rows:ExportMovementRow[], lang:"ar"|"en") {
  const w=window.open("","_blank","noopener,noreferrer,width=1100,height=800");
  if(!w) return;
  const rtl=lang==="ar";
  const h=rtl?["النوع","الشركة","SAP","التاريخ","الخدمة","المطلوب","المستلم","الباقي","الحالة"]:["Type","Company","SAP","Date","Service","Due","Received","Remaining","Status"];
  const esc=(v:any)=>String(v??"").replace(/[&<>"']/g,(m)=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]||m));
  const body=rows.map(r=>`<tr><td>${esc(r.entry_type)}</td><td>${esc(r.company_name)}</td><td>${esc(r.sap_code)}</td><td>${esc(r.issue_date)}</td><td>${esc(r.service_name)}</td><td>${esc(r.due_amount)} ${esc(r.currency)}</td><td>${esc(r.received_amount)} ${esc(r.currency)}</td><td>${esc(r.remaining_amount)} ${esc(r.currency)}</td><td>${esc(r.payment_status)}</td></tr>`).join("");
  w.document.write(`<!doctype html><html dir="${rtl?"rtl":"ltr"}"><head><meta charset="utf-8"><title>SPC Movements</title><style>body{font-family:Arial,sans-serif;padding:24px;color:#111}h1{font-size:22px}table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #ddd;padding:8px;text-align:${rtl?"right":"left"}}th{background:#f3f4f6}@media print{body{padding:0}}</style></head><body><h1>${rtl?"سجل حركات مستحقات SPC":"SPC Receivables Movement History"}</h1><table><thead><tr>${h.map(x=>"<th>"+x+"</th>").join("")}</tr></thead><tbody>${body}</tbody></table><script>window.onload=()=>{window.print();}</script></body></html>`);
  w.document.close();
}
function downloadBlob(blob:Blob,name:string){const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);}
