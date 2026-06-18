# Orbit Backend Architecture & Logic Documentation

This document serves as the comprehensive guide to the backend infrastructure, business logic, and architectural design of the Orbit messaging platform. It is designed to provide future developers and system administrators with a profound understanding of how the core systems interact without relying on source code snippets.

---

## Complete Backend Architecture Overview

The Orbit backend is built on a modern, event-driven Node.js architecture utilizing Express for RESTful API management and Socket.IO for real-time bidirectional communication. The system relies on MongoDB as the primary persistence layer, structured around a highly normalized data model to support rapid querying of messages, relationships, and user telemetry. Cloudinary is integrated as a dedicated media storage solution for profile pictures, stories, voice notes, and image attachments. 

The architecture is explicitly separated into controllers, middleware, and models. All incoming traffic passes through a robust security middleware layer before reaching the business logic.

## Authentication & Authorization Systems

### Authentication Flow
Orbit employs a stateless authentication mechanism. Upon successful credential verification, the server issues an HTTP-only, secure cookie containing a JSON Web Token (JWT). This cookie ensures that the token cannot be accessed via client-side scripts, mitigating cross-site scripting (XSS) vulnerabilities. 

### Authorization System
Authorization is role-based and handled via middleware before request processing. Standard routes verify the presence and validity of the JWT. Administrative routes pass through an additional validation layer that cross-references the user's encoded role against the database to ensure the session hasn't been maliciously elevated or revoked mid-lifecycle.

### JWT Lifecycle
When a user authenticates, a JWT is generated with a predefined expiration (typically 7 days). The token payload contains minimal, non-sensitive identifiers (such as the database user ID). Upon logout, the cookie is cleared from the client's browser. If a user's account is suspended or banned, the server invalidates their session by forcing a socket disconnection and rejecting subsequent API requests via database-level status checks.

### User Registration Flow
Registration is a multi-step verification process:
1. **Input Validation**: The payload is sanitized and validated against strict schema rules (e.g., username character limits, email formatting).
2. **Uniqueness Check**: The database is queried to ensure the email and username are distinct across the platform.
3. **Cryptographic Hashing**: The plaintext password is mathematically hashed using bcrypt with a high salt round configuration.
4. **Provisioning**: The user record is created, and an initial JWT is minted and attached to the response.

### Login & Password Reset Flow
The login flow compares the provided credentials against the hashed database records. If successful, it updates the user's presence state and mints a new JWT. 

For password resets, the system verifies the user's identity, invalidates any existing active sessions to prevent account hijacking, and securely replaces the cryptographic hash in the database.

### Username Management Logic
Usernames in Orbit are unique identifiers used for connection routing. To prevent namespace pollution and impersonation, username updates are strictly regulated. The system utilizes atomic database operations to ensure that concurrent requests cannot claim the same username. A dedicated `UsernameChangeRequest` flow exists for administrative monitoring of highly sensitive aliases.

---

## Real-Time Communication System

### Socket.IO Architecture
Orbit relies on Socket.IO to maintain persistent TCP connections with active clients. The architecture scales horizontally by mapping a user's unique database ID to their active socket instance. This allows the backend to route payloads directly to a user regardless of their physical device.

### Presence & Online Status Tracking
When a client connects, the socket server updates the user's database record to reflect an `isOnline` state. A heartbeat mechanism ensures the connection is alive. Upon a disconnect event (whether intentional or due to network failure), the server updates the presence state and broadcasts this change to the user's active connections.

### Orbit Connection System Logic
The "Connection" system represents the social graph (friendships/contacts). The backend handles connection requests, acceptances, and blocks via dedicated REST endpoints, while simultaneously emitting real-time socket events to update the UI for both the sender and receiver.

---

## Messaging Architecture

### Message Delivery Lifecycle
1. **Ingestion**: A message payload (text or media) is received via the REST API or socket event.
2. **Persistence**: The message is saved to the MongoDB `Message` collection, referenced against a specific `Chat` document.
3. **Routing**: The backend identifies all participants in the chat.
4. **Dispatch**: The server emits the message payload to the specific socket rooms of the participants.
5. **Fallback**: If a recipient is offline, the message remains in the database and triggers a push notification queue.

### Read Receipt Flow
When a user views a chat, their client emits a `markMessagesAsRead` event. The backend updates the `readBy` array on the respective message documents and broadcasts a `messagesRead` event to the sender, confirming delivery and consumption.

### Message Unsend Logic
A user can request to unsend a message. The backend verifies ownership of the message and its temporal validity (e.g., within a specific time frame). If valid, the message content is scrubbed from the database or entirely deleted, and a `messageDeleted` event is broadcasted to all participants to update their local UI.

### Vanish Mode & Expiration Lifecycle
Vanish mode enforces ephemeral messaging. When enabled on a chat, messages are flagged with an expiration timestamp. A backend chron-job or TTL (Time-To-Live) database index automatically purges these messages from the system once the conditions (e.g., read status + time elapsed) are met.

### Voice Message Processing Flow
Voice messages are uploaded as binary blobs. The backend pipes this data directly to Cloudinary for optimized storage and format conversion. The resulting secure URL is then attached to a standard message payload and routed through the standard delivery lifecycle.

---

## Audio/Video Call System Architecture

The calling infrastructure relies on WebRTC for peer-to-peer media streaming, using the Orbit backend strictly for signaling.
1. **Initiation**: The caller sends an "offer" via sockets to the backend.
2. **Signaling**: The backend routes the offer to the recipient.
3. **Negotiation**: ICE candidates and "answers" are exchanged through the backend socket layer.
4. **History Storage**: Once a call concludes (or is missed), a `Call` record is created in the database, documenting the duration, participants, and type (audio/video), which populates the user's call history.

---

## Push Notifications & Service Workers

Orbit integrates Web Push protocols to deliver notifications to inactive or backgrounded clients. 
When a message or connection request occurs, the backend checks the recipient's active socket status. If they are disconnected, the payload is forwarded to a dedicated Push Notification Service, which utilizes the stored VAPID keys and subscription endpoints to wake the client's Service Worker and display a native device notification.

---

## Administration & Moderation

### Admin Dashboard Logic
The admin panel is powered by specialized controllers that aggregate platform telemetry. It performs complex MongoDB aggregation pipelines to calculate real-time active sessions, message volume, database storage metrics, and user growth curves.

### User Moderation System
Administrators possess the capability to ban, suspend, or restrict user communications. 
- **Restrictions**: Modifying a user's `mutedUntil` property prevents them from accessing the message ingestion routes.
- **Bans**: Updates the user status to `banned` and triggers a real-time `forceLogout` socket event to immediately terminate their access.
- All moderation actions are securely logged in an immutable `AuditLog` collection for operational transparency.

---

## Core Engineering Principles

### Security Architecture
- **Data at Rest**: Passwords are cryptographically hashed.
- **Data in Transit**: All communications require HTTPS/WSS encryption.
- **Rate Limiting**: Critical endpoints (like login and registration) are protected against brute-force attacks via IP-based rate limiting.
- **Input Sanitization**: All incoming data is sanitized to prevent NoSQL injection and payload execution.

### Database Relationships
The database is highly relational within a NoSQL context. A `Chat` document maintains references to `User` documents (participants) and acts as the parent for `Message` documents. This reference-based approach prevents document size bloat while allowing rapid `$lookup` aggregations when fetching conversation histories.

### API Design Philosophy
Orbit adheres to strict RESTful conventions. Routes are logically grouped by resource (`/api/users`, `/api/messages`, `/api/admin`). Responses are standardized to ensure consistent parsing by the client, always returning appropriate HTTP status codes (200 for success, 400 for bad request, 401 for unauthorized).

### Error Handling Strategy
The backend utilizes a centralized error-handling middleware. Expected business logic errors (e.g., "User not found") are thrown with specific status codes. Unexpected runtime exceptions are caught, logged internally for debugging, and return a sanitized 500 Internal Server Error to the client to prevent stack-trace leakage.

### Scalability Considerations & Deployment
- **Statelessness**: The API is entirely stateless, allowing it to be horizontally scaled across multiple instances behind a load balancer.
- **Socket Redis Adapter**: To support multiple Node.js processes, a Redis adapter can be implemented to ensure socket events are broadcasted across the entire cluster.
- **Media Offloading**: By utilizing Cloudinary, the backend is freed from the intensive I/O operations of media serving, significantly reducing bandwidth and CPU overhead.

### Performance Optimizations
- **Database Indexing**: Heavy-read fields (like usernames, email, and message timestamps) are heavily indexed.
- **Lean Queries**: Mongoose `.lean()` is utilized on read-only queries to bypass ODM instantiation overhead, drastically improving response times.
- **Pagination**: Message histories and user lists utilize cursor-based or limit/skip pagination to ensure minimal memory consumption per request.
