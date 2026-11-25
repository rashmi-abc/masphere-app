import { useState } from "react";
import { Av, Ic } from "./common";
import Media from "./Media";
import { VTag } from "./Vector";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { useUI } from "../context/UIContext";

export default function Post({ p }) {
  const { user } = useAuth();
  const { deletePost, addComment, toggleLike, toggleSave } = useData();
  const { tt, setModal } = useUI();
  const [lk, setLk] = useState(null);
  const [sv, setSv] = useState(null);
  const [c, setC] = useState("");
  const [sh, setSh] = useState(false);
  const liked = lk === null ? !!p.liked : lk;
  const saved = sv === null ? (user.savedPosts || []).includes(String(p.id)) : sv;

  const add = async () => {
    if (!c.trim()) return;
    try {
      await addComment(p.id, c);
      setC("");
      setSh(true);
    } catch (error) { tt(error.message); }
  };
  const like = async (value) => {
    const previous = liked;
    if (value === previous) return;
    setLk(value);
    try { await toggleLike(p.id); }
    catch (error) { setLk(previous); tt(error.message); }
  };
  const save = async () => {
    const previous = saved;
    setSv(!previous);
    try {
      await toggleSave(p.id);
      tt(previous ? "Removed from saved" : "Saved");
    } catch (error) {
      setSv(previous);
      tt(error.message);
    }
  };
  const del = () =>
    setModal(
      <>
        <h3>Delete this post?</h3>
        <p className="sub">This can't be undone.</p>
        <div className="row">
          <button className="btn r" onClick={async () => {
            try { await deletePost(p.id); setModal(null); tt("Post deleted"); }
            catch (error) { tt(error.message); }
          }}>Delete</button>
          <button className="btn o" onClick={() => setModal(null)}>Cancel</button>
        </div>
      </>
    );
  const hasM = p.media && p.media.length > 0;
  const likes = Math.max(0, p.likes + (lk === null || lk === !!p.liked ? 0 : (lk ? 1 : -1)));
  const isOwner = p.authorId ? p.authorId === user.uid : p.by === user.name;

  return (
    <div className="card">
      <div className="row sp bd" style={{ paddingBottom: hasM || p.x ? 10 : 16 }}>
        <div className="row" style={{ flexWrap: "nowrap" }}>
          <Av n={p.by} s={40} src={isOwner ? user.avatar : undefined} />
          <div>
            <b style={{ fontSize: 14 }}>{p.by}</b>
            <div className="hint">{p.o}{p.loc ? " · " + p.loc : ""} · {p.ts}</div>
          </div>
        </div>
        <div className="row" style={{ gap: 4 }}>
          {p.k && <span className="pill">{p.k}</span>}
          {isOwner && <button className="ib" style={{ width: 30, height: 30 }} onClick={del}><Ic n="trash" s={16} /></button>}
        </div>
      </div>
      {p.x && <div style={{ padding: hasM ? "0 16px 12px" : "0 16px 4px" }}><p className="ptxt">{p.x}</p></div>}
      {hasM && <div onDoubleClick={() => like(true)}><Media m={p.media} /></div>}
      <div className="bd" style={{ paddingTop: hasM || p.x ? 10 : 0 }}>
        {p.tags && p.tags.length > 0 && (
          <div style={{ fontSize: 13, marginBottom: 6 }}>
            with {p.tags.map((t, i) => <span key={t}><span className="tg">@{t}</span>{i < p.tags.length - 1 ? ", " : ""}</span>)}
          </div>
        )}
        {p.vals && p.vals.length > 0 && <div className="row" style={{ marginBottom: 8 }}>{p.vals.map((k) => <VTag key={k} k={k} />)}</div>}
        <div className="row sp">
          <div className="row" style={{ gap: 2 }}>
            <button className="ib" style={{ color: liked ? "#D92D20" : "" }} onClick={() => like(!liked)}><Ic n="heart" f={liked} /></button>
            {!p.noc && <button className="ib" onClick={() => setSh(!sh)}><Ic n="comment" /></button>}
            <b style={{ fontSize: 13, marginLeft: 4 }}>{likes} {likes === 1 ? "like" : "likes"}</b>
          </div>
          <button className="ib" style={{ color: saved ? "var(--p)" : "" }} onClick={save}>
            <Ic n="bookmark" f={saved} />
          </button>
        </div>
        {(sh || p.cm.length > 0) && (
          <div style={{ marginTop: 6 }}>
            {(sh ? p.cm : p.cm.slice(-2)).map((m, i) => <p key={i} className="cm" style={{ color: "var(--t)" }}><b>{m[0].split(" ")[0]}</b> {m[1]}</p>)}
            {!sh && p.cm.length > 1 && <span className="hint" onClick={() => setSh(true)} style={{ cursor: "pointer" }}>View all {p.cm.length} comments</span>}
          </div>
        )}
        {p.noc ? (
          <p className="hint">Comments are turned off.</p>
        ) : (
          <div className="row" style={{ marginTop: 8, flexWrap: "nowrap" }}>
            <input value={c} onChange={(e) => setC(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder="Add a comment…"
              style={{ flex: 1, border: 0, borderBottom: "1px solid var(--l)", background: "none", padding: 6 }} />
            <button className="chip" onClick={add}>Post</button>
          </div>
        )}
      </div>
    </div>
  );
}
