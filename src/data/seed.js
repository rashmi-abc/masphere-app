import { DEFAULT_SETTINGS } from "./constants";
import atomicHabits from "../assets/atomic-habits.png";
import palolemSunrise from "../assets/palolem-sunrise.jpg";

// Demo data used ONLY by the mock services. Remove once the backend is live.
export const DEMO_USER = {
  email: "ananya.rao@mastek.com", pw: "demo1234", name: "Ananya Rao", empId: "MT10482",
  gender: "Woman",
  role: "Software Engineer", dept: "Cloud & DevOps", office: "Mumbai", phone: "",
  bio: "Cloud engineer by day, weekend trekker by choice.",
  interests: ["Travel", "Books", "Fitness"], goals: ["Find travel buddies", "Host my own plans"],
  settings: DEFAULT_SETTINGS, admin: false, vector: { V: 120, E: 85, C: 140, T: 60, O: 95, R: 70 }, pts: 120, badges: ["Early Explorer"], stamps: ["Jaipur", "Hampi"],
};

// Second demo login: can publish events and open the Admin Console.
export const DEMO_ADMIN = {
  email: "meera.pillai@mastek.com", pw: "admin1234", name: "Meera Pillai", empId: "MT10001",
  gender: "Woman",
  role: "HR & Events Admin", dept: "HR & People", office: "Mumbai", phone: "",
  bio: "Organising events across Mastek offices.",
  interests: ["Books", "Music", "Food"], goals: ["Host my own plans"],
  settings: DEFAULT_SETTINGS, admin: true, vector: { V: 80, E: 110, C: 95, T: 70, O: 120, R: 85 }, pts: 90, badges: ["Organiser"], stamps: [],
};

export const SEED_POSTS = [
  { id: 1, by: "Priya Nair", o: "Chennai", k: "Books", x: "Finished Atomic Habits this week. Tiny changes really do add up. Highly recommend it for anyone starting the year fresh.", loc: "Chennai", tags: [], media: [{ type: "image", src: atomicHabits }], ts: "2h", vals: ["V","E"], likes: 24, cm: [["Neha Iyer", "Adding it to my list!"]] },
  { id: 2, by: "Aisha Kapoor", o: "Mumbai", k: "Travel", x: "Palolem at sunrise is unreal. Kayaking was the highlight. Planning a Goa weekend, details are in Plans.", loc: "Palolem, Goa", tags: ["Karan Shah"], media: [{ type: "image", src: palolemSunrise }], ts: "5h", vals: ["C"], likes: 41, cm: [["Karan Shah", "Take the Old Goa route too."]] },
  { id: 3, by: "Vikram Desai", o: "Ahmedabad", k: "Food", x: "Found the best Gujarati thali near the Ahmedabad campus. Vegetarian-friendly and under ₹300.", loc: "Ahmedabad", tags: [], ts: "1d", vals: ["V"], likes: 18, cm: [] },
  { id: 4, by: "Rohan Mehta", o: "Ahmedabad", k: "Games", x: "Catan night was chaos. Who wants a rematch?", loc: "", tags: ["Priya Nair"], ts: "2d", vals: ["C","T"], likes: 12, cm: [["Priya Nair", "Count me in."]] },
];

export const SEED_PLANS = [
  { id: 1, t: "Lonavala Monsoon Trek", cat: "Trekking", k: "Fitness", city: "Mumbai", host: "Rohan Mehta", loc: "Lonavala", d: "2026-11-07", tm: "06:30", bud: "800", max: 15, mode: "Group", desc: "Easy-moderate trek, 5 hours round trip. Bring water and good shoes.", st: "none" },
  { id: 2, t: "Friday Lunch at Third Wave", cat: "Lunch", k: "Food", city: "Chennai", host: "Priya Nair", loc: "Chennai", d: "2026-11-06", tm: "13:00", bud: "400", max: 8, mode: "Group", desc: "Casual lunch, great coffee. All teams welcome.", st: "none" },
  { id: 3, t: "Sunday Indie Screening", cat: "Movie", k: "Movies", city: "Ahmedabad", host: "Vikram Desai", loc: "Ahmedabad", d: "2026-11-08", tm: "17:00", bud: "250", max: 10, mode: "Group", desc: "Small indie film followed by a chat over chai.", st: "none" },
];
