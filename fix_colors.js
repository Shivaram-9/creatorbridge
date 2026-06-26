const fs = require('fs');
const path = require('path');

function walk(dir, files = []) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath, files);
    } else {
      files.push(fullPath);
    }
  });
  return files;
}

const allFiles = walk('./client/src');
allFiles.forEach(file => {
  if (file.endsWith('.css')) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    
    content = content.replace(/color:\s*#0[fF]172[aA]\s*;/g, 'color: var(--text-main);');
    content = content.replace(/color:\s*#1[eE]293[bB]\s*;/g, 'color: var(--text-main);');
    content = content.replace(/background(-color)?:\s*#0[fF]172[aA]\s*;/g, 'background: var(--bg-secondary);');
    content = content.replace(/background(-color)?:\s*#1[eE]293[bB]\s*;/g, 'background: var(--bg-secondary);');
    
    if (content !== original) {
      fs.writeFileSync(file, content);
      console.log('Fixed CSS:', file);
    }
  } else if (file.endsWith('.jsx')) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    
    // Add dark text colors if missing
    content = content.replace(/text-slate-900/g, 'text-slate-900 dark:text-white');
    content = content.replace(/text-slate-800/g, 'text-slate-800 dark:text-white');
    content = content.replace(/text-gray-900/g, 'text-gray-900 dark:text-white');
    
    // Clean up duplicates
    content = content.replace(/dark:text-white(\s+dark:text-white)+/g, 'dark:text-white');
    content = content.replace(/dark:text-slate-\d+\s+dark:text-white/g, 'dark:text-white');
    content = content.replace(/dark:text-white\s+dark:text-slate-\d+/g, 'dark:text-white');
    
    // Fix remaining slate backgrounds
    content = content.replace(/dark:bg-slate-800/g, 'dark:bg-[#171717]');
    content = content.replace(/dark:border-slate-700/g, 'dark:border-[#262626]');
    
    if (content !== original) {
      fs.writeFileSync(file, content);
      console.log('Fixed JSX:', file);
    }
  }
});
