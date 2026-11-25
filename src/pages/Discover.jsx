import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Av, Ic, Skeleton } from "../components/common";
import { Chips } from "../components/Bits";
import Composer from "../components/Composer";
import Post from "../components/Post";
import PlanCard from "../components/PlanCard";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { useModules } from "../context/ModulesContext";
import { fmtD } from "../utils/helpers";
import { dShort } from "../components/Bits";

export default function Discover() {
  const { user } = useAuth();
  const { posts, plans, q, loading } = useData();
  const { events, opps } = useModules();
  const navigate = useNavigate();
  const [f, setF] = useState("For You");
  const s = q.toLowerCase();
  let P = posts.filter((p) => !q || (p.x + p.by + p.k + (p.loc || "")).toLowerCase().includes(s));
  let L = plans.filter((p) => !q || (p.t + p.loc + p.cat + p.host).toLowerCase().includes(s));
  if (f === "My Office") { P = P.filter((p) => p.o === user.office); L = L.filter((p) => p.city === user.office); }
  if (f === "For You") P = [...P].sort((a, b) => Number(user.interests.includes(b.k)) - Number(user.interests.includes(a.k)));

  const mix = [];
  let pi = 0;
  P.forEach((p, i) => {
    mix.push(<Post key={"p" + p.id} p={p} />);
    if (i % 2 === 1 && pi < L.length) { mix.push(<PlanCard key={"l" + L[pi].id} p={L[pi]} />); pi++; }
  });
  while (pi < L.length) { mix.push(<PlanCard key={"l" + L[pi].id} p={L[pi]} />); pi++; }

  const upEv = events.filter((e) => e.st === "Published").sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3);
  const looking = opps.filter((o) => o.size && o.team.length < o.size).slice(0, 2);
  // TODO: Replace mock presence/activity with a realtime presence feed when backend support exists.
  const activeNow = [
    { name: "Priya Nair", detail: "Sharing a plan" },
    { name: "Aisha Kapoor", detail: "In Sheroes" },
    { name: "Rohan Mehta", detail: "Viewing Opportunities" },
  ];

  return (
    <div className="disc">
      <div className="feed">
        {!q && (
          <>
            <div><h1>Hello, {user.name.split(" ")[0]}</h1><p className="sub" style={{ margin: 0 }}>Here's what's happening across Mastek.</p></div>
            <Composer />
            <Chips items={["For You", "My Office", "All Mastek"]} value={f} onChange={setF} />
          </>
        )}
        {q && <h1>Results for “{q}”</h1>}
        {loading ? (
          <div className="feed-loading" aria-label="Loading updates">
            {[0,1,2].map((item) => (
              <div className="card bd" key={item}>
                <div className="row" style={{ gap: 10 }}>
                  <Skeleton height={40} className="circle-skeleton" />
                  <div style={{ flex: 1 }}><Skeleton height={12} /><Skeleton height={10} className="mt-8" /></div>
                </div>
                <Skeleton height={90} className="mt-16" />
              </div>
            ))}
          </div>
        ) : mix}
        {!mix.length && <div className="card empty"><Ic n="search" s={30} /><b>{q ? "No matches" : "No updates yet"}</b><span>{q ? "Try a different search term." : "Be the first to share something with your community."}</span></div>}
      </div>
      <div className="rail">
        <div className="card bd">
          <h3 style={{ marginBottom: 8 }}>Upcoming events</h3>
          {upEv.map((e) => (
            <div key={e.id} className="row" style={{ flexWrap: "nowrap", padding: "7px 0" }}>
              <div className="dbadge sm"><b>{dShort(e.date).day}</b><span>{dShort(e.date).mon}</span></div>
              <div style={{ minWidth: 0 }}><b style={{ fontSize: 13, display: "block", fontWeight: 600 }}>{e.title}</b><span className="hint">{e.offices.join(", ")}</span></div>
            </div>
          ))}
          <button className="btn g w" style={{ marginTop: 8 }} onClick={() => navigate("/calendar")}>Open Mastek Calendar</button>
        </div>
        <div className="card bd">
          <h3 style={{ marginBottom: 8 }}>Teammates wanted</h3>
          {looking.map((o) => <div key={o.id} style={{ padding: "6px 0" }}><b style={{ fontSize: 13 }}>{o.title}</b><div className="hint">{o.team.length}/{o.size} members</div></div>)}
          <button className="btn g w" style={{ marginTop: 8 }} onClick={() => navigate("/opportunities")}>See opportunities</button>
        </div>
        <div className="card bd">
          <h3 style={{ marginBottom: 10 }}>Your activity</h3>
          <div className="row" style={{ gap: 24, marginBottom: 12 }}>
            <div><b style={{ fontSize: 20 }}>{posts.filter((p) => p.by === user.name).length}</b><div className="hint">Posts</div></div>
            <div><b style={{ fontSize: 20 }}>{plans.filter((p) => p.st !== "none").length}</b><div className="hint">Plans</div></div>
            <div><b style={{ fontSize: 20 }}>{Object.values(user.vector || {}).reduce((a, b) => a + b, 0)}</b><div className="hint">VECTOR pts</div></div>
          </div>
          <button className="btn g w" onClick={() => navigate("/rewards")}>View VECTOR Rewards</button>
        </div>
        <div className="card bd activity-rail">
          <div className="row sp" style={{ marginBottom: 8 }}>
            <h3>Active now</h3>
            <button className="rail-link" type="button" onClick={() => navigate("/profile")}>See all</button>
          </div>
          {activeNow.map((person) => (
            <div className="activity-person" key={person.name}>
              <Av n={person.name} s={32} presence />
              <div><b>{person.name}</b><span>{person.detail}</span></div>
            </div>
          ))}
          <div className="presence-summary"><span className="live-dot" />12 colleagues online</div>
        </div>
      </div>
    </div>
  );
}
