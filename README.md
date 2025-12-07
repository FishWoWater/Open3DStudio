# Open3DStudio

[![Apache2.0 License](https://img.shields.io/badge/License-Apache2.0-green.svg)](LICENSE)
[![Cross-Platform](https://img.shields.io/badge/platform-MacOS%20%7C%20Windows%20%7C%20Web-blue)](#)
[![Open3DStudio](https://img.shields.io/badge/YouTube-Open3DStudio-red?style=for-the-badge&logo=youtube)](https://youtu.be/LNteOF3XmmI)

**Open3DStudio** is a cross-platform self-hosted 3D AIGC application. It works closely with the [3DAIGC-API](https://github.com/FishWoWater/3DAIGC-API) to provide **completely locally deployed** and **free** 3DAIGC workflows. Basically it's an advanced version of the  **[Minimal3DStudio](https://github.com/FishWoWater/Minimal3DStudio)** and much like a **replicate of [TripoStudio](https://studio.tripo3d.ai/home?lng=en)**.

The supported workflows include text-to-3d, image-to-3d, mesh segmentation, texture generation, auto-rigging, part completion, mesh re-topologize and mesh uv unwrapping etc.

## CHANGELOG 
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
You can have a try on [Vercel Deployment](https://open3dstudio-n5hap1p9y-fishwowaters-projects.vercel.app) or download the shipped applications from [Releases](https://github.com/FishWoWater/Open3DStudio/releases). Notice that you need to deploy the API backend on your own machine or server. 

![demo](./assets/open3dstudio_v1.0_demo_41m.gif)
For higher-quality video demo, please check [youtube](https://youtu.be/LNteOF3XmmI).

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

## Vibe Coding 
Check out [Vibe Coding Prompts](./docs/vibe_coding/) for the whole developing progress.


## License
The code and application is licensed under [Apache2.0 License](LICENSE).

