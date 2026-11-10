import { api } from "../api.js";

export async function getRooms() {
  const data = await api("/api/chat/rooms");
  return data.rooms;
}

export async function createRoom(name) {
  return api("/api/chat/rooms", { method: "POST", body: { name } });
}
