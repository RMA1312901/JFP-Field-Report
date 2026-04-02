import { useState, useEffect, useCallback, useRef } from "react";
import * as api from "./api";

function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,5)}
function todayStr(){return new Date().toISOString().split("T")[0]}
function fmtDate(s){if(!s)return"";const[y,m,d]=s.split("-");return`${+m}/${+d}/${y}`}
function estNow(){return new Date().toLocaleString("en-US",{timeZone:"America/New_York",month:"numeric",day:"numeric",year:"numeric",hour:"numeric",minute:"2-digit",hour12:true})}
function monthDays(y,m){return new Date(y,m+1,0).getDate()}
function firstDow(y,m){return new Date(y,m,1).getDay()}
const SC=["#22c55e","#3b82f6","#eab308","#ef4444","#a855f7"];

const P={
  dark:{bg:"#0c1017",bg2:"#111720",cd:"#161d2a",bd:"#1f2937",ac:"#d4a843",acd:"#b8922e",acg:"#d4a84322",tx:"#eaecf0",ts:"#c1c7d0",dm:"#6b7a8d",ds:"#4a5568",dn:"#ef4444",dnb:"#1c1012",gn:"#22c55e",gb:"#0d1f13",bl:"#3b82f6",bb:"#101a2e",ip:"#0f1520",wn:"#eab308",wb:"#1a1608",hd:"rgba(12,16,23,.92)",sh:"0 1px 3px rgba(0,0,0,.4)",gr:"linear-gradient(145deg,#0c1017,#111720)"},
  light:{bg:"#f4f5f7",bg2:"#ecedf1",cd:"#ffffff",bd:"#c8cbd2",ac:"#92700c",acd:"#7a5e08",acg:"#92700c18",tx:"#0f1419",ts:"#374151",dm:"#6b7280",ds:"#9ca3af",dn:"#dc2626",dnb:"#fef2f2",gn:"#16a34a",gb:"#e8f5e9",bl:"#2563eb",bb:"#eff6ff",ip:"#f0f1f5",wn:"#ca8a04",wb:"#fefce8",hd:"rgba(244,245,247,.95)",sh:"0 1px 3px rgba(0,0,0,.08)",gr:"linear-gradient(145deg,#f4f5f7,#ecedf1)"}
};

function LPChip({label,active,onTap,onLong,C}){
  const t=useRef(null);
  const start=useCallback(e=>{e.preventDefault();if(onLong)t.current=setTimeout(onLong,500)},[onLong]);
  const cancel=useCallback(()=>clearTimeout(t.current),[]);
  return <div onTouchStart={start}onMouseDown={start}onTouchEnd={cancel}onTouchMove={cancel}onMouseUp={cancel}onMouseLeave={cancel}onClick={onTap}style={{display:"inline-flex",alignItems:"center",padding:"9px 14px",fontSize:13,fontWeight:600,borderRadius:20,cursor:"pointer",border:`1.5px solid ${active?C.ac:C.bd}`,background:active?`${C.ac}15`:C.cd,color:active?C.ac:C.tx,userSelect:"none",WebkitUserSelect:"none"}}>{active&&<span style={{marginRight:6,fontSize:11}}>✓</span>}{label}</div>;
}

function OL({children,onClose,C}){return <div onClick={onClose}style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",backdropFilter:"blur(4px)",zIndex:999,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}><div onClick={e=>e.stopPropagation()}style={{background:C.cd,border:`1px solid ${C.bd}`,borderRadius:20,padding:28,width:"100%",maxWidth:380,maxHeight:"85vh",overflow:"auto"}}>{children}</div></div>}
function CM({title,msg,onYes,onNo,yL,nL,C,icon}){const isOk=icon==="✅";return <OL onClose={onNo}C={C}><div style={{textAlign:"center"}}><div style={{width:52,height:52,borderRadius:16,background:isOk?C.gb:C.wb,border:`2px solid ${isOk?C.gn+"33":C.wn+"33"}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 18px",fontSize:24}}>{icon||"⚠"}</div><div style={{fontSize:18,fontWeight:700,color:C.tx,marginBottom:8}}>{title}</div><div style={{fontSize:14,color:C.dm,marginBottom:24,lineHeight:1.8,whiteSpace:"pre-line",textAlign:msg&&msg.includes&&msg.includes("\n")?"left":"center"}}>{msg}</div><button onClick={onYes}style={{width:"100%",padding:14,fontSize:16,fontWeight:700,borderRadius:12,background:isOk?`linear-gradient(135deg,${C.gn},${C.gn}dd)`:`linear-gradient(135deg,${C.ac},${C.acd})`,color:"#fff",border:"none",cursor:"pointer",marginBottom:8}}>{yL||"Yes"}</button>{nL!==false&&<button onClick={onNo}style={{width:"100%",padding:12,fontSize:14,background:"transparent",color:C.dm,border:`1px solid ${C.bd}`,borderRadius:12,cursor:"pointer"}}>{nL||"Cancel"}</button>}</div></OL>}
function TT({msg,C}){return <div style={{position:"fixed",bottom:90,left:16,right:16,maxWidth:448,margin:"0 auto",background:C.cd,border:`1px solid ${C.gn}44`,borderRadius:14,padding:"14px 18px",display:"flex",alignItems:"center",gap:10,zIndex:9999}}><span style={{color:C.gn}}>✓</span><span style={{fontSize:14,fontWeight:600,color:C.tx}}>{msg}</span></div>}
function SP({sites,onPick,onClose,C}){return <OL onClose={onClose}C={C}><div style={{fontSize:17,fontWeight:700,color:C.tx,marginBottom:18}}>Pick a Site</div><div style={{display:"flex",flexWrap:"wrap",gap:8}}>{sites.map(s=><div key={s}onClick={()=>onPick(s)}style={{padding:"11px 16px",fontSize:14,fontWeight:600,borderRadius:12,cursor:"pointer",border:`1px solid ${C.bd}`,background:C.ip,color:C.tx}}>{s}</div>)}</div></OL>}
function APM({onAdd,onClose,C}){const[v,setV]=useState("");const[g,setG]=useState("foremen");return <OL onClose={onClose}C={C}><div style={{fontSize:17,fontWeight:700,color:C.tx,marginBottom:18}}>Add Person</div><input value={v}onChange={e=>setV(e.target.value)}autoFocus placeholder="Name"onKeyDown={e=>{if(e.key==="Enter"&&v.trim())onAdd(v.trim(),g)}}style={{width:"100%",padding:"14px 16px",fontSize:16,background:C.ip,border:`1.5px solid ${C.bd}`,borderRadius:12,color:C.tx,outline:"none",boxSizing:"border-box",marginBottom:14}}/><div style={{fontSize:10,fontWeight:700,letterSpacing:2,textTransform:"uppercase",color:C.dm,marginBottom:8}}>Group</div><div style={{display:"flex",gap:6,marginBottom:18}}>{[["foremen","Foreman"],["workers","Office/Trucking"],["mep","M.E.P"]].map(([k,l])=><button key={k}onClick={()=>setG(k)}style={{flex:1,padding:"11px 8px",fontSize:12,fontWeight:700,borderRadius:10,cursor:"pointer",border:`1.5px solid ${g===k?C.ac:C.bd}`,background:g===k?`${C.ac}15`:"transparent",color:g===k?C.ac:C.dm}}>{l}</button>)}</div><button onClick={()=>{if(v.trim())onAdd(v.trim(),g)}}style={{width:"100%",padding:14,fontSize:15,fontWeight:700,borderRadius:12,background:`linear-gradient(135deg,${C.ac},${C.acd})`,color:"#000",border:"none",cursor:"pointer"}}>Add</button></OL>}
function AddModal({title,placeholder,onAdd,onClose,C}){const[v,setV]=useState("");return <OL onClose={onClose}C={C}><div style={{fontSize:17,fontWeight:700,color:C.tx,marginBottom:18}}>{title}</div><input value={v}onChange={e=>setV(e.target.value)}autoFocus placeholder={placeholder}onKeyDown={e=>{if(e.key==="Enter"&&v.trim())onAdd(v.trim())}}style={{width:"100%",padding:"14px 16px",fontSize:16,background:C.ip,border:`1.5px solid ${C.bd}`,borderRadius:12,color:C.tx,outline:"none",boxSizing:"border-box",marginBottom:18}}/><button onClick={()=>{if(v.trim())onAdd(v.trim())}}style={{width:"100%",padding:14,fontSize:15,fontWeight:700,borderRadius:12,background:`linear-gradient(135deg,${C.ac},${C.acd})`,color:"#000",border:"none",cursor:"pointer"}}>Add</button></OL>}
function EditModal({title,value,onSave,onDelete,onClose,canDelete,C}){const[v,setV]=useState(value);return <OL onClose={onClose}C={C}><div style={{fontSize:17,fontWeight:700,color:C.tx,marginBottom:18}}>{title}</div><input value={v}onChange={e=>setV(e.target.value)}autoFocus style={{width:"100%",padding:"14px 16px",fontSize:16,background:C.ip,border:`1.5px solid ${C.bd}`,borderRadius:12,color:C.tx,outline:"none",boxSizing:"border-box",marginBottom:18}}/><div style={{display:"flex",gap:10}}><button onClick={()=>{if(v.trim())onSave(v.trim())}}style={{flex:1,padding:14,fontSize:15,fontWeight:700,borderRadius:12,background:`linear-gradient(135deg,${C.ac},${C.acd})`,color:"#000",border:"none",cursor:"pointer"}}>Save</button>{canDelete&&<button onClick={onDelete}style={{padding:"14px 18px",fontSize:15,fontWeight:700,borderRadius:12,background:C.dnb,color:C.dn,border:`1px solid ${C.dn}33`,cursor:"pointer"}}>Delete</button>}</div></OL>}
function SwR({children,onAction,C}){const sx=useRef(0);const dx=useRef(0);const[o,setO]=useState(0);return <div style={{position:"relative",overflow:"hidden",borderRadius:12,marginBottom:6}}><div style={{position:"absolute",right:0,top:0,bottom:0,width:90,display:"flex",alignItems:"center",justifyContent:"center",background:C.dn,borderRadius:"0 12px 12px 0"}}><button onClick={()=>{setO(0);onAction()}}style={{color:"#fff",fontWeight:700,fontSize:13,background:"none",border:"none",cursor:"pointer",padding:"12px 16px"}}>Delete</button></div><div onTouchStart={e=>{sx.current=e.touches[0].clientX;dx.current=0}}onTouchMove={e=>{const x=e.touches[0].clientX-sx.current;dx.current=x;if(x<-10)setO(Math.max(x,-100))}}onTouchEnd={()=>{if(dx.current<-50)setO(-90);else setO(0)}}style={{transform:`translateX(${o}px)`,transition:dx.current?"none":"transform .25s",position:"relative",zIndex:1,background:C.cd}}>{children}</div></div>}

function RV({report:r,onClose,onEdit,onSend,C}){if(!r)return null;const iw=(r.report_type||r.reportType)==="worker";const sites=r.sites_data||r.sites||[];const jobs=r.jobs_data||r.jobs||[];const subs=r.subs_list||r.subs||[];const eqList=r.equipment_list||r.equipmentList||[];const cl=r.change_log||r.changeLog||[];
  return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",backdropFilter:"blur(8px)",zIndex:998,overflow:"auto"}}><div style={{maxWidth:480,margin:"0 auto",minHeight:"100vh",background:C.bg,paddingBottom:40}}>
    <div style={{background:C.hd,borderBottom:`1px solid ${C.bd}`,padding:"14px 18px",position:"sticky",top:0,zIndex:60,display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontSize:12,fontWeight:800,color:C.bl,letterSpacing:1}}>JFP</div><div style={{fontSize:15,fontWeight:700,color:C.tx,marginTop:2}}>{r.foreman} — {fmtDate(r.date)}</div></div><button onClick={onClose}style={{width:36,height:36,borderRadius:10,background:C.ip,border:`1px solid ${C.bd}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:C.dm,cursor:"pointer"}}>✕</button></div>
    <div style={{padding:"18px 20px 0"}}>
      {iw?(jobs).map((j,i)=><div key={i}style={{background:C.cd,border:`1px solid ${C.bd}`,borderRadius:16,padding:18,marginBottom:12}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><span style={{fontSize:11,fontWeight:800,color:C.ac,letterSpacing:2}}>JOB {i+1}</span><span style={{color:C.ac,fontWeight:700}}>{j.hours}h</span></div><div style={{fontSize:16,fontWeight:700}}>{j.jobNumber}</div>{j.description&&<div style={{fontSize:14,color:C.ts,borderLeft:`3px solid ${C.bl}`,paddingLeft:12,marginTop:10,lineHeight:1.6}}>{j.description}</div>}</div>)
      :sites.map((sb,si)=><div key={si}style={{background:C.cd,border:`1px solid ${C.bd}`,borderRadius:16,padding:18,marginBottom:12,borderLeft:`4px solid ${SC[si%SC.length]}`}}><div style={{fontSize:16,fontWeight:700,marginBottom:10}}>{sb.site}</div>{(sb.crew||[]).map((c,ci)=><div key={ci}style={{display:"flex",justifyContent:"space-between",padding:"5px 0"}}><div style={{display:"flex",gap:8}}><span style={{fontSize:14,fontWeight:600}}>{c.name}</span>{c.isForeman&&<span style={{fontSize:9,fontWeight:800,color:C.gn,background:C.gb,padding:"2px 6px",borderRadius:5}}>FM</span>}</div><span style={{color:C.ac,fontWeight:700}}>{c.hours}h</span></div>)}{sb.workDesc&&<div style={{fontSize:14,color:C.ts,borderLeft:`3px solid ${C.bl}`,paddingLeft:12,marginTop:10,lineHeight:1.6}}>{sb.workDesc}</div>}</div>)}
      {!iw&&<div style={{background:C.cd,border:`1px solid ${C.bd}`,borderRadius:16,padding:16,marginBottom:12}}>
        <div style={{display:"flex",gap:16,flexWrap:"wrap"}}><span style={{fontSize:13,color:(r.safety_talk||r.safetyTalk)?C.gn:C.ds}}>{(r.safety_talk||r.safetyTalk)?"✓":"✗"} Morning safety talk</span><span style={{fontSize:13,color:(r.subs_on_site||r.subsOnSite)?C.ac:C.ds}}>{(r.subs_on_site||r.subsOnSite)?"✓":"✗"} Subcontractors</span></div>
        {subs.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:10}}>{subs.map((s,i)=><span key={i}style={{background:C.bg2||C.ip,border:`1px solid ${C.bd}`,padding:"5px 10px",borderRadius:8,fontSize:12,color:C.tx}}>{typeof s==="string"?s:s.name}{s.hours?` (${s.hours}h)`:""}</span>)}</div>}
        {eqList.length>0&&<div style={{marginTop:10}}><div style={{fontSize:10,fontWeight:800,letterSpacing:2,color:C.dm,textTransform:"uppercase",marginBottom:6}}>Equipment</div>{eqList.map((eq,i)=><div key={i}style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:13}}><span style={{color:C.tx}}>{eq.name}</span><span style={{color:C.ac,fontWeight:700}}>{eq.hours}h</span></div>)}</div>}
      </div>}
      <div style={{fontSize:11,color:C.ds,marginTop:14}}>Submitted {r.submitted_at||r.at}</div>
      {cl.length>0&&<div style={{marginTop:16,borderTop:`1px solid ${C.bd}`,paddingTop:14}}><div style={{fontSize:10,fontWeight:800,letterSpacing:2.5,color:C.dm,textTransform:"uppercase",marginBottom:10}}>Change Log</div>{cl.map((c,i)=><div key={i}style={{fontSize:12,color:C.dm,padding:"6px 0",borderBottom:`1px solid ${C.bd}`}}>Edited {c.at} — by {c.by}</div>)}</div>}
      <div style={{display:"flex",gap:8,marginTop:18}}><button onClick={()=>onSend(r)}style={{flex:1,padding:14,fontSize:14,fontWeight:700,borderRadius:12,background:C.bb,color:C.bl,border:`1.5px solid ${C.bl}33`,cursor:"pointer",textAlign:"center"}}>✉ Email</button><button onClick={()=>onEdit(r)}style={{flex:1,padding:14,fontSize:14,fontWeight:700,borderRadius:12,background:C.acg,color:C.ac,border:`1.5px solid ${C.ac}33`,cursor:"pointer",textAlign:"center"}}>✏ Edit</button></div>
    </div></div></div>}

function Splash({onFinish}){const[p,setP]=useState(0);useEffect(()=>{const t=[];t.push(setTimeout(()=>setP(1),100));t.push(setTimeout(()=>setP(2),700));t.push(setTimeout(()=>setP(3),1400));t.push(setTimeout(()=>onFinish(),2200));return()=>t.forEach(clearTimeout)},[onFinish]);return <div style={{position:"fixed",inset:0,zIndex:9999,background:"#080c12",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}><div style={{opacity:p>=1?1:0,transform:p>=1?"scale(1)":"scale(.9)",transition:"all .7s cubic-bezier(.16,1,.3,1)",textAlign:"center"}}><div style={{fontSize:36,fontWeight:800,color:"#3b82f6"}}>JFP</div><div style={{fontSize:12,fontWeight:700,letterSpacing:4,color:"#4b5568",textTransform:"uppercase",marginTop:6}}>Enterprises Inc</div></div><div style={{marginTop:32,opacity:p>=2?1:0,transition:"all .5s",fontSize:11,letterSpacing:5,color:"#3b82f6",textTransform:"uppercase"}}>Field Reports</div></div>}

export default function App(){
  const[splash,setSplash]=useState(true);
  const[dk,setDk]=useState(()=>{try{return JSON.parse(localStorage.getItem("jfp-theme")??"true")}catch{return true}});
  const C=dk?P.dark:P.light;
  const toggleTheme=()=>{const n=!dk;setDk(n);localStorage.setItem("jfp-theme",JSON.stringify(n))};
  const[su,setSu]=useState(()=>{try{return JSON.parse(localStorage.getItem("jfp-user"))}catch{return null}});
  const[sa,setSa]=useState(false);
  const[aF,saF]=useState([]);const[aS,saS]=useState([]);const[aE,saE]=useState([]);const[aW,saW]=useState([]);const[aM,saM]=useState([]);
  const[monthReports,sMR]=useState([]);const[monthOff,sMO]=useState([]);const[loaded,sLoaded]=useState(false);
  const[fm,sFm]=useState("");const[rt,sRt]=useState("foreman");const[dt,sDt]=useState(todayStr());
  const[sb,sSb]=useState([{id:uid(),site:"",crew:[],wd:""}]);
  const[st,sSt]=useState(false);const[son,sSon]=useState(false);const[subs,sSubs]=useState([]);const[sn,sSn]=useState("");const[sh2,sSh]=useState("");
  const[he,sHe]=useState(false);const[el,sEl]=useState([]);const[eni,sEni]=useState("");const[ehi,sEhi]=useState("");
  const[step,sStep]=useState("login");const[snd,sSnd]=useState(false);const[err,sErr]=useState({});
  const[apm,sApm]=useState(false);const[cm,sCm]=useState(null);const[tt,sTt]=useState(null);
  const[js,sJs]=useState(false);const[spf,sSpf]=useState(null);const[sac,sSac]=useState(null);
  const[jobs,sJobs]=useState([{id:uid(),jn:"",hr:"",desc:"",eq:""}]);
  const[oc,sOc]=useState(false);const[sdp,sSdp]=useState(false);
  const[cY,sCY]=useState(new Date().getFullYear());const[cM,sCM]=useState(new Date().getMonth());const[cD,sCD]=useState(null);
  const[vr,sVr]=useState(null);const[eid,sEid]=useState(null);const[dt2,sDt2]=useState(null);
  const[rc,sRc]=useState([]);const[re,sRe]=useState("");const[rn,sRn]=useState("");
  const[pings,sPings]=useState([]);
  const[editMod,sEditMod]=useState(null);const[addMod,sAddMod]=useState(null);
  const[showCL,sShowCL]=useState(false);
  const APP_VER="2.0.0";
  const APP_LOG=[
    {ver:"2.0.0",date:"3/27/2026",changes:["Multi-site foreman reports — one report covers multiple job sites","Foreman can appear on multiple sites with split hours","Date picker popup on form entry","Edit submitted reports from admin panel","Change log with timestamps (EST) and editor name","Swipe-to-delete on reports with undo/reinstate","Validation popup listing all missing fields by site","Morning safety talk (updated wording)","All timestamps in Eastern time","Version history added"]},
    {ver:"1.0.0",date:"3/13/2026",changes:["Initial release","Foreman daily field reports","Office/Trucking and M.E.P worker reports","Admin panel with calendar view","Email reports via Resend","Session prefill from last report","Dark/light theme","Off-day tracking","Crew, site, and employee management"]},
  ];

  const toast=m=>{sTt(m);setTimeout(()=>sTt(null),2500)};
  const tjh=jobs.reduce((s,j)=>s+(parseFloat(j.hr)||0),0);
  const ac2=new Set();let th=0;sb.forEach(b=>b.crew.forEach(c=>{ac2.add(c.name);th+=parseFloat(c.hours)||0}));
  const calYM=`${cY}-${String(cM+1).padStart(2,"0")}`;

  useEffect(()=>{(async()=>{try{
    const[lists,{pings:p}]=await Promise.all([api.loadLists(),api.loadPings()]);
    saF(lists.foremen||[]);saS(lists.sites||[]);saE(lists.employees||[]);saW(lists.workers||[]);saM(lists.mep||[]);sPings(p||[]);
  }catch(e){console.error(e)}sLoaded(true)})()},[]);

  const loadMonth=useCallback(async ym=>{try{const[{reports},{offDays}]=await Promise.all([api.getReportsByMonth(ym),api.getOffByMonth(ym)]);sMR(reports);sMO(offDays)}catch(e){console.error(e)}},[]);
  useEffect(()=>{if(step==="admin"){loadMonth(calYM);api.loadRecipients().then(r=>sRc(r.recipients)).catch(console.error)}},[step,calYM,loadMonth]);

  const selUser=(name,type)=>{sFm(name);sRt(type);sOc(false);sJs(false);sEid(null);setSu({name,type});localStorage.setItem("jfp-user",JSON.stringify({name,type}));
    if(type==="foreman"){sSb([{id:uid(),site:"",crew:[{id:uid(),name,hours:"",note:"",isForeman:true}],wd:""}]);sSdp(true);sStep("form")}
    else{sJobs([{id:uid(),jn:"",hr:"",desc:"",eq:""}]);sSdp(true);sStep("wf")}};

  const goH=()=>{sStep("login");sErr({});sFm("");sSb([{id:uid(),site:"",crew:[],wd:""}]);sDt(todayStr());sJs(false);sCm(null);sSt(false);sSon(false);sSubs([]);sHe(false);sEl([]);sJobs([{id:uid(),jn:"",hr:"",desc:"",eq:""}]);sOc(false);setSa(false);sEid(null)};
  const goHs=()=>{if(!js&&step!=="done"){const hd=sb.some(b=>b.site||b.crew.some(c=>c.hours))||jobs.some(j=>j.jn.trim());if(hd){sCm({title:"Leave?",msg:"Unsaved work will be lost.",yL:"Leave",nL:"Stay",onYes:goH,onNo:()=>sCm(null)});return}}goH()};

  // Prefill foreman session
  useEffect(()=>{if(!fm||rt!=="foreman"||eid)return;(async()=>{try{
    const{session:prev}=await api.getSession(fm);
    if(prev&&prev.sites){sSb(prev.sites.map(x=>({id:uid(),site:x.site,crew:x.crew.map(c=>({...c,id:uid()})),wd:x.workDesc||""})));sSt(prev.safetyTalk||false);sSon(prev.subsOnSite||false);sSubs(prev.subs||[]);sHe(prev.hasEquipment||false);sEl(prev.equipmentList||[])}
    else{sSb([{id:uid(),site:"",crew:[{id:uid(),name:fm,hours:"",note:"",isForeman:true}],wd:""}])}
  }catch{sSb([{id:uid(),site:"",crew:[{id:uid(),name:fm,hours:"",note:"",isForeman:true}],wd:""}])}})()},[fm,rt,eid]);
  // Worker: always fresh
  useEffect(()=>{if(!fm||rt!=="worker"||eid)return;sJobs([{id:uid(),jn:"",hr:"",desc:"",eq:""}])},[fm,rt,eid]);

  // Site block ops
  const ub=(bid,f,v)=>sSb(sb.map(b=>b.id===bid?{...b,[f]:v}:b));
  const asb=()=>sSb([...sb,{id:uid(),site:"",crew:[{id:uid(),name:fm,hours:"",note:"",isForeman:true}],wd:""}]);
  const rsb=bid=>{if(sb.length>1)sSb(sb.filter(b=>b.id!==bid))};
  const psb=(bid,s)=>{ub(bid,"site",s);sSpf(null)};
  const acb=(bid,n,isF)=>sSb(sb.map(b=>b.id===bid?{...b,crew:[...b.crew,{id:uid(),name:n,hours:"",note:"",isForeman:!!isF}]}:b));
  const rcb=(bid,cid)=>sSb(sb.map(b=>b.id===bid?{...b,crew:b.crew.filter(c=>c.id!==cid)}:b));
  const ucb=(bid,cid,f,v)=>sSb(sb.map(b=>b.id===bid?{...b,crew:b.crew.map(c=>c.id===cid?{...c,[f]:v}:c)}:b));

  // List CRUD
  const apiFns={foremen:[api.addForeman,api.editForeman,api.deleteForeman],employees:[api.addEmployee,api.editEmployee,api.deleteEmployee],sites:[api.addSite,api.editSite,api.deleteSite],workers:[api.addWorker,api.editWorker,api.deleteWorker],mep:[api.addMep,api.editMep,api.deleteMep]};
  const listMap={foremen:[aF,saF],employees:[aE,saE],sites:[aS,saS],workers:[aW,saW],mep:[aM,saM]};
  const doAdd=async(type,name)=>{const r=await apiFns[type][0](name);listMap[type][1](r[type])};
  const doEdit=async(type,idx,nv)=>{const old=listMap[type][0][idx];const r=await apiFns[type][1](old,nv);listMap[type][1](r[type])};
  const doDelete=async(type,idx)=>{const nm=listMap[type][0][idx];const r=await apiFns[type][2](nm);listMap[type][1](r[type])};

  // Submit foreman
  const hSub=async()=>{sSnd(true);try{
    const sitesPayload=sb.map(b=>({site:b.site,crew:b.crew.map(c=>({name:c.name,hours:c.hours,note:c.note||"",isForeman:c.isForeman||false})),workDesc:b.wd}));
    const sessionData={sites:sitesPayload,safetyTalk:st,subsOnSite:son,subs,hasEquipment:he,equipmentList:el};
    let msg="";
    if(eid){
      await api.updateReport(eid,{sites:sitesPayload,safetyTalk:st,subsOnSite:son,subs,totalHrs:th,equipmentList:he?el:[],editedBy:fm,sessionData,foreman:fm});
      msg="Report updated!";
    }else{
      const result=await api.submitReport({reportType:"foreman",foreman:fm,date:dt,sites:sitesPayload,safetyTalk:st,subsOnSite:son,subs,totalHrs:th,equipmentList:he?el:[],sessionData});
      msg=result.emailSent?"Report submitted & emailed!":"Report submitted!";
    }
    sSnd(false);sJs(true);sEid(null);
    sCm({title:msg,msg:`${fm} — ${fmtDate(dt)}\n${sb.filter(b=>b.site).map(b=>b.site).join(" + ")}\n${ac2.size} crew · ${th}h`,icon:"✅",yL:"OK",nL:false,onYes:()=>{sCm(null);sStep("done")},onNo:()=>{sCm(null);sStep("done")}});
  }catch(e){alert("Failed: "+e.message);sSnd(false)}};

  // Submit worker
  const hWsub=async()=>{sSnd(true);try{
    const fj=jobs.filter(j=>j.jn.trim()).map(j=>({jobNumber:j.jn,hours:j.hr,description:j.desc,equipment:j.eq}));
    let msg="";
    if(eid){
      await api.updateReport(eid,{jobs:fj,totalHrs:tjh,editedBy:fm,sites:[],foreman:fm});
      msg="Report updated!";
    }else{
      const result=await api.submitReport({reportType:"worker",foreman:fm,date:dt,sites:[],jobs:fj,totalHrs:tjh});
      msg=result.emailSent?"Report submitted & emailed!":"Report submitted!";
    }
    sSnd(false);sJs(true);sEid(null);
    sCm({title:msg,msg:`${fm} — ${fmtDate(dt)}\n${fj.length} job${fj.length!==1?"s":""} · ${tjh}h`,icon:"✅",yL:"OK",nL:false,onYes:()=>{sCm(null);sStep("done")},onNo:()=>{sCm(null);sStep("done")}});
  }catch(e){alert("Failed: "+e.message);sSnd(false)}};

  // Edit report: load into form
  const editRpt=async rpt=>{sVr(null);let r=rpt;
    if(rpt.id&&!rpt._loaded){try{const{report}=await api.getReportById(rpt.id);r=report}catch{}}
    sFm(r.foreman);sDt(r.date);sEid(r.id);sJs(false);
    if((r.report_type||r.reportType)==="worker"){sRt("worker");sJobs((r.jobs_data||r.jobs||[]).map(j=>({id:uid(),jn:j.jobNumber||"",hr:j.hours||"",desc:j.description||"",eq:j.equipment||""})));sStep("wf")}
    else{sRt("foreman");const sites=r.sites_data||r.sites||[];sSb(sites.map(x=>({id:uid(),site:x.site,crew:(x.crew||[]).map(c=>({...c,id:uid()})),wd:x.workDesc||""})));sSt(r.safety_talk||r.safetyTalk||false);sSon(r.subs_on_site||r.subsOnSite||false);sSubs(r.subs_list||r.subs||[]);const eq=r.equipment_list||r.equipmentList||[];sHe(eq.length>0);sEl(eq);sStep("form")}};

  // Delete + reinstate
  const delRpt=rpt=>{sCm({title:"Delete?",msg:`Delete ${rpt.foreman}'s report for ${fmtDate(rpt.date)}?`,yL:"Delete",nL:"Cancel",icon:"🗑",onYes:async()=>{sCm(null);try{await api.deleteReport(rpt.id);sDt2({msg:`Deleted — ${rpt.foreman}`,rpt});await loadMonth(calYM);setTimeout(()=>sDt2(null),8000)}catch(e){toast("Delete failed")}},onNo:()=>sCm(null)})};
  const reinst=async rpt=>{try{await api.reinstateReport({...rpt,reportType:rpt.report_type||rpt.reportType,sites:rpt.sites_data||rpt.sites||[],jobs:rpt.jobs_data||rpt.jobs||[],subs:rpt.subs_list||rpt.subs||[],equipmentList:rpt.equipment_list||rpt.equipmentList||[],changeLog:rpt.change_log||rpt.changeLog||[],totalHrs:rpt.total_hrs||rpt.totalHrs||0});sDt2(null);await loadMonth(calYM);toast("Reinstated")}catch{toast("Reinstate failed")}};

  const togOff=async(n,d)=>{try{await api.toggleOff(n,d);await loadMonth(calYM)}catch(e){console.error(e)}};
  const sendRpt=async rpt=>{try{const r=await api.sendReportEmail(rpt.id);if(r.success)toast("✉ Sent");else toast("Send failed")}catch{toast("Send failed")}};
  const sendDay=async date=>{try{const r=await api.sendDayEmail(date);if(r.success)toast(`✉ ${r.sent} sent`);else toast("Send failed")}catch{toast("Send failed")}};
  const manualEmail=reports=>{if(!reports.length)return;const body=encodeURIComponent(`JFP Enterprises Inc\n\n${reports.map(r=>`${r.foreman} - ${fmtDate(r.date)}\nSites: ${(r.sites_data||[]).map(s=>s.site).join(", ")||r.site}\nHours: ${r.total_hrs||0}h`).join("\n\n---\n\n")}`);window.location.href=`mailto:?subject=${encodeURIComponent(`Reports - ${fmtDate(reports[0].date)} - JFP`)}&body=${body}`};

  const cds=d=>`${cY}-${String(cM+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  const handleAddRecip=async()=>{if(!re.trim())return;const r=await api.addRecipient(re.trim(),rn.trim()||null);sRc(r.recipients);sRe("");sRn("")};
  const doClearPing=async id=>{const r=await api.deletePing(id);sPings(r.pings)};

  // Styles
  const W={minHeight:"100vh",background:C.gr,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",color:C.tx,maxWidth:480,margin:"0 auto",paddingBottom:100};
  const L={display:"block",fontSize:10,fontWeight:800,letterSpacing:2.5,textTransform:"uppercase",color:C.dm,marginBottom:8};
  const I=e=>({width:"100%",padding:"14px 16px",fontSize:16,background:C.ip,border:`1.5px solid ${e?C.dn:C.bd}`,borderRadius:12,color:C.tx,outline:"none",boxSizing:"border-box",WebkitAppearance:"none",fontFamily:"inherit"});
  const BM=d=>({width:"100%",padding:16,fontSize:16,fontWeight:700,background:d?C.bd:`linear-gradient(135deg,${C.ac},${C.acd})`,color:d?C.dm:"#000",border:"none",borderRadius:14,cursor:d?"default":"pointer"});
  const BG={width:"100%",padding:14,fontSize:15,fontWeight:600,background:"transparent",color:C.dm,border:`1.5px solid ${C.bd}`,borderRadius:14,cursor:"pointer"};
  const S={padding:"20px 20px 0"};const DV={height:1,background:C.bd,margin:"20px 20px 0"};
  const CK=on=>({width:26,height:26,borderRadius:8,border:`2px solid ${on?C.gn:C.bd}`,background:on?C.gb:"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:14,color:C.gn,fontWeight:700});
  const PL={display:"inline-block",background:C.acg,color:C.ac,fontSize:13,fontWeight:700,padding:"4px 12px",borderRadius:8};
  const TB=<button onClick={toggleTheme}style={{width:36,height:36,borderRadius:10,background:C.ip,border:`1px solid ${C.bd}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:15,color:C.dm}}>{dk?"☀":"🌙"}</button>;
  const BB=<button onClick={goHs}style={{background:C.ip,border:`1px solid ${C.bd}`,borderRadius:10,padding:"8px 14px",fontSize:13,fontWeight:600,color:C.dm,cursor:"pointer"}}>← Back</button>;
  const HD=({children,right})=><div style={{background:C.hd,backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",borderBottom:`1px solid ${C.bd}`,padding:"12px 18px",position:"sticky",top:0,zIndex:50,display:"flex",justifyContent:"space-between",alignItems:"center"}}><div>{children}</div>{right&&<div style={{display:"flex",alignItems:"center",gap:8}}>{right}</div>}</div>;
  const BR=({sub})=><><div style={{fontSize:12,fontWeight:800,color:C.bl,letterSpacing:1}}>JFP ENTERPRISES</div><div style={{fontSize:15,fontWeight:700,color:C.tx,marginTop:1}}>{sub}</div></>;
  const DP=()=>sdp?<OL onClose={()=>sSdp(false)}C={C}><div style={{textAlign:"center"}}><div style={{fontSize:18,fontWeight:700,color:C.tx,marginBottom:18}}>What date?</div><input type="date"value={dt}onChange={e=>sDt(e.target.value)}style={{...I(false),textAlign:"center",fontSize:18,marginBottom:18}}/><button onClick={()=>sSdp(false)}style={{width:"100%",padding:14,fontSize:16,fontWeight:700,borderRadius:12,background:`linear-gradient(135deg,${C.ac},${C.acd})`,color:"#000",border:"none",cursor:"pointer"}}>Continue →</button></div></OL>:null;

  if(splash)return <Splash onFinish={()=>setSplash(false)}/>;
  if(!loaded)return <div style={{...W,display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{color:C.dm}}>Loading...</div></div>;

  // ═══ LOGIN ═══
  if(step==="login"){
    const ap=[...aF.map(f=>({name:f,type:"foreman",g:"f"})),...aW.map(w=>({name:w,type:"worker",g:"o"})),...aM.map(m=>({name:m,type:"worker",g:"m"}))];
    const ot=su?ap.filter(p=>p.name!==su.name):ap;
    const LB=({name,type,big})=><button onClick={()=>selUser(name,type)}style={{width:"100%",padding:big?"18px 20px":"14px 20px",fontSize:big?18:16,fontWeight:big?700:600,background:C.cd,border:big?`2px solid ${C.bl}33`:`1px solid ${C.bd}`,borderRadius:14,color:C.tx,cursor:"pointer",textAlign:"left",display:"flex",justifyContent:"space-between",alignItems:"center"}}><span>{name}</span><span style={{color:big?C.bl:C.ds}}>→</span></button>;
    return <div style={{...W,position:"relative"}}><div style={{position:"absolute",top:16,right:20,zIndex:10}}>{TB}</div>
      <div style={{padding:"48px 20px 14px",textAlign:"center"}}><div style={{fontSize:32,fontWeight:800,color:C.bl}}>JFP</div><div style={{fontSize:11,fontWeight:700,letterSpacing:4,color:C.dm,textTransform:"uppercase",marginTop:4}}>Enterprises Inc</div><div style={{fontSize:11,letterSpacing:5,color:C.ds,textTransform:"uppercase",marginTop:16}}>Daily Field Report</div></div>
      <div style={{padding:"20px 20px 0"}}>
        {su?<><LB name={su.name}type={su.type}big/><div style={{height:10}}/>{!sa&&ot.length>0&&<button onClick={()=>setSa(true)}style={{display:"flex",alignItems:"center",gap:8,background:"transparent",border:"none",color:C.dm,cursor:"pointer",fontSize:13,padding:"8px 0"}}>Not {su.name}?</button>}
          {sa&&<div style={{display:"flex",flexDirection:"column",gap:8}}>
            <div style={{fontSize:10,fontWeight:800,letterSpacing:2.5,color:C.dm,textTransform:"uppercase",padding:"6px 0 2px"}}>Foreman</div>
            {ot.filter(p=>p.g==="f").map(p=><LB key={p.name}name={p.name}type={p.type}/>)}
            {ot.some(p=>p.g==="o")&&<><div style={{height:1,background:C.bd,margin:"6px 0"}}/><div style={{fontSize:10,fontWeight:800,letterSpacing:2.5,color:C.ds,textTransform:"uppercase",padding:"6px 0 2px"}}>Office / Trucking</div>{ot.filter(p=>p.g==="o").map(p=><LB key={p.name}name={p.name}type={p.type}/>)}</>}
            {ot.some(p=>p.g==="m")&&<><div style={{fontSize:10,fontWeight:800,letterSpacing:2.5,color:C.ds,textTransform:"uppercase",padding:"10px 0 2px"}}>M.E.P</div>{ot.filter(p=>p.g==="m").map(p=><LB key={p.name}name={p.name}type={p.type}/>)}</>}
          </div>}
        </>:<>
          <div style={{fontSize:10,fontWeight:800,letterSpacing:2.5,color:C.dm,textTransform:"uppercase",marginBottom:10}}>Foreman</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>{aF.map(f=><LB key={f}name={f}type="foreman"/>)}</div>
          <div style={{height:1,background:C.bd,margin:"18px 0"}}/>
          <div style={{fontSize:10,fontWeight:800,letterSpacing:2.5,color:C.ds,textTransform:"uppercase",marginBottom:10}}>Office / Trucking</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>{aW.map(w=><LB key={w}name={w}type="worker"/>)}</div>
          {aM.length>0&&<><div style={{fontSize:10,fontWeight:800,letterSpacing:2.5,color:C.ds,textTransform:"uppercase",padding:"18px 0 10px"}}>M.E.P</div><div style={{display:"flex",flexDirection:"column",gap:8}}>{aM.map(m=><LB key={m}name={m}type="worker"/>)}</div></>}
        </>}
      </div>
      <div style={{padding:"14px 20px"}}><button onClick={()=>sApm(true)}style={{width:"100%",padding:"14px 20px",fontSize:14,fontWeight:600,background:C.cd,border:`1.5px dashed ${C.bd}`,borderRadius:14,color:C.ac,cursor:"pointer",textAlign:"left"}}>+ Add Person</button></div>
      <div style={{padding:"4px 20px 20px"}}><button onClick={()=>sStep("admin")}style={{...BG,fontSize:13,padding:12}}>Admin Panel {pings.length>0&&<span style={{color:C.ac}}> ({pings.length})</span>}</button></div>
      <div style={{textAlign:"center",padding:"0 20px 24px"}}><span onClick={()=>sShowCL(true)}style={{fontSize:11,color:C.ds,cursor:"pointer"}}>v{APP_VER}</span></div>
      {showCL&&<OL onClose={()=>sShowCL(false)}C={C}><div style={{fontSize:18,fontWeight:700,color:C.tx,marginBottom:20}}>Version History</div>{APP_LOG.map(v=><div key={v.ver}style={{marginBottom:20}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><span style={{fontSize:15,fontWeight:700,color:C.bl}}>v{v.ver}</span><span style={{fontSize:12,color:C.dm}}>{v.date}</span></div>{v.changes.map((c,i)=><div key={i}style={{fontSize:13,color:C.ts,padding:"4px 0 4px 12px",borderLeft:`2px solid ${C.bd}`,marginBottom:4,lineHeight:1.5}}>{c}</div>)}</div>)}<button onClick={()=>sShowCL(false)}style={{width:"100%",padding:12,fontSize:14,background:"transparent",color:C.dm,border:`1px solid ${C.bd}`,borderRadius:12,cursor:"pointer",marginTop:8}}>Close</button></OL>}
      {apm&&<APM C={C}onClose={()=>sApm(false)}onAdd={async(n,g)=>{sApm(false);await doAdd(g,n);selUser(n,g==="foremen"?"foreman":"worker")}}/>}
    </div>;
  }

  // ═══ WORKER FORM ═══
  if(step==="wf"){const fj=jobs.filter(j=>j.jn.trim());return <div style={W}>
    <HD right={<>{TB}{BB}</>}><BR sub={eid?"Edit Report":"Field Report"}/></HD>
    <div style={{background:C.acg,borderBottom:`1px solid ${C.ac}22`,padding:"10px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:14,fontWeight:700,color:C.bl}}>{fm}</span><span style={{...PL,fontSize:12}}>{fj.length} jobs · {tjh}h</span></div>
    <div style={S}><label style={L}>Date</label><div onClick={()=>sSdp(true)}style={{...I(false),cursor:"pointer"}}>{fmtDate(dt)}</div></div>
    {jobs.map((j,idx)=><div key={j.id}style={S}><div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><label style={{...L,marginBottom:0}}>Job {idx+1}</label>{jobs.length>1&&<button onClick={()=>sJobs(jobs.filter(x=>x.id!==j.id))}style={{fontSize:12,color:C.dn,background:"none",border:"none",cursor:"pointer",fontWeight:700}}>Remove</button>}</div>
      <div style={{background:C.cd,border:`1px solid ${C.bd}`,borderRadius:16,padding:16}}><div style={{display:"grid",gridTemplateColumns:"1fr 80px",gap:8,marginBottom:10}}><input style={I(false)}placeholder="Job #"value={j.jn}onChange={e=>sJobs(jobs.map(x=>x.id===j.id?{...x,jn:e.target.value}:x))}/><input type="number"inputMode="decimal"step="0.5"style={I(false)}placeholder="Hrs"value={j.hr}onChange={e=>sJobs(jobs.map(x=>x.id===j.id?{...x,hr:e.target.value}:x))}/></div><textarea style={{...I(false),minHeight:60,resize:"vertical",marginBottom:10}}placeholder="Description (speech to text works)"value={j.desc}onChange={e=>sJobs(jobs.map(x=>x.id===j.id?{...x,desc:e.target.value}:x))}/><input style={{...I(false),fontSize:14}}placeholder="Equipment (optional)"value={j.eq}onChange={e=>sJobs(jobs.map(x=>x.id===j.id?{...x,eq:e.target.value}:x))}/></div></div>)}
    <div style={{padding:"14px 20px"}}><button onClick={()=>sJobs([...jobs,{id:uid(),jn:"",hr:"",desc:"",eq:""}])}style={{...BG,fontSize:13,padding:12}}>+ Additional Job</button></div>
    <div style={{padding:"8px 20px 24px"}}><button style={BM(false)}onClick={()=>{const fj2=jobs.filter(j=>j.jn.trim());const msgs=[];if(!fj2.length)msgs.push("Enter at least one job");if(fj2.some(j=>!j.hr||parseFloat(j.hr)<=0))msgs.push("All jobs need hours");if(msgs.length){sCm({title:"Missing Info",icon:"📋",msg:msgs.join("\n"),yL:"OK",nL:false,onYes:()=>sCm(null),onNo:()=>sCm(null)});return}const t=fj2.reduce((s,j)=>s+(parseFloat(j.hr)||0),0);if(t!==8&&t>0&&!oc){sCm({title:"Hours",msg:`${t}h listed. Correct?`,yL:"Yes",nL:"Fix",onYes:()=>{sOc(true);sCm(null);hWsub()},onNo:()=>sCm(null)});return}hWsub()}}>{eid?"Save Changes":"Submit →"}</button></div>
    <DP/>{cm&&<CM{...cm}C={C}/>}
  </div>}

  // ═══ DONE ═══
  if(step==="done")return <div style={W}><HD><BR sub="Field Report"/></HD>
    <div style={{padding:"50px 20px",textAlign:"center"}}><div style={{width:72,height:72,borderRadius:20,background:C.gb,border:`2px solid ${C.gn}33`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",fontSize:32,color:C.gn}}>✓</div><h2 style={{fontSize:24,fontWeight:800,margin:"0 0 8px"}}>{eid?"Updated":"Sent"}</h2><p style={{fontSize:14,color:C.dm,margin:"0 0 32px"}}>{fmtDate(dt)} · {fm}</p>
      <button style={{...BM(false),marginBottom:10}}onClick={()=>{sErr({});sJs(false);sDt(todayStr());sSdp(true);sEid(null);if(rt==="foreman"){sSb(sb.map(b=>({...b,crew:b.crew.map(c=>({...c,hours:"",note:""})),wd:""})));sSubs([]);sSon(false);sSt(false);sHe(false);sEl([]);sStep("form")}else{sJobs([{id:uid(),jn:"",hr:"",desc:"",eq:""}]);sStep("wf")}}}>Submit for Another Day</button>
      <button style={{...BG,marginTop:10}}onClick={goH}>Done</button>
    </div>{tt&&<TT msg={tt}C={C}/>}</div>;

  // ═══ ADMIN ═══
  if(step==="admin"){const days=monthDays(cY,cM),off=firstDow(cY,cM);const mN=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];const dN=["Su","Mo","Tu","We","Th","Fr","Sa"];const today=todayStr();
    const dr=cD?monthReports.filter(r=>r.date===cds(cD)):[];
    const ap=[...aF.map(f=>({name:f,g:"f"})),...aW.map(w=>({name:w,g:"o"})),...aM.map(m=>({name:m,g:"m"}))];
    return <div style={W}>
      <HD right={<>{TB}<button onClick={()=>{sStep("login");sCD(null)}}style={{background:C.ip,border:`1px solid ${C.bd}`,borderRadius:10,padding:"8px 14px",fontSize:13,fontWeight:600,color:C.dm,cursor:"pointer"}}>← Back</button></>}><BR sub="Admin"/></HD>
      {/* Notifications */}
      <div style={S}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><label style={{...L,marginBottom:0}}>Notifications</label>{pings.length>0&&<button onClick={async()=>{await api.clearPings();sPings([])}}style={{fontSize:11,color:C.dm,background:"none",border:"none",cursor:"pointer",textDecoration:"underline"}}>Clear</button>}</div>
        {!pings.length?<div style={{color:C.ds,fontSize:13}}>None</div>:pings.slice(0,5).map(p=><div key={p.id}style={{background:C.bb,border:`1px solid ${C.bl}33`,borderRadius:10,padding:10,marginBottom:6,display:"flex",justifyContent:"space-between"}}><div style={{fontSize:13,fontWeight:600,color:C.tx}}>{p.msg}</div><button onClick={()=>doClearPing(p.id)}style={{background:"none",border:"none",color:C.dm,cursor:"pointer",fontSize:16,fontWeight:700}}>×</button></div>)}
      </div><div style={DV}/>
      {/* Calendar */}
      <div style={S}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}><button onClick={()=>{if(cM===0){sCM(11);sCY(cY-1)}else sCM(cM-1);sCD(null)}}style={{width:36,height:36,borderRadius:10,background:C.cd,border:`1px solid ${C.bd}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:C.tx,cursor:"pointer"}}>←</button><div style={{fontSize:17,fontWeight:700}}>{mN[cM]} {cY}</div><button onClick={()=>{if(cM===11){sCM(0);sCY(cY+1)}else sCM(cM+1);sCD(null)}}style={{width:36,height:36,borderRadius:10,background:C.cd,border:`1px solid ${C.bd}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:C.tx,cursor:"pointer"}}>→</button></div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,textAlign:"center"}}>{dN.map(d=><div key={d}style={{fontSize:10,fontWeight:800,color:C.ds,padding:"6px 0"}}>{d}</div>)}{Array.from({length:off}).map((_,i)=><div key={`e${i}`}/>)}{Array.from({length:days}).map((_,i)=>{const day=i+1,ds=cds(day),dR=monthReports.filter(r=>r.date===ds),dO=monthOff.filter(o=>o.date===ds);const has=dR.length>0||dO.length>0;const allF=aF.every(f=>dR.some(r=>r.foreman===f)||dO.some(o=>o.name===f));const isT=ds===today,isS=cD===day;return <div key={day}onClick={()=>sCD(day)}style={{padding:"8px 2px",borderRadius:10,cursor:"pointer",background:isS?C.acg:"transparent",border:isT?`1.5px solid ${C.ac}55`:allF&&has?`1.5px solid ${C.gn}33`:"1.5px solid transparent"}}><div style={{fontSize:14,fontWeight:isT?800:500,color:isS?C.ac:C.tx}}>{day}</div>{has&&<div style={{width:6,height:6,borderRadius:"50%",background:allF?C.gn:C.ac,margin:"3px auto 0"}}/>}</div>})}</div>
      </div>
      {/* Day Status */}
      {cD&&<><div style={DV}/><div style={S}><label style={{...L,marginBottom:12}}>{fmtDate(cds(cD))} — Status</label>
        {ap.map(p=>{const ds=cds(cD);const isO=monthOff.some(o=>o.name===p.name&&o.date===ds);const pr=dr.filter(r=>r.foreman===p.name);
          return <div key={p.name}>{pr.length>0?pr.map((r,ri)=>{const iw=(r.report_type||r.reportType)==="worker";const sites=r.sites_data||[];const det=iw?`${(r.jobs_data||[]).length} jobs · ${r.total_hrs||0}h`:`${sites.map(s=>s.site).join("+")||r.site} · ${r.total_hrs||0}h`;
            return <SwR key={r.id}C={C}onAction={()=>delRpt(r)}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",border:`1px solid ${C.gn}33`,borderRadius:12,padding:"12px 16px"}}><div onClick={()=>sVr(r)}style={{display:"flex",alignItems:"center",gap:10,flex:1,cursor:"pointer"}}><div style={{width:10,height:10,borderRadius:"50%",background:C.gn}}/><span style={{fontSize:15,fontWeight:700,color:C.gn}}>{p.name}</span>{pr.length>1&&<span style={{fontSize:11,color:C.dm,background:C.bg2,padding:"2px 6px",borderRadius:4}}>#{ri+1}</span>}</div><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:11,color:C.dm}}>{det}</span><span onClick={()=>sVr(r)}style={{color:C.ac,fontSize:14,cursor:"pointer",fontWeight:700}}>→</span></div></div></SwR>}):
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:C.cd,border:`1px solid ${isO?C.dn+"33":C.bd}`,borderRadius:12,padding:"12px 16px",marginBottom:6}}><div style={{display:"flex",alignItems:"center",gap:10}}><div style={{width:10,height:10,borderRadius:"50%",background:isO?C.dn:C.ds+"66"}}/><span style={{fontSize:15,fontWeight:600,color:isO?C.dn:C.ds}}>{p.name}</span></div>{isO?<button onClick={()=>togOff(p.name,ds)}style={{background:C.dnb,border:`1px solid ${C.dn}33`,borderRadius:8,padding:"6px 14px",fontSize:12,fontWeight:700,color:C.dn,cursor:"pointer"}}>OFF ✕</button>:<button onClick={()=>togOff(p.name,ds)}style={{background:C.bg2,border:`1px solid ${C.bd}`,borderRadius:8,padding:"6px 14px",fontSize:12,fontWeight:600,color:C.dm,cursor:"pointer"}}>Off</button>}</div>}
          </div>})}
        {dr.length>0&&<><button onClick={()=>sendDay(cds(cD))}style={{width:"100%",marginTop:14,padding:14,fontSize:14,fontWeight:700,borderRadius:14,background:C.bb,color:C.bl,border:`1.5px solid ${C.bl}33`,cursor:"pointer",textAlign:"center"}}>✉ Send All Reports</button><button onClick={()=>manualEmail(dr)}style={{width:"100%",marginTop:8,padding:10,fontSize:12,fontWeight:600,borderRadius:10,background:"transparent",color:C.ds,border:`1px solid ${C.bd}`,cursor:"pointer"}}>Manual Email Fallback</button></>}
      </div></>}
      <div style={DV}/>
      {/* Recipients */}
      <div style={S}><label style={{...L,marginBottom:8}}>Email Recipients</label>
        {rc.map(r=><div key={r.id}style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:C.cd,border:`1px solid ${r.active?C.gn+"33":C.bd}`,borderRadius:12,padding:"10px 16px",marginBottom:6}}><div style={{display:"flex",alignItems:"center",gap:10}}><div onClick={async()=>{const x=await api.toggleRecipient(r.id,!r.active);sRc(x.recipients)}}style={{...CK(r.active),width:22,height:22,fontSize:12,cursor:"pointer"}}>{r.active?"✓":""}</div><span style={{fontSize:14,fontWeight:600,color:r.active?C.tx:C.dm}}>{r.email}</span></div><button onClick={async()=>{const x=await api.deleteRecipient(r.id);sRc(x.recipients)}}style={{background:"none",border:"none",color:C.dn,fontSize:16,fontWeight:700,cursor:"pointer"}}>×</button></div>)}
        <div style={{display:"flex",gap:8,marginTop:8}}><input style={{...I(false),flex:1,fontSize:14}}placeholder="email"value={re}onChange={e=>sRe(e.target.value)}/><button onClick={handleAddRecip}style={{padding:"0 16px",fontWeight:700,background:`linear-gradient(135deg,${C.ac},${C.acd})`,color:"#000",border:"none",borderRadius:10,cursor:"pointer"}}>+</button></div>
      </div><div style={DV}/>
      {/* Lists */}
      <div style={S}>
        {[{key:"foremen",label:"Foremen"},{key:"sites",label:"Job Sites"},{key:"employees",label:"Crew"},{key:"workers",label:"Office / Trucking"},{key:"mep",label:"M.E.P"}].map(({key,label})=>{const list=listMap[key][0];return <div key={key}style={{marginBottom:20}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}><label style={{...L,marginBottom:0}}>{label} ({list.length})</label><button onClick={()=>sAddMod({type:key,title:`Add ${label}`,placeholder:"Name"})}style={{width:36,height:36,borderRadius:10,border:`1.5px dashed ${C.bd}`,background:"transparent",color:C.ac,fontSize:18,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>+</button></div>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>{list.map((n,i)=><LPChip key={n}label={n}active={false}C={C}onTap={()=>{}}onLong={()=>sEditMod({title:`Edit: ${n}`,value:n,canDelete:true,onSave:async v=>{await doEdit(key,i,v);sEditMod(null)},onDelete:async()=>{await doDelete(key,i);sEditMod(null)}})}/>)}</div>
        </div>})}
        <div style={{fontSize:11,color:C.ds,textAlign:"center"}}>Hold press to edit or delete</div>
      </div>
      {vr&&<RV report={vr}onClose={()=>sVr(null)}onEdit={editRpt}onSend={sendRpt}C={C}/>}
      {editMod&&<EditModal{...editMod}C={C}onClose={()=>sEditMod(null)}/>}
      {addMod&&<AddModal title={addMod.title}placeholder={addMod.placeholder}C={C}onClose={()=>sAddMod(null)}onAdd={async v=>{await doAdd(addMod.type,v);sAddMod(null)}}/>}
      {cm&&<CM{...cm}C={C}/>}{tt&&<TT msg={tt}C={C}/>}
      {dt2&&<div style={{position:"fixed",bottom:90,left:16,right:16,maxWidth:448,margin:"0 auto",zIndex:9999,background:C.cd,border:`1px solid ${C.dn}44`,borderRadius:14,padding:"14px 18px",display:"flex",alignItems:"center",justifyContent:"space-between"}}><div style={{display:"flex",alignItems:"center",gap:10}}><span style={{color:C.dn}}>🗑</span><span style={{fontSize:14,fontWeight:600,color:C.tx}}>{dt2.msg}</span></div><button onClick={()=>reinst(dt2.rpt)}style={{fontSize:12,fontWeight:700,color:C.bl,background:C.bb,border:`1px solid ${C.bl}33`,borderRadius:8,padding:"6px 12px",cursor:"pointer"}}>Undo</button></div>}
    </div>}

  // ═══ FOREMAN REVIEW ═══
  if(step==="review")return <div style={W}><HD><BR sub="Review"/></HD><div style={S}>
    <div style={{background:C.cd,border:`1px solid ${C.bd}`,borderRadius:16,padding:18,marginBottom:16}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}><div><div style={{...L,marginBottom:3}}>Foreman</div><div style={{fontSize:16,fontWeight:700}}>{fm}</div></div><div><div style={{...L,marginBottom:3}}>Date</div><div style={{fontSize:16,fontWeight:700}}>{fmtDate(dt)}</div></div></div><div style={{display:"flex",gap:14}}><span style={{fontSize:13,color:st?C.gn:C.ds}}>{st?"✓":"✗"} Safety</span><span style={{fontSize:13,color:son?C.ac:C.ds}}>{son?"✓":"✗"} Subs</span>{he&&<span style={{fontSize:13,color:C.ac}}>✓ Equip</span>}</div></div>
    {sb.filter(b=>b.site).map((b,bi)=><div key={b.id}style={{background:C.cd,border:`1px solid ${C.bd}`,borderRadius:16,padding:18,marginBottom:14,borderLeft:`4px solid ${SC[bi%SC.length]}`}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}><div style={{fontSize:16,fontWeight:700}}>{b.site}</div><span style={PL}>{b.crew.reduce((s,c)=>s+(parseFloat(c.hours)||0),0)}h</span></div>{b.crew.map(c=><div key={c.id}style={{display:"flex",justifyContent:"space-between",padding:"5px 0"}}><div style={{display:"flex",gap:8}}><span style={{fontSize:14,fontWeight:600}}>{c.name}</span>{c.isForeman&&<span style={{fontSize:9,fontWeight:800,color:C.gn,background:C.gb,padding:"2px 6px",borderRadius:5}}>FM</span>}</div><span style={{color:C.ac,fontWeight:700}}>{c.hours}h</span></div>)}{b.wd&&<div style={{fontSize:14,color:C.ts,borderLeft:`3px solid ${C.bl}`,paddingLeft:12,marginTop:10,lineHeight:1.6}}>{b.wd}</div>}</div>)}
    <div style={{marginTop:20,display:"flex",flexDirection:"column",gap:10}}><button style={BM(snd)}onClick={hSub}disabled={snd}>{snd?"Sending...":(eid?"Save Changes":"Submit Report")}</button><button style={BG}onClick={()=>sStep("form")}>← Edit</button></div>
  </div>{cm&&<CM{...cm}C={C}/>}</div>;

  // ═══ FOREMAN FORM ═══
  return <div style={W}>
    <HD right={<>{TB}{BB}</>}><BR sub={eid?"Edit Report":"Daily Field Report"}/></HD>
    <div style={{background:C.acg,borderBottom:`1px solid ${C.ac}22`,padding:"10px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:14,fontWeight:700,color:C.bl}}>{fm}</span><span style={PL}>{ac2.size} crew · {th}h</span></div>
    <div style={S}><label style={L}>Date</label><div onClick={()=>sSdp(true)}style={{...I(false),cursor:"pointer",display:"flex",justifyContent:"space-between"}}><span>{fmtDate(dt)}</span><span style={{color:C.dm,fontSize:13}}>Change</span></div></div>

    {sb.map((block,bi)=>{const bc=SC[bi%SC.length];const av=aE.filter(n=>!block.crew.some(c=>c.name===n));const hasFm=block.crew.some(c=>c.isForeman);
      return <div key={block.id}>{bi>0&&<div style={DV}/>}<div style={S}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}><div style={{width:4,height:28,borderRadius:2,background:bc}}/><div><div style={{fontSize:10,fontWeight:800,letterSpacing:2.5,color:C.dm,textTransform:"uppercase"}}>Site {bi+1}</div>{block.site?<div style={{fontSize:17,fontWeight:700,color:C.tx,marginTop:2}}>{block.site}</div>:<div style={{fontSize:14,color:C.dn,marginTop:2}}>Select a site</div>}</div></div>
          <div style={{display:"flex",gap:8}}><button onClick={()=>sSpf(block.id)}style={{background:C.ip,border:`1px solid ${C.bd}`,borderRadius:8,padding:"6px 12px",fontSize:12,fontWeight:600,color:C.bl,cursor:"pointer"}}>{block.site?"Change":"Pick"}</button>{sb.length>1&&<button onClick={()=>rsb(block.id)}style={{background:"none",border:"none",color:C.dn,fontSize:16,fontWeight:700,cursor:"pointer"}}>×</button>}</div>
        </div>
        <div style={{background:C.cd,border:`1px solid ${C.bd}`,borderRadius:16,padding:16}}>
          {block.crew.map(c=><div key={c.id}style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:`1px solid ${C.bd}`}}>
            <div style={{flex:1,display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:15,fontWeight:600}}>{c.name}</span>{c.isForeman&&<span style={{fontSize:9,fontWeight:800,color:C.gn,background:C.gb,padding:"3px 8px",borderRadius:6}}>FM</span>}</div>
            <input type="number"inputMode="decimal"step="0.5"style={{width:60,padding:"8px 10px",fontSize:15,fontWeight:600,background:C.ip,border:`1.5px solid ${C.bd}`,borderRadius:8,color:C.ac,textAlign:"center",outline:"none",boxSizing:"border-box",WebkitAppearance:"none"}}placeholder="Hrs"value={c.hours}onChange={e=>ucb(block.id,c.id,"hours",e.target.value)}/>
            <button onClick={()=>rcb(block.id,c.id)}style={{background:"none",border:"none",color:C.dn,fontSize:14,fontWeight:700,cursor:"pointer"}}>×</button>
          </div>)}
          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:12,paddingTop:12,borderTop:`1px solid ${C.bd}`}}>
            {!hasFm&&<div onClick={()=>acb(block.id,fm,true)}style={{padding:"7px 12px",fontSize:12,fontWeight:700,borderRadius:20,border:`1.5px solid ${C.gn}44`,color:C.gn,background:C.gb,cursor:"pointer"}}>+ {fm} (FM)</div>}
            {av.slice(0,5).map(n=><div key={n}onClick={()=>acb(block.id,n)}style={{padding:"7px 12px",fontSize:12,fontWeight:600,borderRadius:20,border:`1px solid ${C.bd}`,color:C.dm,background:C.ip,cursor:"pointer"}}>{n}</div>)}
            {av.length>5&&<div onClick={()=>sSac(sac===block.id?null:block.id)}style={{padding:"7px 12px",fontSize:12,fontWeight:600,borderRadius:20,border:`1px solid ${C.bd}`,color:C.ds,cursor:"pointer"}}>+{av.length-5} more</div>}
          </div>
          {sac===block.id&&<div style={{marginTop:10,display:"flex",flexWrap:"wrap",gap:6,padding:12,background:C.bg2,borderRadius:12}}>{av.map(n=><div key={n}onClick={()=>acb(block.id,n)}style={{padding:"7px 12px",fontSize:12,fontWeight:600,borderRadius:20,border:`1px solid ${C.bd}`,color:C.tx,background:C.cd,cursor:"pointer"}}>{n}</div>)}</div>}
        </div>
        <div style={{marginTop:14}}><label style={L}>Work at {block.site||"this site"}</label><textarea style={{...I(false),minHeight:80,resize:"vertical"}}placeholder="What was done... (speech to text works)"value={block.wd}onChange={e=>ub(block.id,"wd",e.target.value)}/></div>
      </div></div>})}

    <div style={{padding:"16px 20px"}}><button onClick={asb}style={{width:"100%",padding:14,fontSize:14,fontWeight:600,background:C.cd,border:`1.5px dashed ${C.bd}`,borderRadius:14,color:C.bl,cursor:"pointer",textAlign:"center"}}>+ Add Another Site</button></div>
    <div style={DV}/>
    <div style={S}>
      <div onClick={()=>sSt(!st)}style={{display:"flex",alignItems:"center",gap:14,cursor:"pointer",padding:"12px 0"}}><div style={CK(st)}>{st?"✓":""}</div><span style={{fontSize:15,fontWeight:600}}>Morning safety talk</span></div>
      <div onClick={()=>{sSon(!son);if(son)sSubs([])}}style={{display:"flex",alignItems:"center",gap:14,cursor:"pointer",padding:"12px 0"}}><div style={CK(son)}>{son?"✓":""}</div><span style={{fontSize:15,fontWeight:600}}>Subcontractors on site</span></div>
      {son&&<div style={{marginLeft:40,marginTop:6}}><div style={{display:"flex",gap:8,marginBottom:10}}><input style={{...I(false),flex:1}}placeholder="Sub name"value={sn}onChange={e=>sSn(e.target.value)}onKeyDown={e=>{if(e.key==="Enter"){const n=sn.trim();if(n){sSubs([...subs,{name:n,hours:sh2.trim()||""}]);sSn("");sSh("")}}}}/><input type="number"inputMode="decimal"step="0.5"style={{...I(false),width:72}}placeholder="Hrs"value={sh2}onChange={e=>sSh(e.target.value)}/><button onClick={()=>{const n=sn.trim();if(n){sSubs([...subs,{name:n,hours:sh2.trim()||""}]);sSn("");sSh("")}}}style={{padding:"0 14px",fontSize:18,fontWeight:700,background:`linear-gradient(135deg,${C.ac},${C.acd})`,color:"#000",border:"none",borderRadius:10,cursor:"pointer"}}>+</button></div><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{subs.map((s,i)=><div key={i}style={{display:"inline-flex",alignItems:"center",gap:8,background:C.cd,border:`1px solid ${C.bd}`,borderRadius:10,padding:"8px 12px",fontSize:13}}><span>{s.name}{s.hours?` (${s.hours}h)`:""}</span><span onClick={()=>sSubs(subs.filter((_,j)=>j!==i))}style={{cursor:"pointer",color:C.dn,fontWeight:700}}>×</span></div>)}</div></div>}
      <div onClick={()=>{sHe(!he);if(he)sEl([])}}style={{display:"flex",alignItems:"center",gap:14,cursor:"pointer",padding:"12px 0"}}><div style={CK(he)}>{he?"✓":""}</div><span style={{fontSize:15,fontWeight:600}}>Equipment</span></div>
      {he&&<div style={{marginLeft:40,marginTop:6}}><div style={{display:"flex",gap:8,marginBottom:10}}><input style={{...I(false),flex:1}}placeholder="Equipment"value={eni}onChange={e=>sEni(e.target.value)}/><input type="number"inputMode="decimal"step="0.5"style={{...I(false),width:72}}placeholder="Hrs"value={ehi}onChange={e=>sEhi(e.target.value)}onKeyDown={e=>{if(e.key==="Enter"){const n=eni.trim(),h=ehi.trim();if(n&&h){sEl([...el,{name:n,hours:parseFloat(h)||0}]);sEni("");sEhi("")}}}}/><button onClick={()=>{const n=eni.trim(),h=ehi.trim();if(n&&h){sEl([...el,{name:n,hours:parseFloat(h)||0}]);sEni("");sEhi("")}}}style={{padding:"0 14px",fontSize:18,fontWeight:700,background:`linear-gradient(135deg,${C.ac},${C.acd})`,color:"#000",border:"none",borderRadius:10,cursor:"pointer"}}>+</button></div><div style={{display:"flex",flexDirection:"column",gap:6}}>{el.map((eq,i)=><div key={i}style={{display:"flex",justifyContent:"space-between",background:C.cd,border:`1px solid ${C.bd}`,borderRadius:10,padding:"10px 14px"}}><span style={{fontWeight:600}}>{eq.name}</span><div style={{display:"flex",gap:8}}><span style={{color:C.ac,fontWeight:700}}>{eq.hours}h</span><span onClick={()=>sEl(el.filter((_,j)=>j!==i))}style={{cursor:"pointer",color:C.dn,fontWeight:700}}>×</span></div></div>)}</div></div>}
    </div>
    <div style={{padding:"20px"}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 18px",background:C.cd,border:`1px solid ${C.bd}`,borderRadius:14,marginBottom:14}}><div><div style={{fontSize:11,color:C.dm}}>Summary</div><div style={{fontSize:15,fontWeight:700,marginTop:2}}>{sb.filter(b=>b.site).length} site{sb.filter(b=>b.site).length!==1?"s":""} · {ac2.size} crew · {th}h</div></div></div>
      <button style={BM(false)}onClick={()=>{const e={};const msgs=[];sb.forEach((b,i)=>{const sn2=b.site||`Site ${i+1}`;if(!b.site){e[`s${i}`]=1;msgs.push(`${sn2}: Select a job site`)}if(!b.crew.length){e[`c${i}`]=1;msgs.push(`${sn2}: Add crew`)}else if(b.crew.some(c=>!c.hours||parseFloat(c.hours)<=0)){e[`h${i}`]=1;msgs.push(`${sn2}: All crew need hours`)}if(!b.wd.trim()){e[`d${i}`]=1;msgs.push(`${sn2}: Work description required`)}});if(son&&!subs.length){e.subs=1;msgs.push("Add at least one subcontractor")}if(he&&el.some(x=>!x.hours)){e.eh=1;msgs.push("All equipment needs hours")}if(msgs.length){sErr(e);sCm({title:"Missing Info",icon:"📋",msg:msgs.join("\n"),yL:"OK",nL:false,onYes:()=>sCm(null),onNo:()=>sCm(null)});return}if(!he){sCm({title:"No Equipment",msg:"No equipment today?",yL:"Correct",nL:"Go back",onYes:()=>{sCm(null);sStep("review")},onNo:()=>sCm(null)});return}sStep("review")}}>{eid?"Review Changes →":"Review & Submit →"}</button></div>
    {spf&&<SP sites={aS}C={C}onClose={()=>sSpf(null)}onPick={s=>psb(spf,s)}/>}
    <DP/>{cm&&<CM{...cm}C={C}/>}{tt&&<TT msg={tt}C={C}/>}
  </div>;
}
