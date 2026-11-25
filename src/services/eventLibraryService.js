import { collection, deleteDoc, doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { USE_MOCK } from "./http";
import { LS } from "./storage";
import { getFirebase } from "./firebase";

const eventCollections = { saved: "savedEvents", calendar: "calendarEvents" };
const mockKey = (uid, type) => `ms_${eventCollections[type]}_${encodeURIComponent(uid)}`;

function eventSnapshot(event) {
  return {
    id: String(event.id),
    title: event.title || "",
    cat: event.cat || "",
    date: event.date || "",
    time: event.time || "",
    offices: Array.isArray(event.offices) ? event.offices : [],
    venue: event.venue || "",
    org: event.org || "",
    desc: event.desc || "",
    reg: !!event.reg,
    deadline: event.deadline || "",
    st: event.st || "",
  };
}

const mock = {
  subscribe(uid, onSaved, onCalendar) {
    onSaved(LS.get(mockKey(uid, "saved"), []));
    onCalendar(LS.get(mockKey(uid, "calendar"), []));
    return () => {};
  },
  async add(uid, type, event) {
    const key = mockKey(uid, type);
    const existing = LS.get(key, []);
    const item = eventSnapshot(event);
    const next = existing.some((saved) => String(saved.id) === item.id)
      ? existing
      : [...existing, item];
    LS.set(key, next);
    return next;
  },
  async remove(uid, type, eventId) {
    const key = mockKey(uid, type);
    const next = LS.get(key, []).filter((event) => String(event.id) !== String(eventId));
    LS.set(key, next);
    return next;
  },
};

const real = {
  subscribe(uid, onSaved, onCalendar, onError) {
    const { db } = getFirebase();
    const savedRef = collection(db, "users", uid, eventCollections.saved);
    const calendarRef = collection(db, "users", uid, eventCollections.calendar);
    const unsubscribeSaved = onSnapshot(savedRef, (snapshot) => {
      onSaved(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
    }, onError);
    const unsubscribeCalendar = onSnapshot(calendarRef, (snapshot) => {
      onCalendar(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
    }, onError);
    return () => {
      unsubscribeSaved();
      unsubscribeCalendar();
    };
  },
  async add(uid, type, event) {
    const collectionName = eventCollections[type];
    if (!collectionName) throw new Error("Choose bookmarks or your calendar.");
    const { db } = getFirebase();
    const item = eventSnapshot(event);
    await setDoc(doc(db, "users", uid, collectionName, item.id), {
      ...item,
      savedAt: serverTimestamp(),
    });
  },
  async remove(uid, type, eventId) {
    const collectionName = eventCollections[type];
    if (!collectionName) throw new Error("Choose bookmarks or your calendar.");
    const { db } = getFirebase();
    await deleteDoc(doc(db, "users", uid, collectionName, String(eventId)));
  },
};

export const eventLibraryService = USE_MOCK ? mock : real;
