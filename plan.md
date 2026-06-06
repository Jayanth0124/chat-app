Fix the following issues without changing existing working business logic, authentication flow, messaging flow, friend system, notifications architecture, or backend structure.

### Chat & Typing

1. Typing indicator is currently appearing underneath or behind the message input area.

* Position it correctly above the message composer.
* Ensure it remains visible while typing.
* Prevent overlap with the input toolbar.

### Mobile Responsiveness

2. Chat window is not responsive on mobile devices.

* Improve mobile layout completely.
* Prevent UI elements from overlapping.
* Ensure message bubbles, header, composer, menus, and chat list scale properly.
* Make the experience feel similar to WhatsApp on mobile.
* Remove cluttered spacing and improve touch usability.

### Chat List Menu

3. The three-dot menu in the chat list should be fully functional.

* Enable all menu actions.
* Ensure the menu opens correctly on both desktop and mobile.
* Add proper interaction states and close behavior.

### Notifications

4. Announcement notifications are repeatedly showing every time the app opens.

* Only display unread announcements.
* Once viewed, mark them as read.
* Do not repeatedly show previously viewed announcements.

### Profile Page

5. Simplify the profile UI.

* Remove the cover photo section completely.
* Show only the profile picture (DP).
* Make the profile picture clickable.
* Users should be able to view profile pictures in full-screen mode similar to WhatsApp.
* Add smooth image viewer experience with zoom support.

### Screen Capture Protection

6. Improve privacy protection for sensitive screens.

* Implement available browser/mobile privacy measures where possible.
* Blur or hide sensitive content when the page loses focus if appropriate.
* Add warnings when screen-sharing is detected where supported.

Important:

* Do not attempt to "block screenshots" or "force black screens" in browsers, because modern web applications cannot reliably prevent screenshots, screen recording software, browser extensions, operating-system capture tools, or external devices from capturing content.
* Implement the maximum privacy protections realistically available for web applications without breaking usability.

### General

* Keep all existing functionality intact.
* Do not introduce dummy data.
* Maintain real-time behavior.
* Ensure all fixes work on desktop, tablet, mobile, and PWA installations.
* Improve overall UI polish and responsiveness while preserving current application architecture.
