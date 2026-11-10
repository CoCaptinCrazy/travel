import { escapeHTML, pageHead } from "./helpers.js";

const shortcuts = [
  ["orbit", "◉", "Orbit", "Search the web, save bookmarks, and review recent history."],
  ["arcade", "◇", "Arcade", "Play a quick game and save your favorites."],
  ["cinema", "▣", "Cinema", "Keep a watchlist and review local catalog entries."],
  ["pulse", "◌", "Pulse", "Chat with people in your rooms."],
  ["nova", "✧", "Nova", "Try prompt ideas; provider setup is optional."],
  ["music", "♫", "Music", "Open your preferred music service."],
];

export function renderDashboard(user) {
  const greeting = user ? `Welcome back, ${escapeHTML(user.username)}.` : "A little space for your open web.";
  return `${pageHead("TravelX workspace", "Your next stop", greeting)}<form class="quick-search" id="dashboard-search"><label class="visually-hidden" for="dashboard-address">Search or enter an address</label><span aria-hidden="true">⌕</span><input id="dashboard-address" name="address" placeholder="Search or enter a website address" required /><button class="button" type="submit">Go ↗</button></form><p id="dashboard-search-status" class="form-success" role="status"></p><div class="grid">${shortcuts.map(([route, icon, title, description]) => `<a class="card card-link" href="#/${route}"><span class="card-icon" aria-hidden="true">${icon}</span><h3>${title}</h3><p>${description}</p></a>`).join("")}</div><p class="site-footer">External websites open directly in your browser. TravelX does not proxy or embed them.</p>`;
}
