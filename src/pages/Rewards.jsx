import { useState } from "react";
import { Ic } from "../components/common";
import { Chips, PageHead, Status } from "../components/Bits";
import { VALUES, VTag } from "../components/Vector";
import { useAuth } from "../context/AuthContext";
import { BADGES, HISTORY, LEADERS } from "../data/modules";

const ZERO = { V: 0, E: 0, C: 0, T: 0, O: 0, R: 0 };
export const vectorOf = (u) => ({ ...ZERO, ...(u.vector || {}) });

export default function Rewards() {
  const { user } = useAuth();
  const [tab, setTab] = useState("Overview");
  const [lb, setLb] = useState("Overall");
  const [off, setOff] = useState("All");
  const sc = vectorOf(user);
  const total = Object.values(sc).reduce((a, b) => a + b, 0);
  const rows = LEADERS.filter((l) => lb !== "Office-wise" || off === "All" || l.office === off);
  return (
    <>
      <PageHead title="VECTOR Rewards" sub="Annual period: Apr 2026 to Mar 2027. Points come from reviewed contributions, never from likes or post volume." />
      <div className="tabs">{["Overview", "Score history", "Badges", "Leaderboard"].map((t) => <button key={t} className={"tab " + (tab === t ? "on" : "")} onClick={() => setTab(t)}>{t}</button>)}</div>

      {tab === "Overview" && (
        <>
          <div className="card bd row" style={{ gap: 40, marginBottom: 16 }}>
            <div><div className="hint">Total eligible points</div><b style={{ fontSize: 30 }}>{total}</b></div>
            <div><div className="hint">Badges earned</div><b style={{ fontSize: 30 }}>{BADGES.filter((b) => b.got).length}</b></div>
            <div><div className="hint">Current period</div><b style={{ fontSize: 16 }}>FY 2026–27</b></div>
          </div>
          <div className="grid">
            {VALUES.map((v) => (
              <div key={v.k} className="card bd">
                <VTag k={v.k} />
                <b style={{ fontSize: 28, display: "block", margin: "10px 0 6px", color: v.color }}>{sc[v.k]}</b>
                <div className="bar" role="progressbar" aria-label={v.name + " progress"} aria-valuenow={sc[v.k]} aria-valuemax={200}><i style={{ width: Math.min(100, sc[v.k] / 2) + "%", background: v.color }} /></div>
                <div className="hint" style={{ marginTop: 6 }}>{sc[v.k]} of 200 toward next milestone</div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === "Score history" && (
        <div className="card bd" style={{ overflowX: "auto" }}>
          <table className="tbl"><thead><tr><th>Date</th><th>Activity</th><th>Value</th><th>Points</th><th>Status</th></tr></thead>
            <tbody>{HISTORY.map((h, i) => <tr key={i}><td>{h.d}</td><td>{h.a}</td><td>{h.v}</td><td>{h.p}</td><td><Status s={h.s} /></td></tr>)}</tbody></table>
          <p className="hint" style={{ marginTop: 10 }}>Adjusted entries were reversed by a reviewer. Review notes are confidential.</p>
        </div>
      )}

      {tab === "Badges" && (
        <div className="grid">
          {BADGES.map((b) => (
            <div key={b.n} className="card bd" style={{ opacity: b.got ? 1 : 0.7 }}>
              <div className="row sp"><div className="ibox"><Ic n="star" s={18} /></div><Status s={b.got ? "Earned" : "Locked"} /></div>
              <h3 style={{ marginTop: 10 }}>{b.n}</h3><p style={{ margin: "4px 0 0" }}>{b.d}</p>
            </div>
          ))}
          {user.badges.map((b) => <div key={b} className="card bd"><div className="row sp"><div className="ibox"><Ic n="globe" s={18} /></div><Status s="Earned" /></div><h3 style={{ marginTop: 10 }}>{b}</h3><p style={{ margin: "4px 0 0" }}>Earned from plans and exploring.</p></div>)}
        </div>
      )}

      {tab === "Leaderboard" && (
        <>
          <div style={{ marginBottom: 10 }}><Chips items={["Overall", "Office-wise", "Team-wise", "By value"]} value={lb} onChange={setLb} /></div>
          {lb === "Office-wise" && <div style={{ marginBottom: 10 }}><Chips items={["All", "Mumbai", "Chennai", "Ahmedabad", "Pune"]} value={off} onChange={setOff} /></div>}
          <div className="card bd" style={{ overflowX: "auto" }}>
            <p className="hint" style={{ marginBottom: 8 }}>Ranked by reviewed points in the current annual period. Employees can hide their position in Settings.</p>
            <table className="tbl"><thead><tr><th>Rank</th><th>Employee</th><th>{lb === "Team-wise" ? "Team" : "Office"}</th><th>Points</th><th>Badges</th></tr></thead>
              <tbody>{rows.map((l, i) => <tr key={l.name}><td>{i + 1}</td><td>{l.name}</td><td>{lb === "Team-wise" ? l.team : l.office}</td><td>{l.pts}</td><td>{l.badges}</td></tr>)}</tbody></table>
          </div>
        </>
      )}
    </>
  );
}
