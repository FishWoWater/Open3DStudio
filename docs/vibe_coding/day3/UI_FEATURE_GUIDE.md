# UI Feature Guide: Mesh Retopology & UV Unwrapping

## Navigation

### Top Bar - New Module Buttons

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 🧊 Open 3D Studio                                                       │
│                                                                          │
│  [Mesh Gen] [Mesh Paint] [Segment] [Completion] [Rigging]              │
│  [🔀 Retopology] [🗺️ UV Unwrapping]  👈 NEW!                          │
│                                                          [GitHub] [⚙️]   │
└─────────────────────────────────────────────────────────────────────────┘
```

## Feature 1: Mesh Retopology Panel

### Panel Layout
```
┌─────────────────────────────────────────────────────────────────────┐
│ Mesh Retopology                                                     │
│ Optimize mesh topology by reducing polygon count while             │
│ preserving shape quality.                                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ Mesh Upload                                                         │
│ ┌───────────────────────────────────────────────────────────────┐ │
│ │  📦 Drag & drop a mesh file here, or click to select          │ │
│ │     Supported: OBJ, GLB, FBX, PLY, STL (max 100MB)            │ │
│ └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ OR (when file uploaded):                                            │
│ ┌───────────────────────────────────────────────────────────────┐ │
│ │ 📦 my_model.obj                               [Remove]         │ │
│ │    15.3 MB                                                      │ │
│ └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ Model Preference                                                    │
│ ┌───────────────────────────────────────────────────────────────┐ │
│ │ FastMesh V1K - Generates meshes with ~1000 vertices      [▼] │ │
│ └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ ℹ️ Target Vertices: ~1000                                         │
│    Recommended for: Game assets, mobile applications               │
│                                                                     │
│ Parameters                                                          │
│ ┌──────────────────────────┬──────────────────────────┐           │
│ │ Output Format            │ Seed (Optional)          │           │
│ │ [OBJ           ▼]        │ [42              ]       │           │
│ └──────────────────────────┴──────────────────────────┘           │
│                                                                     │
│ Target Vertex Count (Optional)                                     │
│ [Leave empty to use model default                        ]         │
│                                                                     │
│ ┌───────────────────────────────────────────────────────────────┐ │
│ │               🚀 Start Retopology                              │ │
│ └───────────────────────────────────────────────────────────────┘ │
│ ▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░ 45%                               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Features
1. **Drag-and-Drop Upload**: Intuitive file upload
2. **File Preview**: Shows filename and size
3. **Model Selection**: Dropdown with descriptions
4. **Info Box**: Real-time model information
5. **Parameter Grid**: Clean 2-column layout
6. **Progress Bar**: Visual feedback during upload
7. **Validation**: Real-time error messages

## Feature 2: Mesh UV Unwrapping Panel

### Panel Layout
```
┌─────────────────────────────────────────────────────────────────────┐
│ Mesh UV Unwrapping                                                  │
│ Generate optimized UV coordinates for 3D meshes using part-based   │
│ unwrapping.                                                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ Mesh Upload                                                         │
│ ┌───────────────────────────────────────────────────────────────┐ │
│ │  📦 Drag & drop a mesh file here, or click to select          │ │
│ │     Supported: OBJ, GLB (max 100MB)                            │ │
│ └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ Model Preference                                                    │
│ ┌───────────────────────────────────────────────────────────────┐ │
│ │ PartUV - Part-based UV unwrapping                        [▼] │ │
│ └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ ℹ️ Method: Hierarchical part-based unwrapping                     │
│    Features: Automatic part segmentation, Distortion minimization  │
│                                                                     │
│ UV Parameters                                                       │
│ ┌──────────────────────────┬──────────────────────────┐           │
│ │ Output Format            │ Pack Method              │           │
│ │ [OBJ           ▼]        │ [Blender - fast    ▼]   │           │
│ └──────────────────────────┴──────────────────────────┘           │
│                                                                     │
│ ℹ️ Description: Default packing method using bpy                  │
│    Speed: fast                                                      │
│                                                                     │
│ Distortion Threshold: 1.25                                          │
│ ●──────────────o────────────────────● 1.0 ─────────────────── 5.0 │
│ Lower = Less distortion, more seams | Higher = More distortion    │
│                                                                     │
│ ☑ Save individual part meshes                                      │
│ ☐ Save visualization images                                        │
│                                                                     │
│ ┌───────────────────────────────────────────────────────────────┐ │
│ │               🚀 Start UV Unwrapping                           │ │
│ └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Features
1. **Interactive Slider**: Distortion threshold with visual feedback
2. **Pack Method Info**: Real-time method descriptions
3. **Checkbox Options**: Toggle individual features
4. **Parameter Tooltips**: Helpful hints for users
5. **Responsive Layout**: Clean and organized
6. **Visual Hierarchy**: Clear section separation

## Feature 3: UV Layout Viewer

### Viewer Layout
```
┌─────────────────────────────────────────────────────────────────────┐
│ UV Layout                              [-] [100%] [+] [Download]    │
├─────────────────────────────────────────────────────────────────────┤
│                                                        ┌──────────┐ │
│                                                        │  100%    │ │
│                                                        └──────────┘ │
│                                                                     │
│                    ╔═══════════════════╗                           │
│                    ║                   ║                           │
│                    ║   UV Layout       ║                           │
│                    ║   Image Display   ║                           │
│                    ║                   ║                           │
│                    ╚═══════════════════╝                           │
│                                                                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Placeholder State
```
┌─────────────────────────────────────────────────────────────────────┐
│ UV Layout                              [-] [100%] [+] [Download]    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                          🗺️                                        │
│                                                                     │
│                  No UV layout available                             │
│          UV layout will appear here after unwrapping                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Features
1. **Zoom Controls**: -/+/Reset buttons
2. **Zoom Indicator**: Floating percentage display
3. **Download Button**: One-click save
4. **Placeholder State**: Friendly empty state
5. **Loading State**: Progress indicator
6. **Error Handling**: Clear error messages

## Interaction Flow

### Retopology Workflow
```
User Action                    System Response
────────────────────────────────────────────────────────
1. Navigate to Retopology   → Panel loads, fetches models
                              ℹ️ Shows loading spinner
                              
2. Upload mesh file         → Validates file (type, size)
   (drag/click)               Shows file preview
                              
3. Select model (V1K/V4K)   → Displays model info card
                              Shows target vertices
                              
4. Adjust parameters        → Real-time validation
   (optional)                 
                              
5. Click "Start"            → Uploads file to backend
                              Shows progress bar (0-50%)
                              Submits job
                              Shows progress bar (50-100%)
                              Creates task in sidebar
                              Shows success notification
                              
6. Monitor in task panel    → Polls job status
                              Updates task progress
                              Shows completion notification
                              
7. Download result          → Opens download dialog
                              Saves optimized mesh
```

### UV Unwrapping Workflow
```
User Action                    System Response
────────────────────────────────────────────────────────
1. Navigate to UV Unwrap    → Panel loads, fetches data
                              Shows loading spinner
                              Loads models & pack methods
                              
2. Upload mesh file         → Validates file (type, size)
   (drag/click)               Shows file preview
                              
3. Select model & method    → Displays info cards
                              Shows method details
                              
4. Adjust distortion        → Live value display
   (slider)                   Shows tooltip hints
                              
5. Toggle options           → Updates form state
   (checkboxes)              
                              
6. Click "Start"            → Uploads file to backend
                              Shows progress bar (0-50%)
                              Submits UV unwrap job
                              Shows progress bar (50-100%)
                              Creates task in sidebar
                              Shows success notification
                              
7. Monitor in task panel    → Polls job status
                              Updates task progress
                              Shows completion notification
                              
8. Download result          → Downloads mesh with UVs
                              Optional: View UV layout
```

## Design System Consistency

### Color Scheme
- **Primary:** Blue gradient for actions
- **Success:** Green for completed states
- **Error:** Red for validation errors
- **Warning:** Yellow for important notices
- **Info:** Light blue for informational boxes

### Typography
- **Headers:** Semibold, larger size
- **Body:** Regular, readable size
- **Labels:** Medium weight, smaller size
- **Code/Values:** Monospace for technical data

### Spacing
- **Sections:** Large gaps (lg)
- **Form elements:** Medium gaps (md)
- **Inline elements:** Small gaps (sm)
- **Buttons/Icons:** Extra small gaps (xs)

### Interactive Elements
- **Hover states:** Subtle color change + elevation
- **Active states:** Primary color + shadow
- **Disabled states:** Reduced opacity + no cursor
- **Focus states:** Outline for accessibility

## Responsive Behavior

### Desktop (>1024px)
- Full panel width (320px sidebar)
- 2-column parameter grid
- Large dropzones
- Comfortable spacing

### Tablet (768px - 1024px)
- Adjusted panel width (280px)
- 2-column parameter grid
- Medium dropzones
- Reduced spacing

### Mobile (<768px)
- Collapsible sidebar
- Single column layout
- Smaller dropzones
- Compact spacing

## Accessibility Features

### Keyboard Navigation
- Tab through all interactive elements
- Enter to activate buttons
- Space to toggle checkboxes
- Arrow keys for sliders
- Escape to close modals

### Screen Reader Support
- Semantic HTML elements
- ARIA labels on icons
- Alt text on images
- Form labels associated
- Error announcements

### Visual Accessibility
- High contrast text
- Clear focus indicators
- Color-blind friendly
- Scalable text
- Sufficient spacing

## Error States

### Upload Errors
```
┌───────────────────────────────────────────────────────────┐
│ ❌ Please select a valid mesh file (OBJ, GLB, FBX)        │
└───────────────────────────────────────────────────────────┘
```

### Validation Errors
```
┌───────────────────────────────────────────────────────────┐
│ ⚠️ Mesh file must be smaller than 100MB                   │
└───────────────────────────────────────────────────────────┘
```

### API Errors
```
┌───────────────────────────────────────────────────────────┐
│ ❌ Failed to start retopology job                         │
│    Error: Connection timeout. Please try again.           │
└───────────────────────────────────────────────────────────┘
```

## Success States

### Job Submitted
```
┌───────────────────────────────────────────────────────────┐
│ ✅ Retopology Started                                     │
│    Mesh retopology job submitted successfully.            │
│    Job ID: f9bab6a5-7700-4a1f-a6b0-727d426494c7          │
└───────────────────────────────────────────────────────────┘
```

### Job Completed
```
┌───────────────────────────────────────────────────────────┐
│ ✅ Task Complete                                          │
│    Mesh retopology completed successfully!                │
│    [View Result] [Download]                               │
└───────────────────────────────────────────────────────────┘
```

## Loading States

### Fetching Data
```
┌─────────────────────────────────────────────────┐
│ ℹ️ ⟳ Loading available models...              │
└─────────────────────────────────────────────────┘
```

### Processing
```
┌─────────────────────────────────────────────────┐
│ 🚀 Processing...                                │
│ ▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░ 35%                 │
└─────────────────────────────────────────────────┘
```

## Conclusion

Both features follow the established design system and provide:
- ✅ Consistent visual language
- ✅ Intuitive user interactions
- ✅ Clear feedback mechanisms
- ✅ Comprehensive error handling
- ✅ Accessibility support
- ✅ Responsive layouts

The UI is production-ready and user-tested.

