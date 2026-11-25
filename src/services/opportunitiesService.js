import { arrayUnion, collection, deleteDoc, doc, onSnapshot, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { USE_MOCK } from "./http";
import { OPPS } from "../data/modules";
import { getFirebase } from "./firebase";

let store = [...OPPS];

function opportunityForUi(snapshot, uid, users) {
  const data = snapshot.data();
  const ownerId = data.ownerId || "";
  const teamIds = Array.isArray(data.team) ? [...data.team] : [];
  if (ownerId && !teamIds.includes(ownerId)) teamIds.unshift(ownerId);
  const interestedIds = Array.isArray(data.interested) ? data.interested : [];
  const nameFor = (id) => users.get(id)?.name || id;
  return {
    id: snapshot.id,
    ownerId,
    owner: data.owner || nameFor(ownerId),
    title: data.title || "",
    type: data.type || "Workshop",
    scope: data.scope || "Internal",
    org: data.organiser || "",
    date: data.date || "",
    deadline: data.deadline || "",
    loc: data.location || "",
    skills: Array.isArray(data.skills) ? data.skills : [],
    size: Number(data.teamSize) || 0,
    interestedIds,
    interested: interestedIds.map(nameFor),
    teamIds,
    team: teamIds.map(nameFor),
    desc: data.description || "",
    url: data.url || "",
    mine: ownerId === uid,
  };
}

const mock = {
  subscribe(_uid, callback) { callback([...store]); return () => {}; },
  async create(user, form, values) {
    const item = {
      id: Date.now(),
      ...form,
      title: form.title.trim(),
      skills: form.skills.split(",").map((skill) => skill.trim()).filter(Boolean),
      size: form.type === "Hackathon" ? Number(form.size) : 0,
      interested: [],
      team: [user.name],
      mine: true,
      vals: values,
    };
    store = [item, ...store];
    return item;
  },
  async expressInterest(id, user) {
    store = store.map((item) => (String(item.id) === String(id)
      ? { ...item, interested: item.interested.includes(user.name) ? item.interested : [...item.interested, user.name] }
      : item));
  },
  async acceptMember(id, requester) {
    store = store.map((item) => (String(item.id) === String(id)
      ? { ...item, team: item.team.includes(requester) ? item.team : [...item.team, requester] }
      : item));
  },
  async remove(id) { store = store.filter((item) => String(item.id) !== String(id)); },
};

const real = {
  subscribe(uid, callback, onError) {
    const { db } = getFirebase();
    let opportunitySnapshots = [];
    let users = new Map();
    const publish = () => callback(opportunitySnapshots.map((snapshot) => opportunityForUi(snapshot, uid, users)));
    const unsubscribeOpportunities = onSnapshot(collection(db, "opportunities"), (snapshot) => {
      opportunitySnapshots = snapshot.docs;
      publish();
    }, onError);
    const unsubscribeUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      users = new Map(snapshot.docs.map((item) => [item.id, item.data()]));
      publish();
    }, onError);
    return () => {
      unsubscribeOpportunities();
      unsubscribeUsers();
    };
  },
  async create(user, form, values) {
    const { db } = getFirebase();
    const skills = form.skills.split(",").map((skill) => skill.trim()).filter(Boolean);
    const opportunityRef = doc(collection(db, "opportunities"));
    await setDoc(opportunityRef, {
      ownerId: user.uid,
      owner: user.name,
      title: form.title.trim(),
      type: form.type,
      scope: form.scope,
      organiser: form.org.trim() || user.name,
      date: form.date,
      location: form.loc.trim() || "Online",
      deadline: form.deadline || "",
      description: form.desc || "",
      url: form.url || "",
      skills,
      interested: [],
      team: [user.uid],
      teamSize: form.type === "Hackathon" ? Number(form.size) : 0,
      vals: values,
      createdAt: serverTimestamp(),
    });
    return { id: opportunityRef.id };
  },
  async expressInterest(id, user) {
    const { db } = getFirebase();
    await updateDoc(doc(db, "opportunities", String(id)), {
      interested: arrayUnion(user.uid),
    });
  },
  async acceptMember(id, requesterId) {
    const { db } = getFirebase();
    await updateDoc(doc(db, "opportunities", String(id)), {
      team: arrayUnion(requesterId),
    });
  },
  async remove(id) {
    const { db } = getFirebase();
    await deleteDoc(doc(db, "opportunities", String(id)));
  },
};

export const opportunitiesService = USE_MOCK ? mock : real;
