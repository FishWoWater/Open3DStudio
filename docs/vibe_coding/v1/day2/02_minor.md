I am developing a 3DAIGC application in the current codebase and now have a number of requirements need you to accomplish / bugs need you to fix.
(1) in the mesh generation panel, if PartPacker is in the available models, somewhere add hint to tell the user that PartPacker is available 
(2) in the panels, when the input requirement is NOT satisfied (e.g. thet prompt is empty in the text-to-3d feature), you should also pop up a window info besides simply displaying err text
(3) everywhere after you fetch the available models, you should strip the feature name from the suffix of the model name before displaying them on the UI, e.g. 'trellis_text_to_raw_mesh' should display as 'trellis'
(4) on the right side (right besides) of the top bar, add a button to go to the github page of our project
(5) [optional] currently the uploaded images won't be seen 
Make good plans before you begin. DON'T hold back and give it you all.
Others Misc: Remove FPS/CPU/Memory
current backend system has a limitation: since we can have exactly ONLY one scheduler (multiple scheduler will conflicts with each other), which limits that we can ONLY have ONE worker, thus we may NOT concurrently process multiple requests efficiently (think one worker is handling downloading request, but the downloading is slow, other simple health or job info query request will be blocked since there is ONLY a single worker), think about whether we have good practice or idea to bypass this (e.g. use multiple workers but exactly 1 scheduler). 