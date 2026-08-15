# SyncCode Next-Gen

Decentralized Real-Time Collaborative Development Platform.

## Vision

A research-oriented collaborative development environment combining:

- CRDT-based collaboration
- Local-first architecture
- Peer-to-peer communication
- Client-side encryption
- Browser-native execution
- AI-assisted development
- AST-based code intelligence
- Synchronized debugging

## Current Version

V1 — Foundation

## Development

This project is being developed incrementally through multiple versions.


                 Browser
                    │
                    ▼
            React Frontend
          localhost:5173
                    │
                  HTTP
                    │
                    ▼
             Express Server
          localhost:5000
                    │
             ┌──────┴──────┐
             ▼             ▼
          Routes        Services
                           │
                           ▼
                       MongoDB



Login
  ↓
JWT
  ↓
localStorage
  ↓
Dashboard
                       Day 6 Preview — Protected Application



              Login
                ↓
              JWT
                ↓
          Auth Context
                ↓
        ┌───────┴───────┐
        ↓               ↓
   Protected        User Data
    Routes
        ↓
    Dashboard
        ↓
     Logout




     Browser refresh
      ↓
React state reset
      ↓
App ko user ka pata nahi



App Start
   ↓
Token check
   ↓
GET /api/users/me
   ↓
Valid?
 ┌───┴───┐
Yes      No
 ↓        ↓
User    Login



AuthProvider
     ↓
     App
     ↓
All Pages


Test Protected Route
Test 1 — Logout

Dashboard:

Dashboard
     ↓
Logout
     ↓
user = null
     ↓
Login



Test 2 — Direct Dashboard Without Login

Browser:

http://localhost:5173/dashboard

Without token:

Dashboard
    ↓
ProtectedRoute
    ↓
No user
    ↓
/login





Test Login

Login:

Email
Password
    ↓
POST /api/auth/login
    ↓
JWT
    ↓
localStorage
    ↓
Dashboard



Dashboard
   ↓
Create Room / Create Project
   ↓
Room details
   ↓
MongoDB
   ↓
Unique Room ID
   ↓
Room created


                    Dashboard
                       │
                 Create Project
                       │
                       ▼
                Create Room Form
                       │
                 Project Name
                       │
                       ▼
                POST /api/rooms
                       │
                       ▼
                    Express
                       │
                       ▼
                    MongoDB
                       │
                       ▼
                 Unique Room ID
                       │
                       ▼
                Room Created Page

                                    Dashboard
                       │
                 Create Project
                       │
                       ▼
                Create Room Form
                       │
                 Project Name
                       │
                       ▼
                POST /api/rooms
                       │
                       ▼
                    Express
                       │
                       ▼
                    MongoDB
                       │
                       ▼
                 Unique Room ID
                       │
                       ▼
                Room Created Page



User A
  │
  ├── Create Room
  │
  ▼
SC-A72F9B31
  │
  │
  ├─────────────────────┐
  │                     │
  ▼                     ▼
User A                User B
Owner                  Join Room
                         │
                         ▼
                 POST /rooms/:id/join
                         │
                         ▼
                      MongoDB
                         │
                         ▼
                     Participant
                         │
                         ▼
                     Room Lobby
                



Login
  ↓
Dashboard
  ↓
Room
  ↓
Code Editor
  ├── File Explorer
  ├── File Tabs
  ├── Monaco Editor
  ├── Language
  └── Save







                   Express API
                     │
             ┌───────┴───────┐
             ↓               ↓
        REST Routes       Socket.IO
             │               │
             ↓               ↓
         MongoDB          Rooms
                             │
                    ┌────────┼────────┐
                    ↓        ↓        ↓
                  User A   User B   User C