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
  const providerNames = status.models.map((provider) => provider.name).join(" → ");
  const message = status.available
    ? `Provider order: ${providerNames}. Gemini is tried first; GitHub Copilot is used as fallback when configured.`
    : status.error || "Add a real GEMINI_API_KEY or enable Copilot CLI authentication in .env to use Nova. Placeholder keys are ignored.";
  return `${pageHead("Nova", "A quiet place to think", "Send prompts to Gemini, with GitHub Models as an optional fallback.")}<div class="notice">${escapeHTML(message)}</div><section class="card section-gap"><form id="ai-form"><label class="field">Prompt<textarea class="textarea" name="prompt" maxlength="8000" placeholder="What would you like help with?" required></textarea></label><div class="button-row">${promptStarters.map((prompt) => `<button class="button secondary small-button" type="button" data-prompt="${escapeHTML(prompt)}">${escapeHTML(prompt)}</button>`).join("")}</div><div class="button-row section-gap"><button class="button" type="submit"${status.available ? "" : " disabled"}>Send prompt</button><span class="small muted">${status.available ? `Providers ready: ${status.models.length}` : "No provider configured"}</span></div><p id="ai-status" class="form-error" role="status"></p><div class="ai-response" id="ai-response"></div></form></section>`;
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
    const form = event.currentTarget;
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    status.textContent = "Waiting for a provider…";
    try {
      const data = await api("/api/ai/chat", {
        method: "POST",
        body: { prompt: new FormData(form).get("prompt") },
      });
      response.textContent = `${data.provider}\n\n${data.reply}`;
      status.textContent = `Answered by ${data.provider}.`;
      status.className = "form-success";
    } catch (error) {
      status.textContent = error.message;
      status.className = "form-error";
    } finally {
      button.disabled = false;
    }
  });
}
