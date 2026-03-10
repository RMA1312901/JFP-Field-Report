import { useState, useEffect, useCallback, useRef } from "react";
import * as api from "./api";

const DEFAULT_FOREMEN = ["Chris F","Dennis T","Gregg B","Evan D","Cory L","Pat P"];
const DEFAULT_EMPLOYEES = ["Nick P","Mike L","Jesse B","Austin T","Bruce","Lilly R","Shay C","Devon R","Matt M","Gary P","Morgan V"];
const DEFAULT_SITES = ["Espinosa (Pinehurst)","Innisfree","Boinske","Camso","Norsk","Vortex","Island","179 Park St (Tupper Lake)"];
const DEFAULT_WORKERS = ["Chris P","Barry D","Guy D","Paul G"];

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }
function todayStr() { return new Date().toISOString().split("T")[0]; }
function fmtDate(s) { if (!s) return ""; const [y, m, d] = s.split("-"); return `${parseInt(m)}/${parseInt(d)}/${y}`; }
function monthDays(y, m) { return new Date(y, m + 1, 0).getDate(); }
function firstDow(y, m) { return new Date(y, m, 1).getDay(); }

const themes = {
  dark: { bg:"#0b0f18", card:"#141a28", border:"#1e2a3e", accent:"#c5a44e", accentDim:"#a8893a", text:"#e2e4e9", dim:"#6a7389", danger:"#e84040", green:"#34c759", greenBg:"#0f2418", input:"#0e1320", blue:"#4a7cff", blueBg:"#111a30", bgGrad:"linear-gradient(180deg,#0b0f18 0%,#0e1322 100%)", headerBg:"#0d1221", checkBg:"#0e1320", warn:"#f59e0b", warnBg:"#1a1608" },
  light: { bg:"#f2f3f5", card:"#ffffff", border:"#d8dbe2", accent:"#8b6914", accentDim:"#75580e", text:"#1a1d28", dim:"#6b7280", danger:"#dc3545", green:"#1e8e3e", greenBg:"#e4f5ea", input:"#ecedf1", blue:"#2563eb", blueBg:"#eef2ff", bgGrad:"linear-gradient(180deg,#f2f3f5 0%,#e8e9ed 100%)", headerBg:"#ffffff", checkBg:"#ecedf1", warn:"#d97706", warnBg:"#fef9ee" },
};

// Production: data fetched via api.js, no window.storage needed

function useLongPress(cb, ms = 500) {
  const t = useRef(null), c = useRef(cb); c.current = cb;
  const start = useCallback(e => { e.preventDefault(); t.current = setTimeout(() => c.current(), ms); }, [ms]);
  const cancel = useCallback(() => clearTimeout(t.current), []);
  return { onTouchStart: start, onMouseDown: start, onTouchEnd: cancel, onTouchMove: cancel, onMouseUp: cancel, onMouseLeave: cancel };
}

function LPChip({ label, active, onTap, onLong, isForeman, C }) {
  const lp = useLongPress(onLong);
  return (
    <div {...lp} onClick={onTap} style={{ display:"inline-flex", alignItems:"center", padding:"10px 14px", fontSize:14, fontWeight:600, borderRadius:10, cursor:"pointer", border:`1.5px solid ${active ? (isForeman ? C.green : C.accent) : C.border}`, background:active ? (isForeman ? `${C.green}15` : `${C.accent}15`) : C.input, color:active ? (isForeman ? C.green : C.accent) : C.text, transition:"all .15s", userSelect:"none", WebkitUserSelect:"none" }}>
      {active && <span style={{ marginRight:5 }}>✓</span>}{label}
    </div>
  );
}

function EditModal({ title, value, onSave, onDelete, onClose, canDelete, C }) {
  const [v, setV] = useState(value);
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", zIndex:999, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:24, width:"100%", maxWidth:360 }}>
        <div style={{ fontSize:16, fontWeight:700, color:C.text, marginBottom:16 }}>{title}</div>
        <input value={v} onChange={e => setV(e.target.value)} autoFocus style={{ width:"100%", padding:"13px 14px", fontSize:16, background:C.input, border:`1.5px solid ${C.border}`, borderRadius:10, color:C.text, outline:"none", boxSizing:"border-box", marginBottom:16 }} />
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={() => { if (v.trim()) onSave(v.trim()); }} style={{ flex:1, padding:12, fontSize:15, fontWeight:700, borderRadius:10, background:C.accent, color:"#000", border:"none", cursor:"pointer" }}>Save</button>
          {canDelete && <button onClick={onDelete} style={{ padding:"12px 16px", fontSize:15, fontWeight:700, borderRadius:10, background:`${C.danger}22`, color:C.danger, border:`1px solid ${C.danger}44`, cursor:"pointer" }}>Delete</button>}
        </div>
        <button onClick={onClose} style={{ width:"100%", marginTop:8, padding:10, fontSize:14, background:"transparent", color:C.dim, border:`1px solid ${C.border}`, borderRadius:10, cursor:"pointer" }}>Cancel</button>
      </div>
    </div>
  );
}

function AddModal({ title, placeholder, onAdd, onClose, C }) {
  const [v, setV] = useState("");
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", zIndex:999, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:24, width:"100%", maxWidth:360 }}>
        <div style={{ fontSize:16, fontWeight:700, color:C.text, marginBottom:16 }}>{title}</div>
        <input value={v} onChange={e => setV(e.target.value)} autoFocus placeholder={placeholder} onKeyDown={e => { if (e.key === "Enter" && v.trim()) onAdd(v.trim()); }} style={{ width:"100%", padding:"13px 14px", fontSize:16, background:C.input, border:`1.5px solid ${C.border}`, borderRadius:10, color:C.text, outline:"none", boxSizing:"border-box", marginBottom:16 }} />
        <button onClick={() => { if (v.trim()) onAdd(v.trim()); }} style={{ width:"100%", padding:12, fontSize:15, fontWeight:700, borderRadius:10, background:C.accent, color:"#000", border:"none", cursor:"pointer" }}>Add</button>
        <button onClick={onClose} style={{ width:"100%", marginTop:8, padding:10, fontSize:14, background:"transparent", color:C.dim, border:`1px solid ${C.border}`, borderRadius:10, cursor:"pointer" }}>Cancel</button>
      </div>
    </div>
  );
}

function OvertimeConfirm({ hours, onConfirm, onCancel, C }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", zIndex:999, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:C.card, border:`1px solid ${C.warn}44`, borderRadius:16, padding:24, width:"100%", maxWidth:340, textAlign:"center" }}>
        <div style={{ width:50, height:50, borderRadius:"50%", background:C.warnBg, border:`2px solid ${C.warn}44`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", fontSize:24 }}>⚠</div>
        <div style={{ fontSize:17, fontWeight:700, color:C.text, marginBottom:8 }}>Over 8 Hours</div>
        <div style={{ fontSize:14, color:C.dim, marginBottom:20, lineHeight:1.5 }}>You entered {hours} hours. Is that correct?</div>
        <button onClick={onConfirm} style={{ width:"100%", padding:14, fontSize:16, fontWeight:700, borderRadius:10, background:C.accent, color:"#000", border:"none", cursor:"pointer", marginBottom:8 }}>Yes, that's correct</button>
        <button onClick={onCancel} style={{ width:"100%", padding:12, fontSize:14, background:"transparent", color:C.dim, border:`1px solid ${C.border}`, borderRadius:10, cursor:"pointer" }}>Go back and fix</button>
      </div>
    </div>
  );
}

function DupeDateWarning({ date, onContinue, onChangeDate, C }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", zIndex:999, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:C.card, border:`1px solid ${C.warn}44`, borderRadius:16, padding:24, width:"100%", maxWidth:340, textAlign:"center" }}>
        <div style={{ width:50, height:50, borderRadius:"50%", background:C.warnBg, border:`2px solid ${C.warn}44`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", fontSize:24 }}>⚠</div>
        <div style={{ fontSize:17, fontWeight:700, color:C.text, marginBottom:8 }}>Existing Report</div>
        <div style={{ fontSize:14, color:C.dim, marginBottom:20, lineHeight:1.5 }}>You already submitted payroll time for {date}. Do you want to continue and add another report for this day?</div>
        <button onClick={onContinue} style={{ width:"100%", padding:14, fontSize:16, fontWeight:700, borderRadius:10, background:C.accent, color:"#000", border:"none", cursor:"pointer", marginBottom:8 }}>Yes, continue</button>
        <button onClick={onChangeDate} style={{ width:"100%", padding:12, fontSize:14, background:"transparent", color:C.dim, border:`1px solid ${C.border}`, borderRadius:10, cursor:"pointer" }}>Change date</button>
      </div>
    </div>
  );
}

function Splash({ onFinish }) {
  const [p, setP] = useState(0);
  useEffect(() => { const t1 = setTimeout(() => setP(1), 100), t2 = setTimeout(() => setP(2), 700), t3 = setTimeout(() => setP(3), 1400), t4 = setTimeout(() => onFinish(), 2200); return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); }; }, [onFinish]);
  return (
    <div style={{ position:"fixed", inset:0, zIndex:9999, background:"linear-gradient(170deg,#060a12 0%,#0b1120 50%,#101828 100%)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
      <div style={{ opacity:p >= 1 ? 1 : 0, transform:p >= 1 ? "scale(1)" : "scale(.85)", transition:"all .6s cubic-bezier(.16,1,.3,1)", textAlign:"center" }}>
        <div style={{ fontSize:34, fontWeight:800, color:"#2563eb" }}>JFP Enterprises Inc</div>
        <div style={{ fontSize:11, fontWeight:600, letterSpacing:3, color:"#6a7389", textTransform:"uppercase", marginTop:8 }}>General · Industrial · Commercial</div>
      </div>
      <div style={{ marginTop:28, opacity:p >= 2 ? 1 : 0, transform:p >= 2 ? "translateY(0)" : "translateY(10px)", transition:"all .5s cubic-bezier(.16,1,.3,1)", fontSize:13, letterSpacing:4, color:"#4a7cff", textTransform:"uppercase" }}>Daily Field Report</div>
      <div style={{ position:"absolute", bottom:50, opacity:p >= 3 ? 1 : 0, transition:"opacity .4s" }}><div style={{ width:140, height:2, background:"#1a2540", borderRadius:1, overflow:"hidden" }}><div style={{ width:p >= 3 ? "100%" : "0%", height:"100%", background:"linear-gradient(90deg,#2563eb,#4a7cff)", borderRadius:1, transition:"width .7s" }} /></div></div>
    </div>
  );
}

function ReportView({ report, onClose, C }) {
  if (!report) return null;
  const crew = report.crew || [];
  const subs = report.subs || [];
  const eqList = report.equipmentList || [];
  const jobs = report.jobs || [];
  const isWorker = report.reportType === "worker";

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.8)", zIndex:998, overflow:"auto", WebkitOverflowScrolling:"touch" }}>
      <div style={{ maxWidth:480, margin:"0 auto", minHeight:"100vh", background:C.bg, paddingBottom:40 }}>
        <div style={{ background:C.headerBg, borderBottom:`1px solid ${C.border}`, padding:"12px 16px", position:"sticky", top:0, zIndex:60, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontSize:13, fontWeight:800, color:"#2563eb" }}>JFP Enterprises Inc</div>
            <div style={{ fontSize:14, fontWeight:700, color:C.text }}>{report.foreman} — {fmtDate(report.date)}</div>
            {isWorker && <div style={{ fontSize:11, color:C.blue, fontWeight:600, marginTop:2 }}>Non-Foreman Report</div>}
          </div>
          <button onClick={onClose} style={{ background:C.input, border:`1px solid ${C.border}`, borderRadius:8, padding:"6px 12px", fontSize:13, fontWeight:600, color:C.dim, cursor:"pointer" }}>✕</button>
        </div>
        <div style={{ padding:"16px 20px 0" }}>
          {isWorker ? (
            <>
              {jobs.map((job, ji) => (
                <div key={ji} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:16, marginBottom:12 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:C.accent, letterSpacing:1.5, textTransform:"uppercase" }}>Job {ji + 1}</div>
                    <div style={{ ...{display:"inline-block", background:`${C.accent}18`, color:C.accent, fontSize:13, fontWeight:600, padding:"3px 10px", borderRadius:6} }}>{job.hours}h</div>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
                    <div><div style={{ fontSize:10, fontWeight:700, color:C.dim, textTransform:"uppercase", letterSpacing:1 }}>Job #</div><div style={{ fontSize:15, fontWeight:600, marginTop:2, color:C.text }}>{job.jobNumber}</div></div>
                    <div><div style={{ fontSize:10, fontWeight:700, color:C.dim, textTransform:"uppercase", letterSpacing:1 }}>Hours</div><div style={{ fontSize:15, fontWeight:600, marginTop:2, color:C.text }}>{job.hours}h</div></div>
                  </div>
                  {job.description && <div style={{ fontSize:14, lineHeight:1.5, color:C.text, borderLeft:`3px solid #2563eb`, paddingLeft:10, marginTop:6 }}>{job.description}</div>}
                  {job.equipment && <div style={{ fontSize:13, color:C.dim, marginTop:6 }}>Equipment: {job.equipment}</div>}
                </div>
              ))}
              <div style={{ fontSize:12, color:C.dim, marginBottom:8 }}>Total: {jobs.reduce((s, j) => s + (parseFloat(j.hours) || 0), 0)}h across {jobs.filter(j => j.jobNumber).length} jobs</div>
            </>
          ) : (
            <>
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:16, marginBottom:14 }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
                  <div><div style={{ fontSize:10, fontWeight:700, letterSpacing:1.5, color:C.dim, textTransform:"uppercase" }}>Job Site</div><div style={{ fontSize:15, fontWeight:600, marginTop:2, color:C.text }}>{report.site}</div></div>
                  <div><div style={{ fontSize:10, fontWeight:700, letterSpacing:1.5, color:C.dim, textTransform:"uppercase" }}>Total Hours</div><div style={{ fontSize:15, fontWeight:600, marginTop:2, color:C.text }}>{report.totalHrs}h</div></div>
                </div>
                <div style={{ display:"flex", gap:16, marginTop:6 }}>
                  <div style={{ fontSize:13, color:report.safetyTalk ? C.green : C.dim }}>{report.safetyTalk ? "✓" : "✗"} Safety Talk</div>
                  <div style={{ fontSize:13, color:report.subsOnSite ? C.accent : C.dim }}>{report.subsOnSite ? "✓" : "✗"} Subs</div>
                </div>
                {report.subsOnSite && subs.length > 0 && <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop:8 }}>{subs.map((s, i) => <span key={i} style={{ background:C.border, color:C.text, fontSize:12, padding:"3px 9px", borderRadius:6 }}>{s}</span>)}</div>}
              </div>
              {report.workDesc && <div style={{ marginBottom:14 }}><div style={{ fontSize:10, fontWeight:700, letterSpacing:1.5, color:C.dim, textTransform:"uppercase", marginBottom:6 }}>Description of Work</div><div style={{ background:C.card, border:`1px solid ${C.border}`, borderLeft:`3px solid #2563eb`, borderRadius:"0 12px 12px 0", padding:14, fontSize:14, lineHeight:1.6, color:C.text }}>{report.workDesc}</div></div>}
              {eqList.length > 0 && <div style={{ marginBottom:14 }}><div style={{ fontSize:10, fontWeight:700, letterSpacing:1.5, color:C.dim, textTransform:"uppercase", marginBottom:6 }}>Equipment</div>{eqList.map((eq, i) => <div key={i} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"10px 14px", marginBottom:6, display:"flex", justifyContent:"space-between" }}><span style={{ fontWeight:600, color:C.text }}>{eq.name}</span><span style={{ color:C.accent, fontWeight:600 }}>{eq.hours}h</span></div>)}</div>}
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:1.5, color:C.dim, textTransform:"uppercase", marginBottom:8 }}>Crew — {crew.length}</div>
              {crew.map((c, i) => (
                <div key={i} style={{ background:C.card, border:`1px solid ${c.isForeman ? `${C.green}44` : C.border}`, borderRadius:12, padding:12, marginBottom:8 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}><span style={{ fontSize:15, fontWeight:600, color:C.text }}>{c.name}</span>{c.isForeman && <span style={{ fontSize:9, fontWeight:700, color:C.green, background:C.greenBg, padding:"2px 6px", borderRadius:4 }}>FOREMAN</span>}</div>
                    <span style={{ background:`${C.accent}18`, color:C.accent, fontSize:13, fontWeight:600, padding:"2px 9px", borderRadius:6 }}>{c.hours}h</span>
                  </div>
                  {c.note && <div style={{ fontSize:12, color:C.dim, marginTop:4, fontStyle:"italic" }}>Note: {c.note}</div>}
                </div>
              ))}
            </>
          )}
          <div style={{ fontSize:11, color:C.dim, marginTop:12 }}>Submitted {report.at}</div>
          <button onClick={() => {
            const rpt = report; const jbs = (rpt.jobs || []);
            let txt;
            if (isWorker) {
              const jLines = jbs.map(j => `  Job #${j.jobNumber}: ${j.hours}h — ${j.description}${j.equipment ? ` (Equip: ${j.equipment})` : ""}`).join("\n");
              txt = `NON-FOREMAN REPORT\nWorker: ${rpt.foreman}\nDate: ${fmtDate(rpt.date)}\n\nJOBS:\n${jLines}\n\nTotal: ${jbs.reduce((s,j)=>s+(parseFloat(j.hours)||0),0)}h`;
            } else {
              const cl = (rpt.crew||[]).map(c=>`  ${c.name}${c.isForeman?" (FM)":""}: ${c.hours}h${c.note?` — ${c.note}`:""}`).join("\n");
              const el = (rpt.equipmentList||[]).length ? "\nEQUIP:\n"+(rpt.equipmentList||[]).map(eq=>`  ${eq.name}: ${eq.hours}h`).join("\n") : "";
              txt = `FOREMAN REPORT\nForeman: ${rpt.foreman}\nDate: ${fmtDate(rpt.date)}\nSite: ${rpt.site}\nSafety: ${rpt.safetyTalk?"Yes":"No"}\nSubs: ${rpt.subsOnSite?(rpt.subs||[]).join(", ")||"Yes":"No"}${el}\n\nWORK:\n${rpt.workDesc}\n\nCREW (${(rpt.crew||[]).length}, ${rpt.totalHrs}h):\n${cl}`;
            }
            const subj = encodeURIComponent(`Field Report — ${rpt.foreman} — ${fmtDate(rpt.date)}`);
            const body = encodeURIComponent(`JFP Enterprises Inc\n\n${txt}\n\nSubmitted: ${rpt.at}`);
            window.open(`mailto:?subject=${subj}&body=${body}`, "_self");
          }} style={{ width:"100%", marginTop:16, padding:14, fontSize:14, fontWeight:700, borderRadius:12, background:`${C.blue}15`, color:C.blue, border:`1.5px solid ${C.blue}44`, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
            ✉ Email This Report
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════ MAIN APP ═══════════
export default function App() {
  const [splash, setSplash] = useState(true);
  const [isDark, setIsDark] = useState(true);
  const T = isDark ? themes.dark : themes.light;

  const [savedUser, setSavedUser] = useState(() => { try { return JSON.parse(localStorage.getItem("jfp-user")); } catch { return null; } });
  const [showAllForemen, setShowAllForemen] = useState(false);
  const [allForemen, setAllForemen] = useState(DEFAULT_FOREMEN);
  const [allSites, setAllSites] = useState(DEFAULT_SITES);
  const [allEmployees, setAllEmployees] = useState(DEFAULT_EMPLOYEES);
  const [allWorkers, setAllWorkers] = useState(DEFAULT_WORKERS);
  const [pings, setPings] = useState([]);
  const [monthReports, setMonthReports] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const [foreman, setForeman] = useState("");
  const [reportType, setReportType] = useState("foreman");
  const [lastSession, setLastSession] = useState(null);
  const [site, setSite] = useState("");
  const [customSite, setCustomSite] = useState("");
  const [showAddSite, setShowAddSite] = useState(false);
  const [date, setDate] = useState(todayStr());
  const [crew, setCrew] = useState([]);
  const [showAddWorker, setShowAddWorker] = useState(false);
  const [customWorkerName, setCustomWorkerName] = useState("");
  const [safetyTalk, setSafetyTalk] = useState(false);
  const [subsOnSite, setSubsOnSite] = useState(false);
  const [subs, setSubs] = useState([]);
  const [subInput, setSubInput] = useState("");
  const [workDesc, setWorkDesc] = useState("");
  const [step, setStep] = useState("login");
  const [sending, setSending] = useState(false);
  const [errors, setErrors] = useState({});
  const [editModal, setEditModal] = useState(null);
  const [addModal, setAddModal] = useState(null);
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calSelectedDay, setCalSelectedDay] = useState(null);
  const [viewingReport, setViewingReport] = useState(null);
  const [hasEquipment, setHasEquipment] = useState(false);
  const [equipmentList, setEquipmentList] = useState([]);
  const [eqNameInput, setEqNameInput] = useState("");
  const [eqHoursInput, setEqHoursInput] = useState("");
  const [recipEmail, setRecipEmail] = useState("");
  const [recipName, setRecipName] = useState("");

  // Non-foreman multi-job
  const [jobs, setJobs] = useState([{ id: uid(), jobNumber: "", hours: "", description: "", equipment: "" }]);

  // Overtime confirm
  const [overtimeConfirmed, setOvertimeConfirmed] = useState(false);
  const [pendingOvertimeHours, setPendingOvertimeHours] = useState(null);
  const [overtimeCallback, setOvertimeCallback] = useState(null);

  // Duplicate date warning
  const [dupeDateWarning, setDupeDateWarning] = useState(null);

  const totalHrs = crew.reduce((s, c) => s + (parseFloat(c.hours) || 0), 0);
  const totalJobHrs = jobs.reduce((s, j) => s + (parseFloat(j.hours) || 0), 0);
  const calYM = `${calYear}-${String(calMonth + 1).padStart(2, "0")}`;

  const loadMonth = useCallback(async (ym) => { try { const { reports } = await api.getReportsByMonth(ym); setMonthReports(reports); } catch (e) { console.error(e); } }, []);
  useEffect(() => { if (step === "admin") { loadMonth(calYM); api.loadRecipients().then(r => setRecipients(r.recipients)).catch(console.error); } }, [step, calYM, loadMonth]);

  useEffect(() => { (async () => {
    try {
      const [lists, { pings: p }] = await Promise.all([api.loadLists(), api.loadPings()]);
      setAllForemen(lists.foremen); setAllSites(lists.sites); setAllEmployees(lists.employees); setAllWorkers(lists.workers || []);
      setPings(p);
    } catch (e) { console.error("Load error:", e); }
    setLoaded(true);
  })(); }, []);

  const selectUser = (name, type) => {
    setForeman(name); setReportType(type); setOvertimeConfirmed(false);
    if (type === "foreman") { setSavedUser({ name, type }); localStorage.setItem("jfp-user", JSON.stringify({ name, type })); }
    setStep(type === "foreman" ? "form" : "workerForm");
  };

  const goHome = () => { setStep("login"); setErrors({}); setForeman(""); setCrew([]); setSite(""); setWorkDesc(""); setJobs([{ id: uid(), jobNumber: "", hours: "", description: "", equipment: "" }]); setReportType("foreman"); setShowAllForemen(false); setHasEquipment(false); setEquipmentList([]); setDate(todayStr()); setOvertimeConfirmed(false); };

  useEffect(() => { if (!foreman || reportType !== "foreman") return; (async () => {
    try {
      const { session: prev } = await api.getSession(foreman);
      setLastSession(prev);
      if (prev && prev.site) {
        setSite(prev.site || ""); setWorkDesc(prev.workDesc || ""); setSafetyTalk(prev.safetyTalk || false);
        setSubsOnSite(prev.subsOnSite || false); setSubs(prev.subs || []); setHasEquipment(prev.hasEquipment || false);
        setEquipmentList(prev.equipmentList || []);
        const base = [{ id: uid(), name: foreman, hours: prev.foremanHours || "", note: "", isForeman: true }];
        const crewEntries = (prev.crewData || []).filter(c => c.name !== foreman).map(c => ({ id: uid(), name: c.name, hours: c.hours || "", note: "", isForeman: false }));
        setCrew([...base, ...crewEntries]);
      } else { setCrew([{ id: uid(), name: foreman, hours: "", note: "", isForeman: true }]); }
    } catch (e) { console.error(e); setCrew([{ id: uid(), name: foreman, hours: "", note: "", isForeman: true }]); }
  })(); }, [foreman, reportType]);

  useEffect(() => { if (!foreman || reportType !== "worker") return; (async () => {
    try {
      const { session: prev } = await api.getSession(foreman);
      if (prev && prev.jobs && prev.jobs.length) { setJobs(prev.jobs.map(j => ({ ...j, id: uid() }))); }
      else { setJobs([{ id: uid(), jobNumber: "", hours: "", description: "", equipment: "" }]); }
    } catch { setJobs([{ id: uid(), jobNumber: "", hours: "", description: "", equipment: "" }]); }
  })(); }, [foreman, reportType]);

  // ── Check hours and trigger overtime popup ──
  const checkOvertimeAndProceed = (callback) => {
    if (overtimeConfirmed) { callback(); return; }
    let overHrs = null;
    if (reportType === "foreman") {
      const found = crew.find(c => parseFloat(c.hours) > 8);
      if (found) overHrs = found.hours;
    } else {
      const found = jobs.find(j => parseFloat(j.hours) > 8);
      if (found) overHrs = found.hours;
    }
    if (overHrs) {
      setPendingOvertimeHours(overHrs);
      setOvertimeCallback(() => callback);
    } else {
      callback();
    }
  };

  const confirmOvertime = () => {
    setOvertimeConfirmed(true);
    setPendingOvertimeHours(null);
    if (overtimeCallback) overtimeCallback();
    setOvertimeCallback(null);
  };

  const cancelOvertime = () => {
    setPendingOvertimeHours(null);
    setOvertimeCallback(null);
  };

  // pingAdmin not needed in production - handled by addNewSite/addNewEmployee above

  const handleDateChange = (newDate) => { setDate(newDate); };
  const editList = async (type, idx, nv) => { const map = { foremen:allForemen, employees:allEmployees, sites:allSites, workers:allWorkers }; const old = map[type][idx]; const fn = { foremen:api.editForeman, employees:api.editEmployee, sites:api.editSite, workers:api.editWorker }[type]; const r = await fn(old, nv); const setter = { foremen:setAllForemen, employees:setAllEmployees, sites:setAllSites, workers:setAllWorkers }[type]; setter(r[type]); if (type==="sites"&&site===old) setSite(nv); if (type==="employees") setCrew(crew.map(c=>c.name===old?{...c,name:nv}:c)); };
  const deleteList = async (type, idx) => { const map = { foremen:allForemen, employees:allEmployees, sites:allSites, workers:allWorkers }; const nm = map[type][idx]; const fn = { foremen:api.deleteForeman, employees:api.deleteEmployee, sites:api.deleteSite, workers:api.deleteWorker }[type]; const r = await fn(nm); const setter = { foremen:setAllForemen, employees:setAllEmployees, sites:setAllSites, workers:setAllWorkers }[type]; setter(r[type]); if (type==="sites"&&site===nm) setSite(""); if (type==="employees") setCrew(crew.filter(c=>c.name!==nm)); };
  const addListFn = async (type, name) => { const fn = { foremen:api.addForeman, employees:api.addEmployee, sites:api.addSite, workers:api.addWorker }[type]; const r = await fn(name); const setter = { foremen:setAllForemen, employees:setAllEmployees, sites:setAllSites, workers:setAllWorkers }[type]; setter(r[type]); };

  const addNewSite = async () => { const s = customSite.trim(); if (!s||allSites.includes(s)) return; const r = await api.addSite(s); setAllSites(r.sites); setSite(s); setCustomSite(""); setShowAddSite(false); await api.addPing(`New job site: "${s}"`, foreman); const p = await api.loadPings(); setPings(p.pings); };
  const addNewEmployee = async () => { const n = customWorkerName.trim(); if (!n||allEmployees.includes(n)) return; const r = await api.addEmployee(n); setAllEmployees(r.employees); setCrew([...crew, { id: uid(), name: n, hours: "", note: "", isForeman: false }]); setCustomWorkerName(""); setShowAddWorker(false); await api.addPing(`New employee: "${n}"`, foreman); const p = await api.loadPings(); setPings(p.pings); };
  const addEq = () => { const n = eqNameInput.trim(), h = eqHoursInput.trim(); if (!n || !h) return; setEquipmentList([...equipmentList, { name: n, hours: parseFloat(h) || 0 }]); setEqNameInput(""); setEqHoursInput(""); };
  const toggleEmployee = (name) => { if (crew.find(c => c.name === name)) setCrew(crew.filter(c => c.name !== name)); else setCrew([...crew, { id: uid(), name, hours: "", note: "", isForeman: false }]); };
  const updateCrew = (id, f, v) => setCrew(crew.map(c => c.id === id ? { ...c, [f]: v } : c));
  const addSub = () => { const s = subInput.trim(); if (!s) return; setSubs([...subs, s]); setSubInput(""); };

  // ── Multi-job helpers ──
  const updateJob = (id, field, val) => {
    const updated = jobs.map(j => j.id === id ? { ...j, [field]: val } : j);
    setJobs(updated);
    // Auto-add new job slot if last job has a jobNumber entered
    const last = updated[updated.length - 1];
    if (last && last.jobNumber.trim() && field === "jobNumber") {
      setJobs([...updated, { id: uid(), jobNumber: "", hours: "", description: "", equipment: "" }]);
    }
  };
  const removeJob = (id) => { if (jobs.length > 1) setJobs(jobs.filter(j => j.id !== id)); };

  const validate = () => { const e = {}; if (!site) e.site = true; if (!crew.length) e.crew = true; if (crew.some(c => !c.hours || parseFloat(c.hours) <= 0)) e.hours = true; if (!workDesc.trim()) e.workDesc = true; if (subsOnSite && !subs.length) e.subs = true; setErrors(e); return !Object.keys(e).length; };
  const validateWorker = () => {
    const e = {};
    const filledJobs = jobs.filter(j => j.jobNumber.trim());
    if (!filledJobs.length) e.jobs = true;
    if (filledJobs.some(j => !j.hours || parseFloat(j.hours) <= 0)) e.jobHours = true;
    if (filledJobs.some(j => !j.description.trim())) e.jobDesc = true;
    setErrors(e); return !Object.keys(e).length;
  };

  const handleSubmit = async () => {
    setSending(true);
    try {
      const fmCrew = crew.find(c => c.isForeman);
      const sessionData = { site, workDesc, safetyTalk, subsOnSite, subs, hasEquipment, equipmentList, foremanHours: fmCrew ? fmCrew.hours : "", crewData: crew.filter(c=>!c.isForeman).map(c=>({name:c.name,hours:c.hours})) };
      await api.submitReport({ reportType:"foreman", foreman, site, date, crew, safetyTalk, subsOnSite, subs, workDesc, totalHrs, equipmentList: hasEquipment ? equipmentList : [], sessionData });
      setWorkDesc(""); setSubs([]); setSubsOnSite(false); setSafetyTalk(false); setHasEquipment(false); setEquipmentList([]);
      setCrew(crew.map(c => ({ ...c, hours: "", note: "" }))); setSending(false); setStep("done");
    } catch (e) { alert("Submit failed: " + e.message); setSending(false); }
  };

  const handleWorkerSubmit = async () => {
    setSending(true);
    try {
      const filledJobs = jobs.filter(j => j.jobNumber.trim());
      const sessionData = { jobs: filledJobs };
      await api.submitReport({ reportType:"worker", foreman, site:"", date, crew:[], safetyTalk:false, subsOnSite:false, subs:[], workDesc:"", totalHrs:totalJobHrs, jobs:filledJobs, sessionData });
      setSending(false); setStep("done");
    } catch (e) { alert("Submit failed: " + e.message); setSending(false); }
  };

  const submitAnotherDay = () => {
    setErrors({});
    if (reportType === "foreman") { setCrew(crew.map(c => ({ ...c, hours: "", note: "" }))); setWorkDesc(""); setSubs([]); setSubsOnSite(false); setSafetyTalk(false); setHasEquipment(false); setEquipmentList([]); setStep("form"); }
    else { setJobs(jobs.map(j => ({ ...j, id: uid(), hours: "", description: "" }))); setStep("workerForm"); }
  };

  const doClearPing = async (id) => { const r = await api.deletePing(id); setPings(r.pings); };
  const doClearAll = async () => { await api.clearPings(); setPings([]); };

  // ── Email helpers ──
  const buildReportText = (rpt) => {
    const isW = (rpt.report_type||rpt.reportType) === "worker";
    const rJobs = rpt.jobs_data||rpt.jobs||[];
    const parsedJobs = typeof rJobs === "string" ? JSON.parse(rJobs) : rJobs;
    if (isW) {
      const jbs = parsedJobs.map(j => `  Job #${j.jobNumber}: ${j.hours}h — ${j.description}${j.equipment ? ` (Equipment: ${j.equipment})` : ""}`).join("\n");
      return `NON-FOREMAN REPORT\nWorker: ${rpt.foreman}\nDate: ${fmtDate(rpt.date)}\n\nJOBS:\n${jbs}\n\nTotal: ${parsedJobs.reduce((s, j) => s + (parseFloat(j.hours) || 0), 0)}h`;
    }
    const crw = rpt.crew || [];
    const eqRaw = rpt.equipment_list||rpt.equipmentList||[]; const eq = typeof eqRaw === "string" ? JSON.parse(eqRaw) : eqRaw;
    const subsRaw = rpt.subs_list||rpt.subs||[]; const sub = typeof subsRaw === "string" ? JSON.parse(subsRaw) : subsRaw;
    const crewLines = crw.map(c => `  ${c.name}${(c.is_foreman||c.isForeman) ? " (Foreman)" : ""}: ${c.hours}h${c.note ? ` — ${c.note}` : ""}`).join("\n");
    const eqLines = eq.length ? "\n\nEQUIPMENT:\n" + eq.map(e => `  ${e.name}: ${e.hours}h`).join("\n") : "";
    const hrs = rpt.total_hrs||rpt.totalHrs||0;
    const desc = rpt.work_desc||rpt.workDesc||"";
    const safe = rpt.safety_talk||rpt.safetyTalk;
    const subOn = rpt.subs_on_site||rpt.subsOnSite;
    return `FOREMAN REPORT\nForeman: ${rpt.foreman}\nDate: ${fmtDate(rpt.date)}\nJob Site: ${rpt.site}\nSafety Talk: ${safe ? "Yes" : "No"}\nSubs: ${subOn ? sub.join(", ") || "Yes" : "No"}${eqLines}\n\nDESCRIPTION:\n${desc}\n\nCREW (${crw.length}, ${hrs}h):\n${crewLines}`;
  };

  const emailReport = (rpt) => {
    const subject = encodeURIComponent(`Field Report — ${rpt.foreman} — ${fmtDate(rpt.date)}${rpt.site ? " — " + rpt.site : ""}`);
    const body = encodeURIComponent(`JFP Enterprises Inc\nGeneral · Industrial · Commercial\n\n${buildReportText(rpt)}\n\nSubmitted: ${rpt.submitted_at||rpt.at}`);
    window.open(`mailto:?subject=${subject}&body=${body}`, "_self");
  };

  const emailAllDay = (reports) => {
    if (!reports.length) return;
    const dateStr = fmtDate(reports[0].date);
    const subject = encodeURIComponent(`All Field Reports — ${dateStr} — JFP Enterprises Inc`);
    const sections = reports.map(r => buildReportText(r)).join("\n\n" + "─".repeat(40) + "\n\n");
    const body = encodeURIComponent(`JFP Enterprises Inc\nGeneral · Industrial · Commercial\n\nDAILY REPORTS — ${dateStr}\n${reports.length} reports\n\n${"─".repeat(40)}\n\n${sections}\n\n${"─".repeat(40)}\nGenerated from JFP Field Report System`);
    window.open(`mailto:?subject=${subject}&body=${body}`, "_self");
  };
  const calDateStr = d => `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const handleAddModal = async (v) => { if (!addModal) return; await addListFn(addModal.type, v); setAddModal(null); };
  const addRecipient = async () => { const em = recipEmail.trim().toLowerCase(); if (!em) return; const r = await api.addRecipient(em, recipName.trim()||null); setRecipients(r.recipients); setRecipEmail(""); setRecipName(""); };
  const toggleRecipient = async (id) => { const r = await api.toggleRecipient(id, !recipients.find(x=>x.id===id)?.active); setRecipients(r.recipients); };
  const deleteRecipient = async (id) => { const r = await api.deleteRecipient(id); setRecipients(r.recipients); };

  // Styles
  const wrap = { minHeight: "100vh", background: T.bgGrad, fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", color: T.text, maxWidth: 480, margin: "0 auto", paddingBottom: 100 };
  const lbl = { display: "block", fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: T.dim, marginBottom: 8 };
  const inp = (err) => ({ width: "100%", padding: "13px 14px", fontSize: 16, background: T.input, border: `1.5px solid ${err ? T.danger : T.border}`, borderRadius: 10, color: T.text, outline: "none", boxSizing: "border-box", WebkitAppearance: "none", fontFamily: "inherit" });
  const plusEl = fn => (<button onClick={fn} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 38, height: 38, borderRadius: 10, border: `1.5px dashed ${T.border}`, background: "transparent", color: T.accent, fontSize: 20, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>+</button>);
  const btnMain = dis => ({ width: "100%", padding: 16, fontSize: 16, fontWeight: 700, background: dis ? T.border : `linear-gradient(135deg,${T.accent} 0%,${T.accentDim} 100%)`, color: dis ? T.dim : "#000", border: "none", borderRadius: 12, cursor: dis ? "default" : "pointer" });
  const btnGhost = { width: "100%", padding: 14, fontSize: 15, fontWeight: 600, background: "transparent", color: T.dim, border: `1.5px solid ${T.border}`, borderRadius: 12, cursor: "pointer" };
  const sec = { padding: "18px 20px 0" };
  const divider = { height: 1, background: T.border, margin: "18px 20px 0" };
  const chk = on => ({ width: 28, height: 28, borderRadius: 8, flexShrink: 0, border: `2px solid ${on ? T.green : T.border}`, background: on ? T.greenBg : T.checkBg, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 16, color: T.green, fontWeight: 700 });
  const pill = { display: "inline-block", background: `${T.accent}18`, color: T.accent, fontSize: 13, fontWeight: 600, padding: "3px 10px", borderRadius: 6 };
  const ThemeBtn = (<button onClick={() => setIsDark(!isDark)} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: 8, background: T.input, border: `1px solid ${T.border}`, cursor: "pointer", fontSize: 16, color: T.dim }}>{isDark ? "☀" : "🌙"}</button>);
  const BackBtn = (<button onClick={goHome} style={{ background: T.input, border: `1px solid ${T.border}`, borderRadius: 8, padding: "6px 12px", fontSize: 13, fontWeight: 600, color: T.dim, cursor: "pointer" }}>← Back</button>);
  const Hdr = ({ children, right }) => (<div style={{ background: T.headerBg, borderBottom: `1px solid ${T.border}`, padding: "10px 16px", position: "sticky", top: 0, zIndex: 50, display: "flex", justifyContent: "space-between", alignItems: "center" }}><div>{children}</div>{right && <div style={{ display: "flex", alignItems: "center", gap: 6 }}>{right}</div>}</div>);
  const Brand = ({ sub }) => (<><div style={{ fontSize: 13, fontWeight: 800, color: "#2563eb" }}>JFP Enterprises Inc</div><div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{sub}</div></>);

  if (splash) return (<Splash onFinish={() => setSplash(false)} />);
  if (!loaded) return (<div style={{ ...wrap, display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ color: T.dim }}>Loading...</div></div>);

  // ═══════════ LOGIN ═══════════
  if (step === "login") {
    const otherForemen = savedUser ? allForemen.filter(f => f !== savedUser.name) : [];
    return (
      <div style={{ ...wrap, position: "relative" }}>
        <div style={{ position: "absolute", top: 16, right: 20, zIndex: 10 }}>{ThemeBtn}</div>
        <div style={{ padding: "40px 20px 10px", textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#2563eb" }}>JFP Enterprises Inc</div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 3, color: T.dim, textTransform: "uppercase", marginTop: 6 }}>General · Industrial · Commercial</div>
          <div style={{ fontSize: 12, letterSpacing: 3.5, color: "#4a7cff", textTransform: "uppercase", marginTop: 16 }}>Daily Field Report</div>
        </div>
        <div style={{ padding: "24px 20px 0" }}>
          <label style={{ ...lbl, marginBottom: 14 }}>Foreman Report</label>
          {savedUser ? (<>
            <button onClick={() => selectUser(savedUser.name, "foreman")} style={{ width: "100%", padding: "16px 18px", fontSize: 18, fontWeight: 700, background: T.card, border: `2px solid #2563eb44`, borderRadius: 12, color: T.text, cursor: "pointer", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span>{savedUser.name}</span><span style={{ color: "#2563eb", fontSize: 18 }}>→</span></button>
            {!showAllForemen && otherForemen.length > 0 && (
              <button onClick={() => setShowAllForemen(true)} style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none", color: T.dim, cursor: "pointer", fontSize: 13, padding: "8px 0" }}>
                <span style={{ width: 24, height: 24, borderRadius: 6, border: `1.5px dashed ${T.border}`, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: T.accent }}>+</span>
                <span>Not {savedUser.name}?</span></button>)}
            {showAllForemen && otherForemen.map(f => (
              <button key={f} onClick={() => { selectUser(f, "foreman"); setShowAllForemen(false); }} style={{ width: "100%", padding: "13px 18px", fontSize: 16, fontWeight: 600, background: T.card, border: `1.5px solid ${T.border}`, borderRadius: 12, color: T.text, cursor: "pointer", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span>{f}</span><span style={{ color: T.dim, fontSize: 16 }}>→</span></button>))}
          </>) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {allForemen.map(f => (
                <button key={f} onClick={() => selectUser(f, "foreman")} style={{ padding: "15px 18px", fontSize: 17, fontWeight: 600, background: T.card, border: `1.5px solid ${T.border}`, borderRadius: 12, color: T.text, cursor: "pointer", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center" }}><span>{f}</span><span style={{ color: T.dim, fontSize: 18 }}>→</span></button>))}
            </div>)}
        </div>
        <div style={{ padding: "24px 20px 0" }}><div style={divider} /><div style={{ paddingTop: 18 }}>
          <label style={{ ...lbl, marginBottom: 12 }}>Non-Foreman Time</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {allWorkers.map(w => (<button key={w} onClick={() => selectUser(w, "worker")} style={{ padding: "10px 16px", fontSize: 14, fontWeight: 600, background: T.card, border: `1.5px solid ${T.border}`, borderRadius: 10, color: T.text, cursor: "pointer" }}>{w}</button>))}
            <button onClick={() => setAddModal({ type: "_custom", title: "Custom Worker", placeholder: "Name" })} style={{ padding: "10px 16px", fontSize: 14, fontWeight: 600, background: T.input, border: `1.5px dashed ${T.border}`, borderRadius: 10, color: T.accent, cursor: "pointer" }}>+ Custom</button>
          </div>
        </div></div>
        <div style={{ padding: "20px" }}>
          <button onClick={() => setStep("admin")} style={{ ...btnGhost, fontSize: 13, padding: 10 }}>Admin Panel {pings.length > 0 && <span style={{ color: T.accent, fontWeight: 700 }}>({pings.length})</span>}</button>
        </div>
        {addModal && addModal.type === "_custom" && (<AddModal title="Custom Worker" placeholder="Name" C={T} onClose={() => setAddModal(null)} onAdd={v => { setAddModal(null); selectUser(v, "worker"); }} />)}
      </div>
    );
  }

  // ═══════════ WORKER FORM (multi-job) ═══════════
  if (step === "workerForm") {
    const filledJobs = jobs.filter(j => j.jobNumber.trim());
    return (
      <div style={wrap}>
        <Hdr right={<>{ThemeBtn}{BackBtn}</>}><Brand sub="Non-Foreman Report" /></Hdr>
        <div style={{ background: `${T.accent}0a`, borderBottom: `1px solid ${T.accent}18`, padding: "8px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#2563eb" }}>{foreman}</span>
          <span style={{ ...pill, fontSize: 12, padding: "4px 10px" }}>{filledJobs.length} job{filledJobs.length !== 1 ? "s" : ""} · {totalJobHrs}h</span>
        </div>
        <div style={sec}><label style={lbl}>Date</label><input type="date" style={inp(false)} value={date} onChange={e => handleDateChange(e.target.value)} /></div>

        {jobs.map((job, idx) => (
          <div key={job.id} style={sec}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <label style={{ ...lbl, marginBottom: 0 }}>Job {idx + 1} {idx === 0 && errors.jobs && <span style={{ color: T.danger }}>— enter at least one job</span>}</label>
              {jobs.length > 1 && job.jobNumber.trim() === "" && idx === jobs.length - 1 ? null : jobs.length > 1 && (
                <button onClick={() => removeJob(job.id)} style={{ fontSize: 12, color: T.danger, background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Remove</button>
              )}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 80px", gap: 8, marginBottom: 8 }}>
                <input style={inp(errors.jobs && !job.jobNumber.trim())} placeholder="Job #" value={job.jobNumber} onChange={e => updateJob(job.id, "jobNumber", e.target.value)} />
                <input type="number" inputMode="decimal" step="0.5" style={inp(errors.jobHours && job.jobNumber.trim() && (!job.hours || parseFloat(job.hours) <= 0))} placeholder="Hrs" value={job.hours} onChange={e => updateJob(job.id, "hours", e.target.value)} />
              </div>
              <textarea style={{ ...inp(errors.jobDesc && job.jobNumber.trim() && !job.description.trim()), minHeight: 60, resize: "vertical", marginBottom: 8 }} placeholder="Description of work" value={job.description} onChange={e => updateJob(job.id, "description", e.target.value)} />
              <input style={{ ...inp(false), fontSize: 14, padding: "10px 14px", color: T.dim }} placeholder="Equipment used (optional)" value={job.equipment} onChange={e => updateJob(job.id, "equipment", e.target.value)} />
            </div>
          </div>
        ))}

        <div style={{ padding: "24px 20px" }}>
          <button style={btnMain(false)} onClick={() => { if (validateWorker()) checkOvertimeAndProceed(() => setStep("workerReview")); }}>Review & Submit →</button>
        </div>
        {pendingOvertimeHours && (<OvertimeConfirm hours={pendingOvertimeHours} onConfirm={confirmOvertime} onCancel={cancelOvertime} C={T} />)}
        {dupeDateWarning && (<DupeDateWarning date={fmtDate(dupeDateWarning)} onContinue={() => setDupeDateWarning(null)} onChangeDate={() => { setDupeDateWarning(null); setDate(todayStr()); }} C={T} />)}
      </div>
    );
  }

  // ═══════════ WORKER REVIEW ═══════════
  if (step === "workerReview") {
    const filledJobs = jobs.filter(j => j.jobNumber.trim());
    return (
      <div style={wrap}>
        <Hdr><Brand sub="Review Report" /></Hdr>
        <div style={sec}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 16, marginBottom: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div><div style={{ ...lbl, marginBottom: 2 }}>Worker</div><div style={{ fontSize: 15, fontWeight: 600 }}>{foreman}</div></div>
              <div><div style={{ ...lbl, marginBottom: 2 }}>Date</div><div style={{ fontSize: 15, fontWeight: 600 }}>{fmtDate(date)}</div></div>
            </div>
            <div style={{ marginTop: 10 }}><div style={{ ...lbl, marginBottom: 2 }}>Total</div><div style={{ fontSize: 15, fontWeight: 600 }}>{filledJobs.length} jobs · {totalJobHrs}h</div></div>
          </div>
          {filledJobs.map((job, i) => (
            <div key={i} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 14, marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: T.accent }}>Job #{job.jobNumber}</span>
                <span style={pill}>{job.hours}h</span>
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.5, borderLeft: `3px solid #2563eb`, paddingLeft: 10 }}>{job.description}</div>
              {job.equipment && <div style={{ fontSize: 13, color: T.dim, marginTop: 4 }}>Equipment: {job.equipment}</div>}
            </div>
          ))}
          <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
            <button style={btnMain(sending)} onClick={handleWorkerSubmit} disabled={sending}>{sending ? "Sending..." : "Submit Report"}</button>
            <button style={btnGhost} onClick={() => setStep("workerForm")}>← Edit</button>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════ DONE ═══════════
  if (step === "done") return (
    <div style={wrap}>
      <Hdr><Brand sub="Field Report" /></Hdr>
      <div style={{ padding: "40px 20px", textAlign: "center" }}>
        <div style={{ width: 68, height: 68, borderRadius: "50%", background: T.greenBg, border: `2px solid ${T.green}33`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px", fontSize: 30, color: T.green }}>✓</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 6px" }}>Sent</h2>
        <p style={{ fontSize: 14, color: T.dim, margin: "0 0 6px" }}>{fmtDate(date)} · {foreman}</p>
        {reportType === "foreman" && <p style={{ fontSize: 13, color: T.dim, margin: "0 0 24px" }}>{site} · {totalHrs}h · {crew.length} crew</p>}
        {reportType === "worker" && <p style={{ fontSize: 13, color: T.dim, margin: "0 0 24px" }}>{jobs.filter(j => j.jobNumber?.trim()).length} jobs · {totalJobHrs}h</p>}
        <button style={{ ...btnMain(false), marginBottom: 10 }} onClick={submitAnotherDay}>Submit for Another Day</button>
        <div style={{ fontSize: 12, color: T.dim, marginBottom: 20 }}>Same {reportType === "foreman" ? "crew & site" : "jobs"} — just pick a new date</div>
        <button style={btnGhost} onClick={() => {
          if (reportType === "foreman") { setStep("form"); setErrors({}); }
          else { setJobs([{ id: uid(), jobNumber: "", hours: "", description: "", equipment: "" }]); setStep("workerForm"); setErrors({}); }
          setDate(todayStr());
        }}>New Report</button>
        <button style={{ ...btnGhost, marginTop: 10 }} onClick={goHome}>Done</button>
      </div>
    </div>
  );

  // ═══════════ ADMIN ═══════════
  if (step === "admin") {
    const days = monthDays(calYear, calMonth), offset = firstDow(calYear, calMonth);
    const mN = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    const dN = ["Su","Mo","Tu","We","Th","Fr","Sa"];
    const today = todayStr();
    const dayReports = calSelectedDay ? monthReports.filter(r => r.date === calDateStr(calSelectedDay)) : [];
    const foremanReports = dayReports.filter(r => (r.report_type || r.reportType || "foreman") !== "worker");
    const workerReports = dayReports.filter(r => (r.report_type || r.reportType) === "worker");
    const dayStatuses = calSelectedDay ? allForemen.map(f => { const rpt = foremanReports.find(r => r.foreman === f); return { name: f, submitted: !!rpt, report: rpt || null }; }) : [];

    return (
      <div style={wrap}>
        <Hdr right={<>{ThemeBtn}<button onClick={() => { setStep("login"); setCalSelectedDay(null); }} style={{ background: T.input, border: `1px solid ${T.border}`, borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 600, color: T.dim, cursor: "pointer" }}>← Back</button></>}><Brand sub="Admin Panel" /></Hdr>

        <div style={sec}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <label style={{ ...lbl, marginBottom: 0 }}>Notifications {pings.length > 0 && <span style={{ color: T.accent }}>({pings.length})</span>}</label>
            {pings.length > 0 && <button onClick={doClearAll} style={{ fontSize: 11, color: T.dim, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Clear All</button>}
          </div>
          {!pings.length ? <div style={{ color: T.dim, fontSize: 13, opacity: .5, padding: "4px 0" }}>No notifications</div> : pings.slice(0, 5).map(p => (
            <div key={p.id} style={{ background: T.blueBg, border: `1px solid ${T.blue}33`, borderRadius: 10, padding: 10, marginBottom: 6, display: "flex", justifyContent: "space-between", gap: 8 }}>
              <div><div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{p.msg}</div><div style={{ fontSize: 11, color: T.dim, marginTop: 1 }}>{p.from} · {p.at}</div></div>
              <button onClick={() => doClearPing(p.id)} style={{ background: "none", border: "none", color: T.dim, cursor: "pointer", fontSize: 16, fontWeight: 700 }}>×</button></div>))}
        </div>
        <div style={divider} />

        <div style={sec}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); } else setCalMonth(calMonth - 1); setCalSelectedDay(null); }} style={{ background: T.input, border: `1px solid ${T.border}`, borderRadius: 8, padding: "6px 12px", fontSize: 16, color: T.text, cursor: "pointer" }}>←</button>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{mN[calMonth]} {calYear}</div>
            <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); } else setCalMonth(calMonth + 1); setCalSelectedDay(null); }} style={{ background: T.input, border: `1px solid ${T.border}`, borderRadius: 8, padding: "6px 12px", fontSize: 16, color: T.text, cursor: "pointer" }}>→</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, textAlign: "center" }}>
            {dN.map(d => <div key={d} style={{ fontSize: 11, fontWeight: 700, color: T.dim, padding: "4px 0" }}>{d}</div>)}
            {Array.from({ length: offset }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: days }).map((_, i) => {
              const day = i + 1, ds = calDateStr(day), dayRpts = monthReports.filter(r => r.date === ds);
              const has = dayRpts.length > 0, allDone = has && allForemen.every(f => dayRpts.some(r => r.foreman === f && (r.report_type || r.reportType || "foreman") !== "worker"));
              const isToday = ds === today, isSel = calSelectedDay === day;
              return (
                <div key={day} onClick={() => setCalSelectedDay(day)} style={{ padding: "8px 2px", borderRadius: 8, cursor: "pointer", background: isSel ? `${T.accent}22` : "transparent", border: isToday ? `1.5px solid ${T.accent}66` : "1.5px solid transparent" }}>
                  <div style={{ fontSize: 14, fontWeight: isToday ? 700 : 500, color: isSel ? T.accent : T.text }}>{day}</div>
                  {has && <div style={{ width: 6, height: 6, borderRadius: "50%", background: allDone ? T.green : T.accent, margin: "2px auto 0" }} />}
                </div>
              );
            })}
          </div>
        </div>

        {calSelectedDay && (<>
          <div style={divider} />
          <div style={sec}>
            <label style={{ ...lbl, marginBottom: 10 }}>{fmtDate(calDateStr(calSelectedDay))} — Foreman Status</label>
            {dayStatuses.map(fs => (
              <div key={fs.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: T.card, border: `1px solid ${fs.submitted ? `${T.green}44` : T.border}`, borderRadius: 10, padding: "10px 14px", marginBottom: 6 }}>
                <div onClick={() => fs.report && setViewingReport(fs.report)} style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, cursor: fs.submitted ? "pointer" : "default" }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: fs.submitted ? T.green : `${T.dim}44` }} />
                  <span style={{ fontSize: 15, fontWeight: 600, color: fs.submitted ? T.green : T.dim }}>{fs.name}</span>
                </div>
                {fs.submitted ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, color: T.dim }}>{fs.report.site} · {((fs.report.total_hrs||fs.report.totalHrs)||0)}h</span>
                    <button onClick={(e) => { e.stopPropagation(); emailReport(fs.report); }} style={{ background: `${T.blue}15`, border: `1px solid ${T.blue}33`, borderRadius: 6, padding: "4px 8px", fontSize: 11, fontWeight: 700, color: T.blue, cursor: "pointer" }}>✉</button>
                    <span onClick={() => setViewingReport(fs.report)} style={{ color: T.accent, fontSize: 14, cursor: "pointer" }}>→</span>
                  </div>
                ) : <span style={{ fontSize: 12, color: T.dim, opacity: .5 }}>No report</span>}
              </div>
            ))}
            {workerReports.length > 0 && (<>
              <label style={{ ...lbl, marginTop: 16, marginBottom: 10 }}>Non-Foreman Reports</label>
              {workerReports.map(wr => (
                <div key={wr.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: T.card, border: `1px solid ${T.blue}44`, borderRadius: 10, padding: "10px 14px", marginBottom: 6 }}>
                  <div onClick={() => setViewingReport(wr)} style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, cursor: "pointer" }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: T.blue }} />
                    <span style={{ fontSize: 15, fontWeight: 600, color: T.blue }}>{wr.foreman}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, color: T.dim }}>{(wr.jobs_data||wr.jobs||[]).length} jobs · {(wr.jobs_data||wr.jobs||[]).reduce((s, j) => s + (parseFloat(j.hours) || 0), 0)}h</span>
                    <button onClick={(e) => { e.stopPropagation(); emailReport(wr); }} style={{ background: `${T.blue}15`, border: `1px solid ${T.blue}33`, borderRadius: 6, padding: "4px 8px", fontSize: 11, fontWeight: 700, color: T.blue, cursor: "pointer" }}>✉</button>
                    <span onClick={() => setViewingReport(wr)} style={{ color: T.accent, fontSize: 14, cursor: "pointer" }}>→</span>
                  </div>
                </div>
              ))}
            </>)}
            {dayReports.length > 0 && (
              <button onClick={() => emailAllDay(dayReports)} style={{ width: "100%", marginTop: 12, padding: 14, fontSize: 14, fontWeight: 700, borderRadius: 12, background: `${T.blue}15`, color: T.blue, border: `1.5px solid ${T.blue}44`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <span>✉</span> Send All Reports for {fmtDate(calDateStr(calSelectedDay))}
              </button>
            )}
          </div>
        </>)}
        <div style={divider} />

        <div style={sec}>
          <label style={{ ...lbl, marginBottom: 6 }}>Email Recipients</label>
          <div style={{ fontSize: 12, color: T.dim, marginBottom: 12 }}>Reports emailed to active recipients on submit.</div>
          {recipients.map(r => (
            <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: T.card, border: `1px solid ${r.active ? `${T.green}44` : T.border}`, borderRadius: 10, padding: "10px 14px", marginBottom: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div onClick={() => toggleRecipient(r.id)} style={{ ...chk(r.active), width: 22, height: 22, fontSize: 13, cursor: "pointer" }}>{r.active ? "✓" : ""}</div>
                <div><div style={{ fontSize: 14, fontWeight: 600, color: r.active ? T.text : T.dim }}>{r.email}</div>{r.name && <div style={{ fontSize: 12, color: T.dim }}>{r.name}</div>}</div>
              </div>
              <button onClick={() => deleteRecipient(r.id)} style={{ background: "none", border: "none", color: T.danger, cursor: "pointer", fontSize: 15, fontWeight: 700 }}>×</button>
            </div>
          ))}
          {!recipients.length && <div style={{ fontSize: 13, color: T.dim, opacity: .5, padding: "4px 0", marginBottom: 8 }}>No recipients configured</div>}
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <input style={{ ...inp(false), flex: 1, fontSize: 14 }} placeholder="email@example.com" value={recipEmail} onChange={e => setRecipEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && addRecipient()} />
            <input style={{ ...inp(false), width: 90, fontSize: 14 }} placeholder="Name" value={recipName} onChange={e => setRecipName(e.target.value)} onKeyDown={e => e.key === "Enter" && addRecipient()} />
          </div>
          <button onClick={addRecipient} style={{ ...btnGhost, marginTop: 8, padding: 10, fontSize: 13 }}>+ Add Recipient</button>
        </div>
        <div style={divider} />

        <div style={sec}>
          {["foremen", "sites", "employees", "workers"].map(type => {
            const list = { foremen: allForemen, sites: allSites, employees: allEmployees, workers: allWorkers }[type];
            const label = { foremen: "Foremen", sites: "Job Sites", employees: "Employees", workers: "Non-Foreman Workers" }[type];
            const ph = { foremen: "Name", sites: "Site name or address", employees: "Employee name", workers: "Worker name" }[type];
            return (
              <div key={type} style={{ marginBottom: 18 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <label style={{ ...lbl, marginBottom: 0 }}>{label} ({list.length})</label>
                  {plusEl(() => setAddModal({ type, title: `Add ${type === "workers" ? "Worker" : label.slice(0, -1)}`, placeholder: ph }))}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {list.map((n, i) => (<LPChip key={n} label={n} active={false} C={T} onTap={() => {}} onLong={() => setEditModal({ title: `Edit: ${n}`, value: n, canDelete: true, onSave: async v => { await editList(type, i, v); setEditModal(null); }, onDelete: async () => { await deleteList(type, i); setEditModal(null); } })} />))}
                </div>
              </div>
            );
          })}
          <div style={{ fontSize: 12, color: T.dim, textAlign: "center", opacity: .6 }}>Hold press any name to edit or delete</div>
        </div>

        {viewingReport && (<ReportView report={viewingReport} onClose={() => setViewingReport(null)} C={T} />)}
        {editModal && (<EditModal title={editModal.title} value={editModal.value} canDelete={editModal.canDelete} C={T} onClose={() => setEditModal(null)} onSave={editModal.onSave} onDelete={editModal.onDelete} />)}
        {addModal && (<AddModal title={addModal.title} placeholder={addModal.placeholder} C={T} onClose={() => setAddModal(null)} onAdd={handleAddModal} />)}
      </div>
    );
  }

  // ═══════════ FOREMAN REVIEW ═══════════
  if (step === "review") return (
    <div style={wrap}>
      <Hdr><Brand sub="Review Report" /></Hdr>
      <div style={sec}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 16, marginBottom: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div><div style={{ ...lbl, marginBottom: 2 }}>Foreman</div><div style={{ fontSize: 15, fontWeight: 600 }}>{foreman}</div></div>
            <div><div style={{ ...lbl, marginBottom: 2 }}>Date</div><div style={{ fontSize: 15, fontWeight: 600 }}>{fmtDate(date)}</div></div>
          </div>
          <div><div style={{ ...lbl, marginBottom: 2 }}>Job Site</div><div style={{ fontSize: 15, fontWeight: 600 }}>{site}</div></div>
          <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
            <div style={{ fontSize: 13, color: safetyTalk ? T.green : T.dim }}>{safetyTalk ? "✓" : "✗"} Safety Talk</div>
            <div style={{ fontSize: 13, color: subsOnSite ? T.accent : T.dim }}>{subsOnSite ? "✓" : "✗"} Subs</div>
            {hasEquipment && equipmentList.length > 0 && <div style={{ fontSize: 13, color: T.accent }}>✓ Equipment ({equipmentList.length})</div>}
          </div>
        </div>
        {subsOnSite && subs.length > 0 && <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>{subs.map((s, i) => <span key={i} style={{ ...pill, background: T.border, color: T.text }}>{s}</span>)}</div>}
        {hasEquipment && equipmentList.length > 0 && (<div style={{ marginBottom: 14 }}><div style={{ ...lbl, marginBottom: 6 }}>Equipment</div>{equipmentList.map((eq, i) => <div key={i} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 14px", marginBottom: 6, display: "flex", justifyContent: "space-between" }}><span style={{ fontWeight: 600 }}>{eq.name}</span><span style={{ color: T.accent, fontWeight: 600 }}>{eq.hours}h</span></div>)}</div>)}
        <div style={{ ...lbl, marginBottom: 6 }}>Description of Work</div>
        <div style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 14, borderLeft: `3px solid #2563eb`, paddingLeft: 12 }}>{workDesc}</div>
        <div style={{ ...lbl, marginBottom: 8 }}>Crew — {crew.length} · {totalHrs}h</div>
        {crew.map(c => (
          <div key={c.id} style={{ background: T.card, border: `1px solid ${c.isForeman ? `${T.green}44` : T.border}`, borderRadius: 12, padding: 12, marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 15, fontWeight: 600 }}>{c.name}</span>{c.isForeman && <span style={{ fontSize: 9, fontWeight: 700, color: T.green, background: T.greenBg, padding: "2px 6px", borderRadius: 4 }}>FOREMAN</span>}</div>
              <span style={pill}>{c.hours}h</span></div>
            {c.note && <div style={{ fontSize: 12, color: T.dim, marginTop: 4, fontStyle: "italic" }}>Note: {c.note}</div>}
          </div>
        ))}
        <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
          <button style={btnMain(sending)} onClick={handleSubmit} disabled={sending}>{sending ? "Sending..." : "Submit Report"}</button>
          <button style={btnGhost} onClick={() => setStep("form")}>← Edit</button>
        </div>
      </div>
    </div>
  );

  // ═══════════ FOREMAN FORM ═══════════
  return (
    <div style={wrap}>
      <Hdr right={<>{ThemeBtn}{BackBtn}</>}><Brand sub="Daily Field Report" /></Hdr>
      <div style={{ background: `${T.accent}0a`, borderBottom: `1px solid ${T.accent}18`, padding: "8px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#2563eb" }}>{foreman}</span>
        {lastSession && <span style={{ fontSize: 11, color: T.dim }}>↻ Previous report loaded</span>}
      </div>

      <div style={sec}><div style={{ display: "flex", gap: 10, alignItems: "flex-end", marginBottom: 18 }}>
        <div style={{ flex: 1 }}><label style={lbl}>Date</label><input type="date" style={inp(false)} value={date} onChange={e => handleDateChange(e.target.value)} /></div>
        <div style={{ ...pill, padding: "10px 14px", fontSize: 15, fontWeight: 700, whiteSpace: "nowrap" }}>{crew.length} crew · {totalHrs}h</div>
      </div></div>

      <div style={sec}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <label style={{ ...lbl, marginBottom: 0 }}>Job Site {errors.site && <span style={{ color: T.danger }}>— pick one</span>}</label>
          {plusEl(() => setShowAddSite(!showAddSite))}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {allSites.map((s, i) => (<LPChip key={s} label={s} active={site === s} C={T} onTap={() => { setSite(s); setErrors({ ...errors, site: false }); }} onLong={() => setEditModal({ title: `Edit: ${s}`, value: s, canDelete: true, onSave: async v => { await editList("sites", i, v); setEditModal(null); }, onDelete: async () => { await deleteList("sites", i); setEditModal(null); } })} />))}
        </div>
        {showAddSite && (<div style={{ display: "flex", gap: 8, marginTop: 10 }}><input style={{ ...inp(false), flex: 1 }} placeholder="New job site" value={customSite} onChange={e => setCustomSite(e.target.value)} onKeyDown={e => e.key === "Enter" && addNewSite()} /><button onClick={addNewSite} style={{ padding: "0 16px", fontSize: 14, fontWeight: 700, background: T.accent, color: "#000", border: "none", borderRadius: 10, cursor: "pointer" }}>Add</button></div>)}
      </div>
      <div style={divider} />

      <div style={sec}>
        <div onClick={() => setSafetyTalk(!safetyTalk)} style={{ display: "flex", alignItems: "center", gap: 14, cursor: "pointer", padding: "10px 0", userSelect: "none" }}>
          <div style={chk(safetyTalk)}>{safetyTalk ? "✓" : ""}</div><div style={{ fontSize: 15, fontWeight: 600 }}>Morning Safety Talk Given</div></div>
        <div onClick={() => { setSubsOnSite(!subsOnSite); if (subsOnSite) setSubs([]); }} style={{ display: "flex", alignItems: "center", gap: 14, cursor: "pointer", padding: "10px 0", userSelect: "none" }}>
          <div style={chk(subsOnSite)}>{subsOnSite ? "✓" : ""}</div><div style={{ fontSize: 15, fontWeight: 600 }}>Subcontractors On Site</div></div>
        {subsOnSite && (
          <div style={{ marginTop: 6, marginLeft: 42 }}>
            {errors.subs && <div style={{ fontSize: 12, color: T.danger, marginBottom: 6 }}>List at least one sub</div>}
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}><input style={{ ...inp(false), flex: 1 }} placeholder="Sub name / company" value={subInput} onChange={e => setSubInput(e.target.value)} onKeyDown={e => e.key === "Enter" && addSub()} /><button onClick={addSub} style={{ padding: "0 16px", fontSize: 20, fontWeight: 700, background: T.accent, color: "#000", border: "none", borderRadius: 10, cursor: "pointer" }}>+</button></div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{subs.map((s, i) => (<div key={i} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: "7px 11px", fontSize: 13 }}><span>{s}</span><span onClick={() => setSubs(subs.filter((_, idx) => idx !== i))} style={{ cursor: "pointer", color: T.danger, fontWeight: 700, fontSize: 15 }}>×</span></div>))}</div>
          </div>
        )}
        <div onClick={() => { setHasEquipment(!hasEquipment); if (hasEquipment) setEquipmentList([]); }} style={{ display: "flex", alignItems: "center", gap: 14, cursor: "pointer", padding: "10px 0", userSelect: "none" }}>
          <div style={chk(hasEquipment)}>{hasEquipment ? "✓" : ""}</div><div style={{ fontSize: 15, fontWeight: 600 }}>Equipment</div></div>
        {hasEquipment && (
          <div style={{ marginTop: 6, marginLeft: 42 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input style={{ ...inp(false), flex: 1 }} placeholder="Equipment name" value={eqNameInput} onChange={e => setEqNameInput(e.target.value)} />
              <input type="number" inputMode="decimal" step="0.5" style={{ ...inp(false), width: 72 }} placeholder="Hrs" value={eqHoursInput} onChange={e => setEqHoursInput(e.target.value)} onKeyDown={e => e.key === "Enter" && addEq()} />
              <button onClick={addEq} style={{ padding: "0 16px", fontSize: 20, fontWeight: 700, background: T.accent, color: "#000", border: "none", borderRadius: 10, cursor: "pointer" }}>+</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {equipmentList.map((eq, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 12px" }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{eq.name}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ color: T.accent, fontWeight: 600 }}>{eq.hours}h</span>
                    <span onClick={() => setEquipmentList(equipmentList.filter((_, idx) => idx !== i))} style={{ cursor: "pointer", color: T.danger, fontWeight: 700, fontSize: 15 }}>×</span></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div style={divider} />

      <div style={sec}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <label style={{ ...lbl, marginBottom: 0 }}>Crew On Site {errors.crew && <span style={{ color: T.danger }}>— select workers</span>}</label>
          {plusEl(() => setShowAddWorker(!showAddWorker))}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
          {allEmployees.map((name, i) => { const active = crew.some(c => c.name === name && !c.isForeman);
            return (<LPChip key={name} label={name} active={active} C={T} onTap={() => toggleEmployee(name)} onLong={() => setEditModal({ title: `Edit: ${name}`, value: name, canDelete: true, onSave: async v => { await editList("employees", i, v); setEditModal(null); }, onDelete: async () => { await deleteList("employees", i); setEditModal(null); } })} />);
          })}
        </div>
        {showAddWorker && (<div style={{ display: "flex", gap: 8, marginBottom: 12 }}><input style={{ ...inp(false), flex: 1 }} placeholder="New employee name" value={customWorkerName} onChange={e => setCustomWorkerName(e.target.value)} onKeyDown={e => e.key === "Enter" && addNewEmployee()} /><button onClick={addNewEmployee} style={{ padding: "0 16px", fontSize: 14, fontWeight: 700, background: T.accent, color: "#000", border: "none", borderRadius: 10, cursor: "pointer" }}>Add</button></div>)}

        {crew.length > 0 && <div style={{ ...lbl, marginTop: 14, marginBottom: 10 }}>Hours {errors.hours && <span style={{ color: T.danger }}>— all crew need hours</span>}</div>}
        {crew.filter(c => c.isForeman).map(c => (
          <div key={c.id} style={{ background: T.card, border: `1.5px solid ${T.green}44`, borderRadius: 12, padding: 14, marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}><span style={{ fontSize: 15, fontWeight: 700 }}>{c.name}</span><span style={{ fontSize: 9, fontWeight: 700, color: T.green, background: T.greenBg, padding: "2px 6px", borderRadius: 4 }}>FOREMAN</span></div>
            <div style={{ display: "flex", gap: 8 }}>
              <input type="number" inputMode="decimal" step="0.5" style={{ ...inp(errors.hours && (!c.hours || parseFloat(c.hours) <= 0)), width: 80, flex: "0 0 80px" }} placeholder="Hrs" value={c.hours} onChange={e => updateCrew(c.id, "hours", e.target.value)} />
              <input style={{ ...inp(false), flex: 1, fontSize: 13, padding: "10px 12px", color: T.dim }} placeholder="Notes (optional)" value={c.note} onChange={e => updateCrew(c.id, "note", e.target.value)} />
            </div></div>
        ))}
        {crew.filter(c => !c.isForeman).map(c => (
          <div key={c.id} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 14, marginBottom: 10 }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>{c.name}</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input type="number" inputMode="decimal" step="0.5" style={{ ...inp(errors.hours && (!c.hours || parseFloat(c.hours) <= 0)), width: 80, flex: "0 0 80px" }} placeholder="Hrs" value={c.hours} onChange={e => updateCrew(c.id, "hours", e.target.value)} />
              <input style={{ ...inp(false), flex: 1, fontSize: 13, padding: "10px 12px", color: T.dim }} placeholder="Notes (optional)" value={c.note} onChange={e => updateCrew(c.id, "note", e.target.value)} />
            </div></div>
        ))}
      </div>
      <div style={divider} />

      <div style={sec}>
        <label style={lbl}>Description of Work {errors.workDesc && <span style={{ color: T.danger }}>— required</span>}</label>
        <textarea style={{ ...inp(errors.workDesc), minHeight: 90, resize: "vertical" }} placeholder="What was accomplished today..." value={workDesc} onChange={e => setWorkDesc(e.target.value)} />
      </div>

      <div style={{ padding: "24px 20px" }}><button style={btnMain(false)} onClick={() => { if (validate()) checkOvertimeAndProceed(() => setStep("review")); }}>Review & Submit →</button></div>
      <div style={{ textAlign: "center", padding: "0 20px 10px", fontSize: 11, color: T.dim, opacity: .5 }}>Hold press any name or site to edit</div>

      {pendingOvertimeHours && (<OvertimeConfirm hours={pendingOvertimeHours} onConfirm={confirmOvertime} onCancel={cancelOvertime} C={T} />)}
      {dupeDateWarning && (<DupeDateWarning date={fmtDate(dupeDateWarning)} onContinue={() => setDupeDateWarning(null)} onChangeDate={() => { setDupeDateWarning(null); setDate(todayStr()); }} C={T} />)}
      {editModal && (<EditModal title={editModal.title} value={editModal.value} canDelete={editModal.canDelete} C={T} onClose={() => setEditModal(null)} onSave={editModal.onSave} onDelete={editModal.onDelete} />)}
      {addModal && (<AddModal title={addModal.title} placeholder={addModal.placeholder} C={T} onClose={() => setAddModal(null)} onAdd={handleAddModal} />)}
    </div>
  );
}
