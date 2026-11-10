import { api } from "../api.js";
import { emptyState, escapeHTML, pageHead } from "../helpers.js";
import { bindFriendActions, renderFriends, sendFriendRequest } from "./friends.js";
import { createRoom, getRooms } from "./rooms.js";
import { startPolling } from "./websocket.js";

export function renderChat() {
  return `${pageHead("Pulse", "Room to talk", "A simple local chat with friends and rooms. Messages refresh automatically.")}<div class="chat-layout"><aside class="chat-rooms"><h3>Rooms</h3><div id="chat-rooms-list">${emptyState("Loading…")}</div><form id="room-form" class="field"><label for="room-name">New room</label><input class="input" id="room-name" name="name" maxlength="32" required /><button class="button secondary small-button" type="submit">Create room</button></form></aside><section class="chat-panel"><h2 id="chat-room-title">Lobby</h2><div class="chat-messages" id="chat-messages" aria-live="polite">${emptyState("Loading messages…")}</div><form class="chat-compose" id="chat-form"><label class="visually-hidden" for="chat-message">Message</label><input class="input" id="chat-message" name="message" maxlength="1000" placeholder="Write a message…" required /><button class="button" type="submit">Send</button></form><p id="chat-status" class="form-error" role="status"></p></section></div><section class="section-gap"><h2>Friends</h2><form class="button-row" id="friend-form"><label class="visually-hidden" for="friend-username">Username</label><input class="input friend-input" id="friend-username" name="username" placeholder="TravelX username" required /><button class="button secondary" type="submit">Send request</button></form><p id="friend-status" class="form-error" role="status"></p><div class="list" id="friends-list">${emptyState("Loading friends…")}</div></section>`;
}

export function bindChat(setCleanup) {
  let roomId = 1;
  let stopPolling = () => {};
  const messagesElement = document.querySelector("#chat-messages");
  const statusElement = document.querySelector("#chat-status");
  const loadMessages = async () => {
    try {
      const data = await api(`/api/chat/rooms/${roomId}/messages`);
      const previousBottom = messagesElement.scrollHeight - messagesElement.scrollTop - messagesElement.clientHeight < 60;
      messagesElement.innerHTML = data.messages.length
        ? data.messages.map((message) => `<article class="chat-message"><strong>${escapeHTML(message.username)} <span class="muted">${escapeHTML(message.created_at)}</span></strong>${escapeHTML(message.message)}</article>`).join("")
        : emptyState("No messages yet. Start the conversation.");
      if (previousBottom) messagesElement.scrollTop = messagesElement.scrollHeight;
      statusElement.textContent = "";
    } catch (error) {
      messagesElement.innerHTML = emptyState(error.message);
      stopPolling();
    }
  };
  const loadRooms = async () => {
    try {
      const rooms = await getRooms();
      const target = document.querySelector("#chat-rooms-list");
      if (!target) return;
      target.innerHTML = rooms.map((room) => `<button class="chat-room${room.id === roomId ? " active" : ""}" type="button" data-room-id="${room.id}"># ${escapeHTML(room.name)}</button>`).join("");
      target.querySelectorAll("[data-room-id]").forEach((button) => {
        button.addEventListener("click", () => {
          roomId = Number(button.dataset.roomId);
          document.querySelector("#chat-room-title").textContent = `# ${button.textContent.replace(/^# /, "")}`;
          stopPolling();
          target.querySelectorAll(".chat-room").forEach((candidate) => candidate.classList.toggle("active", candidate === button));
          loadMessages();
          stopPolling = startPolling(loadMessages);
        });
      });
    } catch (error) {
      const target = document.querySelector("#chat-rooms-list");
      if (target) target.innerHTML = emptyState(error.message);
    }
  };
  loadMessages();
  loadRooms();
  stopPolling = startPolling(loadMessages);
  setCleanup(() => stopPolling());

  document.querySelector("#chat-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const message = new FormData(form).get("message");
    try {
      await api(`/api/chat/rooms/${roomId}/messages`, { method: "POST", body: { message } });
      form.reset();
      await loadMessages();
    } catch (error) {
      statusElement.textContent = error.message;
    }
  });

  document.querySelector("#room-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    try {
      await createRoom(new FormData(form).get("name"));
      form.reset();
      await loadRooms();
    } catch (error) {
      const target = document.querySelector("#chat-rooms-list");
      target?.prepend(Object.assign(document.createElement("p"), { className: "form-error", textContent: error.message }));
    }
  });

  document.querySelector("#friend-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const status = document.querySelector("#friend-status");
    try {
      await sendFriendRequest(new FormData(form).get("username"));
      form.reset();
      status.textContent = "Request sent.";
      status.className = "form-success";
      await loadFriendList();
    } catch (error) {
      status.textContent = error.message;
      status.className = "form-error";
    }
  });
  loadFriendList();
}

async function loadFriendList() {
  const target = document.querySelector("#friends-list");
  if (!target) return;
  try {
    target.innerHTML = await renderFriends();
    bindFriendActions();
  } catch (error) {
    target.innerHTML = emptyState(error.message);
  }
}
