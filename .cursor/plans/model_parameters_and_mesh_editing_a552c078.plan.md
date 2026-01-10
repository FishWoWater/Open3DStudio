---
name: Model Parameters and Mesh Editing
overview: Add model-specific parameter fetching/display across all panels, and implement a comprehensive mesh editing feature with bbox-based region selection supporting both text and image-guided editing.
todos:
  - id: model-params-hook
    content: Create useModelParameters hook with caching and error handling
    status: completed
  - id: advanced-params-component
    content: Create AdvancedParameters component with dynamic input rendering
    status: completed
  - id: update-api-types
    content: Add model parameters and mesh editing types to api.ts
    status: completed
  - id: update-api-client
    content: Add getModelParameters, textMeshEditing, imageMeshEditing methods to API client
    status: completed
  - id: integrate-panels
    content: Integrate model-specific parameters into all 7 feature panels
    status: completed
  - id: reorganize-task-buttons
    content: Reorganize TaskItem buttons with dropdown for secondary actions
    status: completed
  - id: bbox-control
    content: Create BBoxControl component with draggable faces
    status: completed
  - id: mesh-edit-viewport
    content: Create MeshEditingViewport with mesh loading and BBox rendering
    status: completed
  - id: mesh-edit-sidebar
    content: Create MeshEditingSidebar with mode switcher and parameter inputs
    status: completed
  - id: mesh-edit-modal
    content: Create MeshEditingModal integrating viewport and sidebar
    status: completed
  - id: wire-mesh-editing
    content: Wire up mesh editing flow in RightSidebar and App.tsx
    status: completed
  - id: test-integration
    content: Test all features end-to-end with backend
    status: completed
---

# Add Model-Specific Parameters & Mesh Editing Features

## Overview

This plan adds two major features:

1. **Model-Specific Parameters**: Fetch and display advanced parameters for each model
2. **Mesh Editing Module**: Interactive bbox-based mesh editing with text/image guidance

## Architecture Overview

```mermaid
flowchart TB
    Panel[Feature Panel] -->|model changes| FetchParams[Fetch Model Params]
    FetchParams -->|GET /api/v1/system/models/{id}/parameters| Backend[Backend API]
    Backend -->|parameter schema| Panel
    Panel -->|display| AdvParams[Advanced Parameters Section]
    
    TaskCard[Task Card] -->|mesh editing button| MeshEditModal[Mesh Editing Modal]
    MeshEditModal -->|render| Viewport3D[3D Viewport with BBox]
    MeshEditModal -->|controls| Sidebar[Right Sidebar Controls]
    Sidebar -->|text/image input| Submit[Submit Editing Job]
    Submit -->|POST /api/v1/mesh-editing/*| Backend
```

---

## Part 1: Model-Specific Parameters

### 1.1 Create Model Parameters Hook

**File**: [`src/hooks/useModelParameters.ts`](src/hooks/useModelParameters.ts) (new)

Create a reusable hook to fetch model-specific parameters:

```typescript
- Fetch parameters when model_id changes
- Cache results to avoid redundant requests  
- Return loading state, parameters schema, and error
- Handle 404 gracefully (model has no specific params)
```

**Key functions**:

- `useModelParameters(modelId: string | undefined)` - main hook
- Returns: `{ parameters, loading, error, refetch }`

### 1.2 Create Advanced Parameters Component

**File**: [`src/components/ui/AdvancedParameters.tsx`](src/components/ui/AdvancedParameters.tsx) (new)

Build a collapsible section that dynamically renders parameter inputs:

```typescript
- Accept parameter schema from backend (type, default, min, max, enum, etc.)
- Render appropriate input types:
 - integer/number: number input with min/max
 - boolean: checkbox
 - enum: Select dropdown
 - string: text input
- Manage form state for all parameters
- Expose values via onChange callback
```

**Props**:

- `parameters: ParameterSchema` - from API
- `values: Record<string, any>` - current values
- `onChange: (values: Record<string, any>) => void`

### 1.3 Update All Feature Panels

Update these 7 panel files to integrate model-specific parameters:

1. [`src/components/features/MeshGenerationPanel.tsx`](src/components/features/MeshGenerationPanel.tsx)
2. [`src/components/features/MeshPaintingPanel.tsx`](src/components/features/MeshPaintingPanel.tsx)
3. [`src/components/features/MeshSegmentationPanel.tsx`](src/components/features/MeshSegmentationPanel.tsx)
4. [`src/components/features/PartCompletionPanel.tsx`](src/components/features/PartCompletionPanel.tsx)
5. [`src/components/features/AutoRiggingPanel.tsx`](src/components/features/AutoRiggingPanel.tsx)
6. [`src/components/features/MeshRetopologyPanel.tsx`](src/components/features/MeshRetopologyPanel.tsx)
7. [`src/components/features/MeshUVUnwrappingPanel.tsx`](src/components/features/MeshUVUnwrappingPanel.tsx)

**Changes for each panel**:

```typescript
// 1. Use the hook
const { parameters, loading: paramsLoading } = useModelParameters(formData.modelPreference);

// 2. Add state for advanced params
const [advancedParams, setAdvancedParams] = useState<Record<string, any>>({});

// 3. Render AdvancedParameters component (below common parameters)
<AdvancedParameters
  parameters={parameters}
  values={advancedParams}
  onChange={setAdvancedParams}
/>

// 4. Include advancedParams in API request
const request = {
  ...commonParams,
  ...advancedParams  // spread model-specific params
};
```

### 1.4 Update API Client & Types

**File**: [`src/api/client.ts`](src/api/client.ts)

Add new method:

```typescript
async getModelParameters(modelId: string): Promise<ModelParametersResponse> {
  const response = await this.retry(() => 
    this.client.get(`/api/v1/system/models/${modelId}/parameters`)
  );
  return response.data;
}
```

**File**: [`src/types/api.ts`](src/types/api.ts)

Add new types:

```typescript
export interface ParameterSchema {
  type: 'integer' | 'number' | 'boolean' | 'string';
  description: string;
  default: any;
  minimum?: number;
  maximum?: number;
  enum?: any[];
  required: boolean;
}

export interface ModelParametersResponse {
  model_id: string;
  feature_type: string;
  vram_requirement: number;
  schema: {
    parameters: Record<string, ParameterSchema>;
  };
  timestamp: string;
}
```

---

## Part 2: Mesh Editing Feature

### 2.1 Reorganize Task Card Buttons

**File**: [`src/components/tasks/TaskItem.tsx`](src/components/tasks/TaskItem.tsx)

Currently has Import, Reuse, Download, Delete buttons. Reorganize to:

```typescript
// Primary actions (always visible)
- Import button (for completed tasks)
- "⋮ More" button (dropdown for secondary actions)

// Secondary actions (in dropdown menu)
- Mesh Editing (new!) - only for completed tasks with mesh output
- Reuse
- Download  
- Delete (keep as standalone danger button)
```

**Implementation**:

- Create dropdown menu component (similar to existing patterns)
- Add `onMeshEditing?: (taskId: string) => void` prop
- Show "Mesh Editing" option only if `task.status === 'completed' && task.result?.downloadUrl`

### 2.2 Create Mesh Editing Modal

**File**: [`src/components/ui/MeshEditingModal.tsx`](src/components/ui/MeshEditingModal.tsx) (new)

Large popup modal with:

**Layout**:

```
┌─────────────────────────────────────────────────────┐
│  Mesh Editing                              [X Close] │
├────────────────────────────────┬────────────────────┤
│                                │  Right Sidebar:    │
│   3D Viewport (center)         │  - Mode selector   │
│   - Display mesh               │    (Text/Image)    │
│   - Bbox visualization         │  - Model selector  │
│   - Drag bbox faces to resize  │  - Text prompt     │
│                                │  - Image upload    │
│                                │  - Parameters      │
│                                │  - Submit button   │
└────────────────────────────────┴────────────────────┘
```

**Props**:

```typescript
interface MeshEditingModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;  // The task with mesh output
}
```

**State Management**:

```typescript
- mode: 'text' | 'image'
- bboxCenter: [number, number, number]
- bboxDimensions: [number, number, number]
- selectedModel: string
- textPrompt: string (for text mode)
- sourcePrompt: string (for text mode)
- sourceImage: File | null (for image mode)
- targetImage: File | null (for image mode)
- maskImage: File | null (optional for image mode)
- advancedParams: Record<string, any>
```

### 2.3 Create BBox Control Component

**File**: [`src/components/ui/BBoxControl.tsx`](src/components/ui/BBoxControl.tsx) (new)

Interactive bounding box for region selection:

**Features**:

- Render 6 draggable faces (front, back, left, right, top, bottom)
- Each face can be dragged along its normal axis
- Visual feedback on hover/drag
- Edges and corners shown in contrasting color
- Initialize from mesh bounding box

**Implementation details**:

```typescript
- Use THREE.BoxHelper for visualization
- Create 6 invisible plane meshes for raycasting/dragging
- On drag: raycast to find intersection, update bbox dimensions
- Constrain movement to respective axis (X, Y, or Z)
- Emit onChange event with new center/dimensions
```

**Props**:

```typescript
interface BBoxControlProps {
  center: [number, number, number];
  dimensions: [number, number, number];
  onChange: (center: [number, number, number], dimensions: [number, number, number]) => void;
}
```

### 2.4 Create Mesh Editing Viewport

**File**: [`src/components/ui/MeshEditingViewport.tsx`](src/components/ui/MeshEditingViewport.tsx) (new)

Specialized 3D viewport for mesh editing:

```typescript
- Load mesh from task.result.downloadUrl
- Display mesh in center
- Initialize bbox from mesh bounding box
- Render BBoxControl component
- OrbitControls for camera
- Grid and lighting
```

### 2.5 Create Mesh Editing Sidebar

**File**: [`src/components/ui/MeshEditingSidebar.tsx`](src/components/ui/MeshEditingSidebar.tsx) (new)

Control panel with:

**Sections**:

1. **Mode Selector**: Text vs Image tabs
2. **Model Selector**: Fetch models for text-mesh-editing or image-mesh-editing
3. **Text Mode Inputs**:

                                                                                                - Source prompt (describe current mesh region)
                                                                                                - Target prompt (describe desired result)

4. **Image Mode Inputs**:

                                                                                                - Source image upload
                                                                                                - Target image upload  
                                                                                                - Mask image upload (optional)

5. **Advanced Parameters**: Use `<AdvancedParameters>` component
6. **Common Parameters**:

                                                                                                - num_views (50-300, default 150)
                                                                                                - resolution (256-1024, default 512)

7. **Submit Button**: Trigger mesh editing job

### 2.6 Update Store for Mesh Editing

**File**: [`src/store/index.ts`](src/store/index.ts)

Add modal type for mesh editing:

```typescript
// In types/state.ts
export type ModalType = 
  | 'settings'
  | 'model-viewer'  
  | 'transform'
  | 'uv-viewer'
  | 'mesh-editing'  // NEW
  | null;

// Store already has openModal/closeModal actions
// Use: openModal('mesh-editing', { task })
```

### 2.7 Update API Client for Mesh Editing

**File**: [`src/api/client.ts`](src/api/client.ts)

Add methods:

```typescript
async textMeshEditing(request: TextMeshEditingRequest): Promise<BaseApiResponse> {
  const response = await this.client.post(
    '/api/v1/mesh-editing/text-mesh-editing',
    request
  );
  return response.data;
}

async imageMeshEditing(request: ImageMeshEditingRequest): Promise<BaseApiResponse> {
  const response = await this.client.post(
    '/api/v1/mesh-editing/image-mesh-editing',
    request
  );
  return response.data;
}
```

**File**: [`src/types/api.ts`](src/types/api.ts)

Add request types:

```typescript
export interface TextMeshEditingRequest {
  mesh_file_id: string;
  mask_bbox: {
    center: [number, number, number];
    dimensions: [number, number, number];
  };
  source_prompt: string;
  target_prompt: string;
  num_views?: number;
  resolution?: number;
  output_format: OutputFormat;
  model_preference?: string;
  // ...plus any model-specific params
}

export interface ImageMeshEditingRequest {
  mesh_file_id: string;
  source_image_file_id: string;
  target_image_file_id: string;
  mask_image_file_id?: string;
  mask_bbox: {
    center: [number, number, number];
    dimensions: [number, number, number];
  };
  num_views?: number;
  resolution?: number;
  output_format: OutputFormat;
  model_preference?: string;
  // ...plus any model-specific params
}
```

### 2.8 Wire Up Mesh Editing Flow

**File**: [`src/components/layout/RightSidebar.tsx`](src/components/layout/RightSidebar.tsx)

Update to handle mesh editing button:

```typescript
const handleMeshEditing = (taskId: string) => {
  const task = tasks.tasks.find(t => t.id === taskId);
  if (task) {
    openModal('mesh-editing', { task });
  }
};

<TaskItem
  // ...other props
  onMeshEditing={handleMeshEditing}
/>
```

**File**: [`src/App.tsx`](src/App.tsx)

Add modal rendering:

```typescript
import MeshEditingModal from './components/ui/MeshEditingModal';

// In render
{ui.modal.isOpen && ui.modal.type === 'mesh-editing' && (
  <MeshEditingModal
    isOpen={true}
    onClose={closeModal}
    task={ui.modal.data.task}
  />
)}
```

---

## Implementation Notes

### File Upload Strategy

- For mesh editing, first upload the mesh from `task.result.downloadUrl` to get `file_id`
- For images, use the existing `uploadImageFile` method
- Cache uploaded file IDs to avoid re-uploading

### BBox Initialization

- Get mesh bounding box: `new THREE.Box3().setFromObject(meshObject)`
- Use bbox center and size as initial values
- User can then adjust by dragging faces

### Parameter Merging

- Common parameters (num_views, resolution) are always sent
- Model-specific parameters from `<AdvancedParameters>` are merged in
- Backend uses model-specific params if provided, otherwise uses defaults

### Error Handling

- Handle 404 for model parameters gracefully (no advanced params available)
- Validate bbox dimensions (min size > 0)
- Validate prompts (min length, required fields)
- Show loading states during uploads

### UX Enhancements

- Show bbox dimensions in real-time as user drags
- Preview bbox on mesh before submitting
- Disable submit button while uploading
- Success notification with job ID after submission
- Close modal after successful submission

---

## Testing Checklist

### Model-Specific Parameters

- [ ] Parameters load when model changes
- [ ] Collapsible section works correctly
- [ ] Different parameter types render properly (int, bool, enum)
- [ ] Values are included in API requests
- [ ] Works across all 7 feature panels

### Mesh Editing

- [ ] Button appears only for completed tasks with mesh
- [ ] Modal opens/closes correctly
- [ ] Mesh loads and displays in viewport
- [ ] BBox initializes from mesh bounds
- [ ] BBox faces are draggable
- [ ] Text mode: prompts work, job submits
- [ ] Image mode: uploads work, job submits
- [ ] Model selector shows correct models
- [ ] Advanced parameters work in modal
- [ ] Task is created after submission