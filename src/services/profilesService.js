import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { PEOPLE } from "../data/constants";
import { USE_MOCK } from "./http";
import { getFirebase } from "./firebase";

const mock = {
  subscribe(_callback) {
    _callback(PEOPLE.map(([name, office]) => ({ name, office })));
    return () => {};
  },
};

const real = {
  subscribe(callback, onError) {
    const { db } = getFirebase();
    const usersQuery = query(collection(db, "users"), orderBy("name"));
    return onSnapshot(usersQuery, (snapshot) => {
      callback(snapshot.docs.map((item) => ({
        uid: item.id,
        name: item.data().name || "User",
        office: item.data().office || "",
      })));
    }, onError);
  },
};

export const profilesService = USE_MOCK ? mock : real;
