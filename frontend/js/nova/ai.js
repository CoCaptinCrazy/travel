import { api } from "../api.js";
import { escapeHTML, pageHead } from "../helpers.js";
import { promptStarters } from "./prompts.js";
import { getAIStatus } from "./models.js";

export async function renderAI() {
  let status = { available: false, models: [] };
  try {
    status = await getAIStatus();
  } catch (error) {
    status = { available: false, error: error.message, models: [] };
  }
  return `${pageHead("Nova", "A quiet place to think", "AI provider support is optional and is not configured in this starter.")}<div class="notice">${status.available ? "AI is ready." : escapeHTML(status.error || "No AI provider is configured. Your prompts stay in this browser.")}</div><section class="card section-gap"><form id="ai-form"><label class="field">Prompt<textarea class="textarea" name="prompt" maxlength="8000" placeholder="What would you like help with?" required></textarea></label><div class="button-row">${promptStarters.map((prompt) => `<button class="button secondary small-button" type="button" data-prompt="${escapeHTML(prompt)}">${escapeHTML(prompt)}</button>`).join("")}</div><div class="button-row section-gap"><button class="button" type="submit"${status.available ? "" : " disabled"}>Send prompt</button><span class="small muted">Models configured: ${status.models.length}</span></div><p id="ai-status" class="form-error" role="status"></p><div class="ai-response" id="ai-response"></div></form></section>`;
}

export function bindAI() {
  document.querySelectorAll("[data-prompt]").forEach((button) => {
    button.addEventListener("click", () => {
      const input = document.querySelector("#ai-form textarea");
      input.value = `${button.dataset.prompt} `;
      input.focus();
    });
  });
  document.querySelector("#ai-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const status = document.querySelector("#ai-status");
    const response = document.querySelector("#ai-response");
    try {
      const data = await api("/api/ai/chat", {
        method: "POST",
        body: { prompt: new FormData(event.currentTarget).get("prompt") },
      });
      response.textContent = data.reply;
      status.textContent = "";
    } catch (error) {
      status.textContent = error.message;
    }
  });
}
