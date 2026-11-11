import { escapeHTML } from "./helpers.js";

const apps = [
  ["arcade", "▧", "Arcade", "A quick game for a little break.", "arcade"],
  ["nova", "✧", "Nova", "A space for prompts and ideas.", "nova"],
  ["music", "♫", "Music", "Pick up the soundtrack to your day.", "music"],
  ["pulse", "▢", "Pulse", "Rooms and conversations, together.", "pulse"],
  ["cinema", "▣", "Cinema", "Keep a list for your next movie night.", "cinema"],
  ["marketplace", "⬡", "Discover", "See what else is in your workspace.", "marketplace"],
];

const links = [
  ["Google", "https://www.google.com/", "G", "Search"],
  ["YouTube", "https://www.youtube.com/", "▶", "Watch"],
  ["Wikipedia", "https://www.wikipedia.org/", "W", "Learn"],
  ["GitHub", "https://github.com/", "⌘", "Build"],
];

export function renderDashboard(user) {
  const username = user ? escapeHTML(user.username) : null;
  const greeting = username ? `Good to see you, ${username}.` : "A little room for what’s next.";
  const appCards = apps.map(([route, icon, title, description, tone]) =>
    `<a class="app-tile tone-${tone}" href="#/${route}"><span class="app-tile-icon" aria-hidden="true">${icon}</span><span class="app-tile-copy"><strong>${title}</strong><small>${description}</small></span><span class="app-tile-arrow" aria-hidden="true">↗</span></a>`
  ).join("");
  const quickLinks = links.map(([title, href, icon, verb]) =>
    `<a class="destination-link" href="${href}" target="_blank" rel="noopener noreferrer"><span class="destination-icon" aria-hidden="true">${icon}</span><span class="destination-copy"><strong>${title}</strong><small>${verb}</small></span><span class="destination-arrow" aria-hidden="true">↗</span></a>`
  ).join("");

  return `<section class="start-page"><div class="start-layout"><header class="welcome-panel"><div class="welcome-panel-copy"><p class="section-kicker"><span class="kicker-mark" aria-hidden="true">✳</span> YOUR TRAVELX STARTING POINT</p><h1>${greeting}</h1><p class="welcome-description">A few familiar places, a few new directions. Choose where the day takes you.</p></div><div class="welcome-illustration" aria-hidden="true"><span class="sun-disc"></span><span class="sun-horizon"></span><span class="sunline sunline-one"></span><span class="sunline sunline-two"></span><span class="sunline sunline-three"></span><span class="sun-caption">FIND YOUR<br />OWN WAY</span></div><form class="start-search" id="dashboard-search"><label class="visually-hidden" for="dashboard-address">Search or enter an address</label><span class="start-search-icon" aria-hidden="true">⌕</span><input id="dashboard-address" name="address" placeholder="Where do you want to go?" autocomplete="off" spellcheck="false" required /><span class="search-hint">SEARCH OR URL</span><button type="submit" aria-label="Search"><span aria-hidden="true">→</span></button></form><p id="dashboard-search-status" class="start-status" role="status" aria-live="polite"></p></header><div class="start-main-grid"><section class="apps-panel"><div class="panel-heading"><div><p class="section-kicker">YOUR TOOLKIT</p><h2>Pick a starting point</h2></div><a class="subtle-link" href="#/store">All apps <span aria-hidden="true">↗</span></a></div><nav class="app-grid" aria-label="TravelX apps">${appCards}</nav><section class="destinations-panel"><div class="panel-heading compact-heading"><div><p class="section-kicker">OUT IN THE WORLD</p><h2>Places you know</h2></div><span class="destination-note">Opens in a new tab</span></div><div class="destination-grid">${quickLinks}</div></section></section><aside class="side-widgets"><section class="time-widget"><div class="widget-topline"><span class="widget-label">YOUR LOCAL TIME</span><span class="sun-symbol" aria-hidden="true">☼</span></div><time class="clock-time" id="home-clock">--:--</time><time class="clock-date" id="home-date">Loading local date…</time><div class="time-rule"></div><p class="time-note">Take the long way if you like.</p><span class="contour contour-one" aria-hidden="true"></span><span class="contour contour-two" aria-hidden="true"></span></section><section class="account-widget"><span class="account-icon" aria-hidden="true">${username ? username.slice(0, 1).toUpperCase() : "T"}</span><div class="account-copy"><strong>${username || "Make it yours"}</strong><small>${username ? "Your TravelX space is ready." : "Create an account to save bookmarks and history."}</small></div><a href="${username ? "#/profile" : "#/register"}" aria-label="${username ? "Open profile" : "Create account"}">↗</a></section><a class="settings-widget" href="#/settings"><span aria-hidden="true">☷</span><span><strong>Set the scene</strong><small>Make TravelX feel like yours</small></span><span class="settings-arrow" aria-hidden="true">→</span></a></aside></div><footer class="start-footnote"><span>TRAVELX <i aria-hidden="true">/</i> TAKE YOUR TIME</span><span>External websites open directly in your browser.</span></footer></div></section>`;
}
