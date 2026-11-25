import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Av, Ic } from "../components/common";
import Post from "../components/Post";
import PlanCard from "../components/PlanCard";
import { VALUES } from "../components/Vector";
import { vectorOf } from "./Rewards";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { useModules } from "../context/ModulesContext";
import { useUI } from "../context/UIContext";
import { fileToAvatar } from "../utils/helpers";
import { dShort } from "../components/Bits";
import { deleteAvatar, uploadAvatar } from "../services/profileMediaService";
import { USE_MOCK } from "../services/http";

const EVENT_CLASSES = { HR: "c1", MPL: "c2", Sheroes: "c3", Technical: "c4", Learning: "c5", Community: "c6" };
const pad = (value) => String(value).padStart(2, "0");

export default function Profile() {
  const { user, updateUser } = useAuth();
  const { tt } = useUI();
  const fileRef = useRef(null);
  const { plans, posts } = useData();
  const {
    savedEvents, calendarEvents, unsaveEvent, addEventToCalendar, removeEventFromCalendar,
  } = useModules();
  const navigate = useNavigate();
  const [tab, setTab] = useState("posts");
  const userId = user.uid || user.email;
  const mine = posts.filter((p) => p.authorId ? p.authorId === user.uid : p.by === user.name);
  const savedPosts = posts.filter((p) => (user.savedPosts || []).includes(String(p.id)));
  const mp = plans.filter((p) => p.hostId
    ? p.hostId === userId || p.members?.includes(userId)
    : p.st !== "none");
  const removeBookmark = async (id) => {
    try { await unsaveEvent(id); tt("Removed from bookmarks"); }
    catch (error) { tt(error.message); }
  };
  const toggleCalendarEvent = async (event) => {
    const alreadyAdded = calendarEvents.some((item) => String(item.id) === String(event.id));
    try {
      if (alreadyAdded) {
        await removeEventFromCalendar(event.id);
        tt("Removed from your calendar");
      } else {
        await addEventToCalendar(event);
        tt("Added to your calendar");
      }
    } catch (error) { tt(error.message); }
  };
  const removeCalendarEvent = async (id) => {
    try { await removeEventFromCalendar(id); tt("Removed from your calendar"); }
    catch (error) { tt(error.message); }
  };

  const pick = async (e) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!f) return;
    if (!f.type.startsWith("image/")) return tt("Please choose an image file");
    let avatar = "";
    let profileSaved = false;
    try {
      avatar = USE_MOCK ? await fileToAvatar(f) : await uploadAvatar(user.uid, f);
      await updateUser({ avatar });
      profileSaved = true;
      if (user.avatar && !USE_MOCK) await deleteAvatar(user.avatar);
      tt("Profile picture updated");
    } catch (error) {
      if (avatar && !profileSaved && !USE_MOCK) {
        try { await deleteAvatar(avatar); }
        catch (cleanupError) { tt(`${error.message} The uploaded photo could not be cleaned up: ${cleanupError.message}`); return; }
      }
      tt(error.message);
    }
  };
  const removeAvatar = async () => {
    try {
      await updateUser({ avatar: "" });
      await deleteAvatar(user.avatar);
      tt("Profile picture removed");
    } catch (error) { tt(error.message); }
  };

  return (
    <div style={{ maxWidth: 920, margin: "0 auto" }}>
      <div className="card">
        <div className="cb" />
        <div className="bd" style={{ paddingTop: 0 }}>
          <div className="row sp" style={{ alignItems: "flex-end", marginTop: -38 }}>
            <div className="row" style={{ alignItems: "flex-end", gap: 12 }}>
              <div className="profile-hero-avatar"><Av n={user.name} s={80} src={user.avatar} /></div>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={pick} />
              <button className="btn o" onClick={() => fileRef.current.click()}><Ic n="image" s={16} />{user.avatar ? "Change photo" : "Upload photo"}</button>
              {user.avatar && <button className="btn g" onClick={removeAvatar}>Remove</button>}
            </div>
            <button className="btn g" onClick={() => navigate("/settings/profile")}>Edit profile</button>
          </div>
          <h1 style={{ marginTop: 10 }}>{user.name}</h1>
          <p className="sub" style={{ margin: "0 0 8px" }}>{user.role} · {user.dept} · {user.office}{user.gender ? ` · ${user.gender}` : ""}</p>
          {user.bio && <p style={{ color: "var(--t)", fontSize: 14 }}>{user.bio}</p>}
          <div className="row" style={{ margin: "6px 0 10px" }}>{user.interests.map((i) => <span key={i} className="pill">{i}</span>)}</div>
          <span className="pill gr">{user.settings.vis === "Everyone at Mastek" ? "Visible to Mastek employees only" : "Visible to my office only"}</span>
          <div className="row" style={{ gap: 28, marginTop: 16 }}>
            <div><b style={{ fontSize: 20 }}>{mine.length}</b><div className="hint">Posts</div></div>
            <div><b style={{ fontSize: 20 }}>{mp.length}</b><div className="hint">Plans</div></div>
            <div><b style={{ fontSize: 20 }}>{user.pts}</b><div className="hint">Explorer points</div></div>
          </div>
        </div>
      </div>
      <div className="card bd" style={{ marginTop: 16 }}>
        <div className="row sp"><h3>VECTOR scores</h3><button className="btn g" onClick={() => navigate("/rewards")}>View history</button></div>
        <div className="grid" style={{ marginTop: 10, gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))" }}>
          {VALUES.map((v) => <div key={v.k} className="vs"><span className="vt" style={{ color: v.color }}><b style={{ background: v.color }}>{v.k}</b><span>{v.name}</span></span><strong>{vectorOf(user)[v.k]}</strong></div>)}
        </div>
      </div>
      <div className="grid" style={{ marginTop: 16 }}>
        <div className="card bd">
          <h3 className="row" style={{ gap: 8 }}><Ic n="star" s={16} />Badges</h3>
          <div className="row" style={{ marginTop: 10 }}>{user.badges.map((b) => <span className="pill" key={b}>{b}</span>)}</div>
        </div>
        <div className="card bd">
          <h3 className="row" style={{ gap: 8 }}><Ic n="globe" s={16} />Digital Passport</h3>
          <p>{user.stamps && user.stamps.length ? user.stamps.join(" · ") : "No stamps yet. Complete a plan to earn one."}</p>
        </div>
      </div>
      <div className="tabs">
        <button className={"tab " + (tab === "posts" ? "on" : "")} onClick={() => setTab("posts")}>Posts</button>
        <button className={"tab " + (tab === "plans" ? "on" : "")} onClick={() => setTab("plans")}>Plans</button>
        <button className={"tab " + (tab === "bookmarks" ? "on" : "")} onClick={() => setTab("bookmarks")}>Bookmarks</button>
        <button className={"tab " + (tab === "calendar" ? "on" : "")} onClick={() => setTab("calendar")}>My calendar</button>
      </div>
      {tab === "posts" && (mine.length ? <div className="feed" style={{ maxWidth: 640 }}>{mine.map((p) => <Post key={p.id} p={p} />)}</div> : <p className="sub">Nothing yet. Share your first post from Discover.</p>)}
      {tab === "plans" && (mp.length ? <div className="grid">{mp.map((p) => <PlanCard key={p.id} p={p} />)}</div> : <p className="sub">You haven't created or joined any plans yet.</p>)}
      {tab === "bookmarks" && (!savedEvents.length && !savedPosts.length
        ? <p className="sub">Saved events and posts will appear here.</p>
        : <div className="col">
          {savedEvents.length > 0 && <>
            <h2>Saved events</h2>
            <div className="grid">
              {savedEvents.map((event) => {
                const inCalendar = calendarEvents.some((item) => String(item.id) === String(event.id));
                return (
                  <div className="card bd" key={event.id}>
                    <div className="row sp"><span className="pill">{event.cat}</span><span className="hint">Event</span></div>
                    <h3 style={{ marginTop: 8 }}>{event.title}</h3>
                    <div className="meta"><Ic n="calendar" s={15} />{dShort(event.date).full}, {event.time}</div>
                    <div className="meta"><Ic n="pin" s={15} />{(event.offices || []).join(", ")} · {event.venue}</div>
                    <div className="row" style={{ marginTop: 8 }}>
                      <button className="btn g" onClick={() => toggleCalendarEvent(event)}>{inCalendar ? "Remove from calendar" : "Add to calendar"}</button>
                      <button className="btn o" onClick={() => removeBookmark(event.id)}>Remove bookmark</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>}
          {savedPosts.length > 0 && <>
            <h2>Saved posts</h2>
            <div className="feed" style={{ maxWidth: 640 }}>{savedPosts.map((post) => <Post key={post.id} p={post} />)}</div>
          </>}
        </div>)}
      {tab === "calendar" && <ProfileCalendar events={calendarEvents} onRemove={removeCalendarEvent} />}
    </div>
  );
}

function ProfileCalendar({ events, onRemove }) {
  const now = new Date();
  const [month, setMonth] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const monthDate = new Date(month.year, month.month, 1);
  const monthName = monthDate.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  const first = (monthDate.getDay() + 6) % 7;
  const last = new Date(month.year, month.month + 1, 0).getDate();
  const monthKey = `${month.year}-${pad(month.month + 1)}`;
  const shift = (amount) => {
    const next = new Date(month.year, month.month + amount, 1);
    setMonth({ year: next.getFullYear(), month: next.getMonth() });
  };

  return (
    <div className="cpanel">
      <div className="row sp" style={{ marginBottom: 14 }}>
        <div><h2 style={{ margin: 0 }}>My calendar</h2><p className="sub" style={{ margin: 0 }}>Events you added to your personal calendar.</p></div>
        <div className="nav3">
          <button aria-label="Previous month" onClick={() => shift(-1)}><Ic n="chevL" s={16} /></button>
          <button onClick={() => setMonth({ year: now.getFullYear(), month: now.getMonth() })}>Today</button>
          <button aria-label="Next month" onClick={() => shift(1)}><Ic n="chevR" s={16} /></button>
        </div>
      </div>
      <h3 style={{ marginBottom: 10 }}>{monthName}</h3>
      <div className="wdh">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <div key={day}>{day}</div>)}</div>
      <div className="mgrid">
        {Array.from({ length: first }, (_, index) => <div key={"blank-" + index} className="mcell off" />)}
        {Array.from({ length: last }, (_, index) => {
          const day = index + 1;
          const date = `${monthKey}-${pad(day)}`;
          const dayEvents = events.filter((event) => event.date === date);
          const weekend = (first + index) % 7 > 4;
          return (
            <div key={date} className={"mcell " + (weekend ? "wk" : "")}>
              <span className={"mn " + (date === `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}` ? "today" : "")}>{day}</span>
              {dayEvents.slice(0, 3).map((event) => (
                <div key={event.id} className={"evc " + (EVENT_CLASSES[event.cat] || "c6")} title={event.title}>
                  <b>{event.time}</b><span>{event.title}</span>
                </div>
              ))}
              {dayEvents.length > 3 && <span className="more">+{dayEvents.length - 3} more</span>}
            </div>
          );
        })}
      </div>
      <h3 style={{ margin: "18px 0 10px" }}>Added events</h3>
      {events.length
        ? <div className="col">{[...events].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).map((event) => (
          <div className="card bd row sp" key={event.id}>
            <div>
              <h3>{event.title}</h3>
              <div className="meta"><Ic n="calendar" s={15} />{dShort(event.date).full}, {event.time}</div>
              <div className="meta"><Ic n="pin" s={15} />{(event.offices || []).join(", ")} · {event.venue}</div>
            </div>
            <button className="btn o" onClick={() => onRemove(event.id)}>Remove</button>
          </div>
        ))}</div>
        : <p className="sub">Add an event from the Mastek Calendar to see it here.</p>}
    </div>
  );
}
