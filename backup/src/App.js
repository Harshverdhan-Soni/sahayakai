import { useState, useEffect, useRef, createContext, useContext } from "react";

// ── Theme Context ─────────────────────────────────────────────────
const ThemeContext = createContext("dark");
const useTheme = () => useContext(ThemeContext);

const THEMES = {
  dark: {
    navy:    "#06172E",
    navy2:   "#0A2240",
    steel:   "#0F3460",
    saffron: "#F7941D",
    saffronD:"#C47510",
    green:   "#1A8A34",
    greenL:  "#22C55E",
    gold:    "#D4A017",
    smoke:   "#E8EEF6",
    mid:     "#7A90A8",
    dim:     "#3A5068",
    white:   "#FFFFFF",
    red:     "#E53935",
    blue:    "#2196F3",
    teal:    "#00897B",
    purple:  "#7B1FA2",
    // semantic aliases
    bg:      "#06172E",
    surface: "#0A2240",
    surfaceHover: "#0F3460",
    border:  "#3A5068",
    text:    "#E8EEF6",
    textMid: "#7A90A8",
    textDim: "#3A5068",
    inputBg: "#0F346044",
  },
  light: {
    navy:    "#F0F4FA",
    navy2:   "#FFFFFF",
    steel:   "#E8EEF8",
    saffron: "#D4760A",
    saffronD:"#B05E06",
    green:   "#1A6E2E",
    greenL:  "#16A34A",
    gold:    "#B07D0A",
    smoke:   "#1A2A3A",
    mid:     "#4A6278",
    dim:     "#C0CCE0",
    white:   "#1A2A3A",
    red:     "#DC2626",
    blue:    "#1D72C8",
    teal:    "#0D7A6E",
    purple:  "#6B21A8",
    // semantic aliases
    bg:      "#F0F4FA",
    surface: "#FFFFFF",
    surfaceHover: "#E8EEF8",
    border:  "#C8D4E8",
    text:    "#1A2A3A",
    textMid: "#4A6278",
    textDim: "#C0CCE0",
    inputBg: "#E8EEF888",
  },
};

// ── C is now provided by useTheme() hook — see THEMES above ──

// ── Mock Data ────────────────────────────────────────────────────
const MOCK = {
  officer: { name: "Shri Arvind Kumar", role: "Section Officer", dept: "Department of Administrative Reforms", grade: "Group B Gazetted" },
  mcpStatus: { connected: true, server: "sahayak-mcp-v1.0", tools: 34, latency: "42ms" },
  pending: [
    { id:"F/2024/1842", type:"File", subject:"Budget Approval – Q4 Infrastructure", age:"5 days", priority:"High", from:"Joint Secretary" },
    { id:"RTI/2024/0391", type:"RTI", subject:"Information on Staff Transfers 2023-24", age:"12 days", priority:"Urgent", from:"Citizen Portal" },
    { id:"GRV/2024/0218", type:"Grievance", subject:"Delay in Pension Processing", age:"8 days", priority:"High", from:"CPGRAMS" },
    { id:"F/2024/1798", type:"File", subject:"Annual Report Draft Review", age:"2 days", priority:"Normal", from:"Director" },
    { id:"MTG/2024/112", type:"Meeting", subject:"Review Meeting – Digital India Scheme", age:"1 day", priority:"Normal", from:"Secretary Office" },
  ],
  leaveData: [
    { name:"Shri R. Sharma", type:"CL", from:"15 Jan", to:"17 Jan", status:"Pending", balance:8 },
    { name:"Smt. P. Verma", type:"EL", from:"20 Jan", to:"31 Jan", status:"Approved", balance:22 },
    { name:"Shri K. Singh", type:"CL", from:"18 Jan", to:"18 Jan", status:"Pending", balance:3 },
  ],
  tourData: [
    { officer:"Shri A. Mehta", dest:"Mumbai", from:"16 Jan", to:"18 Jan", purpose:"Training Programme", status:"Approved", taDA:"₹14,200" },
    { officer:"Smt. S. Gupta", dest:"Bengaluru", from:"22 Jan", to:"24 Jan", purpose:"Inter-Ministry Meet", status:"Pending", taDA:"₹18,600" },
  ],
  momItems: [
    { action:"Prepare Q4 budget summary note", owner:"Shri Kumar", deadline:"20 Jan 2025", status:"Pending" },
    { action:"Circulate revised SOP for file movement", owner:"Smt. Verma", deadline:"22 Jan 2025", status:"In Progress" },
    { action:"Submit ATR on audit para #14", owner:"Shri Singh", deadline:"18 Jan 2025", status:"Overdue" },
    { action:"Coordinate with NIC for portal update", owner:"IT Cell", deadline:"25 Jan 2025", status:"Pending" },
  ],
  misMetrics: [
    { label:"Files Pending >30 Days", value:14, trend:"-3", color:"#E53935" },
    { label:"RTI Compliance Rate", value:"94%", trend:"+2%", color:"#22C55E" },
    { label:"Grievances Disposed", value:87, trend:"+12", color:"#2196F3" },
    { label:"Meeting Actions Overdue", value:6, trend:"-1", color:"#F7941D" },
  ],
  agentLog: [
    { ts:"10:42:15", agent:"Document Classifier", action:"Classified F/2024/1842 as Budget File → Routed to Finance Section", status:"done" },
    { ts:"10:41:03", agent:"RTI Deadline Monitor", action:"Alert: RTI/2024/0391 due in 3 days – draft reply recommended", status:"alert" },
    { ts:"10:38:47", agent:"MOM Extractor", action:"Extracted 4 action items from MTG/2024/112 transcript", status:"done" },
    { ts:"10:35:22", agent:"Leave Pattern Agent", action:"Anomaly: 3 leave applications during audit period – flagged for review", status:"warn" },
    { ts:"10:31:09", agent:"MIS Generator", action:"Weekly pendency report generated and queued for officer review", status:"done" },
    { ts:"10:28:44", agent:"Grievance Classifier", action:"GRV/2024/0218 mapped to Pension Section – SOP timeline: 30 days", status:"done" },
  ],
};

// ══════════════════════════════════════════════════════════════════
//  NOTIFICATION SYSTEM
// ══════════════════════════════════════════════════════════════════

// Notification seed data — what SAHAYAK monitors and surfaces
const NOTIF_SEEDS = [
  {
    id:"n1", type:"urgent", agent:"RTI Deadline Monitor",
    title:"RTI Deadline in 3 Days",
    body:"RTI/2024/0391 (Staff Transfers 2023-24) statutory reply deadline is 17 Jan 2025. Non-compliance attracts penalty under RTI Act.",
    time: 0, // fires immediately on load
    cta:"Draft reply now",
    ctaPrompt:"Draft a reply for RTI/2024/0391 about staff transfers 2023-24 citing relevant sections.",
    ref:"RTI/2024/0391", module:"rti",
    icon:"⚖️", color:"#E53935",
  },
  {
    id:"n2", type:"warning", agent:"Leave Pattern Agent",
    title:"Leave Cluster During Audit Week",
    body:"3 staff members have applied for leave during 15–20 Jan (internal audit period). Section may be understaffed.",
    time: 18000, // 18s
    cta:"Review leave applications",
    ctaPrompt:"Check if the leave applications from Shri K. Singh and Shri R. Sharma are policy compliant.",
    ref:"LMS · iHRMS", module:"leave",
    icon:"🗓", color:"#F7941D",
  },
  {
    id:"n3", type:"info", agent:"MOM Follow-up Agent",
    title:"Action Item Overdue — ATR Para #14",
    body:"Shri K. Singh has not submitted ATR on Audit Para #14. Deadline was today. Escalation may be required.",
    time: 35000, // 35s
    cta:"Send escalation reminder",
    ctaPrompt:"List all meeting action items that are overdue and suggest escalation steps.",
    ref:"MTG/2024/112", module:"meetings",
    icon:"📝", color:"#2196F3",
  },
  {
    id:"n4", type:"warning", agent:"Grievance SLA Monitor",
    title:"Grievance SLA Breached",
    body:"GRV/2024/0201 (Leave Encashment) SLA was 15 Jan. Now 4 days overdue. CPGRAMS score at risk.",
    time: 52000, // 52s
    cta:"Draft disposal note",
    ctaPrompt:"What is the SLA status of all open grievances? Which ones need immediate action?",
    ref:"GRV/2024/0201", module:"rti",
    icon:"⚠️", color:"#E53935",
  },
  {
    id:"n5", type:"info", agent:"iHRMS Data Validator",
    title:"Payroll Anomaly Detected — Shri K. Singh",
    body:"Grade Pay in payroll (₹4,200) doesn't match Service Book (₹4,600 post-MACP). Possible underpayment since Aug 2024.",
    time: 75000, // 75s
    cta:"View & raise correction",
    ctaPrompt:"Run a data validation check on all employee records in iHRMS and report any discrepancies.",
    ref:"EMD · 10412", module:"hrdata",
    icon:"👤", color:"#00BCD4",
  },
  {
    id:"n6", type:"info", agent:"MIS Generator",
    title:"Weekly MIS Report Ready",
    body:"Your section's weekly pendency report has been generated. 2 SLA breaches flagged. Review before circulation.",
    time: 100000, // 100s
    cta:"Review & circulate",
    ctaPrompt:"Generate the weekly MIS pendency report for all sections and flag any SLA breaches.",
    ref:"MIS W/E 14 Jan", module:"mis",
    icon:"📊", color:"#D4A017",
  },
  {
    id:"n7", type:"warning", agent:"Tour Policy Agent",
    title:"Tour Sanction Pending — Smt. S. Gupta",
    body:"Bengaluru tour (22–24 Jan) requires advance sanction. Estimated ₹21,600 exceeds ₹10,000 threshold. No sanction obtained yet.",
    time: 130000,
    cta:"Draft sanction request",
    ctaPrompt:"Calculate TA/DA for Smt. S. Gupta's upcoming tour to Bengaluru and check policy compliance.",
    ref:"TMS · iHRMS", module:"tour",
    icon:"✈️", color:"#7B1FA2",
  },
  {
    id:"n8", type:"urgent", agent:"File Priority Agent",
    title:"Budget File Pending 5 Days",
    body:"F/2024/1842 (Budget Approval Q4 Infrastructure) from Joint Secretary has been pending 5 days. Marked high priority.",
    time: 160000,
    cta:"Summarise & act on file",
    ctaPrompt:"Summarise all my pending files and tell me which ones need urgent attention today.",
    ref:"F/2024/1842", module:"files",
    icon:"📁", color:"#F7941D",
  },
];

// ── Toast notification (bottom-right pop-up) ─────────────────────
const NotifToast = ({ notif, onDismiss, onAction }) => {
  const C = useTheme();
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 40);
    return () => clearTimeout(t1);
  }, []);

  const dismiss = () => {
    setLeaving(true);
    setTimeout(onDismiss, 320);
  };

  const borderCol = notif.type === "urgent" ? C.red : notif.type === "warning" ? C.saffron : C.blue;

  return (
    <>
      <style>{`
        @keyframes slideIn  { from { transform:translateX(120%); opacity:0; } to { transform:translateX(0); opacity:1; } }
        @keyframes slideOut { from { transform:translateX(0); opacity:1; } to { transform:translateX(120%); opacity:0; } }
        @keyframes ringBell { 0%,100%{transform:rotate(0)} 20%{transform:rotate(-18deg)} 40%{transform:rotate(18deg)} 60%{transform:rotate(-12deg)} 80%{transform:rotate(8deg)} }
      `}</style>
      <div style={{
        width: 340,
        background: C.surface,
        border: `1px solid ${borderCol}66`,
        borderLeft: `4px solid ${borderCol}`,
        borderRadius: 8,
        padding: "14px 14px 12px",
        boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 20px ${borderCol}22`,
        animation: `${leaving ? "slideOut" : visible ? "slideIn" : "none"} 0.32s ease forwards`,
        position: "relative",
        overflow: "hidden",
      }}>
        {/* shimmer line */}
        <div style={{ position:"absolute", top:0, left:0, right:0, height:2,
          background:`linear-gradient(90deg, transparent, ${borderCol}88, transparent)`,
          animation:"shimmer 2s linear infinite" }} />
        <style>{`@keyframes shimmer{from{transform:translateX(-100%)}to{transform:translateX(100%)}}`}</style>

        {/* header */}
        <div style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:8 }}>
          <div style={{ width:32, height:32, borderRadius:6, background:`${notif.color}22`,
            border:`1px solid ${notif.color}44`, display:"flex", alignItems:"center",
            justifyContent:"center", fontSize:16, flexShrink:0 }}>
            {notif.icon}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:6 }}>
              <span style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:13, fontWeight:700,
                color:C.white, letterSpacing:0.5, lineHeight:1.2 }}>{notif.title}</span>
              <button onClick={dismiss}
                style={{ background:"none", border:"none", color:C.dim, cursor:"pointer",
                  fontSize:14, lineHeight:1, flexShrink:0, padding:"0 2px" }}>×</button>
            </div>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:notif.color,
              letterSpacing:1, marginTop:2 }}>⬡ {notif.agent}</div>
          </div>
        </div>

        {/* body */}
        <div style={{ fontSize:12, color:"#9BB0C8", lineHeight:1.6, marginBottom:10 }}>
          {notif.body}
        </div>

        {/* ref tag */}
        <div style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:C.dim,
          marginBottom:10, letterSpacing:0.5 }}>ref: {notif.ref}</div>

        {/* actions */}
        <div style={{ display:"flex", gap:7 }}>
          <button onClick={() => { onAction(notif); dismiss(); }}
            style={{ flex:1, background:`${borderCol}22`, color:borderCol,
              border:`1px solid ${borderCol}55`, borderRadius:4, padding:"5px 10px",
              fontSize:11, cursor:"pointer", fontFamily:"'Rajdhani',sans-serif",
              fontWeight:700, letterSpacing:0.3 }}>
            ⬡ {notif.cta}
          </button>
          <button onClick={dismiss}
            style={{ background:`${C.dim}33`, color:C.mid, border:`1px solid ${C.dim}55`,
              borderRadius:4, padding:"5px 10px", fontSize:11, cursor:"pointer",
              fontFamily:"'DM Mono',monospace" }}>
            Later
          </button>
        </div>
      </div>
    </>
  );
};

// ── Notification Bell (header) ────────────────────────────────────
const NotifBell = ({ count, onClick, hasUrgent }) => { const C = useTheme(); return (
  <button onClick={onClick}
    style={{ position:"relative", background: hasUrgent ? `${C.red}18` : `${C.dim}33`,
      border:`1px solid ${hasUrgent ? C.red+"66" : C.dim+"66"}`, borderRadius:6,
      padding:"5px 10px", cursor:"pointer", display:"flex", alignItems:"center", gap:6,
      transition:"all 0.2s" }}>
    <style>{`@keyframes ringBell{0%,100%{transform:rotate(0)}20%{transform:rotate(-15deg)}40%{transform:rotate(15deg)}60%{transform:rotate(-10deg)}80%{transform:rotate(6deg)}}`}</style>
    <span style={{ fontSize:16, display:"inline-block",
      animation: hasUrgent ? "ringBell 2s ease infinite" : "none" }}>🔔</span>
    {count > 0 && (
      <span style={{ position:"absolute", top:-5, right:-5, minWidth:17, height:17,
        background: hasUrgent ? C.red : C.saffron, borderRadius:10, display:"flex",
        alignItems:"center", justifyContent:"center", fontFamily:"'DM Mono',monospace",
        fontSize:9, fontWeight:700, color:C.white, border:`2px solid ${C.surface}`,
        padding:"0 3px" }}>
        {count > 9 ? "9+" : count}
      </span>
    )}
  </button>
); };

// ── Notification Centre Panel ─────────────────────────────────────
const NotifCenter = ({ notifs, onClose, onAction, onClear }) => {
  const C = useTheme();
  const typeOrder = { urgent:0, warning:1, info:2 };
  const sorted = [...notifs].sort((a,b) => typeOrder[a.type]-typeOrder[b.type]);

  return (
    <div style={{ position:"absolute", top:54, right:16, width:380, zIndex:1000,
      background:C.surface, border:`1px solid ${C.dim}66`,
      borderRadius:8, boxShadow:"0 16px 48px rgba(0,0,0,0.6)",
      overflow:"hidden", display:"flex", flexDirection:"column" }}>

      {/* header */}
      <div style={{ padding:"12px 16px", borderBottom:`1px solid ${C.dim}44`,
        display:"flex", alignItems:"center", justifyContent:"space-between",
        background:`${C.surfaceHover}99` }}>
        <div>
          <span style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:15, fontWeight:700,
            color:C.white, letterSpacing:1 }}>Notifications</span>
          <span style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:C.mid,
            marginLeft:8 }}>SAHAYAK-AI Personal Assistant</span>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          {notifs.length > 0 && (
            <button onClick={onClear}
              style={{ background:"none", border:`1px solid ${C.dim}66`, borderRadius:4,
                color:C.mid, cursor:"pointer", fontSize:10, padding:"2px 8px",
                fontFamily:"'DM Mono',monospace" }}>Clear all</button>
          )}
          <button onClick={onClose}
            style={{ background:"none", border:"none", color:C.mid, cursor:"pointer",
              fontSize:16, lineHeight:1 }}>×</button>
        </div>
      </div>

      {/* list */}
      <div style={{ maxHeight:480, overflowY:"auto" }}>
        {sorted.length === 0 ? (
          <div style={{ padding:"32px 20px", textAlign:"center", color:C.dim,
            fontFamily:"'DM Mono',monospace", fontSize:11 }}>
            <div style={{ fontSize:28, marginBottom:8 }}>✓</div>
            All caught up! No pending notifications.
          </div>
        ) : sorted.map((n, i) => {
          const borderCol = n.type==="urgent" ? C.red : n.type==="warning" ? C.saffron : C.blue;
          return (
            <div key={n.id} style={{ padding:"12px 16px",
              borderBottom:`1px solid ${C.dim}33`,
              borderLeft:`3px solid ${borderCol}`,
              background: i===0 ? `${borderCol}08` : "transparent",
              transition:"background 0.2s" }}>
              <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                <div style={{ width:28, height:28, borderRadius:5,
                  background:`${n.color}18`, border:`1px solid ${n.color}33`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:13, flexShrink:0 }}>{n.icon}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", gap:4 }}>
                    <span style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:13,
                      fontWeight:700, color:C.white }}>{n.title}</span>
                    <span style={{ fontFamily:"'DM Mono',monospace", fontSize:8,
                      color:borderCol, letterSpacing:1, flexShrink:0, textTransform:"uppercase" }}>
                      {n.type}
                    </span>
                  </div>
                  <div style={{ fontFamily:"'DM Mono',monospace", fontSize:9,
                    color:n.color, marginTop:1 }}>⬡ {n.agent} · {n.ref}</div>
                  <div style={{ fontSize:12, color:"#8A9BB0", lineHeight:1.5, marginTop:4 }}>
                    {n.body}
                  </div>
                  <div style={{ display:"flex", gap:6, marginTop:8 }}>
                    <button onClick={() => onAction(n)}
                      style={{ background:`${borderCol}22`, color:borderCol,
                        border:`1px solid ${borderCol}44`, borderRadius:4,
                        padding:"3px 10px", fontSize:10, cursor:"pointer",
                        fontFamily:"'DM Mono',monospace", letterSpacing:0.3 }}>
                      ⬡ {n.cta} →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* footer */}
      <div style={{ padding:"8px 16px", borderTop:`1px solid ${C.dim}33`,
        fontFamily:"'DM Mono',monospace", fontSize:9, color:C.dim,
        background:`${C.bg}88` }}>
        SAHAYAK-AI monitors your workspace continuously · All actions require your approval
      </div>
    </div>
  );
};

// ── Tiny helpers ─────────────────────────────────────────────────
const Badge = ({ label, color, bg }) => { const C = useTheme(); color = color || C.saffron; return (
  <span style={{ background: bg || color + "22", color, border: `1px solid ${color}55`,
    borderRadius:3, padding:"1px 8px", fontSize:10, fontFamily:"'DM Mono',monospace",
    letterSpacing:"0.5px", fontWeight:700, whiteSpace:"nowrap" }}>
    {label}
  </span>
); };

const PriorityBadge = ({ p }) => {
  const C = useTheme();
  const map = { Urgent:[C.red,"URGENT"], High:[C.saffron,"HIGH"], Normal:[C.blue,"NORMAL"] };
  const [c,l] = map[p] || [C.mid,"--"];
  return <Badge label={l} color={c} />;
};

const StatusDot = ({ ok }) => { const C = useTheme(); return (
  <span style={{ display:"inline-block", width:7, height:7, borderRadius:"50%",
    background: ok ? C.greenL : C.red, marginRight:5,
    boxShadow: ok ? `0 0 6px ${C.greenL}` : "none" }} />
); };

const Card = ({ children, style={} }) => { const C = useTheme(); return (
  <div style={{ background:C.surface, border:`1px solid ${C.dim}44`, borderRadius:8,
    padding:"18px 20px", ...style }}>
    {children}
  </div>
); };

const SectionTitle = ({ children, sub }) => { const C = useTheme(); return (
  <div style={{ marginBottom:18 }}>
    <h3 style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:18, fontWeight:700,
      color:C.white, letterSpacing:1, textTransform:"uppercase", margin:0 }}>
      {children}
    </h3>
    {sub && <p style={{ color:C.mid, fontSize:12, margin:"3px 0 0", fontFamily:"'DM Mono',monospace" }}>{sub}</p>}
  </div>
); };

const AITag = () => { const C = useTheme(); return (
  <span style={{ background:`${C.saffron}22`, color:C.saffron, border:`1px solid ${C.saffron}44`,
    borderRadius:3, padding:"1px 7px", fontSize:9, fontFamily:"'DM Mono',monospace",
    letterSpacing:1, marginLeft:6 }}>AI ASSIST</span>
); };

// ── MCP Status Bar ────────────────────────────────────────────────
const MCPBar = ({ mcp }) => { const C = useTheme(); return (
  <div style={{ display:"flex", alignItems:"center", gap:18, padding:"6px 20px",
    background:`${C.surfaceHover}99`, borderBottom:`1px solid ${C.dim}33`,
    fontFamily:"'DM Mono',monospace", fontSize:10, color:C.mid, flexWrap:"wrap" }}>
    <span style={{ color:C.saffron, fontWeight:700, letterSpacing:1 }}>MCP CLIENT</span>
    <span><StatusDot ok={mcp.connected} />Server: <span style={{color:C.smoke}}>{mcp.server}</span></span>
    <span>Tools registered: <span style={{color:C.greenL}}>{mcp.tools}</span></span>
    <span>Latency: <span style={{color:C.blue}}>{mcp.latency}</span></span>
    <span style={{marginLeft:"auto"}}>All AI outputs are <span style={{color:C.saffron}}>RECOMMENDATORY</span> — Mandatory human review required</span>
  </div>
); };

// ── NAV MODULES ───────────────────────────────────────────────────
const NAV = [
  { id:"dashboard",  icon:"⬡",  label:"Dashboard",       short:"Dash" },
  { id:"files",      icon:"📁",  label:"Files & Docs",    short:"Files" },
  { id:"email",      icon:"📬",  label:"Email & Dak",     short:"Dak" },
  { id:"meetings",   icon:"📝",  label:"Meetings & MOM",  short:"MOM" },
  { id:"rti",        icon:"⚖️",  label:"RTI & Grievance", short:"RTI" },
  { id:"mis",        icon:"📊",  label:"MIS & Reports",   short:"MIS" },
  { id:"leave",      icon:"🗓",   label:"Leave (iHRMS)",   short:"Leave" },
  { id:"tour",       icon:"✈️",  label:"Tour (iHRMS)",    short:"Tour" },
  { id:"hrdata",     icon:"👤",  label:"Employee Data",   short:"EMD" },
  { id:"agents",     icon:"🤖",  label:"Agent Monitor",   short:"Agents" },
  { id:"audit",      icon:"🛡",   label:"Audit Log",       short:"Audit" },
];

// ══════════════════════════════════════════════════════════════════
//  MODULE VIEWS
// ══════════════════════════════════════════════════════════════════

// ── DASHBOARD ─────────────────────────────────────────────────────
const Dashboard = () => {
  const C = useTheme();
  const metrics = MOCK.misMetrics;
  return (
    <div>
      <SectionTitle sub="Real-time administrative overview • AI-assisted summaries">Command Dashboard</SectionTitle>

      {/* Metric cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:12, marginBottom:20 }}>
        {metrics.map((m,i) => (
          <Card key={i} style={{ borderTop:`3px solid ${m.color}` }}>
            <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:32, fontWeight:700, color:m.color, lineHeight:1 }}>{m.value}</div>
            <div style={{ fontSize:12, color:C.mid, marginTop:4, lineHeight:1.4 }}>{m.label}</div>
            <div style={{ fontSize:11, color:m.trend.startsWith("+") ? C.greenL : C.red, marginTop:6,
              fontFamily:"'DM Mono',monospace" }}>{m.trend} this week</div>
          </Card>
        ))}
      </div>

      {/* Pending actions */}
      <Card>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <SectionTitle sub="Items awaiting your review & action">Pending Queue <AITag /></SectionTitle>
          <Badge label="AI PRIORITISED" color={C.saffron} />
        </div>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
          <thead>
            <tr style={{ borderBottom:`1px solid ${C.dim}66` }}>
              {["File/ID","Type","Subject","From","Age","Priority","Action"].map(h => (
                <th key={h} style={{ padding:"6px 10px", textAlign:"left", color:C.mid,
                  fontFamily:"'DM Mono',monospace", fontSize:10, letterSpacing:0.5, fontWeight:400 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK.pending.map((p,i) => (
              <tr key={i} style={{ borderBottom:`1px solid ${C.dim}33` }}>
                <td style={{ padding:"9px 10px", fontFamily:"'DM Mono',monospace", fontSize:11, color:C.saffron }}>{p.id}</td>
                <td style={{ padding:"9px 10px" }}><Badge label={p.type} color={C.blue} /></td>
                <td style={{ padding:"9px 10px", color:C.smoke, maxWidth:220 }}>{p.subject}</td>
                <td style={{ padding:"9px 10px", color:C.mid, fontSize:12 }}>{p.from}</td>
                <td style={{ padding:"9px 10px", color:C.mid, fontSize:11, fontFamily:"'DM Mono',monospace" }}>{p.age}</td>
                <td style={{ padding:"9px 10px" }}><PriorityBadge p={p.priority} /></td>
                <td style={{ padding:"9px 10px" }}>
                  <button style={{ background:`${C.saffron}22`, color:C.saffron, border:`1px solid ${C.saffron}55`,
                    borderRadius:4, padding:"3px 10px", fontSize:11, cursor:"pointer", fontFamily:"'DM Mono',monospace" }}>
                    Review →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Agent activity strip */}
      <div style={{ marginTop:16 }}>
        <SectionTitle sub="Live agent actions — last 30 minutes">Agent Activity Feed</SectionTitle>
        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          {MOCK.agentLog.slice(0,4).map((l,i) => (
            <div key={i} style={{ display:"flex", gap:12, alignItems:"flex-start",
              background:`${C.surfaceHover}66`, borderRadius:6, padding:"9px 14px",
              borderLeft:`3px solid ${l.status==="alert"?C.red:l.status==="warn"?C.saffron:C.greenL}` }}>
              <span style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:C.mid, minWidth:60 }}>{l.ts}</span>
              <Badge label={l.agent} color={C.blue} />
              <span style={{ fontSize:13, color:C.smoke, flex:1 }}>{l.action}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── FILES & DOCUMENTS ─────────────────────────────────────────────
const FilesModule = () => {
  const C = useTheme();
  const [input, setInput] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [draft, setDraft] = useState("");

  const generateDraft = () => {
    setDrafting(true);
    setTimeout(() => {
      setDraft(`DRAFT NOTE SHEET\n\nRef: F/2024/1842 | Date: ${new Date().toLocaleDateString("en-IN")}\n\nSUBJECT: Budget Approval – Q4 Infrastructure\n\nThis file pertains to the budget approval request for Q4 infrastructure upgrades submitted by the Infrastructure Division.\n\nFACTS:\n1. Total estimated expenditure: ₹2.4 Crore\n2. Funds available under Budget Head 3054: ₹3.1 Crore\n3. Previous utilization as of Q3: 68%\n\nRECOMMENDATION (AI-Assisted — Subject to Officer Review):\nThe file may be placed before the competent authority for approval as the expenditure is within sanctioned limits and aligns with the Annual Work Plan.\n\n[OFFICER REVIEW REQUIRED BEFORE PROCEEDING]\n\nPrepared by: SAHAYAK-AI (Decision Support)\nHuman approval pending: ______________________`);
      setDrafting(false);
    }, 1800);
  };

  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        <Card>
          <SectionTitle sub="AI classification & routing assistance">File Classifier Agent <AITag /></SectionTitle>
          <textarea value={input} onChange={e=>setInput(e.target.value)}
            placeholder="Paste file content or subject for classification..."
            style={{ width:"100%", background:C.inputBg, border:`1px solid ${C.dim}66`,
              borderRadius:6, padding:10, color:C.smoke, fontSize:13, resize:"none", height:80,
              fontFamily:"'DM Mono',monospace", outline:"none", boxSizing:"border-box" }} />
          <div style={{ display:"flex", gap:8, marginTop:8, flexWrap:"wrap" }}>
            <label style={{ background:`${C.saffron}22`, color:C.saffron, border:`1px solid ${C.saffron}44`,
              borderRadius:4, padding:"5px 12px", fontSize:11, cursor:"pointer",
              fontFamily:"'DM Mono',monospace", display:"flex", alignItems:"center", gap:4 }}>
              <input type="file" style={{ display:"none" }} onChange={(e) => {
                if(e.target.files.length > 0) setInput("Uploaded: " + e.target.files[0].name);
              }} />
              ↑ Upload File
            </label>
            {["Classify & Route","Summarize","Compare Versions","Detect Anomaly"].map(a => (
              <button key={a} onClick={a==="Classify & Route"?generateDraft:()=>{}}
                style={{ background:`${C.blue}22`, color:C.blue, border:`1px solid ${C.blue}44`,
                  borderRadius:4, padding:"5px 12px", fontSize:11, cursor:"pointer",
                  fontFamily:"'DM Mono',monospace" }}>{a}</button>
            ))}
          </div>
        </Card>

        <Card>
          <SectionTitle sub="Files pending action">Active File Queue</SectionTitle>
          {MOCK.pending.filter(p=>p.type==="File").map((f,i) => (
            <div key={i} style={{ padding:"10px 0", borderBottom:`1px solid ${C.dim}33`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontFamily:"'DM Mono',monospace", color:C.saffron, fontSize:11 }}>{f.id}</div>
                <div style={{ color:C.smoke, fontSize:13, marginTop:2 }}>{f.subject}</div>
                <div style={{ color:C.mid, fontSize:11, marginTop:2 }}>From: {f.from} · {f.age} old</div>
              </div>
              <PriorityBadge p={f.priority} />
            </div>
          ))}
        </Card>
      </div>

      <Card>
        <SectionTitle sub="AI-generated draft — mandatory human review & edit before use">
          Draft Note Sheet <AITag />
        </SectionTitle>
        {drafting && <div style={{ color:C.saffron, fontFamily:"'DM Mono',monospace", fontSize:12, marginBottom:8 }}>
          ⟳ Generating draft...
        </div>}
        <textarea value={draft} onChange={e=>setDraft(e.target.value)}
          placeholder="Select a file and click 'Classify & Route' to generate a draft note sheet..."
          style={{ width:"100%", background:C.inputBg, border:`1px solid ${C.dim}66`,
            borderRadius:6, padding:12, color:C.smoke, fontSize:12, resize:"none", height:320,
            fontFamily:"'DM Mono',monospace", outline:"none", lineHeight:1.7, boxSizing:"border-box" }} />
        <div style={{ display:"flex", gap:8, marginTop:10 }}>
          <button style={{ background:`${C.greenL}22`, color:C.greenL, border:`1px solid ${C.greenL}44`,
            borderRadius:4, padding:"6px 14px", fontSize:11, cursor:"pointer", fontFamily:"'DM Mono',monospace" }}>
            ✓ Approve & Submit
          </button>
          <button style={{ background:`${C.red}22`, color:C.red, border:`1px solid ${C.red}44`,
            borderRadius:4, padding:"6px 14px", fontSize:11, cursor:"pointer", fontFamily:"'DM Mono',monospace" }}>
            ✕ Reject Draft
          </button>
          <button style={{ background:`${C.dim}44`, color:C.mid, border:`1px solid ${C.dim}66`,
            borderRadius:4, padding:"6px 14px", fontSize:11, cursor:"pointer", fontFamily:"'DM Mono',monospace" }}>
            ✎ Edit & Save
          </button>
        </div>
        <div style={{ marginTop:10, padding:"8px 12px", background:`${C.saffron}11`,
          border:`1px solid ${C.saffron}33`, borderRadius:4, fontSize:11, color:C.saffron }}>
          ⚠ AI-generated draft. Officer must review, modify as needed, and approve before any official use.
        </div>
      </Card>
    </div>
  );
};

// ── EMAIL & DAK ───────────────────────────────────────────────────
const EmailModule = () => {
  const C = useTheme();
  const emails = [
    { from:"jt.secy@ministry.gov.in", subj:"Quarterly Review Meeting – Action Required", cat:"Administrative", priority:"High", deadline:"3 days", time:"09:14" },
    { from:"rti.portal@gov.in", subj:"RTI Application No. 2024/391 Received", cat:"RTI", priority:"Urgent", deadline:"30 days", time:"08:52" },
    { from:"cpgrams@gov.in", subj:"Grievance GRV/2024/0218 – Pension Delay", cat:"Grievance", priority:"High", deadline:"15 days", time:"08:30" },
    { from:"training@cdac.gov.in", subj:"iHRMS Training Schedule – Jan 2025", cat:"Training", priority:"Normal", deadline:"—", time:"Yesterday" },
    { from:"audit@cag.gov.in", subj:"Compliance Report Submission Reminder", cat:"Audit", priority:"High", deadline:"7 days", time:"Yesterday" },
  ];
  const catColor = { RTI:C.red, Grievance:C.saffron, Administrative:C.blue, Training:C.teal, Audit:C.purple };

  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
      <Card>
        <SectionTitle sub="AI-classified and prioritized inbox">Email & Dak Inbox <AITag /></SectionTitle>
        {emails.map((e,i) => (
          <div key={i} style={{ padding:"10px 0", borderBottom:`1px solid ${C.dim}33`,
            display:"flex", flexDirection:"column", gap:4, cursor:"pointer" }}>
            <div style={{ display:"flex", justifyContent:"space-between" }}>
              <span style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:C.mid }}>{e.from}</span>
              <span style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:C.mid }}>{e.time}</span>
            </div>
            <div style={{ color:C.smoke, fontSize:13 }}>{e.subj}</div>
            <div style={{ display:"flex", gap:6, alignItems:"center" }}>
              <Badge label={e.cat} color={catColor[e.cat]||C.blue} />
              <PriorityBadge p={e.priority} />
              {e.deadline!=="—" && <span style={{ fontSize:10, color:C.mid, fontFamily:"'DM Mono',monospace" }}>Due: {e.deadline}</span>}
            </div>
          </div>
        ))}
      </Card>

      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        <Card>
          <SectionTitle sub="AI-suggested reply — must be reviewed before sending">Draft Reply Assist <AITag /></SectionTitle>
          <div style={{ background:`${C.steel}33`, borderRadius:6, padding:12, fontSize:12,
            color:C.smoke, fontFamily:"'DM Mono',monospace", lineHeight:1.7, marginBottom:10 }}>
            <div style={{ color:C.saffron, fontSize:10, marginBottom:6 }}>AI DRAFT — rti.portal@gov.in | RTI/2024/391</div>
            Dear Applicant,<br/><br/>
            This is in reference to your RTI application No. 2024/391 dated 02.01.2025.<br/><br/>
            The information sought pertains to staff transfers during 2023-24. The relevant records are being compiled from the concerned section. A detailed reply shall be furnished within the prescribed statutory period of 30 days.<br/><br/>
            [OFFICER REVIEW REQUIRED]
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button style={{ background:`${C.greenL}22`, color:C.greenL, border:`1px solid ${C.greenL}44`,
              borderRadius:4, padding:"5px 12px", fontSize:11, cursor:"pointer", fontFamily:"'DM Mono',monospace" }}>Approve & Send</button>
            <button style={{ background:`${C.dim}44`, color:C.mid, border:`1px solid ${C.dim}66`,
              borderRadius:4, padding:"5px 12px", fontSize:11, cursor:"pointer", fontFamily:"'DM Mono',monospace" }}>Edit Draft</button>
          </div>
        </Card>

        <Card>
          <SectionTitle sub="Automated alerts from escalation agent">Deadline Alerts</SectionTitle>
          {[
            { id:"RTI/2024/0391", msg:"Statutory deadline in 3 days", color:C.red },
            { id:"GRV/2024/0218", msg:"Grievance SLA: 7 days remaining", color:C.saffron },
            { id:"AUDIT/2025/04", msg:"CAG compliance due in 7 days", color:C.saffron },
          ].map((a,i) => (
            <div key={i} style={{ display:"flex", gap:10, padding:"8px 0", borderBottom:`1px solid ${C.dim}33`, alignItems:"center" }}>
              <div style={{ width:4, height:32, background:a.color, borderRadius:2, flexShrink:0 }} />
              <div>
                <div style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:a.color }}>{a.id}</div>
                <div style={{ color:C.smoke, fontSize:12 }}>{a.msg}</div>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
};

// ── MEETINGS & MOM ────────────────────────────────────────────────
const MeetingsModule = () => {
  const C = useTheme();
  const [transcribed, setTranscribed] = useState(false);
  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        <Card>
          <SectionTitle sub="Upload transcript or audio for AI-assisted MOM generation">Meeting Transcription <AITag /></SectionTitle>
          <div style={{ border:`2px dashed ${C.dim}88`, borderRadius:6, padding:"24px 16px",
            textAlign:"center", color:C.mid, marginBottom:12 }}>
            <div style={{ fontSize:28, marginBottom:6 }}>📎</div>
            <div style={{ fontSize:12, fontFamily:"'DM Mono',monospace" }}>Drop transcript / audio file here</div>
            <div style={{ fontSize:10, marginTop:4 }}>Supported: .txt .docx .mp3 .wav</div>
          </div>
          <button onClick={()=>setTranscribed(true)}
            style={{ width:"100%", background:`${C.blue}22`, color:C.blue, border:`1px solid ${C.blue}44`,
              borderRadius:4, padding:"8px", fontSize:12, cursor:"pointer", fontFamily:"'DM Mono',monospace" }}>
            ⟳ Process & Extract Action Items
          </button>
        </Card>

        <Card>
          <SectionTitle sub="Auto-extracted from MTG/2024/112">Extracted Action Items <AITag /></SectionTitle>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
            <thead>
              <tr style={{ borderBottom:`1px solid ${C.dim}44` }}>
                {["Action","Owner","Deadline","Status"].map(h => (
                  <th key={h} style={{ padding:"6px 8px", textAlign:"left", color:C.mid,
                    fontFamily:"'DM Mono',monospace", fontSize:9, letterSpacing:0.5, fontWeight:400 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK.momItems.map((m,i) => {
                const sc = { Pending:C.mid, "In Progress":C.blue, Overdue:C.red };
                return (
                  <tr key={i} style={{ borderBottom:`1px solid ${C.dim}22` }}>
                    <td style={{ padding:"8px 8px", color:C.smoke, maxWidth:160 }}>{m.action}</td>
                    <td style={{ padding:"8px 8px", color:C.mid, fontSize:11 }}>{m.owner}</td>
                    <td style={{ padding:"8px 8px", fontFamily:"'DM Mono',monospace", fontSize:10, color:C.mid }}>{m.deadline}</td>
                    <td style={{ padding:"8px 8px" }}><Badge label={m.status} color={sc[m.status]||C.mid} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      </div>

      <Card>
        <SectionTitle sub="AI-generated minutes — officer must review and certify">Minutes of Meeting (Draft) <AITag /></SectionTitle>
        <div style={{ background:C.inputBg, borderRadius:6, padding:14, fontSize:12,
          color:C.smoke, fontFamily:"'DM Mono',monospace", lineHeight:1.8, height:380, overflowY:"auto" }}>
          <div style={{ color:C.saffron, marginBottom:8 }}>MINUTES OF MEETING — MTG/2024/112</div>
          <div style={{ color:C.mid, marginBottom:12 }}>Date: 14 Jan 2025 | Venue: Committee Room 3 | Chaired by: Secretary</div>

          <div style={{ color:C.blue, marginBottom:4 }}>ATTENDEES:</div>
          <div style={{ marginBottom:10 }}>Shri A. Kumar (SO), Smt. P. Verma (US), Shri R. Sharma (AS), IT Cell Representative</div>

          <div style={{ color:C.blue, marginBottom:4 }}>AGENDA ITEM 1: Digital India Scheme Review</div>
          <div style={{ marginBottom:10 }}>
            Secretary reviewed progress of the Digital India Scheme implementation. 68% targets achieved as of Q3. 
            IT Cell to coordinate portal update by 25 Jan 2025. Next milestone: 80% by March 2025.
          </div>

          <div style={{ color:C.blue, marginBottom:4 }}>AGENDA ITEM 2: Audit Para Compliance</div>
          <div style={{ marginBottom:10 }}>
            ATR on audit para #14 to be submitted by 18 Jan 2025. Shri K. Singh designated as nodal officer.
          </div>

          <div style={{ color:C.blue, marginBottom:4 }}>DECISIONS TAKEN:</div>
          <div>4 action items extracted (see Action Items panel). Next meeting scheduled for 28 Jan 2025.</div>

          <div style={{ marginTop:16, padding:"8px 10px", background:`${C.saffron}11`,
            border:`1px solid ${C.saffron}33`, borderRadius:4, color:C.saffron, fontSize:10 }}>
            ⚠ AI-generated MOM. Section Officer must certify after review.
          </div>
        </div>
        <div style={{ display:"flex", gap:8, marginTop:10 }}>
          <button style={{ background:`${C.greenL}22`, color:C.greenL, border:`1px solid ${C.greenL}44`,
            borderRadius:4, padding:"6px 14px", fontSize:11, cursor:"pointer", fontFamily:"'DM Mono',monospace" }}>
            ✓ Certify & Circulate
          </button>
          <button style={{ background:`${C.dim}44`, color:C.mid, border:`1px solid ${C.dim}66`,
            borderRadius:4, padding:"6px 14px", fontSize:11, cursor:"pointer", fontFamily:"'DM Mono',monospace" }}>
            ✎ Edit MOM
          </button>
        </div>
      </Card>
    </div>
  );
};

// ── RTI & GRIEVANCE ───────────────────────────────────────────────
const RTIModule = () => {
  const C = useTheme();
  const rtis = [
    { id:"RTI/2024/0391", subj:"Staff Transfers 2023-24", received:"03 Jan", due:"02 Feb", section:"Admin", days:28, status:"Open" },
    { id:"RTI/2024/0385", subj:"Budget Expenditure Q2 Details", received:"28 Dec", due:"27 Jan", section:"Finance", days:12, status:"In Progress" },
    { id:"RTI/2024/0370", subj:"Vehicle Usage Records 2023", received:"20 Dec", due:"19 Jan", section:"Admin", days:4, status:"Urgent" },
  ];
  const grvs = [
    { id:"GRV/2024/0218", subj:"Pension Processing Delay", received:"06 Jan", sla:"20 Jan", mapped:"Pension Cell", status:"Open" },
    { id:"GRV/2024/0201", subj:"Leave Encashment Not Processed", received:"01 Jan", sla:"15 Jan", mapped:"LMS", status:"Overdue" },
  ];
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
        <Card>
          <SectionTitle sub="Non-decisional pre-processing only">RTI Applications <AITag /></SectionTitle>
          {rtis.map((r,i) => (
            <div key={i} style={{ padding:"10px 0", borderBottom:`1px solid ${C.dim}33` }}>
              <div style={{ display:"flex", justifyContent:"space-between" }}>
                <span style={{ fontFamily:"'DM Mono',monospace", color:C.saffron, fontSize:11 }}>{r.id}</span>
                <Badge label={r.status} color={r.status==="Urgent"?C.red:r.status==="In Progress"?C.blue:C.mid} />
              </div>
              <div style={{ color:C.smoke, fontSize:13, marginTop:3 }}>{r.subj}</div>
              <div style={{ display:"flex", gap:14, marginTop:4 }}>
                <span style={{ fontSize:10, color:C.mid, fontFamily:"'DM Mono',monospace" }}>Received: {r.received}</span>
                <span style={{ fontSize:10, color:r.days<=7?C.red:C.saffron, fontFamily:"'DM Mono',monospace" }}>Due: {r.due} ({r.days}d)</span>
                <span style={{ fontSize:10, color:C.blue, fontFamily:"'DM Mono',monospace" }}>→ {r.section}</span>
              </div>
            </div>
          ))}
        </Card>

        <Card>
          <SectionTitle sub="CPGRAMS integrated — SLA tracking">Grievances <AITag /></SectionTitle>
          {grvs.map((g,i) => (
            <div key={i} style={{ padding:"10px 0", borderBottom:`1px solid ${C.dim}33` }}>
              <div style={{ display:"flex", justifyContent:"space-between" }}>
                <span style={{ fontFamily:"'DM Mono',monospace", color:C.saffron, fontSize:11 }}>{g.id}</span>
                <Badge label={g.status} color={g.status==="Overdue"?C.red:C.mid} />
              </div>
              <div style={{ color:C.smoke, fontSize:13, marginTop:3 }}>{g.subj}</div>
              <div style={{ display:"flex", gap:14, marginTop:4 }}>
                <span style={{ fontSize:10, color:C.mid, fontFamily:"'DM Mono',monospace" }}>Received: {g.received}</span>
                <span style={{ fontSize:10, color:C.red, fontFamily:"'DM Mono',monospace" }}>SLA: {g.sla}</span>
                <span style={{ fontSize:10, color:C.blue, fontFamily:"'DM Mono',monospace" }}>→ {g.mapped}</span>
              </div>
            </div>
          ))}
        </Card>
      </div>

      <Card>
        <SectionTitle sub="AI draft reply — Section 7(1) RTI Act compliance — officer must review">Draft Reply Generator <AITag /></SectionTitle>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 2fr", gap:14 }}>
          <div>
            <div style={{ fontSize:12, color:C.mid, marginBottom:6, fontFamily:"'DM Mono',monospace" }}>Select Application</div>
            {[...rtis,...grvs].map((r,i) => (
              <div key={i} style={{ padding:"7px 10px", background:`${C.steel}33`, borderRadius:4, marginBottom:5,
                cursor:"pointer", fontSize:12, color:C.smoke, border:`1px solid ${C.dim}44` }}>
                {r.id}
              </div>
            ))}
          </div>
          <div style={{ background:C.inputBg, borderRadius:6, padding:14, fontSize:12,
            color:C.smoke, fontFamily:"'DM Mono',monospace", lineHeight:1.8 }}>
            <div style={{ color:C.saffron, marginBottom:6 }}>DRAFT REPLY — RTI/2024/0391 [AI Generated]</div>
            This is in response to your RTI application dated 03.01.2025 regarding staff transfers in 2023-24.<br/><br/>
            The information as sought is available with the Administration Section. A consolidated statement of transfers during 2023-24 is enclosed herewith.<br/><br/>
            If you are not satisfied with this response, you may file a First Appeal before the First Appellate Authority within 30 days.<br/><br/>
            <div style={{ color:C.mid }}>Public Information Officer | [Department Name]</div>
            <div style={{ marginTop:12, padding:"6px 10px", background:`${C.saffron}11`,
              border:`1px solid ${C.saffron}33`, borderRadius:4, color:C.saffron, fontSize:10 }}>
              ⚠ AI draft. PIO must review all facts before signing. Statutory responsibility rests with PIO.
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

// ── MIS & REPORTS ─────────────────────────────────────────────────
const MISModule = () => { const C = useTheme(); return (
  <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:12 }}>
      {MOCK.misMetrics.map((m,i) => (
        <Card key={i} style={{ borderLeft:`4px solid ${m.color}` }}>
          <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:36, fontWeight:700, color:m.color }}>{m.value}</div>
          <div style={{ fontSize:12, color:C.mid }}>{m.label}</div>
          <div style={{ fontSize:11, fontFamily:"'DM Mono',monospace", color:m.trend.startsWith("+") ? C.greenL : C.red, marginTop:4 }}>
            {m.trend} vs last week
          </div>
        </Card>
      ))}
    </div>

    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
      <Card>
        <SectionTitle sub="AI-generated — officer review required before circulation">Weekly Pendency Report <AITag /></SectionTitle>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {[
            { section:"Administration", files:8, rtiDue:2, grievanceDue:1 },
            { section:"Finance", files:3, rtiDue:0, grievanceDue:0 },
            { section:"Establishment", files:2, rtiDue:1, grievanceDue:2 },
            { section:"IT Cell", files:1, rtiDue:0, grievanceDue:0 },
          ].map((s,i) => (
            <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
              padding:"9px 12px", background:`${C.steel}33`, borderRadius:5 }}>
              <span style={{ color:C.smoke, fontSize:13 }}>{s.section}</span>
              <div style={{ display:"flex", gap:10 }}>
                <span style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:C.blue }}>Files: {s.files}</span>
                <span style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:C.saffron }}>RTI: {s.rtiDue}</span>
                <span style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:C.red }}>GRV: {s.grievanceDue}</span>
              </div>
            </div>
          ))}
        </div>
        <button style={{ marginTop:12, width:"100%", background:`${C.green}22`, color:C.greenL,
          border:`1px solid ${C.green}44`, borderRadius:4, padding:"7px", fontSize:12, cursor:"pointer",
          fontFamily:"'DM Mono',monospace" }}>
          ↓ Export Weekly MIS Report (PDF)
        </button>
      </Card>

      <Card>
        <SectionTitle sub="System-generated risk flags for management review">Risk & Deviation Flags <AITag /></SectionTitle>
        {[
          { flag:"14 files pending >30 days in Administration Section", level:"High" },
          { flag:"RTI/2024/0370 approaching statutory deadline (4 days)", level:"Critical" },
          { flag:"GRV/2024/0201 SLA breached — escalation recommended", level:"Critical" },
          { flag:"Leave applications spike during Jan 15-20 (audit week)", level:"Medium" },
        ].map((f,i) => {
          const lc = { Critical:C.red, High:C.saffron, Medium:C.blue };
          return (
            <div key={i} style={{ padding:"9px 12px", marginBottom:6,
              background:`${lc[f.level]}11`, border:`1px solid ${lc[f.level]}33`,
              borderRadius:5, display:"flex", gap:10, alignItems:"flex-start" }}>
              <Badge label={f.level} color={lc[f.level]} />
              <span style={{ fontSize:12, color:C.smoke }}>{f.flag}</span>
            </div>
          );
        })}
      </Card>
    </div>
  </div>
); };

// ── LEAVE (iHRMS) ─────────────────────────────────────────────────
const LeaveModule = () => { const C = useTheme(); return (
  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
    <Card>
      <SectionTitle sub="Data from C-DAC iHRMS Leave Module">Leave Applications <AITag /></SectionTitle>
      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
        <thead>
          <tr style={{ borderBottom:`1px solid ${C.dim}44` }}>
            {["Officer","Type","From","To","Balance","Status","Action"].map(h=>(
              <th key={h} style={{ padding:"6px 8px", textAlign:"left", color:C.mid,
                fontFamily:"'DM Mono',monospace", fontSize:9, fontWeight:400 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {MOCK.leaveData.map((l,i) => (
            <tr key={i} style={{ borderBottom:`1px solid ${C.dim}22` }}>
              <td style={{ padding:"9px 8px", color:C.smoke }}>{l.name}</td>
              <td style={{ padding:"9px 8px" }}><Badge label={l.type} color={C.blue} /></td>
              <td style={{ padding:"9px 8px", fontFamily:"'DM Mono',monospace", fontSize:10, color:C.mid }}>{l.from}</td>
              <td style={{ padding:"9px 8px", fontFamily:"'DM Mono',monospace", fontSize:10, color:C.mid }}>{l.to}</td>
              <td style={{ padding:"9px 8px", color:l.balance<=5?C.red:C.greenL, fontFamily:"'DM Mono',monospace", fontSize:11 }}>{l.balance}d</td>
              <td style={{ padding:"9px 8px" }}><Badge label={l.status} color={l.status==="Approved"?C.greenL:C.saffron} /></td>
              <td style={{ padding:"9px 8px" }}>
                {l.status==="Pending" && <button style={{ background:`${C.greenL}22`, color:C.greenL,
                  border:`1px solid ${C.greenL}44`, borderRadius:3, padding:"2px 8px", fontSize:10, cursor:"pointer" }}>Approve</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>

    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      <Card>
        <SectionTitle sub="AI pattern analysis from iHRMS data">Leave Pattern Insights <AITag /></SectionTitle>
        {[
          { insight:"3 staff applications cluster on Jan 15-20 — coincides with internal audit period", severity:"warn" },
          { insight:"Shri K. Singh: CL balance critically low (3 days) — LTC planning recommended", severity:"info" },
          { insight:"No leave coverage overlap for Administration Section on Jan 20", severity:"warn" },
        ].map((ins,i) => (
          <div key={i} style={{ padding:"9px 12px", marginBottom:6,
            background: ins.severity==="warn"?`${C.saffron}11`:`${C.blue}11`,
            border:`1px solid ${ins.severity==="warn"?C.saffron:C.blue}33`,
            borderRadius:5, fontSize:12, color:C.smoke }}>
            {ins.severity==="warn" ? "⚠ " : "ℹ "}{ins.insight}
          </div>
        ))}
      </Card>

      <Card>
        <SectionTitle sub="iHRMS REST API connection">iHRMS Data Source</SectionTitle>
        <div style={{ fontFamily:"'DM Mono',monospace", fontSize:11, lineHeight:2 }}>
          <div><StatusDot ok={true} /><span style={{color:C.mid}}>Module:</span> <span style={{color:C.smoke}}>Leave Management</span></div>
          <div><StatusDot ok={true} /><span style={{color:C.mid}}>API:</span> <span style={{color:C.smoke}}>iHRMS REST v2 (Read-Only)</span></div>
          <div><StatusDot ok={true} /><span style={{color:C.mid}}>Auth:</span> <span style={{color:C.smoke}}>pramANi SSO Token</span></div>
          <div><StatusDot ok={false} /><span style={{color:C.mid}}>Write-back:</span> <span style={{color:C.red}}>Disabled (Pilot Phase)</span></div>
          <div><StatusDot ok={true} /><span style={{color:C.mid}}>Last sync:</span> <span style={{color:C.smoke}}>2 min ago</span></div>
        </div>
      </Card>
    </div>
  </div>
); };

// ── TOUR (iHRMS) ──────────────────────────────────────────────────
const TourModule = () => { const C = useTheme(); return (
  <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
    <Card>
      <SectionTitle sub="Data from C-DAC iHRMS Tour Module — policy checks auto-applied">Tour Applications <AITag /></SectionTitle>
      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
        <thead>
          <tr style={{ borderBottom:`1px solid ${C.dim}44` }}>
            {["Officer","Destination","From","To","Purpose","TA/DA Est.","Policy Check","Status"].map(h=>(
              <th key={h} style={{ padding:"6px 8px", textAlign:"left", color:C.mid,
                fontFamily:"'DM Mono',monospace", fontSize:9, fontWeight:400 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {MOCK.tourData.map((t,i) => (
            <tr key={i} style={{ borderBottom:`1px solid ${C.dim}22` }}>
              <td style={{ padding:"9px 8px", color:C.smoke }}>{t.officer}</td>
              <td style={{ padding:"9px 8px", color:C.blue }}>{t.dest}</td>
              <td style={{ padding:"9px 8px", fontFamily:"'DM Mono',monospace", fontSize:10, color:C.mid }}>{t.from}</td>
              <td style={{ padding:"9px 8px", fontFamily:"'DM Mono',monospace", fontSize:10, color:C.mid }}>{t.to}</td>
              <td style={{ padding:"9px 8px", color:C.smoke }}>{t.purpose}</td>
              <td style={{ padding:"9px 8px", color:C.greenL, fontFamily:"'DM Mono',monospace", fontSize:11 }}>{t.taDA}</td>
              <td style={{ padding:"9px 8px" }}><Badge label="PASS" color={C.greenL} /></td>
              <td style={{ padding:"9px 8px" }}><Badge label={t.status} color={t.status==="Approved"?C.greenL:C.saffron} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>

    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
      <Card>
        <SectionTitle sub="AI-assisted TA/DA calculation">TA/DA Estimator <AITag /></SectionTitle>
        {[
          { item:"Train Fare (AC 2-Tier) – Delhi to Mumbai", amount:"₹2,850" },
          { item:"Daily Allowance (3 days × ₹3,000)", amount:"₹9,000" },
          { item:"Local conveyance (estimated)", amount:"₹1,200" },
          { item:"Miscellaneous (approved limit)", amount:"₹1,150" },
        ].map((r,i) => (
          <div key={i} style={{ display:"flex", justifyContent:"space-between",
            padding:"8px 0", borderBottom:`1px solid ${C.dim}33`, fontSize:12 }}>
            <span style={{ color:C.smoke }}>{r.item}</span>
            <span style={{ fontFamily:"'DM Mono',monospace", color:C.greenL }}>{r.amount}</span>
          </div>
        ))}
        <div style={{ display:"flex", justifyContent:"space-between", padding:"10px 0",
          borderTop:`2px solid ${C.saffron}44`, marginTop:4 }}>
          <span style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:700, color:C.white, fontSize:14 }}>TOTAL ESTIMATE</span>
          <span style={{ fontFamily:"'DM Mono',monospace", color:C.saffron, fontSize:14 }}>₹14,200</span>
        </div>
      </Card>

      <Card>
        <SectionTitle sub="Real-time policy enforcement agent">Policy Compliance Check <AITag /></SectionTitle>
        {[
          { rule:"Grade Pay entitlement for AC 2-Tier", result:"COMPLIANT", ok:true },
          { rule:"DA rate for Mumbai (Class A City)", result:"COMPLIANT", ok:true },
          { rule:"Advance sanction required for >₹10,000", result:"REQUIRED", ok:false },
          { rule:"Tour programme approved by competent authority", result:"PENDING", ok:false },
        ].map((p,i) => (
          <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
            padding:"8px 0", borderBottom:`1px solid ${C.dim}33` }}>
            <span style={{ fontSize:12, color:C.smoke }}>{p.rule}</span>
            <Badge label={p.result} color={p.ok?C.greenL:C.saffron} />
          </div>
        ))}
      </Card>
    </div>
  </div>
); };

// ── EMPLOYEE DATA (iHRMS) ─────────────────────────────────────────
const HRModule = () => { const C = useTheme(); return (
  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
    <Card>
      <SectionTitle sub="C-DAC iHRMS Employee Master & Service Book">Employee Records <AITag /></SectionTitle>
      {[
        { name:"Shri Arvind Kumar", emp:"10234", post:"Section Officer", grade:"Group B Gaz.", status:"Active", issues:0 },
        { name:"Smt. P. Verma", emp:"10189", post:"Under Secretary", grade:"Group A", status:"Active", issues:0 },
        { name:"Shri R. Sharma", emp:"10301", post:"Assistant Sec.", grade:"Group B Gaz.", status:"On Deputation", issues:1 },
        { name:"Shri K. Singh", emp:"10412", post:"UDC", grade:"Group C", status:"Active", issues:0 },
      ].map((e,i) => (
        <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
          padding:"10px 0", borderBottom:`1px solid ${C.dim}33` }}>
          <div>
            <div style={{ color:C.smoke, fontSize:13 }}>{e.name}</div>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:C.mid, marginTop:2 }}>
              {e.emp} · {e.post} · {e.grade}
            </div>
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <Badge label={e.status} color={e.status==="Active"?C.greenL:C.saffron} />
            {e.issues > 0 && <Badge label={`${e.issues} Issue`} color={C.red} />}
          </div>
        </div>
      ))}
    </Card>

    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      <Card>
        <SectionTitle sub="AI data quality scan — iHRMS Service Book">Data Validation Results <AITag /></SectionTitle>
        {[
          { field:"Service Book – Shri R. Sharma", issue:"Deputation order not reflected in iHRMS", severity:"warn" },
          { field:"Payroll – Shri K. Singh", issue:"Grade Pay mismatch detected vs Service Book", severity:"alert" },
          { field:"All records", issue:"4 officers: ACR/APARs pending upload for 2022-23", severity:"info" },
        ].map((v,i) => (
          <div key={i} style={{ padding:"9px 12px", marginBottom:5,
            background: v.severity==="alert"?`${C.red}11`:v.severity==="warn"?`${C.saffron}11`:`${C.blue}11`,
            border:`1px solid ${v.severity==="alert"?C.red:v.severity==="warn"?C.saffron:C.blue}33`,
            borderRadius:5 }}>
            <div style={{ fontSize:11, fontFamily:"'DM Mono',monospace", color:C.mid }}>{v.field}</div>
            <div style={{ fontSize:12, color:C.smoke, marginTop:3 }}>{v.issue}</div>
          </div>
        ))}
      </Card>

      <Card>
        <SectionTitle sub="iHRMS modules connected">iHRMS Connection Status</SectionTitle>
        {[
          ["Employee Master","Connected"],
          ["Service Book","Connected"],
          ["Leave Module","Connected"],
          ["Tour Module","Connected"],
          ["Payroll","Connected"],
          ["Training Module","Pending"],
          ["Transfers","Pending"],
        ].map(([m,s],i) => (
          <div key={i} style={{ display:"flex", justifyContent:"space-between",
            padding:"5px 0", borderBottom:`1px solid ${C.dim}22`, fontSize:12 }}>
            <span style={{ color:C.smoke }}>{m}</span>
            <StatusDot ok={s==="Connected"} />
          </div>
        ))}
      </Card>
    </div>
  </div>
); };

// ── AGENT MONITOR ─────────────────────────────────────────────────
const AgentMonitor = () => {
  const C = useTheme();
  const agents = [
    { name:"Document Classifier", domain:"Files", status:"Active", calls:142, lastRun:"2 min ago" },
    { name:"RTI Deadline Monitor", domain:"RTI", status:"Active", calls:38, lastRun:"8 min ago" },
    { name:"MOM Extractor", domain:"Meetings", status:"Active", calls:17, lastRun:"22 min ago" },
    { name:"Leave Pattern Agent", domain:"iHRMS LMS", status:"Active", calls:9, lastRun:"35 min ago" },
    { name:"MIS Generator", domain:"Reports", status:"Idle", calls:4, lastRun:"1 hr ago" },
    { name:"Grievance Classifier", domain:"RTI", status:"Active", calls:29, lastRun:"12 min ago" },
    { name:"TA/DA Policy Agent", domain:"iHRMS TMS", status:"Idle", calls:6, lastRun:"2 hr ago" },
    { name:"Email Prioritizer", domain:"Email", status:"Active", calls:88, lastRun:"1 min ago" },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:10 }}>
        {agents.map((a,i) => (
          <Card key={i} style={{ borderLeft:`3px solid ${a.status==="Active"?C.greenL:C.dim}` }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
              <Badge label={a.domain} color={C.blue} />
              <Badge label={a.status} color={a.status==="Active"?C.greenL:C.dim} />
            </div>
            <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:15, fontWeight:700, color:C.white, marginTop:6 }}>{a.name}</div>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:C.mid, marginTop:4 }}>
              {a.calls} calls today · {a.lastRun}
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <SectionTitle sub="Real-time MCP tool invocations">Live Agent Log</SectionTitle>
        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          {MOCK.agentLog.map((l,i) => (
            <div key={i} style={{ display:"flex", gap:12, alignItems:"flex-start",
              background:`${C.steel}33`, borderRadius:5, padding:"8px 12px",
              borderLeft:`3px solid ${l.status==="alert"?C.red:l.status==="warn"?C.saffron:C.greenL}` }}>
              <span style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:C.mid, minWidth:56, flexShrink:0 }}>{l.ts}</span>
              <Badge label={l.agent} color={C.blue} />
              <span style={{ fontSize:12, color:C.smoke, flex:1 }}>{l.action}</span>
              <Badge label={l.status.toUpperCase()} color={l.status==="alert"?C.red:l.status==="warn"?C.saffron:C.greenL} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

// ── AUDIT LOG ─────────────────────────────────────────────────────
const AuditLog = () => {
  const C = useTheme();
  const logs = [
    { ts:"2025-01-14 10:42:15", user:"Shri A. Kumar", action:"Approved draft note — F/2024/1842", agent:"Document Classifier", outcome:"File forwarded to JS", type:"Approval" },
    { ts:"2025-01-14 10:38:47", user:"System", action:"AI extracted 4 action items from MTG/2024/112", agent:"MOM Extractor", outcome:"Action items created", type:"AI Action" },
    { ts:"2025-01-14 10:35:22", user:"System", action:"Leave anomaly flagged — 3 applications Jan 15-20", agent:"Leave Pattern Agent", outcome:"Alert sent to Section Head", type:"Alert" },
    { ts:"2025-01-14 10:21:03", user:"Smt. P. Verma", action:"Edited and approved MOM for MTG/2024/108", agent:"MOM Extractor", outcome:"MOM circulated", type:"Approval" },
    { ts:"2025-01-14 09:55:41", user:"System", action:"RTI deadline alert generated — RTI/2024/0391", agent:"RTI Deadline Monitor", outcome:"Alert sent to PIO", type:"Alert" },
    { ts:"2025-01-14 09:30:00", user:"Shri R. Sharma", action:"Rejected AI draft — GRV/2024/0201 reply", agent:"Grievance Classifier", outcome:"Draft discarded", type:"Rejection" },
  ];
  const typeColor = { Approval:C.greenL, "AI Action":C.blue, Alert:C.saffron, Rejection:C.red };

  return (
    <div>
      <div style={{ display:"flex", gap:12, marginBottom:14, flexWrap:"wrap" }}>
        {[["Total Actions","284",C.blue],["Human Approvals","47",C.greenL],["AI Suggestions","198",C.saffron],["Rejections","8",C.red]].map(([l,v,c],i) => (
          <Card key={i} style={{ flex:"1 1 140px", textAlign:"center" }}>
            <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:28, fontWeight:700, color:c }}>{v}</div>
            <div style={{ fontSize:11, color:C.mid }}>{l}</div>
          </Card>
        ))}
      </div>

      <Card>
        <SectionTitle sub="Immutable tamper-evident log — RTI / CAG / Internal Audit ready">Complete Audit Trail</SectionTitle>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
          <thead>
            <tr style={{ borderBottom:`1px solid ${C.dim}44` }}>
              {["Timestamp","User","Action","Agent","Outcome","Type"].map(h=>(
                <th key={h} style={{ padding:"6px 10px", textAlign:"left", color:C.mid,
                  fontFamily:"'DM Mono',monospace", fontSize:9, fontWeight:400 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {logs.map((l,i) => (
              <tr key={i} style={{ borderBottom:`1px solid ${C.dim}22` }}>
                <td style={{ padding:"8px 10px", fontFamily:"'DM Mono',monospace", fontSize:10, color:C.mid, whiteSpace:"nowrap" }}>{l.ts}</td>
                <td style={{ padding:"8px 10px", color:C.smoke, fontSize:11 }}>{l.user}</td>
                <td style={{ padding:"8px 10px", color:C.smoke, maxWidth:200 }}>{l.action}</td>
                <td style={{ padding:"8px 10px" }}><Badge label={l.agent} color={C.blue} /></td>
                <td style={{ padding:"8px 10px", color:C.mid, fontSize:11 }}>{l.outcome}</td>
                <td style={{ padding:"8px 10px" }}><Badge label={l.type} color={typeColor[l.type]||C.mid} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop:12, display:"flex", gap:8 }}>
          <button style={{ background:`${C.blue}22`, color:C.blue, border:`1px solid ${C.blue}44`,
            borderRadius:4, padding:"6px 14px", fontSize:11, cursor:"pointer", fontFamily:"'DM Mono',monospace" }}>
            ↓ Export Audit Log (CSV)
          </button>
          <button style={{ background:`${C.dim}44`, color:C.mid, border:`1px solid ${C.dim}66`,
            borderRadius:4, padding:"6px 14px", fontSize:11, cursor:"pointer", fontFamily:"'DM Mono',monospace" }}>
            Filter by Date / Agent
          </button>
        </div>
      </Card>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════
//  CHAT INTERFACE — MCP Agent Command Console
// ══════════════════════════════════════════════════════════════════

// Agent personas — each has a role + colour identity
const AGENTS = {
  coordinator:  { name:"Coordinator",        color:"#F7941D", icon:"⬡" },
  document:     { name:"Document Agent",     color:"#2196F3", icon:"📁" },
  email:        { name:"Email/Dak Agent",    color:"#00897B", icon:"📬" },
  rti:          { name:"RTI Agent",          color:"#E53935", icon:"⚖️" },
  leave:        { name:"Leave Agent",        color:"#22C55E", icon:"🗓" },
  tour:         { name:"Tour Agent",         color:"#7B1FA2", icon:"✈️" },
  mis:          { name:"MIS Agent",          color:"#D4A017", icon:"📊" },
  hrdata:       { name:"HR Data Agent",      color:"#00BCD4", icon:"👤" },
};

// Quick-prompt suggestions per context
const QUICK_PROMPTS = [
  { label:"Summarise pending files",      prompt:"Summarise all my pending files and tell me which ones need urgent attention today." },
  { label:"Draft RTI reply",              prompt:"Draft a reply for RTI/2024/0391 about staff transfers 2023-24 citing relevant sections." },
  { label:"Check leave compliance",       prompt:"Check if the leave applications from Shri K. Singh and Shri R. Sharma are policy compliant." },
  { label:"Generate weekly MIS",          prompt:"Generate the weekly MIS pendency report for all sections and flag any SLA breaches." },
  { label:"Who is overdue on actions?",   prompt:"List all meeting action items that are overdue and suggest escalation steps." },
  { label:"Tour TA/DA estimate",          prompt:"Calculate TA/DA for Smt. S. Gupta's upcoming tour to Bengaluru and check policy compliance." },
  { label:"Grievance SLA status",         prompt:"What is the SLA status of all open grievances? Which ones need immediate action?" },
  { label:"Validate employee data",       prompt:"Run a data validation check on all employee records in iHRMS and report any discrepancies." },
];

// Simulated streaming tool-call + response sequences per prompt intent
const buildAgentResponse = (prompt) => {
  const p = prompt.toLowerCase();

  if (p.includes("pending file") || p.includes("summarise") || p.includes("urgent")) return {
    agentChain: ["coordinator","document"],
    toolCalls: [
      { tool:"list_pending_files",  args:{ officer:"AK10234", min_age_days:0 },      result:"5 files found" },
      { tool:"classify_priority",   args:{ file_ids:["F/2024/1842","F/2024/1798"] }, result:"Prioritised by deadline + subject" },
    ],
    response:`**Pending Files Summary** (as of today)\n\nI found **5 items** in your queue. Here's the priority breakdown:\n\n🔴 **URGENT**\n- **RTI/2024/0391** — Staff Transfers info request · Due in **3 days** · Statutory deadline\n\n🟠 **HIGH**\n- **F/2024/1842** — Budget Approval Q4 Infrastructure · 5 days old · Joint Secretary marked urgent\n- **GRV/2024/0218** — Pension Delay Grievance · CPGRAMS · 8 days pending\n\n🔵 **NORMAL**\n- **F/2024/1798** — Annual Report Draft Review · 2 days · Can wait till tomorrow\n- **MTG/2024/112** — Meeting review · Action items extracted, awaiting your certification\n\n**Recommended action:** Address the RTI reply first — missing the 30-day deadline has legal consequences.`,
    hitl: { type:"acknowledge", label:"Understood — go to RTI module" },
  };

  if (p.includes("rti") || p.includes("draft") || p.includes("reply")) return {
    agentChain: ["coordinator","rti"],
    toolCalls: [
      { tool:"fetch_rti_application", args:{ id:"RTI/2024/0391" },                        result:"Application details fetched" },
      { tool:"retrieve_sop",          args:{ type:"RTI", section:"Section 7(1)" },         result:"SOP: 30-day mandatory reply" },
      { tool:"search_precedents",     args:{ query:"staff transfers disclosure 2023-24" }, result:"3 similar past replies found" },
      { tool:"generate_draft_reply",  args:{ id:"RTI/2024/0391", sop_ref:"Sec 7(1)" },    result:"Draft generated" },
    ],
    response:`**Draft Reply — RTI/2024/0391** *(AI-Generated · Requires PIO Review)*\n\n---\n\n**To:** The Applicant\n**Subject:** Reply to RTI Application No. 2024/0391\n\nThis is with reference to your RTI application dated 03.01.2025 regarding staff transfers during 2023-24.\n\nAs per information available with this office, a total of **47 transfers** were effected in the department during the period 01.04.2023 to 31.03.2024. A consolidated statement is enclosed herewith as **Annexure-A**.\n\nThe information is being provided under Section 7(1) of the RTI Act, 2005 within the stipulated 30-day period.\n\nIf you are dissatisfied, you may file a First Appeal before the First Appellate Authority within 30 days of receipt of this reply.\n\n*Public Information Officer*\n\n---\n\n⚠️ **SOP Reference:** Section 7(1), RTI Act 2005 · Precedent match: 87% with 2023 reply\n📋 **3 similar past replies** retrieved from KMS for reference.`,
    hitl: { type:"approve_draft", label:"Approve this draft reply", rejectLabel:"Reject & redraft" },
  };

  if (p.includes("leave") || p.includes("compliance") || p.includes("policy compliant")) return {
    agentChain: ["coordinator","leave"],
    toolCalls: [
      { tool:"fetch_leave_applications", args:{ officers:["Sharma","Singh"] },          result:"2 applications fetched from iHRMS" },
      { tool:"check_leave_balance",      args:{ emp_ids:["10301","10412"] },             result:"Balances verified" },
      { tool:"validate_leave_policy",    args:{ type:"CL", period:"Jan 2025" },          result:"Policy check complete" },
    ],
    response:`**Leave Policy Compliance Check** — iHRMS Data\n\n**Shri R. Sharma (10301) — CL 15–17 Jan**\n✅ Balance sufficient (8 days available)\n✅ No overlap with critical work period\n⚠️ *Note: Deputation record not updated in iHRMS — please verify service book*\n\n**Shri K. Singh (10412) — CL 18 Jan**\n✅ Application is policy compliant\n🔴 *Alert: Only 3 CL days remaining after this — critically low balance*\n⚠️ *Leave falls within internal audit week (15–20 Jan) — recommend officer flag this*\n\n**Recommendation:** Both applications can be approved. However, the audit-period clustering of 3 staff leaves (including Shri Sharma and Shri Singh) warrants a manpower review before approving all simultaneously.`,
    hitl: { type:"bulk_action", label:"Approve both applications", rejectLabel:"Hold for review" },
  };

  if (p.includes("mis") || p.includes("weekly") || p.includes("report") || p.includes("pendency")) return {
    agentChain: ["coordinator","mis"],
    toolCalls: [
      { tool:"aggregate_pendency",   args:{ sections:["Admin","Finance","Estt","IT"] }, result:"Section-wise data aggregated" },
      { tool:"check_sla_breaches",   args:{ as_of:"today" },                            result:"2 SLA breaches found" },
      { tool:"generate_mis_report",  args:{ period:"weekly", format:"summary" },        result:"MIS report generated" },
    ],
    response:`**Weekly MIS Pendency Report** — W/E 14 Jan 2025\n\n| Section | Pending Files | RTI Due | Grievances |\n|---|---|---|---|\n| Administration | 8 | 2 | 1 |\n| Finance | 3 | 0 | 0 |\n| Establishment | 2 | 1 | 2 |\n| IT Cell | 1 | 0 | 0 |\n\n**SLA Breach Alerts:**\n🔴 GRV/2024/0201 — Leave Encashment — **SLA Breached** (Establishment)\n🔴 RTI/2024/0370 — Vehicle Records — **4 days to deadline**\n\n**Overall compliance rate: 94%** *(+2% vs last week)*\n\nReport is ready for circulation. Do you want me to send it to all Section Heads?`,
    hitl: { type:"approve_draft", label:"Approve & circulate MIS Report", rejectLabel:"Save draft only" },
  };

  if (p.includes("overdue") || p.includes("action item") || p.includes("escalat")) return {
    agentChain: ["coordinator","mis"],
    toolCalls: [
      { tool:"fetch_action_items", args:{ status:"overdue" },               result:"1 overdue item found" },
      { tool:"get_owners",         args:{ meeting_id:"MTG/2024/112" },      result:"Owner list retrieved" },
      { tool:"suggest_escalation", args:{ item:"ATR audit para #14" },      result:"Escalation path identified" },
    ],
    response:`**Overdue Action Items — MTG/2024/112**\n\n🔴 **ATR on Audit Para #14** — Assigned to **Shri K. Singh**\n- Deadline: **18 Jan 2025** *(today)*\n- Status: Overdue\n- SOP: Compliance report must reach Audit Cell within 15 days of issue\n\n**Escalation Path:**\n1. First, send a reminder to Shri K. Singh\n2. If no response by EOD, escalate to Section Head (Smt. P. Verma)\n3. If unresolved by 20 Jan, flag to Director per Standing Orders\n\n**Other items on track:**\n🟡 "Revise SOP for file movement" — Smt. Verma — due 22 Jan — In Progress\n🔵 "Portal update coordination" — IT Cell — due 25 Jan — Pending (not yet started)\n\nShall I draft a reminder note for Shri K. Singh?`,
    hitl: { type:"approve_draft", label:"Send reminder to Shri K. Singh", rejectLabel:"Dismiss" },
  };

  if (p.includes("ta/da") || p.includes("tour") || p.includes("bengaluru") || p.includes("travel")) return {
    agentChain: ["coordinator","tour"],
    toolCalls: [
      { tool:"fetch_tour_request",      args:{ officer:"Smt. S. Gupta" },           result:"Tour details fetched from iHRMS" },
      { tool:"calculate_tada",          args:{ dest:"Bengaluru", days:3, grade:"A" }, result:"TA/DA calculated" },
      { tool:"check_tour_policy",       args:{ grade:"Group A", city_class:"A" },    result:"Policy check complete" },
    ],
    response:`**TA/DA Estimate — Smt. S. Gupta · Bengaluru Tour (22–24 Jan)**\n\n*Source: C-DAC iHRMS Tour Module + SR Rules*\n\n| Item | Amount |\n|---|---|\n| Air Fare (Economy) Delhi–Bengaluru | ₹7,200 |\n| Daily Allowance (3 days × ₹3,900) | ₹11,700 |\n| Local conveyance (estimated) | ₹1,500 |\n| Miscellaneous (approved limit) | ₹1,200 |\n| **Total Estimate** | **₹21,600** |\n\n⚠️ Estimated is ₹3,000 over preliminary approval of ₹18,600.\n\n**Policy Check:**\n✅ Air travel entitlement — Group A officer ✓\n✅ DA rate for Bengaluru (Class A City) ✓\n🔴 Advance sanction required for amounts >₹10,000 — **not yet obtained**\n🔴 Tour programme approval by competent authority — **pending**\n\n**Action Required:** Tour cannot proceed without advance sanction. Shall I draft a sanction request note?`,
    hitl: { type:"approve_draft", label:"Draft sanction request note", rejectLabel:"Dismiss" },
  };

  if (p.includes("grievance") || p.includes("sla") || p.includes("cpgrams")) return {
    agentChain: ["coordinator","rti"],
    toolCalls: [
      { tool:"fetch_grievances",    args:{ status:"open" },        result:"2 open grievances" },
      { tool:"check_sla_status",    args:{ ids:["GRV/2024/0218","GRV/2024/0201"] }, result:"SLA calculated" },
    ],
    response:`**Open Grievances — SLA Status**\n\n🔴 **GRV/2024/0201** — Leave Encashment Not Processed\n- Assigned: Establishment Section\n- SLA: **BREACHED** (was due 15 Jan)\n- Days overdue: **4 days**\n- Recommended: Immediate escalation to Section Head\n\n🟠 **GRV/2024/0218** — Pension Processing Delay\n- Assigned: Pension Cell\n- SLA: 20 Jan 2025 (6 days remaining)\n- Status: Acknowledged, reply in draft\n- Recommended: Expedite reply — pension cases are politically sensitive\n\n**CPGRAMS Compliance Score:** 78% *(below the 90% target)*\n\nI recommend addressing GRV/2024/0201 immediately. Shall I draft a disposal note and mark it resolved in CPGRAMS?`,
    hitl: { type:"approve_draft", label:"Draft disposal note for GRV/2024/0201", rejectLabel:"Review manually" },
  };

  if (p.includes("employee") || p.includes("ihrms") || p.includes("validate") || p.includes("data")) return {
    agentChain: ["coordinator","hrdata"],
    toolCalls: [
      { tool:"fetch_employee_master",   args:{ dept:"Admin Reforms" },          result:"4 records fetched" },
      { tool:"validate_service_books",  args:{ emp_ids:["10234","10189","10301","10412"] }, result:"Validation complete" },
      { tool:"cross_check_payroll",     args:{ period:"Jan 2025" },               result:"1 mismatch found" },
    ],
    response:`**iHRMS Employee Data Validation Report**\n\n*4 records checked against Service Book, Payroll, and EMD*\n\n✅ **Shri Arvind Kumar (10234)** — All records consistent\n✅ **Smt. P. Verma (10189)** — All records consistent\n\n🔴 **Shri R. Sharma (10301)**\n- Deputation to MHA since 01.11.2024 not reflected in iHRMS\n- Service book shows deputation; EMD still shows home department\n- **Action: Update iHRMS EMD record with deputation order reference**\n\n⚠️ **Shri K. Singh (10412)**\n- Grade Pay in payroll (₹4,200) doesn't match Service Book (₹4,600 post-MACP)\n- Potential payroll underpayment since Aug 2024\n- **Action: Raise correction request with PAO immediately**\n\n📋 4 officers: APAR uploads pending for 2022-23\n\n**Summary:** 2 critical data issues found requiring immediate correction.`,
    hitl: { type:"bulk_action", label:"Raise correction requests for both issues", rejectLabel:"Note for manual review" },
  };

  // Default fallback
  return {
    agentChain: ["coordinator"],
    toolCalls: [
      { tool:"understand_intent", args:{ prompt: prompt.slice(0,60) }, result:"Intent classified" },
    ],
    response:`I've received your request. As your AI decision-support assistant, I can help with:\n\n- 📁 **File & Document** tasks — summarise, classify, draft note sheets\n- 📬 **Email & Dak** — classify, prioritise, draft replies\n- ⚖️ **RTI & Grievances** — pre-process, draft replies, track deadlines\n- 📊 **MIS Reports** — generate, flag risks, export\n- 🗓 **Leave & Tour** — policy checks via iHRMS, TA/DA estimates\n- 👤 **Employee Data** — validate iHRMS records\n- 📝 **Meetings** — extract action items, draft MOM\n\nPlease rephrase your request or use one of the quick prompts below. Remember: all my outputs are **recommendatory** — your approval is mandatory before any action is taken.`,
    hitl: null,
  };
};

// ── Typing indicator ──────────────────────────────────────────────
const TypingIndicator = () => { const C = useTheme(); return (
  <div style={{ display:"flex", gap:4, alignItems:"center", padding:"10px 14px" }}>
    {[0,1,2].map(i => (
      <div key={i} style={{
        width:7, height:7, borderRadius:"50%", background:C.saffron,
        animation:"pulse 1.2s ease-in-out infinite",
        animationDelay:`${i*0.2}s`,
        opacity:0.7,
      }} />
    ))}
    <style>{`@keyframes pulse{0%,100%{transform:scale(1);opacity:.4}50%{transform:scale(1.4);opacity:1}}`}</style>
  </div>
); };

// ── Tool Call Trace ───────────────────────────────────────────────
const ToolCallTrace = ({ calls }) => { const C = useTheme(); return (
  <div style={{ margin:"8px 0", borderLeft:`2px solid ${C.dim}88`, paddingLeft:10 }}>
    {calls.map((c,i) => (
      <div key={i} style={{ display:"flex", gap:8, alignItems:"center", marginBottom:4 }}>
        <span style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:C.saffron, letterSpacing:1 }}>
          MCP ›
        </span>
        <span style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:C.blue }}>
          {c.tool}
        </span>
        <span style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:C.dim }}>
          ({Object.entries(c.args).map(([k,v])=>`${k}: ${JSON.stringify(v).slice(0,24)}`).join(", ")})
        </span>
        <span style={{ marginLeft:"auto", fontFamily:"'DM Mono',monospace", fontSize:9,
          color:C.greenL }}>✓ {c.result}</span>
      </div>
    ))}
  </div>
); };

// ── Markdown-ish renderer (bold + lists) ──────────────────────────
const RenderText = ({ text }) => {
  const C = useTheme();
  const lines = text.split("\n");
  return (
    <div style={{ fontSize:13, color:C.smoke, lineHeight:1.75 }}>
      {lines.map((line, i) => {
        // Table row
        if (line.startsWith("|")) {
          const cells = line.split("|").filter(Boolean);
          if (cells.every(c => /^[-: ]+$/.test(c))) return null;
          return (
            <div key={i} style={{ display:"flex", gap:0, borderBottom:`1px solid ${C.dim}33`, marginBottom:0 }}>
              {cells.map((cell, j) => (
                <div key={j} style={{ flex:1, padding:"3px 8px", fontFamily:"'DM Mono',monospace",
                  fontSize:11, color: i===0 ? C.saffron : C.smoke, minWidth:0 }}>
                  {cell.trim()}
                </div>
              ))}
            </div>
          );
        }
        // Bullet
        if (line.startsWith("- ") || line.startsWith("• ")) {
          return <div key={i} style={{ paddingLeft:14 }}>· {renderInline(line.slice(2))}</div>;
        }
        // Numbered
        if (/^\d+\./.test(line)) {
          return <div key={i} style={{ paddingLeft:14 }}>{renderInline(line)}</div>;
        }
        // Heading line (##)
        if (line.startsWith("## ") || line.startsWith("**") && line.endsWith("**")) {
          return <div key={i} style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:700,
            color:C.white, fontSize:14, marginTop:8, marginBottom:2 }}>{line.replace(/\*\*/g,"").replace(/^##\s/,"")}</div>;
        }
        if (line === "---") return <hr key={i} style={{ border:"none", borderTop:`1px solid ${C.dim}55`, margin:"8px 0" }} />;
        if (line === "") return <div key={i} style={{ height:6 }} />;
        return <div key={i}>{renderInline(line)}</div>;
      })}
    </div>
  );
};

const renderInline = (text) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**")
      ? <strong key={i} style={{ color:"#FFFFFF", fontWeight:700 }}>{p.slice(2,-2)}</strong>
      : p
  );
};

// ── HITL Action Card ──────────────────────────────────────────────
const HITLCard = ({ action, onApprove, onReject, approved, rejected }) => {
  const C = useTheme();
  if (!action) return null;
  return (
    <div style={{ margin:"10px 0 4px", padding:"10px 14px",
      background:`${C.saffron}0D`, border:`1px solid ${C.saffron}44`,
      borderRadius:6, borderLeft:`3px solid ${C.saffron}` }}>
      <div style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:C.saffron,
        letterSpacing:1, marginBottom:7 }}>⚑ HUMAN APPROVAL REQUIRED</div>

      {approved ? (
        <div style={{ color:C.greenL, fontFamily:"'DM Mono',monospace", fontSize:11 }}>
          ✓ Approved by Officer — Action logged in audit trail
        </div>
      ) : rejected ? (
        <div style={{ color:C.red, fontFamily:"'DM Mono',monospace", fontSize:11 }}>
          ✕ Rejected — Draft discarded. No action taken.
        </div>
      ) : (
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          <button onClick={onApprove}
            style={{ background:`${C.greenL}22`, color:C.greenL, border:`1px solid ${C.greenL}55`,
              borderRadius:4, padding:"5px 14px", fontSize:11, cursor:"pointer",
              fontFamily:"'DM Mono',monospace", fontWeight:700 }}>
            ✓ {action.label}
          </button>
          {action.rejectLabel && (
            <button onClick={onReject}
              style={{ background:`${C.red}22`, color:C.red, border:`1px solid ${C.red}44`,
                borderRadius:4, padding:"5px 14px", fontSize:11, cursor:"pointer",
                fontFamily:"'DM Mono',monospace" }}>
              ✕ {action.rejectLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// ── Agent Chain Visualizer ────────────────────────────────────────
const AgentChain = ({ chain }) => { const C = useTheme(); return (
  <div style={{ display:"flex", alignItems:"center", gap:0, marginBottom:8, flexWrap:"wrap" }}>
    {chain.map((id, i) => {
      const a = AGENTS[id] || { name:id, color:C.mid, icon:"🤖" };
      return (
        <span key={id} style={{ display:"flex", alignItems:"center" }}>
          <span style={{ background:`${a.color}22`, color:a.color, border:`1px solid ${a.color}55`,
            borderRadius:3, padding:"1px 8px", fontSize:10, fontFamily:"'DM Mono',monospace",
            letterSpacing:0.5 }}>
            {a.icon} {a.name}
          </span>
          {i < chain.length-1 && (
            <span style={{ color:C.dim, fontSize:12, margin:"0 3px" }}>→</span>
          )}
        </span>
      );
    })}
  </div>
); };

// ── Main Chat Component ───────────────────────────────────────────
const ChatPanel = ({ onClose, seedPrompt, onSeedConsumed }) => {
  const C = useTheme();
  const [messages, setMessages] = useState([
    {
      id: 0, role:"assistant",
      agentChain:["coordinator"],
      toolCalls:[],
      text:`Namaskar, Shri Arvind Kumar 🙏\n\nI am **SAHAYAK-AI**, your agentic decision-support assistant. I can act on your behalf to:\n\n- Summarise and prioritise your pending work\n- Draft replies for RTI applications and grievances\n- Check leave and tour policy compliance via **iHRMS**\n- Generate MIS reports and flag risks\n- Extract action items from meetings\n\nAll my outputs are **recommendatory** — I will always ask for your approval before any action is taken. Your statutory authority is never delegated to me.\n\nHow may I assist you today?`,
      hitl: null,
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hitlState, setHitlState] = useState({}); // { msgId: "approved"|"rejected" }
  const [showTools, setShowTools] = useState({});  // { msgId: bool }
  const [showQuick, setShowQuick] = useState(true);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);
  const msgIdRef  = useRef(1);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [messages, loading]);

  // Auto-fire a seed prompt from a notification CTA
  useEffect(() => {
    if (seedPrompt) {
      const t = setTimeout(() => {
        sendMessage(seedPrompt, true);
        if (onSeedConsumed) onSeedConsumed();
      }, 400);
      return () => clearTimeout(t);
    }
  }, [seedPrompt]); // eslint-disable-line

  const sendMessage = async (text, fromNotif = false) => {
    const userText = (text || input).trim();
    if (!userText) return;

    setInput("");
    setShowQuick(false);
    const uid = msgIdRef.current++;

    setMessages(prev => [...prev, { id:uid, role:"user", text:userText, fromNotif }]);
    setLoading(true);

    // Simulate MCP round-trip latency
    await new Promise(r => setTimeout(r, 900 + Math.random() * 800));

    const { agentChain, toolCalls, response, hitl } = buildAgentResponse(userText);
    const aid = msgIdRef.current++;

    setMessages(prev => [...prev, {
      id: aid, role:"assistant",
      agentChain, toolCalls, text:response, hitl,
    }]);
    setLoading(false);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%",
      background:C.bg, borderLeft:`1px solid ${C.dim}55` }}>

      {/* ── Chat Header ── */}
      <div style={{ padding:"12px 16px", background:C.surface,
        borderBottom:`2px solid ${C.saffron}`, display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
        <div style={{ width:30, height:30, borderRadius:6, background:`${C.saffron}22`,
          border:`1px solid ${C.saffron}55`, display:"flex", alignItems:"center",
          justifyContent:"center", fontSize:16 }}>⬡</div>
        <div>
          <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:15, fontWeight:700,
            color:C.white, letterSpacing:1 }}>SAHAYAK-AI <span style={{color:C.saffron}}>Agent Console</span></div>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:C.greenL, letterSpacing:1 }}>
            <StatusDot ok={true} />MCP CONNECTED · 34 TOOLS
          </div>
        </div>
        <button onClick={onClose}
          style={{ marginLeft:"auto", background:"none", border:`1px solid ${C.dim}66`,
            color:C.mid, cursor:"pointer", borderRadius:4, padding:"3px 9px", fontSize:13 }}>✕</button>
      </div>

      {/* ── Messages ── */}
      <div style={{ flex:1, overflowY:"auto", padding:"14px 14px 6px" }}>

        {messages.map((msg) => (
          <div key={msg.id} style={{ marginBottom:14 }}>
            {msg.role === "user" ? (
              /* ─ User bubble ─ */
              <div style={{ display:"flex", justifyContent:"flex-end", flexDirection:"column", alignItems:"flex-end", gap:4 }}>
                {msg.fromNotif && (
                  <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:C.saffron,
                    letterSpacing:1, display:"flex", alignItems:"center", gap:4 }}>
                    <span>🔔</span> Triggered from notification
                  </div>
                )}
                <div style={{ background:`${C.blue}28`, border:`1px solid ${C.blue}44`,
                  borderRadius:"10px 10px 2px 10px", padding:"9px 14px", maxWidth:"82%",
                  fontSize:13, color:C.smoke, lineHeight:1.6, fontFamily:"'Crimson Pro',serif" }}>
                  {msg.text}
                </div>
              </div>
            ) : (
              /* ─ Assistant bubble ─ */
              <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                {/* Agent chain */}
                {msg.agentChain?.length > 0 && <AgentChain chain={msg.agentChain} />}

                {/* Tool calls toggle */}
                {msg.toolCalls?.length > 0 && (
                  <button onClick={() => setShowTools(p => ({ ...p, [msg.id]: !p[msg.id] }))}
                    style={{ alignSelf:"flex-start", background:`${C.steel}55`,
                      border:`1px solid ${C.dim}66`, borderRadius:4, padding:"2px 10px",
                      fontSize:10, color:C.mid, cursor:"pointer", fontFamily:"'DM Mono',monospace",
                      marginBottom:2, letterSpacing:0.5 }}>
                    {showTools[msg.id] ? "▾" : "▸"} {msg.toolCalls.length} MCP tool call{msg.toolCalls.length>1?"s":""}
                  </button>
                )}
                {showTools[msg.id] && msg.toolCalls?.length > 0 && (
                  <ToolCallTrace calls={msg.toolCalls} />
                )}

                {/* Response */}
                <div style={{ background:`${C.surface}ee`, border:`1px solid ${C.dim}44`,
                  borderRadius:"2px 10px 10px 10px", padding:"11px 14px" }}>
                  <RenderText text={msg.text} />
                </div>

                {/* HITL approval card */}
                <HITLCard
                  action={msg.hitl}
                  approved={hitlState[msg.id] === "approved"}
                  rejected={hitlState[msg.id] === "rejected"}
                  onApprove={() => setHitlState(p => ({ ...p, [msg.id]:"approved" }))}
                  onReject={()  => setHitlState(p => ({ ...p, [msg.id]:"rejected" }))}
                />
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div style={{ display:"flex", flexDirection:"column", gap:4, marginBottom:10 }}>
            <AgentChain chain={["coordinator"]} />
            <div style={{ background:`${C.navy2}ee`, border:`1px solid ${C.dim}44`,
              borderRadius:"2px 10px 10px 10px", padding:"4px 8px", alignSelf:"flex-start" }}>
              <TypingIndicator />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Quick Prompts ── */}
      {showQuick && (
        <div style={{ padding:"8px 14px", borderTop:`1px solid ${C.dim}33`, flexShrink:0 }}>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:C.mid,
            letterSpacing:1, marginBottom:6 }}>QUICK ACTIONS</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
            {QUICK_PROMPTS.map((q,i) => (
              <button key={i} onClick={() => sendMessage(q.prompt)}
                style={{ background:C.inputBg, border:`1px solid ${C.dim}44`,
                  borderRadius:4, padding:"4px 10px", fontSize:11, color:C.text,
                  cursor:"pointer", fontFamily:"'Crimson Pro',serif", whiteSpace:"nowrap" }}>
                {q.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── HITL reminder ── */}
      <div style={{ padding:"4px 14px", background:`${C.saffron}0A`,
        borderTop:`1px solid ${C.saffron}33`, flexShrink:0 }}>
        <span style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:`${C.saffron}BB`,
          letterSpacing:0.5 }}>
          ⚑ ALL AI OUTPUTS ARE ADVISORY — HUMAN APPROVAL MANDATORY BEFORE ANY ACTION
        </span>
      </div>

      {/* ── Input Bar ── */}
      <div style={{ padding:"10px 14px", background:C.surface,
        borderTop:`1px solid ${C.dim}44`, flexShrink:0 }}>
        <div style={{ display:"flex", gap:8, alignItems:"flex-end" }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask SAHAYAK-AI… e.g. 'Draft RTI reply for application 0391' or 'Check leave compliance for Shri K. Singh'"
            rows={2}
            style={{ flex:1, background:C.inputBg, border:`1px solid ${C.dim}77`,
              borderRadius:6, padding:"9px 12px", color:C.smoke, fontSize:13,
              fontFamily:"'Crimson Pro',serif", resize:"none", outline:"none",
              lineHeight:1.5 }}
          />
          <button onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            style={{ background: loading || !input.trim() ? `${C.dim}55` : C.saffron,
              color: loading || !input.trim() ? C.mid : C.navy,
              border:"none", borderRadius:6, padding:"10px 14px", cursor: loading ? "wait" : "pointer",
              fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:14,
              transition:"background 0.15s", flexShrink:0 }}>
            {loading ? "⟳" : "↑"}
          </button>
        </div>
        <div style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:C.dim,
          marginTop:5, letterSpacing:0.5 }}>
          Enter to send · Shift+Enter for new line · All sessions logged to audit trail
        </div>
      </div>
    </div>
  );
};

// ── MODULE ROUTER ─────────────────────────────────────────────────
const MODULE_MAP = {
  dashboard: <Dashboard />,
  files:     <FilesModule />,
  email:     <EmailModule />,
  meetings:  <MeetingsModule />,
  rti:       <RTIModule />,
  mis:       <MISModule />,
  leave:     <LeaveModule />,
  tour:      <TourModule />,
  hrdata:    <HRModule />,
  agents:    <AgentMonitor />,
  audit:     <AuditLog />,
};

// ══════════════════════════════════════════════════════════════════
//  APP SHELL
// ══════════════════════════════════════════════════════════════════
export default function App() {
  const [isDark, setIsDark]           = useState(true);
  const C = THEMES[isDark ? "dark" : "light"];
  const [active, setActive]           = useState("dashboard");
  const [collapsed, setCollapsed]     = useState(false);
  const [chatOpen, setChatOpen]       = useState(false);
  const [time, setTime]               = useState(new Date());

  // ── Notification state ──
  const [notifs, setNotifs]           = useState([]);        // notification centre list
  const [toasts, setToasts]           = useState([]);        // live toast stack
  const [notifOpen, setNotifOpen]     = useState(false);     // centre panel open
  const [seenIds, setSeenIds]         = useState(new Set()); // already fired
  const [chatSeed, setChatSeed]       = useState(null);      // pre-load chat with prompt

  // Clock
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // ── Notification engine: fire seeds on schedule ──
  useEffect(() => {
    const timers = NOTIF_SEEDS.map(seed => {
      if (seenIds.has(seed.id)) return null;
      return setTimeout(() => {
        setSeenIds(prev => new Set([...prev, seed.id]));
        setNotifs(prev => [seed, ...prev]);
        setToasts(prev => [...prev, { ...seed, toastKey: seed.id + Date.now() }]);
      }, seed.time);
    });
    return () => timers.forEach(t => t && clearTimeout(t));
  }, []); // eslint-disable-line

  // ── When a notification CTA is clicked: open chat pre-loaded ──
  const handleNotifAction = (notif) => {
    setNotifOpen(false);
    setChatSeed(notif.ctaPrompt);
    setChatOpen(true);
    // Remove from centre
    setNotifs(prev => prev.filter(n => n.id !== notif.id));
  };

  const dismissToast = (toastKey) =>
    setToasts(prev => prev.filter(t => t.toastKey !== toastKey));

  const urgentCount = notifs.filter(n => n.type === "urgent").length;
  const hasUrgent   = urgentCount > 0;

  const navItem = NAV.find(n => n.id === active);

  return (
    <ThemeContext.Provider value={C}>
    <div style={{ display:"flex", flexDirection:"column", height:"100vh",
      background:C.bg, fontFamily:"'Crimson Pro',serif", overflow:"hidden",
      position:"relative", transition:"background 0.3s, color 0.3s" }}>

      {/* ── Global transition style for theme switching ── */}
      <style>{`
        * { transition: background-color 0.25s ease, border-color 0.25s ease, color 0.15s ease; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: ${C.navy}; }
        ::-webkit-scrollbar-thumb { background: ${C.dim}; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: ${C.saffron}; }
        textarea::placeholder { color: ${C.mid}; }
        textarea { color: ${C.smoke} !important; }
      `}</style>

      {/* ── TOAST STACK (bottom-right, above everything) ── */}
      <div style={{ position:"fixed", bottom:24, right:24, zIndex:2000,
        display:"flex", flexDirection:"column", gap:10, alignItems:"flex-end",
        pointerEvents:"none" }}>
        {toasts.map(t => (
          <div key={t.toastKey} style={{ pointerEvents:"all" }}>
            <NotifToast
              notif={t}
              onDismiss={() => dismissToast(t.toastKey)}
              onAction={handleNotifAction}
            />
          </div>
        ))}
      </div>

      {/* ── TOP HEADER ── */}
      <div style={{ background:C.surface, borderBottom:`2px solid ${C.saffron}`,
        padding:"0 20px", display:"flex", alignItems:"center", gap:16, height:52,
        flexShrink:0, position:"relative", zIndex:100 }}>

        {/* Logo */}
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:32, height:32, borderRadius:6, background:C.saffron,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:14, color:C.navy }}>S</div>
          <div>
            <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:18, fontWeight:700,
              color:C.white, letterSpacing:1, lineHeight:1 }}>
              SAHAYAK-<span style={{color:C.saffron}}>AI</span>
            </div>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8, color:C.mid, letterSpacing:1 }}>
              MCP CLIENT HOST
            </div>
          </div>
        </div>

        <div style={{ height:28, width:1, background:`${C.dim}88`, marginLeft:8 }} />

        <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:C.mid }}>
          <span style={{color:C.smoke}}>{MOCK.officer.name}</span>
          &nbsp;·&nbsp;{MOCK.officer.role}
          &nbsp;·&nbsp;<span style={{color:C.blue}}>{MOCK.officer.dept}</span>
        </div>

        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:10, position:"relative" }}>

          {/* 🔔 Notification Bell */}
          <NotifBell
            count={notifs.length}
            onClick={() => { setNotifOpen(o => !o); }}
            hasUrgent={hasUrgent}
          />

          {/* Notification Centre Dropdown */}
          {notifOpen && (
            <NotifCenter
              notifs={notifs}
              onClose={() => setNotifOpen(false)}
              onAction={handleNotifAction}
              onClear={() => setNotifs([])}
            />
          )}

          <div style={{ width:1, height:24, background:`${C.dim}66` }} />

          {/* Theme toggle */}
          <button onClick={() => setIsDark(d => !d)}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            style={{
              display:"flex", alignItems:"center", gap:6,
              background: isDark ? `${C.dim}44` : `${C.saffron}18`,
              border:`1px solid ${isDark ? C.dim+"66" : C.saffron+"55"}`,
              borderRadius:6, padding:"5px 10px", cursor:"pointer",
              fontFamily:"'DM Mono',monospace", fontSize:11,
              color: isDark ? C.mid : C.saffron,
              transition:"all 0.25s",
            }}>
            <span style={{ fontSize:14, transition:"transform 0.4s", display:"inline-block",
              transform: isDark ? "rotate(0deg)" : "rotate(180deg)" }}>
              {isDark ? "🌙" : "☀️"}
            </span>
            <span style={{ fontSize:9, letterSpacing:1, fontWeight:600 }}>
              {isDark ? "DARK" : "LIGHT"}
            </span>
          </button>

          <div style={{ width:1, height:24, background:`${C.dim}66` }} />

          {/* Ask SAHAYAK toggle */}
          <button onClick={() => { setChatSeed(null); setChatOpen(o => !o); }}
            style={{ display:"flex", alignItems:"center", gap:6,
              background: chatOpen ? C.saffron : `${C.saffron}22`,
              color: chatOpen ? C.navy : C.saffron,
              border:`1px solid ${C.saffron}66`, borderRadius:6,
              padding:"5px 12px", cursor:"pointer", fontFamily:"'Rajdhani',sans-serif",
              fontWeight:700, fontSize:13, letterSpacing:0.5,
              transition:"background 0.15s" }}>
            <span style={{ fontSize:14 }}>⬡</span>
            {chatOpen ? "Close Agent" : "Ask SAHAYAK"}
          </button>

          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:C.mid }}>
            {time.toLocaleTimeString("en-IN")}
          </div>

          <div style={{ width:28, height:28, borderRadius:"50%", background:C.saffron,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:12, color:C.navy }}>
            AK
          </div>
        </div>
      </div>

      {/* ── MCP STATUS BAR ── */}
      <MCPBar mcp={MOCK.mcpStatus} />

      {/* ── BODY ── */}
      <div style={{ display:"flex", flex:1, overflow:"hidden" }}>

        {/* ── SIDEBAR ── */}
        <div style={{ width: collapsed ? 52 : 200, flexShrink:0, background:C.surface,
          borderRight:`1px solid ${C.dim}44`, display:"flex", flexDirection:"column",
          transition:"width 0.2s", overflow:"hidden" }}>

          <div style={{ padding:"10px 8px 6px", display:"flex",
            justifyContent: collapsed ? "center" : "flex-end" }}>
            <button onClick={()=>setCollapsed(!collapsed)}
              style={{ background:"none", border:`1px solid ${C.dim}66`, borderRadius:4,
                color:C.mid, cursor:"pointer", padding:"3px 7px", fontSize:12 }}>
              {collapsed ? "›" : "‹"}
            </button>
          </div>

          <nav style={{ flex:1, overflowY:"auto", padding:"4px 0" }}>
            {NAV.map(n => (
              <button key={n.id} onClick={()=>setActive(n.id)}
                title={collapsed ? n.label : ""}
                style={{ width:"100%", display:"flex", alignItems:"center", gap:10,
                  padding: collapsed ? "10px 0" : "9px 14px",
                  justifyContent: collapsed ? "center" : "flex-start",
                  background: active===n.id ? `${C.saffron}18` : "none",
                  borderLeft: active===n.id ? `3px solid ${C.saffron}` : "3px solid transparent",
                  border:"none", cursor:"pointer", textAlign:"left",
                  transition:"background 0.15s" }}>
                <span style={{ fontSize:16, lineHeight:1, flexShrink:0 }}>{n.icon}</span>
                {!collapsed && (
                  <span style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:13, fontWeight:600,
                    color: active===n.id ? C.saffron : C.mid, letterSpacing:0.3, whiteSpace:"nowrap" }}>
                    {n.label}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {!collapsed && (
            <div style={{ padding:"10px 14px", borderTop:`1px solid ${C.dim}33`, background:C.surface }}>
              <div style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:C.mid,
                letterSpacing:1, marginBottom:4 }}>INTEGRATION</div>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <StatusDot ok={true} />
                <span style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:C.smoke }}>
                  C-DAC iHRMS
                </span>
              </div>
              <div style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:C.mid, marginTop:3 }}>
                REST API · Read-Only
              </div>
            </div>
          )}
        </div>

        {/* ── MAIN CONTENT ── */}
        <div style={{ flex:1, overflowY:"auto", padding:"20px 24px", minWidth:0, background:C.bg }}>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:C.mid,
            letterSpacing:1, marginBottom:16, display:"flex", alignItems:"center", gap:6 }}>
            <span>SAHAYAK-AI</span>
            <span style={{color:C.dim}}>›</span>
            <span style={{color:C.saffron}}>{navItem?.label}</span>
          </div>
          {MODULE_MAP[active]}
        </div>

        {/* ── CHAT PANEL (right drawer) ── */}
        {chatOpen && (
          <div style={{ width:420, flexShrink:0, display:"flex", flexDirection:"column",
            borderLeft:`1px solid ${C.dim}55`, overflow:"hidden" }}>
            <ChatPanel
              onClose={() => setChatOpen(false)}
              seedPrompt={chatSeed}
              onSeedConsumed={() => setChatSeed(null)}
            />
          </div>
        )}
      </div>

      {/* ── BOTTOM STATUS BAR ── */}
      <div style={{ background:`${C.surface}ee`, borderTop:`1px solid ${C.dim}44`,
        padding:"4px 20px", display:"flex", gap:20, alignItems:"center",
        fontFamily:"'DM Mono',monospace", fontSize:9, color:C.mid,
        letterSpacing:0.5, flexShrink:0 }}>
        <span><StatusDot ok={true} />MCP Connected</span>
        <span><StatusDot ok={true} />iHRMS Sync Active</span>
        <span><StatusDot ok={true} />34 Tools Registered</span>
        {hasUrgent && (
          <span style={{ color:C.red, fontWeight:700 }}>
            🔴 {urgentCount} URGENT notification{urgentCount>1?"s":""} pending
          </span>
        )}
        <span style={{ marginLeft:"auto", color:`${C.saffron}cc` }}>
          ALL AI OUTPUTS REQUIRE MANDATORY HUMAN REVIEW — STATUTORY AUTHORITY RESTS WITH OFFICER
        </span>
      </div>
    </div>
    </ThemeContext.Provider>
  );
}
