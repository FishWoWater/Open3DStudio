In the current codebase I am developing a cross-platform 3DAIGC application. Now I need you to update the display of historical tasks @src/components/tasks/TaskItem.tsx  @src/components/tasks/TaskList.tsx . Specifically, currently each task display the input image in the form of uploaded file @src/types/state.ts:72-87 @src/types/state.ts:101-106 , which will disappear if the user refresh the page or login later. I need you to update it with the input image url from the response of polling job status. Specifically, 
an example result of a processing job query `http://localhost:7842/api/v1/system/jobs/87d2d17b-dd74-407b-862a-b48c95527f49` is:
```text
{
  "job_id": "87d2d17b-dd74-407b-862a-b48c95527f49",
  "feature": "image_to_textured_mesh",
  "inputs": {
    "image_path": "uploads/image/1c/upload_19d27d4c-a6f3-476f-9505-4e0356b29c3e.png",
    "texture_image_path": null,
    "output_format": "glb",
    "texture_resolution": 1024
  },
  "model_preference": "trellis_image_to_textured_mesh",
  "priority": 1,
  "status": "processing",
  "created_at": "2025-12-03T14:42:30.365616",
  "metadata": {
    "feature_type": "image_to_textured_mesh"
  },
  "user_id": "",
  "model_id": "trellis_image_to_textured_mesh",
  "started_at": "2025-12-03T14:42:30.768275",
  "input_image_url": "http://localhost:7842/api/v1/system/jobs/87d2d17b-dd74-407b-862a-b48c95527f49/input",
  "input_image_file_info": {
    "filename": "upload_19d27d4c-a6f3-476f-9505-4e0356b29c3e.png",
    "file_size_bytes": 157743,
    "file_size_mb": 0.15,
    "content_type": "image/png",
    "file_extension": ".png"
  }
}
```
And an example of a completed job is  
```text
{
  "job_id": "87d2d17b-dd74-407b-862a-b48c95527f49",
  "feature": "image_to_textured_mesh",
  "inputs": {
    "image_path": "uploads/image/1c/upload_19d27d4c-a6f3-476f-9505-4e0356b29c3e.png",
    "texture_image_path": null,
    "output_format": "glb",
    "texture_resolution": 1024
  },
  "model_preference": "trellis_image_to_textured_mesh",
  "priority": 1,
  "status": "completed",
  "created_at": "2025-12-03T14:42:30.365616",
  "metadata": {
    "feature_type": "image_to_textured_mesh"
  },
  "user_id": "",
  "model_id": "trellis_image_to_textured_mesh",
  "started_at": "2025-12-03T14:42:30.768275",
  "completed_at": "2025-12-03T14:42:45.032734",
  "result": {
    "output_mesh_path": "/mnt/afs/project/3DAIGC-API/outputs/meshes/trellis_upload_19d27d4c-a6f3-476f-9505-4e0356b29c3e_1764772963.glb",
    "success": true,
    "thumbnail_path": "/mnt/afs/project/3DAIGC-API/outputs/thumbnails/trellis_upload_19d27d4c-a6f3-476f-9505-4e0356b29c3e_1764772963_thumb.png",
    "generation_info": {
      "model": "TRELLIS",
      "image_path": "uploads/image/1c/upload_19d27d4c-a6f3-476f-9505-4e0356b29c3e.png",
      "seed": 42,
      "vertex_count": 12585,
      "face_count": 16023,
      "thumbnail_generated": true
    },
    "mesh_url": "http://localhost:7842/api/v1/system/jobs/87d2d17b-dd74-407b-862a-b48c95527f49/download",
    "mesh_file_info": {
      "filename": "trellis_upload_19d27d4c-a6f3-476f-9505-4e0356b29c3e_1764772963.glb",
      "file_size_bytes": 1937264,
      "file_size_mb": 1.85,
      "content_type": "model/gltf-binary",
      "file_extension": ".glb"
    },
    "thumbnail_url": "http://localhost:7842/api/v1/system/jobs/87d2d17b-dd74-407b-862a-b48c95527f49/thumbnail",
    "thumbnail_file_info": {
      "filename": "trellis_upload_19d27d4c-a6f3-476f-9505-4e0356b29c3e_1764772963_thumb.png",
      "file_size_bytes": 29425,
      "file_size_mb": 0.03,
      "content_type": "image/png",
      "file_extension": ".png"
    }
  },
  "input_image_url": "http://localhost:7842/api/v1/system/jobs/87d2d17b-dd74-407b-862a-b48c95527f49/input",
  "input_image_file_info": {
    "filename": "upload_19d27d4c-a6f3-476f-9505-4e0356b29c3e.png",
    "file_size_bytes": 157743,
    "file_size_mb": 0.15,
    "content_type": "image/png",
    "file_extension": ".png"
  }
}
```
As you can see there is a `input_image_url` in the response json, you can use it for the input imiage display. Note that currently only @src/components/features/MeshGenerationPanel.tsx @src/components/features/MeshPaintingPanel.tsx  can have image as their input
Make good plans before you begin, and don't modify irrelevant code or create any markdown files.