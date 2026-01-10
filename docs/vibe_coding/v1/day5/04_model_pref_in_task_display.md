In the current codebase I am implementing a cross-platform 3DAIGC application. I need you to have two minor updates on current codebase.
(1) Please add a dropdown in the mesh painting panel @src/components/features/MeshPaintingPanel.tsx for selecting the model preference from the available models. Notice that you can query the available models using @getModelsForFeature, just like in the mesh generation panel 
(2) When querying task status and information @TaskItem.tsx , there will be a `model_preference` field, please add it in the task field and also display in the Task List @src/components/tasks/TaskList.tsx  , example response of querying a job status:
```text
{
  "job_id": "b8bad50e-7b56-4c17-bcd0-8f743f905be8",
  "feature": "image_mesh_painting",
  "inputs": {
    "image_path": "uploads/image/47/upload_5081566f-e492-4ee4-a148-38da063372b8.png",
    "mesh_path": "uploads/mesh/a1/upload_5dfd0cc7-4fc2-4888-9303-62b41ed4da6d.obj",
    "output_format": "glb",
    "texture_resolution": 1024
  },
  "model_preference": "trellis_image_mesh_painting",
  "priority": 1,
  "status": "completed",
  "created_at": "2025-12-05T14:52:09.698921",
  "metadata": {
    "feature_type": "image_mesh_painting"
  },
  "user_id": "",
  "model_id": "trellis_image_mesh_painting",
  "started_at": "2025-12-05T14:52:10.384535",
  "completed_at": "2025-12-05T14:53:06.487163",
  "result": {
    "output_mesh_path": "/mnt/afs/project/3DAIGC-API/outputs/meshes/trellis_upload_5081566f-e492-4ee4-a148-38da063372b8_1764946384.glb",
    "success": true,
    "thumbnail_path": "/mnt/afs/project/3DAIGC-API/outputs/thumbnails/trellis_upload_5081566f-e492-4ee4-a148-38da063372b8_1764946384_thumb.png",
    "generation_info": {
      "model": "TRELLIS",
      "image_path": "uploads/image/47/upload_5081566f-e492-4ee4-a148-38da063372b8.png",
      "seed": 42,
      "vertex_count": 33140,
      "face_count": 36392,
      "thumbnail_generated": true
    },
    "mesh_url": "http://localhost:7842/api/v1/system/jobs/b8bad50e-7b56-4c17-bcd0-8f743f905be8/download",
    "mesh_file_info": {
      "filename": "trellis_upload_5081566f-e492-4ee4-a148-38da063372b8_1764946384.glb",
      "file_size_bytes": 2633212,
      "file_size_mb": 2.51,
      "content_type": "model/gltf-binary",
      "file_extension": ".glb"
    },
    "thumbnail_url": "http://localhost:7842/api/v1/system/jobs/b8bad50e-7b56-4c17-bcd0-8f743f905be8/thumbnail",
    "thumbnail_file_info": {
      "filename": "trellis_upload_5081566f-e492-4ee4-a148-38da063372b8_1764946384_thumb.png",
      "file_size_bytes": 22037,
      "file_size_mb": 0.02,
      "content_type": "image/png",
      "file_extension": ".png"
    }
  },
  "input_image_url": "http://localhost:7842/api/v1/system/jobs/b8bad50e-7b56-4c17-bcd0-8f743f905be8/input",
  "input_image_file_info": {
    "filename": "upload_5081566f-e492-4ee4-a148-38da063372b8.png",
    "file_size_bytes": 143678,
    "file_size_mb": 0.14,
    "content_type": "image/png",
    "file_extension": ".png"
  }
}
```
As you can see the `model_preference` field above. 
Please update the code. Don't create any markdown files.