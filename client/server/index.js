const express = require('express');
const cors = require('cors');
const path = require('path');
const { q, submitReport, updateReport, estNow } = require('./db');
const email = require('./email');

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '5mb' }));
if (isProd) { app.use(express.static(path.join(__dirname, '..', 'client', 'dist'))); }
else { app.use(cors()); }

app.get('/api/health', (_, res) => res.json({ ok: true, time: estNow() }));

app.get('/api/lists', (_, res) => {
  res.json({ foremen: q.getList('foremen'), employees: q.getList('employees'), sites: q.getList('sites'), workers: q.getList('workers'), mep: q.getList('mep') });
});

['foremen','employees','sites','workers','mep'].forEach(table => {
  app.post(`/api/${table}`, (req, res) => { const { name } = req.body; if (!name?.trim()) return res.status(400).json({ error: 'Name required' }); q.add(table, name.trim()); res.json({ [table]: q.getList(table) }); });
  app.put(`/api/${table}`, (req, res) => { const { oldName, newName } = req.body; q.rename(table, oldName, newName.trim()); res.json({ [table]: q.getList(table) }); });
  app.delete(`/api/${table}/:name`, (req, res) => { q.remove(table, decodeURIComponent(req.params.name)); res.json({ [table]: q.getList(table) }); });
});

app.get('/api/recipients', (_, res) => res.json({ recipients: q.getRecipients() }));
app.post('/api/recipients', (req, res) => { const { email: addr, name } = req.body; if (!addr?.trim()) return res.status(400).json({ error: 'Email required' }); q.addRecipient.run(addr.trim().toLowerCase(), name?.trim() || null); res.json({ recipients: q.getRecipients() }); });
app.put('/api/recipients/:id/toggle', (req, res) => { q.toggleRecipient.run(req.body.active ? 1 : 0, +req.params.id); res.json({ recipients: q.getRecipients() }); });
app.delete('/api/recipients/:id', (req, res) => { q.deleteRecipient.run(+req.params.id); res.json({ recipients: q.getRecipients() }); });

// Submit new report
app.post('/api/reports', async (req, res) => {
  try {
    const d = req.body;
    if (!d.foreman || !d.date) return res.status(400).json({ error: 'Missing fields' });
    const reportId = submitReport(d);
    const report = q.reportById.get(reportId);
    const crew = q.reportCrew.all(reportId);
    const emails = q.activeRecipients();
    let emailSent = false;
    if (emails.length) { const r = await email.sendReport(report, crew, emails); emailSent = r && r.success; }
    res.json({ success: true, reportId, emailSent });
  } catch (err) { console.error('Submit error:', err); res.status(500).json({ error: err.message }); }
});

// Update existing report
app.put('/api/reports/:id', async (req, res) => {
  try {
    const d = req.body;
    const newLog = updateReport(+req.params.id, d);
    res.json({ success: true, changeLog: newLog });
  } catch (err) { console.error('Update error:', err); res.status(500).json({ error: err.message }); }
});

// Delete report
app.delete('/api/reports/:id', (req, res) => {
  try {
    q.deleteCrew.run(+req.params.id);
    q.deleteReport.run(+req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Reinstate (re-submit with same data)
app.post('/api/reports/reinstate', async (req, res) => {
  try {
    const d = req.body;
    if (!d.foreman || !d.date) return res.status(400).json({ error: 'Missing fields' });
    const reportId = submitReport({ ...d, changeLog: d.changeLog || [] });
    res.json({ success: true, reportId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Send single report via Resend
app.post('/api/send-report/:id', async (req, res) => {
  try {
    const report = q.reportById.get(+req.params.id);
    if (!report) return res.status(404).json({ error: 'Not found' });
    const crew = q.reportCrew.all(report.id);
    const emails = q.activeRecipients();
    if (!emails.length) return res.json({ success: false, error: 'No active recipients' });
    const result = await email.sendReport(report, crew, emails);
    res.json(result);
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// Send all reports for a date
app.post('/api/send-day/:date', async (req, res) => {
  try {
    const reports = q.reportsByDate.all(req.params.date);
    if (!reports.length) return res.json({ success: false, error: 'No reports' });
    const emails = q.activeRecipients();
    if (!emails.length) return res.json({ success: false, error: 'No recipients' });
    let sent = 0;
    for (const r of reports) { const crew = q.reportCrew.all(r.id); await email.sendReport(r, crew, emails); sent++; }
    res.json({ success: true, sent });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

function parseReport(r) {
  return {
    ...r,
    subs_list: JSON.parse(r.subs_list || '[]'),
    equipment_list: JSON.parse(r.equipment_list || '[]'),
    jobs_data: JSON.parse(r.jobs_data || '[]'),
    sites_data: JSON.parse(r.sites_data || '[]'),
    change_log: JSON.parse(r.change_log || '[]'),
    crew: q.reportCrew.all(r.id)
  };
}

app.get('/api/reports/month/:ym', (req, res) => {
  const reports = q.reportsByMonth.all(`${req.params.ym}%`).map(parseReport);
  res.json({ reports });
});

app.get('/api/reports/date/:date', (req, res) => {
  const reports = q.reportsByDate.all(req.params.date).map(parseReport);
  res.json({ reports });
});

app.get('/api/reports/:id', (req, res) => {
  const r = q.reportById.get(+req.params.id);
  if (!r) return res.status(404).json({ error: 'Not found' });
  res.json({ report: parseReport(r) });
});

app.get('/api/off/:date', (req, res) => res.json({ offDays: q.getOffByDate(req.params.date) }));
app.get('/api/off/month/:ym', (req, res) => res.json({ offDays: q.getOffByMonth(req.params.ym) }));
app.post('/api/off/toggle', (req, res) => {
  const { name, date } = req.body;
  if (!name || !date) return res.status(400).json({ error: 'Name and date required' });
  const isOff = q.toggleOff(name, date);
  res.json({ isOff, offDays: q.getOffByDate(date) });
});

app.get('/api/pings', (_, res) => res.json({ pings: q.getPings() }));
app.post('/api/pings', (req, res) => { q.addPing.run(req.body.msg, req.body.from || 'System'); res.json({ pings: q.getPings() }); });
app.delete('/api/pings/all', (_, res) => { q.clearPings(); res.json({ pings: [] }); });
app.delete('/api/pings/:id', (req, res) => { q.deletePing.run(+req.params.id); res.json({ pings: q.getPings() }); });

app.get('/api/sessions/:foreman', (req, res) => {
  const row = q.getSession.get(decodeURIComponent(req.params.foreman));
  res.json({ session: row ? JSON.parse(row.data) : null });
});

if (isProd) { app.get('*', (_, res) => res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'))); }

email.init();
app.listen(PORT, '0.0.0.0', () => { console.log(`\n  🔨 JFP Field Reports\n  📡 http://localhost:${PORT}\n  🌍 ${isProd ? 'PRODUCTION' : 'DEV'}\n  🕐 ${estNow()} ET\n`); });
