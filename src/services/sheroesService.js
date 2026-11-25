import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { USE_MOCK } from "./http";
import { getFirebase } from "./firebase";

const mockPosts = [
  {
    id: "sheroes-welcome",
    authorId: "demo-priya",
    author: "Priya Nair",
    text: "A little reminder that progress is personal. Share a small win, a new routine, or something that made you feel good today.",
    category: "Wellbeing",
    createdAt: new Date().toISOString(),
    likes: 8,
    likedBy: [],
    comments: [],
  },
];
const dateInDays = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};
const mockChallenges = [
  {
    id: "sheroes-walk-together",
    title: "Walk together this week",
    description: "Build a gentle daily walking habit. Every step counts.",
    activity: "Walking steps",
    target: 35000,
    startDate: dateInDays(-1),
    endDate: dateInDays(6),
    ownerId: "demo-priya",
    owner: "Priya Nair",
    participantCount: 2,
  },
  {
    id: "sheroes-yoga-pause",
    title: "Five mindful yoga sessions",
    description: "Make time for five short yoga sessions at your own pace.",
    activity: "Yoga sessions",
    target: 5,
    startDate: dateInDays(-1),
    endDate: dateInDays(13),
    ownerId: "demo-aisha",
    owner: "Aisha Kapoor",
    participantCount: 1,
  },
];
let posts = [...mockPosts];
let challenges = [...mockChallenges];
const participants = {
  "sheroes-walk-together": [
    { uid: "demo-priya", name: "Priya Nair", progress: 18340 },
    { uid: "demo-aisha", name: "Aisha Kapoor", progress: 12400 },
  ],
  "sheroes-yoga-pause": [
    { uid: "demo-aisha", name: "Aisha Kapoor", progress: 2 },
  ],
};
const postListeners = new Set();
const challengeListeners = new Set();
const participantListeners = new Map();
const mockMembers = new Set();
const membershipListeners = new Map();

function notify(listeners, value) {
  listeners.forEach((callback) => callback(value));
}

function notifyParticipants(challengeId) {
  const challengeListenersForId = participantListeners.get(String(challengeId));
  if (!challengeListenersForId) return;
  const items = participants[String(challengeId)] || [];
  challengeListenersForId.forEach(({ uid, onMine, onLeaders }) => {
    onMine(items.find((participant) => participant.uid === uid) || null);
    onLeaders([...items].sort((a, b) => b.progress - a.progress).slice(0, 5));
  });
}

function notifyMembership(uid) {
  const listeners = membershipListeners.get(uid);
  if (listeners) listeners.forEach((callback) => callback(mockMembers.has(uid)));
}

function postFromDocument(snapshot) {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    authorId: data.authorId,
    author: data.author || "Community member",
    text: data.text || "",
    category: data.category || "Daily moment",
    imageUrl: data.imageUrl || "",
    createdAt: data.createdAt,
    likes: Number(data.likes) || 0,
    likedBy: Array.isArray(data.likedBy) ? data.likedBy : [],
    comments: Array.isArray(data.comments) ? data.comments : [],
  };
}

function challengeFromDocument(snapshot) {
  return { id: snapshot.id, ...snapshot.data() };
}

function validatePostText(text, hasImage = false) {
  const value = typeof text === "string" ? text.trim() : "";
  if ((!value && !hasImage) || value.length > 500) throw new Error("Add an image or write a post of up to 500 characters.");
  return value;
}

function validateChallenge(data) {
  const title = typeof data.title === "string" ? data.title.trim() : "";
  const description = typeof data.description === "string" ? data.description.trim() : "";
  const activity = typeof data.activity === "string" ? data.activity.trim() : "";
  const target = Number(data.target);
  if (!title || title.length > 80) throw new Error("Add a challenge title of up to 80 characters.");
  if (description.length > 300) throw new Error("The challenge description must be 300 characters or fewer.");
  if (!activity || activity.length > 50) throw new Error("Describe the activity in 1–50 characters.");
  if (!Number.isInteger(target) || target < 1 || target > 1000000) throw new Error("Enter a valid challenge target.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(data.endDate)
    || data.endDate < data.startDate) {
    throw new Error("Choose a valid end date on or after the start date.");
  }
  return { title, description, activity, target };
}

const mock = {
  subscribeMembership(uid, callback) {
    if (!membershipListeners.has(uid)) membershipListeners.set(uid, new Set());
    membershipListeners.get(uid).add(callback);
    callback(mockMembers.has(uid));
    return () => {
      membershipListeners.get(uid)?.delete(callback);
      if (!membershipListeners.get(uid)?.size) membershipListeners.delete(uid);
    };
  },
  async enableMembership(user) {
    if (!["woman", "female"].includes(String(user.gender || "").trim().toLowerCase())) {
      throw new Error("Sheroes is available only for profiles set to Woman.");
    }
    const uid = user.uid || user.email;
    mockMembers.add(uid);
    notifyMembership(uid);
  },
  subscribePosts(callback) {
    postListeners.add(callback);
    callback([...posts]);
    return () => postListeners.delete(callback);
  },
  subscribeChallenges(callback) {
    challengeListeners.add(callback);
    callback([...challenges]);
    return () => challengeListeners.delete(callback);
  },
  subscribeParticipant(challengeId, uid, onMine, onLeaders) {
    const id = String(challengeId);
    if (!participantListeners.has(id)) participantListeners.set(id, new Set());
    const listener = { uid, onMine, onLeaders };
    participantListeners.get(id).add(listener);
    notifyParticipants(id);
    return () => {
      participantListeners.get(id)?.delete(listener);
      if (!participantListeners.get(id)?.size) participantListeners.delete(id);
    };
  },
  async createPost(user, data) {
    const text = validatePostText(data.text, !!data.imageFile);
    const post = {
      id: `sheroes-${Date.now()}`,
      authorId: user.uid || user.email,
      author: user.name,
      text,
      category: data.category || "Daily moment",
      createdAt: new Date().toISOString(),
      imageUrl: data.imageFile ? URL.createObjectURL(data.imageFile) : "",
      likes: 0,
      likedBy: [],
      comments: [],
    };
    posts = [post, ...posts];
    notify(postListeners, [...posts]);
    return post;
  },
  async toggleLike(postId, uid) {
    posts = posts.map((post) => {
      if (String(post.id) !== String(postId)) return post;
      const likedBy = new Set(post.likedBy);
      if (likedBy.has(uid)) likedBy.delete(uid);
      else likedBy.add(uid);
      return { ...post, likedBy: [...likedBy], likes: likedBy.size };
    });
    notify(postListeners, [...posts]);
  },
  async addComment(postId, user, text) {
    const comment = text.trim();
    if (!comment || comment.length > 500) throw new Error("Write a comment of 1–500 characters.");
    posts = posts.map((post) => (String(post.id) === String(postId)
      ? { ...post, comments: [...post.comments, { author: user.name, text: comment }] }
      : post));
    notify(postListeners, [...posts]);
  },
  async createChallenge(user, data) {
    const { title, description, activity, target } = validateChallenge(data);
    const challenge = {
      id: `sheroes-${Date.now()}`,
      title,
      description,
      activity,
      target,
      startDate: data.startDate,
      endDate: data.endDate,
      ownerId: user.uid || user.email,
      owner: user.name,
      participantCount: 0,
    };
    challenges = [challenge, ...challenges];
    notify(challengeListeners, [...challenges]);
    return challenge;
  },
  async joinChallenge(challengeId, user) {
    const challenge = challenges.find((item) => String(item.id) === String(challengeId));
    if (!challenge) throw new Error("This challenge is no longer available.");
    const uid = user.uid || user.email;
    const items = participants[String(challengeId)] || [];
    if (items.some((item) => item.uid === uid)) return;
    participants[String(challengeId)] = [...items, { uid, name: user.name, progress: 0 }];
    challenges = challenges.map((item) => (String(item.id) === String(challengeId)
      ? { ...item, participantCount: item.participantCount + 1 }
      : item));
    notify(challengeListeners, [...challenges]);
    notifyParticipants(challengeId);
  },
  async updateProgress(challengeId, user, progress) {
    const value = Number(progress);
    if (!Number.isInteger(value) || value < 0 || value > 1000000) throw new Error("Progress must be a whole number between 0 and 1,000,000.");
    const uid = user.uid || user.email;
    const items = participants[String(challengeId)] || [];
    if (!items.some((item) => item.uid === uid)) throw new Error("Join this challenge before updating your progress.");
    participants[String(challengeId)] = items.map((item) => (item.uid === uid ? { ...item, progress: value } : item));
    notifyParticipants(challengeId);
  },
};

const real = {
  subscribeMembership(uid, callback, onError) {
    const { db } = getFirebase();
    return onSnapshot(doc(db, "sheroesMembers", uid), (snapshot) => callback(snapshot.exists()), onError);
  },
  async enableMembership(user) {
    if (!["woman", "female"].includes(String(user.gender || "").trim().toLowerCase())) {
      throw new Error("Sheroes is available only for profiles set to Woman.");
    }
    const { db } = getFirebase();
    const memberRef = doc(db, "sheroesMembers", user.uid);
    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(memberRef);
      if (!snapshot.exists()) {
        transaction.set(memberRef, {
          uid: user.uid,
          name: user.name,
          joinedAt: serverTimestamp(),
        });
      }
    });
  },
  subscribePosts(callback, onError) {
    const { db } = getFirebase();
    const postsQuery = query(collection(db, "sheroesPosts"), orderBy("createdAt", "desc"));
    return onSnapshot(postsQuery, (snapshot) => callback(snapshot.docs.map(postFromDocument)), onError);
  },
  subscribeChallenges(callback, onError) {
    const { db } = getFirebase();
    const challengesQuery = query(collection(db, "sheroesChallenges"), orderBy("createdAt", "desc"));
    return onSnapshot(challengesQuery, (snapshot) => callback(snapshot.docs.map(challengeFromDocument)), onError);
  },
  subscribeParticipant(challengeId, uid, onMine, onLeaders, onError) {
    const { db } = getFirebase();
    const participantsRef = collection(db, "sheroesChallenges", String(challengeId), "participants");
    const unsubs = [
      onSnapshot(doc(participantsRef, uid), (snapshot) => onMine(snapshot.exists() ? { uid: snapshot.id, ...snapshot.data() } : null), onError),
      onSnapshot(query(participantsRef, orderBy("progress", "desc"), limit(5)), (snapshot) => {
        onLeaders(snapshot.docs.map((item) => ({ uid: item.id, ...item.data() })));
      }, onError),
    ];
    return () => unsubs.forEach((unsubscribe) => unsubscribe());
  },
  async createPost(user, data) {
    const { db, storage } = getFirebase();
    const text = validatePostText(data.text, !!data.imageFile);
    const postRef = doc(collection(db, "sheroesPosts"));
    const uploadedRefs = [];
    try {
      let imageUrl = "";
      let imagePath = "";
      if (data.imageFile) {
        const { imageFile } = data;
        if (!/^image\//.test(imageFile.type) || imageFile.size > 10 * 1024 * 1024) {
          throw new Error("Sheroes images must be no larger than 10 MB.");
        }
        const safeName = imageFile.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100) || "photo";
        const fileName = `${Date.now()}-${safeName}`;
        imagePath = `sheroes-posts/${user.uid}/${postRef.id}/${fileName}`;
        const storageRef = ref(storage, imagePath);
        await uploadBytes(storageRef, imageFile, { contentType: imageFile.type });
        uploadedRefs.push(storageRef);
        imageUrl = await getDownloadURL(storageRef);
      }
      await setDoc(postRef, {
        authorId: user.uid,
        author: user.name,
        text,
        category: data.category || "Daily moment",
        imageUrl,
        imagePath,
        likes: 0,
        likedBy: [],
        comments: [],
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      const cleanupErrors = [];
      for (const storageRef of uploadedRefs) {
        try { await deleteObject(storageRef); }
        catch (cleanupError) { cleanupErrors.push(cleanupError); }
      }
      if (cleanupErrors.length) {
        throw new Error(`${error.message} Also, ${cleanupErrors.length} uploaded image file(s) could not be cleaned up.`);
      }
      throw error;
    }
  },
  async toggleLike(postId, uid) {
    const { db } = getFirebase();
    const postRef = doc(db, "sheroesPosts", String(postId));
    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(postRef);
      if (!snapshot.exists()) throw new Error("This post is no longer available.");
      const likedBy = new Set(Array.isArray(snapshot.data().likedBy) ? snapshot.data().likedBy : []);
      if (likedBy.has(uid)) likedBy.delete(uid);
      else likedBy.add(uid);
      const next = [...likedBy];
      transaction.update(postRef, { likedBy: next, likes: next.length });
    });
  },
  async addComment(postId, user, text) {
    const { db } = getFirebase();
    const commentText = text.trim();
    if (!commentText || commentText.length > 500) throw new Error("Write a comment of 1–500 characters.");
    const postRef = doc(db, "sheroesPosts", String(postId));
    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(postRef);
      if (!snapshot.exists()) throw new Error("This post is no longer available.");
      const comments = Array.isArray(snapshot.data().comments) ? snapshot.data().comments : [];
      transaction.update(postRef, { comments: [...comments, { author: user.name, text: commentText }] });
    });
  },
  async createChallenge(user, data) {
    const { db } = getFirebase();
    const { title, description, activity, target } = validateChallenge(data);
    const challengeRef = doc(collection(db, "sheroesChallenges"));
    await setDoc(challengeRef, {
      title,
      description,
      activity,
      target,
      startDate: data.startDate,
      endDate: data.endDate,
      ownerId: user.uid,
      owner: user.name,
      participantCount: 0,
      createdAt: serverTimestamp(),
    });
  },
  async joinChallenge(challengeId, user) {
    const { db } = getFirebase();
    const challengeRef = doc(db, "sheroesChallenges", String(challengeId));
    const participantRef = doc(challengeRef, "participants", user.uid);
    await runTransaction(db, async (transaction) => {
      const [challengeSnapshot, participantSnapshot] = await Promise.all([
        transaction.get(challengeRef),
        transaction.get(participantRef),
      ]);
      if (!challengeSnapshot.exists()) throw new Error("This challenge is no longer available.");
      if (participantSnapshot.exists()) return;
      const challenge = challengeSnapshot.data();
      if (challenge.endDate < dateInDays(0)) throw new Error("This challenge has already ended.");
      transaction.set(participantRef, {
        userId: user.uid,
        name: user.name,
        progress: 0,
        joinedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      transaction.update(challengeRef, { participantCount: (Number(challenge.participantCount) || 0) + 1 });
    });
  },
  async updateProgress(challengeId, user, progress) {
    const { db } = getFirebase();
    const value = Number(progress);
    if (!Number.isInteger(value) || value < 0 || value > 1000000) throw new Error("Progress must be a whole number between 0 and 1,000,000.");
    const participantRef = doc(db, "sheroesChallenges", String(challengeId), "participants", user.uid);
    await updateDoc(participantRef, { progress: value, updatedAt: serverTimestamp() });
  },
};

export const sheroesService = USE_MOCK ? mock : real;
