# Open 3D AI Studio - UI Prototype

A modern, elegant UI prototype for a cross-platform 3D AIGC (AI Generated Content) application 

## Overview

This prototype demonstrates a complete UI design for a 3D AI studio application with the following key components:

### Core Layout Components

1. **Main 3D Viewport** - Central viewing area for 3D models
2. **Top Bar** - Module navigation (Mesh Generation, Mesh Painting, Mesh Segmentation, Part Completion, Auto Rigging)
3. **Left Sidebar** - Feature-specific controls and parameters
4. **Right Sidebar** - Task history with previews and status tracking
5. **Bottom Bar** - Scene controls and rendering mode selection
6. **Settings Panel** - Application configuration (API endpoint, theme, etc.)

## Features Implemented

### Mesh Generation
- **Text to Mesh**: Generate 3D models from text descriptions
- **Image to Mesh**: Create 3D models from images
- **Textured Mesh**: Generate models with custom textures
- **Part Completion**: Complete missing parts of 3D meshes

### Mesh Painting
- **Text-based Painting**: Apply textures using text prompts
- **Image-based Painting**: Apply textures using reference images
- **Resolution Control**: Adjustable texture resolution (512x512 to 2048x2048)

### Mesh Segmentation
- **Semantic Segmentation**: Segment meshes into meaningful parts
- **Adjustable Parts**: Control number of segments (2-32 parts)
- **Multiple Output Formats**: GLB, JSON with part information

### Auto Rigging
- **Multiple Rig Modes**: Skeleton only, Skinning only, or Full rig
- **Character Types**: Humanoid, Quadruped, Generic
- **Advanced Options**: Auto-detect joints, IK chains, control curves

## File Structure

```
ui_prototype/
├── index.html          # Main application layout
├── styles/
│   ├── main.css        # Core CSS styling with design system
│   └── enhancements.css # Advanced UI components and effects
├── js/
│   └── main.js         # Interactive functionality
├── demo.html           # Feature showcase page
└── README.md          # This documentation
```

## Design Features

###  Modern Interface
- Sophisticated dark theme with CSS custom properties
- Advanced glass morphism with backdrop blur effects
- Premium gradient systems and color schemes
- iOS-style toggle switches and form elements
- Enhanced micro-interactions with cubic-bezier animations
- Professional typography with Inter font and optimized spacing

### Enhanced Visual Elements
- Accordion-style collapsible sections
- Advanced hover states and transform effects
- Smooth progress bars with shimmer animations
- Custom scrollbar styling
- Tooltip system for better UX
- Status badges and indicators

### Responsive Layout
- CSS Grid and Flexbox for precise layouts
- Mobile-friendly breakpoints
- Collapsible sidebars on small screens
- Optimized for various screen sizes
- Enhanced spacing and padding systems

### Interactive Elements
- Advanced drag & drop file uploads with state feedback
- Real-time form validation with enhanced styling
- Dynamic content switching with smooth transitions
- Task progress simulation with visual feedback
- Custom range sliders and select dropdowns

## Usage

1. **Open the Prototype**: Open `index.html` in a modern web browser
2. **Navigate Modules**: Click on module buttons in the top bar
3. **Configure Features**: Use the left sidebar controls for each feature
4. **Upload Files**: Drag & drop or click to upload images/meshes
5. **Track Progress**: Monitor tasks in the right sidebar
6. **Adjust Settings**: Click the gear icon (top-right) for configuration

## Browser Support

- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## API Integration Ready

The UI is designed to integrate with the backend API documented in `docs/api/api.md`:

### Supported Endpoints
- `/api/v1/mesh-generation/*` - All mesh generation features
- `/api/v1/mesh-segmentation/*` - Mesh segmentation
- `/api/v1/auto-rigging/*` - Auto rigging functionality
- `/api/v1/system/*` - System status and job management

### File Format Support
- **Input**: PNG, JPG, JPEG, WebP, GLB, OBJ, PLY, FBX
- **Output**: GLB, OBJ, PLY, FBX for meshes; PNG, JPG for textures

## Key UI/UX Features

### Upload Experience
- Visual drag & drop zones
- Progress feedback
- File type validation
- Size limit indicators

### Task Management
- Real-time status updates
- Visual progress indicators
- Task history with previews
- Quick actions (view, download, cancel)

### Form Design
- Contextual controls
- Smart defaults
- Progressive disclosure
- Clear labeling and grouping

### Viewport Integration
- Clean, distraction-free viewing area
- Scene information display
- Multiple render modes
- Transform controls

## Customization

### Theme Colors
Primary colors can be customized in `styles/main.css`:
- `--primary-color: #4f46e5` (Purple accent)
- `--bg-primary: #0d0d0d` (Dark background)
- `--bg-secondary: #1a1a1a` (Panels)
- `--border-color: #333` (Borders)

### Layout Adjustments
Sidebar widths and layout proportions can be modified in the CSS grid definitions.

## Technical Implementation

### CSS Features
- CSS Grid for layout
- Flexbox for components
- CSS custom properties for theming
- Backdrop filter for glass effects
- CSS animations for transitions

### JavaScript Features
- ES6 classes for organization
- Event delegation for performance
- Dynamic content generation
- File handling APIs
- Simulated async operations

## Future Enhancements

1. **3D Viewer Integration**: WebGL viewport with Three.js
2. **Real API Integration**: Connect to actual backend services
3. **Advanced Animations**: More sophisticated transitions
4. **Accessibility**: ARIA labels and keyboard navigation
5. **Mobile Optimization**: Touch-friendly interactions

## Development Notes

This prototype focuses on:
- Visual design and layout
- User experience flows
- Interactive functionality
- API integration readiness

The code is structured for easy integration with React, Vue, or other frameworks while maintaining vanilla JavaScript compatibility for prototyping. 