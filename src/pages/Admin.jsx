import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Empty, PageHead, Status } from "../components/Bits";
import { useAuth } from "../context/AuthContext";
import { useModules } from "../context/ModulesContext";
import { useUI } from "../context/UIContext";
import { RULES } from "../data/modules";

const ORGS = [
  { n: "Meera Pillai", c: "HR", o: "All offices", by: "Platform Admin", d: "1 Apr 2026" },
  { n: "Karan Shah", c: "MPL", o: "Mumbai, Pune", by: "Platform Admin", d: "12 May 2026" },
  { n: "Neha Iyer", c: "Sheroes", o: "Chennai", by: "HR Admin", d: "3 Jun 2026" },
];

export default function Admin() {
  const { user } = useAuth();
  const { events, setEvents, audit, log } = useModules();
  const { setModal, tt } = useUI();
  const [tab, setTab] = useState("Dashboard");
  const [cat, setCat] = useState("");
  const [st, setSt] = useState("");
  if (!user.admin) return <Navigate to="/discover" replace />;

  const act = (e, next, msg) => { setEvents((l) => l.map((x) => (x.id === e.id ? { ...x, st: next } : x))); log(user.name, msg, e.title); tt(msg); };
  const confirmCancel = (e) => setModal(<>
    <h3>Cancel this event?</h3><p className="sub">Employees who saved or registered will be notified. This is recorded in the audit history.</p>
    <div className="row"><button className="btn r" onClick={() => { act(e, "Cancelled", "Event cancelled"); setModal(null); }}>Cancel event</button><button className="btn o" onClick={() => setModal(null)}>Keep event</button></div></>);
  const rows = events.filter((e) => (!cat || e.cat === cat) && (!st || e.st === st));
  const pend = events.filter((e) => e.st === "Pending approval").length;

  return (
    <>
      <PageHead title="Admin Console" sub="Event publishing, organisers and VECTOR governance. Visible to authorised roles only." />
      <div className="tabs">{["Dashboard", "Event management", "Organisers and roles", "VECTOR rules", "Audit history"].map((t) => <button key={t} className={"tab " + (tab === t ? "on" : "")} onClick={() => setTab(t)}>{t}</button>)}</div>

      {tab === "Dashboard" && (
        <div className="grid">
          {[["Published events", events.filter((e) => e.st === "Published").length], ["Pending approval", pend], ["Drafts", events.filter((e) => e.st === "Draft").length], ["Organisers", ORGS.length], ["VECTOR awards to review", 7], ["Moderation items", 2]].map(([l, n]) => (
            <div key={l} className="card bd"><div className="hint">{l}</div><b style={{ fontSize: 28 }}>{n}</b></div>
          ))}
        </div>
      )}

      {tab === "Event management" && (
        <>
          <div className="row" style={{ marginBottom: 12 }}>
            <select className="in" style={{ width: 160 }} aria-label="Category" value={cat} onChange={(e) => setCat(e.target.value)}><option value="">All categories</option>{["HR", "MPL", "Sheroes", "Technical", "Learning", "Community"].map((c) => <option key={c}>{c}</option>)}</select>
            <select className="in" style={{ width: 180 }} aria-label="Status" value={st} onChange={(e) => setSt(e.target.value)}><option value="">All statuses</option>{["Draft", "Pending approval", "Published", "Cancelled"].map((c) => <option key={c}>{c}</option>)}</select>
          </div>
          {rows.length ? (
            <div className="card bd" style={{ overflowX: "auto" }}>
              <table className="tbl"><thead><tr><th>Event</th><th>Category</th><th>Offices</th><th>Organiser</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>{rows.map((e) => (
                  <tr key={e.id}><td>{e.title}</td><td>{e.cat}</td><td>{e.offices.join(", ")}</td><td>{e.org}</td><td>{e.date}</td><td><Status s={e.st} /></td>
                    <td><div className="row" style={{ gap: 6, flexWrap: "nowrap" }}>
                      {e.st === "Pending approval" && <button className="btn g" onClick={() => act(e, "Published", "Event approved and published")}>Approve</button>}
                      {e.st === "Pending approval" && <button className="btn o" onClick={() => act(e, "Draft", "Returned for changes")}>Return</button>}
                      {e.st === "Draft" && <button className="btn g" onClick={() => act(e, "Published", "Event published")}>Publish</button>}
                      {e.st !== "Cancelled" && <button className="btn r" onClick={() => confirmCancel(e)}>Cancel</button>}
                    </div></td></tr>))}</tbody></table>
            </div>
          ) : <Empty icon="calendar" title="No events" text="No events match these filters." />}
        </>
      )}

      {tab === "Organisers and roles" && (
        <div className="card bd" style={{ overflowX: "auto" }}>
          <table className="tbl"><thead><tr><th>Employee</th><th>Category</th><th>Permitted offices</th><th>Assigned by</th><th>Since</th></tr></thead>
            <tbody>{ORGS.map((o) => <tr key={o.n}><td>{o.n}</td><td>{o.c}</td><td>{o.o}</td><td>{o.by}</td><td>{o.d}</td></tr>)}</tbody></table>
          <p className="hint" style={{ marginTop: 10 }}>Permissions are scoped by category and office. An MPL organiser cannot publish HR events.</p>
        </div>
      )}

      {tab === "VECTOR rules" && (
        <div className="card bd" style={{ overflowX: "auto" }}>
          <table className="tbl"><thead><tr><th>Eligible action</th><th>Value</th><th>Points</th><th>Cap</th><th>Validation</th></tr></thead>
            <tbody>{RULES.map((r) => <tr key={r.a}><td>{r.a}</td><td>{r.v}</td><td>{r.p}</td><td>{r.cap}</td><td>{r.review}</td></tr>)}</tbody></table>
          <p className="hint" style={{ marginTop: 10 }}>Likes and raw post volume never earn points. Rule changes require authorisation and are written to the audit history.</p>
        </div>
      )}

      {tab === "Audit history" && (
        <div className="card bd" style={{ overflowX: "auto" }}>
          <table className="tbl"><thead><tr><th>When</th><th>Actor</th><th>Action</th><th>Target</th></tr></thead>
            <tbody>{audit.map((a, i) => <tr key={i}><td>{a.t}</td><td>{a.who}</td><td>{a.a}</td><td>{a.o}</td></tr>)}</tbody></table>
        </div>
      )}
    </>
  );
}
