# ORBIT - Functional Logic & Product Requirements

## User Types

### Normal User

* Register account
* Login
* Send friend requests
* Accept/reject requests
* Chat with friends
* Send snaps
* Update profile
* Report users

### Admin

* Manage users
* Moderate content
* View reports
* Ban accounts
* Monitor platform activity

---

# Authentication Logic

## Registration

User provides:

* username
* display name
* email
* password

Validation:

* email unique
* username unique
* password strength validation

After successful registration:

* create profile
* assign role=user
* create notification preferences
* create privacy settings

---

## Username Logic

Rules:

* unique globally
* lowercase
* 4-20 characters

Availability:

* checked while typing

Username changes:

* maximum 3 times
* every change increments counter
* after 3 changes:

  * editing disabled

Store:

* username history
* current username

---

# Login Logic

Users can login with:

* username
* email

System automatically determines:

* email login
  or
* username login

After login:

* JWT generated
* refresh token generated
* active session created

---

# User Discovery Logic

Search should return:

* username
* display name
* profile image

Exclude:

* blocked users
* banned users

Search ranking:

1. exact username match
2. partial username match
3. display name match

---

# Friend Request System

## Sending Request

Conditions:

Cannot send request if:

* already friends
* request pending
* blocked
* same account

When sent:

* request status = pending
* receiver gets notification

---

## Accept Request

When accepted:

Create friendship record

Both users added to:

* friends list

Generate notification:
"Friend request accepted"

---

## Reject Request

Request deleted.

No friendship created.

---

## Remove Friend

Actions:

* remove friendship record
* preserve old chat history
* disable future messaging

---

# Messaging Rules

Users can message only:

* accepted friends

Cannot message:

* strangers
* blocked users
* banned users

---

# Real-Time Messaging Logic

When sender sends message:

1. Store message
2. Generate message id
3. Emit socket event
4. Receiver gets instantly
5. Delivery status updated

Status flow:

sent
→ delivered
→ seen

---

# Seen Status Logic

Message becomes:

delivered:

* receiver connected

seen:

* receiver opens conversation

Blue ticks only appear when:

* conversation opened

---

# Typing Indicator Logic

User starts typing:

Emit:
typing=true

User stops typing:

Emit:
typing=false

Auto timeout:
2 seconds

---

# Online Status Logic

Connected:

* online=true

Disconnected:

* online=false
* update lastSeen timestamp

Display:

* online
* last seen

---

# Temporary Messages

Default:

All messages expire:
24 hours

Store:

* expiresAt timestamp

MongoDB TTL removes automatically.

---

# Snap Logic

## Send Snap

User uploads image

Store:

* snap id
* image url
* sender
* receiver
* viewed=false

---

## Open Snap

When opened:

If viewed=false:

Allow display

Immediately:

viewed=true

Store:
viewedAt

---

## Reopen Snap

Not allowed.

Display:

"This snap has disappeared"

---

# Vanish Mode Logic

Conversation level setting.

Modes:

OFF

VIEW ONCE

10 SECONDS

1 MINUTE

After viewed:

Timer starts.

Message removed after timer.

---

# Notifications Logic

Generate notifications for:

* friend requests
* friend request accepted
* new message
* new snap
* admin announcements

Do not send notification if:

* user currently viewing same chat

---

# Profile Logic

Users can update:

* profile picture
* display name
* bio

Cannot edit:

* join date
* role

---

# Blocking Logic

Blocked user:

Cannot:

* search
* send requests
* send messages
* send snaps

Old chat remains.

---

# Reporting Logic

User reports:

* spam
* abuse
* harassment
* fake profile

Report enters moderation queue.

---

# Admin Moderation Logic

Admin can:

* review reports
* suspend users
* ban users
* remove content

Admin actions stored in audit logs.

---

# Ban Logic

Banned user:

Cannot:

* login
* send messages
* send requests

Existing data preserved.

---

# Analytics Logic

Track:

* daily active users
* new registrations
* messages sent
* snaps sent
* friend requests
* reports

Display charts in admin dashboard.

---

# Security Logic

Store:

* login history
* failed logins
* device information
* IP address

Detect:

* suspicious activity
* brute force attempts

---

# PWA Logic

If browser supports installation:

Show:
Install App button

Otherwise:
Hide button

---

# Multi Theme Logic

Store selected theme:

User Preferences

Apply automatically:

* on login
* on refresh

Default:
Light Theme

Available:

* Light
* Dark
* Midnight
* AMOLED
* Ocean Blue

---

# Admin Route Protection

/admin

Access only if:

role=admin

Else:

redirect to /chat

---

# Route Access Rules

Public:

* login
* signup

Authenticated:

* chat
* profile
* settings
* friends

Admin:

* admin routes only

Unauthorized access:

* redirect
* show error state

---

# Core Product Rule

This is NOT a public messaging platform.

It is a friend-based communication platform.

Flow:

Search User
→ Send Request
→ Accept Request
→ Become Friends
→ Chat
→ Share Snaps
→ Use Vanish Mode
→ Receive Notifications
