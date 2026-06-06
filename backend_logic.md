# ORBIT - COMPLETE PRODUCT LOGIC & FUNCTIONAL REQUIREMENTS

## Product Philosophy

Orbit is a friend-based real-time communication platform.

Users cannot directly message strangers.

Workflow:

Register
→ Search User
→ Send Friend Request
→ Accept Request
→ Become Friends
→ Chat
→ Share Images
→ Use Vanish Mode
→ Receive Notifications

---

# USER SYSTEM

## User Registration

Required Fields:

* Username
* Display Name
* Email
* Password

Optional:

* Profile Picture
* Bio

Validation:

Username:

* Unique
* Lowercase only
* 4-20 characters

Email:

* Unique

Password:

* Minimum 8 characters

After Registration:

Create:

* User profile
* Notification preferences
* Privacy settings
* Friend list
* Activity record

Role:

* user

---

# LOGIN SYSTEM

Login Methods:

* Email
* Username

After Login:

Create:

* JWT token
* Refresh token
* Session

Store:

* Device
* Browser
* Login timestamp

Update:

* Online status

---

# PROFILE SYSTEM

Profile Contains:

* Username
* Display Name
* Profile Picture
* Bio
* Join Date
* Friend Count
* Last Seen
* Online Status

Editable:

* Display Name
* Profile Picture
* Bio

Restricted:

* Username change only 3 times

Track:

* Username history

---

# FRIEND SYSTEM

## Search User

Search by:

* Username
* Display Name

Exclude:

* Self
* Blocked users
* Already friends

---

## Send Friend Request

Conditions:

Cannot send if:

* Already friends
* Pending request exists
* User blocked
* Same account

Create:

FriendRequest:

status = pending

Receiver gets:

* Notification
* Request count update

---

## Accept Request

Actions:

Create friendship record.

Add user A to user B friends list.

Add user B to user A friends list.

Generate notification:

"Friend request accepted"

---

## Reject Request

Delete request.

No friendship created.

---

## Remove Friend

When user removes friend:

Immediately:

* Delete friendship relation
* Delete chat history
* Delete conversation
* Remove conversation from chat list
* Remove access to messaging

Real-time update:

Both users instantly updated.

---

# CHAT SYSTEM

Only friends can chat.

Cannot chat:

* Non-friends
* Blocked users
* Banned users

---

## Conversation Creation

Conversation created automatically:

First message sent.

Store:

* participants
* lastMessage
* updatedAt

---

# MESSAGE SYSTEM

Message Types:

* Text
* Image

No Snap messages.

---

## Send Message

Flow:

User presses send.

1. Create temporary UI message
2. Send socket event
3. Save in database
4. Update conversation
5. Deliver to receiver

Status:

sent

---

## Delivered

When receiver device connected:

status:

delivered

---

## Seen

Only when:

Receiver opens conversation.

Then:

status:

seen

Blue ticks appear.

Never mark seen before opening.

---

# IMAGE MESSAGE SYSTEM

Images uploaded to Cloudinary.

Store:

* imageUrl
* sender
* receiver
* timestamp

Database stores:

URL only.

Never store image files.

---

# VANISH MODE

Conversation setting.

Modes:

OFF

DELETE_AFTER_SEEN

DELETE_AFTER_10_SECONDS

DELETE_AFTER_1_MINUTE

---

## Vanish Mode Workflow

Sender sends message.

Message visible normally.

Receiver opens chat.

Message becomes:

seen

Timer starts.

Delete behavior:

DELETE_AFTER_SEEN:

* remove immediately

DELETE_AFTER_10_SECONDS:

* delete after 10 seconds

DELETE_AFTER_1_MINUTE:

* delete after 60 seconds

Delete from:

* sender
* receiver
* database

Real-time update required.

---

# CHAT DELETION

User can:

Delete Conversation

Confirmation:

Delete chat?

Actions:

* Remove messages
* Remove conversation
* Remove chat list entry

Real-time update.

---

# CALL SYSTEM

Voice Calls Only.

No Video Calls.

---

## Outgoing Call

Store:

* caller
* receiver
* timestamp
* status

Status:

calling

---

## Accepted Call

Status:

answered

Store:

* startTime
* endTime
* duration

---

## Rejected Call

Status:

rejected

---

## Missed Call

Status:

missed

---

# CALL HISTORY

Every call stored.

Show:

* Incoming
* Outgoing
* Missed
* Rejected

Persist after refresh.

Backend-driven only.

---

# ONLINE STATUS

Connected:

online=true

Disconnected:

online=false

Update:

lastSeen

Show:

Online

or

Last Seen

---

# TYPING INDICATOR

Typing starts:

socket emit

typing=true

Typing stops:

typing=false

Timeout:

2 seconds

---

# NOTIFICATION SYSTEM

Generate notifications for:

* Friend Request
* Friend Request Accepted
* New Message
* Missed Call
* Admin Announcement

---

## In-App Notification

If user not currently viewing chat:

Show popup:

Profile Picture
Username
Message Preview

Auto hide after 5 seconds.

---

## Notification Center

Store notifications.

User can:

* View all
* Mark read
* Delete

---

# ADMIN SYSTEM

Role:

admin

Access:

/admin

Only admins allowed.

---

# USERS MANAGEMENT

Show:

* Total users
* Active users
* Online users
* Banned users

Admin can:

* View profile
* Ban
* Unban
* Delete

---

# REPORT SYSTEM

User can report:

* Spam
* Abuse
* Harassment
* Fake Account

Create report record.

---

## Admin Reports Center

Display:

* Pending
* Resolved
* Rejected

Actions:

* Resolve
* Dismiss
* Ban user

---

# SECURITY CENTER

Track:

* Login history
* Failed logins
* Device activity
* Browser activity
* IP addresses

Display:

Security Dashboard

---

# AUDIT LOGS

Store every admin action.

Examples:

User banned

User unbanned

Report resolved

Message removed

Role changed

---

# ANALYTICS

Real-time metrics.

Track:

* New users
* Active users
* Messages sent
* Calls completed
* Friend requests
* Reports submitted

Charts:

Daily
Weekly
Monthly

---

# PAGE STRUCTURE

/login

/signup

/chat

/friends

/calls

/profile

/settings

/notifications

/admin

/admin/users

/admin/reports

/admin/security

/admin/logs

/admin/analytics

---

# REFRESH BEHAVIOR

After refresh:

Must restore:

* User session
* Conversations
* Messages
* Friends
* Calls
* Notifications
* Online state

No data loss.

No mock data.

No placeholders.

Everything must come from backend/database.

---

# REAL-TIME EVENTS

Socket Events:

message_sent

message_delivered

message_seen

typing_start

typing_stop

friend_request

friend_accepted

call_started

call_answered

call_rejected

call_ended

notification_created

conversation_deleted

friend_removed

user_online

user_offline

All events must update UI instantly without refresh.
