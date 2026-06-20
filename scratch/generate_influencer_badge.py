svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
  <defs>
    <!-- Facet Gradients for Crystal 3D Effect -->
    <linearGradient id="facet-top" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#E8F4FD"/>
      <stop offset="100%" stop-color="#B2D5F5"/>
    </linearGradient>
    <linearGradient id="facet-tr" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#8DBDE6"/>
      <stop offset="100%" stop-color="#4B88CC"/>
    </linearGradient>
    <linearGradient id="facet-br" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#265A98"/>
      <stop offset="100%" stop-color="#143A6A"/>
    </linearGradient>
    <linearGradient id="facet-bot" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#163C6D"/>
      <stop offset="100%" stop-color="#091D3A"/>
    </linearGradient>
    <linearGradient id="facet-bl" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#3A75B8"/>
      <stop offset="100%" stop-color="#1E4D88"/>
    </linearGradient>
    <linearGradient id="facet-tl" x1="100%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="#6AA1D9"/>
      <stop offset="100%" stop-color="#A5CBEF"/>
    </linearGradient>

    <!-- Inner Diamond Gradient -->
    <linearGradient id="inner-diamond" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1C4782"/>
      <stop offset="50%" stop-color="#113161"/>
      <stop offset="100%" stop-color="#081836"/>
    </linearGradient>

    <!-- Sparkle Gradient -->
    <linearGradient id="sparkle-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="#E0EFFF"/>
    </linearGradient>

    <!-- Drop Shadow -->
    <filter id="drop-shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000" flood-opacity="0.2"/>
    </filter>
    
    <!-- Subtle Inner Glow for the inner diamond -->
    <filter id="inner-glow">
      <feGaussianBlur stdDeviation="1.5" result="blur" />
      <feComposite in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" result="shadowDiff" />
      <feFlood flood-color="#5C9DF5" flood-opacity="0.4" />
      <feComposite in2="shadowDiff" operator="in" />
      <feComposite in2="SourceGraphic" operator="over" />
    </filter>
  </defs>

  <g filter="url(#drop-shadow)">
    <!-- Top Facet -->
    <polygon points="35,15 65,15 50,28" fill="url(#facet-top)" />
    <!-- Top-Right Facet -->
    <polygon points="65,15 85,50 72,50 50,28" fill="url(#facet-tr)" />
    <!-- Bottom-Right Facet -->
    <polygon points="85,50 65,85 50,72 72,50" fill="url(#facet-br)" />
    <!-- Bottom Facet -->
    <polygon points="65,85 35,85 50,72" fill="url(#facet-bot)" />
    <!-- Bottom-Left Facet -->
    <polygon points="35,85 15,50 28,50 50,72" fill="url(#facet-bl)" />
    <!-- Top-Left Facet -->
    <polygon points="15,50 35,15 50,28 28,50" fill="url(#facet-tl)" />

    <!-- Inner Diamond -->
    <polygon points="50,28 72,50 50,72 28,50" fill="url(#inner-diamond)" filter="url(#inner-glow)" stroke="#23528A" stroke-width="0.5"/>
  </g>

  <!-- Highlight overlay lines to enhance glass edges -->
  <polyline points="15,50 35,15 65,15 85,50" fill="none" stroke="#FFFFFF" stroke-width="1.5" opacity="0.6" stroke-linejoin="round"/>
  <line x1="35" y1="15" x2="50" y2="28" stroke="#FFFFFF" stroke-width="1" opacity="0.5" />
  <line x1="65" y1="15" x2="50" y2="28" stroke="#FFFFFF" stroke-width="1" opacity="0.3" />
  <line x1="15" y1="50" x2="28" y2="50" stroke="#FFFFFF" stroke-width="1" opacity="0.4" />

  <!-- The White Sparkle inside the crystal -->
  <path d="M 50,32 Q 50,50 68,50 Q 50,50 50,68 Q 50,50 32,50 Q 50,50 50,32 Z" fill="url(#sparkle-grad)" filter="drop-shadow(0px 0px 4px rgba(255,255,255,0.6))" />
</svg>
'''

with open('client/public/influencer_badge.svg', 'w') as f:
    f.write(svg)

print('SVG successfully written to client/public/influencer_badge.svg')
