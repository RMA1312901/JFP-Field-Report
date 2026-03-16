import { useState, useEffect, useCallback, useRef } from "react";
import * as api from "./api";

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }
function todayStr() { return new Date().toISOString().split("T")[0]; }
function fmtDate(s) { if (!s) return ""; const [y, m, d] = s.split("-"); return `${parseInt(m)}/${parseInt(d)}/${y}`; }
function monthDays(y, m) { return new Date(y, m + 1, 0).getDate(); }
function firstDow(y, m) { return new Date(y, m, 1).getDay(); }

const themes = {
  dark: { bg:"#0b0f18", card:"#141a28", border:"#1e2a3e", accent:"#c5a44e", accentDim:"#a8893a", text:"#e2e4e9", dim:"#6a7389", danger:"#e84040", green:"#34c759", greenBg:"#0f2418", input:"#0e1320", blue:"#4a7cff", blueBg:"#111a30", bgGrad:"linear-gradient(180deg,#0b0f18 0%,#0e1322 100%)", headerBg:"#0d1221", checkBg:"#0e1320", warn:"#f59e0b", warnBg:"#1a1608" },
  light: { bg:"#f2f3f5", card:"#ffffff", border:"#c8cbd2", accent:"#8b6914", accentDim:"#75580e", text:"#111318", dim:"#4b5060", danger:"#dc3545", green:"#1e8e3e", greenBg:"#e4f5ea", input:"#e4e5ea", blue:"#2563eb", blueBg:"#eef2ff", bgGrad:"linear-gradient(180deg,#f2f3f5 0%,#e8e9ed 100%)", headerBg:"#ffffff", checkBg:"#e4e5ea", warn:"#d97706", warnBg:"#fef9ee" },
};

function useLongPress(cb, ms = 500) {
  const t = useRef(null), c = useRef(cb); c.current = cb;
  const start = useCallback(e => { e.preventDefault(); t.current = setTimeout(() => c.current(), ms); }, [ms]);
  const cancel = useCallback(() => clearTimeout(t.current), []);
  return { onTouchStart: start, onMouseDown: start, onTouchEnd: cancel, onTouchMove: cancel, onMouseUp: cancel, onMouseLeave: cancel };
}

function LPChip({ label, active, onTap, onLong, isForeman, C }) {
  const lp = useLongPress(onLong);
  return (<div {...lp} onClick={onTap} style={{ display:"inline-flex", alignItems:"center", padding:"10px 14px", fontSize:14, fontWeight:600, borderRadius:10, cursor:"pointer", border:`1.5px solid ${active ? (isForeman ? C.green : C.accent) : C.border}`, background:active ? (isForeman ? `${C.green}15` : `${C.accent}15`) : C.input, color:active ? (isForeman ? C.green : C.accent) : C.text, transition:"all .15s", userSelect:"none", WebkitUserSelect:"none" }}>{active && <span style={{ marginRight:5 }}>✓</span>}{label}</div>);
}

function EditModal({ title, value, onSave, onDelete, onClose, canDelete, C }) {
  const [v, setV] = useState(value);
  return (<div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", zIndex:999, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }} onClick={onClose}>
    <div onClick={e => e.stopPropagation()} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:24, width:"100%", maxWidth:360 }}>
      <div style={{ fontSize:16, fontWeight:700, color:C.text, marginBottom:16 }}>{title}</div>
      <input value={v} onChange={e => setV(e.target.value)} autoFocus style={{ width:"100%", padding:"13px 14px", fontSize:16, background:C.input, border:`1.5px solid ${C.border}`, borderRadius:10, color:C.text, outline:"none", boxSizing:"border-box", marginBottom:16 }} />
      <div style={{ display:"flex", gap:8 }}>
        <button onClick={() => { if (v.trim()) onSave(v.trim()); }} style={{ flex:1, padding:12, fontSize:15, fontWeight:700, borderRadius:10, background:C.accent, color:"#000", border:"none", cursor:"pointer" }}>Save</button>
        {canDelete && <button onClick={onDelete} style={{ padding:"12px 16px", fontSize:15, fontWeight:700, borderRadius:10, background:`${C.danger}22`, color:C.danger, border:`1px solid ${C.danger}44`, cursor:"pointer" }}>Delete</button>}
      </div>
      <button onClick={onClose} style={{ width:"100%", marginTop:8, padding:10, fontSize:14, background:"transparent", color:C.dim, border:`1px solid ${C.border}`, borderRadius:10, cursor:"pointer" }}>Cancel</button>
    </div>
  </div>);
}

function AddModal({ title, placeholder, onAdd, onClose, C }) {
  const [v, setV] = useState("");
  return (<div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", zIndex:999, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }} onClick={onClose}>
    <div onClick={e => e.stopPropagation()} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:24, width:"100%", maxWidth:360 }}>
      <div style={{ fontSize:16, fontWeight:700, color:C.text, marginBottom:16 }}>{title}</div>
      <input value={v} onChange={e => setV(e.target.value)} autoFocus placeholder={placeholder} onKeyDown={e => { if (e.key === "Enter" && v.trim()) onAdd(v.trim()); }} style={{ width:"100%", padding:"13px 14px", fontSize:16, background:C.input, border:`1.5px solid ${C.border}`, borderRadius:10, color:C.text, outline:"none", boxSizing:"border-box", marginBottom:16 }} />
      <button onClick={() => { if (v.trim()) onAdd(v.trim()); }} style={{ width:"100%", padding:12, fontSize:15, fontWeight:700, borderRadius:10, background:C.accent, color:"#000", border:"none", cursor:"pointer" }}>Add</button>
      <button onClick={onClose} style={{ width:"100%", marginTop:8, padding:10, fontSize:14, background:"transparent", color:C.dim, border:`1px solid ${C.border}`, borderRadius:10, cursor:"pointer" }}>Cancel</button>
    </div>
  </div>);
}

function AddPersonModal({ onAdd, onClose, C }) {
  const [v, setV] = useState(""); const [group, setGroup] = useState("foremen");
  const groups = [{ key:"foremen", label:"Foreman" }, { key:"workers", label:"Office/Trucking" }, { key:"mep", label:"M.E.P" }];
  return (<div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", zIndex:999, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }} onClick={onClose}>
    <div onClick={e => e.stopPropagation()} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:24, width:"100%", maxWidth:360 }}>
      <div style={{ fontSize:16, fontWeight:700, color:C.text, marginBottom:16 }}>Add Person</div>
      <input value={v} onChange={e => setV(e.target.value)} autoFocus placeholder="Name" onKeyDown={e => { if (e.key === "Enter" && v.trim()) onAdd(v.trim(), group); }} style={{ width:"100%", padding:"13px 14px", fontSize:16, background:C.input, border:`1.5px solid ${C.border}`, borderRadius:10, color:C.text, outline:"none", boxSizing:"border-box", marginBottom:12 }} />
      <div style={{ fontSize:11, fontWeight:700, letterSpacing:2, textTransform:"uppercase", color:C.dim, marginBottom:8 }}>Group</div>
      <div style={{ display:"flex", gap:6, marginBottom:16 }}>{groups.map(g => (<button key={g.key} onClick={() => setGroup(g.key)} style={{ flex:1, padding:"10px 8px", fontSize:13, fontWeight:600, borderRadius:8, cursor:"pointer", border:`1.5px solid ${group === g.key ? C.accent : C.border}`, background:group === g.key ? `${C.accent}15` : "transparent", color:group === g.key ? C.accent : C.dim }}>{g.label}</button>))}</div>
      <button onClick={() => { if (v.trim()) onAdd(v.trim(), group); }} style={{ width:"100%", padding:12, fontSize:15, fontWeight:700, borderRadius:10, background:C.accent, color:"#000", border:"none", cursor:"pointer" }}>Add</button>
      <button onClick={onClose} style={{ width:"100%", marginTop:8, padding:10, fontSize:14, background:"transparent", color:C.dim, border:`1px solid ${C.border}`, borderRadius:10, cursor:"pointer" }}>Cancel</button>
    </div>
  </div>);
}

function ConfirmModal({ title, msg, onYes, onNo, yesLabel, noLabel, C }) {
  return (<div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", zIndex:999, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
    <div style={{ background:C.card, border:`1px solid ${C.warn}44`, borderRadius:16, padding:24, width:"100%", maxWidth:340, textAlign:"center" }}>
      <div style={{ width:50, height:50, borderRadius:"50%", background:C.warnBg, border:`2px solid ${C.warn}44`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", fontSize:24 }}>⚠</div>
      <div style={{ fontSize:17, fontWeight:700, color:C.text, marginBottom:8 }}>{title}</div>
      <div style={{ fontSize:14, color:C.dim, marginBottom:20, lineHeight:1.5 }}>{msg}</div>
      <button onClick={onYes} style={{ width:"100%", padding:14, fontSize:16, fontWeight:700, borderRadius:10, background:C.accent, color:"#000", border:"none", cursor:"pointer", marginBottom:8 }}>{yesLabel || "Yes"}</button>
      <button onClick={onNo} style={{ width:"100%", padding:12, fontSize:14, background:"transparent", color:C.dim, border:`1px solid ${C.border}`, borderRadius:10, cursor:"pointer" }}>{noLabel || "Cancel"}</button>
    </div>
  </div>);
}

function Toast({ msg, C }) {
  return (<div style={{ position:"fixed", bottom:100, left:"50%", transform:"translateX(-50%)", background:C.green, color:"#fff", padding:"12px 24px", borderRadius:12, fontSize:14, fontWeight:700, zIndex:9999, boxShadow:"0 4px 20px rgba(0,0,0,.3)" }}>{msg}</div>);
}

function Splash({ onFinish }) {
  const [p, setP] = useState(0);
  useEffect(() => { const t1 = setTimeout(() => setP(1), 100), t2 = setTimeout(() => setP(2), 700), t3 = setTimeout(() => setP(3), 1400), t4 = setTimeout(() => onFinish(), 2200); return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); }; }, [onFinish]);
  return (<div style={{ position:"fixed", inset:0, zIndex:9999, background:"linear-gradient(170deg,#060a12 0%,#0b1120 50%,#101828 100%)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
    <div style={{ opacity:p >= 1 ? 1 : 0, transform:p >= 1 ? "scale(1)" : "scale(.85)", transition:"all .6s cubic-bezier(.16,1,.3,1)", textAlign:"center" }}>
      <div style={{ fontSize:34, fontWeight:800, color:"#2563eb" }}>JFP Enterprises Inc</div>
      <div style={{ fontSize:11, fontWeight:600, letterSpacing:3, color:"#6a7389", textTransform:"uppercase", marginTop:8 }}>General · Industrial · Commercial</div>
    </div>
    <div style={{ marginTop:28, opacity:p >= 2 ? 1 : 0, transform:p >= 2 ? "translateY(0)" : "translateY(10px)", transition:"all .5s cubic-bezier(.16,1,.3,1)", fontSize:13, letterSpacing:4, color:"#4a7cff", textTransform:"uppercase" }}>Daily Field Report</div>
    <div style={{ position:"absolute", bottom:50, opacity:p >= 3 ? 1 : 0, transition:"opacity .4s" }}><div style={{ width:140, height:2, background:"#1a2540", borderRadius:1, overflow:"hidden" }}><div style={{ width:p >= 3 ? "100%" : "0%", height:"100%", background:"linear-gradient(90deg,#2563eb,#4a7cff)", borderRadius:1, transition:"width .7s" }} /></div></div>
  </div>);
}

function ReportView({ report, onClose, onSend, C }) {
  if (!report) return null;
  const crew = report.crew || [];
  const subs = report.subs_list ? (typeof report.subs_list === "string" ? JSON.parse(report.subs_list) : report.subs_list) : (report.subs || []);
  const eqList = report.equipment_list ? (typeof report.equipment_list === "string" ? JSON.parse(report.equipment_list) : report.equipment_list) : (report.equipmentList || []);
  const jobs = report.jobs_data ? (typeof report.jobs_data === "string" ? JSON.parse(report.jobs_data) : report.jobs_data) : (report.jobs || []);
  const isWorker = (report.report_type || report.reportType) === "worker";
  const desc = report.work_desc || report.workDesc || "";
  const hrs = report.total_hrs || report.totalHrs || 0;
  const safetyOk = report.safety_talk || report.safetyTalk;
  const subsOk = report.subs_on_site || report.subsOnSite;

  return (<div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.8)", zIndex:998, overflow:"auto", WebkitOverflowScrolling:"touch" }}>
    <div style={{ maxWidth:480, margin:"0 auto", minHeight:"100vh", background:C.bg, paddingBottom:40 }}>
      <div style={{ background:C.headerBg, borderBottom:`1px solid ${C.border}`, padding:"12px 16px", position:"sticky", top:0, zIndex:60, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <div style={{ fontSize:13, fontWeight:800, color:"#2563eb" }}>JFP Enterprises Inc</div>
          <div style={{ fontSize:14, fontWeight:700, color:C.text }}>{report.foreman} — {fmtDate(report.date)}</div>
        </div>
        <button onClick={onClose} style={{ background:C.input, border:`1px solid ${C.border}`, borderRadius:8, padding:"6px 12px", fontSize:13, fontWeight:600, color:C.dim, cursor:"pointer" }}>✕</button>
      </div>
      <div style={{ padding:"16px 20px 0" }}>
        {isWorker ? (<>
          {jobs.map((job, ji) => (
            <div key={ji} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:16, marginBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                <div style={{ fontSize:12, fontWeight:700, color:C.accent, letterSpacing:1.5, textTransform:"uppercase" }}>Job {ji + 1}</div>
                <span style={{ background:`${C.accent}18`, color:C.accent, fontSize:13, fontWeight:600, padding:"3px 10px", borderRadius:6 }}>{job.hours}h</span>
              </div>
              <div><div style={{ fontSize:10, fontWeight:700, color:C.dim, textTransform:"uppercase" }}>Job #</div><div style={{ fontSize:15, fontWeight:600, marginTop:2, color:C.text }}>{job.jobNumber}</div></div>
              {job.description && <div style={{ fontSize:14, lineHeight:1.5, color:C.text, borderLeft:`3px solid #2563eb`, paddingLeft:10, marginTop:8 }}>{job.description}</div>}
              {job.equipment && <div style={{ fontSize:13, color:C.dim, marginTop:6 }}>Equipment: {job.equipment}</div>}
            </div>))}
          <div style={{ fontSize:12, color:C.dim, marginBottom:8 }}>Total: {jobs.reduce((s, j) => s + (parseFloat(j.hours) || 0), 0)}h across {jobs.length} jobs</div>
        </>) : (<>
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:16, marginBottom:14 }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
              <div><div style={{ fontSize:10, fontWeight:700, letterSpacing:1.5, color:C.dim, textTransform:"uppercase" }}>Job Site</div><div style={{ fontSize:15, fontWeight:600, marginTop:2, color:C.text }}>{report.site}</div></div>
              <div><div style={{ fontSize:10, fontWeight:700, letterSpacing:1.5, color:C.dim, textTransform:"uppercase" }}>Total Hours</div><div style={{ fontSize:15, fontWeight:600, marginTop:2, color:C.text }}>{hrs}h</div></div>
            </div>
            <div style={{ display:"flex", gap:16, marginTop:6 }}>
              <div style={{ fontSize:13, color:safetyOk ? C.green : C.dim }}>{safetyOk ? "✓" : "✗"} Safety Talk</div>
              <div style={{ fontSize:13, color:subsOk ? C.accent : C.dim }}>{subsOk ? "✓" : "✗"} Subs</div>
            </div>
            {subsOk && subs.length > 0 && <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop:8 }}>{subs.map((s, i) => <span key={i} style={{ background:C.border, color:C.text, fontSize:12, padding:"3px 9px", borderRadius:6 }}>{typeof s === "string" ? s : s.name} {s.hours ? `(${s.hours}h)` : ""}</span>)}</div>}
          </div>
          {desc && <div style={{ marginBottom:14 }}><div style={{ fontSize:10, fontWeight:700, letterSpacing:1.5, color:C.dim, textTransform:"uppercase", marginBottom:6 }}>Description of Work</div><div style={{ background:C.card, border:`1px solid ${C.border}`, borderLeft:`3px solid #2563eb`, borderRadius:"0 12px 12px 0", padding:14, fontSize:14, lineHeight:1.6, color:C.text }}>{desc}</div></div>}
          {eqList.length > 0 && <div style={{ marginBottom:14 }}><div style={{ fontSize:10, fontWeight:700, letterSpacing:1.5, color:C.dim, textTransform:"uppercase", marginBottom:6 }}>Equipment</div>{eqList.map((eq, i) => <div key={i} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"10px 14px", marginBottom:6, display:"flex", justifyContent:"space-between" }}><span style={{ fontWeight:600, color:C.text }}>{eq.name}</span><span style={{ color:C.accent, fontWeight:600 }}>{eq.hours}h</span></div>)}</div>}
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:1.5, color:C.dim, textTransform:"uppercase", marginBottom:8 }}>Crew — {crew.length}</div>
          {crew.map((c, i) => (<div key={i} style={{ background:C.card, border:`1px solid ${(c.is_foreman || c.isForeman) ? `${C.green}44` : C.border}`, borderRadius:12, padding:12, marginBottom:8 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}><span style={{ fontSize:15, fontWeight:600, color:C.text }}>{c.name}</span>{(c.is_foreman || c.isForeman) && <span style={{ fontSize:9, fontWeight:700, color:C.green, background:C.greenBg, padding:"2px 6px", borderRadius:4 }}>FOREMAN</span>}</div>
              <span style={{ background:`${C.accent}18`, color:C.accent, fontSize:13, fontWeight:600, padding:"2px 9px", borderRadius:6 }}>{c.hours}h</span>
            </div>
            {c.note && <div style={{ fontSize:12, color:C.dim, marginTop:4, fontStyle:"italic" }}>Note: {c.note}</div>}
          </div>))}
        </>)}
        <div style={{ fontSize:11, color:C.dim, marginTop:12 }}>Submitted {report.submitted_at || report.at}</div>
        <button onClick={() => onSend(report)} style={{ width:"100%", marginTop:16, padding:14, fontSize:14, fontWeight:700, borderRadius:12, background:`${C.blue}15`, color:C.blue, border:`1.5px solid ${C.blue}44`, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>✉ Email This Report</button>
      </div>
    </div>
  </div>);
}

// ═══════════ MAIN APP ═══════════
export default function App() {
  const [splash, setSplash] = useState(true);
  const [isDark, setIsDark] = useState(() => { try { return JSON.parse(localStorage.getItem("jfp-theme") ?? "true"); } catch { return true; } });
  const T = isDark ? themes.dark : themes.light;
  const toggleTheme = () => { const n = !isDark; setIsDark(n); localStorage.setItem("jfp-theme", JSON.stringify(n)); };
  const [savedUser, setSavedUser] = useState(() => { try { return JSON.parse(localStorage.getItem("jfp-user")); } catch { return null; } });
  const [showAll, setShowAll] = useState(false);
  const [allForemen, setAllForemen] = useState([]);
  const [allSites, setAllSites] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [allWorkers, setAllWorkers] = useState([]);
  const [allMep, setAllMep] = useState([]);
  const [pings, setPings] = useState([]);
  const [monthReports, setMonthReports] = useState([]);
  const [monthOffDays, setMonthOffDays] = useState([]);
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
  const [showAddCrew, setShowAddCrew] = useState(false);
  const [customCrewName, setCustomCrewName] = useState("");
  const [safetyTalk, setSafetyTalk] = useState(false);
  const [subsOnSite, setSubsOnSite] = useState(false);
  const [subs, setSubs] = useState([]);
  const [subName, setSubName] = useState("");
  const [subHours, setSubHours] = useState("");
  const [workDesc, setWorkDesc] = useState("");
  const [step, setStep] = useState("login");
  const [sending, setSending] = useState(false);
  const [errors, setErrors] = useState({});
  const [editModal, setEditModal] = useState(null);
  const [addModal, setAddModal] = useState(null);
  const [addPersonModal, setAddPersonModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null);
  const [toast, setToast] = useState(null);
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
  const [jobs, setJobs] = useState([{ id: uid(), jobNumber: "", hours: "", description: "", equipment: "" }]);
  const [overtimeConfirmed, setOvertimeConfirmed] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);

  const totalHrs = crew.reduce((s, c) => s + (parseFloat(c.hours) || 0), 0);
  const totalJobHrs = jobs.reduce((s, j) => s + (parseFloat(j.hours) || 0), 0);
  const calYM = `${calYear}-${String(calMonth + 1).padStart(2, "0")}`;
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  useEffect(() => { (async () => {
    try {
      const [lists, { pings: p }] = await Promise.all([api.loadLists(), api.loadPings()]);
      setAllForemen(lists.foremen); setAllSites(lists.sites); setAllEmployees(lists.employees); setAllWorkers(lists.workers || []); setAllMep(lists.mep || []);
      setPings(p);
    } catch (e) { console.error(e); }
    setLoaded(true);
  })(); }, []);

  const selectUser = (name, type) => {
    setForeman(name); setReportType(type); setOvertimeConfirmed(false); setJustSubmitted(false);
    setSavedUser({ name, type }); localStorage.setItem("jfp-user", JSON.stringify({ name, type }));
    setStep(type === "foreman" ? "form" : "workerForm");
  };

  const goHome = () => {
    if (!justSubmitted && step !== "done") {
      const hasData = (reportType === "foreman" && (workDesc || crew.some(c => c.hours))) || (reportType === "worker" && jobs.some(j => j.jobNumber.trim()));
      if (hasData && !window.confirm("You have unsaved work. Leave this report?")) return;
    }
    setStep("login"); setErrors({}); setForeman(""); setCrew([]); setSite(""); setWorkDesc(""); setJobs([{ id: uid(), jobNumber: "", hours: "", description: "", equipment: "" }]); setReportType("foreman"); setShowAll(false); setHasEquipment(false); setEquipmentList([]); setDate(todayStr()); setOvertimeConfirmed(false); setJustSubmitted(false);
  };

  // Prefill foreman only
  useEffect(() => { if (!foreman || reportType !== "foreman") return; (async () => {
    try {
      const { session: prev } = await api.getSession(foreman);
      setLastSession(prev);
      if (prev && prev.site) {
        setSite(prev.site || ""); setWorkDesc(prev.workDesc || ""); setSafetyTalk(prev.safetyTalk || false);
        setSubsOnSite(prev.subsOnSite || false); setSubs(prev.subs || []); setHasEquipment(prev.hasEquipment || false);
        setEquipmentList(prev.equipmentList || []);
        const base = [{ id: uid(), name: foreman, hours: prev.foremanHours || "", note: "", isForeman: true }];
        const crewE = (prev.crewData || []).filter(c => c.name !== foreman).map(c => ({ id: uid(), name: c.name, hours: c.hours || "", note: "", isForeman: false }));
        setCrew([...base, ...crewE]);
      } else { setCrew([{ id: uid(), name: foreman, hours: "", note: "", isForeman: true }]); }
    } catch (e) { setCrew([{ id: uid(), name: foreman, hours: "", note: "", isForeman: true }]); }
  })(); }, [foreman, reportType]);

  // Worker: always fresh (no prefill)
  useEffect(() => { if (!foreman || reportType !== "worker") return;
    setJobs([{ id: uid(), jobNumber: "", hours: "", description: "", equipment: "" }]); setLastSession(null);
  }, [foreman, reportType]);

  const loadMonth = useCallback(async (ym) => {
    try {
      const [{ reports }, { offDays }] = await Promise.all([api.getReportsByMonth(ym), api.getOffByMonth(ym)]);
      setMonthReports(reports); setMonthOffDays(offDays);
    } catch (e) { console.error(e); }
  }, []);
  useEffect(() => { if (step === "admin") { loadMonth(calYM); api.loadRecipients().then(r => setRecipients(r.recipients)).catch(console.error); } }, [step, calYM, loadMonth]);

  // Overtime/hours check
  const checkOT = (cb) => {
    if (overtimeConfirmed) { cb(); return; }
    if (reportType === "foreman") {
      const f = crew.find(c => parseFloat(c.hours) > 8);
      if (f) { setConfirmModal({ title: "Over 8 Hours", msg: `You entered ${f.hours} hours. Is that correct?`, yesLabel: "Yes, correct", noLabel: "Go back", onYes: () => { setOvertimeConfirmed(true); setConfirmModal(null); cb(); }, onNo: () => setConfirmModal(null) }); return; }
    } else {
      const t = jobs.filter(j => j.jobNumber.trim()).reduce((s, j) => s + (parseFloat(j.hours) || 0), 0);
      if (t !== 8 && t > 0) { setConfirmModal({ title: "Hours Check", msg: `You ${t < 8 ? "do not have" : "have more than"} 8 hours listed (${t}h). Are you sure?`, yesLabel: "Yes, that's correct", noLabel: "Go back and fix", onYes: () => { setOvertimeConfirmed(true); setConfirmModal(null); cb(); }, onNo: () => setConfirmModal(null) }); return; }
    }
    cb();
  };

  const checkEq = (cb) => { if (hasEquipment) { cb(); return; } setConfirmModal({ title: "No Equipment", msg: "Are you sure no equipment was used today?", yesLabel: "Yes, no equipment", noLabel: "Go back", onYes: () => { setConfirmModal(null); cb(); }, onNo: () => setConfirmModal(null) }); };

  const checkDupe = async (fn) => {
    try { const { reports } = await api.getReportsByDate(date); const existing = reports.find(r => r.foreman === foreman);
      if (existing) { setConfirmModal({ title: "Existing Report", msg: `Already submitted for ${fmtDate(date)}. Submit another?`, yesLabel: "Yes, continue", noLabel: "Cancel", onYes: () => { setConfirmModal(null); fn(); }, onNo: () => setConfirmModal(null) }); } else { fn(); }
    } catch { fn(); }
  };

  // List CRUD
  const listMap = { foremen: [allForemen, setAllForemen], employees: [allEmployees, setAllEmployees], sites: [allSites, setAllSites], workers: [allWorkers, setAllWorkers], mep: [allMep, setAllMep] };
  const apiFns = { foremen: [api.addForeman, api.editForeman, api.deleteForeman], employees: [api.addEmployee, api.editEmployee, api.deleteEmployee], sites: [api.addSite, api.editSite, api.deleteSite], workers: [api.addWorker, api.editWorker, api.deleteWorker], mep: [api.addMep, api.editMep, api.deleteMep] };
  const doAdd = async (type, name) => { const r = await apiFns[type][0](name); listMap[type][1](r[type]); };
  const doEdit = async (type, idx, nv) => { const old = listMap[type][0][idx]; const r = await apiFns[type][1](old, nv); listMap[type][1](r[type]); if (type === "sites" && site === old) setSite(nv); if (type === "employees") setCrew(crew.map(c => c.name === old ? { ...c, name: nv } : c)); };
  const doDelete = async (type, idx) => { const nm = listMap[type][0][idx]; const r = await apiFns[type][2](nm); listMap[type][1](r[type]); if (type === "sites" && site === nm) setSite(""); if (type === "employees") setCrew(crew.filter(c => c.name !== nm)); };

  const addNewSite = async () => { const s = customSite.trim(); if (!s || allSites.includes(s)) return; const r = await api.addSite(s); setAllSites(r.sites); setSite(s); setCustomSite(""); setShowAddSite(false); await api.addPing(`New site: "${s}"`, foreman); const p = await api.loadPings(); setPings(p.pings); };
  const addNewCrew = async () => { const n = customCrewName.trim(); if (!n || allEmployees.includes(n)) return; const r = await api.addEmployee(n); setAllEmployees(r.employees); setCrew([...crew, { id: uid(), name: n, hours: "", note: "", isForeman: false }]); setCustomCrewName(""); setShowAddCrew(false); await api.addPing(`New crew: "${n}"`, foreman); const p = await api.loadPings(); setPings(p.pings); };
  const addEq = () => { const n = eqNameInput.trim(), h = eqHoursInput.trim(); if (!n || !h) return; setEquipmentList([...equipmentList, { name: n, hours: parseFloat(h) || 0 }]); setEqNameInput(""); setEqHoursInput(""); };
  const toggleEmp = (name) => { if (crew.find(c => c.name === name)) setCrew(crew.filter(c => c.name !== name)); else setCrew([...crew, { id: uid(), name, hours: "", note: "", isForeman: false }]); };
  const updateCrew = (id, f, v) => setCrew(crew.map(c => c.id === id ? { ...c, [f]: v } : c));
  const addSub = () => { const n = subName.trim(); if (!n) return; setSubs([...subs, { name: n, hours: subHours.trim() || "" }]); setSubName(""); setSubHours(""); };
  const updateJob = (id, field, val) => setJobs(jobs.map(j => j.id === id ? { ...j, [field]: val } : j));
  const addJob = () => setJobs([...jobs, { id: uid(), jobNumber: "", hours: "", description: "", equipment: "" }]);
  const removeJob = (id) => { if (jobs.length > 1) setJobs(jobs.filter(j => j.id !== id)); };

  const validate = () => { const e = {}; if (!site) e.site = true; if (!crew.length) e.crew = true; if (crew.some(c => !c.hours || parseFloat(c.hours) <= 0)) e.hours = true; if (!workDesc.trim()) e.workDesc = true; if (subsOnSite && !subs.length) e.subs = true; if (hasEquipment && equipmentList.some(eq => !eq.hours)) e.eqHours = true; setErrors(e); return !Object.keys(e).length; };
  const validateW = () => { const e = {}; const fj = jobs.filter(j => j.jobNumber.trim()); if (!fj.length) e.jobs = true; if (fj.some(j => !j.hours || parseFloat(j.hours) <= 0)) e.jobHours = true; setErrors(e); return !Object.keys(e).length; };

  const handleSubmit = async () => {
    setSending(true);
    try {
      const fmCrew = crew.find(c => c.isForeman);
      const sessionData = { site, workDesc, safetyTalk, subsOnSite, subs, hasEquipment, equipmentList, foremanHours: fmCrew ? fmCrew.hours : "", crewData: crew.filter(c => !c.isForeman).map(c => ({ name: c.name, hours: c.hours })) };
      const result = await api.submitReport({ reportType: "foreman", foreman, site, date, crew, safetyTalk, subsOnSite, subs, workDesc, totalHrs, equipmentList: hasEquipment ? equipmentList : [], sessionData });
      if (result.emailSent) showToast("✓ Sent — report emailed");
      else showToast("✓ Sent");
      setWorkDesc(""); setSubs([]); setSubsOnSite(false); setSafetyTalk(false); setHasEquipment(false); setEquipmentList([]);
      setCrew(crew.map(c => ({ ...c, hours: "", note: "" }))); setJustSubmitted(true); setSending(false); setStep("done");
    } catch (e) { alert("Submit failed: " + e.message); setSending(false); }
  };

  const handleWorkerSubmit = async () => {
    setSending(true);
    try {
      const filledJobs = jobs.filter(j => j.jobNumber.trim());
      const result = await api.submitReport({ reportType: "worker", foreman, site: "", date, crew: [], safetyTalk: false, subsOnSite: false, subs: [], workDesc: "", totalHrs: totalJobHrs, jobs: filledJobs });
      if (result.emailSent) showToast("✓ Sent — report emailed");
      else showToast("✓ Sent");
      setJustSubmitted(true); setSending(false); setStep("done");
    } catch (e) { alert("Submit failed: " + e.message); setSending(false); }
  };

  const submitAnotherDay = () => {
    setErrors({}); setJustSubmitted(false); setDate(todayStr());
    if (reportType === "foreman") { setWorkDesc(""); setSubs([]); setSubsOnSite(false); setSafetyTalk(false); setHasEquipment(false); setEquipmentList([]); setStep("form"); }
    else { setJobs([{ id: uid(), jobNumber: "", hours: "", description: "", equipment: "" }]); setStep("workerForm"); }
  };

  const doClearPing = async (id) => { const r = await api.deletePing(id); setPings(r.pings); };
  const doClearAll = async () => { await api.clearPings(); setPings([]); };
  const handleToggleOff = async (name, date) => { try { await api.toggleOff(name, date); await loadMonth(calYM); } catch (e) { console.error(e); } };
  const viewReport = async (rpt) => { if (rpt && rpt.id && !rpt._loaded) { try { const { report } = await api.getReportById(rpt.id); setViewingReport({ ...report, _loaded: true }); } catch { setViewingReport(rpt); } } else { setViewingReport(rpt); } };
  const sendReportViaResend = async (rpt) => { try { const result = await api.sendReportEmail(rpt.id); if (result.success) showToast("✓ Sent"); else showToast("Send failed"); } catch { showToast("Send failed"); } };
  const sendDayViaResend = async (date) => { try { const result = await api.sendDayEmail(date); if (result.success) showToast(`✓ ${result.sent} reports sent`); else showToast("Send failed"); } catch { showToast("Send failed"); } };
  const buildReportText = (rpt) => { const isW = (rpt.report_type || rpt.reportType) === "worker"; const rJobs = rpt.jobs_data ? (typeof rpt.jobs_data === "string" ? JSON.parse(rpt.jobs_data) : rpt.jobs_data) : (rpt.jobs || []); if (isW) return `Worker: ${rpt.foreman}\nDate: ${fmtDate(rpt.date)}\n\n${rJobs.map(j => `Job #${j.jobNumber}: ${j.hours}h - ${j.description||""}`).join("\n")}\n\nTotal: ${rJobs.reduce((s,j)=>s+(parseFloat(j.hours)||0),0)}h`; const crw = rpt.crew || []; return `Foreman: ${rpt.foreman}\nDate: ${fmtDate(rpt.date)}\nSite: ${rpt.site}\n\n${rpt.work_desc||rpt.workDesc||""}\n\nCrew (${crw.length}, ${rpt.total_hrs||rpt.totalHrs}h):\n${crw.map(c=>`  ${c.name}: ${c.hours}h`).join("\n")}`; };
  const manualEmailDay = (reports) => { if (!reports.length) return; const body = encodeURIComponent(`JFP Enterprises Inc\n\n${reports.map(r => buildReportText(r)).join("\n\n---\n\n")}`); const subj = encodeURIComponent(`All Reports - ${fmtDate(reports[0].date)} - JFP`); window.location.href = `mailto:?subject=${subj}&body=${body}`; };

  const calDateStr = d => `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const handleAddModal = async (v) => { if (!addModal) return; await doAdd(addModal.type, v); setAddModal(null); };
  const handleAddRecip = async () => { if (!recipEmail.trim()) return; const r = await api.addRecipient(recipEmail.trim(), recipName.trim() || null); setRecipients(r.recipients); setRecipEmail(""); setRecipName(""); };
  const handleToggleRecip = async (id, active) => { const r = await api.toggleRecipient(id, active); setRecipients(r.recipients); };
  const handleDeleteRecip = async (id) => { const r = await api.deleteRecipient(id); setRecipients(r.recipients); };

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
  const ThemeBtn = (<button onClick={toggleTheme} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: 8, background: T.input, border: `1px solid ${T.border}`, cursor: "pointer", fontSize: 16, color: T.dim }}>{isDark ? "☀" : "🌙"}</button>);
  const BackBtn = (<button onClick={goHome} style={{ background: T.input, border: `1px solid ${T.border}`, borderRadius: 8, padding: "6px 12px", fontSize: 13, fontWeight: 600, color: T.dim, cursor: "pointer" }}>← Back</button>);
  const Hdr = ({ children, right }) => (<div style={{ background: T.headerBg, borderBottom: `1px solid ${T.border}`, padding: "10px 16px", position: "sticky", top: 0, zIndex: 50, display: "flex", justifyContent: "space-between", alignItems: "center" }}><div>{children}</div>{right && <div style={{ display: "flex", alignItems: "center", gap: 6 }}>{right}</div>}</div>);
  const Brand = ({ sub }) => (<><div style={{ fontSize: 13, fontWeight: 800, color: "#2563eb" }}>JFP Enterprises Inc</div><div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{sub}</div></>);

  if (splash) return (<Splash onFinish={() => setSplash(false)} />);
  if (!loaded) return (<div style={{ ...wrap, display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ color: T.dim }}>Loading...</div></div>);

  // ═══ LOGIN ═══
  if (step === "login") {
    const allPeople = [...allForemen.map(f => ({ name: f, type: "foreman", group: "foreman" })), ...allWorkers.map(w => ({ name: w, type: "worker", group: "office" })), ...allMep.map(m => ({ name: m, type: "worker", group: "mep" }))];
    const others = savedUser ? allPeople.filter(p => p.name !== savedUser.name) : allPeople;
    const LoginBtn = ({ name, type, big }) => (<button onClick={() => selectUser(name, type)} style={{ width: "100%", padding: big ? "16px 18px" : "13px 18px", fontSize: big ? 18 : 16, fontWeight: big ? 700 : 600, background: T.card, border: big ? `2px solid #2563eb44` : `1.5px solid ${T.border}`, borderRadius: 12, color: T.text, cursor: "pointer", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center" }}><span>{name}</span><span style={{ color: big ? "#2563eb" : T.dim, fontSize: big ? 18 : 16 }}>→</span></button>);

    return (<div style={{ ...wrap, position: "relative" }}>
      <div style={{ position: "absolute", top: 16, right: 20, zIndex: 10 }}>{ThemeBtn}</div>
      <div style={{ padding: "40px 20px 10px", textAlign: "center" }}>
        <div style={{ fontSize: 28, fontWeight: 800, color: "#2563eb" }}>JFP Enterprises Inc</div>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 3, color: T.dim, textTransform: "uppercase", marginTop: 6 }}>General · Industrial · Commercial</div>
        <div style={{ fontSize: 12, letterSpacing: 3.5, color: "#4a7cff", textTransform: "uppercase", marginTop: 16 }}>Daily Field Report</div>
      </div>
      <div style={{ padding: "24px 20px 0" }}>
        {savedUser ? (<>
          <LoginBtn name={savedUser.name} type={savedUser.type} big />
          <div style={{ height: 8 }} />
          {!showAll && others.length > 0 && (<button onClick={() => setShowAll(true)} style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none", color: T.dim, cursor: "pointer", fontSize: 13, padding: "8px 0" }}>
            <span style={{ width: 24, height: 24, borderRadius: 6, border: `1.5px dashed ${T.border}`, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: T.accent }}>+</span>
            <span>Not {savedUser.name}?</span></button>)}
          {showAll && (<div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: T.dim, textTransform: "uppercase", padding: "4px 0" }}>Foreman</div>
            {others.filter(p => p.group === "foreman").map(p => (<LoginBtn key={p.name} name={p.name} type={p.type} />))}
            {others.filter(p => p.group === "office").length > 0 && (<><div style={{ ...divider, margin: "10px 0" }} /><div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: T.dim, textTransform: "uppercase", padding: "4px 0", opacity: .6 }}>Office / Trucking</div>{others.filter(p => p.group === "office").map(p => (<LoginBtn key={p.name} name={p.name} type={p.type} />))}</>)}
            {others.filter(p => p.group === "mep").length > 0 && (<><div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: T.dim, textTransform: "uppercase", padding: "10px 0 4px" }}>M.E.P</div>{others.filter(p => p.group === "mep").map(p => (<LoginBtn key={p.name} name={p.name} type={p.type} />))}</>)}
          </div>)}
        </>) : (<>
          <label style={{ ...lbl, marginBottom: 10 }}>Foreman</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{allForemen.map(f => (<LoginBtn key={f} name={f} type="foreman" />))}</div>
          <div style={{ ...divider, margin: "16px 0" }} />
          <label style={{ ...lbl, marginBottom: 10, opacity: 0.6 }}>Office / Trucking</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{allWorkers.map(w => (<LoginBtn key={w} name={w} type="worker" />))}</div>
          {allMep.length > 0 && (<><div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: T.dim, textTransform: "uppercase", padding: "16px 0 8px" }}>M.E.P</div><div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{allMep.map(m => (<LoginBtn key={m} name={m} type="worker" />))}</div></>)}
        </>)}
      </div>
      <div style={{ padding: "12px 20px" }}><button onClick={() => setAddPersonModal(true)} style={{ width: "100%", padding: "13px 18px", fontSize: 14, fontWeight: 600, background: T.input, border: `1.5px dashed ${T.border}`, borderRadius: 12, color: T.accent, cursor: "pointer", textAlign: "left" }}>+ Add Person</button></div>
      <div style={{ padding: "4px 20px 20px" }}><button onClick={() => setStep("admin")} style={{ ...btnGhost, fontSize: 13, padding: 10 }}>Admin Panel {pings.length > 0 && <span style={{ color: T.accent, fontWeight: 700 }}>({pings.length})</span>}</button></div>
      {addPersonModal && (<AddPersonModal C={T} onClose={() => setAddPersonModal(false)} onAdd={async (name, group) => { setAddPersonModal(false); await doAdd(group, name); selectUser(name, group === "foremen" ? "foreman" : "worker"); }} />)}
      {confirmModal && (<ConfirmModal {...confirmModal} C={T} />)}
    </div>);
  }

  // ═══ WORKER FORM ═══
  if (step === "workerForm") {
    const filledJobs = jobs.filter(j => j.jobNumber.trim());
    return (<div style={wrap}>
      <Hdr right={<>{ThemeBtn}{BackBtn}</>}><Brand sub="Field Report" /></Hdr>
      <div style={{ background: `${T.accent}0a`, borderBottom: `1px solid ${T.accent}18`, padding: "8px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#2563eb" }}>{foreman}</span>
        <span style={{ ...pill, fontSize: 12, padding: "4px 10px" }}>{filledJobs.length} job{filledJobs.length !== 1 ? "s" : ""} · {totalJobHrs}h</span>
      </div>
      <div style={sec}><label style={lbl}>Date</label><input type="date" style={inp(false)} value={date} onChange={e => setDate(e.target.value)} /></div>
      {jobs.map((job, idx) => (<div key={job.id} style={sec}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <label style={{ ...lbl, marginBottom: 0 }}>Job {idx + 1} {idx === 0 && errors.jobs && <span style={{ color: T.danger }}>— enter at least one</span>}</label>
          {jobs.length > 1 && (<button onClick={() => removeJob(job.id)} style={{ fontSize: 12, color: T.danger, background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Remove</button>)}
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 80px", gap: 8, marginBottom: 8 }}>
            <input style={inp(errors.jobs && !job.jobNumber.trim())} placeholder="Job #" value={job.jobNumber} onChange={e => updateJob(job.id, "jobNumber", e.target.value)} />
            <input type="number" inputMode="decimal" step="0.5" style={inp(errors.jobHours && job.jobNumber.trim() && (!job.hours || parseFloat(job.hours) <= 0))} placeholder="Hrs" value={job.hours} onChange={e => updateJob(job.id, "hours", e.target.value)} />
          </div>
          <textarea style={{ ...inp(false), minHeight: 60, resize: "vertical", marginBottom: 8 }} placeholder="Description of work (speech to text works)" value={job.description} onChange={e => updateJob(job.id, "description", e.target.value)} />
          <input style={{ ...inp(false), fontSize: 14, padding: "10px 14px", color: T.dim }} placeholder="Equipment used (optional)" value={job.equipment} onChange={e => updateJob(job.id, "equipment", e.target.value)} />
        </div>
      </div>))}
      <div style={{ padding: "12px 20px" }}><button onClick={addJob} style={{ ...btnGhost, fontSize: 13, padding: 10 }}>+ Additional Job</button></div>
      <div style={{ padding: "12px 20px" }}><button style={btnMain(false)} onClick={() => { if (validateW()) checkOT(() => setStep("workerReview")); }}>Review & Submit →</button></div>
      {confirmModal && (<ConfirmModal {...confirmModal} C={T} />)}
    </div>);
  }

  // ═══ WORKER REVIEW ═══
  if (step === "workerReview") {
    const filledJobs = jobs.filter(j => j.jobNumber.trim());
    return (<div style={wrap}>
      <Hdr><Brand sub="Review Report" /></Hdr>
      <div style={sec}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 16, marginBottom: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div><div style={{ ...lbl, marginBottom: 2 }}>Worker</div><div style={{ fontSize: 15, fontWeight: 600 }}>{foreman}</div></div>
            <div><div style={{ ...lbl, marginBottom: 2 }}>Date</div><div style={{ fontSize: 15, fontWeight: 600 }}>{fmtDate(date)}</div></div>
          </div>
          <div style={{ marginTop: 10 }}><div style={{ ...lbl, marginBottom: 2 }}>Total</div><div style={{ fontSize: 15, fontWeight: 600 }}>{filledJobs.length} jobs · {totalJobHrs}h</div></div>
        </div>
        {filledJobs.map((job, i) => (<div key={i} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 14, marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}><span style={{ fontSize: 13, fontWeight: 700, color: T.accent }}>Job #{job.jobNumber}</span><span style={pill}>{job.hours}h</span></div>
          {job.description && <div style={{ fontSize: 14, lineHeight: 1.5, borderLeft: `3px solid #2563eb`, paddingLeft: 10 }}>{job.description}</div>}
          {job.equipment && <div style={{ fontSize: 13, color: T.dim, marginTop: 4 }}>Equipment: {job.equipment}</div>}
        </div>))}
        <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
          <button style={btnMain(sending)} onClick={() => checkDupe(handleWorkerSubmit)} disabled={sending}>{sending ? "Sending..." : "Submit Report"}</button>
          <button style={btnGhost} onClick={() => setStep("workerForm")}>← Edit</button>
        </div>
      </div>
      {confirmModal && (<ConfirmModal {...confirmModal} C={T} />)}
    </div>);
  }

  // ═══ DONE ═══
  if (step === "done") return (<div style={wrap}>
    <Hdr><Brand sub="Field Report" /></Hdr>
    <div style={{ padding: "40px 20px", textAlign: "center" }}>
      <div style={{ width: 68, height: 68, borderRadius: "50%", background: T.greenBg, border: `2px solid ${T.green}33`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px", fontSize: 30, color: T.green }}>✓</div>
      <h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 6px" }}>Sent</h2>
      <p style={{ fontSize: 14, color: T.dim, margin: "0 0 6px" }}>{fmtDate(date)} · {foreman}</p>
      {reportType === "foreman" && <p style={{ fontSize: 13, color: T.dim, margin: "0 0 24px" }}>{site} · {totalHrs}h · {crew.length} crew</p>}
      {reportType === "worker" && <p style={{ fontSize: 13, color: T.dim, margin: "0 0 24px" }}>{jobs.filter(j => j.jobNumber?.trim()).length} jobs · {totalJobHrs}h</p>}
      <button style={{ ...btnMain(false), marginBottom: 10 }} onClick={submitAnotherDay}>Submit for Another Day</button>
      <div style={{ fontSize: 12, color: T.dim, marginBottom: 20 }}>Same {reportType === "foreman" ? "crew & site" : "form"} — pick your date</div>
      <button style={btnGhost} onClick={() => { setJustSubmitted(false); if (reportType === "foreman") { setStep("form"); setErrors({}); } else { setJobs([{ id: uid(), jobNumber: "", hours: "", description: "", equipment: "" }]); setStep("workerForm"); setErrors({}); } setDate(todayStr()); }}>New Report</button>
      <button style={{ ...btnGhost, marginTop: 10 }} onClick={goHome}>Done</button>
    </div>
    {toast && <Toast msg={toast} C={T} />}
  </div>);

  // ═══ ADMIN ═══
  if (step === "admin") {
    const days = monthDays(calYear, calMonth), offset = firstDow(calYear, calMonth);
    const mN = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    const dN = ["Su","Mo","Tu","We","Th","Fr","Sa"];
    const today = todayStr();
    const dayReports = calSelectedDay ? monthReports.filter(r => r.date === calDateStr(calSelectedDay)) : [];
    const allPeople = [...allForemen.map(f => ({ name: f, group: "foreman" })), ...allWorkers.map(w => ({ name: w, group: "office" })), ...allMep.map(m => ({ name: m, group: "mep" }))];

    return (<div style={wrap}>
      <Hdr right={<>{ThemeBtn}<button onClick={() => { setStep("login"); setCalSelectedDay(null); }} style={{ background: T.input, border: `1px solid ${T.border}`, borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 600, color: T.dim, cursor: "pointer" }}>← Back</button></>}><Brand sub="Admin Panel" /></Hdr>
      <div style={sec}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}><label style={{ ...lbl, marginBottom: 0 }}>Notifications {pings.length > 0 && <span style={{ color: T.accent }}>({pings.length})</span>}</label>{pings.length > 0 && <button onClick={doClearAll} style={{ fontSize: 11, color: T.dim, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Clear All</button>}</div>
        {!pings.length ? <div style={{ color: T.dim, fontSize: 13, opacity: .5 }}>No notifications</div> : pings.slice(0, 5).map(p => (<div key={p.id} style={{ background: T.blueBg, border: `1px solid ${T.blue}33`, borderRadius: 10, padding: 10, marginBottom: 6, display: "flex", justifyContent: "space-between", gap: 8 }}><div><div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{p.msg}</div><div style={{ fontSize: 11, color: T.dim, marginTop: 1 }}>{p.from_name} · {p.created_at}</div></div><button onClick={() => doClearPing(p.id)} style={{ background: "none", border: "none", color: T.dim, cursor: "pointer", fontSize: 16, fontWeight: 700 }}>×</button></div>))}
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
            const dayOff = monthOffDays.filter(o => o.date === ds);
            const has = dayRpts.length > 0 || dayOff.length > 0;
            const allFDone = allForemen.every(f => dayRpts.some(r => r.foreman === f) || dayOff.some(o => o.name === f));
            const isToday = ds === today, isSel = calSelectedDay === day;
            return (<div key={day} onClick={() => setCalSelectedDay(day)} style={{ padding: "8px 2px", borderRadius: 8, cursor: "pointer", background: isSel ? `${T.accent}22` : "transparent", border: isToday ? `1.5px solid ${T.accent}66` : allFDone && has ? `1.5px solid ${T.green}44` : "1.5px solid transparent" }}>
              <div style={{ fontSize: 14, fontWeight: isToday ? 700 : 500, color: isSel ? T.accent : T.text }}>{day}</div>
              {has && <div style={{ width: 6, height: 6, borderRadius: "50%", background: allFDone ? T.green : T.accent, margin: "2px auto 0" }} />}
            </div>);
          })}
        </div>
      </div>
      {calSelectedDay && (<><div style={divider} /><div style={sec}>
        <label style={{ ...lbl, marginBottom: 10 }}>{fmtDate(calDateStr(calSelectedDay))} — Status</label>
        {allPeople.map(person => {
          const ds = calDateStr(calSelectedDay);
          const isOff = monthOffDays.some(o => o.name === person.name && o.date === ds);
          // Sort chronologically: first submitted = #1
          const personRpts = dayReports.filter(r => r.foreman === person.name).sort((a, b) => (a.id || 0) - (b.id || 0));
          const hasRpts = personRpts.length > 0;
          const borderColor = hasRpts ? `${T.green}44` : isOff ? `${T.danger}44` : T.border;
          const dotColor = hasRpts ? T.green : isOff ? T.danger : `${T.dim}44`;
          const nameColor = hasRpts ? T.green : isOff ? T.danger : T.dim;
          return (<div key={person.name}>
            {personRpts.length > 0 ? personRpts.map((rpt, ri) => {
              const isW = (rpt.report_type || rpt.reportType) === "worker";
              const rJobs = rpt.jobs_data ? (typeof rpt.jobs_data === "string" ? JSON.parse(rpt.jobs_data) : rpt.jobs_data) : [];
              const detail = isW ? `${rJobs.length} jobs · ${rJobs.reduce((s, j) => s + (parseFloat(j.hours) || 0), 0)}h` : `${rpt.site} · ${(rpt.total_hrs || 0)}h`;
              return (<div key={rpt.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: T.card, border: `1px solid ${T.green}44`, borderRadius: 10, padding: "10px 14px", marginBottom: 4 }}>
                <div onClick={() => viewReport(rpt)} style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, cursor: "pointer" }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: T.green }} />
                  <span style={{ fontSize: 15, fontWeight: 600, color: T.green }}>{person.name}</span>
                  {personRpts.length > 1 && <span style={{ fontSize: 11, color: T.dim }}>#{ri + 1}</span>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, color: T.dim }}>{detail}</span>
                  <button onClick={(e) => { e.stopPropagation(); sendReportViaResend(rpt); }} style={{ background: `${T.blue}15`, border: `1px solid ${T.blue}33`, borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 700, color: T.blue, cursor: "pointer" }}>✉</button>
                  <span onClick={() => viewReport(rpt)} style={{ color: T.accent, fontSize: 14, cursor: "pointer" }}>→</span>
                </div>
              </div>);
            }) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: T.card, border: `1px solid ${borderColor}`, borderRadius: 10, padding: "10px 14px", marginBottom: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: dotColor }} />
                  <span style={{ fontSize: 15, fontWeight: 600, color: nameColor }}>{person.name}</span>
                </div>
                {isOff ? (
                  <button onClick={() => handleToggleOff(person.name, ds)} style={{ background: `${T.danger}15`, border: `1px solid ${T.danger}33`, borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 700, color: T.danger, cursor: "pointer" }}>OFF ✕</button>
                ) : (
                  <button onClick={() => handleToggleOff(person.name, ds)} style={{ background: `${T.danger}10`, border: `1px solid ${T.border}`, borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 600, color: T.dim, cursor: "pointer" }}>Off</button>
                )}
              </div>
            )}
          </div>);
        })}
        {dayReports.length > 0 && (<>
          <button onClick={() => sendDayViaResend(calDateStr(calSelectedDay))} style={{ width: "100%", marginTop: 12, padding: 14, fontSize: 14, fontWeight: 700, borderRadius: 12, background: `${T.blue}15`, color: T.blue, border: `1.5px solid ${T.blue}44`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>✉ Send All Reports for {fmtDate(calDateStr(calSelectedDay))}</button>
          <button onClick={() => manualEmailDay(dayReports)} style={{ width: "100%", marginTop: 8, padding: 10, fontSize: 12, fontWeight: 600, borderRadius: 10, background: "transparent", color: T.dim, border: `1px solid ${T.border}`, cursor: "pointer" }}>Manual Email (mailto fallback)</button>
        </>)}
      </div></>)}
      <div style={divider} />
      <div style={sec}>
        <label style={{ ...lbl, marginBottom: 6 }}>Email Recipients</label>
        <div style={{ fontSize: 12, color: T.dim, marginBottom: 12 }}>Reports auto-emailed on submit.</div>
        {recipients.map(r => (<div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: T.card, border: `1px solid ${r.active ? `${T.green}44` : T.border}`, borderRadius: 10, padding: "10px 14px", marginBottom: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}><div onClick={() => handleToggleRecip(r.id, !r.active)} style={{ ...chk(r.active), width: 22, height: 22, fontSize: 13, cursor: "pointer" }}>{r.active ? "✓" : ""}</div><div><div style={{ fontSize: 14, fontWeight: 600, color: r.active ? T.text : T.dim }}>{r.email}</div>{r.name && <div style={{ fontSize: 12, color: T.dim }}>{r.name}</div>}</div></div>
          <button onClick={() => handleDeleteRecip(r.id)} style={{ background: "none", border: "none", color: T.danger, cursor: "pointer", fontSize: 15, fontWeight: 700 }}>×</button>
        </div>))}
        {!recipients.length && <div style={{ fontSize: 13, color: T.dim, opacity: .5, marginBottom: 8 }}>No recipients configured</div>}
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}><input style={{ ...inp(false), flex: 1, fontSize: 14 }} placeholder="email@example.com" value={recipEmail} onChange={e => setRecipEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAddRecip()} /><input style={{ ...inp(false), width: 90, fontSize: 14 }} placeholder="Name" value={recipName} onChange={e => setRecipName(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAddRecip()} /></div>
        <button onClick={handleAddRecip} style={{ ...btnGhost, marginTop: 8, padding: 10, fontSize: 13 }}>+ Add Recipient</button>
      </div>
      <div style={divider} />
      <div style={sec}>
        {[{ key: "foremen", label: "Foremen", ph: "Name" }, { key: "sites", label: "Job Sites", ph: "Site name" }, { key: "employees", label: "Crew", ph: "Crew member name" }, { key: "workers", label: "Office / Trucking", ph: "Name" }, { key: "mep", label: "M.E.P", ph: "Name" }].map(({ key, label, ph }) => {
          const list = listMap[key][0];
          return (<div key={key} style={{ marginBottom: 18 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}><label style={{ ...lbl, marginBottom: 0 }}>{label} ({list.length})</label>{plusEl(() => setAddModal({ type: key, title: `Add ${label}`, placeholder: ph }))}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{list.map((n, i) => (<LPChip key={n} label={n} active={false} C={T} onTap={() => {}} onLong={() => setEditModal({ title: `Edit: ${n}`, value: n, canDelete: true, onSave: async v => { await doEdit(key, i, v); setEditModal(null); }, onDelete: async () => { await doDelete(key, i); setEditModal(null); } })} />))}</div>
          </div>);
        })}
        <div style={{ fontSize: 12, color: T.dim, textAlign: "center", opacity: .6 }}>Hold press any name to edit or delete</div>
      </div>
      {viewingReport && (<ReportView report={viewingReport} onClose={() => setViewingReport(null)} onSend={sendReportViaResend} C={T} />)}
      {editModal && (<EditModal title={editModal.title} value={editModal.value} canDelete={editModal.canDelete} C={T} onClose={() => setEditModal(null)} onSave={editModal.onSave} onDelete={editModal.onDelete} />)}
      {addModal && (<AddModal title={addModal.title} placeholder={addModal.placeholder} C={T} onClose={() => setAddModal(null)} onAdd={handleAddModal} />)}
      {confirmModal && (<ConfirmModal {...confirmModal} C={T} />)}
      {toast && <Toast msg={toast} C={T} />}
    </div>);
  }

  // ═══ FOREMAN REVIEW ═══
  if (step === "review") return (<div style={wrap}>
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
      {subsOnSite && subs.length > 0 && <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>{subs.map((s, i) => <span key={i} style={{ ...pill, background: T.border, color: T.text }}>{s.name} {s.hours ? `(${s.hours}h)` : ""}</span>)}</div>}
      {hasEquipment && equipmentList.length > 0 && (<div style={{ marginBottom: 14 }}><div style={{ ...lbl, marginBottom: 6 }}>Equipment</div>{equipmentList.map((eq, i) => <div key={i} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 14px", marginBottom: 6, display: "flex", justifyContent: "space-between" }}><span style={{ fontWeight: 600 }}>{eq.name}</span><span style={{ color: T.accent, fontWeight: 600 }}>{eq.hours}h</span></div>)}</div>)}
      <div style={{ ...lbl, marginBottom: 6 }}>Description of Work</div>
      <div style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 14, borderLeft: `3px solid #2563eb`, paddingLeft: 12 }}>{workDesc}</div>
      <div style={{ ...lbl, marginBottom: 8 }}>Crew — {crew.length} · {totalHrs}h</div>
      {crew.map(c => (<div key={c.id} style={{ background: T.card, border: `1px solid ${c.isForeman ? `${T.green}44` : T.border}`, borderRadius: 12, padding: 12, marginBottom: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 15, fontWeight: 600 }}>{c.name}</span>{c.isForeman && <span style={{ fontSize: 9, fontWeight: 700, color: T.green, background: T.greenBg, padding: "2px 6px", borderRadius: 4 }}>FOREMAN</span>}</div>
          <span style={pill}>{c.hours}h</span></div>
        {c.note && <div style={{ fontSize: 12, color: T.dim, marginTop: 4, fontStyle: "italic" }}>Note: {c.note}</div>}
      </div>))}
      <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
        <button style={btnMain(sending)} onClick={() => checkDupe(handleSubmit)} disabled={sending}>{sending ? "Sending..." : "Submit Report"}</button>
        <button style={btnGhost} onClick={() => setStep("form")}>← Edit</button>
      </div>
    </div>
    {confirmModal && (<ConfirmModal {...confirmModal} C={T} />)}
  </div>);

  // ═══ FOREMAN FORM ═══
  return (<div style={wrap}>
    <Hdr right={<>{ThemeBtn}{BackBtn}</>}><Brand sub="Daily Field Report" /></Hdr>
    <div style={{ background: `${T.accent}0a`, borderBottom: `1px solid ${T.accent}18`, padding: "8px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: "#2563eb" }}>{foreman}</span>
      {lastSession && <span style={{ fontSize: 11, color: T.dim }}>↻ Previous report loaded</span>}
    </div>
    <div style={sec}><div style={{ display: "flex", gap: 10, alignItems: "flex-end", marginBottom: 18 }}>
      <div style={{ flex: 1 }}><label style={lbl}>Date</label><input type="date" style={inp(false)} value={date} onChange={e => setDate(e.target.value)} /></div>
      <div style={{ ...pill, padding: "10px 14px", fontSize: 15, fontWeight: 700, whiteSpace: "nowrap" }}>{crew.length} crew · {totalHrs}h</div>
    </div></div>
    <div style={sec}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}><label style={{ ...lbl, marginBottom: 0 }}>Job Site {errors.site && <span style={{ color: T.danger }}>— pick one</span>}</label>{plusEl(() => setShowAddSite(!showAddSite))}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{allSites.map((s, i) => (<LPChip key={s} label={s} active={site === s} C={T} onTap={() => { setSite(s); setErrors({ ...errors, site: false }); }} onLong={() => setEditModal({ title: `Edit: ${s}`, value: s, canDelete: true, onSave: async v => { await doEdit("sites", i, v); setEditModal(null); }, onDelete: async () => { await doDelete("sites", i); setEditModal(null); } })} />))}</div>
      {showAddSite && (<div style={{ display: "flex", gap: 8, marginTop: 10 }}><input style={{ ...inp(false), flex: 1 }} placeholder="New job site" value={customSite} onChange={e => setCustomSite(e.target.value)} onKeyDown={e => e.key === "Enter" && addNewSite()} /><button onClick={addNewSite} style={{ padding: "0 16px", fontSize: 14, fontWeight: 700, background: T.accent, color: "#000", border: "none", borderRadius: 10, cursor: "pointer" }}>Add</button></div>)}
    </div>
    <div style={divider} />
    <div style={sec}>
      <div onClick={() => setSafetyTalk(!safetyTalk)} style={{ display: "flex", alignItems: "center", gap: 14, cursor: "pointer", padding: "10px 0", userSelect: "none" }}><div style={chk(safetyTalk)}>{safetyTalk ? "✓" : ""}</div><div style={{ fontSize: 15, fontWeight: 600 }}>Morning Safety Talk Given</div></div>
      <div onClick={() => { setSubsOnSite(!subsOnSite); if (subsOnSite) setSubs([]); }} style={{ display: "flex", alignItems: "center", gap: 14, cursor: "pointer", padding: "10px 0", userSelect: "none" }}><div style={chk(subsOnSite)}>{subsOnSite ? "✓" : ""}</div><div style={{ fontSize: 15, fontWeight: 600 }}>Subcontractors On Site</div></div>
      {subsOnSite && (<div style={{ marginTop: 6, marginLeft: 42 }}>
        {errors.subs && <div style={{ fontSize: 12, color: T.danger, marginBottom: 6 }}>List at least one sub</div>}
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}><input style={{ ...inp(false), flex: 1 }} placeholder="Sub name / company" value={subName} onChange={e => setSubName(e.target.value)} onKeyDown={e => e.key === "Enter" && addSub()} /><input type="number" inputMode="decimal" step="0.5" style={{ ...inp(false), width: 72 }} placeholder="Hrs" value={subHours} onChange={e => setSubHours(e.target.value)} /><button onClick={addSub} style={{ padding: "0 16px", fontSize: 20, fontWeight: 700, background: T.accent, color: "#000", border: "none", borderRadius: 10, cursor: "pointer" }}>+</button></div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{subs.map((s, i) => (<div key={i} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: "7px 11px", fontSize: 13 }}><span>{s.name} {s.hours ? `(${s.hours}h)` : ""}</span><span onClick={() => setSubs(subs.filter((_, idx) => idx !== i))} style={{ cursor: "pointer", color: T.danger, fontWeight: 700, fontSize: 15 }}>×</span></div>))}</div>
      </div>)}
      <div onClick={() => { setHasEquipment(!hasEquipment); if (hasEquipment) setEquipmentList([]); }} style={{ display: "flex", alignItems: "center", gap: 14, cursor: "pointer", padding: "10px 0", userSelect: "none" }}><div style={chk(hasEquipment)}>{hasEquipment ? "✓" : ""}</div><div style={{ fontSize: 15, fontWeight: 600 }}>Equipment</div></div>
      {hasEquipment && (<div style={{ marginTop: 6, marginLeft: 42 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}><input style={{ ...inp(false), flex: 1 }} placeholder="Equipment name" value={eqNameInput} onChange={e => setEqNameInput(e.target.value)} /><input type="number" inputMode="decimal" step="0.5" style={{ ...inp(false), width: 72 }} placeholder="Hrs" value={eqHoursInput} onChange={e => setEqHoursInput(e.target.value)} onKeyDown={e => e.key === "Enter" && addEq()} /><button onClick={addEq} style={{ padding: "0 16px", fontSize: 20, fontWeight: 700, background: T.accent, color: "#000", border: "none", borderRadius: 10, cursor: "pointer" }}>+</button></div>
        {errors.eqHours && <div style={{ fontSize: 12, color: T.danger, marginBottom: 6 }}>All equipment needs hours</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>{equipmentList.map((eq, i) => (<div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 12px" }}><span style={{ fontSize: 14, fontWeight: 600 }}>{eq.name}</span><div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ color: T.accent, fontWeight: 600 }}>{eq.hours}h</span><span onClick={() => setEquipmentList(equipmentList.filter((_, idx) => idx !== i))} style={{ cursor: "pointer", color: T.danger, fontWeight: 700, fontSize: 15 }}>×</span></div></div>))}</div>
      </div>)}
    </div>
    <div style={divider} />
    <div style={sec}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}><label style={{ ...lbl, marginBottom: 0 }}>Crew On Site {errors.crew && <span style={{ color: T.danger }}>— select crew</span>}</label>{plusEl(() => setShowAddCrew(!showAddCrew))}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>{allEmployees.map((name, i) => { const active = crew.some(c => c.name === name && !c.isForeman); return (<LPChip key={name} label={name} active={active} C={T} onTap={() => toggleEmp(name)} onLong={() => setEditModal({ title: `Edit: ${name}`, value: name, canDelete: true, onSave: async v => { await doEdit("employees", i, v); setEditModal(null); }, onDelete: async () => { await doDelete("employees", i); setEditModal(null); } })} />); })}</div>
      {showAddCrew && (<div style={{ display: "flex", gap: 8, marginBottom: 12 }}><input style={{ ...inp(false), flex: 1 }} placeholder="New crew member" value={customCrewName} onChange={e => setCustomCrewName(e.target.value)} onKeyDown={e => e.key === "Enter" && addNewCrew()} /><button onClick={addNewCrew} style={{ padding: "0 16px", fontSize: 14, fontWeight: 700, background: T.accent, color: "#000", border: "none", borderRadius: 10, cursor: "pointer" }}>Add</button></div>)}
      {crew.length > 0 && <div style={{ ...lbl, marginTop: 14, marginBottom: 10 }}>Hours {errors.hours && <span style={{ color: T.danger }}>— all crew need hours</span>}</div>}
      {crew.filter(c => c.isForeman).map(c => (<div key={c.id} style={{ background: T.card, border: `1.5px solid ${T.green}44`, borderRadius: 12, padding: 14, marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}><span style={{ fontSize: 15, fontWeight: 700 }}>{c.name}</span><span style={{ fontSize: 9, fontWeight: 700, color: T.green, background: T.greenBg, padding: "2px 6px", borderRadius: 4 }}>FOREMAN</span></div>
        <div style={{ display: "flex", gap: 8 }}><input type="number" inputMode="decimal" step="0.5" style={{ ...inp(errors.hours && (!c.hours || parseFloat(c.hours) <= 0)), width: 80, flex: "0 0 80px" }} placeholder="Hrs" value={c.hours} onChange={e => updateCrew(c.id, "hours", e.target.value)} /><input style={{ ...inp(false), flex: 1, fontSize: 13, padding: "10px 12px", color: T.dim }} placeholder="Notes (optional)" value={c.note} onChange={e => updateCrew(c.id, "note", e.target.value)} /></div>
      </div>))}
      {crew.filter(c => !c.isForeman).map(c => (<div key={c.id} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 14, marginBottom: 10 }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>{c.name}</div>
        <div style={{ display: "flex", gap: 8 }}><input type="number" inputMode="decimal" step="0.5" style={{ ...inp(errors.hours && (!c.hours || parseFloat(c.hours) <= 0)), width: 80, flex: "0 0 80px" }} placeholder="Hrs" value={c.hours} onChange={e => updateCrew(c.id, "hours", e.target.value)} /><input style={{ ...inp(false), flex: 1, fontSize: 13, padding: "10px 12px", color: T.dim }} placeholder="Notes (optional)" value={c.note} onChange={e => updateCrew(c.id, "note", e.target.value)} /></div>
      </div>))}
    </div>
    <div style={divider} />
    <div style={sec}>
      <label style={lbl}>Description of Work {errors.workDesc && <span style={{ color: T.danger }}>— required</span>}</label>
      <textarea style={{ ...inp(errors.workDesc), minHeight: 90, resize: "vertical" }} placeholder="What was accomplished today... (speech to text works)" value={workDesc} onChange={e => setWorkDesc(e.target.value)} />
    </div>
    <div style={{ padding: "24px 20px" }}><button style={btnMain(false)} onClick={() => { if (validate()) checkEq(() => checkOT(() => setStep("review"))); }}>Review & Submit →</button></div>
    {editModal && (<EditModal title={editModal.title} value={editModal.value} canDelete={editModal.canDelete} C={T} onClose={() => setEditModal(null)} onSave={editModal.onSave} onDelete={editModal.onDelete} />)}
    {addModal && (<AddModal title={addModal.title} placeholder={addModal.placeholder} C={T} onClose={() => setAddModal(null)} onAdd={handleAddModal} />)}
    {confirmModal && (<ConfirmModal {...confirmModal} C={T} />)}
    {toast && <Toast msg={toast} C={T} />}
  </div>);
}
