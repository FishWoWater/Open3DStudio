In the current codebase I am developing a 3DAIGC application. Current 3D viewports have 4 different rendering modes (solid/wireframe/rendered/material), I need you to add two more advanced rendering modes:
(1) Show Parts:  Colorize each mesh group of the loaded 3D shape (e.g. from glb) to a different color (should ONLY work when the 3D shape has more than 1 mesh groups.
(2) Show Skeleton: if the incoming asset has skeleton and this option is enabled, overlay the skeleton in the 3d viewport, to achieve this, you may need to set the mesh group to transparent and draw primitives on bone nodes and also show their connectivities.
Make good plans before you begin, and don't hold back, give it your all.


### FollowUp-1
Two problems:
(1) I can not see the button to turn on the Part-Level render mode, even if I clicked to load the Parts Model into the viewport, 
(2) If I turned on the skeleton mode  and then turned off, the skeleton nodes (edges and nodes) won't disappear, perhaps you forgot to remove them
Make good plans and ensure that you can fix these two problems.
After fixing them, add a small wrapper to wraps the 3 test buttons into a very small test button. Besides, in the topbar settings, users should be able to configure the API backend address there.

### FollowUp-2
Some of the things are broken. You should NOT remove the original viewport placeholder, no need to show current hint "Use Test Models to add some". Besides, after the changes, when I clicked `Simple cube` or `Parts Model`, nothing happened, and even some errors: "Right hand side of instanceof is not an object
@http://localhost:3000/static/js/bundle.js:120973:98
traverse@http://localhost:3000/static/js/bundle.js:77499:13"
Fix broken things.

### FollowUp-3
Seems that the Parts render mode is still not enabled/activated successfully. You should get focues to solve exactly the problem.

### FollowUp-4
Good! The theme switcher looks good, except that the background of the top bar NOT affected.