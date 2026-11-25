import { useState } from "react";
import { Ic } from "./common";

// Image/video carousel. Pass idx + setIdx to control it from outside (post creator preview).
export default function Media({ m, idx, setIdx }) {
  const [j, setJ] = useState(0);
  const i = idx !== undefined ? idx : j;
  const si = setIdx || setJ;
  if (!m || !m.length) return null;
  const cur = m[Math.min(i, m.length - 1)];
  return (
    <div className="mw">
      {cur.type === "video" ? <video className="im" src={cur.src} controls playsInline /> : <img className="im" src={cur.src} alt="" />}
      {m.length > 1 && (
        <>
          {i > 0 && <button className="nb" style={{ left: 8 }} onClick={() => si(i - 1)}><Ic n="chevL" s={18} /></button>}
          {i < m.length - 1 && <button className="nb" style={{ right: 8 }} onClick={() => si(i + 1)}><Ic n="chevR" s={18} /></button>}
          <div className="dots">{m.map((_, k) => <i key={k} className={k === i ? "on" : ""} />)}</div>
        </>
      )}
    </div>
  );
}
