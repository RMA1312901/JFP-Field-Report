const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const { q, submitReport } = require('./db');
const email = require('./email');

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

app.use(compression());
app.use(express.json());
if (isProd) { app.use(helmet({ contentSecurityPolicy: false })); app.use(express.static(path.join(__dirname, '..', 'client', 'dist'))); }
else { app.use(cors()); }

app.get('/api/health', (_, res) => res.json({ ok: true }));

app.get('/api/lists', (_, res) => {
  res.json({ foremen: q.getList('foremen'), employees: q.getList('employees'), sites: q.getList('sites'), workers: q.getList('workers') });
});

['foremen','employees','sites','workers'].forEach(table => {
  app.post(`/api/${table}`, (req, res) => { const { name } = req.body; if (!name?.trim()) return res.status(400).json({ error: 'Name required' }); q.add(table, name.trim()); res.json({ [table]: q.getList(table) }); });
  app.put(`/api/${table}`, (req, res) => { const { oldName, newName } = req.body; q.rename(table, oldName, newName.trim()); res.json({ [table]: q.getList(table) }); });
  app.delete(`/api/${table}/:name`, (req, res) => { q.remove(table, decodeURIComponent(req.params.name)); res.json({ [table]: q.getList(table) }); });
});

app.get('/api/recipients', (_, res) => res.json({ recipients: q.getRecipients() }));
app.post('/api/recipients', (req, res) => { const { email: addr, name } = req.body; if (!addr?.trim()) return res.status(400).json({ error: 'Email required' }); q.addRecipient.run(addr.trim().toLowerCase(), name?.trim() || null); res.json({ recipients: q.getRecipients() }); });
app.put('/api/recipients/:id/toggle', (req, res) => { q.toggleRecipient.run(req.body.active ? 1 : 0, +req.params.id); res.json({ recipients: q.getRecipients() }); });
app.delete('/api/recipients/:id', (req, res) => { q.deleteRecipient.run(+req.params.id); res.json({ recipients: q.getRecipients() }); });

app.post('/api/reports', async (req, res) => {
  try {
    const d = req.body;
    if (!d.foreman || !d.date) return res.status(400).json({ error: 'Missing fields' });
    const reportId = submitReport(d);
    const report = q.reportById.get(reportId);
    const crew = q.reportCrew.all(reportId);
    const emails = q.activeRecipients();
    if (emails.length) await email.sendReport(report, crew, emails);
    res.json({ success: true, reportId });
  } catch (err) { console.error('Submit error:', err); res.status(500).json({ error: err.message }); }
});

app.get('/api/reports/month/:ym', (req, res) => {
  const reports = q.reportsByMonth.all(`${req.params.ym}%`).map(r => ({
    ...r, subs_list: JSON.parse(r.subs_list || '[]'), equipment_list: JSON.parse(r.equipment_list || '[]'), jobs_data: JSON.parse(r.jobs_data || '[]'), crew: q.reportCrew.all(r.id)
  }));
  res.json({ reports });
});

app.get('/api/reports/date/:date', (req, res) => {
  const reports = q.reportsByDate.all(req.params.date).map(r => ({
    ...r, subs_list: JSON.parse(r.subs_list || '[]'), equipment_list: JSON.parse(r.equipment_list || '[]'), jobs_data: JSON.parse(r.jobs_data || '[]'), crew: q.reportCrew.all(r.id)
  }));
  res.json({ reports });
});

app.get('/api/reports/:id', (req, res) => {
  const r = q.reportById.get(+req.params.id);
  if (!r) return res.status(404).json({ error: 'Not found' });
  r.subs_list = JSON.parse(r.subs_list || '[]');
  r.equipment_list = JSON.parse(r.equipment_list || '[]');
  r.jobs_data = JSON.parse(r.jobs_data || '[]');
  r.crew = q.reportCrew.all(r.id);
  res.json({ report: r });
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
app.listen(PORT, '0.0.0.0', () => { console.log(`\n  🔨 JFP Field Reports\n  📡 http://localhost:${PORT}\n  🌍 ${isProd ? 'PRODUCTION' : 'DEV'}\n`); });
