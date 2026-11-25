import { arrayUnion, collection, doc, onSnapshot, orderBy, query, runTransaction, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { USE_MOCK } from "./http";
import { SEED_PLANS } from "../data/seed";
import { PK } from "../data/constants";
import { getFirebase } from "./firebase";

const mockUserId = (user) => user?.uid || user?.email || "";
const validParticipantLimit = (value) => {
  const maxPeople = Number(value);
  if (!Number.isInteger(maxPeople) || maxPeople < 2 || maxPeople > 100) {
    throw new Error("The participant limit must be between 2 and 100.");
  }
  return maxPeople;
};
let store = SEED_PLANS.map((plan) => ({
  ...plan,
  hostId: plan.hostId || `seed:${plan.id}`,
  members: plan.members || [`seed:${plan.id}`],
  joinRequests: plan.joinRequests || [],
}));
const chatStore = {};

export const defaultChat = (plan) => ({
  msgs: [{ me: 0, w: plan.host, x: "Welcome to the group! Let's lock the plan." }],
  votes: { "Fri 6 PM": 2, "Sat 7 AM": 3, "Sat 10 AM": 1 },
  voted: null, pin: 0, rated: 0, done: 0,
});

function mockPlanForUser(plan, uid) {
  const requests = plan.joinRequests || [];
  const ownRequest = requests.find((request) => request.userId === uid);
  const pendingRequests = requests.filter((request) => request.status === "pending");
  const isHost = plan.hostId === uid;
  const isMember = (plan.members || []).includes(uid) || ownRequest?.status === "accepted";
  const status = isHost
    ? (pendingRequests.length ? "hostreq" : "host")
    : (isMember ? (plan.completed ? "done" : "accepted") : (ownRequest?.status === "pending" ? "pending" : "none"));
  return { ...plan, pendingRequests: isHost ? pendingRequests : [], st: status };
}

const mock = {
  async list(uid) { return store.map((plan) => mockPlanForUser(plan, uid)); },
  subscribe(uid, onPlans) { onPlans(store.map((plan) => mockPlanForUser(plan, uid))); return () => {}; },
  async create(user, form, image) {
    const uid = mockUserId(user);
    const plan = {
      id: Date.now(), hostId: uid, members: [uid], joinRequests: [], ...form, t: form.t.trim(), cat: form.cat.trim(),
      max: validParticipantLimit(form.max),
      k: PK[form.cat] || "Other", city: user.office, host: user.name,
      img: image?.src || "", completed: false,
    };
    store = [plan, ...store];
    return mockPlanForUser(plan, uid);
  },
  async setStatus(id, status, user, requesterId) {
    const planIndex = store.findIndex((plan) => String(plan.id) === String(id));
    if (planIndex < 0) throw new Error("This plan no longer exists.");
    const plan = store[planIndex];
    const uid = mockUserId(user);
    const members = [...(plan.members || [plan.hostId])];
    const requests = [...(plan.joinRequests || [])];
    const maxPeople = validParticipantLimit(plan.max || plan.maxPeople);
    const atCapacity = maxPeople > 0 && members.length >= maxPeople;

    if (status === "pending") {
      if (plan.completed) throw new Error("This plan has already been completed.");
      if (uid === plan.hostId) throw new Error("You are already hosting this plan.");
      if (members.includes(uid)) return;
      if (atCapacity) throw new Error("This plan has reached its participant limit.");
      const request = requests.find((item) => item.userId === uid);
      if (request?.status === "pending" || request?.status === "accepted") return;
      if (request) request.status = "pending";
      else requests.push({ id: uid, userId: uid, name: user.name, email: user.email, status: "pending" });
    } else if (status === "hostreq") {
      if (uid !== plan.hostId) throw new Error("Only the plan host can manage join requests.");
      if (!requests.some((request) => request.status === "pending")) {
        requests.push({ id: `mock:aisha:${id}`, userId: `mock:aisha:${id}`, name: "Aisha Kapoor", email: "", status: "pending" });
      }
    } else if (status === "accepted" || status === "declined") {
      if (status === "accepted" && plan.completed) {
        throw new Error("This plan has already been completed.");
      }
      if ((requesterId || uid === plan.hostId) && uid !== plan.hostId) {
        throw new Error("Only the plan host can respond to join requests.");
      }
      if (status === "declined" && uid !== plan.hostId) {
        throw new Error("Only the plan host can decline join requests.");
      }
      const requester = requesterId || (uid === plan.hostId
        ? requests.find((request) => request.status === "pending")?.userId
        : uid);
      const request = requests.find((item) => item.userId === requester);
      if (!request) throw new Error("The join request no longer exists.");
      if (status === "accepted" && !members.includes(requester)) {
        if (atCapacity) throw new Error("This plan has reached its participant limit.");
        members.push(requester);
      }
      request.status = status;
    } else if (status === "host") {
      if (uid !== plan.hostId) throw new Error("Only the plan host can manage join requests.");
      for (const request of requests) {
        if (request.userId.startsWith("mock:aisha:") && request.status === "pending") request.status = "declined";
      }
    } else if (status === "done") {
      if (uid !== plan.hostId) throw new Error("Only the plan host can complete it.");
      plan.completed = true;
    }

    store[planIndex] = { ...plan, members, joinRequests: requests };
  },
  subscribeMessages(id, uidOrCallback, callback) {
    const listener = typeof uidOrCallback === "function" ? uidOrCallback : callback;
    listener(chatStore[id]?.msgs || []);
    return () => {};
  },
  async saveChat(id, chat) { chatStore[id] = chat; },
  async sendMessage(id, user, text) {
    const chat = chatStore[id] || defaultChat(store.find((plan) => String(plan.id) === String(id)) || { host: "Host" });
    chatStore[id] = { ...chat, msgs: [...chat.msgs, { me: 1, w: user.name, x: text }] };
  },
  async vote(id, option) {
    const chat = chatStore[id] || defaultChat(store.find((plan) => String(plan.id) === String(id)) || { host: "Host" });
    if (chat.voted === option) return;
    const votes = { ...chat.votes };
    if (chat.voted) votes[chat.voted] = Math.max(0, (votes[chat.voted] || 0) - 1);
    votes[option] = (votes[option] || 0) + 1;
    chatStore[id] = { ...chat, votes, voted: option };
  },
  async setPinned() {},
  async setRating(id, value) {
    const chat = chatStore[id] || defaultChat({ host: "Host" });
    chatStore[id] = { ...chat, rated: value };
  },
  async complete(id, user) {
    const plan = store.find((item) => String(item.id) === String(id));
    if (!plan || plan.completed) return null;
    if (plan.hostId !== mockUserId(user)) throw new Error("Only the plan host can complete it.");
    store = store.map((item) => (String(item.id) === String(id) ? { ...item, completed: true } : item));
    const currentBadges = user.badges || [];
    const badges = currentBadges.includes("Explorer") ? currentBadges : [...currentBadges, "Explorer"];
    const stamps = [...new Set([...(user.stamps || []), plan.loc])];
    return { points: (user.pts || 0) + 150, badges, stamps };
  },
};

function requestFromSnapshot(snapshot) {
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

function planFromSnapshot(snapshot, uid, requests = []) {
  const data = snapshot.data();
  const members = new Set(Array.isArray(data.members) ? data.members : []);
  if (data.hostId) members.add(data.hostId);
  const ownRequest = requests.find((request) => request.userId === uid);
  const pendingRequests = requests.filter((request) => request.status === "pending");
  const host = data.hostId === uid;
  const accepted = (Array.isArray(data.members) && data.members.includes(uid))
    || ownRequest?.status === "accepted";
  const status = host
    ? (pendingRequests.length ? "hostreq" : "host")
    : (accepted ? (data.completed ? "done" : "accepted") : (ownRequest?.status === "pending" ? "pending" : "none"));

  return {
    id: snapshot.id,
    hostId: data.hostId,
    host: data.host || "Unknown",
    t: data.title || "",
    cat: data.category || "",
    k: data.interest || PK[data.category] || "Other",
    city: data.city || "",
    loc: data.location || "",
    d: data.date || "",
    tm: data.time || "",
    bud: data.budget || "",
    max: data.maxPeople || 0,
    mode: data.mode || "",
    desc: data.description || "",
    img: data.image || "",
    members: [...members],
    st: status,
    pendingRequests,
    votes: data.votes || {},
    voteBy: data.voteBy || {},
    pinned: !!data.pinned,
    rating: data.rating || 0,
    completed: !!data.completed,
  };
}

const real = {
  subscribe(uid, onPlans, onError) {
    const { db } = getFirebase();
    const requestListeners = new Map();
    const requestValues = new Map();
    let planSnapshots = [];

    const publish = () => {
      onPlans(planSnapshots.map((snapshot) =>
        planFromSnapshot(snapshot, uid, requestValues.get(snapshot.id) || [])));
    };

    const unsubscribePlans = onSnapshot(collection(db, "plans"), (snapshot) => {
      planSnapshots = snapshot.docs;
      const currentIds = new Set(planSnapshots.map((item) => item.id));
      for (const [planId, unsubscribe] of requestListeners) {
        if (!currentIds.has(planId)) {
          unsubscribe();
          requestListeners.delete(planId);
          requestValues.delete(planId);
        }
      }

      for (const planSnapshot of planSnapshots) {
        if (requestListeners.has(planSnapshot.id)) continue;
        const requestCollection = collection(db, "plans", planSnapshot.id, "joinRequests");
        const requestQuery = planSnapshot.data().hostId === uid
          ? requestCollection
          : doc(requestCollection, uid);
        const unsubscribe = onSnapshot(requestQuery, (requestsSnapshot) => {
          const requests = requestsSnapshot.docs
            ? requestFromSnapshot(requestsSnapshot)
            : requestsSnapshot.exists()
              ? [{ id: requestsSnapshot.id, ...requestsSnapshot.data() }]
              : [];
          requestValues.set(planSnapshot.id, requests);
          publish();
        }, onError);
        requestListeners.set(planSnapshot.id, unsubscribe);
      }
      publish();
    }, onError);

    return () => {
      unsubscribePlans();
      requestListeners.forEach((unsubscribe) => unsubscribe());
      requestListeners.clear();
      requestValues.clear();
    };
  },
  async create(user, form, image) {
    const { db, storage } = getFirebase();
    const maxPeople = validParticipantLimit(form.max);
    const planRef = doc(collection(db, "plans"));
    let imageUrl = "";
    let imageRef;
    let imageUploaded = false;
    if (image?.file) {
      if (!image.file.type.startsWith("image/") || image.file.size > 10 * 1024 * 1024) {
        throw new Error("Plan cover images must be no larger than 10 MB.");
      }
      const fileName = `${Date.now()}-${image.file.name.replace(/[\\/]/g, "_")}`;
      imageRef = ref(storage, `plans/${planRef.id}/${fileName}`);
    }

    const timeOptions = { "6:00 PM": 0, "7:00 PM": 0, "8:00 PM": 0 };
    try {
      if (imageRef) {
        await uploadBytes(imageRef, image.file, { contentType: image.file.type });
        imageUploaded = true;
        imageUrl = await getDownloadURL(imageRef);
      }
      await setDoc(planRef, {
        hostId: user.uid,
        host: user.name,
        title: form.t.trim(),
        category: form.cat.trim(),
        interest: PK[form.cat] || form.cat.trim(),
        city: user.office || "",
        location: form.loc.trim(),
        date: form.d,
        time: form.tm,
        budget: String(form.bud || ""),
        maxPeople,
        mode: form.mode,
        description: form.desc || "",
        image: imageUrl,
        members: [user.uid],
        status: "open",
        completed: false,
        pinned: false,
        rating: 0,
        pollActive: true,
        votes: timeOptions,
        voteBy: {},
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      if (imageRef && imageUploaded) {
        try { await deleteObject(imageRef); }
        catch (cleanupError) {
          throw new Error(`${error.message} The uploaded plan image could not be cleaned up: ${cleanupError.message}`);
        }
      }
      throw error;
    }
    return { id: planRef.id };
  },
  async setStatus(id, status, user, requesterId) {
    const { db } = getFirebase();
    const planRef = doc(db, "plans", String(id));
    if (status === "pending") {
      if (!user?.uid) throw new Error("You must be signed in to request to join a plan.");
      const requestRef = doc(db, "plans", String(id), "joinRequests", user.uid);
      await runTransaction(db, async (transaction) => {
        const [planSnapshot, existing] = await Promise.all([
          transaction.get(planRef),
          transaction.get(requestRef),
        ]);
        if (!planSnapshot.exists()) throw new Error("This plan no longer exists.");
        const plan = planSnapshot.data();
        if (plan.completed) throw new Error("This plan has already been completed.");
        const members = [...new Set([...(plan.members || []), plan.hostId])];
        if (members.includes(user.uid)) return;
        const maxPeople = validParticipantLimit(plan.maxPeople);
        if (members.length >= maxPeople) {
          throw new Error("This plan has reached its participant limit.");
        }
        if (existing.exists()) {
          if (existing.data().status === "declined") {
            transaction.update(requestRef, { status: "pending" });
          }
          return;
        }
        transaction.set(requestRef, {
          userId: user.uid,
          name: user.name,
          email: user.email,
          status: "pending",
          createdAt: serverTimestamp(),
        });
      });
      return;
    }
    if (status === "accepted" || status === "declined") {
      if (!requesterId) throw new Error("Select a join request to respond to.");
      const requestRef = doc(db, "plans", String(id), "joinRequests", requesterId);
      await runTransaction(db, async (transaction) => {
        const [planSnapshot, requestSnapshot] = await Promise.all([
          transaction.get(planRef),
          transaction.get(requestRef),
        ]);
        if (!planSnapshot.exists() || !requestSnapshot.exists()) {
          throw new Error("The plan or join request no longer exists.");
        }
        const plan = planSnapshot.data();
        const request = requestSnapshot.data();
        if (request.status !== "pending") throw new Error("This join request is no longer pending.");
        if (status === "accepted" && plan.completed) {
          throw new Error("This plan has already been completed.");
        }
        const members = [...new Set([...(plan.members || []), plan.hostId])];
        if (status === "accepted" && !members.includes(requesterId)) {
          const maxPeople = validParticipantLimit(plan.maxPeople);
          if (members.length >= maxPeople) {
            throw new Error("This plan has reached its participant limit.");
          }
        }
        transaction.update(requestRef, { status });
        if (status === "accepted") {
          transaction.update(planRef, { members: arrayUnion(plan.hostId, requesterId) });
        }
      });
      return;
    }
    if (status === "done") {
      await updateDoc(planRef, { completed: true });
    }
  },
  subscribeMessages(id, uid, callback, onError) {
    const { db } = getFirebase();
    const messagesQuery = query(collection(db, "plans", String(id), "messages"), orderBy("createdAt", "asc"));
    return onSnapshot(messagesQuery, (snapshot) => {
      const messages = snapshot.docs.map((item) => {
        const data = item.data();
        return {
          id: item.id,
          me: data.authorId === uid ? 1 : 0,
          w: data.author || "User",
          x: data.text || "",
          createdAt: data.createdAt,
        };
      });
      messages.sort((a, b) => (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0));
      callback(messages);
    }, onError);
  },
  async sendMessage(id, user, text) {
    const { db } = getFirebase();
    await setDoc(doc(collection(db, "plans", String(id), "messages")), {
      authorId: user.uid,
      author: user.name,
      text: text.trim(),
      createdAt: serverTimestamp(),
    });
  },
  async vote(id, uid, option) {
    const { db } = getFirebase();
    const planRef = doc(db, "plans", String(id));
    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(planRef);
      if (!snapshot.exists()) throw new Error("This plan no longer exists.");
      const data = snapshot.data();
      const votes = { ...(data.votes || {}) };
      const voteBy = { ...(data.voteBy || {}) };
      const previous = voteBy[uid];
      if (previous === option) return;
      if (previous && Object.prototype.hasOwnProperty.call(votes, previous)) {
        votes[previous] = Math.max(0, (votes[previous] || 0) - 1);
      }
      if (!Object.prototype.hasOwnProperty.call(votes, option)) {
        throw new Error("That poll option is no longer available.");
      }
      votes[option] = (votes[option] || 0) + 1;
      voteBy[uid] = option;
      transaction.update(planRef, { votes, voteBy });
    });
  },
  async setPinned(id, pinned) {
    const { db } = getFirebase();
    await updateDoc(doc(db, "plans", String(id)), { pinned: !!pinned });
  },
  async setRating(id, rating) {
    const { db } = getFirebase();
    await updateDoc(doc(db, "plans", String(id)), { rating: Number(rating) });
  },
  async complete(id, user) {
    const { db } = getFirebase();
    const planRef = doc(db, "plans", String(id));
    const profileRef = doc(db, "users", user.uid);
    return runTransaction(db, async (transaction) => {
      const [planSnapshot, profileSnapshot] = await Promise.all([
        transaction.get(planRef),
        transaction.get(profileRef),
      ]);
      if (!planSnapshot.exists() || !profileSnapshot.exists()) {
        throw new Error("The plan or user profile could not be found.");
      }
      const plan = planSnapshot.data();
      if (plan.completed) return null;
      const profile = profileSnapshot.data();
      const points = (profile.points || 0) + 150;
      const badges = [...new Set([...(profile.badges || []), "Explorer"])];
      const stamps = [...new Set([...(profile.stamps || []), plan.location])];
      transaction.update(planRef, { completed: true });
      transaction.update(profileRef, {
        points,
        badges: arrayUnion("Explorer"),
        stamps: arrayUnion(plan.location),
      });
      return { points, badges, stamps };
    });
  },
};

export const plansService = { ...(USE_MOCK ? mock : real), defaultChat };
