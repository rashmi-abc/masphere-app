import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { PEOPLE } from "../data/constants";
import { LEADERS } from "../data/modules";
import { LS } from "./storage";
import { USE_MOCK } from "./http";
import { getFirebase } from "./firebase";

const mock = {
  subscribe(_callback) {
    const update = () => {
    const users = LS.get("ms_users", []);
    _callback(PEOPLE.map(([name, office], index) => {
      const saved = users.find((item) => item.name === name);
      return {
      uid: `demo-${name.toLowerCase().replace(/[^a-z]+/g, "-")}`,
      name,
      office,
      dept: ["Engineering", "Product & Design", "Cloud & DevOps", "Data & Analytics"][index % 4],
      team: ["Engineering", "Product & Design", "Cloud & DevOps", "Data & Analytics"][index % 4],
      points: Number(saved?.points) || LEADERS[index]?.pts || 300 + index * 20,
      vector: saved?.vector || {},
      badges: saved?.badges?.length || LEADERS[index]?.badges || 2,
      };
    }));
    };
    update();
    window.addEventListener("ms-vector-update", update);
    return () => window.removeEventListener("ms-vector-update", update);
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
        dept: item.data().dept || "",
        team: item.data().dept || "",
        points: Number(item.data().points) || 0,
        vector: item.data().vector || {},
        badges: Array.isArray(item.data().badges) ? item.data().badges.length : 0,
      })));
    }, onError);
  },
};

export const profilesService = USE_MOCK ? mock : real;
