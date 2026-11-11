import { api } from "../api.js";
import { emptyState, escapeHTML, pageHead } from "../helpers.js";
import { bindFriendActions, renderFriends, sendFriendRequest } from "./friends.js";
import { startPolling } from "./websocket.js";

const roleLabel = (role) => ({
  admin: "Admin",
  moderator: "Moderator",
  member: "Member",
}[role] || "Member");

export function renderChat(user) {
  return `<section class="pulse-page">${pageHead("Pulse · Community", "The conversation, organized.", "Find your channel, catch up with the community, and see who’s around.")}<div class="pulse-workspace"><aside class="pulse-channel-sidebar"><div class="pulse-sidebar-heading"><span class="pulse-mark" aria-hidden="true">✳</span><div><strong>TravelX space</strong><small>Community channels</small></div></div><div class="pulse-section-label"><span>CHANNELS</span><button class="pulse-add-channel" id="toggle-channel-form" type="button" aria-label="Create a channel" title="Create a channel" hidden>+</button></div><div id="chat-rooms-list" class="pulse-channel-list">${emptyState("Loading channels…")}</div><form id="channel-form" class="pulse-create-form" hidden><label class="field">Channel name<input class="input" name="name" pattern="[A-Za-z0-9_\\-]{2,32}" maxlength="32" placeholder="project-room" required /></label><label class="field">Category<input class="input" name="category" maxlength="32" value="Community" required /></label><label class="field">Topic <span class="muted">(optional)</span><input class="input" name="description" maxlength="120" placeholder="What is this channel for?" /></label><label class="field">Who can read<select class="select" name="readRole"><option value="member">Everyone</option><option value="moderator">Moderators and admins</option><option value="admin">Admins only</option></select></label><label class="field">Who can post<select class="select" name="writeRole"><option value="member">Everyone</option><option value="moderator">Moderators and admins</option><option value="admin">Admins only</option></select></label><button class="button small-button" type="submit">Create channel</button><p id="channel-status" class="form-error" role="status"></p></form><section class="pulse-friends"><p class="pulse-section-label">FRIENDS</p><form class="pulse-friend-form" id="friend-form"><label class="visually-hidden" for="friend-username">TravelX username</label><input class="input" id="friend-username" name="username" placeholder="Add by username" required /><button class="button secondary small-button" type="submit">Add</button></form><p id="friend-status" role="status"></p><div class="pulse-friend-list" id="friends-list">${emptyState("Loading friends…")}</div></section><div class="pulse-self"><span class="pulse-avatar">${escapeHTML(user.username.slice(0, 1).toUpperCase())}</span><div><strong>${escapeHTML(user.username)}</strong><small id="pulse-self-role">${roleLabel(user.role === "admin" ? "admin" : "member")}</small></div></div></aside><main class="pulse-conversation"><header class="pulse-channel-header"><div class="pulse-channel-title"><span class="pulse-hash" aria-hidden="true">#</span><div><h2 id="chat-room-title">Loading channels</h2><p id="chat-room-description">Choose a channel to join the conversation.</p></div></div><label class="pulse-message-search"><span aria-hidden="true">⌕</span><span class="visually-hidden">Search recent messages</span><input id="chat-message-search" type="search" placeholder="Search this channel" autocomplete="off" /></label></header><div class="pulse-message-list" id="chat-messages" aria-live="polite">${emptyState("Loading messages…")}</div><p id="chat-status" class="pulse-chat-status" role="status" aria-live="polite"></p><form class="pulse-compose" id="chat-form"><label class="visually-hidden" for="chat-message">Write a message</label><input class="input" id="chat-message" name="message" maxlength="1000" placeholder="Write in #lobby" autocomplete="off" required /><button class="button" type="submit">Send <span aria-hidden="true">↗</span></button></form><p class="pulse-composer-hint">Be kind. Messages are saved to this TravelX instance.</p></main><aside class="pulse-member-sidebar"><header class="pulse-member-heading"><span aria-hidden="true">♙</span><div><h2>People</h2><small id="pulse-member-count">Loading…</small></div></header><p class="pulse-role-heading admin-role-heading">ADMINS</p><div id="pulse-admins" class="pulse-member-list"></div><p class="pulse-role-heading moderator-role-heading">MODERATORS</p><div id="pulse-moderators" class="pulse-member-list"></div><p class="pulse-role-heading member-role-heading">MEMBERS</p><div id="pulse-members" class="pulse-member-list"></div><p id="pulse-role-status" class="pulse-chat-status" role="status"></p><p class="pulse-role-help">Roles control channel access. Admins can promote members to moderator.</p></aside></div></section>`;
}

export function bindChat(setCleanup, user) {
  let roomId = null;
  let rooms = [];
  let messages = [];
  let role = user.role === "admin" ? "admin" : "member";
  let stopPolling = () => {};
  const messagesElement = document.querySelector("#chat-messages");
  const statusElement = document.querySelector("#chat-status");
  const roomList = document.querySelector("#chat-rooms-list");
  const roleRank = { member: 0, moderator: 1, admin: 2 };
  const channelNameInput = document.querySelector('#channel-form [name="name"]');
  channelNameInput?.removeAttribute("pattern");
  channelNameInput?.addEventListener("input", () => {
    const valid = /^[A-Za-z0-9_-]{2,32}$/.test(channelNameInput.value);
    channelNameInput.setCustomValidity(
      valid || !channelNameInput.value
        ? ""
        : "Use 2–32 letters, numbers, underscores, or hyphens."
    );
  });

  const renderMessages = () => {
    if (!messagesElement) return;
    const filter = document.querySelector("#chat-message-search").value.trim().toLocaleLowerCase();
    const visibleMessages = messages.filter((message) =>
      `${message.username} ${message.message}`.toLocaleLowerCase().includes(filter)
    );
    messagesElement.innerHTML = visibleMessages.length
      ? visibleMessages.map((message) => {
        const time = new Date(message.created_at);
        const formattedTime = Number.isNaN(time.getTime())
          ? message.created_at
          : new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(time);
        return `<article class="pulse-message"><span class="pulse-avatar">${escapeHTML(message.username.slice(0, 1).toUpperCase())}</span><div class="pulse-message-body"><header><strong>${escapeHTML(message.username)}</strong><span class="pulse-role-chip pulse-role-${escapeHTML(message.role)}">${roleLabel(message.role)}</span><time datetime="${escapeHTML(message.created_at)}">${escapeHTML(formattedTime)}</time></header><p>${escapeHTML(message.message)}</p></div></article>`;
      }).join("")
      : emptyState(filter ? "No recent messages match that search." : "No messages yet. Start the conversation.");
  };

  const selectRoom = async (room) => {
    roomId = room.id;
    document.querySelectorAll("[data-chat-room]").forEach((button) => {
      button.classList.toggle("active", Number(button.dataset.chatRoom) === roomId);
      button.setAttribute("aria-current", Number(button.dataset.chatRoom) === roomId ? "true" : "false");
    });
    document.querySelector("#chat-room-title").textContent = room.name;
    document.querySelector("#chat-room-description").textContent = room.description || `${room.category} channel`;
    const input = document.querySelector("#chat-message");
    const sendButton = document.querySelector("#chat-form button");
    input.disabled = !room.canPost;
    sendButton.disabled = !room.canPost;
    input.placeholder = room.canPost ? `Write in #${room.name}` : `You cannot post in #${room.name}`;
    statusElement.textContent = room.canPost ? "" : "Posting is limited to moderators in this channel.";
    statusElement.classList.toggle("pulse-permission-note", !room.canPost);
    document.querySelector("#chat-message-search").value = "";
    messages = [];
    messagesElement.innerHTML = emptyState("Loading messages…");
    await loadMessages();
  };

  const renderRooms = () => {
    if (!rooms.length) {
      roomList.innerHTML = emptyState("No channels are available for your role.");
      return;
    }
    const categories = [...new Set(rooms.map((room) => room.category))];
    roomList.innerHTML = categories.map((category) => {
      const categoryRooms = rooms.filter((room) => room.category === category);
      return `<section class="pulse-channel-group"><h3>${escapeHTML(category)}</h3>${categoryRooms.map((room) => `<button class="pulse-channel${room.id === roomId ? " active" : ""}" type="button" data-chat-room="${room.id}" aria-current="${room.id === roomId ? "true" : "false"}"><span aria-hidden="true">#</span><span>${escapeHTML(room.name)}</span>${room.write_role !== "member" ? '<span class="pulse-channel-lock" aria-label="Posting restricted">⌑</span>' : ""}<small>${room.messages || ""}</small></button>`).join("")}</section>`;
    }).join("");
    roomList.querySelectorAll("[data-chat-room]").forEach((button) => {
      button.addEventListener("click", () => {
        const selected = rooms.find((room) => room.id === Number(button.dataset.chatRoom));
        if (selected) selectRoom(selected);
      });
    });
    selectRoom(rooms.find((room) => room.id === roomId) || rooms.find((room) => room.name === "lobby") || rooms[0]);
  };

  async function loadMessages() {
    const requestedRoomId = roomId;
    if (!requestedRoomId) return;
    try {
      const data = await api(`/api/chat/rooms/${requestedRoomId}/messages`);
      if (requestedRoomId !== roomId) return;
      const previousBottom = messagesElement.scrollHeight - messagesElement.scrollTop - messagesElement.clientHeight < 60;
      messages = data.messages;
      renderMessages();
      if (previousBottom) messagesElement.scrollTop = messagesElement.scrollHeight;
      statusElement.textContent = "";
    } catch (error) {
      if (requestedRoomId === roomId) {
        messagesElement.innerHTML = emptyState(error.message);
        stopPolling();
      }
    }
  }

  const loadRooms = async () => {
    try {
      const data = await api("/api/chat/rooms");
      rooms = data.rooms;
      role = data.role;
      document.querySelector("#pulse-self-role").textContent = roleLabel(role);
      document.querySelector("#toggle-channel-form").hidden = roleRank[role] < roleRank.moderator;
      renderRooms();
    } catch (error) {
      roomList.innerHTML = emptyState(error.message);
    }
  };

  const loadMembers = async () => {
    try {
      const data = await api("/api/chat/members");
      role = data.role;
      document.querySelector("#pulse-self-role").textContent = roleLabel(role);
      const groups = {
        admin: document.querySelector("#pulse-admins"),
        moderator: document.querySelector("#pulse-moderators"),
        member: document.querySelector("#pulse-members"),
      };
      for (const [memberRole, target] of Object.entries(groups)) {
        const members = data.members.filter((member) => {
          const effectiveRole = member.account_role === "admin" ? "admin" : member.chat_role;
          return effectiveRole === memberRole;
        });
        target.innerHTML = members.length ? members.map((member) => {
          const canManage = role === "admin" && member.account_role !== "admin";
          return `<div class="pulse-member"><span class="pulse-avatar">${escapeHTML(member.username.slice(0, 1).toUpperCase())}</span><span class="pulse-member-name" title="${escapeHTML(member.username)}">${escapeHTML(member.username)}</span><span class="pulse-role-chip pulse-role-${memberRole}">${roleLabel(memberRole)}</span>${canManage ? `<label class="visually-hidden" for="role-${member.id}">Role for ${escapeHTML(member.username)}</label><select class="pulse-role-select" id="role-${member.id}" data-member-role="${member.id}" aria-label="Role for ${escapeHTML(member.username)}"><option value="member"${memberRole === "member" ? " selected" : ""}>Member</option><option value="moderator"${memberRole === "moderator" ? " selected" : ""}>Moderator</option></select>` : ""}</div>`;
        }).join("") : `<p class="pulse-empty-role">No ${roleLabel(memberRole).toLowerCase()}s yet.</p>`;
      }
      document.querySelector("#pulse-member-count").textContent = `${data.members.length} ${data.members.length === 1 ? "person" : "people"}`;
    } catch (error) {
      document.querySelector("#pulse-member-count").textContent = error.message;
    }
  };

  loadRooms();
  loadMembers();
  stopPolling = startPolling(() => {
    loadMessages();
    loadMembers();
  });
  setCleanup(() => stopPolling());

  document.querySelector("#chat-message-search")?.addEventListener("input", renderMessages);

  document.querySelector("#chat-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const input = form.elements.message;
    const sendButton = form.querySelector("button");
    if (!roomId) return;
    sendButton.disabled = true;
    try {
      await api(`/api/chat/rooms/${roomId}/messages`, { method: "POST", body: { message: new FormData(form).get("message") } });
      form.reset();
      await loadMessages();
    } catch (error) {
      statusElement.textContent = error.message;
    } finally {
      sendButton.disabled = !rooms.find((room) => room.id === roomId)?.canPost;
      input.focus();
    }
  });

  document.querySelector("#toggle-channel-form")?.addEventListener("click", () => {
    const form = document.querySelector("#channel-form");
    form.hidden = !form.hidden;
    if (!form.hidden) form.querySelector('[name="name"]').focus();
  });

  document.querySelector("#channel-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const status = document.querySelector("#channel-status");
    const values = Object.fromEntries(new FormData(form));
    try {
      await api("/api/chat/rooms", {
        method: "POST",
        body: { ...values, name: String(values.name).toLowerCase() },
      });
      form.reset();
      form.elements.category.value = "Community";
      status.textContent = "";
      await loadRooms();
      const created = rooms.find((room) => room.name === String(values.name).toLowerCase());
      if (created) selectRoom(created);
    } catch (error) {
      status.textContent = error.message;
    }
  });

  document.querySelector(".pulse-member-sidebar")?.addEventListener("change", async (event) => {
    const select = event.target.closest("[data-member-role]");
    if (!select) return;
    const status = document.querySelector("#pulse-role-status");
    select.disabled = true;
    try {
      await api(`/api/chat/members/${select.dataset.memberRole}/role`, {
        method: "PATCH",
        body: { role: select.value },
      });
      status.textContent = "Member role updated.";
      status.className = "form-success";
      await Promise.all([loadMembers(), loadRooms()]);
    } catch (error) {
      status.textContent = error.message;
      status.className = "form-error";
      select.disabled = false;
    }
  });

  document.querySelector("#friend-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const status = document.querySelector("#friend-status");
    try {
      await sendFriendRequest(new FormData(form).get("username"));
      form.reset();
      status.textContent = "Friend request sent.";
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
