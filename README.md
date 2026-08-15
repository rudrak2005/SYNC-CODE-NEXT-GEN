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



                  User A
  │
  │ Offer
  ↓
Signaling Server
  │
  │ Offer
  ↓
User B
  │
  │ Answer
  ↓
Signaling Server
  │
  │ Answer
  ↓
User A

# Day 11 — WebRTC Research & Feasibility

## Objective

Study WebRTC and determine how it can be integrated
into SyncCode Next-Gen without breaking the existing
Socket.IO collaboration baseline.

## Topics

- WebRTC
- P2P communication
- Signaling
- SDP
- ICE
- STUN
- TURN
- RTCDataChannel
- NAT traversal
- Hybrid architecture

## Current Baseline

SyncCode currently uses:

React
Node.js
Express
MongoDB
Socket.IO
Monaco Editor

## Proposed Direction

Keep Socket.IO for:

- Signaling
- Presence
- Room management
- Fallback communication

Evaluate WebRTC DataChannel for:

- Peer-to-peer data transfer
- Collaborative code updates
- Potential latency reduction

## Decision

WebRTC will NOT replace Socket.IO completely.

A hybrid architecture will be evaluated.

## Status

Research completed.
Implementation deferred to later experimentation.


Browser
   │
   ├──────── Socket.IO ────────┐
   │                           │
   │                     Existing sync
   │
   └──────── Yjs ──────────────┐
                               │
                            Y.Doc
                               │
                            Y.Text




                            # SyncCode - Day 12

## Date
2026-08-16

## Goal
Introduce Yjs as the foundation for CRDT-based collaboration.

## Topics Learned
- Yjs
- Y.Doc
- Y.Text
- Document state
- Change observers
- CRDT foundation
- Distributed document model

## Features Implemented
- [x] Yjs installed
- [x] Y.Doc created
- [x] Y.Text created
- [x] Text insertion tested
- [x] Change observer tested
- [x] Yjs isolated from Socket.IO baseline
- [x] Research documentation

## Files Added
client/src/lib/collaboration/yjsDocument.js
research/day-12-yjs/README.md

## Files Updated
client/package.json
client/package-lock.json

## Files Replaced
None

## Existing Features Preserved
- Authentication
- Rooms
- Monaco Editor
- Socket.IO collaboration
- Presence
- Room isolation

## Testing
- [x] Yjs installation
- [x] Y.Doc
- [x] Y.Text
- [x] Observer
- [x] Existing Day 10 tests

## Result
Yjs successfully introduced as an isolated
collaboration document layer.

## Progress
Day 12 / 45

## Commit
Day 12: introduce Yjs collaboration foundation

## Next Day
Day 13 — CRDT Document Model

A replica                 B replica
    │                         │
    │ local change            │ local change
    ▼                         ▼
   CRDT                      CRDT
    │                         │
    └──────── updates ────────┘
              ↓
       deterministic merge
              ↓
       converged state