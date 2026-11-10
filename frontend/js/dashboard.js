import { escapeHTML, pageHead } from "./helpers.js";

const shortcuts = [
  ["orbit", "◉", "Orbit", "Search the web, keep bookmarks, and revisit recent pages.", "Explore the web"],
  ["arcade", "◇", "Arcade", "Take a quick break with a little game.", "Play a round"],
  ["cinema", "▣", "Cinema", "Keep a list of titles and share your reviews.", "Browse titles"],
  ["pulse", "◌", "Pulse", "Find your room and catch up with friends.", "Open chat"],
  ["nova", "✧", "Nova", "A workspace for prompts and future AI connections.", "Explore Nova"],
  ["music", "♫", "Music", "Jump straight to the music service you already use.", "Find your sound"],
];

const quickLinks = [
  ["Google", "https://www.google.com/", "G"],
  ["YouTube", "https://www.youtube.com/", "▶"],
  ["Wikipedia", "https://www.wikipedia.org/", "W"],
  ["GitHub", "https://github.com/", "⌘"],
];

function greetingFor(user) {
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  return user ? `${timeGreeting}, ${user.username}.` : `${timeGreeting}. Welcome to TravelX.`;
}

export function renderDashboard(user) {
  const cards = shortcuts.map(([route, icon, title, description, action]) =>
    `<a class="feature-card" href="#/${route}"><span class="feature-icon" aria-hidden="true">${icon}</span><span class="feature-card-copy"><strong>${title}</strong><small>${description}</small><span class="feature-action">${action} <span aria-hidden="true">→</span></span></span></a>`
  ).join("");

  const links = quickLinks.map(([title, url, icon]) =>
    `<a class="web-shortcut" href="${url}" target="_blank" rel="noopener noreferrer"><span class="shortcut-glyph" aria-hidden="true">${icon}</span><span>${title}</span><span class="shortcut-arrow" aria-hidden="true">↗</span></a>`
  ).join("");

  return `<section class="dashboard-hero"><div class="hero-copy"><p class="eyebrow">Your TravelX workspace</p><h1>${escapeHTML(greetingFor(user))}</h1><p class="hero-description">A fresh tab, a little inspiration, and your favorite places to go. What are you in the mood for?</p><form class="dashboard-search" id="dashboard-search"><label class="visually-hidden" for="dashboard-address">Search or enter an address</label><span class="search-glyph" aria-hidden="true">⌕</span><input id="dashboard-address" name="address" placeholder="Search or enter a website address" autocomplete="off" spellcheck="false" required /><button class="button" type="submit">Search <span aria-hidden="true">↗</span></button></form><p id="dashboard-search-status" class="search-status" role="status" aria-live="polite"></p><div class="hero-meta"><span><span class="status-dot"></span> Ready when you are</span><span>External sites open directly in a new tab</span></div></div><div class="hero-art" aria-hidden="true"><div class="orbit orbit-one"></div><div class="orbit orbit-two"></div><div class="orbit orbit-three"></div><div class="planet"><span>T</span></div><span class="orbit-spark spark-one">✦</span><span class="orbit-spark spark-two">✧</span><span class="orbit-spark spark-three">·</span><span class="orbit-label">YOUR NEXT<br />STOP</span></div></section><section class="dashboard-section"><div class="section-topline"><div><p class="eyebrow">Make yourself at home</p><h2>Your spaces</h2></div><a class="text-link" href="#/settings">Personalize <span aria-hidden="true">→</span></a></div><div class="feature-grid">${cards}</div></section><section class="dashboard-section quick-links-section"><div class="section-topline"><div><p class="eyebrow">One click away</p><h2>Quick links</h2></div><a class="text-link" href="#/orbit">Open Orbit <span aria-hidden="true">→</span></a></div><div class="web-shortcut-grid">${links}</div></section><footer class="dashboard-footer"><span>TravelX <span aria-hidden="true">·</span> A comfortable place to begin.</span><span>${user ? `Signed in as ${escapeHTML(user.username)}` : `<a href="#/login">Sign in</a> to save bookmarks and history`}</span></footer>`;
}
