import { useRef, useState } from "react";
import { Av, Ic, Switch } from "./common";
import { CatPicker } from "./Pickers";
import Media from "./Media";
import { VPicker } from "./Vector";
import { CATS, LOCS } from "../data/constants";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { useUI } from "../context/UIContext";

export default function PostCreator() {
  const { user } = useAuth();
  const { addPost, members } = useData();
  const { setModal, tt } = useUI();
  const [media, setMedia] = useState([]); // [{ type, src (preview url), file }]
  const [cap, setCap] = useState("");
  const [loc, setLoc] = useState("");
  const [tags, setTags] = useState([]);
  const [cat, setCat] = useState("");
  const [noc, setNoc] = useState(false);
  const [vals, setVals] = useState([]);
  const [tg, setTg] = useState(false);
  const [ts, setTs] = useState("");
  const [i, setI] = useState(0);
  const [busy, setBusy] = useState(false);
  const fr = useRef();

  const add = (fl) => {
    const a = [...fl]
      .filter((f) => /^(image|video)\//.test(f.type))
      .slice(0, 10 - media.length)
      .map((f) => ({ type: f.type.startsWith("video") ? "video" : "image", src: URL.createObjectURL(f), file: f }));
    if (!a.length) return tt("Choose a photo or video");
    setMedia((m) => [...m, ...a]);
  };
  const can = cap.trim().length > 0 || media.length > 0;
  const share = async () => {
    if (!can) return tt("Write something or add a photo");
    setBusy(true);
    try {
      await addPost({ text: cap.trim(), category: cat, location: loc, tags, media, commentsOff: noc, vals });
      setModal(null);
      tt("Post shared");
    } catch (e) {
      tt(e.message);
      setBusy(false);
    }
  };
  const people = members.filter((person) => person.name.toLowerCase().includes(ts.toLowerCase()));

  return (
    <>
      <div className="mh"><h3>Create a post</h3><button className="ib" onClick={() => setModal(null)}><Ic n="x" /></button></div>
      <input ref={fr} type="file" accept="image/*,video/*" multiple hidden onChange={(e) => { add(e.target.files); e.target.value = ""; }} />
      <div className="mb">
        <div className="row" style={{ marginBottom: 10, flexWrap: "nowrap" }}>
          <Av n={user.name} s={38} src={user.avatar} />
          <div><b style={{ fontSize: 14 }}>{user.name}</b><div className="hint">{user.role}</div></div>
        </div>
        <textarea autoFocus maxLength={500} value={cap} onChange={(e) => setCap(e.target.value)} placeholder="What's on your mind? Write a message, or add a photo below."
          style={{ width: "100%", minHeight: 120, border: 0, background: "none", resize: "vertical", fontSize: 16, lineHeight: 1.5, padding: 0 }} />
        <div className="hint" style={{ textAlign: "right" }}>{cap.length}/500</div>
        {media.length > 0 && (
          <div style={{ margin: "10px 0" }}>
            <div style={{ borderRadius: 10, overflow: "hidden" }}><Media key={media.length} m={media} idx={Math.min(i, media.length - 1)} setIdx={setI} /></div>
            <div className="row" style={{ marginTop: 10 }}>
              {media.map((m, j) => (
                <div key={j} style={{ position: "relative", width: 52, height: 52, borderRadius: 8, overflow: "hidden", border: j === i ? "2px solid var(--p)" : "2px solid transparent", cursor: "pointer" }} onClick={() => setI(j)}>
                  {m.type === "video" ? <video src={m.src} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <img src={m.src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                  <button style={{ position: "absolute", top: 1, right: 1, border: 0, background: "rgba(0,0,0,.65)", color: "#fff", borderRadius: "50%", width: 18, height: 18, fontSize: 10, lineHeight: 1 }}
                    onClick={(e) => { e.stopPropagation(); setMedia(media.filter((_, k) => k !== j)); setI(0); }}>×</button>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="row" style={{ margin: "10px 0 4px", paddingTop: 12, borderTop: "1px solid var(--l)" }}>
          <button type="button" className="chip" onClick={() => fr.current.click()}><Ic n="image" s={15} />{media.length ? "Add more" : "Add photo or video (optional)"}</button>
          <button type="button" className="chip" onClick={() => setTg(!tg)}><Ic n="users" s={15} />Tag people</button>
        </div>
        {tags.length > 0 && (
          <div className="row" style={{ margin: "6px 0" }}>
            {tags.map((t) => <span key={t} className="pill" style={{ cursor: "pointer" }} onClick={() => setTags(tags.filter((x) => x !== t))}>@{t} ×</span>)}
          </div>
        )}
        {tg && (
          <div className="card bd" style={{ boxShadow: "none", padding: 10, margin: "6px 0" }}>
            <input className="in" placeholder="Search colleagues" value={ts} onChange={(e) => setTs(e.target.value)} />
            {people.map((person) => (
              <label key={person.uid || person.name} className="row chk" style={{ margin: "6px 0", cursor: "pointer", alignItems: "center", color: "var(--t)", flexWrap: "nowrap" }}>
                <input type="checkbox" checked={tags.includes(person.name)} onChange={() => setTags(tags.includes(person.name) ? tags.filter((x) => x !== person.name) : [...tags, person.name])} />
                <Av n={person.name} s={26} /><span>{person.name}<span className="hint"> · {person.office}</span></span>
              </label>
            ))}
          </div>
        )}
        <div className="fld" style={{ marginTop: 12 }}>
          <label>LOCATION (OPTIONAL)</label>
          <input value={loc} onChange={(e) => setLoc(e.target.value)} placeholder="Add location" />
          <div className="row" style={{ gap: 6 }}>
            {LOCS.filter((l) => l !== loc).slice(0, 4).map((l) => <button type="button" key={l} className="chip" style={{ padding: "3px 10px", fontSize: 11 }} onClick={() => setLoc(l)}>{l}</button>)}
          </div>
        </div>
        <div className="fld"><label>CATEGORY (OPTIONAL)</label><CatPicker value={cat} onChange={setCat} options={CATS} /></div>
        <div className="fld"><label>VECTOR VALUES (OPTIONAL)</label><VPicker value={vals} onChange={setVals} /><span className="hint">Pick the values you believe this reflects. Selecting a value does not automatically award points; eligible contributions are reviewed.</span></div>
        <div className="srow" style={{ padding: "8px 0" }}><b style={{ fontSize: 13 }}>Turn off commenting</b><Switch on={noc} onChange={setNoc} /></div>
        <div className="row sp" style={{ marginTop: 14 }}>
          <button className="btn o" onClick={() => setModal(null)}>Cancel</button>
          <button className="btn" disabled={!can || busy} onClick={share}>Post</button>
        </div>
      </div>
    </>
  );
}
