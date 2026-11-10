import { api } from "./api.js";
import { escapeHTML, pageHead, showMessage } from "./helpers.js";

export async function renderSettings() {
  let settings = {};
  try {
    const profile = await api("/api/profile");
    settings = profile.settings || {};
  } catch (error) {
    return `${pageHead("Preferences", "Settings")}<div class="notice">${escapeHTML(error.message)}</div>`;
  }
  return `${pageHead("Preferences", "Settings", "Adjust the appearance of your TravelX workspace.")}<section class="card"><form id="settings-form"><label class="field">Theme<select class="select" name="theme"><option value="dark"${settings.theme !== "light" ? " selected" : ""}>Dark</option><option value="light"${settings.theme === "light" ? " selected" : ""}>Light</option></select></label><label class="field"><span><input type="checkbox" name="compactMode"${settings.compactMode ? " checked" : ""} /> Compact mode preference</span></label><button class="button" type="submit">Save settings</button><p id="settings-message" class="form-success" role="status"></p></form></section>`;
}

export function bindSettings() {
  const form = document.querySelector("#settings-form");
  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const settings = { theme: data.get("theme"), compactMode: data.has("compactMode") };
    const message = document.querySelector("#settings-message");
    try {
      await api("/api/settings", { method: "PATCH", body: { settings } });
      document.body.classList.toggle("light", settings.theme === "light");
      showMessage(message, "Settings saved.");
    } catch (error) {
      showMessage(message, error.message, true);
    }
  });
}
