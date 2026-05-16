// ─── Supabase Config ───────────────────────────────────────────────
const SUPABASE_URL = "https://zbcpeazglxvuowwgyhdx.supabase.co";
const SUPABASE_KEY = "sb_publishable_Y5ePrQDGeAYU4fUt4562Og_TaQ7gROQ";

const sb = {
  headers: {
    "Content-Type": "application/json",
    "apikey": SUPABASE_KEY,
    "Authorization": "Bearer " + SUPABASE_KEY
  },

  async get(table, query = "") {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
      headers: this.headers
    });
    return res.json();
  },

  async post(table, body) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: { ...this.headers, "Prefer": "return=representation" },
      body: JSON.stringify(body)
    });
    return res.json();
  },

  async delete(table, query) {
    await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
      method: "DELETE",
      headers: this.headers
    });
  },

  async patch(table, query, body) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
      method: "PATCH",
      headers: { ...this.headers, "Prefer": "return=representation" },
      body: JSON.stringify(body)
    });
    return res.json();
  }
};

// Simple XOR encode (not for production use — replace with real encryption)
function encode(str) { return btoa(unescape(encodeURIComponent(str))); }
function decode(str) { try { return decodeURIComponent(escape(atob(str))); } catch { return ""; } }
