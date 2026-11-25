import { useState } from "react";
import { Av, AvatarStack, Ic } from "../components/common";
import { Chips, Empty, ModalHead, PageHead, Status, dShort } from "../components/Bits";
import { VPicker, VTag } from "../components/Vector";
import { useAuth } from "../context/AuthContext";
import { useModules } from "../context/ModulesContext";
import { useUI } from "../context/UIContext";
import { todayStr } from "../utils/helpers";

const statusOf = (o, today) => {
  if (o.deadline && o.deadline < today) return "Registration closed";
  if (!o.size) return "Registration open";
  return o.team.length >= o.size ? "Team complete" : o.team.length ? "Team forming" : "Looking for teammates";
};

export default function Opportunities() {
  const { opps } = useModules();
  const { setModal, tt } = useUI();
  const [type, setType] = useState("All");
  const [scope, setScope] = useState("All");
  const [looking, setLooking] = useState(false);
  const [q, setQ] = useState("");
  const today = todayStr();
  const list = opps.filter((o) =>
    (type === "All" || o.type + "s" === type) && (scope === "All" || o.scope === scope) &&
    (!looking || statusOf(o, today) === "Looking for teammates" || statusOf(o, today) === "Team forming") &&
    (o.title + o.org + o.skills.join(" ")).toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <PageHead title="Opportunities" sub="Find colleagues for hackathons, conferences and workshops."
        action={<div className="row"><button className="btn" onClick={() => setModal(<CreateOpp />, "mid")}><Ic n="plus" s={16} />Post opportunity</button></div>} />
      <div className="row" style={{ marginBottom: 10 }}>
        <input className="in" style={{ maxWidth: 300 }} placeholder="Search title, organiser or skill" aria-label="Search opportunities" value={q} onChange={(e) => setQ(e.target.value)} />
        <label className="chk" style={{ margin: 0 }}><input type="checkbox" checked={looking} onChange={(e) => setLooking(e.target.checked)} />Looking for teammates</label>
      </div>
      <div className="row sp" style={{ marginBottom: 14 }}>
        <Chips items={["All", "Hackathons", "Conferences", "Workshops"]} value={type} onChange={setType} />
        <Chips items={["All", "Internal", "External"]} value={scope} onChange={setScope} />
      </div>
      {list.length ? <div className="grid">{list.map((o) => <OppCard key={o.id} o={o} today={today} />)}</div>
        : <Empty title="No opportunities found" text="Check back later or post an opportunity." />}
    </>
  );
}

function OppCard({ o, today }) {
  const { setModal } = useUI();
  const st = statusOf(o, today);
  const d = dShort(o.date);
  return (
    <div className="card bd">
      <div className="row sp" style={{ marginBottom: 8 }}><span className="pill">{o.type} · {o.scope}</span><Status s={st} /></div>
      <h3>{o.title}</h3>
      <div className="meta"><Ic n="calendar" s={15} />{d.full}<span>·</span><Ic n="pin" s={15} />{o.loc}</div>
      <div className="meta"><Ic n="clock" s={15} />Register by {dShort(o.deadline || o.date).full} · {o.org}</div>
      <div className="row" style={{ margin: "8px 0", gap: 6 }}>{o.skills.map((s) => <span key={s} className="pill gr">{s}</span>)}</div>
      {o.size > 0 && <><div className="row sp" style={{ margin: "10px 0 6px" }}><div className="bar" style={{ flex: 1 }}><i style={{ width: (o.team.length / o.size) * 100 + "%" }} /></div><AvatarStack names={o.team} extra={Math.max(0, o.team.length - 3)} size={24} /></div><div className="hint" style={{ margin: "4px 0 10px" }}>{o.team.length} of {o.size} team members</div></>}
      <button className="btn g w" onClick={() => setModal(<OppDetail id={o.id} />, "mid")}>View details</button>
    </div>
  );
}

function OppDetail({ id }) {
  const { user } = useAuth();
  const { opps, expressInterest, acceptMember, deleteOpportunity } = useModules();
  const { setModal, tt } = useUI();
  const o = opps.find((x) => x.id === id);
  if (!o) return null;
  const today = todayStr();
  const st = statusOf(o, today);
  const mine = o.ownerId ? o.ownerId === user.uid : !!o.mine;
  const interested = o.interestedIds?.includes(user.uid) || o.interested.includes(user.name);
  const closed = st === "Registration closed" || st === "Team complete";
  const interest = async () => {
    try {
      await expressInterest(id);
      tt(o.size ? "Request sent to the team" : "Interest recorded");
    } catch (error) { tt(error.message); }
  };
  const accept = async (name, index) => {
    if (o.team.length >= o.size) return;
    const requesterId = o.interestedIds?.[index] || name;
    try {
      await acceptMember(id, requesterId, name);
      tt(name + " added to the team");
    } catch (error) { tt(error.message); }
  };
  const remove = () => setModal(
    <>
      <h3>Delete this opportunity?</h3>
      <p className="sub">This cannot be undone.</p>
      <div className="row">
        <button className="btn r" onClick={async () => {
          try {
            await deleteOpportunity(id);
            setModal(null);
            tt("Opportunity deleted");
          } catch (error) { tt(error.message); }
        }}>Delete</button>
        <button className="btn o" onClick={() => setModal(null)}>Cancel</button>
      </div>
    </>
  );
  const external = o.url && o.scope === "External";
  return (
    <>
      <ModalHead title={o.title} onClose={() => setModal(null)} />
      <div className="mb col">
        <div className="row"><Status s={st} /><span className="pill">{o.type} · {o.scope}</span></div>
        <p className="sub" style={{ margin: 0 }}>{o.desc}</p>
        <div className="meta"><Ic n="calendar" s={15} />{dShort(o.date).full}<span>·</span><Ic n="pin" s={15} />{o.loc}</div>
        <div className="meta">Organiser: {o.org} · Registration deadline {dShort(o.deadline || o.date).full}</div>
        <div className="row" style={{ gap: 6 }}>{o.skills.map((s) => <span key={s} className="pill gr">{s}</span>)}</div>
        {o.size > 0 ? (
          <>
            <h3>Team ({o.team.length}/{o.size})</h3>
            {o.team.map((n) => <div key={n} className="row" style={{ flexWrap: "nowrap" }}><Av n={n} s={30} /><b style={{ fontSize: 13 }}>{n}</b></div>)}
            {!o.team.length && <span className="hint">No members yet. Be the first.</span>}
            <h3>Interested</h3>
            {o.interested.map((n, index) => (
              !o.team.includes(n) && <div key={o.interestedIds?.[index] || n} className="row sp"><div className="row" style={{ flexWrap: "nowrap" }}><Av n={n} s={30} /><span style={{ fontSize: 13 }}>{n}</span></div>
                {mine && <button className="btn g" onClick={() => accept(n, index)}>Accept</button>}</div>
            ))}
          </>
        ) : <><h3>Attending</h3><span className="hint">{o.interested.length ? o.interested.join(", ") : "No one yet."}</span></>}
        <div className="row" style={{ marginTop: 6 }}>
          {!mine && <button className="btn" disabled={interested || closed} onClick={interest}>{interested ? "Request sent" : o.size ? "Request to join" : "Express interest"}</button>}
          {mine && <button className="btn r" onClick={remove}>Delete opportunity</button>}
          {external && <a className="btn o" href={o.url} target="_blank" rel="noreferrer">Register externally (leaves MaSphere)</a>}
        </div>
      </div>
    </>
  );
}

function CreateOpp() {
  const { user } = useAuth();
  const { createOpportunity } = useModules();
  const { setModal, tt } = useUI();
  const [f, setF] = useState({ type: "Hackathon", scope: "Internal", title: "", org: "", date: "", deadline: "", loc: "", skills: "", size: 4, desc: "", url: "" });
  const [vals, setVals] = useState([]);
  const [er, setEr] = useState({});
  const [busy, setBusy] = useState(false);
  const s = (k, v) => setF((o) => ({ ...o, [k]: v }));
  const E = ({ k }) => (er[k] ? <span className="em">{er[k]}</span> : null);
  const pub = async () => {
    const e = {};
    if (!f.title.trim()) e.title = "Add a title";
    if (!f.org.trim()) e.org = "Add the organiser";
    if (!f.date) e.date = "Pick a date"; else if (f.date < todayStr()) e.date = "Date can't be in the past";
    if (!f.loc.trim()) e.loc = "Add a venue or Online";
    setEr(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      await createOpportunity(f, vals);
      setModal(null);
      tt("Opportunity posted");
    } catch (error) {
      setEr((current) => ({ ...current, form: error.message }));
      setBusy(false);
    }
  };
  return (
    <>
      <ModalHead title="Post an opportunity" onClose={() => setModal(null)} />
      <div className="mb">
        <div className="two">
          <div className="fld"><label>TYPE</label><div className="seg">{["Hackathon", "Conference", "Workshop"].map((t) => <button type="button" key={t} className={f.type === t ? "on" : ""} onClick={() => s("type", t)}>{t}</button>)}</div></div>
          <div className="fld"><label>INTERNAL OR EXTERNAL</label><div className="seg">{["Internal", "External"].map((t) => <button type="button" key={t} className={f.scope === t ? "on" : ""} onClick={() => s("scope", t)}>{t}</button>)}</div></div>
        </div>
        <div className={"fld " + (er.title ? "er" : "")}><label>TITLE</label><input value={f.title} onChange={(e) => s("title", e.target.value)} /><E k="title" /></div>
        <div className={"fld " + (er.org ? "er" : "")}><label>ORGANISER</label><input value={f.org} onChange={(e) => s("org", e.target.value)} /><E k="org" /></div>
        <div className="two">
          <div className={"fld " + (er.date ? "er" : "")}><label>EVENT DATE</label><input type="date" min={todayStr()} value={f.date} onChange={(e) => s("date", e.target.value)} /><E k="date" /></div>
          <div className="fld"><label>REGISTRATION DEADLINE</label><input type="date" value={f.deadline} onChange={(e) => s("deadline", e.target.value)} /></div>
        </div>
        <div className={"fld " + (er.loc ? "er" : "")}><label>VENUE OR ONLINE</label><input value={f.loc} onChange={(e) => s("loc", e.target.value)} /><E k="loc" /></div>
        <div className="fld"><label>REQUIRED SKILLS (COMMA SEPARATED)</label><input value={f.skills} placeholder="React, Python, UX" onChange={(e) => s("skills", e.target.value)} /></div>
        {f.type === "Hackathon" && <div className="fld"><label>DESIRED TEAM SIZE</label><div className="step"><button type="button" onClick={() => s("size", Math.max(2, f.size - 1))}>−</button><span>{f.size}</span><button type="button" onClick={() => s("size", Math.min(10, f.size + 1))}>+</button></div></div>}
        <div className="fld"><label>EVENT LINK (OPTIONAL)</label><input value={f.url} placeholder="https://" onChange={(e) => s("url", e.target.value)} /></div>
        <div className="fld"><label>DESCRIPTION</label><textarea maxLength={300} value={f.desc} onChange={(e) => s("desc", e.target.value)} /></div>
        <div className="fld"><label>VECTOR VALUES (OPTIONAL)</label><VPicker value={vals} onChange={setVals} /></div>
        {er.form && <div className="em" role="alert">{er.form}</div>}
        <div className="row sp"><button className="btn o" onClick={() => setModal(null)}>Cancel</button><button className="btn" disabled={busy} onClick={pub}>{busy ? "Posting…" : "Post opportunity"}</button></div>
      </div>
    </>
  );
}
