import { arrayRemove, arrayUnion, collection, deleteDoc, doc, onSnapshot, runTransaction, serverTimestamp, setDoc } from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { USE_MOCK } from "./http";
import { SEED_POSTS } from "../data/seed";
import { getFirebase } from "./firebase";
import { commentsForUi, relativeTime } from "./firebaseModels";

let store = [...SEED_POSTS];

const mock = {
  async list() { return [...store]; },
  async create(user, data) {
    const post = {
      id: Date.now(), by: user.name, o: user.office, k: data.category || "General",
      media: data.media.map(({ type, src }) => ({ type, src })),
      x: data.text, loc: data.location, tags: data.tags, vals: data.vals || [],
      ts: "Just now", likes: 0, cm: [], noc: data.commentsOff,
    };
    store = [post, ...store];
    return post;
  },
  async remove(id) { store = store.filter((post) => String(post.id) !== String(id)); },
  async toggleLike() {},
  async toggleSave() {},
  async addComment(id, user, text) {
    store = store.map((post) => (String(post.id) === String(id)
      ? { ...post, cm: [...post.cm, [user.name, text]] }
      : post));
  },
};

function postFromDocument(snapshot, uid) {
  const data = snapshot.data();
  const media = Array.isArray(data.media) ? data.media.map((item) => ({
    type: item.isVideo ? "video" : "image",
    src: item.path,
    path: item.path,
  })) : [];
  return {
    id: snapshot.id,
    authorId: data.authorId,
    by: data.author || "Unknown",
    o: data.office || "",
    k: data.category || "",
    x: data.text || "",
    loc: data.location || "",
    tags: Array.isArray(data.tags) ? data.tags : [],
    vals: Array.isArray(data.vals) ? data.vals : [],
    ts: relativeTime(data.createdAt),
    createdAt: data.createdAt,
    likes: Number.isFinite(data.likes) ? data.likes : 0,
    likedBy: Array.isArray(data.likedBy) ? data.likedBy : [],
    liked: Array.isArray(data.likedBy) && data.likedBy.includes(uid),
    cm: commentsForUi(data.comments),
    noc: !!data.commentsOff,
    media,
  };
}

const real = {
  subscribe(uid, onPosts, onError) {
    const { db } = getFirebase();
    return onSnapshot(collection(db, "posts"), (snapshot) => {
      const posts = snapshot.docs.map((item) => postFromDocument(item, uid));
      posts.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });
      onPosts(posts);
    }, onError);
  },
  async create(user, data) {
    const { db, storage } = getFirebase();
    const postRef = doc(collection(db, "posts"));
    const media = [];
    const uploadedRefs = [];
    try {
      for (const item of data.media) {
        if (!item.file) continue;
        if (!/^(image|video)\//.test(item.file.type) || item.file.size > 50 * 1024 * 1024) {
          throw new Error("Post media must be an image or video no larger than 50 MB.");
        }
        const fileName = `${Date.now()}-${media.length}-${item.file.name.replace(/[\\/]/g, "_")}`;
        const storageRef = ref(storage, `posts/${postRef.id}/${fileName}`);
        await uploadBytes(storageRef, item.file, { contentType: item.file.type });
        uploadedRefs.push(storageRef);
        media.push({ path: await getDownloadURL(storageRef), isVideo: item.type === "video" });
      }
      await setDoc(postRef, {
        authorId: user.uid,
        author: user.name,
        office: user.office || "",
        category: data.category || "",
        text: data.text || "",
        location: data.location || "",
        tags: data.tags || [],
        vals: data.vals || [],
        commentsOff: !!data.commentsOff,
        media,
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
        throw new Error(`${error.message} Also, ${cleanupErrors.length} uploaded media file(s) could not be cleaned up.`);
      }
      throw error;
    }
    return { id: postRef.id };
  },
  async remove(id) {
    const { db, storage } = getFirebase();
    const postRef = doc(db, "posts", String(id));
    const snapshot = await runTransaction(db, async (transaction) => {
      const current = await transaction.get(postRef);
      if (!current.exists()) throw new Error("This post no longer exists.");
      transaction.delete(postRef);
      return current;
    });
    const media = snapshot.data().media || [];
    const cleanupErrors = [];
    for (const item of media) {
      if (!item.path) continue;
      try {
        await deleteObject(ref(storage, item.path));
      } catch (error) {
        cleanupErrors.push(error);
      }
    }
    if (cleanupErrors.length) {
      throw new Error(`The post was deleted, but ${cleanupErrors.length} media file(s) could not be removed from storage.`);
    }
  },
  async toggleLike(id, uid) {
    const { db } = getFirebase();
    const postRef = doc(db, "posts", String(id));
    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(postRef);
      if (!snapshot.exists()) throw new Error("This post no longer exists.");
      const data = snapshot.data();
      const likedBy = Array.isArray(data.likedBy) ? data.likedBy : [];
      const next = new Set(likedBy);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      const users = [...next];
      transaction.update(postRef, { likedBy: users, likes: users.length });
    });
  },
  async toggleSave(id, uid) {
    const { db } = getFirebase();
    const profileRef = doc(db, "users", uid);
    return runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(profileRef);
      if (!snapshot.exists()) throw new Error("Your user profile could not be found.");
      const savedPosts = Array.isArray(snapshot.data().savedPosts) ? snapshot.data().savedPosts : [];
      const next = savedPosts.includes(String(id))
        ? savedPosts.filter((postId) => postId !== String(id))
        : [...savedPosts, String(id)];
      transaction.update(profileRef, {
        savedPosts: savedPosts.includes(String(id)) ? arrayRemove(String(id)) : arrayUnion(String(id)),
      });
      return next;
    });
  },
  async addComment(id, user, text) {
    const { db } = getFirebase();
    const postRef = doc(db, "posts", String(id));
    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(postRef);
      if (!snapshot.exists()) throw new Error("This post no longer exists.");
      const data = snapshot.data();
      if (data.commentsOff) throw new Error("Comments are turned off for this post.");
      const comments = Array.isArray(data.comments) ? data.comments : [];
      transaction.update(postRef, {
        comments: [...comments, { author: user.name, text: text.trim() }],
      });
    });
  },
};

export const postsService = USE_MOCK ? mock : real;
