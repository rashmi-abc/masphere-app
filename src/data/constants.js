export const CATS = ["Travel", "Food", "Books", "Movies", "Fitness", "Games", "Music", "Photography", "Tech"];
export const PCATS = ["Weekend trip", "Movie", "Sports", "Restaurant", "Trekking", "Lunch", "Gaming", "Book club"];
export const PK = {
  "Weekend trip": "Travel", Movie: "Movies", Sports: "Fitness", Restaurant: "Food",
  Trekking: "Fitness", Lunch: "Food", Gaming: "Games", "Book club": "Books",
};
export const OFFICES = ["Mumbai", "Chennai", "Ahmedabad", "Bengaluru", "Pune", "Other"];
export const DEPTS = [
  "Engineering", "Cloud & DevOps", "Quality Assurance", "Data & Analytics", "Product & Design",
  "Delivery / PMO", "HR & People", "Finance", "Sales & Marketing", "Other",
];
export const GOALS = [
  "Find travel buddies", "Meet for food & lunches", "Join sports & fitness",
  "Book & movie clubs", "Make friends outside my team", "Host my own plans",
];
export const LOCS = [
  "Mastek Mumbai Office", "Mastek Chennai Office", "Mastek Ahmedabad Campus",
  "Goa", "Lonavala", "Jaipur", "Hampi",
];
export const PEOPLE = [
  ["Priya Nair", "Chennai"], ["Aisha Kapoor", "Mumbai"], ["Vikram Desai", "Ahmedabad"], ["Rohan Mehta", "Ahmedabad"],
  ["Neha Iyer", "Chennai"], ["Karan Shah", "Mumbai"], ["Meera Pillai", "Bengaluru"], ["Arjun Verma", "Pune"],
];

export const DEFAULT_SETTINGS = {
  vis: "Everyone at Mastek", showPlans: true, showLoc: true, showRank: true, showScores: true, online: true, tagPerm: "Everyone",
  n_req: true, n_com: true, n_like: true, n_rem: true, n_push: true, n_email: false, n_digest: "Weekly",
  theme: "system", lang: "English", autoplay: true, timefmt: "12-hour",
};

export const SETTINGS_TABS = [
  ["account", "Account", "user"], ["profile", "Profile", "image"], ["privacy", "Privacy", "lock"],
  ["notif", "Notifications", "bell"], ["look", "Appearance", "moon"], ["interests", "Interests", "heart"],
  ["data", "Data & security", "shield"],
];
