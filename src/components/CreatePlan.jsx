import { useRef, useState } from "react";
import { Ic } from "./common";
import { CatPicker } from "./Pickers";
import { PCATS } from "../data/constants";
import { todayStr } from "../utils/helpers";
import { useData } from "../context/DataContext";
import { useUI } from "../context/UIContext";

export default function CreatePlan() {
  const { addPlan } = useData();
  const { setModal, tt } = useUI();
  const [f, setF] = useState({ t: "", cat: "Weekend trip", d: "", tm: "", loc: "", bud: "", max: 6, mode: "Group", desc: "" });
  const [img, setImg] = useState(null); // { src, file }
  const [er, setEr] = useState({});
  const [dg, setDg] = useState(false);
  const [busy, setBusy] = useState(false);
  const fr = useRef();
  const s = (k, v) => setF((o) => ({ ...o, [k]: v }));
  const pick = (fl) => {
    const x = fl && fl[0];
    if (x && x.type.startsWith("image/")) setImg({ src: URL.createObjectURL(x), file: x });
  };

  const pub = async () => {
    const e = {};
    if (!f.t.trim()) e.t = "Give your plan a title";
    if (!f.cat.trim()) e.cat = "Choose or type a category";
    if (!f.d) e.d = "Pick a date"; else if (f.d < todayStr()) e.d = "Date can't be in the past";
    if (!f.tm) e.tm = "Pick a time";
    if (!f.loc.trim()) e.loc = "Add a location";
    if (f.max < 2) e.max = "At least 2";
    setEr(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      await addPlan(f, img);
      setModal(null);
      tt("Plan published. You approve every join request.");
    } catch (err) {
      tt(err.message);
      setBusy(false);
    }
  };
  const E = ({ k }) => (er[k] ? <span className="em">{er[k]}</span> : null);

  return (
    <>
      <div className="mh">
        <h3>Create a plan</h3>
        <div className="row"><button className="btn o" onClick={() => setModal(null)}>Cancel</button><button className="btn" disabled={busy} onClick={pub}>Publish plan</button></div>
      </div>
      <div className="mb pf">
        <div>
          <label className="lbl">COVER IMAGE (OPTIONAL)</label>
          <input ref={fr} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files)} />
          <div style={{ marginTop: 6 }}>
            {img ? (
              <div className="cover"><img src={img.src} alt="" /><button className="ib x" style={{ background: "rgba(0,0,0,.6)", color: "#fff", width: 30, height: 30 }} onClick={() => setImg(null)}><Ic n="x" s={16} /></button></div>
            ) : (
              <div className={"drop " + (dg ? "dg" : "")} style={{ aspectRatio: "4/3" }} onClick={() => fr.current.click()}
                onDragOver={(e) => { e.preventDefault(); setDg(true); }} onDragLeave={() => setDg(false)}
                onDrop={(e) => { e.preventDefault(); setDg(false); pick(e.dataTransfer.files); }}>
                <div className="col" style={{ alignItems: "center", gap: 4 }}><Ic n="image" s={28} /><b>Upload a cover</b><span>Drag and drop or click to browse</span></div>
              </div>
            )}
          </div>
          <div className="fld" style={{ marginTop: 16 }}>
            <label>DESCRIPTION</label>
            <textarea maxLength={300} value={f.desc} onChange={(e) => s("desc", e.target.value)} placeholder="What's the plan? What should people bring?" style={{ minHeight: 110 }} />
            <span className="hint" style={{ textAlign: "right" }}>{f.desc.length}/300</span>
          </div>
        </div>
        <div>
          <div className={"fld " + (er.t ? "er" : "")}><label>TITLE</label><input value={f.t} maxLength={60} placeholder="Goa Weekend Getaway" onChange={(e) => s("t", e.target.value)} /><E k="t" /></div>
          <div className="fld"><label>CATEGORY</label><CatPicker value={f.cat} onChange={(v) => s("cat", v)} options={PCATS} /><E k="cat" /></div>
          <div className="two">
            <div className={"fld " + (er.d ? "er" : "")}><label>DATE</label><input type="date" min={todayStr()} value={f.d} onChange={(e) => s("d", e.target.value)} /><E k="d" /></div>
            <div className={"fld " + (er.tm ? "er" : "")}><label>TIME</label><input type="time" value={f.tm} onChange={(e) => s("tm", e.target.value)} /><E k="tm" /></div>
          </div>
          <div className={"fld " + (er.loc ? "er" : "")}><label>LOCATION</label><input value={f.loc} placeholder="Where are you meeting?" onChange={(e) => s("loc", e.target.value)} /><E k="loc" /></div>
          <div className="two">
            <div className="fld"><label>BUDGET PER PERSON (₹, OPTIONAL)</label><input type="number" min="0" value={f.bud} placeholder="Free" onChange={(e) => s("bud", e.target.value)} /></div>
            <div className="fld">
              <label>PARTICIPANT LIMIT</label>
              <div className="step"><button type="button" onClick={() => s("max", Math.max(2, f.max - 1))}>−</button><span>{f.max}</span><button type="button" onClick={() => s("max", Math.min(100, f.max + 1))}>+</button></div>
            </div>
          </div>
          <div className="fld"><label>WHO IS IT FOR?</label><div className="seg">{["Solo", "Family", "Group"].map((m) => <button type="button" key={m} className={f.mode === m ? "on" : ""} onClick={() => s("mode", m)}>{m}</button>)}</div></div>
        </div>
      </div>
    </>
  );
}
