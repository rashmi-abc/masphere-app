import { createContext, useContext, useEffect, useState } from "react";
import { postsService } from "../services/postsService";
import { plansService } from "../services/plansService";
import { profilesService } from "../services/profilesService";
import { USE_MOCK } from "../services/http";
import { useAuth } from "./AuthContext";

const DataCtx = createContext(null);
export const useData = () => useContext(DataCtx);

export function DataProvider({ children }) {
  const { user, syncUser } = useAuth();
  const [posts, setPosts] = useState([]);
  const [plans, setPlans] = useState([]);
  const [members, setMembers] = useState([]);
  const [chats, setChats] = useState({});
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState("");

  useEffect(() => {
    if (!user) return undefined;
    setLoading(true);
    setDataError("");
    if (USE_MOCK) {
      let active = true;
      const unsubscribeMembers = profilesService.subscribe(setMembers);
      Promise.all([postsService.list(), plansService.list(user.uid || user.email)]).then(([nextPosts, nextPlans]) => {
        if (active) {
          setPosts(nextPosts);
          setPlans(nextPlans);
          setLoading(false);
        }
      }).catch((error) => {
        if (active) {
          setDataError(error.message);
          setLoading(false);
        }
      });
      return () => { active = false; unsubscribeMembers(); };
    }

    let postsReady = false;
    let plansReady = false;
    const markReady = () => {
      if (postsReady && plansReady) setLoading(false);
    };
    const onError = (error) => {
      setDataError(error.message);
      setLoading(false);
    };
    const unsubscribePosts = postsService.subscribe(user.uid, (nextPosts) => {
      setPosts(nextPosts);
      postsReady = true;
      markReady();
    }, onError);
    const unsubscribePlans = plansService.subscribe(user.uid, (nextPlans) => {
      setPlans(nextPlans);
      plansReady = true;
      markReady();
    }, onError);
    const unsubscribeMembers = profilesService.subscribe(setMembers, onError);
    return () => {
      unsubscribePosts();
      unsubscribePlans();
      unsubscribeMembers();
    };
  }, [user?.uid, user?.email]);

  /* posts */
  const addPost = async (d) => {
    const post = await postsService.create(user, d);
    if (USE_MOCK) setPosts((items) => [post, ...items]);
  };
  const deletePost = async (id) => {
    await postsService.remove(id);
    if (USE_MOCK) setPosts((items) => items.filter((post) => String(post.id) !== String(id)));
  };
  const addComment = async (id, text) => {
    await postsService.addComment(id, user, text);
    if (USE_MOCK) {
      setPosts((items) => items.map((post) => (String(post.id) === String(id)
        ? { ...post, cm: [...post.cm, [user.name, text]] }
        : post)));
    }
  };
  const toggleLike = (id) => postsService.toggleLike(id, user.uid);
  const toggleSave = async (id) => {
    const savedPosts = await postsService.toggleSave(id, user.uid);
    if (savedPosts) syncUser({ savedPosts });
  };

  /* plans */
  const addPlan = async (form, img) => {
    const plan = await plansService.create(user, form, img);
    if (USE_MOCK) setPlans((items) => [plan, ...items]);
  };
  const setPlan = async (id, status, requesterId) => {
    await plansService.setStatus(id, status, user, requesterId);
    if (USE_MOCK) {
      setPlans(await plansService.list(user.uid || user.email));
    }
  };

  /* group chat */
  const getChat = (plan) => {
    const saved = chats[plan.id];
    if (USE_MOCK) return saved || plansService.defaultChat(plan);
    return {
      msgs: saved?.msgs || [],
      votes: plan.votes || {},
      voted: plan.voteBy?.[user.uid] || null,
      pin: plan.pinned ? 1 : 0,
      rated: plan.rating || 0,
      done: plan.completed ? 1 : 0,
    };
  };
  const loadChat = (plan) => plansService.subscribeMessages(
    plan.id,
    user.uid,
    (messages) => setChats((current) => ({ ...current, [plan.id]: { ...current[plan.id], msgs: messages } })),
    (error) => setDataError(error.message)
  );
  const sendMessage = async (plan, text) => {
    if (!USE_MOCK) return plansService.sendMessage(plan.id, user, text);
    const chat = getChat(plan);
    const next = { ...chat, msgs: [...chat.msgs, { me: 1, w: user.name, x: text.trim() }] };
    updateChat(plan, next);
    await plansService.saveChat(plan.id, next);
  };
  const votePlan = async (plan, option) => {
    if (!USE_MOCK) return plansService.vote(plan.id, user.uid, option);
    const chat = getChat(plan);
    if (chat.voted === option) return;
    const votes = { ...chat.votes };
    if (chat.voted) votes[chat.voted] = Math.max(0, (votes[chat.voted] || 0) - 1);
    votes[option] = (votes[option] || 0) + 1;
    const next = { ...chat, votes, voted: option };
    updateChat(plan, next);
    await plansService.saveChat(plan.id, next);
  };
  const pinPlan = async (plan, pinned) => {
    if (!USE_MOCK) return plansService.setPinned(plan.id, pinned);
    const next = { ...getChat(plan), pin: pinned ? 1 : 0 };
    updateChat(plan, next);
    await plansService.saveChat(plan.id, next);
  };
  const ratePlan = async (plan, rating) => {
    if (!USE_MOCK) return plansService.setRating(plan.id, rating);
    const next = { ...getChat(plan), rated: rating };
    updateChat(plan, next);
    await plansService.saveChat(plan.id, next);
  };
  const completePlan = async (plan) => {
    const profile = await plansService.complete(plan.id, user);
    if (profile) syncUser(profile);
    if (!USE_MOCK) return;
    const next = { ...getChat(plan), done: 1 };
    updateChat(plan, next);
    await plansService.saveChat(plan.id, next);
    setPlans((items) => items.map((item) => (String(item.id) === String(plan.id) ? { ...item, st: "done" } : item)));
  };

  const updateChat = (plan, patch) => {
    const next = { ...getChat(plan), ...patch };
    setChats((current) => ({ ...current, [plan.id]: next }));
  };

  return (
    <DataCtx.Provider value={{ posts, plans, members, q, setQ, loading, dataError, addPost, deletePost, addComment, toggleLike, toggleSave, addPlan, setPlan, getChat, loadChat, updateChat, sendMessage, votePlan, pinPlan, ratePlan, completePlan }}>
      {children}
    </DataCtx.Provider>
  );
}
