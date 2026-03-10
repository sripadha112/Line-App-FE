const fs = require('fs');
const path = require('path');

// Files to copy from web/ to dist/
const filesToCopy = [
  'robots.txt',
  'sitemap.xml',
  '.htaccess',
  'browserconfig.xml',
  'seo-check.html',
  'index.html'  // Override the generated index.html with our SEO-optimized version
];

// Directories to copy
const dirsToCopy = [
  '.well-known'
];

const webDir = path.join(__dirname, '..', 'web');
const distDir = path.join(__dirname, '..', 'dist');

console.log('📦 Copying static SEO files to dist folder...\n');

// Ensure dist directory exists
if (!fs.existsSync(distDir)) {
  console.log('❌ dist folder not found. Run "npm run build:web" first.');
  process.exit(1);
}

// Copy files
filesToCopy.forEach(file => {
  const src = path.join(webDir, file);
  const dest = path.join(distDir, file);
  
  if (fs.existsSync(src)) {
    try {
      fs.copyFileSync(src, dest);
      console.log(`✅ Copied: ${file}`);
    } catch (error) {
      console.log(`⚠️  Failed to copy ${file}: ${error.message}`);
    }
  } else {
    console.log(`⚠️  Not found: ${file}`);
  }
});

// Copy directories
dirsToCopy.forEach(dir => {
  const src = path.join(webDir, dir);
  const dest = path.join(distDir, dir);
  
  if (fs.existsSync(src)) {
    try {
      // Create destination directory
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }
      
      // Copy all files in directory
      const files = fs.readdirSync(src);
      files.forEach(file => {
        const srcFile = path.join(src, file);
        const destFile = path.join(dest, file);
        fs.copyFileSync(srcFile, destFile);
      });
      
      console.log(`✅ Copied directory: ${dir}/ (${files.length} files)`);
    } catch (error) {
      console.log(`⚠️  Failed to copy ${dir}: ${error.message}`);
    }
  } else {
    console.log(`⚠️  Directory not found: ${dir}`);
  }
});

console.log('\n✨ Static files copied successfully!');
console.log('📍 Files are now in the dist/ folder and ready for deployment.\n');
