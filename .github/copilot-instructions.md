# Copilot Instructions for Minimal 3D Studio

## Project Overview
Cross-platform 3D AIGC (AI Generated Content) studio built with React, Electron, and Three.js. Provides AI-powered 3D model generation, editing, and manipulation tools with real-time 3D viewport and background task processing.

## Architecture Patterns

### State Management with Zustand
- **Central store**: `src/store/index.ts` - uses Zustand with subscribeWithSelector middleware
- **State structure**: Nested objects (`ui.viewport`, `tasks.activeTasks`, `system.performance`)
- **Actions pattern**: Methods directly on store (e.g., `setCurrentModule`, `updateTask`)
- **Persistence**: Settings auto-persist, tasks and UI state are session-only
- **Selectors**: Custom hooks like `useCurrentModule()`, `useViewport()` for component access

### Component Architecture
- **Layout components**: `src/components/layout/` - core app structure (TopBar, Sidebars, Viewport)
- **Feature components**: `src/components/features/` - module-specific panels (MeshGenerationPanel.tsx)
- **Styled Components**: All styling via styled-components with theme system
- **Glass morphism pattern**: `backdrop-filter: blur(24px)` + semi-transparent backgrounds

### API Client Pattern
- **Centralized client**: `src/api/client.ts` - Axios instance with interceptors
- **Job-based workflow**: All AI operations return `job_id`, poll for completion
- **Error handling**: Custom `ApiError` class, standardized error responses
- **File uploads**: Base64 encoding, unique file IDs for subsequent operations

### 3D Viewport Integration
- **React Three Fiber**: Declarative 3D scene in `src/components/layout/Viewport.tsx`
- **Scene structure**: Lighting → Environment → Grid → Models → Controls
- **Model management**: `loadedModels` array in viewport state, each with position/rotation/scale
- **Render modes**: solid, wireframe, rendered - affects material wireframe property

## Development Workflows

### Starting Development
```bash
npm install
npm run dev  # Starts both React (3000) and Electron
```

### API Integration
- Configure `REACT_APP_API_BASE_URL=http://localhost:7842` in `.env`
- API client auto-handles auth headers, timeouts, and error formatting
- All AI operations follow: upload files → submit job → poll status → download results

### Adding New Features
1. Define types in `src/types/` (api.ts for requests, state.ts for store)
2. Add API methods to `src/api/client.ts`
3. Create feature panel in `src/components/features/`
4. Add state/actions to store if needed
5. Update TopBar navigation if new module

## Key Conventions

### File Naming
- Components: PascalCase (e.g., `MeshGenerationPanel.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `useTaskPolling.ts`)
- Types: PascalCase interfaces (e.g., `ModuleType`, `JobStatus`)

### Component Patterns
```tsx
// Standard component structure
const ComponentName = styled.div`
  background: ${props => props.theme.colors.background.secondary};
  // Use theme tokens, not hardcoded values
`;

const MyComponent: React.FC<Props> = ({ prop1, prop2 }) => {
  const storeData = useStoreSelector();
  const { action } = useStoreActions();
  
  return <ComponentName>...</ComponentName>;
};
```

### State Updates
```tsx
// Store actions pattern - direct mutations
const useStore = create<State>((set, get) => ({
  updateViewport: (updates) => set((state) => ({
    ui: { ...state.ui, viewport: { ...state.ui.viewport, ...updates }}
  })),
}));
```

### Error Handling
- API errors: Caught by interceptors, formatted as `ApiError` with code/message
- Component errors: `ErrorBoundary` wrapper in critical components
- Task failures: Stored in `failedTasks` array with retry capabilities

## Dependencies & Integration

### Core Stack
- **React 18** + TypeScript (strict mode)
- **Styled Components** with theme provider
- **Zustand** for state (not Redux - migrated away)
- **Three.js** via React Three Fiber + Drei utilities
- **Electron** for desktop builds (optional)

### 3D Rendering
- WebGL 2.0 required, graceful degradation for older browsers
- Automatic geometry cleanup on model removal
- Shadow mapping enabled by default
- Environment maps for realistic rendering

### Build System
- CRA-based build with TypeScript
- Electron Builder for desktop distribution
- Cross-platform deployment (Windows/macOS/Linux)

## Common Gotchas

### Task Management
- Always poll task status - jobs are async and may take minutes
- Handle task cancellation - cleanup both frontend and backend state
- Tasks auto-cleanup after 24h on backend, plan client-side accordingly

### 3D Viewport
- Dispose Three.js objects manually to prevent memory leaks
- Use `<Suspense>` boundaries for lazy-loaded models
- Grid positioning: Objects at y=0 sit on grid surface

### API Client
- File uploads return IDs, not direct URLs - use IDs in subsequent requests
- Backend auto-manages VRAM - don't assume immediate processing
- Authentication via Bearer token in Authorization header

This codebase prioritizes TypeScript safety, modular architecture, and professional UI/UX patterns. When adding features, follow the established component/state/API patterns rather than introducing new paradigms.
