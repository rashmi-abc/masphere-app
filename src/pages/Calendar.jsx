import { useState } from "react";
import { Ic } from "../components/common";
import { CatPicker } from "../components/Pickers";
import { Empty, ModalHead, Status, dShort } from "../components/Bits";
import { useAuth } from "../context/AuthContext";
import { useModules } from "../context/ModulesContext";
import { useUI } from "../context/UIContext";
import { EVENT_CATS } from "../data/modules";
import { OFFICES } from "../data/constants";
import { todayStr } from "../utils/helpers";

const OFFS = OFFICES.filter((o) => o !== "Other");
const CLS = { HR: "c1", MPL: "c2", Sheroes: "c3", Technical: "c4", Learning: "c5", Community: "c6" };
const pad = (n) => String(n).padStart(2, "0");
export const regState = (e) => (!e.reg ? "" : e.deadline && e.deadline < todayStr() ? "Registration closed" : "Registration open");

export default function Calendar() {
  const { user } = useAuth();
  const { events } = useModules();
  const { setModal } = useUI();
  const today = todayStr();
  const now = new Date();
  const [cur, setCur] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [view, setView] = useState("Month");
  const [tab, setTab] = useState("All events");
  const [off, setOff] = useState("All offices");
  const [cat, setCat] = useState("All categories");
  const [day, setDay] = useState("");
  const admin = !!user.admin;

  const visible = events
    .filter((e) => admin || ["Published", "Updated", "Cancelled"].includes(e.st))
    .filter((e) => (tab === "Cancelled" ? e.st === "Cancelled" : e.st !== "Cancelled"))
    .filter((e) => (tab !== "My office" || e.offices.includes(user.office) || e.offices.includes("All offices")))
    .filter((e) => off === "All offices" || e.offices.includes(off) || e.offices.includes("All offices"))
    .filter((e) => cat === "All categories" || e.cat === cat)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  const ym = `${cur.y}-${pad(cur.m + 1)}`;
  const monthName = new Date(cur.y, cur.m, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  const last = new Date(cur.y, cur.m + 1, 0).getDate();
  const shift = (d) => { const x = new Date(cur.y, cur.m + d, 1); setCur({ y: x.getFullYear(), m: x.getMonth() }); setDay(""); };
  const first = (new Date(cur.y, cur.m, 1).getDay() + 6) % 7;
  const monthRange = `1 to ${last} ${new Date(cur.y, cur.m, 1).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}`;
  const t = new Date();
  const open = (id) => setModal(<EventDetail id={id} />, "mid");
  const agenda = visible.filter((e) => (day ? e.date === day : e.date.startsWith(ym)));

  return (
    <>
      <div className="chead">
        <div className="row" style={{ gap: 14, flexWrap: "nowrap" }}>
          <div className="dbadge lg"><span>{t.toLocaleDateString("en-IN", { month: "short" })}</span><b>{t.getDate()}</b></div>
          <div><h1 style={{ margin: 0 }}>{monthName}</h1><p className="sub" style={{ margin: 0 }}>{monthRange} · Official events across every office</p></div>
        </div>
        {admin && <button className="btn" onClick={() => setModal(<EventForm />, "mid")}><Ic n="plus" s={16} />Add event</button>}
      </div>

      <div className="cpanel">
        <div className="row sp" style={{ marginBottom: 14 }}>
          <div className="utabs" role="tablist">{["All events", "My office", "Cancelled"].map((x) => <button key={x} role="tab" aria-selected={tab === x} className={tab === x ? "on" : ""} onClick={() => setTab(x)}>{x}</button>)}</div>
          <div className="row" style={{ gap: 8 }}>
            <select className="pillsel" aria-label="Office" value={off} onChange={(e) => setOff(e.target.value)}><option>All offices</option>{OFFS.map((o) => <option key={o}>{o}</option>)}</select>
            <select className="pillsel" aria-label="Category" value={cat} onChange={(e) => setCat(e.target.value)}><option>All categories</option>{EVENT_CATS.map((o) => <option key={o}>{o}</option>)}</select>
            <div className="nav3"><button aria-label="Previous month" onClick={() => shift(-1)}><Ic n="chevL" s={16} /></button><button onClick={() => { setCur({ y: now.getFullYear(), m: now.getMonth() }); setDay(""); }}>Today</button><button aria-label="Next month" onClick={() => shift(1)}><Ic n="chevR" s={16} /></button></div>
            <select className="pillsel" aria-label="View" value={view} onChange={(e) => setView(e.target.value)}><option>Month</option><option>Agenda</option></select>
          </div>
        </div>

        {view === "Month" && (
          <>
            <div className="wdh">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <div key={d}>{d}</div>)}</div>
            <div className="mgrid">
              {Array.from({ length: first }, (_, i) => <div key={"b" + i} className="mcell off" />)}
              {Array.from({ length: last }, (_, i) => i + 1).map((d, i) => {
                const key = `${ym}-${pad(d)}`;
                const ev = visible.filter((e) => e.date === key);
                const wk = (first + i) % 7 > 4;
                return (
                  <div key={d} className={"mcell " + (wk ? "wk" : "")}>
                    <span className={"mn " + (key === today ? "today" : "")}>{d}</span>
                    {ev.slice(0, 3).map((e) => <button key={e.id} className={"evc " + CLS[e.cat]} onClick={() => open(e.id)} title={e.title}><b>{e.time}</b><span>{e.title}</span></button>)}
                    {ev.length > 3 && <button className="more" onClick={() => { setDay(key); setView("Agenda"); }}>+{ev.length - 3} more</button>}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {view === "Agenda" && (
          <>
            {day && <div className="row" style={{ marginBottom: 10 }}><b>{dShort(day).full}</b><button className="chip" onClick={() => setDay("")}>Show whole month</button></div>}
            {agenda.length ? <div className="col">{agenda.map((e) => <EventCard key={e.id} e={e} />)}</div> : <Empty icon="calendar" title="No events scheduled" text="No events scheduled for this period." />}
          </>
        )}
      </div>
    </>
  );
}

function EventCard({ e }) {
  const { setModal } = useUI();
  const d = dShort(e.date);
  return (
    <div className="card bd row sp" style={{ flexWrap: "nowrap" }}>
      <div className="row" style={{ flexWrap: "nowrap", alignItems: "flex-start", gap: 14 }}>
        <div className="dbadge"><b>{d.day}</b><span>{d.mon}</span></div>
        <div><h3>{e.title}</h3><div className="hint">{e.time} · {e.offices.join(", ")} · {e.venue}</div><div className="row" style={{ marginTop: 6, gap: 6 }}><span className="pill">{e.cat}</span><Status s={e.st} />{regState(e) && <Status s={regState(e)} />}</div></div>
      </div>
      <button className="btn g" onClick={() => setModal(<EventDetail id={e.id} />, "mid")}>View details</button>
    </div>
  );
}

function EventDetail({ id }) {
  const { events, savedEvents, calendarEvents, saveEvent, unsaveEvent, addEventToCalendar, removeEventFromCalendar } = useModules();
  const { setModal, tt } = useUI();
  const e = events.find((x) => x.id === id);
  const [reg, setReg] = useState(false);
  const bookmarked = savedEvents.some((item) => String(item.id) === String(id));
  const onCalendar = calendarEvents.some((item) => String(item.id) === String(id));
  const rs = regState(e);
  return (
    <>
      <ModalHead title={e.title} onClose={() => setModal(null)} />
      <div className="mb col">
        <div className="row"><span className="pill">{e.cat}</span><Status s={e.st} />{rs && <Status s={rs} />}</div>
        <p className="sub" style={{ margin: 0 }}>{e.desc}</p>
        <div className="meta"><Ic n="calendar" s={15} />{dShort(e.date).full}, {e.time}</div>
        <div className="meta"><Ic n="pin" s={15} />{e.offices.join(", ")} · {e.venue}</div>
        <div className="meta">Organiser: {e.org}{e.deadline ? ` · Register by ${dShort(e.deadline).full}` : ""}</div>
        <div className="row">
          <button className="btn o" aria-pressed={bookmarked} onClick={async () => {
            try {
              if (bookmarked) {
                await unsaveEvent(e.id);
                tt("Removed from bookmarks");
              } else {
                await saveEvent(e);
                tt("Event saved to bookmarks");
              }
            } catch (error) { tt(error.message); }
          }}>{bookmarked ? "Saved" : "Save event"}</button>
          <button className="btn o" aria-pressed={onCalendar} onClick={async () => {
            try {
              if (onCalendar) {
                await removeEventFromCalendar(e.id);
                tt("Removed from your calendar");
              } else {
                await addEventToCalendar(e);
                tt("Added to your calendar");
              }
            } catch (error) { tt(error.message); }
          }}>{onCalendar ? "Remove from my calendar" : "Add to my calendar"}</button>
          {e.reg && <button className="btn" disabled={reg || rs === "Registration closed"} onClick={() => { setReg(true); tt("Registered"); }}>{reg ? "Registered" : "Register"}</button>}
        </div>
      </div>
    </>
  );
}

function EventForm() {
  const { user } = useAuth();
  const { setEvents, log } = useModules();
  const { setModal, tt } = useUI();
  const [f, setF] = useState({ title: "", cat: "HR", date: "", time: "", venue: "", org: user.name, desc: "", reg: true, deadline: "" });
  const [offs, setOffs] = useState([]);
  const [er, setEr] = useState({});
  const s = (k, v) => setF((o) => ({ ...o, [k]: v }));
  const E = ({ k }) => (er[k] ? <span className="em">{er[k]}</span> : null);
  const save = (st) => {
    const e = {};
    if (!f.title.trim()) e.title = "Add a title";
    if (!f.date) e.date = "Pick a date";
    if (!f.time) e.time = "Pick a time";
    if (!f.venue.trim()) e.venue = "Add a venue or Online";
    if (!offs.length) e.offs = "Select at least one office";
    setEr(e);
    if (Object.keys(e).length) return;
    setEvents((l) => [{ id: Date.now(), ...f, title: f.title.trim(), offices: offs, st }, ...l]);
    log(user.name, st === "Published" ? "Published event" : st === "Draft" ? "Saved draft" : "Submitted for approval", f.title);
    setModal(null); tt(st === "Published" ? "Published" : st === "Draft" ? "Draft saved" : "Submitted for approval");
  };
  return (
    <>
      <ModalHead title="Create event" onClose={() => setModal(null)} />
      <div className="mb">
        <p className="hint" style={{ marginBottom: 12 }}>Your scope: all categories and all offices (Platform Admin).</p>
        <div className={"fld " + (er.title ? "er" : "")}><label>EVENT TITLE</label><input value={f.title} onChange={(e) => s("title", e.target.value)} /><E k="title" /></div>
        <div className="fld"><label>CATEGORY</label><CatPicker value={f.cat} onChange={(v) => s("cat", v)} options={EVENT_CATS} /></div>
        <div className="two">
          <div className={"fld " + (er.date ? "er" : "")}><label>DATE</label><input type="date" value={f.date} onChange={(e) => s("date", e.target.value)} /><E k="date" /></div>
          <div className={"fld " + (er.time ? "er" : "")}><label>START TIME</label><input type="time" value={f.time} onChange={(e) => s("time", e.target.value)} /><E k="time" /></div>
        </div>
        <div className="fld"><label>OFFICE LOCATIONS</label>
          <div className="row" style={{ gap: 6 }}>{["All offices", ...OFFS].map((o) => <button type="button" key={o} className={"chip " + (offs.includes(o) ? "on" : "")} aria-pressed={offs.includes(o)} onClick={() => setOffs(offs.includes(o) ? offs.filter((x) => x !== o) : [...offs, o])}>{o}</button>)}</div><E k="offs" /></div>
        <div className={"fld " + (er.venue ? "er" : "")}><label>VENUE OR ONLINE</label><input value={f.venue} onChange={(e) => s("venue", e.target.value)} /><E k="venue" /></div>
        <div className="fld"><label>DESCRIPTION</label><textarea maxLength={300} value={f.desc} onChange={(e) => s("desc", e.target.value)} /></div>
        <label className="chk"><input type="checkbox" checked={f.reg} onChange={(e) => s("reg", e.target.checked)} />Registration required</label>
        {f.reg && <div className="fld"><label>REGISTRATION DEADLINE</label><input type="date" value={f.deadline} onChange={(e) => s("deadline", e.target.value)} /></div>}
        <div className="row sp" style={{ marginTop: 12 }}>
          <button className="btn o" onClick={() => save("Draft")}>Save draft</button>
          <div className="row"><button className="btn g" onClick={() => save("Pending approval")}>Submit for approval</button><button className="btn" onClick={() => save("Published")}>Publish</button></div>
        </div>
      </div>
    </>
  );
}
