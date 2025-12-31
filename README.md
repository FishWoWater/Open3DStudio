# Open3DStudio

[![Apache2.0 License](https://img.shields.io/badge/License-Apache2.0-green.svg)](LICENSE)
[![Cross-Platform](https://img.shields.io/badge/platform-MacOS%20%7C%20Windows%20%7C%20Web-blue)](#)
[![Open3DStudio](https://img.shields.io/badge/YouTube-Open3DStudio-red?logo=youtube)](https://youtu.be/LNteOF3XmmI)

**Open3DStudio** is a cross-platform self-hosted 3D AIGC application. It works closely with the [3DAIGC-API](https://github.com/FishWoWater/3DAIGC-API) to provide **completely locally deployed** and **free** 3DAIGC workflows. Basically it's an advanced version of the  **[Minimal3DStudio](https://github.com/FishWoWater/Minimal3DStudio)** and much like a **replicate of [TripoStudio](https://studio.tripo3d.ai/home?lng=en)**.

The supported workflows include text-to-3d, image-to-3d, mesh segmentation, texture generation, auto-rigging, part completion, mesh re-topologize and mesh uv unwrapping etc.

## CHANGELOG 
### Updates 12.31 (Game Development Enhancements)
* Added **Export Panel** for exporting models and scenes to game-ready formats (GLB/GLTF)
* Export individual models or entire scenes for Unity, Unreal Engine, and Blender
* Improved game development workflow documentation

### Updates 12.07 (Releasing V1.0.0)
* Improving the UI display of the historical tasks 
* Some minor fixes

### Updates 11.30
* Support the task of **Mesh Retopology** and Mesh UV Unwrapping 
* Support running in the **user management** mode, which require the user to register and login 
* Support **reusing mesh** from the result of a previous task as the input (one-click) of a successive task
* Strengthen **3D preview** support (mesh from uploading or task results)
* Support viewing UV layout of the selected mesh, two-sided rendering etc.

## Demo 
You can have a try on [Vercel Deployment](https://open3dstudio.vercel.app) or download the shipped applications from [Releases](https://github.com/FishWoWater/Open3DStudio/releases). Notice that you need to deploy the API backend on your own machine or server. 

![demo](./assets/open3dstudio_v1.0_demo_41m.gif)

For higher-quality video demo, please check [Youtube](https://youtu.be/LNteOF3XmmI).

## Supported 3DAIGC Modules
* Mesh Generation: text / image
* Mesh Painting: text / image 
* Mesh Segmentation
* Part Completion
* Auto Rigging
* Mesh Retopologize 
* Mesh UV Unwrapping 

The available models are up to the API backend, refer to [3DAIGC-API](https://github.com/FishWoWater/3DAIGC-API) for the example model matrix

## Applications Features
- Multiple rendering modes (Solid/Rendered/WireFrame/Skeleton/PartColorize/TwoSided-Rendering)
- Task management with progress and history
- Multi-format support: GLB, OBJ, FBX etc.
- File uploading: uploading images / meshes for later processing
- **Export to game engines**: Export models/scenes as GLB (Unity, Unreal) or GLTF (Blender)
- Anonymous mode(all clients see all jobs) or user mode(require register and login)
- All locally deployed, it's scalable and easy to add a feature/model both at the frontend and backend


## Quick Start
```bash
# development mode 
npm install
npm run dev
## For web: Open [http://localhost:3000](http://localhost:3000)
-## or desktop: Electron app launches automatically


# build the app and ship it for specific platform 
npm run build 
npm run dist-mac
npm run dist-win
```

## 🎮 3D Game Asset Workflow

Open3DStudio streamlines the creation of 3D game assets. Here's a typical workflow:

### 1. Generate 3D Models
- Use **MeshGen** to create models from text prompts or reference images
- AI generates game-ready 3D meshes automatically

### 2. Optimize for Games
- **LowPoly Retopo**: Reduce polygon count for better game performance
- **UV Unwrap**: Prepare models for custom textures
- **TextureGen**: Generate or paint textures on your models

### 3. Add Animation Support
- **Auto Rig**: Automatically add skeletons to character models
- Preview skeleton visualization in the viewport

### 4. Export to Game Engines
Use the **Export** button in the viewport toolbar:
- **GLB format**: Best for Unity, Unreal Engine, and web games
- **GLTF format**: Best for Blender and further editing

### Supported Game Engines
| Engine | Recommended Format | Notes |
|--------|-------------------|-------|
| Unity | GLB | Use glTFast or UniGLTF for import |
| Unreal Engine | GLB | Native glTF support in UE5+ |
| Godot | GLB/GLTF | Native support |
| Three.js/Web | GLB | Optimal for web games |
| Blender | GLTF | For further editing |

## Deploy on Replit

You can deploy Open3DStudio on Replit with just a few clicks:

1. **Fork or Import**: Click the button below or import this repository directly into Replit

   [![Run on Replit](https://replit.com/badge/github/FishWoWater/Open3DStudio)](https://replit.com/new/github/FishWoWater/Open3DStudio)

2. **Install Dependencies**: Replit will automatically run `npm install` when you first open the project

3. **Configure Environment**: Set up your API backend URL in the Replit Secrets tab:
   - Add `REACT_APP_API_BASE_URL` with your 3DAIGC-API backend URL

4. **Run**: Click the "Run" button to start the development server

### Replit Deployment Tips

- **Performance**: Replit provides sufficient resources for the React frontend
- **API Backend**: Deploy [3DAIGC-API](https://github.com/FishWoWater/3DAIGC-API) on a GPU-enabled server (e.g., Vast.ai, RunPod, or your own hardware)
- **Persistence**: Your generated models persist in task history; download them before session ends
- **Collaboration**: Share your Replit URL for real-time collaboration

> **Note**: Replit deployment runs the web version only (no Electron desktop features). Make sure you have the [3DAIGC-API](https://github.com/FishWoWater/3DAIGC-API) backend deployed and accessible from your Replit instance.

## Vibe Coding 
Check out [Vibe Coding Prompts](./docs/vibe_coding/) for the whole developing progress.


## License
The code and application is licensed under [Apache2.0 License](LICENSE).

