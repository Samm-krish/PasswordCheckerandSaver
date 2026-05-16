// ─── Auth Logic ────────────────────────────────────────────────────

async function signup() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  if (!email || !password) return showToast("Fill in all fields", "error");

  const existing = await sb.get("users", `email=eq.${encodeURIComponent(email)}`);
  if (existing.length > 0) return showToast("Account already exists", "error");

  await sb.post("users", { email, password_hash: encode(password), created_at: new Date().toISOString() });
  showToast("Account created! Please log in.", "success");
  switchTab("login");
}

async function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  if (!email || !password) return showToast("Fill in all fields", "error");

  const data = await sb.get("users", `email=eq.${encodeURIComponent(email)}&password_hash=eq.${encode(password)}`);
  if (data.length === 0) return showToast("Invalid credentials ✗", "error");

  localStorage.setItem("cs_user", email);
  localStorage.setItem("cs_uid", data[0].id || email);
  window.location.href = "dashboard.html";
}

function logout() {
  localStorage.removeItem("cs_user");
  localStorage.removeItem("cs_uid");
  window.location.href = "index.html";
}

function guardAuth() {
  if (!localStorage.getItem("cs_user")) window.location.href = "index.html";
}

// ─── Tab switching ──────────────────────────────────────────────────
function switchTab(tab) {
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
  document.querySelector(`[data-tab="${tab}"]`).classList.add("active");
  document.getElementById("tab-title").textContent = tab === "login" ? "Welcome back" : "Create account";
  document.getElementById("action-btn").textContent = tab === "login" ? "Sign In" : "Create Account";
  document.getElementById("action-btn").onclick = tab === "login" ? login : signup;
}

// ─── Toast ──────────────────────────────────────────────────────────
function showToast(msg, type = "info") {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = `toast show ${type}`;
  setTimeout(() => t.classList.remove("show"), 3000);
}
