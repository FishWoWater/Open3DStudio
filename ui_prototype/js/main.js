// Main UI Controller
class StudioUI {
    constructor() {
        this.currentModule = 'mesh-generation';
        this.currentFeature = 'text-to-mesh';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeModules();
        this.loadFeatureContent();
    }

    setupEventListeners() {
        // Settings panel toggle
        const settingsToggle = document.getElementById('settings-toggle');
        const settingsContent = document.getElementById('settings-content');
        
        settingsToggle.addEventListener('click', () => {
            settingsContent.classList.toggle('active');
        });

        // Close settings when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.settings-panel')) {
                settingsContent.classList.remove('active');
            }
        });

        // Module navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                this.switchModule(item.dataset.module);
            });
        });

        // Feature tabs
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('tab-btn')) {
                this.switchFeature(e.target.dataset.feature);
            }
        });

        // Scene controls
        document.querySelectorAll('.control-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.control-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        // Render modes
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        // Upload zones
        this.setupUploadZones();

        // Form interactions
        this.setupFormInteractions();
    }

    setupUploadZones() {
        document.querySelectorAll('.upload-zone').forEach(zone => {
            zone.addEventListener('click', () => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = zone.id === 'image-upload' ? 'image/*' : '.obj,.glb,.ply,.fbx';
                input.onchange = (e) => this.handleFileUpload(e, zone);
                input.click();
            });

            zone.addEventListener('dragover', (e) => {
                e.preventDefault();
                zone.classList.add('dragover');
            });

            zone.addEventListener('dragleave', () => {
                zone.classList.remove('dragover');
            });

            zone.addEventListener('drop', (e) => {
                e.preventDefault();
                zone.classList.remove('dragover');
                this.handleFileUpload(e, zone);
            });
        });
    }

    setupFormInteractions() {
        // Textured mesh toggle switch
        document.addEventListener('change', (e) => {
            if (e.target.id === 'textured-mesh' || e.target.id === 'image-textured-mesh') {
                const textureOptions = document.querySelectorAll('.texture-options');
                textureOptions.forEach(option => {
                    option.style.display = e.target.checked ? 'block' : 'none';
                });
            }
        });

        // Generate buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('generate-btn')) {
                this.handleGeneration(e.target);
            }
        });
    }

    switchModule(moduleId) {
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-module="${moduleId}"]`).classList.add('active');

        // Update sidebar title
        const titles = {
            'mesh-generation': 'Mesh Generation',
            'mesh-painting': 'Mesh Painting',
            'mesh-segmentation': 'Mesh Segmentation',
            'part-completion': 'Part Completion',
            'auto-rigging': 'Auto Rigging'
        };
        document.getElementById('sidebar-title').textContent = titles[moduleId];

        // Update feature panels
        document.querySelectorAll('.feature-panel').forEach(panel => {
            panel.classList.remove('active');
        });

        this.currentModule = moduleId;
        this.loadFeatureContent();
    }

    switchFeature(featureId) {
        // Update feature tabs
        document.querySelectorAll('.tab-btn').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-feature="${featureId}"]`).classList.add('active');

        // Update feature content
        document.querySelectorAll('.feature-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(featureId).classList.add('active');

        this.currentFeature = featureId;
    }

    loadFeatureContent() {
        // Show appropriate feature panel
        const panelId = this.currentModule === 'mesh-generation' ? 'mesh-generation-panel' : 
                       this.currentModule === 'mesh-painting' ? 'mesh-painting-panel' :
                       this.currentModule === 'mesh-segmentation' ? 'mesh-segmentation-panel' :
                       this.currentModule === 'part-completion' ? 'part-completion-panel' :
                       'auto-rigging-panel';

        const panel = document.getElementById(panelId);
        if (panel) {
            panel.classList.add('active');
        } else {
            // Create panel dynamically if not exists
            this.createFeaturePanel(this.currentModule);
        }
    }

    createFeaturePanel(moduleId) {
        const sidebarContent = document.querySelector('.sidebar-content');
        
        // Remove existing panels
        document.querySelectorAll('.feature-panel').forEach(panel => {
            if (panel.id !== 'mesh-generation-panel') {
                panel.remove();
            }
        });

        let panelHTML = '';

        switch (moduleId) {
            case 'mesh-painting':
                panelHTML = this.createMeshPaintingPanel();
                break;
            case 'mesh-segmentation':
                panelHTML = this.createMeshSegmentationPanel();
                break;
            case 'part-completion':
                panelHTML = this.createPartCompletionPanel();
                break;
            case 'auto-rigging':
                panelHTML = this.createAutoRiggingPanel();
                break;
        }

        if (panelHTML) {
            sidebarContent.insertAdjacentHTML('beforeend', panelHTML);
        }
    }

    createMeshPaintingPanel() {
        return `
            <div id="mesh-painting-panel" class="feature-panel active">
                <div class="feature-tabs">
                    <button class="tab-btn active" data-feature="text-painting">Text Painting</button>
                    <button class="tab-btn" data-feature="image-painting">Image Painting</button>
                </div>

                <div id="text-painting" class="feature-content active">
                    <div class="upload-area">
                        <div class="upload-zone" id="mesh-upload">
                            <i class="fas fa-cube"></i>
                            <p>Drop 3D mesh here or click to upload</p>
                            <small>Supports: GLB, OBJ, PLY, FBX (Max 200MB)</small>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Painting Prompt</label>
                        <textarea placeholder="Describe the texture or material you want to apply..." rows="3"></textarea>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>Texture Resolution</label>
                            <select>
                                <option value="512">512x512</option>
                                <option value="1024" selected>1024x1024</option>
                                <option value="2048">2048x2048</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label>Output Format</label>
                            <select>
                                <option value="glb">GLB</option>
                                <option value="obj">OBJ</option>
                                <option value="fbx">FBX</option>
                            </select>
                        </div>
                    </div>

                    <button class="generate-btn">
                        <i class="fas fa-paint-brush"></i>
                        Apply Texture
                    </button>
                </div>

                <div id="image-painting" class="feature-content">
                    <div class="upload-area">
                        <div class="upload-zone" id="mesh-upload-2">
                            <i class="fas fa-cube"></i>
                            <p>Drop 3D mesh here or click to upload</p>
                            <small>Supports: GLB, OBJ, PLY, FBX (Max 200MB)</small>
                        </div>
                    </div>

                    <div class="upload-area">
                        <div class="upload-zone" id="texture-image-upload">
                            <i class="fas fa-image"></i>
                            <p>Drop texture image here or click to upload</p>
                            <small>Supports: PNG, JPG, JPEG, WebP (Max 50MB)</small>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>Texture Resolution</label>
                            <select>
                                <option value="512">512x512</option>
                                <option value="1024" selected>1024x1024</option>
                                <option value="2048">2048x2048</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label>Output Format</label>
                            <select>
                                <option value="glb">GLB</option>
                                <option value="obj">OBJ</option>
                                <option value="fbx">FBX</option>
                            </select>
                        </div>
                    </div>

                    <button class="generate-btn">
                        <i class="fas fa-paint-brush"></i>
                        Apply Image Texture
                    </button>
                </div>
            </div>
        `;
    }

    createMeshSegmentationPanel() {
        return `
            <div id="mesh-segmentation-panel" class="feature-panel active">
                <div class="upload-area">
                    <div class="upload-zone" id="segmentation-mesh-upload">
                        <i class="fas fa-cube"></i>
                        <p>Drop 3D mesh here or click to upload</p>
                        <small>Supports: GLB format only (Max 200MB)</small>
                    </div>
                </div>

                <div class="form-group">
                    <label>Number of Parts</label>
                    <input type="range" min="2" max="32" value="8" id="num-parts-slider">
                    <div class="range-value">8 parts</div>
                </div>

                <div class="form-group">
                    <label>Output Format</label>
                    <select>
                        <option value="glb">GLB</option>
                        <option value="json">JSON (Part Info)</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>Segmentation Method</label>
                    <select>
                        <option value="semantic">Semantic Segmentation</option>
                        <option value="geometric">Geometric Segmentation</option>
                    </select>
                </div>

                <button class="generate-btn">
                    <i class="fas fa-cut"></i>
                    Segment Mesh
                </button>
            </div>
        `;
    }

    createPartCompletionPanel() {
        return `
            <div id="part-completion-panel" class="feature-panel active">
                <div class="upload-area">
                    <div class="upload-zone" id="incomplete-mesh-upload">
                        <i class="fas fa-cube"></i>
                        <p>Drop incomplete 3D mesh here</p>
                        <small>Supports: GLB, OBJ, PLY (Max 200MB)</small>
                    </div>
                </div>

                <div class="form-group">
                    <label>Completion Mode</label>
                    <select>
                        <option value="auto">Automatic Detection</option>
                        <option value="manual">Manual Selection</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>Output Format</label>
                    <select>
                        <option value="glb">GLB</option>
                        <option value="obj">OBJ</option>
                        <option value="ply">PLY</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>Completion Quality</label>
                    <select>
                        <option value="fast">Fast</option>
                        <option value="balanced" selected>Balanced</option>
                        <option value="high">High Quality</option>
                    </select>
                </div>

                <button class="generate-btn">
                    <i class="fas fa-puzzle-piece"></i>
                    Complete Parts
                </button>
            </div>
        `;
    }

    createAutoRiggingPanel() {
        return `
            <div id="auto-rigging-panel" class="feature-panel active">
                <div class="upload-area">
                    <div class="upload-zone" id="rigging-mesh-upload">
                        <i class="fas fa-cube"></i>
                        <p>Drop character mesh here</p>
                        <small>Supports: OBJ, GLB, FBX (Max 200MB)</small>
                    </div>
                </div>

                <div class="form-group">
                    <label>Rig Mode</label>
                    <select>
                        <option value="skeleton">Skeleton Only</option>
                        <option value="skin">Skinning Only</option>
                        <option value="full" selected>Full Rig (Skeleton + Skinning)</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>Character Type</label>
                    <select>
                        <option value="humanoid" selected>Humanoid</option>
                        <option value="quadruped">Quadruped</option>
                        <option value="generic">Generic</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>Output Format</label>
                    <select>
                        <option value="fbx" selected>FBX</option>
                        <option value="glb">GLB</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>Advanced Options</label>
                    <div class="checkbox-group">
                        <label><input type="checkbox" checked> Auto-detect joints</label>
                        <label><input type="checkbox"> Include IK chains</label>
                        <label><input type="checkbox"> Generate control curves</label>
                    </div>
                </div>

                <button class="generate-btn">
                    <i class="fas fa-sitemap"></i>
                    Generate Rig
                </button>
            </div>
        `;
    }

    handleFileUpload(event, zone) {
        const files = event.dataTransfer ? event.dataTransfer.files : event.target.files;
        if (files.length > 0) {
            const file = files[0];
            zone.innerHTML = `
                <i class="fas fa-check-circle" style="color: #059669;"></i>
                <p style="color: #059669;">File uploaded: ${file.name}</p>
                <small>Size: ${(file.size / 1024 / 1024).toFixed(2)} MB</small>
            `;
        }
    }

    handleGeneration(button) {
        // Simulate generation process
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        
        // Add task to history
        this.addTaskToHistory();

        // Reset button after delay
        setTimeout(() => {
            button.disabled = false;
            button.innerHTML = button.innerHTML.replace('Processing...', 'Generate');
            button.querySelector('i').className = 'fas fa-magic';
        }, 3000);
    }

    addTaskToHistory() {
        const taskList = document.querySelector('.task-list');
        const taskItem = document.createElement('div');
        taskItem.className = 'task-item processing';
        
        const taskName = this.generateTaskName();
        const timestamp = new Date().toLocaleString();
        
        taskItem.innerHTML = `
            <div class="task-preview">
                <div class="loading-spinner"></div>
                <div class="task-status">
                    <i class="fas fa-cog fa-spin"></i>
                </div>
            </div>
            <div class="task-info">
                <h4>${taskName}</h4>
                <p>${this.currentModule.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                <span class="task-time">Processing...</span>
            </div>
            <div class="task-actions">
                <button class="action-btn" title="Cancel">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        taskList.insertBefore(taskItem, taskList.firstChild);
        
        // Simulate completion
        setTimeout(() => {
            taskItem.className = 'task-item completed';
            taskItem.querySelector('.task-preview').innerHTML = `
                <img src="https://via.placeholder.com/80x80/2a2a2a/666?text=3D" alt="Preview">
                <div class="task-status">
                    <i class="fas fa-check"></i>
                </div>
            `;
            taskItem.querySelector('.task-time').textContent = 'Just now';
            taskItem.querySelector('.task-actions').innerHTML = `
                <button class="action-btn" title="Load to viewport">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn" title="Download">
                    <i class="fas fa-download"></i>
                </button>
            `;
        }, 3000);
    }

    generateTaskName() {
        const names = [
            'Generated Object', 'Custom Model', 'AI Creation', 'New Asset',
            'Generated Mesh', 'Custom Design', 'AI Model', 'New Creation'
        ];
        return names[Math.floor(Math.random() * names.length)];
    }

    initializeModules() {
        // Setup range slider
        document.addEventListener('input', (e) => {
            if (e.target.id === 'num-parts-slider') {
                const value = e.target.value;
                e.target.nextElementSibling.textContent = `${value} parts`;
            }
        });
    }
}

// Initialize the UI when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new StudioUI();
});

// Add some CSS for the checkbox group
const style = document.createElement('style');
style.textContent = `
    .checkbox-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-top: 8px;
    }

    .checkbox-group label {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        color: #e5e5e5;
        cursor: pointer;
    }

    .checkbox-group input[type="checkbox"] {
        width: auto;
        margin: 0;
    }

    .upload-zone.dragover {
        border-color: #4f46e5;
        background: rgba(79, 70, 229, 0.1);
    }

    .range-value {
        text-align: center;
        font-size: 12px;
        color: #999;
        margin-top: 4px;
    }

    input[type="range"] {
        width: 100%;
        height: 6px;
        border-radius: 3px;
        background: #333;
        outline: none;
        -webkit-appearance: none;
    }

    input[type="range"]::-webkit-slider-thumb {
        appearance: none;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #4f46e5;
        cursor: pointer;
    }

    input[type="range"]::-moz-range-thumb {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #4f46e5;
        cursor: pointer;
        border: none;
    }
`;
document.head.appendChild(style); 