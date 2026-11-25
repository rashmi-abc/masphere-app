import { useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { Ic, Switch } from "../components/common";
import { MultiPicker, SelOther } from "../components/Pickers";
import { CATS, DEPTS, GOALS, OFFICES, SETTINGS_TABS } from "../data/constants";
import { useAuth } from "../context/AuthContext";
import { useUI } from "../context/UIContext";
import { browserNotificationPermission, requestBrowserNotificationPermission } from "../services/browserNotifications";

export default function Settings() {
  const { user, updateUser, logout, deleteAccount, changePassword, exportData } = useAuth();
  const { tt, theme, setTheme, setModal } = useUI();
  const navigate = useNavigate();
  const { tab } = useParams(); // /settings/:tab
  const S = user.settings;
  const stab = tab || "account";

  const [pf, setPf] = useState({ name: user.name, phone: user.phone || "", gender: user.gender || "", role: user.role, dept: user.dept, office: user.office, bio: user.bio || "" });
  const [ints, setInts] = useState(user.interests);
  const [goals, setGoals] = useState(user.goals || []);
  const [pw, setPw] = useState({ a: "", b: "", c: "" });
  const [pe, setPe] = useState("");
  const [pushPermission, setPushPermission] = useState(browserNotificationPermission);

  if (!SETTINGS_TABS.some((t) => t[0] === stab)) return <Navigate to="/settings/account" replace />;

  const set = async (k, v) => {
    try { await updateUser({ settings: { ...S, [k]: v } }); tt("Saved"); }
    catch (error) { tt(error.message); }
  };
  const toggleBrowserNotifications = async (enabled) => {
    if (enabled) {
      try {
        const permission = await requestBrowserNotificationPermission();
        setPushPermission(permission);
        if (permission !== "granted") {
          tt(permission === "denied"
            ? "Allow notifications for this site in your browser settings."
            : "Browser notifications are not supported here.");
          return;
        }
      } catch (error) {
        tt(error.message);
        return;
      }
    }
    try {
      await updateUser({ settings: { ...S, n_push: enabled } });
      tt(enabled ? "Browser notifications enabled" : "Browser notifications disabled");
    } catch (error) { tt(error.message); }
  };
  const row = (t, d, ctl) => <div className="srow"><div><b>{t}</b><span className="d">{d}</span></div>{ctl}</div>;
  const Sw = (k, t, d) => row(t, d, <Switch on={S[k]} onChange={(v) => set(k, v)} />);
  const Sel = (k, t, d, o) => row(t, d, <select value={S[k]} onChange={(e) => set(k, e.target.value)}>{o.map((x) => <option key={x}>{x}</option>)}</select>);

  const saveProfile = async () => {
    if (pf.name.trim().length < 2 || !pf.role.trim() || !pf.dept.trim() || !pf.office.trim()) return tt("Please fill all required fields");
    if (stab === "profile" && !pf.gender) return tt("Please select your gender");
    try {
      await updateUser({ ...pf, name: pf.name.trim() });
      tt("Profile updated");
    } catch (error) { tt(error.message); }
  };
  const chPw = async () => {
    if (pw.b.length < 8) return setPe("New password must be at least 8 characters");
    if (pw.b !== pw.c) return setPe("New passwords don't match");
    try {
      await changePassword(pw.a, pw.b);
      setPw({ a: "", b: "", c: "" }); setPe(""); tt("Password changed");
    } catch (e) { setPe(e.message); }
  };
  const dl = async () => {
    try {
      const data = await exportData();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
      a.download = "masphere-my-data.json";
      a.click();
      tt("Download started");
    } catch (e) { tt("Download failed: " + e.message); }
  };
  const doLogout = async () => {
    try { await logout(); navigate("/login"); }
    catch (error) { tt(error.message); }
  };
  const del = () =>
    setModal(
      <>
        <h3>Delete your account?</h3>
        <p className="sub">Your Firebase account and profile will be deleted. Posts and plans you created will remain visible to the community.</p>
        <div className="row">
          <button className="btn r" onClick={async () => {
            try { await deleteAccount(); setModal(null); navigate("/login"); }
            catch (error) { tt(error.message); }
          }}>Yes, delete</button>
          <button className="btn o" onClick={() => setModal(null)}>Cancel</button>
        </div>
      </>
    );

  return (
    <>
      <h1>Settings</h1>
      <p className="sub">Manage your account, privacy and how MaSphere works for you.</p>
      <div className="sl">
        <div className="stabs">
          {SETTINGS_TABS.map(([k, l, i]) => <button key={k} className={stab === k ? "on" : ""} onClick={() => navigate("/settings/" + k)}><Ic n={i} s={18} />{l}</button>)}
        </div>
        <div className="card bd" style={{ padding: 22, maxWidth: 680 }}>
          {stab === "account" && (
            <>
              <h3 style={{ marginBottom: 14 }}>Account</h3>
              <div className="two">
                <div className="fld"><label>Full name</label><input value={pf.name} onChange={(e) => setPf({ ...pf, name: e.target.value })} /></div>
                <div className="fld"><label>Phone</label><input value={pf.phone} placeholder="+91" onChange={(e) => setPf({ ...pf, phone: e.target.value })} /></div>
                <div className="fld"><label>Work email</label><input value={user.email} disabled /></div>
                <div className="fld"><label>Employee ID</label><input value={user.empId} disabled /></div>
              </div>
              <button className="btn" onClick={saveProfile}>Save changes</button>
              <h3 style={{ margin: "26px 0 12px" }}>Change password</h3>
              <div className="fld"><label>Current password</label><input type="password" value={pw.a} onChange={(e) => setPw({ ...pw, a: e.target.value })} /></div>
              <div className="two">
                <div className="fld"><label>New password</label><input type="password" value={pw.b} onChange={(e) => setPw({ ...pw, b: e.target.value })} /></div>
                <div className="fld"><label>Confirm new password</label><input type="password" value={pw.c} onChange={(e) => setPw({ ...pw, c: e.target.value })} /></div>
              </div>
              {pe && <div className="em" style={{ marginBottom: 10 }}>{pe}</div>}
              <button className="btn o" onClick={chPw}>Update password</button>
            </>
          )}
          {stab === "profile" && (
            <>
              <h3 style={{ marginBottom: 14 }}>Profile</h3>
              <div className="two">
                <div className="fld"><label>Full name *</label><input value={pf.name} onChange={(e) => setPf({ ...pf, name: e.target.value })} /></div>
                <div className="fld"><label>Gender *</label>
                  <select value={pf.gender} onChange={(e) => setPf({ ...pf, gender: e.target.value })}>
                    <option value="">Select gender</option>
                    <option value="Woman">Woman</option>
                    <option value="Man">Man</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
                <div className="fld"><label>Designation *</label><input value={pf.role} onChange={(e) => setPf({ ...pf, role: e.target.value })} /></div>
                <div className="fld"><label>Department *</label><SelOther value={pf.dept} onChange={(v) => setPf({ ...pf, dept: v })} options={DEPTS} /></div>
                <div className="fld"><label>Office location *</label><SelOther value={pf.office} onChange={(v) => setPf({ ...pf, office: v })} options={OFFICES} /></div>
              </div>
              <div className="fld"><label>Bio</label><textarea maxLength={160} value={pf.bio} onChange={(e) => setPf({ ...pf, bio: e.target.value })} /><span className="hint" style={{ textAlign: "right" }}>{pf.bio.length}/160</span></div>
              <button className="btn" onClick={saveProfile}>Save profile</button>
            </>
          )}
          {stab === "privacy" && (
            <>
              <h3>Privacy</h3>
              {Sel("vis", "Profile visibility", "Who can see your profile", ["Everyone at Mastek", "My office only"])}
              {Sel("tagPerm", "Who can tag me in posts", "Control tagging", ["Everyone", "My office only", "No one"])}
              {Sw("showPlans", "Show my plans on profile", "Others can see plans you host or joined")}
              {Sw("showLoc", "Show my office location", "Display your city on posts and profile")}
              {Sw("showScores", "Show my VECTOR scores and badges", "Colleagues can see them on your profile")}
              {Sw("showRank", "Show my leaderboard position", "Hide your rank from the VECTOR leaderboard")}
              {Sw("online", "Show activity status", "Let colleagues see when you're active")}
            </>
          )}
          {stab === "notif" && (
            <>
              <h3>Notifications</h3>
              {Sw("n_req", "Plan join requests", "Requests, approvals and declines")}
              {Sw("n_com", "Comments and tags", "When someone comments on or tags you in a post")}
              {Sw("n_like", "Likes", "When someone likes your post")}
              {Sw("n_rem", "Calendar reminders", "Reminders 1 day and 1 hour before events in My Calendar")}
              {row(
                "Browser notifications",
                pushPermission === "denied"
                  ? "Blocked by your browser. Allow notifications for this site to enable alerts."
                  : pushPermission === "unsupported"
                    ? "This browser does not support notifications."
                    : "Calendar reminders and activity alerts while MaSphere is open.",
                <Switch on={!!S.n_push && pushPermission === "granted"} onChange={toggleBrowserNotifications} />
              )}
              {Sw("n_email", "Email notifications", "Sent to " + user.email)}
              {Sel("n_digest", "Activity digest", "Summary of what you missed", ["Daily", "Weekly", "Never"])}
            </>
          )}
          {stab === "look" && (
            <>
              <h3 style={{ marginBottom: 12 }}>Appearance</h3>
              <label className="lbl">THEME</label>
              <div className="th" style={{ margin: "8px 0 14px" }}>
                {[["system", "System"], ["light", "Light"], ["dark", "Dark"]].map(([k, l]) => <button key={k} className={theme === k ? "on" : ""} onClick={() => { setTheme(k); set("theme", k); }}>{l}</button>)}
              </div>
              {Sel("lang", "Language", "Interface language", ["English", "हिन्दी", "தமிழ்", "ગુજરાતી"])}
              {Sel("timefmt", "Time format", "How times appear", ["12-hour", "24-hour"])}
              {Sw("autoplay", "Autoplay videos", "Play videos in your feed automatically")}
            </>
          )}
          {stab === "interests" && (
            <>
              <h3 style={{ marginBottom: 12 }}>Your interests</h3>
              <p className="sub">We use these to suggest posts and plans. Pick from the list or add your own with Other.</p>
              <MultiPicker value={ints} onChange={setInts} options={CATS} />
              <div className="fld" style={{ marginTop: 18 }}>
                <label>WHAT BRINGS YOU HERE?</label>
                {GOALS.map((g) => (
                  <label key={g} className="chk" style={{ margin: "3px 0" }}>
                    <input type="checkbox" checked={goals.includes(g)} onChange={() => setGoals(goals.includes(g) ? goals.filter((x) => x !== g) : [...goals, g])} />{g}
                  </label>
                ))}
              </div>
              <button className="btn" disabled={!ints.length} onClick={async () => {
                try { await updateUser({ interests: ints, goals }); tt("Interests updated"); }
                catch (error) { tt(error.message); }
              }}>Save interests</button>
            </>
          )}
          {stab === "data" && (
            <>
              <h3>Data & security</h3>
              <div className="srow"><div><b>Download my data</b><span className="d">Get a copy of your profile information</span></div><button className="btn o" onClick={dl}><Ic n="download" s={16} />Download</button></div>
              <div className="srow"><div><b>Log out</b><span className="d">Sign out of MaSphere on this device</span></div><button className="btn o" onClick={doLogout}><Ic n="logout" s={16} />Log out</button></div>
              <div className="srow"><div><b style={{ color: "var(--er)" }}>Delete account</b><span className="d">Permanently remove your account from this browser</span></div><button className="btn r" onClick={del}>Delete</button></div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
