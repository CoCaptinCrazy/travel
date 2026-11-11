import { api, setCsrfToken } from "./api.js";
import { showMessage } from "./helpers.js";

export function renderAuth(mode) {
  const register = mode === "register";
  const title = register ? "Create your account" : "Welcome back";
  const passwordConfirmation = register
    ? '<label class="field">Confirm password<input class="input" name="password-confirmation" type="password" minlength="10" maxlength="128" autocomplete="new-password" required /></label>'
    : "";
  return `<main class="auth-wrap"><div class="auth-box"><a class="auth-brand" href="#/dashboard"><span class="brand-mark" aria-hidden="true">T</span> TravelX</a><section class="form"><p class="eyebrow">Your TravelX account</p><h1>${title}</h1><p class="small">${register ? "Create an account to save bookmarks, join chat, and keep your settings." : "Sign in to pick up where you left off."}</p><form id="auth-form"><label class="field">Username<input class="input" name="username" minlength="3" maxlength="32" pattern="[A-Za-z0-9_]{3,32}" autocomplete="username" aria-describedby="username-hint" required /><small class="field-hint" id="username-hint">3–32 letters, numbers, or underscores.</small></label><label class="field">Password<input class="input" name="password" type="password" minlength="10" maxlength="128" autocomplete="${register ? "new-password" : "current-password"}" required />${register ? '<small class="field-hint">Use 10–128 characters.</small>' : ""}</label>${passwordConfirmation}<button class="button" type="submit">${register ? "Create account" : "Sign in"}</button><p class="form-error" id="auth-message" role="status" aria-live="polite"></p></form><p class="small">${register ? `Already have an account? <a href="#/login">Sign in</a>.` : `New to TravelX? <a href="#/register">Create an account</a>.`}</p></section><p class="site-footer">Accounts are stored in the local TravelX database.</p></div></main>`;
}

export function bindAuth(mode, onSuccess) {
  const form = document.querySelector("#auth-form");
  const message = document.querySelector("#auth-message");
  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const username = String(formData.get("username") || "").trim();
    const password = String(formData.get("password") || "");
    const confirmation = String(formData.get("password-confirmation") || "");
    const button = form.querySelector("button");
    if (mode === "register" && password !== confirmation) {
      showMessage(message, "Those passwords do not match.", true);
      form.querySelector('[name="password-confirmation"]')?.focus();
      return;
    }
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
    showMessage(message, mode === "register" ? "Creating account…" : "Signing in…");
    try {
      const session = await api(`/api/auth/${mode}`, { method: "POST", body: { username, password } });
      setCsrfToken(session.csrfToken);
      onSuccess(session.user);
    } catch (error) {
      showMessage(message, error.message, true);
    } finally {
      button.disabled = false;
      button.removeAttribute("aria-busy");
    }
  });
}
