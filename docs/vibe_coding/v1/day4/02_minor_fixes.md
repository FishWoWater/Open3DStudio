### Minor1 Fix on Deleting Tasks
In the current codebase, I am developing a cross-platform 3DAIGC application. Now I need you to work on the task management. 
In the right side bar, there is a button for clearing all the completed tasks, please replace it with clearing all FAILED tasks. Besides, add another button for removing all the tasks, no matter the status is completed/failed/processing etc.
The behaviors of both buttons are expected to not only clear the task on the client side, but also deleting the job from the cloud database. Here is a curl-based API caling example:
```
curl -X DELETE "http://localhost:7842/api/v1/system/jobs/your-job-id-here" \
  -H "Content-Type: application/json"
```
Don't create extra markdown files.


### Minor2 Fix on Theme Selection
@src/components/ui/SettingsPanel.tsx:315-325 Please improve the style of this theme selection

### Minor3 Fix on Adding `poly_type` parameter
@src/components/features/MeshRetopologyPanel.tsx @src/types/api.ts:282-288  
Here is the structure of the backend request data structure for mesh re-topology, please add the `poly_type` parameter in the front-end accordingly:
```
class MeshRetopologyRequest(BaseModel):
    """Request for mesh retopology"""

    mesh_path: Optional[str] = Field(None, description="Path to the input mesh file")
    mesh_file_id: Optional[str] = Field(
        None, description="File ID from upload endpoint"
    )
    target_vertex_count: Optional[int] = Field(
        None, description="Target number of vertices", ge=100, le=20000
    )
    poly_type: Optional[str] = Field(
        "tri", description="Specification of the polygon type"
    )
    output_format: str = Field("obj", description="Output format for retopologized mesh")
    seed: Optional[int] = Field(None, description="Random seed for reproducibility")
    model_preference: str = Field(
        "fastmesh_v1k_retopology",
        description="Name of the retopology model to use (fastmesh_v1k_retopology or fastmesh_v4k_retopology)",
    )

    @field_validator("output_format")
    @classmethod
    def validate_output_format(cls, v):
        allowed_formats = ["obj", "glb", "ply"]
        if v not in allowed_formats:
            raise ValueError(f"Output format must be one of: {allowed_formats}")
        return v

    @field_validator("poly_type")
    @classmethod
    def validate_poly_type(cls, v):
        allowed_poly_types = ["tri", "quad"]
        if v not in allowed_poly_types:
            raise ValueError(f"Polygon type must be one of: {allowed_poly_types}")
        return v

    @field_validator("mesh_file_id")
    @classmethod
    def validate_inputs(cls, v, info):
        mesh_path = info.data.get("mesh_path")

        inputs_provided = sum(bool(x) for x in [mesh_path, v])

        if inputs_provided == 0:
            raise ValueError("One of mesh_path or mesh_file_id must be provided")
        if inputs_provided > 1:
            raise ValueError("Only one of mesh_path or mesh_file_id should be provided")
        return v

    model_config = ConfigDict(protected_namespaces=("settings_",))

```