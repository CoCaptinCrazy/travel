import { api, setCsrfToken } from "./api.js";
import { showMessage } from "./helpers.js";

export function renderAuth(mode) {
  const register = mode === "register";
  const title = register ? "Create your account" : "Welcome back";
  return `<main class="auth-wrap"><div class="auth-box"><a class="auth-brand" href="#/dashboard"><span class="brand-mark" aria-hidden="true">T</span> TravelX</a><section class="form"><p class="eyebrow">Your TravelX account</p><h1>${title}</h1><p class="small">${register ? "Make an account to save bookmarks, join chat, and keep your settings." : "Sign in to pick up where you left off."}</p><form id="auth-form"><label class="field">Username<input class="input" name="username" minlength="3" maxlength="32" autocomplete="username" required /></label><label class="field">Password<input class="input" name="password" type="password" minlength="10" maxlength="128" autocomplete="${register ? "new-password" : "current-password"}" required /></label><button class="button" type="submit">${register ? "Create account" : "Sign in"}</button><p class="form-error" id="auth-message" role="status" aria-live="polite"></p></form><p class="small">${register ? `Already have an account? <a href="#/login">Sign in</a>.` : `New to TravelX? <a href="#/register">Create an account</a>.`}</p></section><p class="site-footer">Accounts are stored in the local TravelX database.</p></div></main>`;
}

export function bindAuth(mode, onSuccess) {
  const form = document.querySelector("#auth-form");
  const message = document.querySelector("#auth-message");
  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const username = String(formData.get("username") || "").trim();
    const password = String(formData.get("password") || "");
    const button = form.querySelector("button");
    button.disabled = true;
    showMessage(message, mode === "register" ? "Creating account…" : "Signing in…");
    try {
      const session = await api(`/api/auth/${mode}`, { method: "POST", body: { username, password } });
      setCsrfToken(session.csrfToken);
      onSuccess(session.user);
    } catch (error) {
      showMessage(message, error.message, true);
    } finally {
      button.disabled = false;
    }
  });
}
