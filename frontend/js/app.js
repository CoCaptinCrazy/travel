import { api, setCsrfToken } from "./api.js";
import { bindAuth, renderAuth } from "./auth.js";
import { renderAdmin } from "./admin.js";
import { bindAI, renderAI } from "./nova/ai.js";
import { bindArcade, renderArcade } from "./arcade/games.js";
import { bindBookmarks, renderBookmarks } from "./orbit/bookmarks.js";
import { bindBrowser, renderBrowser } from "./orbit/browser.js";
import { bindHistory, renderHistory } from "./orbit/history.js";
import { bindChat, renderChat } from "./pulse/chat.js";
import { bindCinema, renderCinema } from "./cinema/movies.js";
import { bindWatchlist, renderWatchlist } from "./cinema/watchlist.js";
import { bindSettings, renderSettings } from "./settings.js";
import { renderDashboard } from "./dashboard.js";
import { renderDownloads } from "./downloads.js";
import { renderMarketplace } from "./marketplace.js";
import { bindMusic, renderMusic } from "./music.js";
import { navbar } from "./navbar.js";
import { bindNotifications, renderNotifications } from "./notifications.js";
import { renderProfile } from "./profile.js";
import { sidebar } from "./sidebar.js";
import { renderStore } from "./store.js";
import { destinationFor } from "./orbit/engines.js";

const app = document.querySelector("#app");
let user = null;
let routeVersion = 0;
let cleanup = () => {};

function currentRoute() {
  const hashRoute = window.location.hash.replace(/^#\/?/, "").split("?")[0];
  return (hashRoute || document.body.dataset.page || "home").toLowerCase();
}

function renderShell(route, content) {
  return `<div class="shell">${sidebar(user, route)}<div class="main-area">${navbar(user)}<main class="content" id="route-content">${content}</main></div></div>`;
}

async function loadView(route) {
  switch (route) {
    case "home":
    case "dashboard":
      return renderDashboard(user);
    case "orbit":
      return renderBrowser(user);
    case "bookmarks":
      return renderBookmarks();
    case "history":
      return renderHistory();
    case "arcade":
      return renderArcade();
    case "favorites":
      return renderArcade(true);
    case "cinema":
      return renderCinema();
    case "watchlist":
      return renderWatchlist();
    case "pulse":
      return user ? renderChat(user) : `<section class="page-head"><p class="eyebrow">Pulse</p><h1>Room to talk</h1><p class="lead">Sign in to join local rooms and chat with other TravelX users.</p><a class="button" href="#/login">Sign in</a></section>`;
    case "nova":
      return renderAI();
    case "music":
      return renderMusic();
    case "marketplace":
      return renderMarketplace();
    case "downloads":
      return renderDownloads();
    case "profile":
      return renderProfile();
    case "settings":
      return renderSettings();
    case "notifications":
      return renderNotifications();
    case "admin":
      return renderAdmin();
    case "store":
      return renderStore();
    default:
      return `<section class="page-head"><p class="eyebrow">TravelX</p><h1>Page not found</h1><p class="lead">That section does not exist.</p><a class="button" href="#/dashboard">Back to dashboard</a></section>`;
  }
}

function bindDashboardSearch() {
  document.querySelector("#dashboard-search")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const status = document.querySelector("#dashboard-search-status");
    try {
      const destination = destinationFor(new FormData(form).get("address"));
      window.open(destination.href, "_blank", "noopener,noreferrer");
      status.textContent = `Opening ${destination.hostname} in a new tab.`;
      if (user) {
        api("/api/history", {
          method: "POST",
          body: { title: destination.hostname, url: destination.href },
        }).catch((error) => {
          status.textContent = `Opened ${destination.hostname}. History could not be saved: ${error.message}`;
        });
      } else {
        status.textContent += " Sign in to save browsing history.";
      }
    } catch (error) {
      status.textContent = error.message;
      status.className = "form-error";
    }
  });
}

function bindChrome() {
  document.querySelector("#chrome-search")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    try {
      const destination = destinationFor(new FormData(form).get("address"));
      window.open(destination.href, "_blank", "noopener,noreferrer");
      form.reset();
    } catch (error) {
      form.querySelector("input").setCustomValidity(error.message);
      form.reportValidity();
      form.querySelector("input").addEventListener("input", () => {
        form.querySelector("input").setCustomValidity("");
      }, { once: true });
    }
  });
  document.querySelector('[data-action="back"]')?.addEventListener("click", () => history.back());
  document.querySelector('[data-action="forward"]')?.addEventListener("click", () => history.forward());
  document.querySelector('[data-action="reload"]')?.addEventListener("click", () => location.reload());
  document.querySelector('[data-action="new-tab"]')?.addEventListener("click", () => {
    window.location.hash = "#/dashboard";
    document.querySelector("#dashboard-address")?.focus();
  });
  document.querySelector('[data-action="fullscreen"]')?.addEventListener("click", async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch (error) {
      console.error("Could not toggle fullscreen.", error);
    }
  });
}

async function renderRoute() {
  const version = ++routeVersion;
  cleanup();
  cleanup = () => {};
  const route = currentRoute();

  if (route === "login" || route === "register") {
    app.innerHTML = renderAuth(route);
    bindAuth(route, (newUser) => {
      user = newUser;
      window.location.hash = "#/dashboard";
      if (window.location.hash === "#/dashboard") renderRoute();
    });
    bindLogout();
    return;
  }

  if (route === "home" || route === "dashboard") {
    app.innerHTML = renderShell("dashboard", renderDashboard(user));
    bindDashboardSearch();
    bindChrome();
    startClock();
    bindLogout();
    return;
  }

  app.innerHTML = renderShell(route, `<div class="empty">${route === "orbit" ? "Opening your workspace…" : "Loading…"}</div>`);
  bindChrome();
  try {
    const content = await loadView(route);
    if (version !== routeVersion) return;
    const routeContent = document.querySelector("#route-content");
    routeContent.innerHTML = content;
    switch (route) {
      case "dashboard":
      case "home":
        bindDashboardSearch();
        break;
      case "orbit":
        bindBrowser(user);
        break;
      case "bookmarks":
        bindBookmarks();
        break;
      case "history":
        bindHistory();
        break;
      case "arcade":
      case "favorites":
        bindArcade();
        break;
      case "cinema":
        bindCinema();
        break;
      case "watchlist":
        bindWatchlist();
        break;
      case "pulse":
        if (user) bindChat((fn) => { cleanup = fn; }, user);
        break;
      case "nova":
        bindAI();
        break;
      case "music":
        bindMusic();
        break;
      case "settings":
        bindSettings();
        break;
      case "notifications":
        bindNotifications();
        break;
    }
    bindLogout();
  } catch (error) {
    if (version === routeVersion) {
      document.querySelector("#route-content").innerHTML =
        `<div class="notice">${error.message}</div>`;
    }
  }
}

let clockTimer;
function startClock() {
  window.clearInterval(clockTimer);
  const update = () => {
    const time = document.querySelector("#home-clock");
    const date = document.querySelector("#home-date");
    if (!time || !date) return;
    const now = new Date();
    time.textContent = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(now);
    date.textContent = new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" }).format(now);
  };
  update();
  clockTimer = window.setInterval(update, 30_000);
}

function bindLogout() {
  app.querySelector('[data-action="logout"]')?.addEventListener("click", async () => {
    try {
      await api("/api/auth/logout", { method: "POST", body: {} });
      user = null;
      setCsrfToken(null);
      window.location.hash = "#/dashboard";
      renderRoute();
    } catch (error) {
      window.alert(error.message);
    }
  });
}

async function initialize() {
  if (localStorage.getItem("travelx-terms-accepted-1") !== "yes") {
    window.location.replace("/");
    return;
  }

  await renderRoute();
  try {
    const session = await api("/api/me");
    user = session.user;
    setCsrfToken(session.csrfToken);
    if (user) {
      try {
        const profile = await api("/api/profile");
        document.body.classList.toggle("light", profile.settings.theme === "light");
        document.body.classList.toggle("compact", Boolean(profile.settings.compactMode));
      } catch (error) {
        console.error("Could not load saved TravelX preferences.", error);
      }
    }
  } catch (error) {
    console.error("Could not load TravelX session.", error);
  }
  await renderRoute();
}

window.addEventListener("hashchange", renderRoute);
initialize();
