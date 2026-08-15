# Day 12 — Yjs

## Objective

Introduce Yjs as the collaboration document layer
without replacing the existing Socket.IO baseline.

## Technology

- Yjs
- Y.Doc
- Y.Text

## Existing Baseline

Day 10:
Socket.IO-based server-mediated synchronization.

## Day 12 Architecture

Editor
  ↓
Y.Doc
  ↓
Y.Text

Socket.IO remains unchanged.

## Experiment

Created a Y.Doc and Y.Text structure.

Tested:

- Document creation
- Text insertion
- Change observation
- Multiple Y.Doc instances

## Result

Yjs successfully installed and basic document operations
were demonstrated.

## Important Decision

Yjs is currently isolated from the production editor
synchronization path.

Socket.IO collaboration remains the stable baseline.

## Next

Day 13 — CRDT Document Model