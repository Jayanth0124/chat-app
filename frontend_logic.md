# Orbit Frontend Architecture & Logic Documentation

This document provides a comprehensive overview of the frontend architecture, state management, UI flows, and design systems powering the Orbit client application. It serves as a definitive guide for future developers scaling or maintaining the interface.

---

## Complete Frontend Architecture Overview

The Orbit frontend is a highly reactive Single Page Application (SPA) built on React. It utilizes Vite as its build tool for rapid development and optimized production bundling. The application architecture is component-driven, favoring functional components and custom React hooks. 

To achieve a native-app feel within the browser, the frontend heavily leverages framer-motion for fluid animations, Tailwind CSS for utility-first styling, and a centralized global state to prevent prop-drilling and ensure instantaneous UI updates.

## Application Flow & Routing Architecture

The application implements a strict routing hierarchy using React Router:
- **Public Routes**: Accessible to all unauthenticated traffic. This includes the Landing Page, Login, Signup, and Forgot Password flows.
- **Protected Routes**: Wrapped by an authentication higher-order component. If a user without a valid session attempts to access these routes (e.g., `/chat`, `/settings`, `/admin`), they are immediately redirected to the Login page.

When the application initializes, a background verification request is dispatched to the backend. Until this request resolves, a global loading state prevents any protected content from rendering, avoiding layout shifts or unauthorized data flashes.

## State Management (Zustand Architecture)

Orbit eschews complex Redux boilerplate in favor of Zustand, which provides a lightweight, modular global state. The state is divided into logical stores:
1. **`useAuthStore`**: Manages the user's session, profile data, and authentication status.
2. **`useChatStore`**: Manages the active conversation, message arrays, typing indicators, and handles optimistic UI updates when sending messages.
3. **`useCallStore`**: Manages WebRTC signaling states, active call data, and ringtone audio triggers.
4. **`useThemeStore`**: Manages the application's appearance (e.g., toggling the Midnight Purple dark mode).

By modularizing the state, components only subscribe to the specific data slices they require, significantly reducing unnecessary re-renders.

---

## Authentication UI Flow

### Login Experience
The login UI presents a premium split-screen design. Upon submission, the client displays a loading spinner and disables the submit button to prevent double-firing. If the backend returns a 401, a subtle toast notification informs the user of incorrect credentials without exposing whether the email or password was at fault.

### Signup Experience
The signup flow involves real-time validation. As the user types their desired username, a debounced check visually indicates availability (green checkmark or red warning). Password strength is calculated client-side and displayed via a segmented progress bar.

### Forgot Password Experience
This flow guides the user through requesting a reset link. The UI transitions from an email input state to a "Check your inbox" success state seamlessly, utilizing Framer Motion for the layout transition.

---

## Core Application Interfaces

### Landing Page & Welcome Architecture
The unauthenticated landing page serves as the marketing facade, featuring scroll-triggered animations and responsive hero sections. Upon authenticating, users land on a `Welcome` or `Home` view that acts as an interstitial hub, displaying quick stats, pending connection requests, and recent activity before diving into specific chats.

### Chat Interface Architecture
The Chat interface is the heart of Orbit. It is structured into three main panels (on desktop):
1. **Sidebar**: Lists active conversations, sorted by recent activity. Unread messages are highlighted with a glowing badge.
2. **Message Window**: The active conversation. It implements auto-scrolling to the newest message, while preserving scroll position if the user is reading older history.
3. **Detail Panel (Optional)**: Displays user info, shared media, and chat-specific settings (like toggling Vanish Mode).

### Conversation Lifecycle & Message Rendering
Messages are mapped onto reusable `MessageBubble` components. 
- **Optimistic Rendering**: When a user hits send, the message immediately appears in the UI with a muted "sending" state. 
- **Confirmation**: Once the socket confirms delivery, the message assumes its final visual state.
- **Read Receipts**: Small avatars or checkmarks appear beneath the last message read by the recipient, updating in real-time via socket events.
- **Activity Status**: "Typing..." indicators appear dynamically above the input field when the remote user emits a typing event.

---

## Orbit Connection Visualization

The social graph is visualized through the "Connections" tab. Users see pending requests, active connections, and blocked users. Accepting a connection instantly shifts the user card from the "Pending" list to the "Active" list using layout animations, providing satisfying, tactile feedback.

---

## Media & Communication UI

### Call Interface Architecture
When an incoming call is detected, a global overlay appears over the application, accompanied by ringing audio. 
Once connected, the UI shifts to a dedicated call screen. For video calls, the remote stream occupies the primary viewport, while the local stream appears as a draggable Picture-in-Picture (PiP) element. Controls for muting, disabling video, and ending the call are anchored at the bottom.

### Voice Message UI Architecture
Voice notes utilize the Web Audio API. When a user presses and holds the microphone button, a recording UI expands, visualizing the audio input via a dynamic waveform. Upon release, the audio blob is sent. The received message bubble contains a custom audio player with a scrubbable timeline and play/pause controls.

---

## User Settings & Admin Panels

### Settings Architecture & Privacy Controls
The settings menu provides a unified interface for profile customization, theme selection, and privacy controls (e.g., toggling read receipts, managing blocked users). Changes are debounced and synced with the backend automatically.

### Admin Dashboard Frontend Architecture
The administrative dashboard is restricted to users with elevated roles. It presents high-level telemetry via interactive charts and metric cards. Complex moderation actions (like banning a user) require explicit confirmation via a custom modal to prevent accidental execution.

---

## Design System & Engineering Strategies

### Responsive Design Strategy & Mobile Experience
Orbit follows a mobile-first philosophy. On mobile devices, the 3-panel chat interface collapses into a stack. Navigating from the chat list to a specific conversation uses a slide-in animation, mimicking native iOS/Android navigation stacks. The UI relies heavily on Flexbox and CSS Grid to adapt fluidly to any screen dimension.

### PWA Implementation
Orbit is configured as a Progressive Web App. A Web App Manifest and Service Worker are registered on load. This allows users to install Orbit directly to their home screens. The Service Worker caches critical UI assets to ensure the "shell" of the app loads instantly, even on poor network connections, before fetching live data.

### Push Notification UI Flow
When the browser receives a background push notification via the Service Worker, it displays a native OS banner. Clicking the banner intercepts the routing and immediately focuses the relevant chat window within the Orbit SPA.

### UI Component Hierarchy
The codebase strictly adheres to atomic design principles:
- **Atoms**: Buttons, Inputs, Avatars.
- **Molecules**: Form groups, List items, Message bubbles.
- **Organisms**: Chat windows, Sidebars, Modals.
- **Pages**: Login, Dashboard, Settings.

### Framer Motion Usage
Framer Motion is used strategically to enhance perceived performance and luxury. It powers:
- Page transitions (fade and slide).
- Modal backdrops (blur and fade).
- List layout changes (e.g., when a chat moves to the top of the list).
- Micro-interactions (button presses, hover states).

### Design System Philosophy
The Orbit design system emphasizes "Premium Glassmorphism." It utilizes:
- Deep, highly saturated background colors (Midnight Purple).
- Translucent surface layers with heavy backdrop blurring.
- Soft, colored drop-shadows to simulate ambient light.
- High-contrast typography for legibility.

### Accessibility Considerations
- Semantic HTML tags are used for structural components.
- ARIA labels are attached to icon-only buttons.
- Color contrast ratios adhere to WCAG guidelines, ensuring readability across both light and dark themes.
- Form inputs support full keyboard navigation and focus trapping within modals.

### Performance Optimizations
- **Code Splitting**: Routes are dynamically imported (lazy-loaded) to reduce the initial JavaScript payload.
- **Image Optimization**: Cloudinary handles dynamic resizing and WebP conversion for all media assets.
- **Memoization**: `React.memo`, `useMemo`, and `useCallback` are utilized heavily in list rendering (like the chat history) to prevent unnecessary DOM reconciliations.
