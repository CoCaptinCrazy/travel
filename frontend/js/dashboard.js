import { escapeHTML } from "./helpers.js";

const shortcuts = [
  ["arcade", "▧", "Games"],
  ["nova", "✧", "AI"],
  ["music", "♫", "Music"],
  ["pulse", "▢", "Chat"],
  ["marketplace", "+", "Add"],
  ["store", "▦", "All Apps"],
];

export function renderDashboard(user) {
  const greeting = user ? `Welcome back, ${escapeHTML(user.username)}.` : "A little space, just for you.";
  return `<section class="start-page"><div class="start-content"><div class="start-brand"><span class="start-wordmark">travelx</span><p>${greeting}</p></div><form class="start-search" id="dashboard-search"><label class="visually-hidden" for="dashboard-address">Search or enter an address</label><span class="start-search-icon" aria-hidden="true">⌕</span><input id="dashboard-address" name="address" placeholder="Search for anything!" autocomplete="off" spellcheck="false" required /><button type="submit" aria-label="Search"><span aria-hidden="true">→</span></button></form><p id="dashboard-search-status" class="start-status" role="status" aria-live="polite"></p><nav class="start-shortcuts" aria-label="TravelX apps">${shortcuts.map(([route, icon, title]) => `<a class="start-shortcut" href="#/${route}"><span class="start-shortcut-icon" aria-hidden="true">${icon}</span><span>${title}</span></a>`).join("")}</nav><div class="start-badges"><a class="start-badge" href="#/profile"><span aria-hidden="true">♙</span>${user ? `Signed in as ${escapeHTML(user.username)}` : "Private workspace"}</a><a class="start-badge" href="#/settings"><span aria-hidden="true">⚙</span>Personalize <span class="badge-muted">your space</span></a></div><section class="clock-card" aria-label="Current time and date"><time class="clock-time" id="home-clock">--:--</time><time class="clock-date" id="home-date">Loading local time…</time></section><p class="start-footnote">TravelX <span aria-hidden="true">·</span> External websites open directly in your browser.</p></div></section>`;
}
