import { useNavigate } from "react-router-dom";
import { Av, AvatarStack, Ic } from "./common";
import { fmtD, money } from "../utils/helpers";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { useUI } from "../context/UIContext";
import { USE_MOCK } from "../services/http";

export default function PlanCard({ p }) {
  const { user } = useAuth();
  const { setPlan } = useData();
  const { setModal, tt } = useUI();
  const navigate = useNavigate();
  const userId = user.uid || user.email;
  const isHost = p.hostId ? p.hostId === userId : p.st === "host" || p.st === "hostreq";
  const memberCount = new Set(p.members || []).size;
  const maxPeople = Number(p.max) || 0;
  const isFull = maxPeople > 0 && memberCount >= maxPeople;
  const progress = maxPeople > 0 ? Math.min(100, (memberCount / maxPeople) * 100) : 0;

  const join = () =>
    setModal(
      <>
        <h3>Request to join?</h3>
        <p className="sub">{p.host} approves every request. The group chat opens only after approval.</p>
        <div className="row">
          <button className="btn" onClick={async () => {
            try {
              await setPlan(p.id, "pending");
              setModal(null);
              tt("Request sent to host");
            } catch (error) { tt(error.message); }
          }}>Send request</button>
          <button className="btn o" onClick={() => setModal(null)}>Cancel</button>
        </div>
      </>
    );

  return (
    <div className="card plan-card">
      {p.img
        ? <div className="pcv" style={{ backgroundImage: "url(" + p.img + ")" }} role="img" aria-label={p.t + " cover"} />
        : <div className="plan-cover-fallback" aria-hidden="true"><Ic n="calendar" s={24} /></div>}
      <div className="bd">
        <div className="row sp" style={{ marginBottom: 8 }}><span className="pill">{p.cat}</span><span className="hint">Plan</span></div>
        <h3>{p.t}</h3>
        {p.desc && <p style={{ margin: "4px 0 8px" }}>{p.desc.length > 90 ? p.desc.slice(0, 90) + "…" : p.desc}</p>}
        <div className="meta"><Ic n="calendar" s={15} />{fmtD(p.d, p.tm)}</div>
        <div className="meta"><Ic n="pin" s={15} />{p.loc}</div>
        <div className="meta"><Ic n="rupee" s={15} />{money(p.bud)}<span>·</span><Ic n="users" s={15} />{memberCount}/{maxPeople || "no limit"} joined · {p.mode}</div>
        <div className="row sp" style={{ margin: "10px 0 12px" }}>
          <div className="row" style={{ gap: 6 }}><Av n={p.host} s={24} src={isHost ? user.avatar : undefined} presence={isHost} /><span className="hint">{isHost ? "You're hosting" : "Hosted by " + p.host}</span></div>
          {p.members?.length > 0 && <AvatarStack names={[p.host]} extra={Math.max(0, memberCount - 1)} size={26} />}
        </div>
        {maxPeople > 0 && <div className="plan-progress" role="progressbar" aria-label="Plan capacity" aria-valuenow={memberCount} aria-valuemax={maxPeople}><i style={{ width: progress + "%" }} /></div>}
        {p.st === "none" && (isFull
          ? <button className="btn w" disabled>Plan is full</button>
          : <button className="btn w" onClick={join}>Request to join</button>)}
        {p.st === "pending" && (
          <div className="row">
            <span className="pill">Awaiting host</span>
            {USE_MOCK && <button className="btn o" disabled={isFull} onClick={async () => {
              try {
                await setPlan(p.id, "accepted");
                tt(p.host + " accepted your request");
              } catch (error) { tt(error.message); }
            }}>Demo: host accepts</button>}
          </div>
        )}
        {p.st === "host" && (
          <div className="row">
            <span className="pill gr">You're hosting</span>
            {USE_MOCK && <button className="btn o" onClick={async () => {
              try {
                await setPlan(p.id, "hostreq");
                tt("Aisha requested to join");
              } catch (error) { tt(error.message); }
            }}>Demo: simulate request</button>}
          </div>
        )}
        {p.st === "hostreq" && (
          <div className="col">
            {isFull && <span className="pill">Plan is full; decline remaining requests</span>}
            {(p.pendingRequests || []).map((request) => (
              <div className="row sp" key={request.id}>
                <span className="pill">{request.name} wants to join</span>
                <div className="row">
                  <button className="btn" disabled={isFull} onClick={async () => {
                    try {
                      await setPlan(p.id, "accepted", request.userId);
                      navigate("/plans/" + p.id);
                      tt("Accepted. Group chat opened");
                    } catch (error) { tt(error.message); }
                  }}>Accept</button>
                  <button className="btn r" onClick={async () => {
                    try { await setPlan(p.id, "declined", request.userId); }
                    catch (error) { tt(error.message); }
                  }}>Decline</button>
                </div>
              </div>
            ))}
            {USE_MOCK && !(p.pendingRequests || []).length && <div className="row">
              <span className="pill">Aisha wants to join</span>
              <button className="btn" disabled={isFull} onClick={async () => {
                try {
                  await setPlan(p.id, "accepted");
                  navigate("/plans/" + p.id);
                  tt("Accepted. Group chat opened");
                } catch (error) { tt(error.message); }
              }}>Accept</button>
              <button className="btn r" onClick={async () => {
                try { await setPlan(p.id, "host"); }
                catch (error) { tt(error.message); }
              }}>Decline</button>
            </div>}
          </div>
        )}
        {(p.st === "host" || p.st === "hostreq") && (
          <button className="btn w" onClick={() => navigate("/plans/" + p.id)}>Open group chat</button>
        )}
        {(p.st === "accepted" || p.st === "done") && <button className="btn w" onClick={() => navigate("/plans/" + p.id)}>Open group chat</button>}
      </div>
    </div>
  );
}
