# Minimal 3D Studio

A cross-platform 3D AIGC (AI Generated Content) studio built with React, Electron, and Three.js. This application provides a comprehensive interface for generating, editing, and manipulating 3D models using various AI-powered tools.

## Features

### 🎯 Core Modules
- **Mesh Generation**: Create 3D models from text descriptions or images
- **Mesh Painting**: Apply textures and materials to existing 3D models
- **Mesh Segmentation**: Automatically segment 3D models into semantic parts
- **Part Completion**: Complete missing parts of incomplete 3D models
- **Auto Rigging**: Generate bone structures and skinning for character models

### 🚀 Key Capabilities
- **Cross-Platform**: Runs as web application or desktop app (Windows/macOS/Linux)
- **Real-time 3D Viewport**: WebGL-based 3D viewer with multiple render modes
- **Task Management**: Background processing with real-time status updates
- **File Management**: Support for multiple 3D formats (GLB, OBJ, FBX, PLY)
- **API Integration**: Complete integration with backend AI services
- **Modern UI**: Professional dark theme with glass morphism effects

## Architecture

### Frontend Stack
- **React 18** - Modern React with hooks and concurrent features
- **TypeScript** - Full type safety and developer experience
- **Styled Components** - Component-based styling with theming
- **Zustand** - Lightweight state management
- **Three.js + React Three Fiber** - 3D rendering and scene management
- **React Three Drei** - Utilities and helpers for Three.js
- **Axios** - HTTP client with interceptors and error handling
- **Framer Motion** - Smooth animations and transitions

### Desktop Integration
- **Electron** - Cross-platform desktop application wrapper
- **IPC Communication** - Secure communication between main and renderer processes
- **Native Menus** - Platform-specific menu integration
- **File System Access** - Native file dialogs and operations

### Project Structure
```
src/
├── api/                    # API client and backend integration
│   └── client.ts          # Comprehensive API client with all endpoints
├── components/            # React components
│   ├── layout/           # Main layout components
│   │   ├── TopBar.tsx    # Navigation and module selection
│   │   ├── LeftSidebar.tsx # Feature controls and parameters
│   │   ├── RightSidebar.tsx # Task history and management
│   │   ├── Viewport.tsx   # 3D scene and viewer
│   │   └── BottomBar.tsx  # Scene controls and status
│   ├── features/         # Feature-specific components
│   ├── tasks/           # Task management components
│   └── ui/              # Reusable UI components
├── store/               # State management
│   └── index.ts        # Zustand store with actions and selectors
├── types/              # TypeScript type definitions
│   ├── api.ts         # API request/response types
│   ├── state.ts       # Application state types
│   ├── components.ts  # Component prop types
│   └── global.ts      # Global types and augmentations
├── styles/            # Styling and theming
│   └── theme.ts      # Design system and theme configuration
└── utils/            # Utility functions and helpers
```

## API Integration

The application integrates with a comprehensive backend API that provides:

### System Management
- Health checks and connectivity monitoring
- Real-time system status and performance metrics
- GPU utilization and VRAM management
- Model loading and availability tracking

### AI Services
- **Text-to-Mesh**: Generate 3D models from text descriptions
- **Image-to-Mesh**: Create 3D models from reference images
- **Mesh Texturing**: Apply materials and textures using AI
- **Mesh Segmentation**: Semantic part segmentation
- **Auto-Rigging**: Automatic skeleton and skinning generation
- **Part Completion**: Complete missing geometry

### File Operations
- Multi-format support (GLB, OBJ, FBX, PLY, STL)
- Upload progress tracking
- Download management
- Base64 encoding support

## State Management

### Store Architecture
The application uses Zustand for state management with the following structure:

```typescript
interface AppState {
  currentModule: ModuleType;           // Active module
  currentFeature: string;             // Active feature within module
  isLoading: boolean;                 // Global loading state
  error: string | null;               // Global error state
  settings: AppSettings;              // User preferences and API config
  tasks: TaskState;                   // Background task management
  ui: UIState;                        // UI state (sidebars, modals, etc.)
  system: SystemState;                // System status and performance
}
```

### Key Features
- **Automatic State Persistence**: Settings and preferences are saved
- **Real-time Updates**: Task status polling and system monitoring
- **Optimistic Updates**: Immediate UI feedback with background sync
- **Error Handling**: Comprehensive error states and recovery
- **Performance Tracking**: FPS, memory usage, and render metrics

## 3D Viewport

### Features
- **Multiple Render Modes**: Solid, wireframe, rendered, material preview
- **Interactive Controls**: Orbit, pan, zoom with smooth damping
- **Scene Management**: Multiple model loading and manipulation
- **Lighting System**: Configurable ambient and directional lighting
- **Environment Mapping**: Studio environment for realistic rendering
- **Grid System**: Infinite grid with customizable spacing
- **Selection System**: Visual feedback for selected objects

### Technical Implementation
- Built with React Three Fiber for declarative 3D scenes
- Suspense boundaries for progressive loading
- Optimized rendering with automatic frustum culling
- Shadow mapping support
- Post-processing pipeline ready

## Task Management

### Background Processing
- **Asynchronous Operations**: Non-blocking AI model inference
- **Progress Tracking**: Real-time progress updates and ETA
- **Queue Management**: Concurrent task limits and prioritization
- **Error Recovery**: Automatic retries and failure handling
- **Result Caching**: Efficient storage and retrieval of outputs

### User Interface
- **Visual Task List**: Thumbnails, progress bars, and status indicators
- **Quick Actions**: Cancel, retry, download, and preview
- **Filtering**: Active, completed, and failed task categories
- **Notifications**: Toast messages for important events

## Development

### Getting Started
```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Start Electron app
npm run dev

# Build desktop application
npm run build-electron
```

### Environment Configuration
Create a `.env` file in the root directory:
```env
REACT_APP_API_BASE_URL=http://localhost:8000
REACT_APP_API_KEY=your_api_key_here
```

### Scripts
- `npm start` - Start React development server
- `npm run build` - Build optimized production bundle
- `npm run electron` - Start Electron wrapper
- `npm run dev` - Start both React and Electron in development
- `npm run build-electron` - Build desktop application
- `npm run dist` - Create distributable packages

## Deployment

### Web Application
The application can be deployed as a static website to any hosting platform:
- Vercel, Netlify, or GitHub Pages for easy deployment
- AWS S3 + CloudFront for production
- Docker containers for self-hosting

### Desktop Application
Electron Builder creates native installers for all platforms:
- **Windows**: .exe installer and portable
- **macOS**: .dmg disk image and App Store package
- **Linux**: .deb, .rpm, and AppImage formats

## Browser Support
- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Note: WebGL 2.0 support required for 3D viewport functionality.

## Performance Considerations

### Optimization Strategies
- **Code Splitting**: Route-based and component-based splitting
- **Lazy Loading**: Progressive component and asset loading
- **Memoization**: React.memo and useMemo for expensive operations
- **Virtual Scrolling**: Efficient rendering of large task lists
- **WebGL Optimization**: Geometry instancing and texture atlasing

### Memory Management
- **Automatic Cleanup**: Disposal of Three.js objects and textures
- **Task Result Caching**: LRU cache for frequently accessed models
- **Progressive Enhancement**: Feature detection and graceful degradation

## Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Submit a pull request

### Code Standards
- TypeScript strict mode enabled
- ESLint and Prettier for code formatting
- Husky for pre-commit hooks
- Conventional commits for version management

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [React Three Fiber](https://github.com/pmndrs/react-three-fiber) for excellent Three.js integration
- [Styled Components](https://styled-components.com/) for component styling
- [Zustand](https://github.com/pmndrs/zustand) for state management
- [Electron](https://www.electronjs.org/) for cross-platform desktop support

---

*Built with ❤️ for the 3D AI community* 