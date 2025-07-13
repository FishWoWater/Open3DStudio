Good! Now I have updated the backend API endpoints @api.md 
1. add endpoints for uploading images / uploading meshes, and all generative endpoints switch to using files uploaded. You should first upload the image/mesh to the backend and use the identifier in later requests.
2. remove `available-adapters` endpoint from the system router
Also I have provided more examples at the end of the API dcoument, you should check that to finish any incomplete request way in current codebase. 
Finally, please also display the images when the user drags ot uploads an image to the image component. 
Make good plans before you begin, give it your best.

### Follow-Up 1
Some more requirements: 
(1) display the number of features/models available in the right-bottom bottom bar (along with the `connected` status), besides, seems that no matter we are connected to the server, it always shows "connected" in the bottom. 
(2) the style of all the dropdown list is ugly, please use more modernized and better styles
(3) seems that none of the notifications can be seen in the viewport (they never poped up)
(4) I have justed tried to send a text-to-raw mesh request, but it shows error (bad request). Maybe the parameter is invalid. Please fix it according to the doc 
Make good plans before you begin, give it your best.

### Follow-Up 2
(1) and (3) are fixed. For (2), you still haven't updated the drop down styles in other panels (e.g. Mesh painting, mesh segmentation, auto rig etc.). Also in the mesh generation panel, the local style of texture resolution dropdown is broken by the style change. Please fix.
Besides, currently error code and message are NOT provided by the API backend, please update the response error body and display the detail in notification.
Finally, please verify whether the feature in each panel is available by querying the backend. If it's unavailable, disable the button like `Generate` with hint. For example, currently text-to-raw-mesh is NOT implemented in the backend. And if the feature is available, dynamically show the dropdown for the user to select a model from. (model list should be query from the backend)
Make good plans before you begin. Give it your best and be careful.

### Follow-Up 3
Good! Now previous problems are almost fixed. New requirements:
(1) the status of each submitted task is NOT polled and updated in real-time 
(2) you should display more information about each task (e.g. create time / prompt / status etc.) If the task involves image upload, also display a thumbnail preview of the image in the task . When the task is completed, the server will also provided a rendered preview image path besides `output_mesh_path`, you should display that along in the task entry.
Make good plans before you begin, ensure you design good styles on the task.


### Follow-Up 4 
I think here we actually don't need a `View 3D` button that opens a standalone 3D viewport to view the 3D model, instead you should provide a `import to scene` button that imports the 3d model to the current 3D viewport. Give it your all and don't hold back.

### Follow-Up 5 
Two more requirements:
1. Order tasks by creation time (latest ones come first/top)
2. when I clicked the `download `button on a task entry, it simply opens a new window of current minimal 3d studio, which is INCORRECT,  seems that you forgot to add the API endpoint address to the prefix, for example, current url is just "/api/v1/system/jobs/62a0633d-d393-43a4-9916-5bfbe7ff9854/download"
DON'T hold back and give it your best.
