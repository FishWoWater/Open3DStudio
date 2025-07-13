# 3D Generative Models Backend API Documentation

## Overview

This API provides scalable 3D AI model inference capabilities with VRAM-aware scheduling. The backend supports multiple 3D AIGC features including mesh generation, texturing, segmentation, and auto-rigging.

**Base URL**: `http://localhost:7842` (or your configured host/port)
**API Version**: v1
**Documentation**: `/docs` (Swagger UI) or `/redoc` (ReDoc)

## File Upload System

The API supports file uploads for images and meshes, returning unique file IDs that can be used in subsequent API calls. Files are automatically cleaned up after 24 hours.

### File Upload Workflow

1. **Upload Files**: Upload your images and meshes to get unique file IDs
2. **Use File IDs**: Use the returned file IDs in mesh generation, segmentation, or rigging requests
3. **Process Results**: Download generated results using the job system


## Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "job_id": "unique_job_identifier",
  "status": "queued|processing|completed|failed",
  "message": "descriptive_message"
}
```

### Error Response
```json
{
  "error": "ERROR_CODE",
  "message": "Human readable error message",
  "detail": "Additional error details"
}
```


---

## System Management Endpoints

### Health Check
- **URL**: `/health`
- **Method**: `GET`
- **Description**: Basic health check for the API
- **Authentication**: None required
- **Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 1234567890
}
```


### System Status
- **URL**: `/api/v1/system/status`
- **Method**: `GET`
- **Description**: Get detailed system status including GPU information
- **Authentication**: Required
- **Response**:
```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "system": {
    "cpu_usage": 45.2,
    "memory": {
      "total": 34359738368,
      "available": 16777216000,
      "used": 17582522368,
      "percent": 51.2
    },
    "disk": {
      "total": 1000000000000,
      "free": 500000000000,
      "used": 500000000000,
      "percent": 50.0
    }
  },
  "gpu": [
    {
      "id": 0,
      "name": "NVIDIA RTX 4090",
      "memory_total": 24576,
      "memory_used": 8192,
      "memory_free": 16384,
      "memory_utilization": 0.33,
      "gpu_utilization": 0.75,
      "temperature": 65
    }
  ],
  "models": {"loaded": 3, "available": 10, "total_vram_used": 8192},
  "queue": {"pending_jobs": 2, "processing_jobs": 1, "completed_jobs": 15}
}
```


### List Supported Features
- **URL**: `/api/v1/system/features`
- **Method**: `GET`
- **Description**: List all supported features
- **Authentication**: None required
- **Response**:
```json
{
  "features": [
    {
      "name": "text_to_raw_mesh",
      "model_count": 1,
      "models": ["trellis_text_to_raw_mesh"]
    },
    {
      "name": "mesh_segmentation",
      "model_count": 1,
      "models": ["partfield_mesh_segmentation"]
    }
  ],
  "total_features": 2
}
```

### List Available Models
- **URL**: `/api/v1/system/models`
- **Method**: `GET`
- **Description**: List available models, optionally filtered by feature
- **Authentication**: Required
- **Query Parameters**:
  - `feature` (optional): Filter by specific feature type
- **Response**:
```json
{
  "available_models": {
    "text_to_raw_mesh": ["trellis_text_to_raw_mesh"],
    "image_to_raw_mesh": ["trellis_image_to_raw_mesh"],
    "mesh_segmentation": ["partfield_mesh_segmentation"],
    "auto_rig": ["unirig_auto_rig"]
  },
  "total_features": 4,
  "total_models": 4
}
```

### Get Job Status
- **URL**: `/api/v1/system/jobs/{job_id}`
- **Method**: `GET`
- **Description**: Get status of a specific job with visitable URLs for files
- **Authentication**: None required
- **Path Parameters**:
  - `job_id`: Unique job identifier
- **Response**:
```json
{
  "job_id": "job_123456",
  "status": "completed",
  "created_at": "2024-01-01T00:00:00.000Z",
  "completed_at": "2024-01-01T00:05:00.000Z",
  "processing_time": 300.5,
  "result": {
    "output_mesh_path": "/outputs/meshes/mesh_123456.glb",
    "thumbnail_path": "/outputs/thumbnails/mesh_123456_thumb.png",
    "mesh_url": "http://localhost:7842/api/v1/system/jobs/job_123456/download",
    "thumbnail_url": "http://localhost:7842/api/v1/system/jobs/job_123456/thumbnail",
    "mesh_file_info": {
      "filename": "mesh_123456.glb",
      "file_size_bytes": 2621440,
      "file_size_mb": 2.5,
      "content_type": "model/gltf-binary",
      "file_extension": ".glb"
    },
    "thumbnail_file_info": {
      "filename": "mesh_123456_thumb.png",
      "file_size_bytes": 51200,
      "file_size_mb": 0.05,
      "content_type": "image/png",
      "file_extension": ".png"
    },
    "generation_info": {
      "model_used": "trellis_text_to_raw_mesh",
      "parameters": {"text_prompt": "A red car"},
      "thumbnail_generated": true
    }
  }
}
```

### Download Job Thumbnail
- **URL**: `/api/v1/system/jobs/{job_id}/thumbnail`
- **Method**: `GET`
- **Description**: Download the thumbnail image of a completed job
- **Authentication**: None required
- **Path Parameters**:
  - `job_id`: Unique job identifier
- **Query Parameters**:
  - `format` (optional): `file` (default) or `base64`
  - `filename` (optional): Custom filename for download
- **Response**: Binary image file download or base64 encoded data

### Get Jobs History
- **URL**: `/api/v1/system/jobs/history`
- **Method**: `GET`
- **Description**: Get historical jobs with filtering and pagination support
- **Authentication**: None required
- **Query Parameters**:
  - `limit` (optional): Maximum number of jobs to return (1-500, default: 100)
  - `offset` (optional): Number of jobs to skip for pagination (default: 0)
  - `status` (optional): Filter by job status (`queued`, `processing`, `completed`, `failed`)
  - `feature` (optional): Filter by feature type (e.g., `text_to_textured_mesh`)
  - `start_date` (optional): Filter jobs after this date (ISO format: `2024-01-01T00:00:00Z`)
  - `end_date` (optional): Filter jobs before this date (ISO format: `2024-01-01T23:59:59Z`)
- **Response**:
```json
{
  "jobs": [
    {
      "job_id": "job_123456",
      "status": "completed",
      "feature": "text_to_textured_mesh",
      "created_at": "2024-01-01T00:00:00.000Z",
      "completed_at": "2024-01-01T00:05:00.000Z",
      "model_preference": "trellis_text_to_textured_mesh",
      "processing_time": 300.5,
      "output_mesh_path": "/outputs/mesh_123456.glb",
      "thumbnail_path": "/outputs/thumbnails/mesh_123456_thumb.png"
    }
  ],
  "pagination": {
    "limit": 100,
    "offset": 0,
    "total": 1250,
    "has_more": true
  },
  "filters": {
    "status": null,
    "feature": null,
    "start_date": null,
    "end_date": null
  },
  "timestamp": 1704067200.0
}
```

### Download Job Result
- **URL**: `/api/v1/system/jobs/{job_id}/download`
- **Method**: `GET`
- **Description**: Download the result file of a completed job
- **Authentication**: None required
- **Path Parameters**:
  - `job_id`: Unique job identifier
- **Query Parameters**:
  - `format` (optional): `file` (default) or `base64`
  - `filename` (optional): Custom filename for download
- **Response**: Binary file download or base64 encoded data

### Get Job Result Information
- **URL**: `/api/v1/system/jobs/{job_id}/info`
- **Method**: `GET`
- **Description**: Get detailed information about job result without downloading
- **Authentication**: None required
- **Path Parameters**:
  - `job_id`: Unique job identifier
- **Response**:
```json
{
  "job_id": "job_123456",
  "status": "completed",
  "file_info": {
    "file_exists": true,
    "file_size_mb": 2.5,
    "file_format": "glb",
    "content_type": "model/gltf-binary"
  },
  "generation_info": {
    "model_used": "trellis_text_to_raw_mesh",
    "processing_time": 300.5
  },
  "download_urls": {
    "direct_download": "/api/v1/system/jobs/job_123456/download",
    "base64_download": "/api/v1/system/jobs/job_123456/download?format=base64"
  }
}
```

### Delete Job Result
- **URL**: `/api/v1/system/jobs/{job_id}/result`
- **Method**: `DELETE`
- **Description**: Delete the result file of a completed job to free storage
- **Authentication**: Required
- **Path Parameters**:
  - `job_id`: Unique job identifier
- **Response**:
```json
{
  "job_id": "job_123456",
  "message": "Result file deleted successfully",
  "deleted": true,
  "freed_space_mb": 2.5,
  "deleted_file": "mesh_123456.glb"
}
```

### Scheduler Status
- **URL**: `/api/v1/system/scheduler-status`
- **Method**: `GET`
- **Description**: Get detailed scheduler and model status
- **Authentication**: None required
- **Response**:
```json
{
  "scheduler": {
    "running": true,
    "queue_status": {
      "queued_jobs": 2,
      "processing_jobs": 1,
      "completed_jobs": 15
    },
    "gpu_status": [
      {
        "id": 0,
        "memory_used": 8192,
        "memory_total": 24576
      }
    ],
    "models": {
      "trellis_text_to_raw_mesh": {"status": "loaded", "vram_usage": 4096}
    }
  },
  "adapters_registered": 4,
  "active_jobs": 1,
  "queued_jobs": 2,
  "completed_jobs": 15
}
```

### Get Supported Formats
- **URL**: `/api/v1/system/supported-formats`
- **Method**: `GET`
- **Description**: Get list of supported input and output formats
- **Authentication**: None required
- **Response**:
```json
{
  "input_formats": {
    "text": ["string"],
    "image": ["png", "jpg", "jpeg", "bmp", "tiff", "webp"],
    "mesh": ["obj", "glb", "gltf", "ply", "stl", "fbx"],
    "base64": ["image/png", "image/jpeg", "model/gltf-binary"]
  },
  "output_formats": {
    "mesh": ["obj", "glb", "ply", "fbx"],
    "texture": ["png", "jpg"],
    "download": ["file", "base64"]
  },
  "content_types": {
    "mesh": {
      "glb": "model/gltf-binary",
      "obj": "application/wavefront-obj",
      "fbx": "model/fbx"
    }
  }
}
```

## File Upload Endpoints

### Upload Image
- **URL**: `/api/v1/file-upload/image`
- **Method**: `POST`
- **Description**: Upload an image file and get a unique file ID
- **Authentication**: None required
- **Content-Type**: `multipart/form-data`
- **Request Body**:
  - `file`: Image file (PNG, JPG, JPEG, WebP, BMP, TIFF)
- **Response**:
```json
{
  "file_id": "abc123def456",
  "filename": "example.jpg",
  "file_type": "image",
  "file_size_mb": 2.5,
  "upload_time": "2024-01-01T12:00:00Z",
  "expires_at": "2024-01-02T12:00:00Z"
}
```

### Upload Mesh
- **URL**: `/api/v1/file-upload/mesh`
- **Method**: `POST`
- **Description**: Upload a mesh file and get a unique file ID
- **Authentication**: None required
- **Content-Type**: `multipart/form-data`
- **Request Body**:
  - `file`: Mesh file (GLB, OBJ, FBX, PLY, STL, GLTF)
- **Response**:
```json
{
  "file_id": "xyz789abc123",
  "filename": "model.glb",
  "file_type": "mesh",
  "file_size_mb": 15.2,
  "upload_time": "2024-01-01T12:00:00Z",
  "expires_at": "2024-01-02T12:00:00Z"
}
```

### Get File Metadata
- **URL**: `/api/v1/file-upload/metadata/{file_id}`
- **Method**: `GET`
- **Description**: Get metadata for an uploaded file
- **Authentication**: None required
- **Path Parameters**:
  - `file_id`: Unique file identifier
- **Response**:
```json
{
  "file_id": "abc123def456",
  "filename": "example.jpg",
  "file_type": "image",
  "file_size_mb": 2.5,
  "upload_time": "2024-01-01T12:00:00Z",
  "expires_at": "2024-01-02T12:00:00Z",
  "is_available": true
}
```




## Mesh Generation Endpoints

### Text to Raw Mesh
- **URL**: `/api/v1/mesh-generation/text-to-raw-mesh`
- **Method**: `POST`
- **Description**: Generate a 3D mesh from text description
- **Authentication**: None required
- **Request Body**:
```json
{
  "text_prompt": "A red sports car",
  "output_format": "glb",
  "model_preference": "trellis_text_to_raw_mesh"
}
```
- **Response**:
```json
{
  "job_id": "job_123456",
  "status": "queued",
  "message": "Text-to-mesh generation job queued successfully"
}
```

### Text to Textured Mesh
- **URL**: `/api/v1/mesh-generation/text-to-textured-mesh`
- **Method**: `POST`
- **Description**: Generate a textured 3D mesh from text description
- **Authentication**: None required
- **Request Body**:
```json
{
  "text_prompt": "A red sports car",
  "texture_prompt": "shiny metallic paint",
  "texture_resolution": 1024,
  "output_format": "glb",
  "model_preference": "trellis_text_to_textured_mesh"
}
```
- **Response**:
```json
{
  "job_id": "job_123456",
  "status": "queued",
  "message": "Text-to-textured-mesh generation job queued successfully"
}
```
- **Completed Job Result**: When job is complete, includes:
```json
{
  "output_mesh_path": "/outputs/meshes/mesh_123456.glb",
  "thumbnail_path": "/outputs/thumbnails/mesh_123456_thumb.png",
  "generation_info": {
    "model": "TRELLIS",
    "text_prompt": "A red sports car",
    "texture_prompt": "shiny metallic paint",
    "vertex_count": 15420,
    "face_count": 30840,
    "thumbnail_generated": true
  }
}
```

### Text Mesh Painting
- **URL**: `/api/v1/mesh-generation/text-mesh-painting`
- **Method**: `POST`
- **Description**: Apply texture to an existing mesh using text description
- **Authentication**: None required
- **Request Body**:
```json
{
  "text_prompt": "rusty metal texture",
  "mesh_path": "/path/to/mesh.glb",
  "mesh_base64": null,
  "mesh_file_id": null,
  "texture_resolution": 1024,
  "output_format": "glb",
  "model_preference": "trellis_text_to_textured_mesh"
}
```
- **File Input Options**: Provide **one** of the following:
  - `mesh_path`: Local file path (for server-side files)
  - `mesh_base64`: Base64 encoded mesh data
  - `mesh_file_id`: File ID from upload endpoint (**recommended**)
- **Response**:
```json
{
  "job_id": "job_123456",
  "status": "queued",
  "message": "Text-based mesh painting job queued successfully"
}
```

### Image to Raw Mesh
- **URL**: `/api/v1/mesh-generation/image-to-raw-mesh`
- **Method**: `POST`
- **Description**: Generate a 3D mesh from an image
- **Authentication**: None required
- **Request Body**:
```json
{
  "image_path": "/path/to/image.jpg",
  "image_base64": null,
  "image_file_id": null,
  "output_format": "glb",
  "model_preference": "trellis_image_to_raw_mesh"
}
```
- **File Input Options**: Provide **one** of the following:
  - `image_path`: Local file path (for server-side files)
  - `image_base64`: Base64 encoded image data
  - `image_file_id`: File ID from upload endpoint (**recommended**)
- **Response**:
```json
{
  "job_id": "job_123456",
  "status": "queued",
  "message": "Image-to-mesh generation job queued successfully"
}
```

### Image to Textured Mesh
- **URL**: `/api/v1/mesh-generation/image-to-textured-mesh`
- **Method**: `POST`
- **Description**: Generate a textured 3D mesh from an image
- **Authentication**: None required
- **Request Body**:
```json
{
  "image_path": "/path/to/image.jpg",
  "image_base64": null,
  "image_file_id": null,
  "texture_image_path": "/path/to/texture.jpg",
  "texture_image_base64": null,
  "texture_image_file_id": null,
  "texture_resolution": 1024,
  "output_format": "glb",
  "model_preference": "trellis_image_to_textured_mesh"
}
```
- **File Input Options**: For both image and texture image, provide **one** of:
  - `*_path`: Local file path (for server-side files)
  - `*_base64`: Base64 encoded image data
  - `*_file_id`: File ID from upload endpoint (**recommended**)
- **Response**:
```json
{
  "job_id": "job_123456",
  "status": "queued",
  "message": "Image-to-textured-mesh generation job queued successfully"
}
```

### Image Mesh Painting
- **URL**: `/api/v1/mesh-generation/image-mesh-painting`
- **Method**: `POST`
- **Description**: Apply texture to an existing mesh using an image
- **Authentication**: None required
- **Request Body**:
```json
{
  "image_path": "/path/to/texture.jpg",
  "image_base64": null,
  "image_file_id": null,
  "mesh_path": "/path/to/mesh.glb",
  "mesh_base64": null,
  "mesh_file_id": null,
  "texture_resolution": 1024,
  "output_format": "glb",
  "model_preference": "trellis_image_mesh_painting"
}
```
- **File Input Options**: For both image and mesh, provide **one** of:
  - `*_path`: Local file path (for server-side files)
  - `*_base64`: Base64 encoded data
  - `*_file_id`: File ID from upload endpoint (**recommended**)
- **Response**:
```json
{
  "job_id": "job_123456",
  "status": "queued",
  "message": "Image-based mesh painting job queued successfully"
}
```

### Part Completion
- **URL**: `/api/v1/mesh-generation/part-completion`
- **Method**: `POST`
- **Description**: Complete missing parts of a 3D mesh
- **Authentication**: None required
- **Request Body**:
```json
{
  "mesh_path": "/path/to/incomplete_mesh.glb",
  "mesh_base64": null,
  "mesh_file_id": null,
  "output_format": "glb",
  "model_preference": "holopart_part_completion"
}
```
- **File Input Options**: Provide **one** of the following:
  - `mesh_path`: Local file path (for server-side files)
  - `mesh_base64`: Base64 encoded mesh data
  - `mesh_file_id`: File ID from upload endpoint (**recommended**)
- **Response**:
```json
{
  "job_id": "job_123456",
  "status": "queued",
  "message": "Part completion job queued successfully"
}
```


### Get Mesh Generation Supported Formats
- **URL**: `/api/v1/mesh-generation/supported-formats`
- **Method**: `GET`
- **Description**: Get supported formats for mesh generation
- **Authentication**: None required
- **Response**:
```json
{
  "input_formats": {
    "text": ["string"],
    "image": ["png", "jpg", "jpeg", "webp", "bmp", "tiff"],
    "mesh": ["obj", "glb", "gltf", "ply", "stl", "fbx"],
    "base64": ["image/png", "image/jpeg", "model/gltf-binary"]
  },
  "output_formats": {
    "mesh": ["obj", "glb", "ply", "fbx"],
    "texture": ["png", "jpg"]
  },
  "upload_limits": {
    "image_max_size_mb": 50,
    "mesh_max_size_mb": 200,
    "image_max_resolution": [4096, 4096]
  }
}
```

## Mesh Segmentation Endpoints

### Segment Mesh
- **URL**: `/api/v1/mesh-segmentation/segment-mesh`
- **Method**: `POST`
- **Description**: Segment a 3D mesh into semantic parts
- **Authentication**: None required
- **Request Body**:
```json
{
  "mesh_path": "/path/to/mesh.glb",
  "mesh_base64": null,
  "mesh_file_id": null,
  "num_parts": 8,
  "output_format": "glb",
  "model_preference": "partfield_mesh_segmentation"
}
```
- **File Input Options**: Provide **one** of the following:
  - `mesh_path`: Local file path (for server-side files)
  - `mesh_base64`: Base64 encoded mesh data
  - `mesh_file_id`: File ID from upload endpoint (**recommended**)
- **Parameters**:
  - `num_parts`: Target number of parts (2-32)
  - `output_format`: Output format
  - `model_preference`: Model to use for segmentation
- **Response**:
```json
{
  "job_id": "job_123456",
  "status": "queued",
  "message": "Mesh segmentation job queued successfully"
}
```

### Get Mesh Segmentation Supported Formats
- **URL**: `/api/v1/mesh-segmentation/supported-formats`
- **Method**: `GET`
- **Description**: Get supported formats for mesh segmentation
- **Authentication**: None required
- **Response**:
```json
{
  "input_formats": ["glb"],
  "output_formats": ["glb", "json"]
}
```

---

## Auto Rigging Endpoints

### Generate Rig
- **URL**: `/api/v1/auto-rigging/generate-rig`
- **Method**: `POST`
- **Description**: Generate bone structure for a 3D mesh
- **Authentication**: None required
- **Request Body**:
```json
{
  "mesh_path": "/path/to/mesh.glb",
  "mesh_file_id": null,
  "rig_mode": "skeleton",
  "output_format": "fbx",
  "model_preference": "unirig_auto_rig"
}
```
- **File Input Options**: Provide **one** of the following:
  - `mesh_path`: Local file path (for server-side files)
  - `mesh_file_id`: File ID from upload endpoint (**recommended**)
- **Parameters**:
  - `rig_mode`: Rig mode (`skeleton`, `skin`, or `full`)
  - `output_format`: Output format
  - `model_preference`: Model to use for rigging
- **Response**:
```json
{
  "job_id": "job_123456",
  "status": "queued",
  "message": "Auto-rigging job queued successfully"
}
```

### Upload Mesh for Rigging
- **URL**: `/api/v1/auto-rigging/upload-mesh`
- **Method**: `POST`
- **Description**: Upload a mesh file for auto-rigging
- **Authentication**: None required
- **Request Body**: `multipart/form-data`
  - `file`: Mesh file (OBJ, GLB, FBX)
- **Response**:
```json
{
  "filename": "character.fbx",
  "file_path": "/uploads/meshes/character.fbx",
  "size": 2047842,
  "content_type": "model/fbx"
}
```

### Get Auto Rigging Supported Formats
- **URL**: `/api/v1/auto-rigging/supported-formats`
- **Method**: `GET`
- **Description**: Get supported formats for auto-rigging
- **Authentication**: None required
- **Response**:
```json
{
  "input_formats": ["obj", "glb", "fbx"],
  "output_formats": ["fbx", "glb"]
}
```

---

## Workflow Examples

### Example 1: Text to Textured Mesh Generation
```bash
# Generate textured mesh from text (no file upload needed)
curl -X POST "http://localhost:7842/api/v1/mesh-generation/text-to-textured-mesh" \
  -H "Content-Type: application/json" \
  -d '{
    "text_prompt": "A red sports car",
    "texture_prompt": "shiny metallic paint",
    "texture_resolution": 1024,
    "output_format": "glb",
    "model_preference": "trellis_text_to_textured_mesh"
  }'

# Response: {"job_id": "job_123456", "status": "queued", "message": "..."}

# Check job status (now includes visitable URLs!)
curl "http://localhost:7842/api/v1/system/jobs/job_123456"

# Response includes direct URLs:
# {
#   "result": {
#     "mesh_url": "http://localhost:7842/api/v1/system/jobs/job_123456/download",
#     "thumbnail_url": "http://localhost:7842/api/v1/system/jobs/job_123456/thumbnail"
#   }
# }

# Download mesh directly using the URL
curl "http://localhost:7842/api/v1/system/jobs/job_123456/download" \
  -o "generated_car.glb"

# View thumbnail directly in browser or download
curl "http://localhost:7842/api/v1/system/jobs/job_123456/thumbnail" \
  -o "car_preview.png"

# Or get thumbnail as base64 for embedding
curl "http://localhost:7842/api/v1/system/jobs/job_123456/thumbnail?format=base64"
```

### Example 2: Image to Textured Mesh Generation with File Upload
```bash
# 1. Upload image file
curl -X POST "http://localhost:7842/api/v1/file-upload/image" \
  -F "file=@/path/to/your/image.jpg"

# Response: {"file_id": "abc123def456", "filename": "image.jpg", ...}

# 2. Generate textured mesh using file ID
curl -X POST "http://localhost:7842/api/v1/mesh-generation/image-to-textured-mesh" \
  -H "Content-Type: application/json" \
  -d '{
    "image_file_id": "abc123def456",
    "texture_resolution": 1024,
    "output_format": "glb",
    "model_preference": "trellis_image_to_textured_mesh"
  }'

# Response: {"job_id": "job_789012", "status": "queued", "message": "..."}

# 3. Check job status
curl "http://localhost:7842/api/v1/system/jobs/job_789012"

# 4. Download result when completed
curl "http://localhost:7842/api/v1/system/jobs/job_789012/download" \
  -o "generated_mesh.glb"
```

### Example 3: Image Mesh Painting with File Upload
```bash
# 1. Upload image and mesh files
curl -X POST "http://localhost:7842/api/v1/file-upload/image" \
  -F "file=@/path/to/texture.jpg"
# Response: {"file_id": "img_123456", ...}

curl -X POST "http://localhost:7842/api/v1/file-upload/mesh" \
  -F "file=@/path/to/mesh.glb"
# Response: {"file_id": "mesh_789012", ...}

# 2. Apply texture to mesh
curl -X POST "http://localhost:7842/api/v1/mesh-generation/image-mesh-painting" \
  -H "Content-Type: application/json" \
  -d '{
    "image_file_id": "img_123456",
    "mesh_file_id": "mesh_789012",
    "texture_resolution": 1024,
    "output_format": "glb",
    "model_preference": "trellis_image_mesh_painting"
  }'

# 3. Download textured mesh when completed
curl "http://localhost:7842/api/v1/system/jobs/{job_id}/download" \
  -o "textured_mesh.glb"
```

### Example 4: Mesh Segmentation with File Upload
```bash
# 1. Upload mesh file
curl -X POST "http://localhost:7842/api/v1/file-upload/mesh" \
  -F "file=@/path/to/mesh.glb"

# Response: {"file_id": "mesh_abc123", ...}

# 2. Segment mesh
curl -X POST "http://localhost:7842/api/v1/mesh-segmentation/segment-mesh" \
  -H "Content-Type: application/json" \
  -d '{
    "mesh_file_id": "mesh_abc123",
    "num_parts": 8,
    "output_format": "glb",
    "model_preference": "partfield_mesh_segmentation"
  }'

# 3. Download segmented result
curl "http://localhost:7842/api/v1/system/jobs/{job_id}/download" \
  -o "segmented.glb"
```

### Example 5: Auto Rigging with File Upload
```bash
# 1. Upload mesh file
curl -X POST "http://localhost:7842/api/v1/file-upload/mesh" \
  -F "file=@/path/to/character.glb"

# Response: {"file_id": "char_xyz789", ...}

# 2. Generate rig
curl -X POST "http://localhost:7842/api/v1/auto-rigging/generate-rig" \
  -H "Content-Type: application/json" \
  -d '{
    "mesh_file_id": "char_xyz789",
    "rig_mode": "skeleton",
    "output_format": "fbx",
    "model_preference": "unirig_auto_rig"
  }'

# 3. Download rigged mesh
curl "http://localhost:7842/api/v1/system/jobs/{job_id}/download" \
  -o "rigged_character.fbx"
```

### Example 6: Using Python with Requests
```python
import requests

# Upload files
def upload_file(file_path, file_type):
    with open(file_path, 'rb') as f:
        files = {'file': f}
        response = requests.post(
            f'http://localhost:7842/api/v1/file-upload/{file_type}',
            files=files
        )
    return response.json()['file_id']

# Upload image and mesh
image_id = upload_file('/path/to/image.jpg', 'image')
mesh_id = upload_file('/path/to/mesh.glb', 'mesh')

# Apply texture to mesh
response = requests.post(
    'http://localhost:7842/api/v1/mesh-generation/image-mesh-painting',
    json={
        'image_file_id': image_id,
        'mesh_file_id': mesh_id,
        'texture_resolution': 1024,
        'output_format': 'glb',
        'model_preference': 'trellis_image_mesh_painting'
    }
)

job_id = response.json()['job_id']
print(f"Job submitted: {job_id}")

# Check job status and get URLs
job_status = requests.get(f'http://localhost:7842/api/v1/system/jobs/{job_id}').json()

if job_status['status'] == 'completed':
    result = job_status['result']
    
    # Get direct URLs for files
    mesh_url = result['mesh_url']
    thumbnail_url = result['thumbnail_url']
    
    print(f"Mesh URL: {mesh_url}")
    print(f"Thumbnail URL: {thumbnail_url}")
    
    # Download files using URLs
    mesh_response = requests.get(mesh_url)
    with open('result.glb', 'wb') as f:
        f.write(mesh_response.content)
    
    thumbnail_response = requests.get(thumbnail_url)
    with open('preview.png', 'wb') as f:
        f.write(thumbnail_response.content)
    
    # Or get thumbnail as base64 for embedding in HTML
    thumbnail_base64 = requests.get(f"{thumbnail_url}?format=base64").json()
    print(f"Thumbnail base64: {thumbnail_base64['base64_data'][:50]}...")
```

### Example 7: Query Historical Jobs
```bash
# Get recent jobs with pagination
curl "http://localhost:7842/api/v1/system/jobs/history?limit=50&offset=0"

# Filter by status
curl "http://localhost:7842/api/v1/system/jobs/history?status=completed&limit=100"

# Filter by feature type
curl "http://localhost:7842/api/v1/system/jobs/history?feature=text_to_textured_mesh"

# Filter by date range
curl "http://localhost:7842/api/v1/system/jobs/history?start_date=2024-01-01T00:00:00Z&end_date=2024-01-31T23:59:59Z"

# Response includes pagination and job details with thumbnails:
{
  "jobs": [
    {
      "job_id": "job_123456",
      "status": "completed",
      "feature": "text_to_textured_mesh",
      "output_mesh_path": "/outputs/meshes/mesh_123456.glb",
      "thumbnail_path": "/outputs/thumbnails/mesh_123456_thumb.png"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 1250,
    "has_more": true
  }
}
```

---

### Get Upload Supported Formats
- **URL**: `/api/v1/file-upload/supported-formats`
- **Method**: `GET`
- **Description**: Get supported file formats and upload limits
- **Authentication**: None required
- **Response**:
```json
{
  "image": {
    "formats": [".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tiff"],
    "max_size_mb": 50,
    "description": "Supported image formats for upload"
  },
  "mesh": {
    "formats": [".glb", ".obj", ".fbx", ".ply", ".stl", ".gltf"],
    "max_size_mb": 200,
    "description": "Supported mesh formats for upload"
  },
  "retention": {
    "default_hours": 24,
    "description": "Files are automatically deleted after 24 hours"
  }
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| `INVALID_VALUE` | Invalid input parameter value |
| `NOT_FOUND` | Resource not found |
| `API_ERROR` | General API error |
| `INTERNAL_ERROR` | Internal server error |
| `FILE_UPLOAD_ERROR` | File upload failed |
| `MODEL_NOT_AVAILABLE` | Requested model not available |
| `INSUFFICIENT_VRAM` | Not enough VRAM for operation |
| `JOB_FAILED` | Job processing failed |

---

## Model Preferences

### Available Models by Feature

| Feature | Model ID | Description |
|---------|----------|-------------|
| Text to Raw Mesh | `trellis_text_to_raw_mesh` | TRELLIS model for text-to-mesh |
| Text to Textured Mesh | `trellis_text_to_textured_mesh` | TRELLIS model for textured mesh |
| Image to Raw Mesh | `trellis_image_to_raw_mesh` | TRELLIS model for image-to-mesh |
| Image to Textured Mesh | `trellis_image_to_textured_mesh` | TRELLIS model for textured mesh |
| Image Mesh Painting | `trellis_image_mesh_painting` | TRELLIS model for mesh painting |
| Part Completion | `holopart_part_completion` | HoloPart model for part completion |
| Mesh Segmentation | `partfield_mesh_segmentation` | PartField model for segmentation |
| Auto Rigging | `unirig_auto_rig` | UniRig model for auto-rigging |

---

## File Format Support

### Input Formats
- **Text**: Plain text strings
- **Images**: PNG, JPG, JPEG, WebP, BMP, TIFF
- **Meshes**: OBJ, GLB, GLTF, PLY, STL, FBX
- **Base64**: Encoded images and meshes

### Output Formats
- **Meshes**: OBJ, GLB, PLY, FBX
- **Textures**: PNG, JPG
- **Downloads**: Direct file or Base64 encoded

### File Size Limits
- **Images**: 50MB maximum
- **Meshes**: 200MB maximum
- **Image Resolution**: Up to 4096x4096 pixels

---

## Support and Troubleshooting

### Common Issues

1. **Job Stuck in Queue**: Check system status and GPU availability
2. **Model Not Available**: Verify model preference and feature compatibility
3. **File Upload Failed**: Check file size and format requirements
4. **Generation Failed**: Check input parameters and system resources

### Getting Help

- Check the interactive API documentation at `/docs`
- Monitor system status at `/api/v1/system/status`
- Review job logs and error messages in responses
- Ensure adequate VRAM is available for model operations


*Last updated: [2025.07.12]*
*API Version: 1.0.0* 