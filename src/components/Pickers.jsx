import { useState } from "react";

export function CatPicker({ value, onChange, options }) {
  const [o, setO] = useState(!!value && !options.includes(value));
  return (
    <div className="col" style={{ gap: 8 }}>
      <div className="row">
        {options.map((c) => (
          <button type="button" key={c} className={"chip " + (!o && value === c ? "on" : "")} onClick={() => { setO(false); onChange(c); }}>{c}</button>
        ))}
        <button type="button" className={"chip " + (o ? "on" : "")} onClick={() => { setO(true); onChange(""); }}>Other</button>
      </div>
      {o && <input className="in" autoFocus value={value} maxLength={30} placeholder="Type your own category" onChange={(e) => onChange(e.target.value)} />}
    </div>
  );
}

export function MultiPicker({ value, onChange, options }) {
  const [o, setO] = useState(false);
  const [x, setX] = useState("");
  const tog = (c) => onChange(value.includes(c) ? value.filter((v) => v !== c) : [...value, c]);
  const custom = value.filter((v) => !options.includes(v));
  const add = () => {
    const v = x.trim();
    if (v && !value.includes(v)) onChange([...value, v]);
    setX("");
  };
  return (
    <div className="col" style={{ gap: 8 }}>
      <div className="row">
        {options.map((c) => (
          <button type="button" key={c} className={"chip " + (value.includes(c) ? "on" : "")} onClick={() => tog(c)}>{c}</button>
        ))}
        {custom.map((c) => (
          <button type="button" key={c} className="chip on" onClick={() => tog(c)}>{c} ×</button>
        ))}
        <button type="button" className={"chip " + (o ? "on" : "")} onClick={() => setO(!o)}>Other</button>
      </div>
      {o && (
        <div className="row" style={{ flexWrap: "nowrap" }}>
          <input className="in" value={x} placeholder="Type your own interest and press Add" onChange={(e) => setX(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} />
          <button type="button" className="btn g" onClick={add}>Add</button>
        </div>
      )}
    </div>
  );
}

export function SelOther({ value, onChange, options, ph }) {
  const known = options.filter((o) => o !== "Other");
  const [o, setO] = useState(!!value && !known.includes(value));
  return (
    <>
      <select value={o ? "Other" : value} onChange={(e) => {
        if (e.target.value === "Other") { setO(true); onChange(""); } else { setO(false); onChange(e.target.value); }
      }}>
        <option value="">Select…</option>
        {options.map((c) => <option key={c}>{c}</option>)}
      </select>
      {o && <input style={{ marginTop: 8 }} value={value} placeholder={ph || "Type here"} onChange={(e) => onChange(e.target.value)} />}
    </>
  );
}
