You are an expert frontend engineer, expert at React and Typescript. I am developing a 3DAIGC application in the current codebase.
Now I need you to strengthen the feature for mesh uploading in the current application. 
Specifically, @src/components/features/AutoRiggingPanel.tsx @src/components/features/MeshPaintingPanel.tsx @src/components/features/MeshRetopologyPanel.tsx @src/components/features/MeshUVUnwrappingPanel.tsx @src/components/features/MeshSegmentationPanel.tsx all have buttons and form sections like @src/components/features/AutoRiggingPanel.tsx:196-202 @src/components/features/AutoRiggingPanel.tsx:175-194 to support the user drags and uploading a mesh file. I hope you can 
(1) when the user uploads a valid mesh file, in the inptu section / box, should a preview minimal scene showing the uploaded mesh 
(2) also support uploading a mesh from the task list of the right side bar @src/components/layout/RightSidebar.tsx . To achieve this, you may need to a button for adding the resultant model  @src/components/tasks/TaskList.tsx:178-189  from a previous task to the input section of a new task (basically it's a url link from previous task results)
You are an expert, thus make good plans before you begin, and you should have good code design so that some part of the code can be reused. Don't create extra readme files or test scripts.

### Follow Up1
Seems that your implementation of the UploadWithPreview component has bugs. By default the `selectMesh` is disabled and I can't drag or upload any file. Also the preview window shows nothing.

### Follow up2
Good job! All previous problems solved. Now I need you to also integrate the preview feature in the task list in the right side bar. When a task is finished, you should automatically fetch the model and shows a minimal preview in the task card entry.
Besides, I have found that the model importing feature (import into the scene) has some bug, always shows "Import Failed(JSON Parse error: Unrecognized token '#'http://localhost:7842/api/v1/system/jobs/fe70006f-0f4d-4f8a-9fe1-b0eae640702e/download")' . Please fix
@src/components/tasks/TaskList.tsx:137-164