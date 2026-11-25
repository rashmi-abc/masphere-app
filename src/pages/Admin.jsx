import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Empty, PageHead, Status } from "../components/Bits";
import { useAuth } from "../context/AuthContext";
import { useModules } from "../context/ModulesContext";
import { useUI } from "../context/UIContext";
import { RULES } from "../data/modules";
import { profilesService } from "../services/profilesService";
import { vectorRewardsService } from "../services/vectorRewardsService";

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
  const [rules, setRules] = useState(RULES);
  const [awards, setAwards] = useState([]);
  const [members, setMembers] = useState([]);
  const [ruleBusy, setRuleBusy] = useState("");
  const [awardDrafts, setAwardDrafts] = useState({});
  const [newRule, setNewRule] = useState({ action: "", value: "V", points: "15", cap: "1 per month", review: "Reviewer" });
  if (!user.admin) return <Navigate to="/discover" replace />;

  useEffect(() => {
    const unsubRules = vectorRewardsService.subscribeRules((items) => setRules(items.length ? items : RULES), (error) => tt(error.message));
    const unsubAwards = vectorRewardsService.subscribeAwards((items) => {
      setAwards(items);
      setAwardDrafts((current) => {
        const next = { ...current };
        items.forEach((award) => {
          if (!next[award.id]) next[award.id] = { value: award.value || "V", points: String(award.points || 15) };
        });
        return next;
      });
    }, (error) => tt(error.message));
    const unsubMembers = profilesService.subscribe(setMembers, (error) => tt(error.message));
    return () => { unsubRules(); unsubAwards(); unsubMembers(); };
  }, [tt]);

  const act = (e, next, msg) => { setEvents((l) => l.map((x) => (x.id === e.id ? { ...x, st: next } : x))); log(user.name, msg, e.title); tt(msg); };
  const confirmCancel = (e) => setModal(<>
    <h3>Cancel this event?</h3><p className="sub">Employees who saved or registered will be notified. This is recorded in the audit history.</p>
    <div className="row"><button className="btn r" onClick={() => { act(e, "Cancelled", "Event cancelled"); setModal(null); }}>Cancel event</button><button className="btn o" onClick={() => setModal(null)}>Keep event</button></div></>);
  const rows = events.filter((e) => (!cat || e.cat === cat) && (!st || e.st === st));
  const pend = events.filter((e) => e.st === "Pending approval").length;

  return (
    <>
      <PageHead title="Admin Console" sub="Event publishing, organisers and VECTOR governance. Visible to authorised roles only." />
      <div className="tabs">{["Dashboard", "Event management", "Organisers and roles", "VECTOR rules", "VECTOR approvals", "Leaderboard", "Audit history"].map((t) => <button key={t} className={"tab " + (tab === t ? "on" : "")} onClick={() => setTab(t)}>{t}</button>)}</div>

      {tab === "Dashboard" && (
        <div className="grid">
          {[["Published events", events.filter((e) => e.st === "Published").length], ["Pending approval", pend], ["Drafts", events.filter((e) => e.st === "Draft").length], ["Organisers", ORGS.length], ["VECTOR awards to review", awards.filter((a) => a.status === "Pending review").length], ["Moderation items", 2]].map(([l, n]) => (
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
        <>
          <div className="card bd" style={{ overflowX: "auto" }}>
            <table className="tbl">
              <thead><tr><th>Eligible action</th><th>Value</th><th>Points</th><th>Cap</th><th>Validation</th><th>Action</th></tr></thead>
              <tbody>{rules.map((r, index) => {
                const action = r.action || r.a;
                const value = r.value || r.v;
                const points = r.points ?? r.p;
                const key = r.id || action;
                return (
                  <tr key={key}>
                    <td><input className="in" aria-label="Eligible action" value={action} onChange={(event) => setRules((current) => current.map((item, i) => i === index ? { ...item, action: event.target.value, a: event.target.value } : item))} /></td>
                    <td><select className="pillsel" aria-label="VECTOR value" value={value} onChange={(event) => setRules((current) => current.map((item, i) => i === index ? { ...item, value: event.target.value, v: event.target.value } : item))}><option>V</option><option>E</option><option>C</option><option>T</option><option>O</option><option>R</option></select></td>
                    <td><input className="in" type="number" min="1" max="1000" aria-label="Points" value={points} onChange={(event) => setRules((current) => current.map((item, i) => i === index ? { ...item, points: Number(event.target.value), p: Number(event.target.value) } : item))} /></td>
                    <td><input className="in" aria-label="Reward cap" value={r.cap} onChange={(event) => setRules((current) => current.map((item, i) => i === index ? { ...item, cap: event.target.value } : item))} /></td>
                    <td><select className="pillsel" aria-label="Validation" value={r.review} onChange={(event) => setRules((current) => current.map((item, i) => i === index ? { ...item, review: event.target.value } : item))}><option>Automatic</option><option>Reviewer</option></select></td>
                    <td><button className="btn g" disabled={ruleBusy === key} onClick={async () => {
                      setRuleBusy(key);
                      try {
                        await vectorRewardsService.saveRule(r);
                        log(user.name, "Updated VECTOR rule", action);
                        tt("VECTOR rule updated");
                      } catch (error) { tt(error.message); }
                      setRuleBusy("");
                    }}>{ruleBusy === key ? "Saving…" : "Save"}</button></td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
          <div className="card bd" style={{ marginTop: 16 }}>
            <h3>Add eligible action</h3>
            <div className="row" style={{ marginTop: 10, alignItems: "flex-end" }}>
              <div className="fld" style={{ minWidth: 220, marginBottom: 0 }}><label>Action</label><input value={newRule.action} onChange={(event) => setNewRule((current) => ({ ...current, action: event.target.value }))} /></div>
              <div className="fld" style={{ width: 90, marginBottom: 0 }}><label>Value</label><select value={newRule.value} onChange={(event) => setNewRule((current) => ({ ...current, value: event.target.value }))}><option>V</option><option>E</option><option>C</option><option>T</option><option>O</option><option>R</option></select></div>
              <div className="fld" style={{ width: 110, marginBottom: 0 }}><label>Points</label><input type="number" min="1" max="1000" value={newRule.points} onChange={(event) => setNewRule((current) => ({ ...current, points: event.target.value }))} /></div>
              <button className="btn" onClick={async () => {
                if (!newRule.action.trim()) return tt("Enter an eligible action");
                try {
                  await vectorRewardsService.addRule({ action: newRule.action.trim(), value: newRule.value, points: Number(newRule.points), cap: newRule.cap, review: newRule.review });
                  setRules((current) => [...current, { a: newRule.action.trim(), v: newRule.value, p: Number(newRule.points), cap: newRule.cap, review: newRule.review }]);
                  setNewRule({ action: "", value: "V", points: "15", cap: "1 per month", review: "Reviewer" });
                  log(user.name, "Added VECTOR rule", newRule.action);
                  tt("VECTOR rule added");
                } catch (error) { tt(error.message); }
              }}>Add rule</button>
            </div>
          </div>
        </>
      )}

      {tab === "VECTOR approvals" && (
        <div className="card bd" style={{ overflowX: "auto" }}>
          <table className="tbl">
            <thead><tr><th>Employee</th><th>Event</th><th>Event date</th><th>VECTOR value</th><th>Points</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>{awards.map((award) => {
              const draft = awardDrafts[award.id] || { value: award.value || "V", points: String(award.points || 15) };
              return (
                <tr key={award.id}>
                  <td>{award.recipientName}</td>
                  <td>{award.eventTitle || award.activity}</td>
                  <td>{award.eventDate || "—"}</td>
                  <td><select className="pillsel" aria-label="VECTOR value" disabled={award.status !== "Pending review"} value={draft.value} onChange={(event) => setAwardDrafts((current) => ({ ...current, [award.id]: { ...draft, value: event.target.value } }))}><option>V</option><option>E</option><option>C</option><option>T</option><option>O</option><option>R</option></select></td>
                  <td><input className="in" type="number" min="1" max="1000" aria-label="Approved points" disabled={award.status !== "Pending review"} value={draft.points} onChange={(event) => setAwardDrafts((current) => ({ ...current, [award.id]: { ...draft, points: event.target.value } }))} /></td>
                  <td><Status s={award.status} /></td>
                  <td>{award.status === "Pending review" ? <div className="row">
                    <button className="btn g" onClick={async () => {
                      const points = Number(draft.points);
                      if (!Number.isInteger(points) || points < 1 || points > 1000) return tt("Points must be between 1 and 1000");
                      try {
                        await vectorRewardsService.reviewAward(user, award.id, "Approved", draft.value, points);
                        log(user.name, "Approved VECTOR values", award.recipientName + " · " + (award.eventTitle || award.activity));
                        tt("VECTOR values approved");
                      } catch (error) { tt(error.message); }
                    }}>Approve</button>
                    <button className="btn r" onClick={async () => {
                      try {
                        await vectorRewardsService.reviewAward(user, award.id, "Rejected");
                        log(user.name, "Rejected VECTOR submission", award.recipientName);
                        tt("Submission rejected");
                      } catch (error) { tt(error.message); }
                    }}>Reject</button>
                  </div> : <span className="hint">Reviewed</span>}</td>
                </tr>
              );
            })}</tbody>
          </table>
          {!awards.length && <Empty icon="calendar" title="No event submissions" text="Employee registrations will appear here for VECTOR approval." />}
        </div>
      )}

      {tab === "Leaderboard" && (
        <div className="card bd" style={{ overflowX: "auto" }}>
          <table className="tbl"><thead><tr><th>Rank</th><th>Employee</th><th>Office</th><th>Team</th><th>Points</th><th>Badges</th></tr></thead>
            <tbody>{[...members].sort((a, b) => (Number(b.points) || 0) - (Number(a.points) || 0)).map((member, index) => (
              <tr key={member.uid || member.name}><td>{index + 1}</td><td>{member.name}</td><td>{member.office || "—"}</td><td>{member.team || member.dept || "—"}</td><td>{Number(member.points) || 0}</td><td>{Number(member.badges) || 0}</td></tr>
            ))}</tbody>
          </table>
          {!members.length && <Empty icon="trophy" title="No leaderboard data" text="Employee profiles will appear here." />}
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
