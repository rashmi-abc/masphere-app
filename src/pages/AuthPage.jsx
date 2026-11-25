import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Fld, Ic } from "../components/common";
import { MultiPicker, SelOther } from "../components/Pickers";
import { CATS, DEPTS, GOALS, OFFICES } from "../data/constants";
import { DEMO_USER, DEMO_ADMIN } from "../data/seed"; // demo login shortcut: remove with the mock
import { useAuth } from "../context/AuthContext";
import { USE_MOCK } from "../services/http";
import logo from "../assets/logo.png";

export default function AuthPage() {
  const { user, authError, login, signup } = useAuth();
  const [mode, setMode] = useState("login");
  if (user) return <Navigate to="/discover" replace />;
  return (
    <div className="auth">
      <div className="auth-l">
        <div className="brand big"><img src={logo} alt="MaSphere" /></div>
        <h1>Your People.<br />Your Interests.<br />Your Next Plan.</h1>
        <ul style={{ padding: 0, margin: 0 }}>
          <li><i><Ic n="comment" s={18} /></i>Share updates and moments with colleagues</li>
          <li><i><Ic n="calendar" s={18} /></i>Create plans and meet people who share your interests</li>
          <li><i><Ic n="lock" s={18} /></i>Employee-only, private by design</li>
        </ul>
      </div>
      <div className="auth-r">
        <div className="auth-c">
          <img className="auth-mlogo" src={logo} alt="MaSphere" />
          {authError && <div className="em" role="alert" style={{ marginBottom: 12 }}>{authError}</div>}
          {mode === "login" ? <LoginForm onLogin={login} swap={() => setMode("signup")} /> : <Signup onSignup={signup} swap={() => setMode("login")} />}
        </div>
      </div>
    </div>
  );
}

function LoginForm({ onLogin, swap }) {
  const [e, setE] = useState("");
  const [p, setP] = useState("");
  const [sh, setSh] = useState(false);
  const [err, setErr] = useState("");
  const [ld, setLd] = useState(false);

  const go = async (a, b) => {
    if (!a || !b) return setErr("Enter your work email and password.");
    setLd(true); setErr("");
    const r = await onLogin(a, b);
    if (r) { setErr(r); setLd(false); }
  };

  return (
    <div className="card" style={{ padding: 30 }}>
      <h1>Welcome back</h1>
      <p className="sub">Log in with your Mastek work email.</p>
      <form onSubmit={(ev) => { ev.preventDefault(); go(e, p); }}>
        <div className="fld"><label>Work email</label><input type="email" value={e} placeholder="name@mastek.com" onChange={(x) => setE(x.target.value)} /></div>
        <div className="fld">
          <label>Password</label>
          <div style={{ position: "relative" }}>
            <input type={sh ? "text" : "password"} value={p} placeholder="Your password" onChange={(x) => setP(x.target.value)} />
            <button type="button" className="chip" style={{ position: "absolute", right: 5, top: 5, padding: "4px 10px" }} onClick={() => setSh(!sh)}>{sh ? "Hide" : "Show"}</button>
          </div>
        </div>
        {err && <div className="em" style={{ marginBottom: 12 }}>{err}</div>}
        <button className="btn w" disabled={ld}>{ld ? "Verifying…" : "Log in"}</button>
      </form>
      {USE_MOCK && <>
        <div className="row" style={{ margin: "14px 0", justifyContent: "center" }}><span className="hint">or</span></div>
        <button className="btn o w" disabled={ld} onClick={() => { setE(DEMO_USER.email); setP(DEMO_USER.pw); go(DEMO_USER.email, DEMO_USER.pw); }}>Continue as demo employee</button>
        <button className="btn o w" style={{ marginTop: 8 }} disabled={ld} onClick={() => { setE(DEMO_ADMIN.email); setP(DEMO_ADMIN.pw); go(DEMO_ADMIN.email, DEMO_ADMIN.pw); }}>Continue as demo admin (events)</button>
      </>}
      <p className="sub" style={{ textAlign: "center", margin: "18px 0 0" }}>New to MaSphere? <a href="#" style={{ color: "var(--p)", fontWeight: 600 }} onClick={(ev) => { ev.preventDefault(); swap(); }}>Create an account</a></p>
      <p className="hint" style={{ textAlign: "center", margin: "10px 0 0" }}>{USE_MOCK ? "Prototype: accounts are stored only in this browser." : "Use your Mastek work email and Firebase account."}</p>
    </div>
  );
}

function Signup({ onSignup, swap }) {
  const [s, setS] = useState(0);
  const [err, setErr] = useState({});
  const [d, setD] = useState({ name: "", email: "", pw: "", pw2: "", empId: "", gender: "", role: "", dept: "", office: "", phone: "", joined: "", interests: [], goals: [], bio: "", terms: false });
  const u = (k, v) => setD((o) => ({ ...o, [k]: v }));

  const check = () => {
    const e = {};
    if (s === 0) {
      if (d.name.trim().length < 2) e.name = "Enter your full name";
      if (!/^[^@\s]+@mastek\.com$/i.test(d.email.trim())) e.email = "Use your @mastek.com work email";
      if (d.pw.length < 8) e.pw = "At least 8 characters";
      if (d.pw2 !== d.pw) e.pw2 = "Passwords don't match";
    }
    if (s === 1) {
      if (!/^[A-Za-z0-9-]{4,12}$/.test(d.empId.trim())) e.empId = "Enter a valid employee ID (4–12 letters/numbers)";
      if (!d.gender) e.gender = "Select your gender";
      if (!d.role.trim()) e.role = "Enter your designation";
      if (!d.dept.trim()) e.dept = "Select or type your department";
      if (!d.office.trim()) e.office = "Select or type your office location";
    }
    if (s === 2) {
      if (d.interests.length < 1) e.interests = "Pick at least one interest";
      if (!d.terms) e.terms = "Please accept the community guidelines";
    }
    setErr(e);
    return !Object.keys(e).length;
  };
  const next = async () => {
    if (!check()) return;
    if (s < 2) return setS(s + 1);
    const r = await onSignup({ ...d, name: d.name.trim(), empId: d.empId.trim().toUpperCase() });
    if (r) setErr({ form: r });
  };

  return (
    <div className="card" style={{ padding: 30 }}>
      <h1>Join MaSphere</h1>
      <p className="sub">Step {s + 1} of 3 · {["Create your account", "Tell us about your work", "Your interests"][s]}</p>
      <div className="prog">{[0, 1, 2].map((i) => <i key={i} className={i <= s ? "on" : ""} />)}</div>
      {s === 0 && (
        <>
          <Fld l="Full name" e={err.name}><input value={d.name} onChange={(e) => u("name", e.target.value)} placeholder="Ananya Rao" /></Fld>
          <Fld l="Work email" e={err.email}><input type="email" value={d.email} onChange={(e) => u("email", e.target.value)} placeholder="name@mastek.com" /></Fld>
          <div className="two">
            <Fld l="Password" e={err.pw}><input type="password" value={d.pw} onChange={(e) => u("pw", e.target.value)} /></Fld>
            <Fld l="Confirm password" e={err.pw2}><input type="password" value={d.pw2} onChange={(e) => u("pw2", e.target.value)} /></Fld>
          </div>
        </>
      )}
      {s === 1 && (
        <>
          <div className="two">
            <Fld l="Employee ID" e={err.empId}><input value={d.empId} onChange={(e) => u("empId", e.target.value)} placeholder="MT10482" /></Fld>
            <Fld l="Gender" e={err.gender}>
              <select value={d.gender} onChange={(e) => u("gender", e.target.value)}>
                <option value="">Select gender</option>
                <option value="Woman">Woman</option>
                <option value="Man">Man</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </Fld>
            <Fld l="Designation" e={err.role}><input value={d.role} onChange={(e) => u("role", e.target.value)} placeholder="Software Engineer" /></Fld>
          </div>
          <Fld l="Department" e={err.dept}><SelOther value={d.dept} onChange={(v) => u("dept", v)} options={DEPTS} ph="Type your department" /></Fld>
          <Fld l="Office location" e={err.office}><SelOther value={d.office} onChange={(v) => u("office", v)} options={OFFICES} ph="Type your office city" /></Fld>
          <div className="two">
            <Fld l="Joined Mastek (year, optional)"><input type="number" min="1990" max="2026" value={d.joined} onChange={(e) => u("joined", e.target.value)} placeholder="2022" /></Fld>
            <Fld l="Phone (optional)"><input value={d.phone} onChange={(e) => u("phone", e.target.value)} placeholder="+91" /></Fld>
          </div>
        </>
      )}
      {s === 2 && (
        <>
          <Fld l="What are you into?" e={err.interests}><MultiPicker value={d.interests} onChange={(v) => u("interests", v)} options={CATS} /></Fld>
          <div className="fld">
            <label>What brings you here?</label>
            <div className="col" style={{ gap: 2 }}>
              {GOALS.map((g) => (
                <label key={g} className="chk" style={{ margin: "3px 0" }}>
                  <input type="checkbox" checked={d.goals.includes(g)} onChange={() => u("goals", d.goals.includes(g) ? d.goals.filter((x) => x !== g) : [...d.goals, g])} />{g}
                </label>
              ))}
            </div>
          </div>
          <div className="fld"><label>Short bio (optional)</label><textarea maxLength={160} value={d.bio} onChange={(e) => u("bio", e.target.value)} placeholder="Weekend trekker, filter coffee lover…" /></div>
          <label className="chk"><input type="checkbox" checked={d.terms} onChange={(e) => u("terms", e.target.checked)} />I'll be respectful and follow the Mastek community guidelines.</label>
          {err.terms && <div className="em">{err.terms}</div>}
        </>
      )}
      {err.form && <div className="em" style={{ margin: "8px 0" }}>{err.form}</div>}
      <div className="row sp" style={{ marginTop: 16 }}>
        {s > 0 ? <button className="btn o" onClick={() => setS(s - 1)}>Back</button> : <span />}
        <button className="btn" onClick={next}>{s < 2 ? "Continue" : "Create account"}</button>
      </div>
      <p className="sub" style={{ textAlign: "center", margin: "18px 0 0" }}>Already have an account? <a href="#" style={{ color: "var(--p)", fontWeight: 600 }} onClick={(e) => { e.preventDefault(); swap(); }}>Log in</a></p>
    </div>
  );
}
