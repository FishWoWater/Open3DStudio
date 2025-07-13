You are an expert at web UI design now I need you to help me to design the UI proptotype.
I am developing a cross-platform software(Windows/MacOS/Web) aimed for 3DAIGC tasks based on react

The layout should consist of 5 parts
1. Main 3D viewport, which should occupy most of the area of the application canvas
2. Top Bar: shows the currently available modules of the application, including Mesh Generation, Mesh Painting, Mesh Segmentation, Part Completion, and Auto Rigging. 
3. Left Side Bar: when the user selects a module, it shows the features required by using this module (e.g. uploading images, entering prompts, uploading meshes etc.)
4. Right Side Bar: shows the collection of historical tasks and their preview renderings. Tasks can have different status (e.g. processing/queuing/completed). When the user clicks on a asset task that is finished, the model can be loaded into the viewport. 
5. Bottom Bar Buttons: contains buttons to select/move/delete objects in the scene viewport, and buttons to switch the rendering modes (e.g. wireframe, solid, rendered)
6. Right-Top Settings: basic configuration settings of current application (e.g. application scene / API Key, if required)
You should checkout the required input parameters and design of the api documentation @api.md   for  specific UI/UX panels for that feature.
Then Finish the following requirements, plan and think carefully before you begin: 
1. provide static pages in html to demonstrate the design and I will review them. 
2. Each page contains the UI for each feature that the backend supported (e.g. mesh generation).
3. Put your code and design under @ui_prototype 