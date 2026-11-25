import { EmailAuthProvider, createUserWithEmailAndPassword, deleteUser, onAuthStateChanged, reauthenticateWithCredential, signInWithEmailAndPassword, signOut, updatePassword, updateProfile } from "firebase/auth";
import { collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, updateDoc, where } from "firebase/firestore";
import { USE_MOCK } from "./http";
import { LS } from "./storage";
import { DEMO_USER, DEMO_ADMIN } from "../data/seed";
import { DEFAULT_SETTINGS } from "../data/constants";
import { getFirebase } from "./firebase";
import { profileFromDocument, profilePatch } from "./firebaseModels";

const DEMOS = [DEMO_USER, DEMO_ADMIN];
const safe = (u) => { if (!u) return null; const { pw, ...rest } = u; return rest; };
const pendingSignups = new Set();

const mock = {
  async restoreSession() {
    const email = LS.get("ms_session", "");
    if (!email) return null;
    return safe(LS.get("ms_users", []).find((u) => u.email === email));
  },
  async login(email, password) {
    const e = email.trim().toLowerCase();
    const users = LS.get("ms_users", []);
    const demo = DEMOS.find((d) => d.email === e);
    let u = users.find((x) => x.email === e) || demo || null;
    if (u && demo) u = { ...u, admin: !!demo.admin, role: demo.role };
    if (!u) throw new Error("No account found for this email. Please sign up first.");
    if (u.pw !== password) throw new Error("Incorrect password. Please try again.");
    LS.set("ms_users", users.some((x) => x.email === e) ? users.map((x) => (x.email === e ? u : x)) : [...users, u]);
    LS.set("ms_session", e);
    return safe(u);
  },
  async signup(d) {
    const e = d.email.trim().toLowerCase();
    const users = LS.get("ms_users", []);
    if (users.some((x) => x.email === e) || DEMOS.some((x) => x.email === e))
      throw new Error("An account with this email already exists. Try logging in.");
    const { pw2, terms, ...rest } = d;
    const nu = { ...rest, email: e, settings: DEFAULT_SETTINGS, pts: 50, badges: ["Newcomer"], stamps: [] };
    LS.set("ms_users", [...users, nu]);
    LS.set("ms_session", e);
    return safe(nu);
  },
  async logout() { LS.set("ms_session", ""); },
  async updateUser(email, patch) {
    const users = LS.get("ms_users", []).map((u) => (u.email === email ? { ...u, ...patch } : u));
    LS.set("ms_users", users);
    return safe(users.find((u) => u.email === email));
  },
  async changePassword(email, current, next) {
    const users = LS.get("ms_users", []);
    const u = users.find((x) => x.email === email);
    if (!u || u.pw !== current) throw new Error("Current password is incorrect");
    LS.set("ms_users", users.map((x) => (x.email === email ? { ...x, pw: next } : x)));
  },
  async deleteAccount(email) {
    LS.set("ms_users", LS.get("ms_users", []).filter((x) => x.email !== email));
    LS.set("ms_session", "");
  },
  async exportData(email) {
    return safe(LS.get("ms_users", []).find((u) => u.email === email));
  },
};

async function loadProfile(firebaseUser) {
  const { db } = getFirebase();
  const profileSnapshot = await getDoc(doc(db, "users", firebaseUser.uid));
  if (!profileSnapshot.exists()) {
    throw new Error("Your account profile is missing. Please contact support before continuing.");
  }
  return profileFromDocument(firebaseUser.uid, profileSnapshot.data());
}

const real = {
  subscribe(onUser, onError) {
    const { auth } = getFirebase();
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        onUser(null);
        return;
      }
      if (pendingSignups.has(firebaseUser.email?.trim().toLowerCase())) return;
      try {
        onUser(await loadProfile(firebaseUser));
      } catch (error) {
        try {
          await signOut(auth);
        } catch (signOutError) {
          onError(new Error(`${error.message} Sign-out also failed: ${signOutError.message}`));
          return;
        }
        onError(error);
      }
    }, onError);
  },
  async login(email, password) {
    const { auth } = getFirebase();
    const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
    try {
      return await loadProfile(credential.user);
    } catch (error) {
      await signOut(auth);
      throw error;
    }
  },
  async signup(data) {
    const { auth, db } = getFirebase();
    const { pw, pw2, terms, ...profile } = data;
    const email = data.email.trim().toLowerCase();
    pendingSignups.add(email);
    let credential;
    try {
      credential = await createUserWithEmailAndPassword(auth, email, pw);
      await updateProfile(credential.user, { displayName: data.name.trim() });
      const newProfile = {
        ...profile,
        uid: credential.user.uid,
        email: credential.user.email,
        points: 50,
        badges: ["Newcomer"],
        stamps: [],
        settings: DEFAULT_SETTINGS,
      };
      await setDoc(doc(db, "users", credential.user.uid), newProfile);
      return profileFromDocument(credential.user.uid, newProfile);
    } catch (error) {
      if (credential?.user) await signOut(auth);
      throw error;
    } finally {
      pendingSignups.delete(email);
    }
  },
  async logout() {
    const { auth } = getFirebase();
    await signOut(auth);
  },
  async updateUser(uid, patch) {
    const { db } = getFirebase();
    const ref = doc(db, "users", uid);
    const update = profilePatch(patch);
    await updateDoc(ref, update);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) throw new Error("The user profile could not be reloaded after saving.");
    return profileFromDocument(uid, snapshot.data());
  },
  async changePassword(email, current, next) {
    const { auth } = getFirebase();
    const firebaseUser = auth.currentUser;
    if (!firebaseUser || !firebaseUser.email) throw new Error("Please sign in again before changing your password.");
    const credential = EmailAuthProvider.credential(firebaseUser.email, current);
    await reauthenticateWithCredential(firebaseUser, credential);
    await updatePassword(firebaseUser, next);
  },
  async deleteAccount(uid) {
    const { auth, db } = getFirebase();
    const firebaseUser = auth.currentUser;
    if (!firebaseUser || firebaseUser.uid !== uid) throw new Error("Your signed-in account could not be verified.");
    const profileRef = doc(db, "users", uid);
    const profile = await getDoc(profileRef);
    if (profile.exists()) await deleteDoc(profileRef);
    try {
      await deleteUser(firebaseUser);
    } catch (error) {
      if (profile.exists()) await setDoc(profileRef, profile.data());
      throw error;
    }
  },
  async exportData(uid) {
    const { db } = getFirebase();
    const profileSnapshot = await getDoc(doc(db, "users", uid));
    if (!profileSnapshot.exists()) throw new Error("Your user profile could not be found.");
    const [postSnapshot, planSnapshot] = await Promise.all([
      getDocs(query(collection(db, "posts"), where("authorId", "==", uid))),
      getDocs(query(collection(db, "plans"), where("hostId", "==", uid))),
    ]);
    return {
      profile: profileFromDocument(uid, profileSnapshot.data()),
      posts: postSnapshot.docs.map((item) => ({ id: item.id, ...item.data() })),
      hostedPlans: planSnapshot.docs.map((item) => ({ id: item.id, ...item.data() })),
    };
  },
};

export const authService = USE_MOCK ? {
  ...mock,
  subscribe(onUser, onError) {
    mock.restoreSession().then(onUser).catch(onError);
    return () => {};
  },
} : real;
