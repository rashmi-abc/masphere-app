import { colorFor, initials } from "../utils/helpers";

const IC = {
  compass: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM16.2 7.8l-2.1 6.3-6.3 2.1 2.1-6.3z",
  calendar: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
  user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  sliders: "M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6",
  plus: "M12 5v14M5 12h14",
  heart: "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z",
  comment: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  bookmark: "M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z",
  search: "M21 21l-4.3-4.3M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  image: "M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zM8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM21 15l-5-5L5 21",
  pin: "M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0zM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  users: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8",
  x: "M18 6L6 18M6 6l12 12",
  check: "M20 6L9 17l-5-5",
  chevL: "M15 18l-6-6 6-6",
  chevR: "M9 18l6-6-6-6",
  clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2",
  lock: "M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM7 11V7a5 5 0 0 1 10 0v4",
  trash: "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6",
  rupee: "M6 3h12M6 8h12M6 13l8 8M6 13h3a4 4 0 0 0 0-10",
  download: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3",
  moon: "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  star: "M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z",
  trophy: "M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3",
  briefcase: "M4 7h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1zM8 7V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M3 13h18",
  home: "M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10",
  globe: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z",
};

export const Ic = ({ n, s = 20, f }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill={f ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={IC[n]} />
  </svg>
);

export const Av = ({ n, s = 40, src, presence = false, ring = false }) => (
  <span className={"av-wrap " + (ring ? "has-ring " : "")} style={{ width: s, height: s }}>
    {src ? (
      <img className="av" src={src} alt={n} loading="lazy" style={{ width: s, height: s, objectFit: "cover" }} />
    ) : (
      <span className="av" style={{ width: s, height: s, fontSize: s * 0.38, background: colorFor(n) }}>{initials(n)}</span>
    )}
    {presence && <span className="presence-dot" aria-label="Online" />}
  </span>
);

export const AvatarStack = ({ names = [], size = 28, extra = 0 }) => (
  <div className="avatar-stack" aria-label="Team members">
    {names.slice(0, 3).map((name) => <Av key={name} n={name} s={size} />)}
    {extra > 0 && <span className="avatar-stack-extra" style={{ width: size, height: size, fontSize: size * 0.38 }}>+{extra}</span>}
  </div>
);

export const Skeleton = ({ className = "", height = 16 }) => (
  <span className={"skeleton " + className} style={{ height }} aria-hidden="true" />
);

export const Switch = ({ on, onChange }) => (
  <button type="button" role="switch" aria-checked={!!on} className={"sw " + (on ? "on" : "")} onClick={() => onChange(!on)} />
);

// Defined at module level so inputs keep focus while typing.
export const Fld = ({ l, e, h, children }) => (
  <div className={"fld " + (e ? "er" : "")}>
    <label>{l}</label>
    {children}
    {h && <span className="hint">{h}</span>}
    {e && <span className="em">{e}</span>}
  </div>
);
