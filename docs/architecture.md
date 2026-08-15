# SyncCode WebRTC Architecture

## Current Architecture

User A
  |
  v
Socket.IO Server
  |
  v
User B

## Proposed Hybrid Architecture

             Backend
                |
       +--------+--------+
       |                 |
   Socket.IO          REST API
       |                 |
   Signaling        Authentication
   Presence         Room Management
       |
       v
    WebRTC
       |
   DataChannel
       |
   +---+---+
   |       |
 User A  User B

## Backend Responsibilities

- Authentication
- Room discovery
- Signaling
- Presence
- Persistence
- Fallback

## WebRTC Responsibilities

- Peer connection
- DataChannel
- P2P data transfer