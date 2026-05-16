// ─── Password Manager Logic ─────────────────────────────────────────

let allPasswords = [];
let currentFilter = "all";
let searchQuery = "";

// ─── Strength ──────────────────────────────────────────────────────
function analyzeStrength(pwd) {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;

  const levels = [
    { label: "Very Weak", color: "#ff3b3b", width: "15%", time: "instantly" },
    { label: "Weak",      color: "#ff8c00", width: "30%", time: "minutes" },
    { label: "Fair",      color: "#ffd60a", width: "55%", time: "hours" },
    { label: "Strong",    color: "#34d399", width: "80%", time: "years" },
    { label: "Very Strong", color: "#00e5ff", width: "100%", time: "centuries" },
  ];
  return { score, ...levels[Math.min(score, 4)] };
}

function checkStrength() {
  const pwd = document.getElementById("pwd-input").value;
  const result = analyzeStrength(pwd);
  const bar = document.getElementById("strength-bar");
  bar.style.width = result.width;
  bar.style.background = result.color;
  document.getElementById("strength-label").textContent = result.label;
  document.getElementById("crack-time").textContent = `⏱ Crack time: ${result.time}`;
}

// ─── Password Generator ─────────────────────────────────────────────
function generatePassword() {
  const len = parseInt(document.getElementById("gen-length").value) || 16;
  const useUpper = document.getElementById("gen-upper").checked;
  const useNum   = document.getElementById("gen-numbers").checked;
  const useSym   = document.getElementById("gen-symbols").checked;

  let chars = "abcdefghijklmnopqrstuvwxyz";
  if (useUpper)  chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (useNum)    chars += "0123456789";
  if (useSym)    chars += "!@#$%^&*()-_=+[]{}|;:,.<>?";

  let pwd = Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  document.getElementById("pwd-input").value = pwd;
  checkStrength();
}

// ─── Save ───────────────────────────────────────────────────────────
async function savePassword() {
  const user = localStorage.getItem("cs_user");
  const site  = document.getElementById("site-name").value.trim();
  const uname = document.getElementById("site-user").value.trim();
  const pwd   = document.getElementById("pwd-input").value;
  const cat   = document.getElementById("category").value;
  const notes = document.getElementById("notes").value.trim();

  if (!site || !pwd) return showToast("Site & password are required", "error");

  const result = analyzeStrength(pwd);

  await sb.post("passwords", {
    user_email: user,
    site_name: site,
    username: uname,
    password_value: encode(pwd),
    strength: result.label,
    category: cat,
    notes: notes,
    created_at: new Date().toISOString()
  });

  showToast("Password saved ✓", "success");
  clearForm();
  closeModal();
  loadPasswords();
}

function clearForm() {
  ["site-name","site-user","pwd-input","notes"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  const bar = document.getElementById("strength-bar");
  if (bar) { bar.style.width = "0%"; }
  const sl = document.getElementById("strength-label");
  if (sl) sl.textContent = "";
  const ct = document.getElementById("crack-time");
  if (ct) ct.textContent = "";
}

// ─── Load & Render ─────────────────────────────────────────────────
async function loadPasswords() {
  const user = localStorage.getItem("cs_user");
  allPasswords = await sb.get("passwords", `user_email=eq.${encodeURIComponent(user)}&order=created_at.desc`);
  renderPasswords();
  updateStats();
}

function renderPasswords() {
  const list = document.getElementById("passwords-list");
  if (!list) return;

  let filtered = allPasswords;
  if (currentFilter !== "all") filtered = filtered.filter(p => p.category === currentFilter);
  if (searchQuery) filtered = filtered.filter(p =>
    p.site_name.toLowerCase().includes(searchQuery) ||
    (p.username || "").toLowerCase().includes(searchQuery)
  );

  if (filtered.length === 0) {
    list.innerHTML = `<div class="empty-state">
      <div class="empty-icon">🔐</div>
      <p>No passwords yet. Add your first one!</p>
    </div>`;
    return;
  }

  list.innerHTML = filtered.map(p => `
    <div class="pwd-card" data-id="${p.id}">
      <div class="pwd-favicon">${getFavicon(p.site_name)}</div>
      <div class="pwd-info">
        <div class="pwd-site">${escHtml(p.site_name)}</div>
        <div class="pwd-user">${escHtml(p.username || "—")}</div>
      </div>
      <div class="pwd-meta">
        <span class="badge badge-${(p.strength||'').toLowerCase().replace(' ','-')}">${p.strength || "?"}</span>
        <span class="badge badge-cat">${p.category || "other"}</span>
      </div>
      <div class="pwd-actions">
        <button class="icon-btn" title="Copy password" onclick="copyPassword('${p.id}','${encode(p.password_value)}')">📋</button>
        <button class="icon-btn" title="View" onclick="viewPassword('${p.id}')">👁</button>
        <button class="icon-btn danger" title="Delete" onclick="deletePassword('${p.id}')">🗑</button>
      </div>
    </div>
  `).join("");
}

function getFavicon(site) {
  const icons = {
    google: "G", github: "GH", twitter: "TW", facebook: "FB",
    instagram: "IG", amazon: "A", netflix: "N", spotify: "S",
    apple: "🍎", microsoft: "M", discord: "DC", linkedin: "in"
  };
  const key = Object.keys(icons).find(k => site.toLowerCase().includes(k));
  return key ? icons[key] : site.charAt(0).toUpperCase();
}

function escHtml(str) {
  return (str || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

// ─── Copy ───────────────────────────────────────────────────────────
async function copyPassword(id, encodedVal) {
  const decoded = decode(encodedVal);
  await navigator.clipboard.writeText(decoded).catch(() => {});
  showToast("Password copied!", "success");
}

// ─── View ───────────────────────────────────────────────────────────
function viewPassword(id) {
  const p = allPasswords.find(x => x.id == id);
  if (!p) return;
  const modal = document.getElementById("view-modal");
  document.getElementById("view-site").textContent = p.site_name;
  document.getElementById("view-user").textContent = p.username || "—";
  document.getElementById("view-pwd").textContent = decode(p.password_value);
  document.getElementById("view-cat").textContent = p.category || "other";
  document.getElementById("view-notes").textContent = p.notes || "—";
  document.getElementById("view-date").textContent = new Date(p.created_at).toLocaleDateString();
  modal.classList.add("open");
}

// ─── Delete ─────────────────────────────────────────────────────────
async function deletePassword(id) {
  if (!confirm("Delete this password?")) return;
  await sb.delete("passwords", `id=eq.${id}`);
  showToast("Deleted", "info");
  loadPasswords();
}

// ─── Stats ──────────────────────────────────────────────────────────
function updateStats() {
  const total = allPasswords.length;
  const strong = allPasswords.filter(p => p.strength === "Strong" || p.strength === "Very Strong").length;
  const weak   = allPasswords.filter(p => p.strength === "Weak" || p.strength === "Very Weak").length;

  document.getElementById("stat-total").textContent = total;
  document.getElementById("stat-strong").textContent = strong;
  document.getElementById("stat-weak").textContent = weak;
}

// ─── Filters ────────────────────────────────────────────────────────
function setFilter(cat) {
  currentFilter = cat;
  document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
  document.querySelector(`[data-filter="${cat}"]`).classList.add("active");
  renderPasswords();
}

function doSearch(e) {
  searchQuery = e.target.value.toLowerCase();
  renderPasswords();
}

// ─── Modals ─────────────────────────────────────────────────────────
function openAddModal() {
  document.getElementById("add-modal").classList.add("open");
}

function closeModal() {
  document.querySelectorAll(".modal").forEach(m => m.classList.remove("open"));
}

// ─── Toast ──────────────────────────────────────────────────────────
function showToast(msg, type = "info") {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = `toast show ${type}`;
  setTimeout(() => t.classList.remove("show"), 3000);
}
