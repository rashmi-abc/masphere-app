import { useEffect, useRef, useState } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Av, Ic } from "./common";
import logo from "../assets/logo.png";
import { useAuth } from "../context/AuthContext";
import { DataProvider, useData } from "../context/DataContext";
import { ModulesProvider, useModules } from "../context/ModulesContext";
import { useUI } from "../context/UIContext";
import { LS } from "../services/storage";
import { showBrowserNotification } from "../services/browserNotifications";

// [route, icon, label]  (order follows the UI spec)
const NAV = [["discover", "compass", "Discover"], ["sheroes", "heart", "Sheroes"], ["plans", "calendar", "Plans"], ["opportunities", "briefcase", "Opportunities"], ["calendar", "calendar", "Mastek Calendar"], ["rewards", "trophy", "VECTOR Rewards"]];
const MOBILE = [["discover", "home", "Home"], ["sheroes", "heart", "Sheroes"], ["plans", "calendar", "Plans"], ["opportunities", "compass", "Explore"], ["calendar", "clock", "Events"], ["profile", "user", "Profile"]];

export default function ProtectedLayout() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <DataProvider><ModulesProvider><Shell /></ModulesProvider></DataProvider>;
}

function Shell() {
  const { user, logout } = useAuth();
  const isWoman = ["woman", "female"].includes(String(user.gender || "").trim().toLowerCase());
  const visibleNav = NAV.filter(([key]) => key !== "sheroes" || isWoman);
  const visibleMobile = MOBILE.filter(([key]) => key !== "sheroes" || isWoman);
  const { plans, posts, q, setQ, dataError } = useData();
  const { opps, calendarEvents, error: modulesError } = useModules();
  const { modal, setModal, toast, tt } = useUI();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const route = pathname.split("/")[1] || "discover";
  const [bell, setBell] = useState(false);
  const [menu, setMenu] = useState(false);
  const notificationUserId = user.uid || user.email;
  const planBaseline = useRef(null);
  const opportunityBaseline = useRef(null);
  const postBaseline = useRef(null);
  const pointsBaseline = useRef(null);

  useEffect(() => {
    if (dataError) tt(dataError);
  }, [dataError, tt]);
  useEffect(() => {
    if (modulesError) tt(modulesError);
  }, [modulesError, tt]);

  useEffect(() => {
    const items = new Map(plans.map((plan) => [String(plan.id), {
      status: plan.st,
      requests: (plan.pendingRequests || []).map((request) => ({
        id: String(request.userId || request.id),
        name: request.name || "A colleague",
      })),
    }]));
    const previous = planBaseline.current;
    if (!previous || previous.uid !== notificationUserId) {
      planBaseline.current = { uid: notificationUserId, items, ignoreUntil: Date.now() + 5000 };
      return;
    }

    if (Date.now() >= previous.ignoreUntil && user.settings?.n_push && user.settings?.n_req) {
      for (const plan of plans) {
        const old = previous.items.get(String(plan.id));
        if (!old) continue;
        const oldRequests = new Set(old.requests.map((request) => request.id));
        for (const request of plan.pendingRequests || []) {
          const requestId = String(request.userId || request.id);
          if (!oldRequests.has(requestId)) {
            showBrowserNotification("New plan join request", `${request.name || "A colleague"} asked to join ${plan.t}.`, `plan-request-${plan.id}-${requestId}`);
          }
        }
        if (old.status === "pending" && plan.st === "accepted") {
          showBrowserNotification("Plan request approved", `Your request to join ${plan.t} was approved.`, `plan-approved-${plan.id}`);
        } else if (old.status === "pending" && plan.st === "none") {
          showBrowserNotification("Plan request declined", `Your request to join ${plan.t} was declined.`, `plan-declined-${plan.id}`);
        }
      }
    }
    planBaseline.current = { ...previous, items };
  }, [plans, notificationUserId, user.settings?.n_push, user.settings?.n_req]);

  useEffect(() => {
    const items = new Map(opps.map((opportunity) => [String(opportunity.id), {
      ownerId: opportunity.ownerId || "",
      mine: !!opportunity.mine,
      interested: [...(opportunity.interestedIds || opportunity.interested || [])],
      team: [...(opportunity.teamIds || opportunity.team || [])],
      title: opportunity.title,
    }]));
    const previous = opportunityBaseline.current;
    if (!previous || previous.uid !== notificationUserId) {
      opportunityBaseline.current = { uid: notificationUserId, items, ignoreUntil: Date.now() + 5000 };
      return;
    }

    if (Date.now() >= previous.ignoreUntil && user.settings?.n_push && user.settings?.n_req) {
      for (const opportunity of opps) {
        const old = previous.items.get(String(opportunity.id));
        if (!old) continue;
        const isOwner = opportunity.ownerId
          ? opportunity.ownerId === notificationUserId
          : !!opportunity.mine;
        const currentInterest = opportunity.interestedIds || opportunity.interested || [];
        if (isOwner && currentInterest.some((id) => !old.interested.includes(id))) {
          showBrowserNotification("New opportunity interest", `A colleague is interested in ${opportunity.title}.`, `opportunity-interest-${opportunity.id}-${Date.now()}`);
        }
        const currentTeam = opportunity.teamIds || opportunity.team || [];
        const userMember = currentTeam.includes(user.uid || user.name);
        const wasMember = old.team.includes(user.uid || user.name);
        if (!isOwner && userMember && !wasMember) {
          showBrowserNotification("Opportunity team update", `You were added to ${opportunity.title}.`, `opportunity-team-${opportunity.id}`);
        }
      }
    }
    opportunityBaseline.current = { ...previous, items };
  }, [opps, notificationUserId, user.uid, user.name, user.settings?.n_push, user.settings?.n_req]);

  useEffect(() => {
    const items = new Map(posts.map((post) => [String(post.id), {
      authorId: post.authorId || "",
      author: post.by || "",
      likes: Number(post.likes) || 0,
      likedBy: [...(post.likedBy || [])],
      comments: [...(post.cm || [])],
    }]));
    const previous = postBaseline.current;
    if (!previous || previous.uid !== notificationUserId) {
      postBaseline.current = { uid: notificationUserId, items, ignoreUntil: Date.now() + 5000 };
      return;
    }

    if (Date.now() >= previous.ignoreUntil && user.settings?.n_push) {
      for (const post of posts) {
        const old = previous.items.get(String(post.id));
        if (!old) {
          if ((post.tags || []).includes(user.name) && user.settings?.n_com) {
            showBrowserNotification("You were mentioned", `${post.by} mentioned you in a post.`, `post-tag-${post.id}`);
          }
          continue;
        }
        const isOwner = post.authorId ? post.authorId === user.uid : post.by === user.name;
        if (!isOwner) continue;
        const newLikes = (post.likedBy || []).filter((id) => !old.likedBy.includes(id) && id !== user.uid);
        if (user.settings?.n_like && (newLikes.length > 0 || (!post.likedBy?.length && post.likes > old.likes))) {
          showBrowserNotification("New post like", `Someone liked your post: ${post.x || "your update"}`, `post-like-${post.id}-${Date.now()}`);
        }
        const newComments = (post.cm || []).slice(old.comments.length).filter((comment) => comment[0] !== user.name);
        if (user.settings?.n_com && newComments.length > 0) {
          showBrowserNotification("New post comment", `${newComments[0][0]} commented on your post.`, `post-comment-${post.id}-${Date.now()}`);
        }
      }
    }
    postBaseline.current = { ...previous, items };
  }, [posts, notificationUserId, user.uid, user.name, user.settings?.n_push, user.settings?.n_like, user.settings?.n_com]);

  useEffect(() => {
    const currentPoints = Number(user.pts) || 0;
    const previous = pointsBaseline.current;
    if (previous?.uid === notificationUserId
      && currentPoints > previous.points
      && user.settings?.n_push) {
      showBrowserNotification("Explorer points earned", `You earned ${currentPoints - previous.points} points.`);
    }
    pointsBaseline.current = { uid: notificationUserId, points: currentPoints };
  }, [notificationUserId, user.pts, user.settings?.n_push]);

  useEffect(() => {
    if (!user.settings?.n_push || !user.settings?.n_rem || !calendarEvents.length) return undefined;
    const checkReminders = () => {
      const now = Date.now();
      for (const event of calendarEvents) {
        const eventTime = new Date(`${event.date}T${event.time}`).getTime();
        if (!Number.isFinite(eventTime) || eventTime <= now) continue;
        const reminders = [
          ["day", 24 * 60 * 60 * 1000, "Event tomorrow"],
          ["hour", 60 * 60 * 1000, "Event in 1 hour"],
        ];
        for (const [kind, offset, title] of reminders) {
          const dueAt = eventTime - offset;
          if (now < dueAt || now - dueAt > 120000) continue;
          const key = `ms_browser_reminder_${encodeURIComponent(notificationUserId)}_${encodeURIComponent(event.id)}_${kind}_${eventTime}`;
          if (LS.get(key, false)) continue;
          const sent = showBrowserNotification(title, `${event.title} · ${event.time}${event.venue ? ` · ${event.venue}` : ""}`, key);
          if (sent) LS.set(key, true);
        }
      }
    };
    checkReminders();
    const timer = setInterval(checkReminders, 30000);
    return () => clearInterval(timer);
  }, [calendarEvents, notificationUserId, user.settings?.n_push, user.settings?.n_rem]);

  const go = (r) => { navigate("/" + r); scrollTo(0, 0); setBell(false); setMenu(false); };
  const doLogout = async () => { setMenu(false); setBell(false); setModal(null); await logout(); navigate("/login"); };

  const link = (k, i, l, cls = "nv") => <button key={k} className={cls + " " + (route === k ? "on" : "")} aria-current={route === k ? "page" : undefined} onClick={() => go(k)}><Ic n={i} />{l}</button>;

  return (
    <>
      <aside className="side">
        <div className="brand"><img src={logo} alt="MaSphere" /></div>
        <div className="tag">Work together, in real time</div>
        {visibleNav.map(([k, i, l]) => link(k, i, l))}
        {user.admin && <><div className="nvh">Administration</div>{link("admin", "shield", "Admin Console")}</>}
        <div className="sidef">
          {link("profile", "user", "My Profile")}{link("settings", "sliders", "Settings")}
          <button className="nv"><Ic n="comment" />Help / Support</button>
          <button className="nv" onClick={doLogout}><Ic n="logout" />Sign out</button>
          <div className="row" style={{ fontSize: 11, color: "var(--m)", padding: "0 6px", gap: 6, flexWrap: "nowrap" }}><Ic n="lock" s={12} />Employee-only community</div>
        </div>
      </aside>
      <nav className="bnav" aria-label="Primary">{visibleMobile.map(([k, i, l]) => link(k, i, l))}</nav>
      <div className="main">
        <div className="top">
          <img className="mlogo" src={logo} alt="MaSphere" />
          <div className="sbox">
            <Ic n="search" s={17} />
            <input value={q} aria-label="Global search" placeholder="Search posts, plans and places" onChange={(e) => { setQ(e.target.value); if (route !== "discover") go("discover"); }} />
          </div>
          <div style={{ flex: 1 }} />
          <button className="ib top-bell" aria-label="Notifications" onClick={() => { setBell(!bell); setMenu(false); }}><Ic n="bell" /><span className="unread-dot" aria-label="Unread notifications" /></button>
          <button className="top-avatar" aria-label="Account menu" onClick={() => { setMenu(!menu); setBell(false); }}><Av n={user.name} s={36} src={user.avatar} /></button>
        </div>
        {(bell || menu) && <div className="pbg" onClick={() => { setBell(false); setMenu(false); }} />}
        {bell && (
          <div className="pop" style={{ width: 340 }}>
            <div style={{ padding: "6px 8px" }}>
              <b>Browser notifications</b>
              <p className="hint" style={{ margin: "8px 0 12px" }}>Calendar reminders and real activity alerts appear in your browser while MaSphere is open. Manage them in Settings.</p>
              <button className="btn g w" onClick={() => go("settings/notif")}>Notification settings</button>
            </div>
          </div>
        )}
        {menu && (
          <div className="pop" style={{ width: 230 }}>
            <div style={{ padding: "6px 12px 10px", borderBottom: "1px solid var(--l)", marginBottom: 6 }}><b style={{ fontSize: 14 }}>{user.name}</b><div className="hint">{user.email}</div></div>
            <button className="it" onClick={() => go("profile")}><Ic n="user" s={18} />My Profile</button>
            <button className="it" onClick={() => go("settings")}><Ic n="sliders" s={18} />Settings</button>
            <button className="it" style={{ color: "var(--er)" }} onClick={doLogout}><Ic n="logout" s={18} />Sign out</button>
          </div>
        )}
        <div className="pg"><Outlet /></div>
      </div>
      {modal && <div className="ov" onClick={() => !modal.w && setModal(null)}><div className={"md " + (modal.w || "")} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>{modal.n}</div></div>}
      {toast && <div className="toast" role="status">{toast}</div>}
    </>
  );
}
