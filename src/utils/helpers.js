export const initials = (s) =>
  (s || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

export const PALETTE = ["#2457D6", "#0F766E", "#B45309", "#6D28D9", "#BE185D", "#0369A1", "#475569"];

export const colorFor = (name) =>
  PALETTE[[...(name || "?")].reduce((a, c) => a + c.charCodeAt(0), 0) % PALETTE.length];

export const todayStr = () => {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
};

export const fmtD = (d, t) => {
  if (!d) return "Date unavailable";
  const x = new Date(d + "T" + (t || "00:00"));
  if (Number.isNaN(x.getTime())) return "Date unavailable";
  return (
    x.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" }) +
    (t ? ", " + x.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }) : "")
  );
};

export const money = (b) => (b ? "₹" + b : "Free");

// Reads an image file, center-crops to a square and downsizes it (keeps the saved data small).
export const fileToAvatar = (file, size = 256) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = c.height = size;
      const side = Math.min(img.width, img.height);
      c.getContext("2d").drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("bad image")); };
    img.src = url;
  });
