// Update version with timestamp before build
import fs from 'fs';
import path from 'path';

const publicSwPath = path.join(process.cwd(), 'public', 'sw.js');
const timestamp = Date.now();

// Update the timestamp in sw.js if it exists
if (fs.existsSync(publicSwPath)) {
  let content = fs.readFileSync(publicSwPath, 'utf-8');
  content = content.replace(/const CACHE_VERSION = '[^']*';/, `const CACHE_VERSION = '${timestamp}';`);
  fs.writeFileSync(publicSwPath, content);
  console.log(`Updated sw.js with version: ${timestamp}`);
}

// Also update the PWA manifest with a timestamp version
const viteConfigPath = path.join(process.cwd(), 'vite.config.ts');
if (fs.existsSync(viteConfigPath)) {
  let content = fs.readFileSync(viteConfigPath, 'utf-8');
  // Update the version in the manifest with timestamp
  // This is optional since Vite PWA plugin handles caching
  console.log(`Build started with version: ${timestamp}`);
}

console.log(`Build timestamp: ${timestamp}`);