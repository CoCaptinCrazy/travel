import { api } from "../api.js";

export async function getAIStatus() {
  return api("/api/ai/models");
}
