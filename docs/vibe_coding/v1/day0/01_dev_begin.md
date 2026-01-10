You are an expert in react, electron and 3D web application development, also you are an expert in system design.

I am developing a cross-platform software(Windows/MacOS/Web) aimed for 3D AIGC based on react. 

The UI prototype is now provided in @ui_prototype, and now I need you to implement the UI and all other front end components for this application.

The overall workflow is that the user:
1. Selects a module of interest (e.g. if the user wants to do image to mesh generation)
2. Uploading inputs required by this module (e.g. uploading images, entering prompts, adjust required parameters)
3. Organize current inputs and send request to the API backend, and keep polling the status of the task until it's finished or failed
4. The user may import the result (generally a model url) of the finished task 
5. After importing the model, the user may switch different rendering modes of the model 

You should checkout API doc @api.md for the required input parameters and implement specific task/input/output structures for every class of the backend feature.

You should make good plans and think carefully before you begin the task. The system design should be scalable and easy to read.

### FollowUp-1
When I run `npm start`, there are many bugs. You can use the command line tool or playwright mcp to debug them. Fix all of them.


### FollowUp-2
Good! Above problems have been fixed. Seems that still there are many to-dos unfinished. For example, all of the panels (e.g. mesh generation) is NOT finished yet. 