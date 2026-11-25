export const OPPS = [
  { id: 1, title: "Mastek Innovation Hackathon 2026", type: "Hackathon", scope: "Internal", org: "Digital Labs", date: "2026-12-06", loc: "Hybrid (Mumbai + online)", deadline: "2026-11-28", skills: ["React", "Python", "UX", "GenAI"], size: 5, interested: ["Karan Shah", "Neha Iyer", "Meera Pillai"], team: ["Karan Shah", "Neha Iyer"], desc: "Two-day build sprint. Form a cross-office team and demo a working prototype to the leadership panel.", url: "https://example.com/hackathon", mine: false },
  { id: 2, title: "AWS re:Invent Watch Party", type: "Conference", scope: "External", org: "AWS", date: "2026-12-02", loc: "Online", deadline: "2026-11-25", skills: ["Cloud", "Serverless"], size: 0, interested: ["Arjun Verma", "Priya Nair"], team: [], desc: "Join colleagues to watch keynotes together and share takeaways afterwards.", url: "https://example.com/reinvent", mine: false },
  { id: 3, title: "Product Design Sprint Workshop", type: "Workshop", scope: "Internal", org: "Learning & Development", date: "2026-12-12", loc: "Mumbai Office", deadline: "2026-12-01", skills: ["Design", "Research"], size: 0, interested: ["Aisha Kapoor"], team: [], desc: "A hands-on one-day workshop on running a five-day design sprint.", url: "", mine: false },
  { id: 4, title: "Smart India Hackathon prep", type: "Hackathon", scope: "External", org: "Ministry of Education", date: "2026-12-15", loc: "Pune", deadline: "2026-11-10", skills: ["Java", "Data"], size: 4, interested: ["Rohan Mehta", "Vikram Desai", "Arjun Verma", "Karan Shah"], team: ["Rohan Mehta", "Vikram Desai", "Arjun Verma", "Karan Shah"], desc: "Team is complete and registered.", url: "", mine: false },
];
export const EVENTS = [
  { id: 1, title: "Annual Town Hall", cat: "HR", date: "2026-11-18", time: "16:00", offices: ["All offices"], venue: "Online", org: "HR", desc: "Company update and Q&A with leadership.", reg: true, deadline: "2026-11-17", st: "Published" },
  { id: 2, title: "MPL Season Kick-off", cat: "MPL", date: "2026-11-20", time: "09:00", offices: ["Mumbai", "Pune"], venue: "Mastek Sports Ground", org: "MPL Committee", desc: "Opening matches and team announcements.", reg: true, deadline: "2026-11-19", st: "Published" },
  { id: 3, title: "Sheroes Leadership Talk", cat: "Sheroes", date: "2026-11-20", time: "15:00", offices: ["Chennai"], venue: "Auditorium", org: "Sheroes", desc: "A fireside chat on leading through change.", reg: true, deadline: "2026-11-19", st: "Published" },
  { id: 4, title: "Tech Talk: Platform Engineering", cat: "Technical", date: "2026-11-25", time: "11:00", offices: ["Bengaluru"], venue: "Room 4B", org: "Tech Council", desc: "Internal developer platforms in practice.", reg: false, deadline: "", st: "Published" },
  { id: 5, title: "Year-end Celebration", cat: "Community", date: "2026-11-29", time: "18:00", offices: ["Ahmedabad", "Chennai"], venue: "Offsite", org: "HR", desc: "Dinner, music and awards.", reg: true, deadline: "2026-11-26", st: "Pending approval" },
  { id: 6, title: "Learning Day: Cloud Basics", cat: "Learning", date: "2026-11-24", time: "10:00", offices: ["Mumbai", "Chennai", "Pune"], venue: "Online", org: "L&D", desc: "Intro to cloud for non-engineers.", reg: true, deadline: "2026-11-22", st: "Draft" },
  { id: 7, title: "Diwali Celebration", cat: "Community", date: "2026-11-09", time: "17:00", offices: ["All offices"], venue: "Campus", org: "HR", desc: "Festive lunch and rangoli contest.", reg: false, deadline: "", st: "Published" },
  { id: 8, title: "Sheroes Mentoring Circle", cat: "Sheroes", date: "2026-11-12", time: "14:00", offices: ["Mumbai", "Chennai"], venue: "Online", org: "Sheroes", desc: "Cross-office mentor pairing.", reg: true, deadline: "2026-11-11", st: "Published" },
  { id: 9, title: "Hackathon Kick-off", cat: "Technical", date: "2026-12-06", time: "09:30", offices: ["All offices"], venue: "Hybrid", org: "Digital Labs", desc: "Opening session and team formation.", reg: true, deadline: "2026-12-04", st: "Published" },
  { id: 10, title: "L&D: Presentation Skills", cat: "Learning", date: "2026-12-10", time: "11:00", offices: ["Pune", "Bengaluru"], venue: "Room 2A", org: "L&D", desc: "Workshop on storytelling.", reg: true, deadline: "2026-12-08", st: "Published" },
];
export const EVENT_CATS = ["HR", "MPL", "Sheroes", "Technical", "Learning", "Community"];
export const PEOPLE_DETAIL = [
  { name: "Priya Nair", role: "QA Lead", dept: "Quality Assurance", office: "Chennai", interests: ["Books", "Fitness", "Travel"], skills: ["Test automation", "Selenium"] },
  { name: "Aisha Kapoor", role: "UX Designer", dept: "Product & Design", office: "Mumbai", interests: ["Travel", "Photography", "Food"], skills: ["Design", "Research"] },
  { name: "Vikram Desai", role: "Cloud Architect", dept: "Cloud & DevOps", office: "Ahmedabad", interests: ["Food", "Movies", "Tech"], skills: ["AWS", "Terraform"] },
  { name: "Rohan Mehta", role: "Data Engineer", dept: "Data & Analytics", office: "Ahmedabad", interests: ["Games", "Fitness", "Travel"], skills: ["Python", "Spark"] },
  { name: "Neha Iyer", role: "Frontend Engineer", dept: "Engineering", office: "Chennai", interests: ["Books", "Music", "Tech"], skills: ["React", "UX"] },
  { name: "Karan Shah", role: "Delivery Manager", dept: "Delivery / PMO", office: "Mumbai", interests: ["Travel", "Games", "Movies"], skills: ["Agile", "Planning"] },
  { name: "Meera Pillai", role: "HR Partner", dept: "HR & People", office: "Bengaluru", interests: ["Books", "Music", "Food"], skills: ["Coaching"] },
  { name: "Arjun Verma", role: "Java Developer", dept: "Engineering", office: "Pune", interests: ["Fitness", "Games", "Tech"], skills: ["Java", "Data"] },
];
export const BADGES = [
  { n: "Connector", d: "Bring colleagues together through plans and events", got: true },
  { n: "Knowledge Champion", d: "Share useful learning with the community", got: true },
  { n: "Community Builder", d: "Organise community activities", got: false },
  { n: "Collaboration Star", d: "Work across teams and offices", got: false },
  { n: "Innovator", d: "Take part in innovation activities", got: false },
  { n: "Responsible Contributor", d: "Contribute responsibly and consistently", got: false },
];
export const HISTORY = [
  { d: "Nov 10", a: "Organised Lonavala trek", v: "Ownership", p: 20, s: "Approved" },
  { d: "Nov 8", a: "Cross-office mentoring circle", v: "Collaboration", p: 15, s: "Approved" },
  { d: "Nov 5", a: "Lunch-and-learn session", v: "Empowerment", p: 15, s: "Pending review" },
  { d: "Oct 29", a: "Duplicate post", v: "Value", p: 0, s: "Adjusted" },
];
export const LEADERS = [
  { name: "Neha Iyer", office: "Chennai", team: "Engineering", pts: 640, badges: 5 },
  { name: "Aisha Kapoor", office: "Mumbai", team: "Product & Design", pts: 612, badges: 4 },
  { name: "Ananya Rao", office: "Mumbai", team: "Cloud & DevOps", pts: 570, badges: 3 },
  { name: "Rohan Mehta", office: "Ahmedabad", team: "Data & Analytics", pts: 535, badges: 3 },
  { name: "Priya Nair", office: "Chennai", team: "Quality Assurance", pts: 498, badges: 2 },
];
export const RULES = [
  { a: "Host a plan that completes", v: "Ownership", p: 20, cap: "3 per month", review: "Automatic" },
  { a: "Share a learning post", v: "Empowerment", p: 15, cap: "4 per month", review: "Reviewer" },
  { a: "Join a cross-office activity", v: "Collaboration", p: 15, cap: "4 per month", review: "Automatic" },
  { a: "Form an opportunity team", v: "Collaboration", p: 25, cap: "2 per quarter", review: "Reviewer" },
];
