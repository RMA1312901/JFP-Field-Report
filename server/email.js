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
  const isWorker = report.report_type === 'worker';

  const header = `<div style="background:#0b1424;padding:20px 24px"><div style="font-size:20px;font-weight:800;color:#2563eb">JFP Enterprises Inc</div><div style="font-size:11px;letter-spacing:2px;color:#6a7389;margin-top:4px">GENERAL · INDUSTRIAL · COMMERCIAL</div><div style="font-size:14px;color:#e2e4e9;margin-top:8px">${isWorker ? 'Office/Trucking/M.E.P.' : 'Daily Field'} Report — ${fmtDate(report.date)}</div></div>`;
  const footer = `<div style="background:#f8f9fb;padding:14px 24px;font-size:11px;color:#9ca3af;border-top:1px solid #e5e7eb">Submitted ${report.submitted_at} · JFP Enterprises Inc</div>`;

  if (isWorker) {
    const jobRows = jobs.map((j, i) => `<div style="background:#f8f9fb;border-left:3px solid #2563eb;padding:12px;border-radius:0 8px 8px 0;margin-bottom:10px"><strong>Job #${j.jobNumber}</strong> — ${j.hours}h<br>${j.description}${j.equipment ? `<br><span style="color:#6b7280">Equipment: ${j.equipment}</span>` : ''}</div>`).join('');
    const totalH = jobs.reduce((s, j) => s + (parseFloat(j.hours) || 0), 0);
    return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:-apple-system,sans-serif;margin:0;padding:0;background:#f4f5f7"><div style="max-width:600px;margin:0 auto;padding:20px"><div style="background:#fff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden">${header}<div style="padding:20px 24px;border-bottom:1px solid #e5e7eb"><table style="width:100%"><tr><td><span style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:1px">Worker</span><br><strong>${report.foreman}</strong></td><td><span style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:1px">Total Hours</span><br><strong>${totalH}h</strong></td><td><span style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:1px">Jobs</span><br><strong>${jobs.length}</strong></td></tr></table></div><div style="padding:20px 24px">${jobRows}</div>${footer}</div></div></body></html>`;
  }

  const rows = crew.map(c => `<tr><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${c.name}${c.is_foreman ? ' <span style="color:#2563eb;font-weight:700">(Foreman)</span>' : ''}</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;font-weight:600">${c.hours}h</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:13px">${c.note || '—'}</td></tr>`).join('');
  const eqRows = eqList.length ? `<div style="padding:20px 24px;border-bottom:1px solid #e5e7eb"><div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px">Equipment</div>${eqList.map(eq => `<div style="display:inline-block;padding:4px 12px;margin:2px;background:#f0f0f0;border-radius:6px">${eq.name}: ${eq.hours}h</div>`).join('')}</div>` : '';

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:-apple-system,sans-serif;margin:0;padding:0;background:#f4f5f7"><div style="max-width:600px;margin:0 auto;padding:20px"><div style="background:#fff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden">${header}<div style="padding:20px 24px;border-bottom:1px solid #e5e7eb"><table style="width:100%"><tr><td><span style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:1px">Foreman</span><br><strong>${report.foreman}</strong></td><td><span style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:1px">Job Site</span><br><strong>${report.site}</strong></td><td><span style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:1px">Total Hours</span><br><strong>${report.total_hrs}h</strong></td></tr></table><div style="margin-top:12px;font-size:13px"><span style="color:${report.safety_talk?'#1e8e3e':'#999'}">${report.safety_talk?'✓':'✗'} Safety Talk</span>&nbsp;&nbsp;<span style="color:${report.subs_on_site?'#1e8e3e':'#999'}">${report.subs_on_site?'✓':'✗'} Subs</span></div>${report.subs_on_site && subs.length ? `<div style="margin-top:8px;font-size:13px"><strong>Subs:</strong> ${subs.join(', ')}</div>`:''}</div><div style="padding:20px 24px;border-bottom:1px solid #e5e7eb"><div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Description of Work</div><div style="background:#f0f4ff;border-left:3px solid #2563eb;padding:12px;border-radius:0 8px 8px 0;line-height:1.6">${report.work_desc||''}</div></div>${eqRows}<div style="padding:20px 24px"><div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px">Crew — ${crew.length} workers</div><table style="width:100%;border-collapse:collapse"><thead><tr><th style="text-align:left;padding:8px 12px;border-bottom:2px solid #1a1d28;font-size:11px;color:#6b7280;text-transform:uppercase">Name</th><th style="text-align:center;padding:8px 12px;border-bottom:2px solid #1a1d28;font-size:11px;color:#6b7280;text-transform:uppercase">Hours</th><th style="text-align:left;padding:8px 12px;border-bottom:2px solid #1a1d28;font-size:11px;color:#6b7280;text-transform:uppercase">Notes</th></tr></thead><tbody>${rows}</tbody></table></div>${footer}</div></div></body></html>`;
}

async function sendReport(report, crew, emails) {
  const isWorker = report.report_type === 'worker';
  const subject = isWorker ? `Worker Report — ${report.foreman} — ${fmtDate(report.date)}` : `Field Report — ${report.foreman} — ${fmtDate(report.date)} — ${report.site}`;
  const html = buildHtml(report, crew);
  if (!resend) { console.log(`📧 [CONSOLE] To: ${emails.join(', ')} | ${subject}`); return { success: true, mode: 'console' }; }
  try { const r = await resend.emails.send({ from: process.env.EMAIL_FROM || 'JFP Reports <onboarding@resend.dev>', to: emails, subject, html }); console.log(`📧 Sent to ${emails.length} recipients`); return { success: true, id: r.id }; }
  catch (err) { console.error('📧 Failed:', err.message); return { success: false, error: err.message }; }
}

module.exports = { init, sendReport };
