# Open3DStudio

[![Apache2.0 License](https://img.shields.io/badge/license-Apache2.0-green.svg)](LICENSE)
[![Cross-Platform](https://img.shields.io/badge/platform-MacOS%20%7C%20Windows%20%7C%20Web-blue)](#)

**Open3DStudio** is a 3D AIGC application. It works closely with the [3DAIGC-API](https://github.com/FishWoWater/3DAIGC-API) to provide **completely locally deployed** and **free** 3DAIGC workflows. Basically it's an advanced version of the  **[Minimal3DStudio](https://github.com/FishWoWater/Minimal3DStudio)** and much like a **replicate of [TripoStudio](https://studio.tripo3d.ai/home?lng=en)**.

The supported workflows include text-to-3d, image-to-3d, mesh segmentation, texture generation, auto-rigging, part completion etc.

## Demo 
You can have a try on [Vercel Deployment](https://open3dstudio-n5hap1p9y-fishwowaters-projects.vercel.app) or download the shipped applications from [Releases](https://github.com/FishWoWater/Open3DStudio/releases).

 Notice that you need to deploy the API backend on your own machine or server, or try my API endpoint: [http://i-2.gpushare.com:42180](http://i-2.gpushare.com:42180).

 The below video demo shows a section-by-section example of Open3DStudio, you may also check out the comprehensive guide [here](https://www.youtube.com/watch?v=y8ydZeZnPjM).

![Demo](assets/demo.gif)

## 🚀 Core Principles
- **All Local**: No data leaves your device. 
- **Open Source**: Apache2.0 licensed.
- **Cross-Platform**: Desktop (Windows/MacOS) & Web.


## 🧩 Supported 3DAIGC Modules
* Mesh Generation: text / image conditioned
* Mesh Painting: text / image conditioned 
* Mesh Segmentation
* Part Completion
* Auto Rigging

The available models are up to the API backend, refer to [3DAIGC-API](https://github.com/FishWoWater/3DAIGC-API) for the example model matrix

## ✨ Applications Features
- Multiple rendering modes (Solid/Rendered/WireFrame/Skeleton/PartColorize)
- Task management with progress and history
- Multi-format support: GLB, OBJ, FBX etc.
- File uploading: uploading images / meshes for later processing
- All locally deployed, it's scalable and easy to add a feature/model both at the frontend and backend


## 🛠️ Quick Start
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


## 📄 License
The code and application is licensed under [Apache2.0 License](LICENSE).

