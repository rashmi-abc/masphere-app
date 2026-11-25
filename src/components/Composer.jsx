import { Av, Ic } from "./common";
import PostCreator from "./PostCreator";
import CreatePlan from "./CreatePlan";
import { useAuth } from "../context/AuthContext";
import { useUI } from "../context/UIContext";

export default function Composer() {
  const { user } = useAuth();
  const { setModal } = useUI();
  return (
    <div className="card bd composer-card">
      <div className="row" style={{ flexWrap: "nowrap" }}>
        <Av n={user.name} s={40} src={user.avatar} />
        <button className="cin" onClick={() => setModal(<PostCreator />, "mid")}>Share an update with your colleagues…</button>
      </div>
      <div className="composer-actions">
        <button className="composer-action" onClick={() => setModal(<PostCreator />, "mid")}><Ic n="image" s={18} />Photo</button>
        <button className="composer-action" onClick={() => setModal(<CreatePlan />, "wide")}><Ic n="calendar" s={18} />Plan</button>
      </div>
    </div>
  );
}
