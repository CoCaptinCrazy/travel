import { api } from "./api.js";
import { escapeHTML, pageHead } from "./helpers.js";

export async function renderProfile() {
  try {
    const data = await api("/api/profile");
    const user = data.user;
    return `${pageHead("Account", "Your profile", "Your account details and saved preferences.")}<section class="card profile-card"><p class="eyebrow">TravelX account</p><h2>${escapeHTML(user.username)}</h2><p>Role: ${escapeHTML(user.role)}</p><p>Member since: ${escapeHTML(user.created_at)}</p><div class="button-row"><a class="button secondary" href="#/settings">Preferences</a><a class="button secondary" href="#/bookmarks">Bookmarks</a></div></section>`;
  } catch (error) {
    return `${pageHead("Account", "Your profile")}<div class="notice">${escapeHTML(error.message)} <a href="#/login">Sign in</a></div>`;
  }
}
