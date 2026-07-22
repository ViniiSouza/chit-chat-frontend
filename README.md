# ChitChat Frontend

Vue 3 frontend for **ChitChat**, a real-time chat application powered by a .NET 8 + SignalR backend.

Backend repository: [ChitChatBackend](https://github.com/ViniiSouza/ChitChatBackend)

## Features

- Real-time private conversations with instant message delivery and a notification sound.
- Online/offline presence with last-seen timestamps.
- Message requests: invite flow for messaging users with private profiles (send, accept, refuse).
- Contacts management.
- Paginated message history with scroll handling.
- JWT auth with route guards (`/chat` requires login) and automatic redirect on session expiry.

## Stack

Vue 3 (Composition API) · Vue Router 4 · Vite · `@microsoft/signalr` · Axios · Bootstrap 5 · vue-toastification · SweetAlert2.

The chat behavior is concentrated in a single composable (`src/components/chat/useChat.js`): it registers the SignalR handlers (`MessageReceived`, `NewConversation`, `RequestReceived`, `UserStatusChange`) and drives conversations, drafts, invites and contacts. The SignalR connection (`src/hubs/chatHub.js`) uses WebSockets-only transport with an auto-reconnect loop.

## Running locally

Prerequisites: Node.js and the [backend](https://github.com/ViniiSouza/ChitChatBackend) running.

```bash
npm install
npm run dev   # http://localhost:5173
```

The app expects the API at `http://localhost:5180` and the SignalR hub at `https://localhost:7180` (see `src/services/axios.js` and `src/hubs/chatHub.js`).

## Status

Functionally complete for private chats; never deployed. Next steps tracked in the backend README (group chats, typing indicators, environment-driven configuration).
