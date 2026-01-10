In the current codebase I am developing a cross-platform 3DAIGC application. You can check @README.md to get an overview of current project and its architecture. 
Now I need you to add 2 important features. 

### Fetch and Expose Model-Specific Parameters 
Currently each module(panel, e.g. ) only supports some common(general) parameters. Now the backend has exposes the model-specific at endpoint `/api/v1/system/models/{model_id}/parameters`. Example query and results are provided at @. You can query them using @TODO. Now I need you to fetch the model-specific parameters when the selected model preference changes, and display the model-specific parameters as advanced parameters. 

### Add the feature(module) of Mesh Editing 
For a finished task in the right bar, as long as it has a valid mesh output, you should support mesh editing for it. 

UI & UX
You can add a button in the task entry card to do the mesh editing. Since there are already a number of buttons, may be you can re-organize all the buttons (e.g. put some into a second-level list, using an `extra` button)

When the user clicks the `mesh editing` button, you should pop up a window, which is the essential UI for mesh editing. At the center of the window is a 3D viewport showing the mesh from the task. Essentially you should display a bounding box in the viewport, which is initialized from the bounding box of the 3D mesh. The user can drag each face(6 faces) along correponding axis, to adjust the bounding box(length/width/height), which is used by the user to indicate the region they want to edit in the mesh.
Besides, the window should have a right side bar where you fetch available models for the user to select. And the user can upload an image or enter a text prompt to do the mesh editing. 

Backend API 
The backend API document for mesh editing is provided at @. Generally you should upload the mesh, along with the bounding box parameters to the backend endpoint. 

You are an expert, make good plans before you begin. Don't create too many complicated README/markdown/txt doc files. If necessary, organize them under @cursor_created.