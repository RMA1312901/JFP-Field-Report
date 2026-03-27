const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const DB_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DB_DIR, 'jfp.db');
fs.mkdirSync(DB_DIR, { recursive: true });
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS foremen (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE);
  CREATE TABLE IF NOT EXISTS employees (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE);
  CREATE TABLE IF NOT EXISTS sites (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE);
  CREATE TABLE IF NOT EXISTS workers (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE);
  CREATE TABLE IF NOT EXISTS mep (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE);
  CREATE TABLE IF NOT EXISTS recipients (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL UNIQUE, name TEXT, active INTEGER DEFAULT 1);
  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_type TEXT DEFAULT 'foreman',
    foreman TEXT NOT NULL,
    date TEXT NOT NULL,
    sites_data TEXT DEFAULT '[]',
    safety_talk INTEGER DEFAULT 0,
    subs_on_site INTEGER DEFAULT 0,
    subs_list TEXT DEFAULT '[]',
    work_desc TEXT DEFAULT '',
    total_hrs REAL DEFAULT 0,
    equipment_list TEXT DEFAULT '[]',
    jobs_data TEXT DEFAULT '[]',
    change_log TEXT DEFAULT '[]',
    submitted_at TEXT,
    site TEXT DEFAULT '',
    deleted INTEGER DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS report_crew (
    id INTEGER PRIMARY KEY AUTOINCREMENT, report_id INTEGER NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    name TEXT NOT NULL, hours REAL NOT NULL, note TEXT DEFAULT '', is_foreman INTEGER DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS pings (id INTEGER PRIMARY KEY AUTOINCREMENT, msg TEXT NOT NULL, from_name TEXT, created_at TEXT DEFAULT (datetime('now','localtime')));
  CREATE TABLE IF NOT EXISTS sessions (foreman TEXT PRIMARY KEY, data TEXT DEFAULT '{}');
  CREATE TABLE IF NOT EXISTS off_days (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, date TEXT NOT NULL, marked_at TEXT DEFAULT (datetime('now','localtime')), UNIQUE(name, date));
`);

// Safe migrations for existing DBs
const migrations = [
  "ALTER TABLE reports ADD COLUMN report_type TEXT DEFAULT 'foreman'",
  "ALTER TABLE reports ADD COLUMN equipment_list TEXT DEFAULT '[]'",
  "ALTER TABLE reports ADD COLUMN jobs_data TEXT DEFAULT '[]'",
  "ALTER TABLE reports ADD COLUMN sites_data TEXT DEFAULT '[]'",
  "ALTER TABLE reports ADD COLUMN change_log TEXT DEFAULT '[]'",
  "ALTER TABLE reports ADD COLUMN deleted INTEGER DEFAULT 0",
  "ALTER TABLE reports ADD COLUMN site TEXT DEFAULT ''",
  "CREATE TABLE IF NOT EXISTS mep (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE)",
];
for (const m of migrations) { try { db.exec(m); } catch(e) {} }

function estNow() {
  return new Date().toLocaleString("en-US", { timeZone: "America/New_York", month: "numeric", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true });
}

function seedIfEmpty(table, items) {
  const c = db.prepare(`SELECT COUNT(*) as c FROM ${table}`).get().c;
  if (c === 0) { const ins = db.prepare(`INSERT OR IGNORE INTO ${table} (name) VALUES (?)`); const tx = db.transaction(arr => arr.forEach(n => ins.run(n))); tx(items); }
}
seedIfEmpty('foremen', ['Chris F','Dennis T','Gregg B','Evan D','Cory L','Pat P']);
seedIfEmpty('employees', ['Nick P','Mike L','Jesse B','Austin T','Bruce T','Lilly R','Shay C','Devon R','Matt M','Gary P','Morgan V']);
seedIfEmpty('sites', ['Espinosa (Pinehurst)','Innisfree','Boinske','Camso','Norsk','Vortex','Island','179 Park St (Tupper Lake)']);
seedIfEmpty('workers', ['Chris P','Barry D','Guy D','Rob A','Gabe H']);
seedIfEmpty('mep', ['Paul G']);

const q = {
  getList: (table) => db.prepare(`SELECT name FROM ${table} ORDER BY id`).all().map(r => r.name),
  add: (table, name) => db.prepare(`INSERT OR IGNORE INTO ${table} (name) VALUES (?)`).run(name),
  rename: (table, o, n) => db.prepare(`UPDATE ${table} SET name = ? WHERE name = ?`).run(n, o),
  remove: (table, name) => db.prepare(`DELETE FROM ${table} WHERE name = ?`).run(name),
  getRecipients: () => db.prepare('SELECT * FROM recipients ORDER BY id').all(),
  addRecipient: db.prepare('INSERT OR IGNORE INTO recipients (email, name) VALUES (?, ?)'),
  toggleRecipient: db.prepare('UPDATE recipients SET active = ? WHERE id = ?'),
  deleteRecipient: db.prepare('DELETE FROM recipients WHERE id = ?'),
  activeRecipients: () => db.prepare('SELECT email FROM recipients WHERE active = 1').all().map(r => r.email),
  insertReport: db.prepare('INSERT INTO reports (report_type,foreman,date,sites_data,safety_talk,subs_on_site,subs_list,work_desc,total_hrs,equipment_list,jobs_data,change_log,submitted_at,site) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)'),
  updateReport: db.prepare('UPDATE reports SET sites_data=?,safety_talk=?,subs_on_site=?,subs_list=?,work_desc=?,total_hrs=?,equipment_list=?,jobs_data=?,change_log=?,site=? WHERE id=?'),
  deleteReport: db.prepare('DELETE FROM reports WHERE id = ?'),
  insertCrew: db.prepare('INSERT INTO report_crew (report_id,name,hours,note,is_foreman) VALUES (?,?,?,?,?)'),
  deleteCrew: db.prepare('DELETE FROM report_crew WHERE report_id = ?'),
  reportsByMonth: db.prepare("SELECT * FROM reports WHERE date LIKE ? AND deleted = 0 ORDER BY date DESC, id ASC"),
  reportsByDate: db.prepare('SELECT * FROM reports WHERE date = ? AND deleted = 0 ORDER BY id ASC'),
  reportById: db.prepare('SELECT * FROM reports WHERE id = ?'),
  reportCrew: db.prepare('SELECT * FROM report_crew WHERE report_id = ? ORDER BY is_foreman DESC, id'),
  getPings: () => db.prepare('SELECT * FROM pings ORDER BY created_at DESC LIMIT 50').all(),
  addPing: db.prepare('INSERT INTO pings (msg, from_name) VALUES (?, ?)'),
  deletePing: db.prepare('DELETE FROM pings WHERE id = ?'),
  clearPings: () => db.prepare('DELETE FROM pings').run(),
  getSession: db.prepare('SELECT data FROM sessions WHERE foreman = ?'),
  saveSession: db.prepare('INSERT INTO sessions (foreman, data) VALUES (?, ?) ON CONFLICT(foreman) DO UPDATE SET data = excluded.data'),
  getOffByDate: (date) => db.prepare('SELECT name, date FROM off_days WHERE date = ?').all(date),
  getOffByMonth: (ym) => db.prepare("SELECT name, date FROM off_days WHERE date LIKE ?").all(`${ym}%`),
  toggleOff: (name, date) => {
    const existing = db.prepare('SELECT id FROM off_days WHERE name = ? AND date = ?').get(name, date);
    if (existing) { db.prepare('DELETE FROM off_days WHERE id = ?').run(existing.id); return false; }
    else { db.prepare('INSERT INTO off_days (name, date) VALUES (?, ?)').run(name, date); return true; }
  },
};

const submitReport = db.transaction((d) => {
  const now = estNow();
  // Build primary site name from first site block for backward compat
  const sitesData = d.sites || [];
  const primarySite = sitesData.length > 0 ? sitesData[0].site : (d.site || '');
  const r = q.insertReport.run(
    d.reportType || 'foreman', d.foreman, d.date,
    JSON.stringify(sitesData),
    d.safetyTalk ? 1 : 0, d.subsOnSite ? 1 : 0,
    JSON.stringify(d.subs || []),
    d.workDesc || sitesData.map(s => s.workDesc || '').join('\n---\n'),
    d.totalHrs || 0,
    JSON.stringify(d.equipmentList || []),
    JSON.stringify(d.jobs || []),
    JSON.stringify(d.changeLog || []),
    now, primarySite
  );
  const rid = r.lastInsertRowid;
  // Insert crew from all site blocks
  const allCrew = [];
  for (const sb of sitesData) {
    for (const c of (sb.crew || [])) {
      if (!allCrew.find(x => x.name === c.name)) {
        allCrew.push(c);
        q.insertCrew.run(rid, c.name, parseFloat(c.hours) || 0, c.note || '', c.isForeman ? 1 : 0);
      }
    }
  }
  // Also handle direct crew array (worker reports)
  if (d.crew && d.crew.length && !sitesData.length) {
    for (const c of d.crew) q.insertCrew.run(rid, c.name, parseFloat(c.hours) || 0, c.note || '', c.isForeman ? 1 : 0);
  }
  if (d.sessionData) { q.saveSession.run(d.foreman, JSON.stringify(d.sessionData)); }
  return rid;
});

const updateReport = db.transaction((id, d) => {
  const now = estNow();
  const existing = q.reportById.get(id);
  if (!existing) throw new Error('Report not found');
  const oldLog = JSON.parse(existing.change_log || '[]');
  const newLog = [...oldLog, { at: now, by: d.editedBy || 'Unknown' }];
  const sitesData = d.sites || [];
  const primarySite = sitesData.length > 0 ? sitesData[0].site : (d.site || existing.site || '');
  q.updateReport.run(
    JSON.stringify(sitesData),
    d.safetyTalk ? 1 : 0, d.subsOnSite ? 1 : 0,
    JSON.stringify(d.subs || []),
    d.workDesc || sitesData.map(s => s.workDesc || '').join('\n---\n'),
    d.totalHrs || 0,
    JSON.stringify(d.equipmentList || []),
    JSON.stringify(d.jobs || []),
    JSON.stringify(newLog), primarySite, id
  );
  // Rebuild crew
  q.deleteCrew.run(id);
  for (const sb of sitesData) {
    for (const c of (sb.crew || [])) {
      q.insertCrew.run(id, c.name, parseFloat(c.hours) || 0, c.note || '', c.isForeman ? 1 : 0);
    }
  }
  if (d.sessionData) { q.saveSession.run(d.foreman || existing.foreman, JSON.stringify(d.sessionData)); }
  return newLog;
});

module.exports = { db, q, submitReport, updateReport, estNow };
