const fs = require('fs');
const path = require('path');

// Files to copy from web/ to dist/
const filesToCopy = [
  'robots.txt',
  'sitemap.xml',
  '.htaccess',
  'browserconfig.xml',
  'seo-check.html'
];

// Directories to copy
const dirsToCopy = [
  '.well-known',
  'booking',
  'home'
];

const webDir = path.join(__dirname, '..', 'web');
const distDir = path.join(__dirname, '..', 'dist');

console.log('📦 Copying static SEO files to dist folder...\n');

// Ensure dist directory exists
if (!fs.existsSync(distDir)) {
  console.log('❌ dist folder not found. Run "npm run build:web" first.');
  process.exit(1);
}

// Copy files (excluding index.html - we'll handle that separately)
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
      
      // Recursively copy all files and subdirectories
      function copyRecursive(srcDir, destDir) {
        const entries = fs.readdirSync(srcDir, { withFileTypes: true });
        
        entries.forEach(entry => {
          const srcPath = path.join(srcDir, entry.name);
          const destPath = path.join(destDir, entry.name);
          
          if (entry.isDirectory()) {
            if (!fs.existsSync(destPath)) {
              fs.mkdirSync(destPath, { recursive: true });
            }
            copyRecursive(srcPath, destPath);
          } else {
            fs.copyFileSync(srcPath, destPath);
          }
        });
      }
      
      copyRecursive(src, dest);
      
      // Count total files
      function countFiles(dir) {
        let count = 0;
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        entries.forEach(entry => {
          if (entry.isDirectory()) {
            count += countFiles(path.join(dir, entry.name));
          } else {
            count++;
          }
        });
        return count;
      }
      
      const fileCount = countFiles(dest);
      console.log(`✅ Copied directory: ${dir}/ (${fileCount} files)`);
    } catch (error) {
      console.log(`⚠️  Failed to copy ${dir}: ${error.message}`);
    }
  } else {
    console.log(`⚠️  Directory not found: ${dir}`);
  }
});

// Smart merge of index.html: Keep Expo's script tags but add our SEO content
console.log('\n🔧 Merging SEO content into index.html...');

const seoHtmlPath = path.join(webDir, 'index.html');
const expoHtmlPath = path.join(distDir, 'index.html');

if (fs.existsSync(seoHtmlPath) && fs.existsSync(expoHtmlPath)) {
  try {
    const seoHtml = fs.readFileSync(seoHtmlPath, 'utf-8');
    const expoHtml = fs.readFileSync(expoHtmlPath, 'utf-8');
    
    // Extract everything from SEO HTML head tag
    const seoHeadMatch = seoHtml.match(/<head>([\s\S]*?)<\/head>/i);
    const seoHeadContent = seoHeadMatch ? seoHeadMatch[1] : '';
    
    // Extract only the hidden SEO content div from body
    const seoBodyMatch = seoHtml.match(/<!-- SEO Content[\s\S]*?<\/div>\s*\n\s*<!-- App bundle/i);
    const seoBodyContent = seoBodyMatch ? seoBodyMatch[0].replace(/<!-- App bundle.*$/, '').trim() : '';
    
    // Get Expo's body opening and script tags
    const expoBodyMatch = expoHtml.match(/<body>([\s\S]*?)<script/i);
    const expoBodyStart = expoBodyMatch ? expoBodyMatch[1].trim() : '';
    
    const expoScriptMatch = expoHtml.match(/<script[\s\S]*?<\/body>/i);
    const expoScripts = expoScriptMatch ? expoScriptMatch[0] : '<script></script></body>';
    
    // Build the complete merged HTML
    const mergedHtml = `<!DOCTYPE html>
<html lang="en">
<head>${seoHeadContent}
</head>
<body>
${expoBodyStart ? expoBodyStart + '\n  ' : ''}${seoBodyContent}
  
  ${expoScripts}
</html>`;
    
    // Write merged HTML
    fs.writeFileSync(expoHtmlPath, mergedHtml);
    console.log('✅ Merged SEO content into index.html (kept Expo scripts)');
  } catch (error) {
    console.log(`⚠️  Failed to merge index.html: ${error.message}`);
    console.log('Stack:', error.stack);
    console.log('Using Expo-generated index.html as fallback');
  }
} else {
  console.log('⚠️  Could not merge index.html files');
}

console.log('\n✨ Static files copied successfully!');
console.log('📍 Files are now in the dist/ folder and ready for deployment.\n');
