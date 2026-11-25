import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Ic } from "../components/common";
import { fmtD } from "../utils/helpers";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { useUI } from "../context/UIContext";

export default function Room({ p }) {
  const { user } = useAuth();
  const { getChat, loadChat, sendMessage, votePlan, pinPlan, ratePlan, completePlan } = useData();
  const { tt } = useUI();
  const navigate = useNavigate();
  const [msg, setMsg] = useState("");
  const ch = getChat(p);
  const [busy, setBusy] = useState(false);
  const isMember = p.st === "host" || p.st === "hostreq" || p.st === "accepted" || p.st === "done";
  const isHost = p.hostId ? p.hostId === (user.uid || user.email) : p.st === "host" || p.st === "hostreq" || (p.st === "done" && p.host === user.name);

  useEffect(() => {
    if (!isMember) return undefined;
    return loadChat(p);
  }, [p.id, user.uid, user.email, isMember]); // eslint-disable-line react-hooks/exhaustive-deps

  const send = async () => {
    if (!msg.trim()) return;
    try {
      await sendMessage(p, msg);
      setMsg("");
    } catch (error) { tt(error.message); }
  };
  const submit = async () => {
    setBusy(true);
    try {
      await completePlan(p);
      tt("Badge earned: Explorer (+150 points)");
    } catch (error) {
      tt(error.message);
      setBusy(false);
    }
  };

  if (!isMember) {
    return (
      <div>
        <button className="chip" onClick={() => navigate("/plans")}><Ic n="chevL" s={14} />Plans</button>
        <div className="card empty"><Ic n="lock" s={28} /><b>Group access is restricted</b><span>Only the host and approved members can open this room.</span></div>
      </div>
    );
  }

  return (
    <div>
      <button className="chip" onClick={() => navigate("/plans")}><Ic n="chevL" s={14} />Plans</button>
      <h1 style={{ marginTop: 14 }}>{p.t}</h1>
      <p className="sub"><Ic n="lock" s={13} /> Private group chat · only approved members, no direct messages</p>
      <div className="ban"><Ic n="clock" s={16} />Reminder: {fmtD(p.d, p.tm)} · {p.loc}. Carry your ID.</div>
      <div className="pf" style={{ gridTemplateColumns: "1fr 340px" }}>
        <div>
          <div className="chat">{ch.msgs.map((m, i) => <div key={i} className={"msg " + (m.me ? "me" : "")}>{!m.me && <b>{m.w}: </b>}{m.x}</div>)}</div>
          <div className="row" style={{ marginTop: 10, flexWrap: "nowrap" }}>
            <input className="in" maxLength={2000} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Message the group" onKeyDown={(e) => e.key === "Enter" && send()} />
            <button className="btn" onClick={send}>Send</button>
          </div>
        </div>
        <div className="col" style={{ gap: 14 }}>
          <div className="card bd">
            <h3>Time poll</h3>
            {Object.entries(ch.votes).map(([k, v]) => (
              <div key={k} className="row" style={{ margin: "8px 0", flexWrap: "nowrap" }}>
                <button className={"chip " + (ch.voted === k ? "on" : "")} style={{ minWidth: 90 }} onClick={async () => {
                  if (ch.voted === k) return;
                  try { await votePlan(p, k); tt("Vote counted"); }
                  catch (error) { tt(error.message); }
                }}>{k}</button>
                <div style={{ flex: 1 }} className="bar"><i style={{ width: v * 14 + "%" }} /></div>
                <b>{v}</b>
              </div>
            ))}
          </div>
          <div className="card bd row sp">
            <span style={{ fontSize: 13 }}>{ch.pin ? "Pinned: " + p.loc + " meeting point" : "No location pin yet"}</span>
            <button className="btn g" onClick={async () => {
              try {
                await pinPlan(p, !ch.pin);
                tt(ch.pin ? "Location pin removed" : "Location pinned");
              } catch (error) { tt(error.message); }
            }}>{ch.pin ? "Remove pin" : "Drop pin"}</button>
          </div>
          <div className="card bd">
            <h3>After the event</h3>
            {isHost && !ch.done ? (
              <>
                <div className="row" style={{ margin: "10px 0" }}>
                  {[1, 2, 3, 4, 5].map((s) => <button key={s} className={"chip " + (ch.rated >= s ? "on" : "")} style={{ padding: "6px 10px" }} onClick={async () => {
                    try { await ratePlan(p, s); }
                    catch (error) { tt(error.message); }
                  }}>{s} ★</button>)}
                </div>
                <div className="row">
                  <button className="chip" onClick={() => tt("Photo added to your profile")}><Ic n="image" s={14} />Add photo</button>
                  <button className="btn" disabled={!ch.rated || busy} onClick={submit}>{busy ? "Submitting…" : "Submit rating"}</button>
                </div>
              </>
            ) : isHost ? (
              <div><b>Explorer badge earned</b><p className="sub">+150 Explorer Points. See Profile.</p></div>
            ) : (
              <p className="sub">The host manages the event rating and completion.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
