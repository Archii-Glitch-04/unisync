/* ==========================================================================
   UNISYNC 3.0 — REAL-TIME COLLEGE PORTAL & ACADEMIC HUB
   Shared data lives on the server (/api). If the API is not available the
   app falls back to "local mode" (data saved only in this browser).
   ========================================================================== */
"use strict";

const LS = "unisync_v3_";
const API = "/api";
const LOCAL_DEFAULT_ADMIN_PASSWORD = "Admin@12345"; // used ONLY in local mode (no server)
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_NAMES = { Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday", Sat: "Saturday", Sun: "Sunday" };

/* ---------------------------------- helpers ---------------------------------- */
function $(id) { return document.getElementById(id); }
function esc(s) {
  return String(s === undefined || s === null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function clone(x) { return JSON.parse(JSON.stringify(x)); }
function uid(p) { return p + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function lsGet(key, fb) {
  try { const v = localStorage.getItem(LS + key); return v === null ? fb : JSON.parse(v); } catch (e) { return fb; }
}
function lsSet(key, val) {
  try { localStorage.setItem(LS + key, JSON.stringify(val)); return true; } catch (e) { return false; }
}
function refreshIcons() { if (window.lucide && window.lucide.createIcons) window.lucide.createIcons(); }
function setText(id, v) { const el = $(id); if (el && v !== undefined && v !== null) el.textContent = v; }
function setVal(id, v) { const el = $(id); if (el) el.value = v === undefined || v === null ? "" : v; }

function todayCode() { return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date().getDay()]; }
function defaultScheduleDay() { const t = todayCode(); return t === "Sun" ? "Mon" : t; }
function nowLabel() { return new Date().toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); }
function dateLabel() { return new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
function toMin(t) { const p = String(t || "0:0").split(":"); return (parseInt(p[0], 10) || 0) * 60 + (parseInt(p[1], 10) || 0); }
function formatDateTime(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso || "");
  return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
function hoursLeft(iso) { return (new Date(iso).getTime() - Date.now()) / 3600000; }
function timeLeftLabel(iso) {
  const h = hoursLeft(iso);
  if (isNaN(h)) return "";
  if (h < 0) return "Overdue";
  if (h < 1) return "Due soon!";
  if (h < 24) return Math.floor(h) + "h left";
  return Math.ceil(h / 24) + "d left";
}

/* ------------------------------- seed / default data ------------------------------- */
const DEFAULTS = {
  subjects: [
    "Data Structures & Algorithms", "Engineering Mathematics III", "Computer Architecture",
    "Object Oriented Programming", "Database Management Systems", "Digital Logic & Design", "Operating Systems"
  ],
  config: {
    brandName: "UniSync", tagline: "Campus Hub 2.0", collegeName: "Arka Jain University",
    helpdeskEmail: "academics@campus.edu.in", bannerTitle: "School of Engineering & Technology",
    bannerDesc: "Centralized real-time portal showing your branch schedule, live lecture tracker, bus transit routes, and notes."
  },
  notices: [
    { id: "notice-1", title: "Mid-Term Examination Schedule Announced", category: "Exam Circular", date: "Nov 20, 2026", content: "Mid-semester examinations will commence from December 5, 2026. Hall tickets will be issued via the portal starting Wednesday.", urgent: true },
    { id: "notice-2", title: "Aarambh 2026 Technical Hackathon Registration", category: "Campus Event", date: "Nov 18, 2026", content: "Registrations for the 24-hour coding hackathon are now live. Form your teams of up to 4 members and register before Nov 28.", urgent: false },
    { id: "notice-3", title: "Library Extended Hours during Exam Prep", category: "Facility Update", date: "Nov 15, 2026", content: "The central library reading hall will remain open 24/7 starting next Monday to assist with project and exam preparation.", urgent: false }
  ],
  schedule: [
    { id: "sch-1", branch: "CSE Core", day: "Mon", start: "09:00", end: "10:00", subject: "Data Structures & Algorithms", faculty: "Dr. R. Sharma", room: "Room 302" },
    { id: "sch-2", branch: "CSE Core", day: "Mon", start: "10:00", end: "11:00", subject: "Engineering Mathematics III", faculty: "Dr. A. K. Verma", room: "Room 302" },
    { id: "sch-3", branch: "CSE Core", day: "Mon", start: "11:15", end: "12:15", subject: "Database Management Systems", faculty: "Prof. S. Sen", room: "Lab 2" },
    { id: "sch-4", branch: "CSE Core", day: "Tue", start: "09:00", end: "10:00", subject: "Computer Architecture", faculty: "Dr. P. Das", room: "Room 302" },
    { id: "sch-5", branch: "CSE Core", day: "Tue", start: "10:00", end: "11:00", subject: "Object Oriented Programming", faculty: "Dr. R. Sharma", room: "Lab 1" },
    { id: "sch-6", branch: "CSE Core", day: "Wed", start: "09:00", end: "11:00", subject: "Data Structures & Algorithms", faculty: "Dr. R. Sharma", room: "Lab 3" },
    { id: "sch-7", branch: "CSE Core", day: "Thu", start: "10:00", end: "11:00", subject: "Operating Systems", faculty: "Prof. M. Mukherjee", room: "Room 302" },
    { id: "sch-8", branch: "CSE Core", day: "Fri", start: "09:00", end: "10:00", subject: "Database Management Systems", faculty: "Prof. S. Sen", room: "Room 302" }
  ],
  buses: [
    { id: "bus-1", busNo: "Bus #01", routeName: "Sakchi — Bistupur — Campus", departure: "08:15 AM", status: "On Time", stops: "Sakchi Clock Tower → Bistupur Circle → Kadma → Main Gate" },
    { id: "bus-2", busNo: "Bus #04", routeName: "Mango — Dimna — Campus", departure: "08:30 AM", status: "Arriving Soon", stops: "Dimna Chowk → Mango Bridge → Old Court → Campus Bay" },
    { id: "bus-3", busNo: "Bus #07", routeName: "Adityapur — Kandra — Campus", departure: "08:00 AM", status: "On Time", stops: "Adityapur Toll Bridge → NIT Gate → Industrial Area → Campus" },
    { id: "bus-4", busNo: "Bus #12", routeName: "Jugsalai — Station — Campus", departure: "08:20 AM", status: "Delayed (10m)", stops: "Jugsalai Fatak → Tatanagar Station → Parsudih → Campus" }
  ],
  notes: [
    { id: "note-1", branch: "CSE Core", title: "Unit 1: Asymptotic Notations & Recurrence Trees", subject: "Data Structures & Algorithms", author: "Dr. R. Sharma", date: "Nov 14, 2026", content: "Big-O, Omega, and Theta notations. Solving recurrence relations using Master Theorem and substitution method.", attachment: null },
    { id: "note-2", branch: "CSE Core", title: "Matrix Rank & Normal Form Solutions", subject: "Engineering Mathematics III", author: "Dr. A. K. Verma", date: "Nov 12, 2026", content: "Reduction of matrices to normal form PAQ and finding rank. Gauss-Jordan elimination method for matrix inversion.", attachment: null },
    { id: "note-3", branch: "CSE Core", title: "ACID Properties & Normalization (1NF to 3NF)", subject: "Database Management Systems", author: "Prof. S. Sen", date: "Nov 10, 2026", content: "Relational database design principles, functional dependencies, and lossless join decomposition.", attachment: null }
  ],
  assignments: [
    { id: "assign-1", branch: "CSE Core", title: "DSA Assignment 3: BST & AVL Tree Rotations", subject: "Data Structures & Algorithms", deadline: "2026-11-25T23:59", desc: "Implement insertion, deletion, and single/double rotations in an AVL tree in C++ or Python.", attachment: null },
    { id: "assign-2", branch: "CSE Core", title: "DBMS Lab Report: SQL Joins & Subqueries", subject: "Database Management Systems", deadline: "2026-11-22T18:00", desc: "Complete query sheets 1 through 5 involving complex joins, group by having clauses, and correlated subqueries.", attachment: null },
    { id: "assign-3", branch: "CSE Core", title: "Maths Problem Set: Matrix Eigenvalues", subject: "Engineering Mathematics III", deadline: "2026-11-28T17:00", desc: "Solve problems 1 to 15 on Cayley-Hamilton theorem and characteristic equations.", attachment: null }
  ],
  quizzes: [
    {
      id: "quiz-1", branch: "CSE Core", title: "DSA Quick Concept Check", subject: "Data Structures & Algorithms", durationMin: 10,
      questions: [
        { q: "Worst-case time complexity of binary search?", options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"], answer: 1 },
        { q: "Which data structure follows LIFO order?", options: ["Queue", "Stack", "Heap", "Graph"], answer: 1 },
        { q: "Height of a balanced BST with n nodes?", options: ["O(n)", "O(log n)", "O(n²)", "O(1)"], answer: 1 },
        { q: "Which traversal of a BST gives sorted order?", options: ["Preorder", "Postorder", "Inorder", "Level order"], answer: 2 },
        { q: "Inserting at the head of a singly linked list takes?", options: ["O(1)", "O(n)", "O(log n)", "O(n²)"], answer: 0 }
      ]
    },
    {
      id: "quiz-2", branch: "CSE Core", title: "DBMS Normalization Quiz", subject: "Database Management Systems", durationMin: 8,
      questions: [
        { q: "1NF requires that every attribute contains…", options: ["Atomic values", "No partial dependency", "No transitive dependency", "No multivalued dependency"], answer: 0 },
        { q: "2NF removes which kind of dependency?", options: ["Transitive", "Partial", "Multivalued", "Join"], answer: 1 },
        { q: "In ACID, the letter I stands for…", options: ["Integrity", "Isolation", "Indexing", "Inheritance"], answer: 1 },
        { q: "3NF removes which kind of dependency?", options: ["Partial", "Transitive", "Atomicity violations", "Join"], answer: 1 }
      ]
    }
  ],
  activity: [{ text: "Portal initialized successfully", time: "Just now" }]
};
const COLLECTIONS = Object.keys(DEFAULTS);

/* ----------------------------------- state ----------------------------------- */
const state = {
  tab: "dashboard",
  isAdmin: false,
  adminPw: "",
  mode: "local", // "server" | "local"
  branch: lsGet("branch", "CSE Core"),
  classroom: lsGet("classroom", "Room 302"),
  scheduleDay: defaultScheduleDay(),
  assignFilter: "ALL",
  saving: 0
};
let db = {};
let lastSnapshot = "";
let mySubmitted = new Set(lsGet("submitted", []));
let myResults = lsGet("quiz_results", []);

function applyData(remote) {
  COLLECTIONS.forEach((c) => {
    const v = remote ? remote[c] : null;
    db[c] = v === null || v === undefined ? clone(DEFAULTS[c]) : v;
  });
}

/* ------------------------------ data layer (server/local) ------------------------------ */
async function initData() {
  try {
    const res = await fetch(API + "/db", { cache: "no-store" });
    const ct = res.headers.get("content-type") || "";
    if (!res.ok || ct.indexOf("application/json") === -1) throw new Error("API unavailable");
    const body = await res.json();
    state.mode = "server";
    lastSnapshot = JSON.stringify(body.data);
    applyData(body.data);
  } catch (e) {
    state.mode = "local";
    const local = {};
    COLLECTIONS.forEach((c) => { local[c] = lsGet("db_" + c, null); });
    applyData(local);
  }
  updateSyncBadge();
}

function updateSyncBadge() {
  const el = $("sync-status");
  if (!el) return;
  if (state.mode === "server") {
    el.className = "hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200";
    el.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-emerald-500 live-dot"></span>Shared • live';
    el.title = "Changes are saved on the server and visible to every user.";
  } else {
    el.className = "hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold border bg-amber-50 text-amber-700 border-amber-200";
    el.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>This device only';
    el.title = "Server not detected: changes are saved only in this browser.";
  }
}

async function persist(name) {
  if (state.mode === "local") {
    const ok = lsSet("db_" + name, db[name]);
    if (!ok) toast("Could not save in this browser (storage full?).", "error");
    return ok;
  }
  state.saving++;
  try {
    const res = await fetch(API + "/db/" + name, {
      method: "PUT",
      headers: { "content-type": "application/json", "x-admin-password": state.adminPw },
      body: JSON.stringify(db[name])
    });
    if (res.status === 401) { toast("Admin session expired. Please log in again.", "error"); forceLogout(); return false; }
    if (!res.ok) { toast("The server could not save your change. Please try again.", "error"); return false; }
    return true;
  } catch (e) {
    toast("Network error — your change was not saved.", "error");
    return false;
  } finally {
    state.saving--;
  }
}

async function commit(name, mutate, okMsg, logText) {
  const backup = clone(db[name]);
  mutate();
  const ok = await persist(name);
  if (!ok) { db[name] = backup; renderCurrent(); return false; }
  if (logText) await logActivity(logText);
  refreshBadges();
  renderCurrent();
  if (okMsg) toast(okMsg, "success");
  return true;
}

async function logActivity(text) {
  db.activity.unshift({ text, time: nowLabel() });
  db.activity = db.activity.slice(0, 20);
  await persist("activity");
}

function anyModalOpen() { return !!document.querySelector(".app-modal.flex"); }

async function syncFromServer(force) {
  if (state.mode !== "server" || state.saving > 0) return;
  if (!force && (document.hidden || anyModalOpen())) return;
  try {
    const res = await fetch(API + "/db", { cache: "no-store" });
    if (!res.ok) return;
    const body = await res.json();
    const snap = JSON.stringify(body.data);
    if (snap === lastSnapshot) return;
    lastSnapshot = snap;
    applyData(body.data);
    applyConfig();
    populateSubjectDropdowns();
    refreshBadges();
    renderCurrent();
  } catch (e) { /* ignore transient network errors */ }
}

/* ------------------------------------ boot ------------------------------------ */
document.addEventListener("DOMContentLoaded", async () => {
  setupLiveClock();
  await initData();
  await restoreAdminSession();
  applyConfig();
  populateSubjectDropdowns();
  updateStudentSessionBanner();
  applyRoleUI();
  refreshBadges();
  switchTab("dashboard");
  if (!lsGet("session_set", false)) openLoginSessionModal();

  setInterval(() => { if (state.tab === "schedule" || state.tab === "dashboard") renderCurrent(); }, 30000);
  setInterval(() => syncFromServer(false), 15000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) syncFromServer(false); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") document.querySelectorAll(".app-modal.flex").forEach((m) => {
      if (m.id !== "modal-login-session" && m.id !== "modal-quiz-take") closeModal(m.id);
    });
  });
  document.querySelectorAll(".app-modal").forEach((m) => {
    m.addEventListener("mousedown", (e) => {
      if (e.target === m && m.id !== "modal-login-session" && m.id !== "modal-quiz-take") closeModal(m.id);
    });
  });
});

function setupLiveClock() {
  function tick() {
    const now = new Date();
    setText("live-clock-time", now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }));
    setText("live-clock-date", now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }));
  }
  tick();
  setInterval(tick, 1000);
}

function applyConfig() {
  const c = Object.assign({}, DEFAULTS.config, db.config || {});
  setText("ui-brand-name", c.brandName);
  setText("ui-brand-tagline", c.tagline);
  setText("ui-college-name", c.collegeName);
  setText("ui-helpdesk-email", c.helpdeskEmail);
  setText("ui-banner-title", c.bannerTitle);
  setText("ui-banner-desc", c.bannerDesc);
}

/* ---------------------------------- modals/toast ---------------------------------- */
function openModal(id) {
  const m = $(id);
  if (!m) return;
  m.classList.remove("hidden");
  m.classList.add("flex");
  refreshIcons();
}
function closeModal(id) {
  const m = $(id);
  if (!m) return;
  m.classList.add("hidden");
  m.classList.remove("flex");
}
function toast(message, type) {
  const container = $("toast-container");
  if (!container) return;
  const t = document.createElement("div");
  const bg = type === "error" ? "bg-rose-600" : type === "info" ? "bg-slate-800" : "bg-emerald-600";
  t.className = bg + " text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-lg transition duration-300 transform translate-y-2 opacity-0 max-w-sm";
  t.textContent = message;
  container.appendChild(t);
  setTimeout(() => t.classList.remove("translate-y-2", "opacity-0"), 10);
  setTimeout(() => { t.classList.add("translate-y-2", "opacity-0"); setTimeout(() => t.remove(), 300); }, 4000);
}

async function withBusy(e, fn) {
  e.preventDefault();
  const btn = e.submitter;
  if (btn) btn.disabled = true;
  try { await fn(); } finally { if (btn) btn.disabled = false; }
}

/* ------------------------------- student session ------------------------------- */
function openLoginSessionModal() {
  setVal("login-branch-input", state.branch);
  setVal("login-room-input", state.classroom);
  openModal("modal-login-session");
}
function handleSaveLoginSession(e) {
  e.preventDefault();
  state.branch = $("login-branch-input").value;
  state.classroom = $("login-room-input").value.trim() || "Room 302";
  lsSet("branch", state.branch);
  lsSet("classroom", state.classroom);
  lsSet("session_set", true);
  closeModal("modal-login-session");
  updateStudentSessionBanner();
  refreshBadges();
  switchTab("dashboard");
  toast("Welcome! Session set to " + state.branch + " (" + state.classroom + ")", "success");
}
function updateStudentSessionBanner() {
  setText("ui-banner-branch-room", "Branch: " + state.branch + " • Classroom: " + state.classroom);
  setText("ui-student-session-tag", "Branch: " + state.branch + " • " + state.classroom);
  setText("ui-info-branch", state.branch);
  setText("ui-info-room", state.classroom);
  setText("schedule-header-branch-room", state.branch + " • " + state.classroom);
}

/* ---------------------------------- navigation ---------------------------------- */
const TITLES = {
  dashboard: ["Dashboard Overview", "Real-time academic feed, deadlines & campus updates"],
  "college-info": ["College Info & Notices", "Institutional directory and live campus announcements"],
  schedule: ["Class Schedule & Live Tracker", "Branch lecture timetables with real-time class progress"],
  buses: ["Bus Route Tracker", "Campus bus routes, departure times and live status"],
  notes: ["Lecture Notes Hub", "Branch-specific study materials, faculty slides & formulas"],
  assignments: ["Assignments & Submissions", "Track homework deadlines and submission status"],
  quizzes: ["Branch Quizzes", "Timed knowledge checks with instant score recording"]
};

function switchTab(tabId) {
  state.tab = tabId;
  document.querySelectorAll(".tab-panel").forEach((p) => p.classList.add("hidden"));
  const target = $("tab-" + tabId);
  if (target) target.classList.remove("hidden");

  document.querySelectorAll(".nav-btn").forEach((b) => {
    b.classList.remove("bg-indigo-600", "text-white", "shadow-md", "shadow-indigo-950/50");
    b.classList.add("text-slate-300", "hover:bg-slate-800/70", "hover:text-white");
  });
  const nav = $("nav-" + tabId);
  if (nav) {
    nav.classList.remove("text-slate-300", "hover:bg-slate-800/70", "hover:text-white");
    nav.classList.add("bg-indigo-600", "text-white", "shadow-md", "shadow-indigo-950/50");
  }
  if (TITLES[tabId]) { setText("page-title", TITLES[tabId][0]); setText("page-subtitle", TITLES[tabId][1]); }

  if (tabId === "notes") refreshNoteFilter();
  renderCurrent();

  const sb = $("sidebar"), ov = $("mobile-overlay");
  if (sb) sb.classList.add("-translate-x-full");
  if (ov) ov.classList.add("hidden");
  const main = $("main-content");
  if (main && main.scrollTo) main.scrollTo({ top: 0, behavior: "smooth" });
}

function toggleSidebar() {
  const sb = $("sidebar"), ov = $("mobile-overlay");
  if (sb) sb.classList.toggle("-translate-x-full");
  if (ov) ov.classList.toggle("hidden");
}

function renderCurrent() {
  const map = {
    dashboard: renderDashboard,
    "college-info": renderNotices,
    schedule: renderScheduleTab,
    buses: renderBuses,
    notes: renderNotes,
    assignments: renderAssignments,
    quizzes: () => { renderQuizzes(); renderQuizResults(); }
  };
  (map[state.tab] || renderDashboard)();
  refreshIcons();
}

function refreshBadges() {
  setText("badge-notices", db.notices.length);
  setText("badge-notes", db.notes.filter((n) => n.branch === state.branch).length);
  setText("badge-assignments", pendingAssignments().length);
  setText("badge-quizzes", db.quizzes.filter((q) => q.branch === state.branch).length);
}

/* ------------------------------------ admin auth ------------------------------------ */
function applyRoleUI() {
  document.querySelectorAll(".admin-only").forEach((el) => {
    if (state.isAdmin) { el.classList.remove("hidden"); el.classList.add("flex"); }
    else { el.classList.add("hidden"); el.classList.remove("flex"); }
  });
  const loginBtn = $("btn-admin-login");
  const controls = $("admin-active-controls");
  if (loginBtn) { if (state.isAdmin) loginBtn.classList.add("hidden"); else loginBtn.classList.remove("hidden"); }
  if (controls) {
    if (state.isAdmin) { controls.classList.remove("hidden"); controls.classList.add("flex"); }
    else { controls.classList.add("hidden"); controls.classList.remove("flex"); }
  }
  const av = $("role-avatar");
  if (av) {
    av.textContent = state.isAdmin ? "AD" : "ST";
    av.className = state.isAdmin
      ? "w-9 h-9 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 font-bold text-sm"
      : "w-9 h-9 rounded-full bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 font-bold text-sm";
  }
  setText("role-title", state.isAdmin ? "Administrator Mode" : "Student View");
}

async function verifyAdmin(pw) {
  if (state.mode === "local") return pw === lsGet("admin_pw", LOCAL_DEFAULT_ADMIN_PASSWORD);
  try {
    const r = await fetch(API + "/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ password: pw }) });
    if (r.ok) return true;
    if (r.status === 401) return false;
    return null;
  } catch (e) { return null; }
}

async function restoreAdminSession() {
  let pw = null;
  try { pw = sessionStorage.getItem(LS + "admin_session"); } catch (e) {}
  if (!pw) return;
  const ok = await verifyAdmin(pw);
  if (ok) { state.isAdmin = true; state.adminPw = pw; }
  else { try { sessionStorage.removeItem(LS + "admin_session"); } catch (e) {} }
}

function openAdminLoginModal() {
  if (state.isAdmin) return;
  setVal("admin-passcode-input", "");
  $("admin-login-error").classList.add("hidden");
  openModal("modal-admin-login");
  setTimeout(() => { const i = $("admin-passcode-input"); if (i) i.focus(); }, 50);
}

function handleAdminLogin(e) {
  return withBusy(e, async () => {
    const pw = $("admin-passcode-input").value;
    const ok = await verifyAdmin(pw);
    if (ok === null) { toast("Could not reach the server. Check your connection.", "error"); return; }
    if (!ok) { $("admin-login-error").classList.remove("hidden"); toast("Incorrect password.", "error"); return; }
    state.isAdmin = true;
    state.adminPw = pw;
    try { sessionStorage.setItem(LS + "admin_session", pw); } catch (err) {}
    closeModal("modal-admin-login");
    applyRoleUI();
    renderCurrent();
    toast("Admin access granted.", "success");
  });
}

function logoutAdmin() {
  state.isAdmin = false;
  state.adminPw = "";
  try { sessionStorage.removeItem(LS + "admin_session"); } catch (e) {}
  applyRoleUI();
  renderCurrent();
  toast("Logged out of Admin mode.", "info");
}
function forceLogout() {
  state.isAdmin = false;
  state.adminPw = "";
  try { sessionStorage.removeItem(LS + "admin_session"); } catch (e) {}
  applyRoleUI();
  renderCurrent();
}

function togglePasswordVisibility(id) { const f = $(id); if (f) f.type = f.type === "password" ? "text" : "password"; }

function passwordRules(p) {
  return { len: p.length >= 8, upper: /[A-Z]/.test(p), lower: /[a-z]/.test(p), num: /[0-9]/.test(p), sym: /[^A-Za-z0-9]/.test(p) };
}
function evaluatePasswordStrengthUI(value) {
  const rules = passwordRules(value || "");
  const score = Object.values(rules).filter(Boolean).length;
  const labels = ["Too Weak", "Too Weak", "Weak", "Fair", "Good", "Strong"];
  const colors = ["bg-rose-500", "bg-rose-500", "bg-orange-500", "bg-amber-500", "bg-lime-500", "bg-emerald-500"];
  const bar = $("change-strength-bar"), label = $("change-strength-label");
  if (bar) { bar.className = "h-full transition-all duration-300 " + colors[score]; bar.style.width = (score / 5) * 100 + "%"; }
  if (label) label.textContent = labels[score];
  document.querySelectorAll("#change-strength-rules li").forEach((li) => {
    const ok = rules[li.getAttribute("data-rule")];
    li.className = ok ? "text-emerald-600 font-medium" : "text-slate-500";
  });
}

function openChangePasswordModal() {
  ["pass-current", "pass-new", "pass-confirm"].forEach((id) => setVal(id, ""));
  $("pass-error").classList.add("hidden");
  evaluatePasswordStrengthUI("");
  openModal("modal-change-password");
}

function handleChangePassword(e) {
  return withBusy(e, async () => {
    const curr = $("pass-current").value, np = $("pass-new").value, conf = $("pass-confirm").value;
    const err = $("pass-error");
    const fail = (m) => { err.textContent = m; err.classList.remove("hidden"); };
    if (np !== conf) return fail("New passwords do not match.");
    if (Object.values(passwordRules(np)).some((v) => !v)) return fail("New password does not meet all the security rules.");
    if (state.mode === "local") {
      if (curr !== lsGet("admin_pw", LOCAL_DEFAULT_ADMIN_PASSWORD)) return fail("Current password is incorrect.");
      lsSet("admin_pw", np);
    } else {
      try {
        const r = await fetch(API + "/password", { method: "POST", headers: { "content-type": "application/json", "x-admin-password": curr }, body: JSON.stringify({ newPassword: np }) });
        if (r.status === 401) return fail("Current password is incorrect.");
        if (!r.ok) return fail("The server rejected the new password.");
      } catch (ex) { return fail("Network error. Please try again."); }
    }
    state.adminPw = np;
    try { sessionStorage.setItem(LS + "admin_session", np); } catch (ex) {}
    closeModal("modal-change-password");
    toast("Admin password updated successfully!", "success");
  });
}

/* ------------------------------- shared render bits ------------------------------- */
function adminActions(editFn, delFn, id) {
  if (!state.isAdmin) return "";
  const i = esc(id);
  return '<div class="flex items-center gap-1 shrink-0">' +
    (editFn ? '<button onclick="' + editFn + "('" + i + '\')" title="Edit" class="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition"><i data-lucide="pencil" class="w-4 h-4"></i></button>' : "") +
    '<button onclick="' + delFn + "('" + i + '\')" title="Delete" class="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"><i data-lucide="trash-2" class="w-4 h-4"></i></button></div>';
}

function attachmentHtml(a) {
  if (!a || !a.key) return "";
  const url = API + "/file/" + encodeURIComponent(a.key);
  const img = (a.type || "").indexOf("image/") === 0
    ? '<img src="' + url + '" alt="" loading="lazy" class="h-32 w-full object-cover rounded-xl border border-slate-200 mb-2">' : "";
  return '<a href="' + url + '" target="_blank" rel="noopener" class="block">' + img +
    '<span class="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700"><i data-lucide="paperclip" class="w-3.5 h-3.5"></i>' + esc(a.name || "Attachment") + "</span></a>";
}

function emptyMsg(text) { return '<p class="text-xs text-slate-500 py-6 text-center col-span-full">' + esc(text) + "</p>"; }

function fillSelect(sel, items, value) {
  if (!sel) return;
  sel.innerHTML = items.map((s) => '<option value="' + esc(s) + '">' + esc(s) + "</option>").join("");
  if (value && items.indexOf(value) === -1) sel.insertAdjacentHTML("afterbegin", '<option value="' + esc(value) + '">' + esc(value) + "</option>");
  if (value) sel.value = value;
}
function populateSubjectDropdowns() {
  document.querySelectorAll(".subject-select-dropdown").forEach((sel) => fillSelect(sel, db.subjects, sel.value));
  refreshNoteFilter();
}
function refreshNoteFilter() {
  const sel = $("notes-subject-filter");
  if (!sel) return;
  const cur = sel.value;
  sel.innerHTML = '<option value="">All subjects</option>' + db.subjects.map((s) => '<option value="' + esc(s) + '">' + esc(s) + "</option>").join("");
  sel.value = db.subjects.indexOf(cur) >= 0 ? cur : "";
}

function notifyOtherBranch(target, what) {
  if (target !== state.branch) toast(what + " saved for " + target + ". Switch to that branch to see it.", "info");
}

/* ------------------------------------ dashboard ------------------------------------ */
function pendingAssignments() {
  return db.assignments.filter((a) => a.branch === state.branch && !mySubmitted.has(a.id))
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
}

function renderDashboard() {
  const pending = pendingAssignments();
  setText("stat-todays-classes", db.schedule.filter((s) => s.branch === state.branch && s.day === todayCode()).length);
  setText("stat-assignments", pending.length);
  setText("stat-buses", db.buses.length);
  setText("stat-notes", db.notes.filter((n) => n.branch === state.branch).length);
  setText("stat-next-deadline", pending.length ? "Next due: " + pending[0].title : "All assignments submitted!");

  const dl = $("dashboard-deadlines-list");
  if (dl) {
    dl.innerHTML = pending.length === 0
      ? '<p class="text-xs text-slate-500 py-4 text-center">No pending assignment deadlines. You\'re all caught up!</p>'
      : pending.map((a) => {
          const late = hoursLeft(a.deadline) < 24;
          const badge = late ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-amber-50 text-amber-700 border-amber-200";
          return '<div class="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">' +
            '<div class="min-w-0 flex-1"><p class="text-sm font-bold text-slate-900 truncate">' + esc(a.title) + "</p>" +
            '<p class="text-xs text-slate-500">' + esc(a.subject) + " • Due " + esc(formatDateTime(a.deadline)) + "</p></div>" +
            '<div class="flex items-center gap-3 shrink-0"><span class="px-2.5 py-1 rounded-lg border text-xs font-semibold ' + badge + '">' + esc(timeLeftLabel(a.deadline)) + "</span>" +
            "<button onclick=\"toggleAssignmentSubmitted('" + esc(a.id) + '\')" class="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition">Mark Done</button></div></div>';
        }).join("");
  }

  const feed = $("activity-feed-list");
  if (feed) {
    feed.innerHTML = db.activity.map((it) =>
      '<div class="flex items-start gap-3 text-xs"><div class="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0"></div><div class="flex-1 min-w-0">' +
      '<p class="font-medium text-slate-800 leading-tight">' + esc(it.text) + '</p><span class="text-[10px] text-slate-400">' + esc(it.time) + "</span></div></div>").join("");
  }
}

/* ------------------------------------- notices ------------------------------------- */
function renderNotices() {
  const el = $("notices-list");
  if (!el) return;
  el.innerHTML = db.notices.length === 0 ? emptyMsg("No announcements yet.") : db.notices.map((n) =>
    '<div class="p-5 rounded-2xl border ' + (n.urgent ? "border-amber-200 bg-amber-50/40" : "border-slate-200/80 bg-white") + ' space-y-2">' +
    '<div class="flex items-center justify-between gap-2"><div class="flex items-center gap-2 flex-wrap">' +
    '<span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold ' + (n.urgent ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700") + '">' + esc(n.category) + "</span>" +
    (n.urgent ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">URGENT</span>' : "") +
    '<span class="text-xs text-slate-400">' + esc(n.date) + "</span></div>" + adminActions("openNoticeModal", "deleteNotice", n.id) + "</div>" +
    '<h4 class="font-display font-bold text-slate-900 text-base">' + esc(n.title) + "</h4>" +
    '<p class="text-xs text-slate-600 leading-relaxed whitespace-pre-line">' + esc(n.content) + "</p></div>").join("");
}

function openNoticeModal(id) {
  const n = id ? db.notices.find((x) => x.id === id) : null;
  setText("modal-notice-heading", n ? "Edit Announcement" : "Post Announcement");
  setText("modal-notice-submit-btn", n ? "Update" : "Publish");
  setVal("edit-notice-id", n ? n.id : "");
  setVal("notice-title", n ? n.title : "");
  setVal("notice-category", n ? n.category : "General Announcement");
  setVal("notice-content", n ? n.content : "");
  $("notice-urgent").checked = !!(n && n.urgent);
  openModal("modal-notice");
}
function handleSaveNotice(e) {
  return withBusy(e, async () => {
    const id = $("edit-notice-id").value;
    const old = id ? db.notices.find((x) => x.id === id) : null;
    const item = {
      id: id || uid("notice"), title: $("notice-title").value.trim(), category: $("notice-category").value.trim() || "General",
      content: $("notice-content").value.trim(), urgent: $("notice-urgent").checked, date: old ? old.date : dateLabel()
    };
    const ok = await commit("notices", () => {
      if (old) db.notices = db.notices.map((x) => (x.id === id ? item : x)); else db.notices.unshift(item);
    }, old ? "Announcement updated." : "Campus notice published live.", (old ? "Updated notice: " : "Posted notice: ") + item.title);
    if (ok) closeModal("modal-notice");
  });
}
function deleteNotice(id) { return deleteItem("notices", id, "Delete this announcement?", "Notice deleted.", "Deleted a notice"); }

async function deleteItem(coll, id, confirmMsg, okMsg, logText) {
  if (!confirm(confirmMsg)) return;
  await commit(coll, () => { db[coll] = db[coll].filter((x) => x.id !== id); }, okMsg, logText);
}

/* ------------------------------------- schedule ------------------------------------- */
function classesFor(branch, day) {
  return db.schedule.filter((s) => s.branch === branch && s.day === day).sort((a, b) => toMin(a.start) - toMin(b.start));
}
function setScheduleDay(d) { state.scheduleDay = d; renderScheduleTab(); refreshIcons(); }

function renderScheduleTab() {
  const box = $("schedule-day-buttons");
  if (box) box.innerHTML = DAYS.map((d) =>
    "<button onclick=\"setScheduleDay('" + d + '\')" class="px-3 py-1.5 rounded-xl text-xs font-bold transition ' +
    (state.scheduleDay === d ? "bg-indigo-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200") + '">' + d + "</button>").join("");
  setText("schedule-active-day-label", state.scheduleDay === todayCode() ? "Today" : DAY_NAMES[state.scheduleDay]);
  renderTracker();
  renderTimetable();
}

function renderTracker() {
  const box = $("live-lecture-tracker-banner");
  if (!box) return;
  const day = state.scheduleDay;
  const list = classesFor(state.branch, day);
  const tag = (t) => '<span class="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-bold uppercase tracking-wider">' + t + "</span>";

  if (!list.length) {
    box.innerHTML = "<div>" + tag("Live Tracker") + '<h4 class="font-display font-bold text-lg mt-1">No lectures scheduled for ' + DAY_NAMES[day] + '</h4><p class="text-xs text-slate-300 mt-0.5">Enjoy your free time or catch up on pending assignments.</p></div>';
    return;
  }
  if (day !== todayCode()) {
    box.innerHTML = "<div>" + tag("Timetable") + '<h4 class="font-display font-bold text-lg mt-1">Viewing ' + DAY_NAMES[day] + '</h4><p class="text-xs text-slate-300 mt-0.5">' + list.length + " lecture" + (list.length > 1 ? "s" : "") + " scheduled. Live tracking shows on the current day.</p></div>";
    return;
  }
  const now = new Date();
  const nowM = now.getHours() * 60 + now.getMinutes();
  const cur = list.find((c) => nowM >= toMin(c.start) && nowM < toMin(c.end));
  const next = list.find((c) => toMin(c.start) > nowM);

  if (cur) {
    const rem = toMin(cur.end) - nowM;
    box.innerHTML = '<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4"><div class="space-y-1.5">' +
      '<div class="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold"><span class="w-2 h-2 rounded-full bg-emerald-400 live-dot"></span><span>LIVE CLASS IN PROGRESS</span></div>' +
      '<h3 class="font-display text-xl sm:text-2xl font-bold">' + esc(cur.subject) + '</h3><p class="text-xs text-slate-300">Faculty: ' + esc(cur.faculty) + ' • Location: <span class="text-white font-semibold">' + esc(cur.room) + "</span></p></div>" +
      '<div class="bg-slate-900/80 border border-slate-700/80 px-4 py-3 rounded-xl text-right shrink-0"><div class="text-[10px] text-slate-400 uppercase font-semibold">Time Remaining</div><div class="font-mono text-xl font-bold text-emerald-400">' + rem + ' mins</div><div class="text-[10px] text-slate-400">Ends at ' + esc(cur.end) + "</div></div></div>";
  } else if (next) {
    const diff = toMin(next.start) - nowM;
    box.innerHTML = '<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4"><div class="space-y-1.5">' +
      '<div class="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold"><i data-lucide="clock" class="w-3.5 h-3.5"></i><span>UPCOMING LECTURE</span></div>' +
      '<h3 class="font-display text-xl sm:text-2xl font-bold">' + esc(next.subject) + '</h3><p class="text-xs text-slate-300">Faculty: ' + esc(next.faculty) + ' • Location: <span class="text-white font-semibold">' + esc(next.room) + "</span></p></div>" +
      '<div class="bg-slate-900/80 border border-slate-700/80 px-4 py-3 rounded-xl text-right shrink-0"><div class="text-[10px] text-slate-400 uppercase font-semibold">Starts In</div><div class="font-mono text-xl font-bold text-indigo-400">' + diff + ' mins</div><div class="text-[10px] text-slate-400">At ' + esc(next.start) + "</div></div></div>";
  } else {
    box.innerHTML = "<div>" + tag("Live Tracker") + '<h4 class="font-display font-bold text-lg mt-1">All lectures completed for today</h4><p class="text-xs text-slate-300 mt-0.5">Great job keeping up with your classes!</p></div>';
  }
}

function renderTimetable() {
  const el = $("schedule-timetable-list");
  if (!el) return;
  const list = classesFor(state.branch, state.scheduleDay);
  if (!list.length) { el.innerHTML = emptyMsg("No timetable records found for " + DAY_NAMES[state.scheduleDay] + "."); return; }
  const isToday = state.scheduleDay === todayCode();
  const now = new Date();
  const nowM = now.getHours() * 60 + now.getMinutes();
  el.innerHTML = list.map((c) => {
    let chip = "";
    if (isToday) {
      if (nowM >= toMin(c.start) && nowM < toMin(c.end)) chip = '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">LIVE</span>';
      else if (nowM >= toMin(c.end)) chip = '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">DONE</span>';
      else chip = '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-600">UPCOMING</span>';
    }
    return '<div class="flex items-center justify-between gap-3 p-4 rounded-xl border border-slate-200/80 bg-white hover:border-indigo-200 transition">' +
      '<div class="flex items-center gap-4 min-w-0"><div class="px-3 py-2 rounded-lg bg-slate-100 text-slate-700 font-mono text-xs font-bold text-center shrink-0"><div>' + esc(c.start) + '</div><div class="text-[10px] text-slate-400">to ' + esc(c.end) + "</div></div>" +
      '<div class="min-w-0"><h4 class="font-bold text-slate-900 text-sm truncate">' + esc(c.subject) + '</h4><p class="text-xs text-slate-500">Faculty: ' + esc(c.faculty) + ' • <span class="font-medium text-slate-700">' + esc(c.room) + "</span></p></div></div>" +
      '<div class="flex items-center gap-2 shrink-0">' + chip + adminActions("openScheduleModal", "deleteScheduleItem", c.id) + "</div></div>";
  }).join("");
}

function openScheduleModal(id) {
  const s = id ? db.schedule.find((x) => x.id === id) : null;
  setText("modal-schedule-heading", s ? "Edit Class Schedule" : "Add Class Schedule");
  setText("modal-schedule-submit-btn", s ? "Update Class" : "Save Class");
  setVal("edit-schedule-id", s ? s.id : "");
  setVal("sch-branch", s ? s.branch : state.branch);
  setVal("sch-day", s ? s.day : state.scheduleDay);
  setVal("sch-start", s ? s.start : "09:00");
  setVal("sch-end", s ? s.end : "10:00");
  fillSelect($("sch-subject"), db.subjects, s ? s.subject : "");
  setVal("sch-faculty", s ? s.faculty : "");
  setVal("sch-room", s ? s.room : state.classroom);
  openModal("modal-schedule");
}
function handleSaveSchedule(e) {
  return withBusy(e, async () => {
    const id = $("edit-schedule-id").value;
    const item = {
      id: id || uid("sch"), branch: $("sch-branch").value, day: $("sch-day").value, start: $("sch-start").value, end: $("sch-end").value,
      subject: $("sch-subject").value, faculty: $("sch-faculty").value.trim(), room: $("sch-room").value.trim()
    };
    if (!item.subject) return toast("Please add a subject first (Admin Controls → Edit Subject Names).", "error");
    if (toMin(item.end) <= toMin(item.start)) return toast("End time must be after the start time.", "error");
    const ok = await commit("schedule", () => {
      if (id) db.schedule = db.schedule.map((x) => (x.id === id ? item : x)); else db.schedule.push(item);
    }, id ? "Class updated." : "Class schedule added successfully!", (id ? "Updated class: " : "Added class: ") + item.subject + " (" + item.branch + ", " + item.day + ")");
    if (ok) {
      closeModal("modal-schedule");
      if (item.branch === state.branch) state.scheduleDay = item.day;
      notifyOtherBranch(item.branch, "Class");
      renderCurrent();
    }
  });
}
function deleteScheduleItem(id) { return deleteItem("schedule", id, "Delete this scheduled class?", "Class removed.", "Removed a class from the schedule"); }

/* -------------------------------------- buses -------------------------------------- */
function busColor(status) {
  if (status === "On Time") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "Arriving Soon") return "bg-indigo-50 text-indigo-700 border-indigo-200";
  if (status && status.indexOf("Delayed") === 0) return "bg-rose-50 text-rose-700 border-rose-200";
  return "bg-slate-100 text-slate-600 border-slate-200";
}
function renderBuses() {
  const el = $("bus-routes-grid");
  if (!el) return;
  el.innerHTML = db.buses.length === 0 ? emptyMsg("No bus routes have been added yet.") : db.buses.map((b) =>
    '<div class="p-5 rounded-2xl border border-slate-200/80 bg-white shadow-sm space-y-3"><div class="flex items-center justify-between gap-2">' +
    '<span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700">' + esc(b.busNo) + "</span>" +
    '<div class="flex items-center gap-2"><span class="px-2.5 py-0.5 rounded-full border text-[11px] font-bold ' + busColor(b.status) + '">' + esc(b.status) + "</span>" + adminActions("openBusModal", "deleteBus", b.id) + "</div></div>" +
    '<h4 class="font-display font-bold text-slate-900 text-base">' + esc(b.routeName) + "</h4>" +
    '<p class="text-xs text-slate-600">Departure: <span class="font-semibold text-slate-900">' + esc(b.departure) + "</span></p>" +
    '<div class="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100"><span class="font-semibold text-slate-600">Stops:</span> ' + esc(b.stops) + "</div></div>").join("");
}
function openBusModal(id) {
  const b = id ? db.buses.find((x) => x.id === id) : null;
  setText("modal-bus-heading", b ? "Edit Bus Route" : "Add Campus Bus Route");
  setText("modal-bus-submit-btn", b ? "Update Bus Route" : "Save Bus Route");
  setVal("edit-bus-id", b ? b.id : "");
  setVal("bus-no", b ? b.busNo : "");
  setVal("bus-route-name", b ? b.routeName : "");
  setVal("bus-departure", b ? b.departure : "");
  setVal("bus-status", b ? b.status : "On Time");
  setVal("bus-stops", b ? b.stops : "");
  openModal("modal-bus");
}
function handleSaveBus(e) {
  return withBusy(e, async () => {
    const id = $("edit-bus-id").value;
    const item = {
      id: id || uid("bus"), busNo: $("bus-no").value.trim(), routeName: $("bus-route-name").value.trim(),
      departure: $("bus-departure").value.trim(), status: $("bus-status").value, stops: $("bus-stops").value.trim()
    };
    const ok = await commit("buses", () => {
      if (id) db.buses = db.buses.map((x) => (x.id === id ? item : x)); else db.buses.push(item);
    }, id ? "Bus route updated." : "Bus route added.", (id ? "Updated " : "Added ") + item.busNo + " (" + item.status + ")");
    if (ok) closeModal("modal-bus");
  });
}
function deleteBus(id) { return deleteItem("buses", id, "Delete this bus route?", "Bus route removed.", "Removed a bus route"); }

/* -------------------------------------- notes -------------------------------------- */
function renderNotes() {
  const el = $("notes-grid");
  if (!el) return;
  const q = ($("notes-search") ? $("notes-search").value : "").trim().toLowerCase();
  const subj = $("notes-subject-filter") ? $("notes-subject-filter").value : "";
  const list = db.notes.filter((n) => n.branch === state.branch)
    .filter((n) => !subj || n.subject === subj)
    .filter((n) => !q || (n.title + " " + n.content + " " + n.subject + " " + n.author).toLowerCase().indexOf(q) >= 0);
  el.innerHTML = list.length === 0 ? emptyMsg("No lecture notes available for this branch.") : list.map((n) =>
    '<div class="p-5 rounded-2xl border border-slate-200/80 bg-white shadow-sm space-y-3"><div class="flex items-center justify-between gap-2">' +
    '<span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 truncate">' + esc(n.subject) + "</span>" +
    '<div class="flex items-center gap-1"><span class="text-xs text-slate-400">' + esc(n.date) + "</span>" + adminActions("openNoteModal", "deleteNote", n.id) + "</div></div>" +
    '<h4 class="font-display font-bold text-slate-900 text-base">' + esc(n.title) + "</h4>" +
    '<p class="text-xs text-slate-600 leading-relaxed whitespace-pre-line">' + esc(n.content) + "</p>" + attachmentHtml(n.attachment) +
    '<div class="text-[11px] font-semibold text-slate-500 pt-1 border-t border-slate-100">Author: ' + esc(n.author) + "</div></div>").join("");
  refreshIcons();
}

function showCurrentFile(pid, att) {
  const p = $(pid);
  if (!p) return;
  if (att && att.name) { p.textContent = "Current file: " + att.name + " (choose a new file to replace it)"; p.classList.remove("hidden"); }
  else p.classList.add("hidden");
}

function openNoteModal(id) {
  const n = id ? db.notes.find((x) => x.id === id) : null;
  setText("modal-note-heading", n ? "Edit Lecture Note" : "Upload Branch Lecture Note");
  setText("modal-note-submit-btn", n ? "Update Note" : "Publish Live");
  setVal("edit-note-id", n ? n.id : "");
  setVal("note-branch", n ? n.branch : state.branch);
  setVal("note-title", n ? n.title : "");
  fillSelect($("note-subject"), db.subjects, n ? n.subject : "");
  setVal("note-author", n ? n.author : "");
  setVal("note-content", n ? n.content : "");
  setVal("note-file", "");
  showCurrentFile("note-file-current", n && n.attachment);
  openModal("modal-note");
}

async function uploadAttachment(inputId, existing) {
  const input = $(inputId);
  const file = input && input.files && input.files[0];
  if (!file) return { ok: true, attachment: existing || null };
  if (state.mode !== "server") { toast("File attachments need the Netlify server — saved without the file.", "info"); return { ok: true, attachment: existing || null }; }
  if (file.size > MAX_FILE_BYTES) { toast("File is larger than 5 MB.", "error"); return { ok: false }; }
  try {
    const res = await fetch(API + "/file", {
      method: "POST",
      headers: { "x-admin-password": state.adminPw, "x-file-name": encodeURIComponent(file.name), "content-type": file.type || "application/octet-stream" },
      body: file
    });
    if (!res.ok) { const j = await res.json().catch(() => ({})); toast(j.error || "File upload failed.", "error"); return { ok: false }; }
    const out = await res.json();
    if (existing && existing.key) deleteFileQuiet(existing.key);
    return { ok: true, attachment: { key: out.key, name: file.name, type: file.type, size: file.size } };
  } catch (e) { toast("Upload failed (network error).", "error"); return { ok: false }; }
}
function deleteFileQuiet(key) {
  if (state.mode !== "server" || !key) return;
  fetch(API + "/file/" + encodeURIComponent(key), { method: "DELETE", headers: { "x-admin-password": state.adminPw } }).catch(() => {});
}

function handleSaveNote(e) {
  return withBusy(e, async () => {
    const id = $("edit-note-id").value;
    const old = id ? db.notes.find((x) => x.id === id) : null;
    const up = await uploadAttachment("note-file", old && old.attachment);
    if (!up.ok) return;
    const item = {
      id: id || uid("note"), branch: $("note-branch").value, title: $("note-title").value.trim(), subject: $("note-subject").value,
      author: $("note-author").value.trim(), content: $("note-content").value.trim(), date: old ? old.date : dateLabel(), attachment: up.attachment
    };
    const ok = await commit("notes", () => {
      if (id) db.notes = db.notes.map((x) => (x.id === id ? item : x)); else db.notes.unshift(item);
    }, id ? "Lecture note updated." : "Lecture note published!", (id ? "Updated note: " : "Added note: ") + item.title);
    if (ok) { closeModal("modal-note"); notifyOtherBranch(item.branch, "Note"); }
  });
}
async function deleteNote(id) {
  const n = db.notes.find((x) => x.id === id);
  if (!confirm("Delete this lecture note?")) return;
  const ok = await commit("notes", () => { db.notes = db.notes.filter((x) => x.id !== id); }, "Note deleted.", "Deleted a lecture note");
  if (ok && n && n.attachment) deleteFileQuiet(n.attachment.key);
}

/* ----------------------------------- assignments ----------------------------------- */
function setAssignmentFilter(f) {
  state.assignFilter = f;
  ["ALL", "PENDING", "SUBMITTED"].forEach((k) => {
    const b = $("filter-assign-" + k);
    if (b) b.className = "assign-filter-btn px-3.5 py-1.5 rounded-lg text-xs font-semibold " + (k === f ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200");
  });
  renderAssignments();
  refreshIcons();
}

function renderAssignments() {
  const el = $("assignments-list");
  if (!el) return;
  let list = db.assignments.filter((a) => a.branch === state.branch).sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  if (state.assignFilter === "PENDING") list = list.filter((a) => !mySubmitted.has(a.id));
  if (state.assignFilter === "SUBMITTED") list = list.filter((a) => mySubmitted.has(a.id));
  el.innerHTML = list.length === 0 ? emptyMsg("No assignments to show here.") : list.map((a) => {
    const done = mySubmitted.has(a.id);
    const overdue = !done && hoursLeft(a.deadline) < 0;
    return '<div class="p-5 rounded-2xl border shadow-sm ' + (done ? "border-emerald-200 bg-emerald-50/30" : overdue ? "border-rose-200 bg-rose-50/30" : "border-slate-200/80 bg-white") + ' space-y-3">' +
      '<div class="flex items-center justify-between gap-2"><span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 truncate">' + esc(a.subject) + "</span>" +
      '<div class="flex items-center gap-1"><span class="text-xs font-semibold ' + (done ? "text-emerald-600" : overdue ? "text-rose-600" : "text-amber-600") + '">Due: ' + esc(formatDateTime(a.deadline)) + "</span>" + adminActions("openAssignmentModal", "deleteAssignment", a.id) + "</div></div>" +
      '<h4 class="font-display font-bold text-slate-900 text-base">' + esc(a.title) + "</h4>" +
      '<p class="text-xs text-slate-600 leading-relaxed whitespace-pre-line">' + esc(a.desc) + "</p>" + attachmentHtml(a.attachment) +
      '<div class="flex items-center justify-between pt-2 border-t border-slate-100"><span class="text-[11px] font-bold ' + (done ? "text-emerald-700" : overdue ? "text-rose-600" : "text-slate-500") + '">' + (done ? "✓ Submitted" : overdue ? "Overdue" : "Pending • " + esc(timeLeftLabel(a.deadline))) + "</span>" +
      "<button onclick=\"toggleAssignmentSubmitted('" + esc(a.id) + '\')" class="px-3 py-1.5 rounded-xl text-xs font-semibold transition ' + (done ? "bg-slate-200 text-slate-700 hover:bg-slate-300" : "bg-indigo-600 text-white hover:bg-indigo-700") + '">' + (done ? "Mark Incomplete" : "Mark as Done") + "</button></div></div>";
  }).join("");
  refreshIcons();
}

function toggleAssignmentSubmitted(id) {
  if (mySubmitted.has(id)) mySubmitted.delete(id); else mySubmitted.add(id);
  lsSet("submitted", Array.from(mySubmitted));
  refreshBadges();
  renderCurrent();
  toast(mySubmitted.has(id) ? "Assignment marked as completed." : "Assignment marked pending.", "info");
}

function openAssignmentModal(id) {
  const a = id ? db.assignments.find((x) => x.id === id) : null;
  setText("modal-assign-heading", a ? "Edit Assignment" : "Add Branch Assignment");
  setText("modal-assign-submit-btn", a ? "Update Assignment" : "Save Assignment");
  setVal("edit-assign-id", a ? a.id : "");
  setVal("assign-branch", a ? a.branch : state.branch);
  setVal("assign-title", a ? a.title : "");
  fillSelect($("assign-subject"), db.subjects, a ? a.subject : "");
  setVal("assign-deadline", a ? a.deadline : "");
  setVal("assign-desc", a ? a.desc : "");
  setVal("assign-file", "");
  showCurrentFile("assign-file-current", a && a.attachment);
  openModal("modal-assignment");
}

function handleSaveAssignment(e) {
  return withBusy(e, async () => {
    const id = $("edit-assign-id").value;
    const old = id ? db.assignments.find((x) => x.id === id) : null;
    const up = await uploadAttachment("assign-file", old && old.attachment);
    if (!up.ok) return;
    const item = {
      id: id || uid("assign"), branch: $("assign-branch").value, title: $("assign-title").value.trim(), subject: $("assign-subject").value,
      deadline: $("assign-deadline").value, desc: $("assign-desc").value.trim(), attachment: up.attachment
    };
    if (!item.deadline) return toast("Please choose a deadline.", "error");
    const ok = await commit("assignments", () => {
      if (id) db.assignments = db.assignments.map((x) => (x.id === id ? item : x)); else db.assignments.unshift(item);
    }, id ? "Assignment updated." : "Assignment published successfully!", (id ? "Updated assignment: " : "New assignment: ") + item.title);
    if (ok) { closeModal("modal-assignment"); notifyOtherBranch(item.branch, "Assignment"); }
  });
}
async function deleteAssignment(id) {
  const a = db.assignments.find((x) => x.id === id);
  if (!confirm("Delete this assignment?")) return;
  const ok = await commit("assignments", () => { db.assignments = db.assignments.filter((x) => x.id !== id); }, "Assignment deleted.", "Deleted an assignment");
  if (ok && a && a.attachment) deleteFileQuiet(a.attachment.key);
}

/* -------------------------------------- quizzes -------------------------------------- */
let quizTimer = null;
let activeQuiz = null;
let qzRowCounter = 0;

function renderQuizzes() {
  const el = $("quizzes-grid");
  if (!el) return;
  const list = db.quizzes.filter((q) => q.branch === state.branch);
  el.innerHTML = list.length === 0 ? emptyMsg("No active quizzes for this branch.") : list.map((q) => {
    const last = myResults.find((r) => r.quizId === q.id);
    const n = (q.questions || []).length;
    return '<div class="p-5 rounded-2xl border border-slate-200/80 bg-white shadow-sm space-y-3"><div class="flex items-center justify-between gap-2">' +
      '<span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 truncate">' + esc(q.subject) + "</span>" +
      '<div class="flex items-center gap-1"><span class="text-xs text-slate-400">' + esc(q.durationMin) + " mins • " + n + " Qs</span>" + adminActions(null, "deleteQuiz", q.id) + "</div></div>" +
      '<h4 class="font-display font-bold text-slate-900 text-base">' + esc(q.title) + "</h4>" +
      (last ? '<p class="text-xs text-slate-500">Last score: <span class="font-semibold text-slate-800">' + last.score + "/" + last.total + "</span></p>" : "") +
      "<button onclick=\"startQuiz('" + esc(q.id) + '\')" class="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition">' + (last ? "Retake Quiz" : "Start Quiz") + "</button></div>";
  }).join("");
}

function renderQuizResults() {
  const el = $("quiz-results-list");
  if (!el) return;
  const mine = myResults.filter((r) => r.branch === state.branch).slice(0, 8);
  el.innerHTML = mine.length === 0 ? '<p class="text-xs text-slate-500 text-center py-2">No attempts yet. Start a quiz to see your score here.</p>' : mine.map((r) =>
    '<div class="flex items-center justify-between gap-3"><div class="min-w-0"><p class="text-xs font-bold text-slate-800 truncate">' + esc(r.title) + '</p><p class="text-[10px] text-slate-400">' + esc(r.date) + "</p></div>" +
    '<span class="px-2.5 py-1 rounded-lg text-xs font-bold ' + (r.score / r.total >= 0.6 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700") + '">' + r.score + "/" + r.total + "</span></div>").join("");
}

function startQuiz(id) {
  const q = db.quizzes.find((x) => x.id === id);
  if (!q || !q.questions || !q.questions.length) return toast("This quiz has no questions yet.", "error");
  activeQuiz = { quiz: q, endsAt: Date.now() + q.durationMin * 60000, submitted: false };
  setText("quiz-take-title", q.title);
  $("quiz-take-body").innerHTML = q.questions.map((qq, i) =>
    '<fieldset class="space-y-2 mb-5"><legend class="text-sm font-bold text-slate-900 mb-2">' + (i + 1) + ". " + esc(qq.q) + "</legend>" +
    qq.options.map((o, j) => '<label class="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-indigo-300 cursor-pointer text-sm"><input type="radio" name="tq-' + i + '" value="' + j + '" class="accent-indigo-600"><span>' + esc(o) + "</span></label>").join("") +
    "</fieldset>").join("");
  $("quiz-take-submit").classList.remove("hidden");
  openModal("modal-quiz-take");
  clearInterval(quizTimer);
  tickQuiz();
  quizTimer = setInterval(tickQuiz, 1000);
}
function tickQuiz() {
  if (!activeQuiz || activeQuiz.submitted) return;
  const left = Math.max(0, Math.round((activeQuiz.endsAt - Date.now()) / 1000));
  setText("quiz-take-timer", String(Math.floor(left / 60)).padStart(2, "0") + ":" + String(left % 60).padStart(2, "0"));
  if (left <= 0) submitQuiz(true);
}
function submitQuiz(auto) {
  if (!activeQuiz || activeQuiz.submitted) return;
  const quiz = activeQuiz.quiz;
  activeQuiz.submitted = true;
  clearInterval(quizTimer);
  let score = 0;
  const review = quiz.questions.map((qq, i) => {
    const sel = document.querySelector('input[name="tq-' + i + '"]:checked');
    const picked = sel ? parseInt(sel.value, 10) : -1;
    if (picked === qq.answer) score++;
    return { qq, picked };
  });
  const total = quiz.questions.length;
  $("quiz-take-body").innerHTML =
    '<div class="text-center mb-6"><p class="text-xs uppercase tracking-wider font-semibold text-slate-400">' + (auto ? "Time's up" : "Quiz submitted") + "</p>" +
    '<p class="font-display text-4xl font-bold ' + (score / total >= 0.6 ? "text-emerald-600" : "text-rose-600") + ' mt-1">' + score + " / " + total + "</p></div>" +
    review.map((r, i) =>
      '<div class="mb-3 p-3 rounded-xl border ' + (r.picked === r.qq.answer ? "border-emerald-200 bg-emerald-50/40" : "border-rose-200 bg-rose-50/40") + '">' +
      '<p class="text-sm font-semibold text-slate-900">' + (i + 1) + ". " + esc(r.qq.q) + "</p>" +
      '<p class="text-xs mt-1 text-slate-600">Your answer: <span class="font-semibold">' + (r.picked >= 0 ? esc(r.qq.options[r.picked]) : "Not answered") + "</span></p>" +
      (r.picked === r.qq.answer ? "" : '<p class="text-xs text-emerald-700">Correct answer: <span class="font-semibold">' + esc(r.qq.options[r.qq.answer]) + "</span></p>") + "</div>").join("");
  $("quiz-take-submit").classList.add("hidden");
  myResults.unshift({ quizId: quiz.id, title: quiz.title, branch: state.branch, score, total, date: nowLabel() });
  myResults = myResults.slice(0, 50);
  lsSet("quiz_results", myResults);
  renderQuizzes();
  renderQuizResults();
}
function closeQuizTake() {
  if (activeQuiz && !activeQuiz.submitted && !confirm("Leave the quiz? Your answers will be lost.")) return;
  clearInterval(quizTimer);
  activeQuiz = null;
  closeModal("modal-quiz-take");
}

function openQuizBuilder() {
  setVal("qz-branch", state.branch);
  setVal("qz-title", "");
  setVal("qz-duration", 10);
  fillSelect($("qz-subject"), db.subjects, "");
  $("qz-questions").innerHTML = "";
  addQuizQuestionRow();
  openModal("modal-quiz-builder");
}
function addQuizQuestionRow() {
  const wrap = $("qz-questions");
  const n = ++qzRowCounter;
  const div = document.createElement("div");
  div.className = "qz-row p-3 rounded-xl border border-slate-200 space-y-2";
  const input = "w-full px-3 py-2 rounded-lg border border-slate-200 text-sm";
  div.innerHTML =
    '<div class="flex items-center justify-between"><span class="qz-num text-xs font-bold text-slate-500">Question</span><button type="button" onclick="removeQuizRow(this)" class="text-xs text-rose-600 hover:underline">Remove</button></div>' +
    '<input type="text" class="qz-q ' + input + '" placeholder="Question text" required>' +
    [0, 1, 2, 3].map((i) => '<div class="flex items-center gap-2"><input type="radio" name="qz-correct-' + n + '" value="' + i + '"' + (i === 0 ? " checked" : "") + ' class="accent-emerald-600"><input type="text" class="qz-opt flex-1 ' + input + '" placeholder="Option ' + (i + 1) + '" required></div>').join("");
  wrap.appendChild(div);
  renumberQuizRows();
}
function removeQuizRow(btn) {
  const rows = document.querySelectorAll("#qz-questions .qz-row");
  if (rows.length <= 1) return toast("A quiz needs at least one question.", "error");
  btn.closest(".qz-row").remove();
  renumberQuizRows();
}
function renumberQuizRows() {
  document.querySelectorAll("#qz-questions .qz-row").forEach((r, i) => { r.querySelector(".qz-num").textContent = "Question " + (i + 1); });
}
function handleSaveQuiz(e) {
  return withBusy(e, async () => {
    const questions = Array.from(document.querySelectorAll("#qz-questions .qz-row")).map((row) => {
      const checked = row.querySelector('input[type="radio"]:checked');
      return { q: row.querySelector(".qz-q").value.trim(), options: Array.from(row.querySelectorAll(".qz-opt")).map((o) => o.value.trim()), answer: checked ? parseInt(checked.value, 10) : 0 };
    });
    if (!questions.length) return toast("Add at least one question.", "error");
    const item = {
      id: uid("quiz"), branch: $("qz-branch").value, title: $("qz-title").value.trim(), subject: $("qz-subject").value,
      durationMin: Math.max(1, parseInt($("qz-duration").value, 10) || 10), questions
    };
    const ok = await commit("quizzes", () => { db.quizzes.unshift(item); }, "Quiz published!", "New quiz: " + item.title);
    if (ok) { closeModal("modal-quiz-builder"); notifyOtherBranch(item.branch, "Quiz"); }
  });
}
function deleteQuiz(id) { return deleteItem("quizzes", id, "Delete this quiz?", "Quiz deleted.", "Deleted a quiz"); }

/* ------------------------------ settings, subjects, reset ------------------------------ */
function openPortalSettingsModal() {
  const c = Object.assign({}, DEFAULTS.config, db.config || {});
  setVal("set-brand", c.brandName); setVal("set-tagline", c.tagline); setVal("set-college", c.collegeName);
  setVal("set-email", c.helpdeskEmail); setVal("set-banner-title", c.bannerTitle); setVal("set-banner-desc", c.bannerDesc);
  openModal("modal-settings");
}
function handleSaveSettings(e) {
  return withBusy(e, async () => {
    const ok = await commit("config", () => {
      db.config = {
        brandName: $("set-brand").value.trim(), tagline: $("set-tagline").value.trim(), collegeName: $("set-college").value.trim(),
        helpdeskEmail: $("set-email").value.trim(), bannerTitle: $("set-banner-title").value.trim(), bannerDesc: $("set-banner-desc").value.trim()
      };
    }, "Portal text updated.", "Updated portal text");
    if (ok) { applyConfig(); closeModal("modal-settings"); }
  });
}

function openSubjectsModal() { renderSubjectsManager(); openModal("modal-subjects"); }
function renderSubjectsManager() {
  const el = $("subjects-manager-list");
  if (!el) return;
  el.innerHTML = db.subjects.map((s, i) =>
    '<div class="flex items-center gap-2"><input type="text" id="subj-input-' + i + '" value="' + esc(s) + '" class="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500">' +
    '<button type="button" onclick="renameSubject(' + i + ')" class="px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold">Rename</button>' +
    '<button type="button" onclick="deleteSubject(' + i + ')" class="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"><i data-lucide="trash-2" class="w-4 h-4"></i></button></div>').join("");
  refreshIcons();
}
function handleAddSubject(e) {
  return withBusy(e, async () => {
    const v = $("new-subject-input").value.trim();
    if (!v) return;
    if (db.subjects.indexOf(v) >= 0) return toast("That subject already exists.", "error");
    const ok = await commit("subjects", () => { db.subjects.push(v); }, "Subject added.", "Added subject: " + v);
    if (ok) { setVal("new-subject-input", ""); populateSubjectDropdowns(); renderSubjectsManager(); }
  });
}
async function renameSubject(i) {
  const next = $("subj-input-" + i).value.trim();
  const old = db.subjects[i];
  if (!next || next === old) return;
  if (db.subjects.indexOf(next) >= 0) return toast("That subject already exists.", "error");
  const names = ["subjects", "notes", "assignments", "schedule", "quizzes"];
  const backup = {};
  names.forEach((n) => { backup[n] = clone(db[n]); });
  db.subjects[i] = next;
  ["notes", "assignments", "schedule", "quizzes"].forEach((c) => db[c].forEach((it) => { if (it.subject === old) it.subject = next; }));
  const results = await Promise.all(names.map((n) => persist(n)));
  if (results.every(Boolean)) {
    await logActivity("Renamed subject: " + old + " → " + next);
    toast("Subject renamed everywhere.", "success");
  } else {
    names.forEach((n) => { db[n] = backup[n]; });
    await syncFromServer(true);
  }
  populateSubjectDropdowns(); renderSubjectsManager(); renderCurrent();
}
async function deleteSubject(i) {
  const name = db.subjects[i];
  if (!confirm('Remove "' + name + '" from the subject list? Existing items keep their old subject name.')) return;
  const ok = await commit("subjects", () => { db.subjects.splice(i, 1); }, "Subject removed.", "Removed subject: " + name);
  if (ok) { populateSubjectDropdowns(); renderSubjectsManager(); }
}

async function resetDemoData() {
  if (!confirm("Reset ALL portal data (schedule, notes, assignments, buses, notices, quizzes, uploaded files) back to the sample data? This cannot be undone.")) return;
  if (state.mode === "server") {
    try {
      const r = await fetch(API + "/reset", { method: "POST", headers: { "x-admin-password": state.adminPw } });
      if (!r.ok) return toast("Reset failed on the server.", "error");
    } catch (e) { return toast("Network error — reset failed.", "error"); }
  } else {
    COLLECTIONS.forEach((c) => { try { localStorage.removeItem(LS + "db_" + c); } catch (e) {} });
  }
  applyData(null);
  lastSnapshot = "";
  applyConfig(); populateSubjectDropdowns(); refreshBadges(); renderCurrent();
  toast("Portal data reset to the sample data.", "info");
}
