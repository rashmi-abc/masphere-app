import { useState } from "react";
import { useParams } from "react-router-dom";
import { Ic } from "../components/common";
import PlanCard from "../components/PlanCard";
import CreatePlan from "../components/CreatePlan";
import Room from "./Room";
import { useData } from "../context/DataContext";
import { useUI } from "../context/UIContext";

export default function Plans() {
  const { plans } = useData();
  const { setModal } = useUI();
  const { id } = useParams(); // /plans/:id opens that plan's group chat
  const [tab, setTab] = useState("all");

  if (id) {
    const p = plans.find((q) => String(q.id) === id);
    if (p) return <Room p={p} />;
  }
  const L = tab === "all" ? plans : plans.filter((p) => p.st !== "none");
  return (
    <>
      <div className="row sp">
        <div><h1>Plans</h1><p className="sub">Create a plan or request to join. Hosts approve everyone.</p></div>
        <button className="btn" onClick={() => setModal(<CreatePlan />, "wide")}><Ic n="plus" s={16} />Create plan</button>
      </div>
      <div className="tabs">
        <button className={"tab " + (tab === "all" ? "on" : "")} onClick={() => setTab("all")}>Explore ({plans.length})</button>
        <button className={"tab " + (tab === "mine" ? "on" : "")} onClick={() => setTab("mine")}>My plans ({plans.filter((p) => p.st !== "none").length})</button>
      </div>
      <div className="grid">{L.map((p) => <PlanCard key={p.id} p={p} />)}</div>
      {!L.length && <div className="card empty"><Ic n="calendar" s={30} /><b>No plans yet</b><span>Create one or request to join from Explore.</span></div>}
    </>
  );
}
