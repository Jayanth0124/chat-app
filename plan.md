Plan 1: Refactor and Upgrade Chat Interface UI + Functionality

Analyze the current chat interface and redesign it into a premium production-ready messaging experience. The current UI has multiple placeholder elements, non-functional buttons, empty states, weak layout hierarchy, and unfinished interactions.

Goals:

* Improve usability
* Improve visual hierarchy
* Improve functionality
* Remove placeholder behavior
* Make the interface feel complete and realistic

Current Issues:

* Many buttons do nothing
* Empty white space dominates the screen
* Chat list feels unfinished
* Sidebar icons lack purpose
* No meaningful empty state
* No clear navigation hierarchy
* No modern messaging experience
* Feels like a wireframe instead of a product

Required Improvements:

1. Sidebar Navigation

Current icons appear disconnected.

Give every icon a purpose:

Chats

* conversation list

Calls

* call history page

Discover

* search users
* friend suggestions

Friends

* pending requests
* accepted friends

Settings

* account settings

Profile

* user profile

Logout

* logout confirmation

Add:

* tooltips
* active states
* hover states
* smooth transitions

---

2. Chat List Panel

Upgrade conversation list.

Add:

* profile image
* online indicator
* last message preview
* unread count badge
* timestamp
* message status preview
* typing indicator preview

Make list feel alive.

---

3. Search Experience

Search should not be a static input.

Create search states:

Default:

* recent searches

Typing:

* user search results

No Results:

* modern empty state

Loading:

* skeleton results

---

4. Empty Chat State

Current center section is mostly blank.

Replace with a premium onboarding panel.

Include:

* modern illustration
* app branding
* feature highlights
* recent activity cards
* quick actions

Example actions:

* Start conversation
* Search users
* Add friends
* Send first snap

---

5. Chat Window

When conversation selected:

Show:

Header:

* profile image
* online status
* username
* action buttons

Messages:

* proper bubbles
* timestamps
* seen status
* reactions
* grouping

Composer:

* emoji button
* image upload
* snap button
* voice placeholder
* send button

All buttons should have UI interactions.

---

6. Functional Buttons

Replace placeholder buttons.

Each button must:

* open modal
* open drawer
* navigate
* show action menu

No dead buttons allowed.

Examples:

New Chat:

* open user search modal

More Menu:

* open dropdown

Profile:

* open profile drawer

Settings:

* navigate to settings page

---

7. Friend Request Experience

Add:

Pending Requests Card

Sections:

* Incoming Requests
* Outgoing Requests
* Suggestions

Actions:

* Accept
* Reject
* Cancel

Use realistic dummy data.

---

8. Discover Page

Create modern user discovery screen.

Include:

* trending users
* suggested friends
* recently joined
* mutual friends

Card-based layout.

---

9. Profile Drawer

Clicking profile should open side drawer.

Contains:

* profile image
* display name
* username
* bio
* mutual friends
* actions

---

10. Visual Improvements

Reduce blank space.

Increase:

* content density
* information hierarchy
* visual balance

Improve:

* spacing
* typography
* alignment
* card design

---

11. Animation Improvements

Add:

* page transitions
* hover effects
* chat animations
* drawer animations
* modal animations

Subtle and professional.

---

12. Responsiveness

Desktop:

* full experience

Tablet:

* collapsible chat list

Mobile:

* WhatsApp-style navigation

---

13. Product Feel

The interface should feel like:

* a real messaging product
* not a UI demo
* not a wireframe
* not a template

Every visible component should either:

* provide information
* perform an action
* guide the user

Remove all placeholder behavior and create a realistic, interactive frontend experience using mock data and complete UI flows.
