---
tags: [knowledge, excalidraw, diagrams, collaboration, canvas]
source_repo: excalidraw
---

# Excalidraw - Knowledge Extraction

## Overview & Architecture

Excalidraw is an open-source, infinite canvas whiteboard with a hand-drawn aesthetic. It is MIT-licensed and used in production by Google Cloud, Meta, CodeSandbox, Obsidian, Replit, Notion, and HackerRank.

**Core value props:**
- Infinite canvas with zoom + pan
- Hand-drawn look via RoughJS
- Real-time collaboration with end-to-end encryption (AES-GCM)
- Local-first: autosaves to browser localStorage / IndexedDB
- Embeddable as an npm package (`@excalidraw/excalidraw`)
- PWA support (works offline)
- Export to PNG, SVG, clipboard, or `.excalidraw` JSON

**Repo structure (monorepo, Yarn workspaces):**

```
excalidraw/
├── packages/
│   ├── excalidraw/       # Main React component library → published to npm
│   ├── element/          # Element types, mutations, scene management
│   ├── common/           # Shared utilities, constants, colors
│   ├── math/             # Geometry primitives (points, vectors, bezier)
│   ├── utils/            # Misc utilities
│   └── fractional-indexing/  # CRDT-style ordering
├── excalidraw-app/       # excalidraw.com web app (uses the library)
│   ├── collab/           # Real-time collab (Socket.IO + Firebase)
│   └── data/             # Firebase, LocalData, FileManager
└── examples/             # NextJS + browser script integration demos
```

**Key dependency chain:**
`excalidraw-app` → `@excalidraw/excalidraw` → `@excalidraw/element` → `@excalidraw/common` / `@excalidraw/math`

---

## Tech Stack & Dependencies

| Layer | Technology |
|---|---|
| UI Framework | React 19 |
| Language | TypeScript 5.9 (strict) |
| Drawing / shapes | RoughJS (hand-drawn style) |
| State management | Jotai + jotai-scope (isolated stores per editor instance) |
| Real-time transport | Socket.IO client |
| Backend storage | Firebase Firestore + Firebase Storage |
| Encryption | Web Crypto API — AES-GCM 128-bit |
| Build (library) | esbuild (ESM output) |
| Build (app) | Vite 5 + vite-plugin-pwa |
| Testing | Vitest 3 + vitest-canvas-mock |
| Monorepo | Yarn 1 workspaces |
| Element ordering | Fractional indexing (Rocicorp algorithm) |
| Math helpers | Custom `@excalidraw/math` package |
| ID generation | `nanoid` |
| Throttling | `lodash.throttle` + custom `throttleRAF` |
| I18n | Custom i18n with Crowdin |

**Dev commands:**
```bash
yarn test:typecheck   # TypeScript check
yarn test:update      # All tests with snapshot updates
yarn fix              # Auto-fix formatting + linting
```

---

## Canvas Rendering System

Excalidraw uses **two separate HTML canvases** layered on top of each other:

### 1. StaticCanvas (`StaticCanvas.tsx`)
Renders the scene elements that do not change during interaction:
- All shapes, text, images
- Grid lines
- Frame clipping regions
- Link icons

Entry: `renderStaticScene()` in `renderer/staticScene.ts`

```typescript
// StaticCanvas renders every frame via useEffect (no useMemo)
renderStaticScene(
  { canvas, rc, scale, elementsMap, allElementsMap, visibleElements, appState, renderConfig },
  isRenderThrottlingEnabled(),
);
```

### 2. InteractiveCanvas (`InteractiveCanvas.tsx`)
Renders dynamic overlays: selection handles, transform handles, remote cursors, snap lines, scrollbars.

Entry: `renderInteractiveScene()` in `renderer/interactiveScene.ts`

### 3. NewElementCanvas
Renders the element currently being drawn (before it is committed to the scene).

### Canvas bootstrap pattern
```typescript
// helpers.ts — called at the start of every render
export const bootstrapCanvas = ({ canvas, scale, normalizedWidth, normalizedHeight, theme, isExporting, viewBackgroundColor }) => {
  const context = canvas.getContext("2d")!;
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.scale(scale, scale);
  // fills background, handles dark mode filter, handles transparency
  return context;
};
```

**DPI / retina handling:** canvas physical size = `viewport px * devicePixelRatio * zoom`. All drawing is done in scene coordinates, then translated by `scrollX / scrollY` and scaled by `zoom.value`.

**Grid rendering:** Grid lines are drawn with dashed strokes at intervals of `gridSize * zoom.value`. Bold lines appear every `gridStep` cells. Lines thinner than 10px at current zoom are skipped for performance.

**Frame clipping:** Frames use `context.roundRect()` + `context.clip()` so child elements are clipped within the frame boundary.

**Dark mode:** A CSS `filter: invert(93%) hue-rotate(180deg)` approach (`applyDarkModeFilter`) inverts colors mathematically rather than re-rendering.

**RoughJS integration:** All shape outlines (rectangles, diamonds, ellipses, arrows, lines) are drawn through `rough.canvas(canvas)`, giving the hand-sketched look. The `seed` property on each element ensures the random roughness is deterministic across renders and peers.

---

## Collaboration Architecture

### High-level flow
```
User A draws → Store captures delta → Portal broadcasts encrypted payload via Socket.IO
User B receives → reconcileElements() merges remote + local → updateScene()
```

### Portal (Socket.IO wrapper) — `excalidraw-app/collab/Portal.tsx`
Wraps Socket.IO with:
- Room join/leave events (`init-room`, `join-room`, `new-user`, `room-user-change`)
- Two broadcast channels: **volatile** (cursor position, ~30fps) and **reliable** (scene updates)
- Every payload is encrypted via `encryptData()` before sending

```typescript
async _broadcastSocketData(data: SocketUpdateData, volatile = false) {
  const json = JSON.stringify(data);
  const encoded = new TextEncoder().encode(json);
  const { encryptedBuffer, iv } = await encryptData(this.roomKey!, encoded);
  this.socket?.emit(
    volatile ? WS_EVENTS.SERVER_VOLATILE : WS_EVENTS.SERVER,
    this.roomId, encryptedBuffer, iv,
  );
}
```

### WebSocket event subtypes (`WS_SUBTYPES`)
| Subtype | Purpose |
|---|---|
| `SCENE_INIT` | Full scene broadcast to new joiners |
| `SCENE_UPDATE` | Delta updates to existing scene |
| `MOUSE_LOCATION` | Cursor sync (~30fps, volatile) |
| `IDLE_STATUS` | User active/idle state |
| `USER_VISIBLE_SCENE_BOUNDS` | Viewport for "follow user" feature |

### Reconciliation (`data/reconcile.ts`)
Conflict resolution when two peers edit the same element simultaneously:
```typescript
export const shouldDiscardRemoteElement = (localAppState, local, remote) => {
  if (local &&
    (local.id === localAppState.editingTextElement?.id ||  // being edited locally
     local.version > remote.version ||                      // local is newer
     (local.version === remote.version && local.versionNonce <= remote.versionNonce))) {
    return true;  // keep local
  }
  return false;  // accept remote
};
```
Elements carry `version` (increment on change) + `versionNonce` (random tie-breaker) for deterministic conflict resolution.

### Fractional indexing for ordering
Element z-order uses fractional indices (`"a0"`, `"a1"`, `"Zz"` etc.) instead of array positions. This allows insertion between elements without shifting all indices — critical for CRDT-style multiplayer sync.

### End-to-end encryption
- Room key = AES-GCM 128-bit key, embedded in URL fragment (`#roomId=...&key=...`) — never sent to server
- `generateEncryptionKey()` uses `window.crypto.subtle`
- Files stored in Firebase are encrypted per-room

### File sync
Files (images) are uploaded to Firebase Storage separately from the scene JSON. The `FileManager` class handles upload throttling, deduplication, and status tracking:
- File upload is throttled (300ms)
- Max file size: 4 MiB per file
- Full scene re-sync every 20 seconds (`SYNC_FULL_SCENE_INTERVAL_MS`)

### Collab state atoms (Jotai)
```typescript
export const collabAPIAtom = atom<CollabAPI | null>(null);
export const isCollaboratingAtom = atom(false);
export const isOfflineAtom = atom(false);
export const activeRoomLinkAtom = atom<string | null>(null);
```

---

## Plugin/Extension System

### DiagramToCodePlugin
A render-null React component that registers a `generate` callback with the editor:

```typescript
// Usage in host app:
<Excalidraw>
  <DiagramToCodePlugin generate={myGenerateFn} />
</Excalidraw>

// Implementation:
export const DiagramToCodePlugin = ({ generate }: { generate: GenerateDiagramToCode }) => {
  const app = useApp();
  useLayoutEffect(() => {
    app.setPlugins({ diagramToCode: { generate } });
  }, [app, generate]);
  return null;
};
```

### UI Customization via children slots
Excalidraw exposes named slot components as children:
- `<MainMenu>` — hamburger menu items
- `<WelcomeScreen>` — initial empty canvas screen
- `<Footer>` — bottom bar content
- `<LiveCollaborationTrigger>` — collab button
- `<Sidebar>` — custom side panels

### Action system
Actions are registered objects with:
```typescript
type ActionFn = (
  elements: readonly OrderedExcalidrawElement[],
  appState: Readonly<AppState>,
  formData: any,
  app: AppClassProperties,
) => ActionResult | Promise<ActionResult>;
```
`ActionResult` returns `{ elements, appState, files, captureUpdate }` which gets applied to the scene. The `captureUpdate` field controls undo/redo history:
- `CaptureUpdateAction.IMMEDIATELY` — goes to undo stack immediately
- `CaptureUpdateAction.NEVER` — never captured (remote updates, init)
- `CaptureUpdateAction.EVENTUALLY` — batched with next IMMEDIATELY

### ExcalidrawAPIProvider + Imperative API
The `ExcalidrawImperativeAPI` lets host apps interact programmatically:
```typescript
// Host wraps app in provider, then accesses API anywhere in tree
<ExcalidrawAPIProvider>
  <MyApp />
</ExcalidrawAPIProvider>

// API exposed via onExcalidrawAPI callback or useExcalidrawAPI()
excalidrawAPI.updateScene({ elements, appState });
excalidrawAPI.getSceneElements();
excalidrawAPI.getFiles();
excalidrawAPI.onScrollChange(callback);
excalidrawAPI.onUserFollow(callback);
```

### Sidebar API
Custom sidebars can be registered and opened programmatically:
```typescript
appState.openSidebar = { name: "mySidebar", tab: "settings" };
```

### Embeddable elements
Elements of type `"embeddable"` and `"iframe"` can host arbitrary URLs inside the canvas. Custom validation via `validateEmbeddable` prop, custom rendering via `renderEmbeddable` prop.

---

## Key Code Patterns (with snippets)

### 1. Immutable element mutation
All element updates go through `newElementWith()` which creates a new object and bumps `version`:
```typescript
// NEVER mutate elements directly
const updated = newElementWith(element, { strokeColor: "#ff0000" });
// or for batch updates
const updated = mutateElement(element, { x: 100, y: 200 });
```

### 2. Store / snapshot pattern for undo
The `Store` class observes scene changes and emits `StoreIncrement` events. History is delta-based:
```typescript
export const CaptureUpdateAction = {
  IMMEDIATELY: "IMMEDIATELY",  // goes to undo stack now
  NEVER: "NEVER",              // remote or init updates
  EVENTUALLY: "EVENTUALLY",   // async multi-step operations
} as const;
```

### 3. Scene class (element management)
```typescript
// Scene owns all elements as a Map for O(1) lookups
scene.getElements()                    // all non-deleted
scene.getNonDeletedElementsMap()       // Map<id, element>
scene.getSelectedElements(opts)        // with caching
scene.replaceAllElements(elements)     // full replace
```

### 4. Coordinate systems
Two coordinate spaces:
- **Scene coordinates** — absolute, infinite canvas
- **Viewport coordinates** — screen pixels

```typescript
// Conversion utilities in @excalidraw/common
sceneCoordsToViewportCoords({ x, y }, appState)
viewportCoordsToSceneCoords({ clientX, clientY }, appState)
```

### 5. Jotai isolated store per editor
```typescript
// Each Excalidraw instance gets its own isolated Jotai store
// prevents atom leakage between multiple editor instances
const jotai = createIsolation();
export const editorJotaiStore = createStore();
export const EditorJotaiProvider = jotai.Provider;
```

### 6. AppState default shape
Key fields to know:
```typescript
{
  theme: "light" | "dark",
  collaborators: Map<SocketId, Collaborator>,
  activeTool: { type: ToolType, customType: null | string },
  zoom: { value: NormalizedZoomValue },
  scrollX: number,
  scrollY: number,
  viewModeEnabled: boolean,    // read-only mode
  zenModeEnabled: boolean,     // hide UI chrome
  gridModeEnabled: boolean,
  openSidebar: { name: string, tab?: string } | null,
}
```

### 7. Element base type
All elements extend `_ExcalidrawElementBase`:
```typescript
{
  id: string,
  x: number, y: number,
  width: number, height: number,
  angle: Radians,
  version: number,         // increments on every change
  versionNonce: number,    // random, for conflict resolution
  index: FractionalIndex,  // z-order via fractional indexing
  isDeleted: boolean,      // soft delete (kept for collab sync)
  groupIds: GroupId[],
  frameId: string | null,
  boundElements: BoundElement[] | null,
  link: string | null,
  locked: boolean,
  customData?: Record<string, any>,  // extensible
}
```

### 8. Export pipeline
```typescript
// JSON export
const json = serializeAsJSON(elements, appState, files, "local");
// Strips deleted elements, cleans volatile appState fields

// Canvas export
exportToCanvas({ elements, appState, files, exportPadding })

// SVG export
exportToSvg({ elements, appState, files })
```

### 9. Mermaid / TTD integration
```typescript
// Built-in heuristic detection
isMaybeMermaidDefinition(text: string): boolean
// Supports: flowchart, sequenceDiagram, classDiagram, erDiagram,
//           gantt, mindmap, timeline, gitGraph, sankey, and more
```

---

## API & Integration Patterns

### Minimal embed
```bash
npm install react react-dom @excalidraw/excalidraw
```

```tsx
import { Excalidraw } from "@excalidraw/excalidraw";

export default function App() {
  return (
    <div style={{ height: "100vh" }}>
      <Excalidraw />
    </div>
  );
}
```

### With imperative API
```tsx
import { useState } from "react";
import { Excalidraw, ExcalidrawImperativeAPI } from "@excalidraw/excalidraw";

export default function App() {
  const [api, setApi] = useState<ExcalidrawImperativeAPI | null>(null);

  const loadDiagram = () => {
    api?.updateScene({
      elements: [...],
      appState: { viewBackgroundColor: "#ffffff" },
      captureUpdate: CaptureUpdateAction.NEVER,
    });
  };

  return <Excalidraw onExcalidrawAPI={setApi} />;
}
```

### Key ExcalidrawProps
| Prop | Type | Description |
|---|---|---|
| `initialData` | `ImportedDataState` | Pre-load elements + appState |
| `onChange` | `(elements, state, files) => void` | Scene change callback |
| `onExcalidrawAPI` | `(api) => void` | Access imperative API |
| `isCollaborating` | `boolean` | Show collab UI |
| `onPointerUpdate` | callback | Cursor position updates |
| `viewModeEnabled` | `boolean` | Read-only mode |
| `zenModeEnabled` | `boolean` | Hide toolbar/panels |
| `theme` | `"light" \| "dark"` | Force theme |
| `renderTopRightUI` | render fn | Custom top-right UI |
| `UIOptions.canvasActions` | object | Enable/disable canvas menu items |
| `validateEmbeddable` | fn/regex/string[] | Whitelist embeddable URLs |
| `onLinkOpen` | callback | Handle element link clicks |
| `aiEnabled` | `boolean` | Enable AI features (magic frame) |

### Local storage keys (for localStorage persistence)
```typescript
"excalidraw"           // elements JSON
"excalidraw-state"     // appState JSON
"excalidraw-collab"    // collab data
"excalidraw-theme"     // user theme preference
```

### `.excalidraw` file format
```json
{
  "type": "excalidraw",
  "version": 2,
  "source": "https://excalidraw.com",
  "elements": [...],
  "appState": { "viewBackgroundColor": "#ffffff", ... },
  "files": {}
}
```

### Conversion utility — programmatic element creation
```typescript
import { convertToExcalidrawElements } from "@excalidraw/excalidraw";

const elements = convertToExcalidrawElements([
  { type: "rectangle", x: 100, y: 100, width: 200, height: 100 },
  { type: "text", x: 150, y: 140, text: "Hello" },
]);
```

---

## What We Can Reuse

### 1. Embed as a diagram tool in products
The npm package is production-ready. Can be embedded in dashboards, docs, wiki-style tools, or internal tools for clients. Minimal setup — just wrap in a div with a height.

### 2. End-to-end encryption pattern
The AES-GCM pattern (key in URL fragment, encrypt before sending, decrypt on receive) is clean and reusable for any real-time collaboration feature. Key never hits the server. No backend changes needed.

### 3. Optimistic conflict resolution
The `version` + `versionNonce` pattern for resolving concurrent edits is simple and effective. Much lighter than full OT or CRDT. Good enough for most collaborative tools.

### 4. Fractional indexing for ordered lists
The `@excalidraw/fractional-indexing` package implements Rocicorp's algorithm. Directly reusable for any ordered list that needs CRDT-friendly insertion.

### 5. Dual-canvas architecture
Separating "static" content (rarely changes) from "interactive" overlays (changes every pointer move) is a strong pattern for any canvas-heavy UI. The static canvas can be cached/throttled aggressively.

### 6. Store / delta-based undo
`CaptureUpdateAction.IMMEDIATELY / NEVER / EVENTUALLY` gives fine-grained control over what lands in the undo history. Directly applicable to any editor (text, visual, code).

### 7. Action system pattern
The `ActionFn` pattern (pure function: elements + appState + formData → ActionResult) makes all user actions testable in isolation. Easy to add custom actions.

### 8. `customData` field on elements
Every element has `customData?: Record<string, any>`. This lets you attach domain-specific metadata without forking the data model.

### 9. Mermaid detection + TTD
Built-in text-to-diagram via Mermaid. Can be triggered programmatically. Good model for "paste text → generate diagram" UX in AI products.

### 10. DiagramToCodePlugin pattern
The render-null plugin component that registers a callback (`app.setPlugins(...)`) is a clean pattern for injecting AI-powered features (code generation, auto-labeling, etc.) without touching core.

---

## Lessons & Best Practices

### Architecture
- **Monorepo with clear package boundaries** — separate `element`, `math`, `common` packages prevents circular deps and makes each layer independently testable.
- **Library vs. app separation** — the npm package (`packages/excalidraw`) has zero app-specific code. All Firebase/Socket.IO lives in `excalidraw-app`. This is why embedding is clean.
- **Isolated Jotai stores** — using `jotai-scope`'s `createIsolation()` per editor instance prevents state leakage when multiple editors are on the same page.

### Canvas performance
- **Two-canvas split** reduces redraws: the static canvas only re-renders when the scene changes, not on every pointer move.
- **Render throttling** (`isRenderThrottlingEnabled()`) prevents excessive paint during drag operations.
- **Skip invisible grid lines** — grid lines are skipped when `actualGridSize < 10` pixels. Always skip rendering sub-pixel details.
- **Canvas pixel caching** — link icons are cached on a separate off-screen canvas keyed by zoom level.

### Collaboration
- **Never trust version alone** — always use `versionNonce` as a tiebreaker for concurrent same-version edits.
- **Soft delete, never hard delete** — `isDeleted: true` keeps elements in the scene for sync purposes. Hard deletion causes sync gaps.
- **Volatile vs. reliable channels** — cursor positions use volatile (fire-and-forget) Socket.IO emissions. Scene mutations use reliable acknowledgment. This distinction prevents cursor lag from blocking scene updates.
- **Full scene re-sync fallback** — every 20 seconds the full scene is re-broadcast. This recovers from missed delta updates without complex state repair.

### Data / export
- **Clean AppState before export** — `cleanAppStateForExport()` strips transient UI state (selections, open dialogs) from saved files. Never export raw appState.
- **Filter deleted files on export** — `filterOutDeletedFiles()` removes files referenced only by deleted elements, keeping export size small.
- **Separate local vs database serialization** — `serializeAsJSON(elements, appState, files, "local" | "database")` — database format strips binary files entirely.

### React patterns
- **Class component for Collab** — `Collab` uses `PureComponent` because it needs fine-grained lifecycle control (timers, socket listeners, idle detection). Functional components would make this harder.
- **Render-null plugin components** — `DiagramToCodePlugin` returns `null` and uses `useLayoutEffect` to register. Clean pattern for feature injection.
- **Immutable element updates** — always use `newElementWith()` or `mutateElement()`, never spread-modify elements in place. The Store diff depends on referential inequality.

### TypeScript
- **Branded types** — `SocketId = string & { _brand: "SocketId" }`, `FractionalIndex = string & { _brand: "fractionalIndex" }`. Prevents passing plain strings where domain types are expected.
- **`MakeBrand` utility** — used for `ReconciledElement`, `RemoteExcalidrawElement` etc. to distinguish structurally identical types at the type level.
- **`Readonly<>` on element base** — `_ExcalidrawElementBase` is `Readonly<{...}>`. This enforces immutability at the type level and surfaces mutation bugs during development.
