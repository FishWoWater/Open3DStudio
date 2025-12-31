/**
 * Replit Deployment Service
 * Generates optimized game bundles and deployment configurations
 * No external dependencies - uses browser APIs only
 */

import { GameProject } from '../../types/state';
import { Platformer3DTemplate } from '../../game-engine/templates/Platformer3DTemplate';
import { indexedDBStorage } from '../indexedDBStorage';

export interface DeploymentBundle {
  'index.html': string;
  '.replit': string;
  'README.md': string;
  assets: { [filename: string]: Blob };
}

export interface DeploymentResult {
  bundle: DeploymentBundle;
  downloadUrl: string;
  instructions: string;
}

export class ReplitDeployer {
  /**
   * Generate a complete deployment bundle for Replit
   */
  async generateDeploymentBundle(project: GameProject): Promise<DeploymentBundle> {
    console.log(`Generating deployment bundle for ${project.name}...`);

    // Get all project assets
    const assets = await indexedDBStorage.getAllAssets(project.id);

    // Generate the main HTML file
    const html = await this.generateStandaloneHTML(project, assets);

    // Generate Replit configuration
    const replitConfig = this.generateReplitConfig(project);

    // Generate README
    const readme = this.generateReadme(project);

    // Prepare asset files
    const assetFiles: { [filename: string]: Blob } = {};
    for (const asset of assets) {
      const blob = new Blob([asset.data], { type: 'model/gltf-binary' });
      assetFiles[`assets/${asset.name}.glb`] = blob;
    }

    return {
      'index.html': html,
      '.replit': replitConfig,
      'README.md': readme,
      assets: assetFiles
    };
  }

  /**
   * Generate standalone HTML file with embedded Three.js
   */
  private async generateStandaloneHTML(
    project: GameProject,
    assets: any[]
  ): Promise<string> {
    // This generates a complete standalone HTML file with Three.js
    // Uses CDN for Three.js to avoid bundling

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${project.name}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: white;
    }

    #gameContainer {
      position: relative;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    }

    canvas {
      display: block;
    }

    #ui {
      position: absolute;
      top: 16px;
      left: 16px;
      background: rgba(0, 0, 0, 0.7);
      padding: 12px 20px;
      border-radius: 8px;
      backdrop-filter: blur(10px);
      font-family: monospace;
    }

    .stat {
      margin-bottom: 4px;
    }

    .stat-label {
      color: #aaa;
    }

    .stat-value {
      color: #4ecdc4;
      font-weight: bold;
    }

    #instructions {
      position: absolute;
      bottom: 16px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.7);
      padding: 10px 20px;
      border-radius: 6px;
      backdrop-filter: blur(10px);
      font-size: 13px;
      text-align: center;
    }

    #gameOver {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.9);
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(15px);
    }

    #gameOver.show {
      display: flex;
    }

    .game-over-title {
      font-size: 48px;
      color: #ff6b6b;
      margin-bottom: 20px;
      text-shadow: 0 0 20px rgba(255, 107, 107, 0.5);
    }

    .final-score {
      font-size: 24px;
      margin-bottom: 30px;
    }

    .restart-button {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      border: none;
      padding: 16px 40px;
      border-radius: 30px;
      font-size: 18px;
      cursor: pointer;
      transition: all 0.3s;
    }

    .restart-button:hover {
      transform: scale(1.05);
      box-shadow: 0 10px 40px rgba(102, 126, 234, 0.5);
    }

    #info {
      margin-top: 20px;
      text-align: center;
      opacity: 0.7;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div id="gameContainer">
    <canvas id="gameCanvas" width="${project.gameConfig.width}" height="${project.gameConfig.height}"></canvas>

    <div id="ui">
      <div class="stat">
        <span class="stat-label">Score:</span>
        <span class="stat-value" id="score">0</span>
      </div>
      <div class="stat">
        <span class="stat-label">Lives:</span>
        <span class="stat-value" id="lives">3</span>
      </div>
    </div>

    <div id="instructions">
      <strong>Controls:</strong> Arrow Keys / WASD to move, Space to jump
    </div>

    <div id="gameOver">
      <div class="game-over-title">GAME OVER</div>
      <div class="final-score">Final Score: <span id="finalScore">0</span></div>
      <button class="restart-button" onclick="restartGame()">Play Again</button>
    </div>
  </div>

  <div id="info">
    <p>${project.name} - Created with Open3DStudio</p>
    <p>Press F11 for fullscreen</p>
  </div>

  <!-- Load Three.js from CDN -->
  <script src="https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.min.js"></script>

  <script>
    // Game will be initialized here
    // This is a simplified version - full game logic would be embedded

    const canvas = document.getElementById('gameCanvas');
    const scoreEl = document.getElementById('score');
    const livesEl = document.getElementById('lives');
    const gameOverEl = document.getElementById('gameOver');
    const finalScoreEl = document.getElementById('finalScore');

    let score = 0;
    let lives = 3;
    let gameOver = false;

    function updateScore(newScore) {
      score = newScore;
      scoreEl.textContent = score;
    }

    function updateLives(newLives) {
      lives = newLives;
      livesEl.textContent = lives;

      if (lives <= 0) {
        endGame();
      }
    }

    function endGame() {
      gameOver = true;
      finalScoreEl.textContent = score;
      gameOverEl.classList.add('show');
    }

    function restartGame() {
      gameOver = false;
      score = 0;
      lives = 3;
      updateScore(0);
      updateLives(3);
      gameOverEl.classList.remove('show');
      // Restart game logic
    }

    // Initialize Three.js scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('${project.gameConfig.backgroundColor}');

    const camera = new THREE.PerspectiveCamera(
      75,
      canvas.width / canvas.height,
      0.1,
      1000
    );
    camera.position.set(10, 10, 10);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(canvas.width, canvas.height);
    renderer.shadowMap.enabled = true;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Create ground
    const groundGeometry = new THREE.BoxGeometry(20, 0.5, 20);
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x45b7d1 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.receiveShadow = true;
    scene.add(ground);

    // Create player
    const playerGeometry = new THREE.BoxGeometry(1, 1.5, 1);
    const playerMaterial = new THREE.MeshStandardMaterial({ color: 0x4ecdc4 });
    const player = new THREE.Mesh(playerGeometry, playerMaterial);
    player.position.y = 2;
    player.castShadow = true;
    scene.add(player);

    // Game loop
    let playerVelocity = { x: 0, y: 0, z: 0 };
    const gravity = 0.02;
    const moveSpeed = 0.1;
    const jumpPower = 0.3;
    let onGround = false;

    // Input
    const keys = {};
    window.addEventListener('keydown', e => keys[e.code] = true);
    window.addEventListener('keyup', e => keys[e.code] = false);

    function update() {
      if (gameOver) return;

      // Movement
      if (keys['ArrowLeft'] || keys['KeyA']) playerVelocity.x = -moveSpeed;
      else if (keys['ArrowRight'] || keys['KeyD']) playerVelocity.x = moveSpeed;
      else playerVelocity.x = 0;

      if (keys['ArrowUp'] || keys['KeyW']) playerVelocity.z = -moveSpeed;
      else if (keys['ArrowDown'] || keys['KeyS']) playerVelocity.z = moveSpeed;
      else playerVelocity.z = 0;

      // Jump
      if ((keys['Space']) && onGround) {
        playerVelocity.y = jumpPower;
        onGround = false;
      }

      // Apply gravity
      playerVelocity.y -= gravity;

      // Update position
      player.position.x += playerVelocity.x;
      player.position.y += playerVelocity.y;
      player.position.z += playerVelocity.z;

      // Ground collision
      if (player.position.y <= 1) {
        player.position.y = 1;
        playerVelocity.y = 0;
        onGround = true;
      }

      // Fall off
      if (player.position.y < -10) {
        updateLives(lives - 1);
        player.position.set(0, 2, 0);
        playerVelocity = { x: 0, y: 0, z: 0 };
      }

      // Camera follow
      camera.position.x = player.position.x + 10;
      camera.position.z = player.position.z + 10;
      camera.lookAt(player.position);
    }

    function animate() {
      update();
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }

    animate();
  </script>
</body>
</html>`;
  }

  /**
   * Generate .replit configuration file
   */
  private generateReplitConfig(project: GameProject): string {
    return `# ${project.name} - Replit Configuration
run = "npx serve -s . -l 3000"
entrypoint = "index.html"

[nix]
channel = "stable-24_05"

[deployment]
run = ["sh", "-c", "npx serve -s . -l 3000"]
deploymentTarget = "cloudrun"

[[ports]]
localPort = 3000
externalPort = 80

[env]
BROWSER = "none"
`;
  }

  /**
   * Generate README file
   */
  private generateReadme(project: GameProject): string {
    return `# ${project.name}

${project.description || 'A 3D game created with Open3DStudio'}

## Genre
${project.genre.charAt(0).toUpperCase() + project.genre.slice(1)}

## How to Play

### Controls
- **Arrow Keys** or **WASD**: Move
- **Space**: Jump
- **F11**: Fullscreen mode

### Objective
Collect all coins and reach the highest score!

## Running Locally

This game is a standalone HTML file and can run in any modern web browser.

1. Simply open \`index.html\` in your browser
2. Or run a local server:
   \`\`\`bash
   npx serve -s . -l 3000
   \`\`\`
3. Visit http://localhost:3000

## Deploying

### Deploy to Replit
1. Create a new Repl
2. Upload all files
3. Run the project
4. Share the public URL!

### Deploy to Netlify
1. Drag and drop the folder to netlify.com/drop
2. Get instant deployment!

### Deploy to GitHub Pages
1. Create a GitHub repository
2. Upload files
3. Enable GitHub Pages in settings
4. Your game is live!

## Technology

- **Engine**: Three.js (WebGL)
- **Physics**: Custom physics engine
- **Assets**: AI-generated 3D models
- **Created**: ${new Date().toLocaleDateString()}

## Credits

Created with [Open3DStudio](https://github.com/yourusername/Open3DStudio)
Game Design Platform with AI-Powered 3D Asset Generation

---

Enjoy playing! 🎮
`;
  }

  /**
   * Create downloadable ZIP bundle
   */
  async createDownloadableBundle(project: GameProject): Promise<Blob> {
    const bundle = await this.generateDeploymentBundle(project);

    // For now, create a simple bundle
    // In production, you'd use JSZip or similar (free library)

    // Create text representation for now
    let bundleText = '=== DEPLOYMENT BUNDLE ===\n\n';

    bundleText += `--- index.html ---\n${bundle['index.html']}\n\n`;
    bundleText += `--- .replit ---\n${bundle['.replit']}\n\n`;
    bundleText += `--- README.md ---\n${bundle['README.md']}\n\n`;

    bundleText += `\nAssets included:\n`;
    Object.keys(bundle.assets).forEach(filename => {
      bundleText += `- ${filename}\n`;
    });

    bundleText += `\n=== TO DEPLOY ===\n`;
    bundleText += `1. Create a new Repl on replit.com\n`;
    bundleText += `2. Copy the files above\n`;
    bundleText += `3. Run the project\n`;
    bundleText += `4. Share your game!\n`;

    return new Blob([bundleText], { type: 'text/plain' });
  }

  /**
   * Download bundle as file
   */
  async downloadBundle(project: GameProject): Promise<void> {
    const blob = await this.createDownloadableBundle(project);
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.replace(/\s+/g, '_').toLowerCase()}_deployment.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);

    console.log(`Downloaded deployment bundle for ${project.name}`);
  }

  /**
   * Get deployment instructions
   */
  getDeploymentInstructions(project: GameProject): string {
    return `
# Deploy ${project.name} to Replit

## Quick Start

1. **Download the deployment bundle**
   - Click "Download Bundle" button

2. **Create a Replit account** (free)
   - Visit https://replit.com
   - Sign up with GitHub, Google, or email

3. **Create a new Repl**
   - Click "Create" → "HTML, CSS, JS"
   - Name it "${project.name}"

4. **Upload files**
   - Copy content from index.html
   - Paste into the Repl's index.html
   - Create .replit file with the configuration
   - Upload assets folder

5. **Run your game**
   - Click "Run" button
   - Your game will open in a new window

6. **Share**
   - Click "Share" to get a public URL
   - Share with friends!

## Alternative: Netlify Drop

1. Visit https://app.netlify.com/drop
2. Drag and drop your game folder
3. Get instant deployment!

## Need help?

Visit our docs: https://github.com/yourusername/Open3DStudio/wiki
`;
  }
}
