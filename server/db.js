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
  CREATE TABLE IF NOT EXISTS recipients (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL UNIQUE, name TEXT, active INTEGER DEFAULT 1);
  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT, report_type TEXT DEFAULT 'foreman',
    foreman TEXT NOT NULL, site TEXT DEFAULT '', date TEXT NOT NULL,
    safety_talk INTEGER DEFAULT 0, subs_on_site INTEGER DEFAULT 0,
    subs_list TEXT DEFAULT '[]', work_desc TEXT DEFAULT '',
    total_hrs REAL DEFAULT 0, equipment_list TEXT DEFAULT '[]',
    jobs_data TEXT DEFAULT '[]',
    submitted_at TEXT DEFAULT (datetime('now','localtime'))
  );
  CREATE TABLE IF NOT EXISTS report_crew (
    id INTEGER PRIMARY KEY AUTOINCREMENT, report_id INTEGER NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    name TEXT NOT NULL, hours REAL NOT NULL, note TEXT DEFAULT '', is_foreman INTEGER DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS pings (id INTEGER PRIMARY KEY AUTOINCREMENT, msg TEXT NOT NULL, from_name TEXT, created_at TEXT DEFAULT (datetime('now','localtime')));
  CREATE TABLE IF NOT EXISTS sessions (foreman TEXT PRIMARY KEY, data TEXT DEFAULT '{}');
`);

try { db.exec("ALTER TABLE reports ADD COLUMN report_type TEXT DEFAULT 'foreman'"); } catch(e) {}
try { db.exec("ALTER TABLE reports ADD COLUMN equipment_list TEXT DEFAULT '[]'"); } catch(e) {}
try { db.exec("ALTER TABLE reports ADD COLUMN jobs_data TEXT DEFAULT '[]'"); } catch(e) {}

function seedIfEmpty(table, items) {
  const c = db.prepare(`SELECT COUNT(*) as c FROM ${table}`).get().c;
  if (c === 0) { const ins = db.prepare(`INSERT OR IGNORE INTO ${table} (name) VALUES (?)`); const tx = db.transaction(arr => arr.forEach(n => ins.run(n))); tx(items); }
}
seedIfEmpty('foremen', ['Chris F','Dennis T','Gregg B','Evan D','Cory L','Pat P']);
seedIfEmpty('employees', ['Nick P','Mike L','Jesse B','Austin T','Bruce','Lilly R','Shay C','Devon R','Matt M','Gary P','Morgan V']);
seedIfEmpty('sites', ['Espinosa (Pinehurst)','Innisfree','Boinske','Camso','Norsk','Vortex','Island','179 Park St (Tupper Lake)']);
seedIfEmpty('workers', ['Chris P','Barry D','Guy D','Paul G']);

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
  insertReport: db.prepare('INSERT INTO reports (report_type,foreman,site,date,safety_talk,subs_on_site,subs_list,work_desc,total_hrs,equipment_list,jobs_data) VALUES (?,?,?,?,?,?,?,?,?,?,?)'),
  insertCrew: db.prepare('INSERT INTO report_crew (report_id,name,hours,note,is_foreman) VALUES (?,?,?,?,?)'),
  reportsByMonth: db.prepare("SELECT * FROM reports WHERE date LIKE ? ORDER BY date DESC"),
  reportsByDate: db.prepare('SELECT * FROM reports WHERE date = ?'),
  reportById: db.prepare('SELECT * FROM reports WHERE id = ?'),
  reportCrew: db.prepare('SELECT * FROM report_crew WHERE report_id = ? ORDER BY is_foreman DESC, id'),
  getPings: () => db.prepare('SELECT * FROM pings ORDER BY created_at DESC LIMIT 50').all(),
  addPing: db.prepare('INSERT INTO pings (msg, from_name) VALUES (?, ?)'),
  deletePing: db.prepare('DELETE FROM pings WHERE id = ?'),
  clearPings: () => db.prepare('DELETE FROM pings').run(),
  getSession: db.prepare('SELECT data FROM sessions WHERE foreman = ?'),
  saveSession: db.prepare('INSERT INTO sessions (foreman, data) VALUES (?, ?) ON CONFLICT(foreman) DO UPDATE SET data = excluded.data'),
};

  const submitReport = db.transaction((d) => {
  const r = q.insertReport.run(d.reportType||'foreman', d.foreman, d.site||'', d.date, d.safetyTalk?1:0, d.subsOnSite?1:0, JSON.stringify(d.subs||[]), d.workDesc||'', d.totalHrs||0, JSON.stringify(d.equipmentList||[]), JSON.stringify(d.jobs||[]));
  const rid = r.lastInsertRowid;
  if (d.crew) { for (const c of d.crew) q.insertCrew.run(rid, c.name, c.hours, c.note||'', c.isForeman?1:0); }
  if (d.sessionData) {
    const key = d.sessionKey || d.foreman;
    q.saveSession.run(key, JSON.stringify(d.sessionData));
  }
  return rid;
});

module.exports = { db, q, submitReport };
