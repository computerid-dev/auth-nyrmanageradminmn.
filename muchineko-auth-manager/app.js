import { initializeApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";
import {
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, deleteDoc, collection, getDocs, serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";

const $ = (id) => document.getElementById(id);
const els = {
  notice: $("notice"), loginView: $("loginView"), panelView: $("panelView"), logoutBtn: $("logoutBtn"),
  loginForm: $("loginForm"), addForm: $("addForm"), list: $("adminList")
};

const ERROR_TEXT = {
  "auth/invalid-credential": "Email atau password salah.",
  "auth/invalid-email": "Format email tidak valid.",
  "auth/email-already-in-use": "Email sudah terdaftar di Firebase Auth.",
  "auth/weak-password": "Password terlalu lemah.",
  "auth/too-many-requests": "Terlalu banyak percobaan. Coba lagi nanti.",
  "auth/network-request-failed": "Koneksi bermasalah. Periksa internet.",
  "permission-denied": "Ditolak oleh Firestore Rules. Pastikan dokumen owner di koleksi admins sudah benar."
};
const errorText = (err) => ERROR_TEXT[err?.code] || `Terjadi kesalahan: ${err?.code || err?.message}`;

let auth, db, creatorAuth;

function notify(text, type = "ok") {
  els.notice.textContent = text;
  els.notice.className = `notice notice--${type}`;
  els.notice.hidden = false;
}

function showView(name) {
  els.loginView.hidden = name !== "login";
  els.panelView.hidden = name !== "panel";
  els.logoutBtn.hidden = name !== "panel";
}

function setBusy(form, busy) {
  form.querySelector("button[type=submit]").disabled = busy;
}

async function loadConfig() {
  const res = await fetch("/api/config", { cache: "no-store" }).catch(() => null);
  if (!res) throw new Error("Server tidak bisa dihubungi.");
  if (res.status === 403) {
    location.replace("/?blocked=1");
    return null;
  }
  if (!res.ok) throw new Error("Konfigurasi belum lengkap. Cek environment variable.");
  return res.json();
}

function buildItem(item) {
  const li = document.createElement("li");
  li.className = "admin-item";

  const info = document.createElement("div");
  const email = document.createElement("div");
  email.className = "admin-item__email";
  email.textContent = item.email || item.uid;
  const badge = document.createElement("span");
  badge.className = "badge";
  badge.textContent = item.role;
  info.append(email, badge);
  li.append(info);

  if (item.role !== "owner") {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn btn--danger";
    btn.textContent = "Cabut akses";
    btn.addEventListener("click", () => revokeAccess(item, btn));
    li.append(btn);
  }
  return li;
}

async function renderAdmins() {
  const snap = await getDocs(collection(db, "admins"));
  const items = snap.docs
    .map((d) => ({ uid: d.id, ...d.data() }))
    .sort((a, b) => Number(b.role === "owner") - Number(a.role === "owner") || String(a.email).localeCompare(String(b.email)));
  els.list.replaceChildren(...items.map(buildItem));
}

async function revokeAccess(item, btn) {
  if (!confirm(`Cabut akses ${item.email}? Akun Auth-nya tetap ada, tapi tidak bisa masuk dashboard.`)) return;
  btn.disabled = true;
  try {
    await deleteDoc(doc(db, "admins", item.uid));
    notify(`Akses ${item.email} dicabut.`);
    await renderAdmins();
  } catch (err) {
    btn.disabled = false;
    notify(errorText(err), "error");
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const { email, password } = els.loginForm.elements;
  if (!email.value.trim() || !password.value) return notify("Email dan password wajib diisi.", "error");
  setBusy(els.loginForm, true);
  try {
    await signInWithEmailAndPassword(auth, email.value.trim(), password.value);
    els.notice.hidden = true;
  } catch (err) {
    notify(errorText(err), "error");
  } finally {
    setBusy(els.loginForm, false);
  }
}

async function handleAddAdmin(e) {
  e.preventDefault();
  const form = els.addForm;
  const email = form.elements.email.value.trim().toLowerCase();
  const password = form.elements.password.value;
  if (!/^\S+@\S+\.\S+$/.test(email)) return notify("Format email tidak valid.", "error");
  if (password.length < 8) return notify("Password minimal 8 karakter.", "error");

  setBusy(form, true);
  let uid = null;
  try {
    // App kedua dipakai supaya sesi owner tidak terganti akun baru.
    const cred = await createUserWithEmailAndPassword(creatorAuth, email, password);
    uid = cred.user.uid;
    await signOut(creatorAuth);
    await setDoc(doc(db, "admins", uid), { email, role: "admin", createdAt: serverTimestamp() });
    form.reset();
    notify(`Admin ${email} berhasil didaftarkan.`);
    await renderAdmins();
  } catch (err) {
    notify(uid ? `Akun dibuat (UID ${uid}) tapi gagal masuk daftar admin. ${errorText(err)}` : errorText(err), "error");
  } finally {
    setBusy(form, false);
  }
}

async function handleAuthState(user) {
  if (!user) return showView("login");
  try {
    const snap = await getDoc(doc(db, "admins", user.uid));
    if (!snap.exists() || snap.data().role !== "owner") {
      await signOut(auth);
      return notify("Akun ini bukan owner.", "error");
    }
    els.notice.hidden = true;
    showView("panel");
    await renderAdmins();
  } catch (err) {
    await signOut(auth);
    notify(errorText(err), "error");
  }
}

async function boot() {
  let config;
  try {
    config = await loadConfig();
  } catch (err) {
    return notify(err.message, "error");
  }
  if (!config) return;

  auth = getAuth(initializeApp(config));
  db = getFirestore(auth.app);
  creatorAuth = getAuth(initializeApp(config, "creator"));

  els.loginForm.addEventListener("submit", handleLogin);
  els.addForm.addEventListener("submit", handleAddAdmin);
  els.logoutBtn.addEventListener("click", () => signOut(auth));
  onAuthStateChanged(auth, handleAuthState);
}

boot();
