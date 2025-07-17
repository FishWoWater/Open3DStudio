# Open3DStudio

[![Apache2.0 License](https://img.shields.io/badge/license-Apache2.0-green.svg)](LICENSE)
[![Cross-Platform](https://img.shields.io/badge/platform-MacOS%20%7C%20Windows%20%7C%20Web-blue)](#)
[![中文文档](https://img.shields.io/badge/README-%E4%B8%AD%E6%96%87-blue)](README.zh-CN.md)

**Open3DStudio** is a 3D AIGC (AI Generated Content) application. It works closely with the [3DAIGC-API](https://github.com/FishWoWater/3DAIGC-API) to provide **completely locally deployed** and **free** 3DAIGC workflows, covering tasks like text-to-3d, image-to-3d, mesh segmentation, texture generation, auto-rigging, part completion etc.

![Demo](assets/demo.gif)

## 🚀 Core Principles
- **All Local**: No data leaves your device. 
- **Open Source**: Apache2.0 licensed.
- **Cross-Platform**: Desktop (Windows/MacOS) & Web.


## 🧩 Supported 3DAIGC Modules
* Mesh Generation
    * text-conditioned mesh generation 
    * image-conditioned mesh generation
* Mesh Painting
    * text-conditioned texture generation 
    * image-conditioned texture generation
* Mesh Segmentation
    * segment a uploaded mesh to different parts
* Part Completion
    * completes a part-level mesh 
* Auto Rigging
    * generate the skeleton or/and the skin weights

The available models are up to the API backend, refer to [3DAIGC-API](https://github.com/FishWoWater/3DAIGC-API) for the example model matrix

## ✨ Applications Features
- Multiple rendering modes (Solid/Rendered/WireFrame/Skeleton/PartColorize)
- Task management with progress and history
- Multi-format support: GLB, OBJ, FBX etc.
- File uploading: uploading images / meshes for later processing
- No internet required for any feature


## 🛠️ Quick Start
```bash
# development mode 
npm install
npm run dev
## For web: Open [http://localhost:3000](http://localhost:3000)
-## or desktop: Electron app launches automatically


# build the app and ship it for specific platform 
npm run build 
npm run pack-mac
```

## 📄 License
[Apache2.0 License](LICENSE)

