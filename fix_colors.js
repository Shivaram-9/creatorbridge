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
  if (file.endsWith('.jsx')) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    
    // Replace inline hardcoded text colors
    content = content.replace(/color:\s*['"]#1a1a1a['"]/gi, "color: 'var(--text-main)'");
    content = content.replace(/color:\s*['"]#64748b['"]/gi, "color: 'var(--text-muted)'");
    content = content.replace(/color:\s*#1a1a1a/gi, "color: var(--text-main)");
    content = content.replace(/color:\s*#64748b/gi, "color: var(--text-muted)");
    
    // Replace inline hardcoded background colors
    content = content.replace(/background:\s*['"]#fff['"]/gi, "background: 'var(--bg-card)'");
    content = content.replace(/backgroundColor:\s*['"]#f8fafc['"]/gi, "backgroundColor: 'var(--bg-main)'");
    content = content.replace(/backgroundColor:\s*['"]#f1f5f9['"]/gi, "backgroundColor: 'var(--bg-secondary)'");
    content = content.replace(/backgroundColor:\s*['"]transparent['"]/gi, "backgroundColor: 'transparent'"); // just for safety if needed
    
    // Replace inline borders
    content = content.replace(/border:\s*['"]1px solid #e2e8f0['"]/gi, "border: '1px solid var(--border-light)'");
    content = content.replace(/borderBottom:\s*['"]1px solid #e2e8f0['"]/gi, "borderBottom: '1px solid var(--border-light)'");
    content = content.replace(/border:\s*['"]1px solid #f1f5f9['"]/gi, "border: '1px solid var(--border-light)'");

    // Specific ternary replacements found in UserCard.jsx
    content = content.replace(/hasRequested \? '#f1f5f9' : isFollowing \? '#f1f5f9' : '#0f172a'/g, "hasRequested ? 'var(--bg-secondary)' : isFollowing ? 'var(--bg-secondary)' : 'var(--primary)'");
    content = content.replace(/hasRequested \? '#64748b' : isFollowing \? '#0f172a' : 'white'/g, "hasRequested ? 'var(--text-muted)' : isFollowing ? 'var(--text-main)' : 'white'");
    content = content.replace(/isMine \? '#a1a1aa' : '#64748b'/g, "isMine ? '#a1a1aa' : 'var(--text-muted)'");

    // Replace CSS-in-JS style objects with #0f172a and #1e293b that we missed
    content = content.replace(/color:\s*['"]#0[fF]172[aA]['"]/g, "color: 'var(--text-main)'");
    content = content.replace(/color:\s*['"]#1[eE]293[bB]['"]/g, "color: 'var(--text-main)'");

    if (content !== original) {
      fs.writeFileSync(file, content);
      console.log('Fixed inline JSX styles:', file);
    }
  }
});
