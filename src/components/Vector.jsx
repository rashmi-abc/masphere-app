export const VALUES = [
  { k: "V", name: "Value", color: "#2457D6" }, { k: "E", name: "Empowerment", color: "#7C4DCC" },
  { k: "C", name: "Collaboration", color: "#0F8B8D" }, { k: "T", name: "Trust", color: "#B7791F" },
  { k: "O", name: "Ownership", color: "#C2410C" }, { k: "R", name: "Responsibility", color: "#475569" },
];
const find = (k) => VALUES.find((v) => v.k === k);

// Letter + full value name, never colour alone.
export const VTag = ({ k }) => {
  const v = find(k);
  return <span className="vt" style={{ color: v.color }}><b style={{ background: v.color }}>{v.k}</b><span>{v.name}</span></span>;
};

export function VPicker({ value, onChange }) {
  const tog = (k) => onChange(value.includes(k) ? value.filter((x) => x !== k) : [...value, k]);
  return (
    <div className="row" style={{ gap: 6 }}>
      {VALUES.map((v) => (
        <button type="button" key={v.k} className="vt pick" style={{ color: v.color }} aria-pressed={value.includes(v.k)} onClick={() => tog(v.k)}>
          <b style={{ background: v.color }}>{v.k}</b><span>{v.name}</span>
        </button>
      ))}
    </div>
  );
}
