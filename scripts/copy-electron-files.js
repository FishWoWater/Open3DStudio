const fs = require('fs');
const path = require('path');

// Create build directory structure
fs.mkdirSync('build', { recursive: true });
fs.mkdirSync('build/icons', { recursive: true });

// Copy main electron files
fs.copyFileSync('public/electron.js', 'build/electron.js');
fs.copyFileSync('public/preload.js', 'build/preload.js');

// Copy icon files
const iconFiles = fs.readdirSync('public/icons');
iconFiles.forEach(file => {
  const srcPath = path.join('public/icons', file);
  const destPath = path.join('build/icons', file);
  fs.copyFileSync(srcPath, destPath);
});

console.log('✅ Electron files and icons copied successfully');
console.log('📁 Files copied:');
console.log('   • electron.js');
console.log('   • preload.js');
console.log(`   • ${iconFiles.length} icon files`); 