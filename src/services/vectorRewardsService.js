import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { USE_MOCK } from "./http";
import { getFirebase } from "./firebase";
import { LS } from "./storage";
import { HISTORY, LEADERS, RULES } from "../data/modules";

const RULE_KEY = "ms_vector_rules";
const AWARD_KEY = "ms_vector_awards";
const ruleListeners = new Set();
const awardListeners = new Set();

function notify(listeners, value) {
  listeners.forEach((callback) => callback(value));
}

export const VECTOR_BADGES = {
  V: "Value",
  E: "Empowerment",
  C: "Collaboration",
  T: "Trust",
  O: "Ownership",
  R: "Responsibility",
};

export function vectorScoreBadges(vector = {}, existing = []) {
  const badges = new Set(Array.isArray(existing) ? existing : []);
  Object.entries(VECTOR_BADGES).forEach(([key, name]) => {
    const score = Number(vector[key]) || 0;
    if (score >= 100) badges.add(`${name} Achiever`);
    if (score >= 150) badges.add(`${name} Leader`);
    if (score >= 200) badges.add(`${name} Champion`);
  });
  return [...badges];
}

function pendingAwards() {
  return LS.get(AWARD_KEY, []);
}

const mock = {
  subscribeRules(callback) {
    ruleListeners.add(callback);
    const rules = LS.get(RULE_KEY, RULES);
    callback([...rules]);
    return () => ruleListeners.delete(callback);
  },
  async saveRule(rule) {
    const rules = LS.get(RULE_KEY, RULES).map((item) => {
      const key = item.id || item.a || item.action;
      return key === (rule.id || rule.a || rule.action) ? {
        ...item,
        id: rule.id,
        a: rule.action || rule.a,
        v: rule.value || rule.v,
        p: Number(rule.points ?? rule.p),
        action: rule.action || rule.a,
        value: rule.value || rule.v,
        points: Number(rule.points ?? rule.p),
        cap: rule.cap,
        review: rule.review,
      } : item;
    });
    LS.set(RULE_KEY, rules);
    notify(ruleListeners, rules);
  },
  async addRule(rule) {
    const rules = LS.get(RULE_KEY, RULES);
    const next = [...rules, {
      id: `rule-${Date.now()}`,
      a: rule.action,
      v: rule.value,
      p: Number(rule.points),
      action: rule.action,
      value: rule.value,
      points: Number(rule.points),
      cap: rule.cap,
      review: rule.review,
    }];
    LS.set(RULE_KEY, next);
    notify(ruleListeners, next);
  },
  subscribeAwards(callback) {
    awardListeners.add(callback);
    callback(pendingAwards());
    return () => awardListeners.delete(callback);
  },
  subscribeUserAwards(uid, callback) {
    const update = () => callback(pendingAwards().filter((award) =>
      award.recipientUid === uid || award.recipientName === uid
    ));
    awardListeners.add(update);
    update();
    return () => awardListeners.delete(update);
  },
  async submitEventParticipation(user, event) {
    const existing = pendingAwards();
    if (existing.some((award) =>
      award.recipientUid === (user.uid || user.email)
      && String(award.eventId) === String(event.id)
    )) return;
    const record = {
      id: `event-${event.id}-${user.uid || user.email}`,
      recipientUid: user.uid || user.email,
      recipientName: user.name,
      activity: event.title,
      eventId: String(event.id),
      eventTitle: event.title,
      eventDate: event.date,
      value: "",
      points: 0,
      status: "Pending review",
      submittedAt: new Date().toISOString(),
      submittedBy: user.name,
    };
    LS.set(AWARD_KEY, [record, ...existing]);
    notify(awardListeners, [record, ...existing]);
  },
  async assignAward(admin, award) {
    const value = String(award.value || "V").charAt(0).toUpperCase();
    const points = Number(award.points);
    if (!Number.isInteger(points) || points < 1 || points > 1000) throw new Error("Points must be between 1 and 1000.");
    if (!award.recipientName || !award.activity) throw new Error("Choose an employee and enter an activity.");
    const existing = pendingAwards();
    const record = {
      id: `award-${Date.now()}`,
      recipientUid: award.recipientUid || award.recipientName,
      recipientName: award.recipientName,
      activity: award.activity,
      value,
      points,
      status: "Approved",
      submittedAt: new Date().toISOString().slice(0, 10),
      submittedBy: admin.name,
      approvedBy: admin.name,
      approvedAt: new Date().toISOString(),
    };
    LS.set(AWARD_KEY, [record, ...existing]);
    const users = LS.get("ms_users", []);
    const targetIndex = users.findIndex((item) => item.name === award.recipientName);
    if (targetIndex >= 0) {
      const target = users[targetIndex];
      const vector = { ...(target.vector || {}) };
      vector[value] = (Number(vector[value]) || 0) + points;
      const badges = vectorScoreBadges(vector, target.badges);
      users[targetIndex] = { ...target, points: (Number(target.points) || 0) + points, vector, badges };
      LS.set("ms_users", users);
    }
    notify(awardListeners, [record, ...existing]);
    window.dispatchEvent(new CustomEvent("ms-vector-update"));
  },
  async reviewAward(admin, awardId, status, value = "", points = 0) {
    const targetAward = pendingAwards().find((award) => award.id === awardId);
    const awards = pendingAwards().map((award) => award.id === awardId
      ? {
        ...award,
        status,
        value: status === "Approved" ? String(value || award.value || "V").charAt(0).toUpperCase() : award.value,
        points: status === "Approved" ? Number(points) || 0 : award.points,
        reviewedBy: admin.name,
        reviewedAt: new Date().toISOString(),
      }
      : award);
    LS.set(AWARD_KEY, awards);
    if (status === "Approved" && targetAward && targetAward.status !== "Approved") {
      const users = LS.get("ms_users", []);
      const targetIndex = users.findIndex((item) => item.name === targetAward.recipientName);
      if (targetIndex >= 0) {
        const target = users[targetIndex];
        const vector = { ...(target.vector || {}) };
        const key = String(value || targetAward.value || "V").charAt(0).toUpperCase();
        const approvedPoints = Number(points) || 0;
        vector[key] = (Number(vector[key]) || 0) + approvedPoints;
        const badges = vectorScoreBadges(vector, target.badges);
        users[targetIndex] = { ...target, points: (Number(target.points) || 0) + approvedPoints, vector, badges };
        LS.set("ms_users", users);
      }
    }
    notify(awardListeners, awards);
    window.dispatchEvent(new CustomEvent("ms-vector-update"));
  },
};

const real = {
  subscribeRules(callback, onError) {
    const { db } = getFirebase();
    return onSnapshot(query(collection(db, "vectorRules"), orderBy("action")), (snapshot) =>
      callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))), onError);
  },
  async saveRule(rule) {
    const { db } = getFirebase();
    const ref = rule.id ? doc(db, "vectorRules", rule.id) : doc(collection(db, "vectorRules"));
    await setDoc(ref, {
      action: rule.action || rule.a,
      value: rule.value || rule.v,
      points: Number(rule.points ?? rule.p),
      cap: rule.cap,
      review: rule.review,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  },
  async addRule(rule) {
    await real.saveRule(rule);
  },
  subscribeAwards(callback, onError) {
    const { db } = getFirebase();
    return onSnapshot(query(collection(db, "vectorAwards"), orderBy("submittedAt", "desc")), (snapshot) =>
      callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))), onError);
  },
  subscribeUserAwards(uid, callback, onError) {
    const { db } = getFirebase();
    return onSnapshot(query(collection(db, "vectorAwards"), orderBy("submittedAt", "desc")), (snapshot) =>
      callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
        .filter((award) => award.recipientUid === uid)), onError);
  },
  async submitEventParticipation(user, event) {
    const { db } = getFirebase();
    const awardRef = doc(db, "vectorAwards", `event-${event.id}-${user.uid}`);
    await runTransaction(db, async (transaction) => {
      const existing = await transaction.get(awardRef);
      if (existing.exists()) return;
      transaction.set(awardRef, {
        recipientUid: user.uid,
        recipientName: user.name,
        activity: event.title,
        eventId: String(event.id),
        eventTitle: event.title,
        eventDate: event.date,
        value: "",
        points: 0,
        status: "Pending review",
        submittedAt: serverTimestamp(),
        submittedBy: user.name,
      });
    });
  },
  async assignAward(admin, award) {
    const { db } = getFirebase();
    const points = Number(award.points);
    if (!Number.isInteger(points) || points < 1 || points > 1000) throw new Error("Points must be between 1 and 1000.");
    if (!award.recipientUid || !award.recipientName || !award.activity) throw new Error("Choose an employee and enter an activity.");
    const awardRef = doc(collection(db, "vectorAwards"));
    const profileRef = doc(db, "users", award.recipientUid);
    await runTransaction(db, async (transaction) => {
      const profile = await transaction.get(profileRef);
      if (!profile.exists()) throw new Error("The selected employee profile could not be found.");
      const data = profile.data();
      const vector = { ...(data.vector || {}) };
      const key = String(award.value || "V").charAt(0).toUpperCase();
      vector[key] = (Number(vector[key]) || 0) + points;
      const badges = vectorScoreBadges(vector, data.badges);
      transaction.update(profileRef, {
        points: (Number(data.points) || 0) + points,
        vector,
        badges,
      });
      transaction.set(awardRef, {
        recipientUid: award.recipientUid,
        recipientName: award.recipientName,
        activity: award.activity,
        value: key,
        points,
        status: "Approved",
        submittedAt: serverTimestamp(),
        submittedBy: admin.name,
        approvedBy: admin.name,
        approvedAt: serverTimestamp(),
      });
    });
  },
  async reviewAward(admin, awardId, status, value = "", points = 0) {
    const { db } = getFirebase();
    const awardRef = doc(db, "vectorAwards", awardId);
    await runTransaction(db, async (transaction) => {
      const awardSnapshot = await transaction.get(awardRef);
      if (!awardSnapshot.exists()) throw new Error("The reward record could not be found.");
      const award = awardSnapshot.data();
      if (award.status !== "Approved" && status === "Approved" && award.recipientUid) {
        const profileRef = doc(db, "users", award.recipientUid);
        const profileSnapshot = await transaction.get(profileRef);
        if (!profileSnapshot.exists()) throw new Error("The selected employee profile could not be found.");
        const profile = profileSnapshot.data();
        const vector = { ...(profile.vector || {}) };
        const key = String(value || award.value || "V").charAt(0).toUpperCase();
        const approvedPoints = Number(points) || Number(award.points) || 0;
        vector[key] = (Number(vector[key]) || 0) + approvedPoints;
        const badges = vectorScoreBadges(vector, profile.badges);
        transaction.update(profileRef, {
          points: (Number(profile.points) || 0) + approvedPoints,
          vector,
          badges,
        });
      }
      transaction.update(awardRef, {
        status,
        value: status === "Approved" ? String(value || award.value || "V").charAt(0).toUpperCase() : award.value,
        points: status === "Approved" ? Number(points) || Number(award.points) || 0 : award.points,
        reviewedBy: admin.name,
        reviewedAt: serverTimestamp(),
      });
    });
  },
};

export const vectorRewardsService = USE_MOCK ? mock : real;
