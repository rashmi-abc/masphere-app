import { Ic } from "./common";

const cls = (s) =>
  /closed|Cancel|Adjusted|Locked/i.test(s) ? "bad"
  : /Pending|forming|Looking|Draft/i.test(s) ? "warn"
  : /open|Published|Approved|complete|Earned|Updated/i.test(s) ? "ok" : "info";
export const Status = ({ s }) => <span className={"st " + cls(s)}>{s}</span>;

export const Empty = ({ icon = "search", title, text, action }) => (
  <div className="card empty"><Ic n={icon} s={30} /><b>{title}</b><span>{text}</span>{action && <div style={{ marginTop: 12 }}>{action}</div>}</div>
);

export const Chips = ({ items, value, onChange }) => (
  <div className="row" role="group" style={{ gap: 6 }}>
    {items.map((i) => <button key={i} type="button" className={"chip " + (value === i ? "on" : "")} aria-pressed={value === i} onClick={() => onChange(i)}>{i}</button>)}
  </div>
);

export const PageHead = ({ title, sub, action }) => (
  <div className="row sp" style={{ marginBottom: 6 }}><div><h1>{title}</h1><p className="sub">{sub}</p></div>{action}</div>
);

export const ModalHead = ({ title, onClose }) => (
  <div className="mh"><h3>{title}</h3><button className="ib" aria-label="Close" onClick={onClose}><Ic n="x" /></button></div>
);

export const dShort = (d) => {
  if (!d) return { day: "—", mon: "Date", full: "Date unavailable" };
  const x = typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d) ? new Date(d + "T00:00:00") : new Date(d);
  if (Number.isNaN(x.getTime())) return { day: "—", mon: "Date", full: "Date unavailable" };
  return {
    day: x.getDate(),
    mon: x.toLocaleDateString("en-IN", { month: "short" }),
    full: x.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" }),
  };
};

export const TabPills = ({ items, value, onChange, label }) => (
  <div className="tab-pills" role="tablist" aria-label={label}>
    {items.map((item) => (
      <button key={item} type="button" role="tab" aria-selected={value === item}
        className={value === item ? "on" : ""} onClick={() => onChange(item)}>{item}</button>
    ))}
  </div>
);
