const { Resend } = require('resend');
let resend = null;

function init() {
  if (process.env.RESEND_API_KEY) { resend = new Resend(process.env.RESEND_API_KEY); console.log('✅ Email: Resend active'); }
  else { console.log('⚠️  Email: No RESEND_API_KEY — console only'); }
}

function fmtDate(s) { if (!s) return ''; const [y, m, d] = s.split('-'); return `${parseInt(m)}/${parseInt(d)}/${y}`; }

function buildHtml(report, crew) {
  const subs = JSON.parse(report.subs_list || '[]');
  const eqList = JSON.parse(report.equipment_list || '[]');
  const jobs = JSON.parse(report.jobs_data || '[]');
  const sitesData = JSON.parse(report.sites_data || '[]');
  const changeLog = JSON.parse(report.change_log || '[]');
  const isWorker = report.report_type === 'worker';

  const header = `<div style="background:#0b1424;padding:20px 24px"><div style="font-size:20px;font-weight:800;color:#2563eb">JFP Enterprises Inc</div><div style="font-size:11px;letter-spacing:2px;color:#6a7389;margin-top:4px">GENERAL · INDUSTRIAL · COMMERCIAL</div><div style="font-size:14px;color:#e2e4e9;margin-top:8px">${isWorker ? 'Worker' : 'Field'} Report — ${fmtDate(report.date)}</div></div>`;
  const logHtml = changeLog.length ? `<div style="padding:14px 24px;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280">${changeLog.map(c => `Edited ${c.at} — by ${c.by}`).join('<br>')}</div>` : '';
  const footer = `${logHtml}<div style="background:#f8f9fb;padding:14px 24px;font-size:11px;color:#9ca3af;border-top:1px solid #e5e7eb">Submitted ${report.submitted_at} · JFP Enterprises Inc</div>`;

  if (isWorker) {
    const jobRows = jobs.map((j, i) => `<div style="background:#f8f9fb;border-left:3px solid #2563eb;padding:12px;border-radius:0 8px 8px 0;margin-bottom:10px"><strong>Job #${j.jobNumber}</strong> — ${j.hours}h<br>${j.description || ''}${j.equipment ? `<br><span style="color:#6b7280">Equipment: ${j.equipment}</span>` : ''}</div>`).join('');
    const totalH = jobs.reduce((s, j) => s + (parseFloat(j.hours) || 0), 0);
    return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:-apple-system,sans-serif;margin:0;padding:0;background:#f4f5f7"><div style="max-width:600px;margin:0 auto;padding:20px"><div style="background:#fff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden">${header}<div style="padding:20px 24px"><table style="width:100%"><tr><td><span style="font-size:11px;color:#6b7280;text-transform:uppercase">Worker</span><br><strong>${report.foreman}</strong></td><td><span style="font-size:11px;color:#6b7280;text-transform:uppercase">Total</span><br><strong>${totalH}h</strong></td></tr></table></div><div style="padding:20px 24px">${jobRows}</div>${footer}</div></div></body></html>`;
  }

  // Multi-site foreman report
  const siteBlocks = sitesData.length > 0 ? sitesData.map((sb, i) => {
    const colors = ['#22c55e','#3b82f6','#eab308','#ef4444','#a855f7'];
    const color = colors[i % colors.length];
    const crewRows = (sb.crew || []).map(c => `<tr><td style="padding:6px 12px;border-bottom:1px solid #f0f0f0">${c.name}${c.isForeman ? ' <span style="color:#22c55e;font-weight:700">(FM)</span>' : ''}</td><td style="padding:6px 12px;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:600">${c.hours}h</td></tr>`).join('');
    return `<div style="padding:20px 24px;border-bottom:1px solid #e5e7eb"><div style="border-left:4px solid ${color};padding-left:12px;margin-bottom:12px"><div style="font-size:16px;font-weight:700">${sb.site}</div><div style="font-size:12px;color:#6b7280">${(sb.crew||[]).reduce((s,c)=>s+(parseFloat(c.hours)||0),0)}h total</div></div><table style="width:100%;font-size:13px">${crewRows}</table>${sb.workDesc ? `<div style="margin-top:12px;background:#f0f4ff;border-left:3px solid #2563eb;padding:10px;border-radius:0 8px 8px 0;font-size:13px;line-height:1.6">${sb.workDesc}</div>` : ''}</div>`;
  }).join('') : '';

  const subsHtml = subs.length ? `<div style="padding:10px 24px;font-size:13px"><strong>Subs:</strong> ${subs.map(s => `${s.name||s}${s.hours ? ` (${s.hours}h)` : ''}`).join(', ')}</div>` : '';
  const eqHtml = eqList.length ? `<div style="padding:10px 24px;font-size:13px"><strong>Equipment:</strong> ${eqList.map(eq => `${eq.name} (${eq.hours}h)`).join(', ')}</div>` : '';

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:-apple-system,sans-serif;margin:0;padding:0;background:#f4f5f7"><div style="max-width:600px;margin:0 auto;padding:20px"><div style="background:#fff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden">${header}<div style="padding:20px 24px;border-bottom:1px solid #e5e7eb"><table style="width:100%"><tr><td><span style="font-size:11px;color:#6b7280;text-transform:uppercase">Foreman</span><br><strong>${report.foreman}</strong></td><td><span style="font-size:11px;color:#6b7280;text-transform:uppercase">Sites</span><br><strong>${sitesData.map(s=>s.site).join(', ') || report.site}</strong></td><td><span style="font-size:11px;color:#6b7280;text-transform:uppercase">Hours</span><br><strong>${report.total_hrs}h</strong></td></tr></table><div style="margin-top:12px;font-size:13px"><span style="color:${report.safety_talk?'#22c55e':'#999'}">${report.safety_talk?'✓':'✗'} Safety Talk</span></div></div>${siteBlocks}${subsHtml}${eqHtml}${footer}</div></div></body></html>`;
}

async function sendReport(report, crew, emails) {
  const isWorker = report.report_type === 'worker';
  const sitesData = JSON.parse(report.sites_data || '[]');
  const siteNames = sitesData.map(s => s.site).join(', ') || report.site;
  const subject = isWorker ? `Worker Report — ${report.foreman} — ${fmtDate(report.date)}` : `Field Report — ${report.foreman} — ${fmtDate(report.date)} — ${siteNames}`;
  const html = buildHtml(report, crew);
  if (!resend) { console.log(`📧 [CONSOLE] To: ${emails.join(', ')} | ${subject}`); return { success: true, mode: 'console' }; }
  try { const r = await resend.emails.send({ from: process.env.EMAIL_FROM || 'JFP Reports <onboarding@resend.dev>', to: emails, subject, html }); console.log(`📧 Sent to ${emails.length} recipients`); return { success: true, id: r.id }; }
  catch (err) { console.error('📧 Failed:', err.message); return { success: false, error: err.message }; }
}

module.exports = { init, sendReport };
