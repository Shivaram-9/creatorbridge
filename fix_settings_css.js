const fs = require('fs');

const file = './client/src/pages/Settings.css';
let content = fs.readFileSync(file, 'utf8');

// Colors replacement map for Settings.css
const replacements = {
  '#64748b': 'var(--text-muted)',
  '#f1f5f9': 'var(--border-light)',
  '#cbd5e1': 'var(--border-light)',
  '#0052cc': 'var(--primary)',
  '#ffffff': 'var(--bg-card)',
  '#94a3b8': 'var(--text-muted)',
  '#10b981': 'var(--success)', // usually green
  '#dcfce7': 'var(--bg-success, rgba(16, 185, 129, 0.1))',
  '#0f172a': 'var(--text-main)', // unless border? We will fix toggle-form-btn separately
  '#15803d': 'var(--success)',
  '#efefef': 'var(--border-light)',
  '#fafafa': 'var(--bg-secondary)',
  '#fff': 'var(--bg-card)',
  '#475569': 'var(--text-muted)'
};

for (const [hex, cssVar] of Object.entries(replacements)) {
  const regex = new RegExp(hex, 'gi');
  content = content.replace(regex, cssVar);
}

// Special overrides
content = content.replace(/\.toggle-form-btn \{[\s\S]*?\}/, `.toggle-form-btn {
  font-weight: 700 !important;
  color: var(--primary) !important;
  font-size: 14px !important;
}`);

content = content.replace(/border: 1px solid var\(--text-main\);/g, 'border: 1px solid var(--border-light);');

fs.writeFileSync(file, content);
console.log('Settings.css colors completely replaced!');
