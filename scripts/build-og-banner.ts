import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

async function generate() {
  console.log('Downloading Cairo font...');
  const fontUrl = 'https://fonts.gstatic.com/s/cairo/v31/SLXgc1nY6HkvangtZmpQdkhzfH5lkSs2SgRjCAGMQ1z0hEk5W1Q.ttf';
  const fontRes = await fetch(fontUrl);
  const fontBuffer = Buffer.from(await fontRes.arrayBuffer());
  const fontBase64 = fontBuffer.toString('base64');

  const width = 1200;
  const height = 675;

  const svg = `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <style>
      @font-face {
        font-family: 'Cairo';
        src: url('data:font/truetype;charset=utf-8;base64,${fontBase64}') format('truetype');
        font-weight: 900;
        font-style: normal;
      }
      .font-cairo {
        font-family: 'Cairo', system-ui, -apple-system, sans-serif;
      }
      .font-brand {
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
    </style>

    <!-- Background Gradient -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FAF9FE"/>
      <stop offset="60%" stop-color="#F5F3FF"/>
      <stop offset="100%" stop-color="#ECE7FE"/>
    </linearGradient>

    <!-- Soft Right Circle Backdrop -->
    <linearGradient id="circleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#E9E3FD"/>
      <stop offset="100%" stop-color="#DCD4FA"/>
    </linearGradient>

    <!-- 3D Shopping Bag Front Face -->
    <linearGradient id="bagFront" x1="15%" y1="0%" x2="85%" y2="100%">
      <stop offset="0%" stop-color="#7C42F7"/>
      <stop offset="50%" stop-color="#6729ED"/>
      <stop offset="100%" stop-color="#5114DE"/>
    </linearGradient>

    <!-- 3D Shopping Bag Side Flap -->
    <linearGradient id="bagSide" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4610C9"/>
      <stop offset="60%" stop-color="#350A9E"/>
      <stop offset="100%" stop-color="#240570"/>
    </linearGradient>

    <!-- 3D Shopping Bag Top Inside Shadow -->
    <linearGradient id="bagInside" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#210363"/>
      <stop offset="100%" stop-color="#4413B8"/>
    </linearGradient>

    <!-- Drop Shadow beneath bag -->
    <radialGradient id="floorShadow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#3B1884" stop-opacity="0.38"/>
      <stop offset="60%" stop-color="#4F1EA8" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#5521B5" stop-opacity="0"/>
    </radialGradient>

    <!-- Button Gradient -->
    <linearGradient id="btnGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#4F1ED9"/>
      <stop offset="100%" stop-color="#6F39F0"/>
    </linearGradient>

    <!-- 3D Embossed Letter N on Bag -->
    <filter id="embossShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="3" dy="5" stdDeviation="4" flood-color="#240570" flood-opacity="0.45"/>
    </filter>

    <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="20" flood-color="#581CD4" flood-opacity="0.22"/>
    </filter>

    <!-- Dot Matrix Pattern -->
    <pattern id="dotGrid" x="0" y="0" width="18" height="18" patternUnits="userSpaceOnUse">
      <circle cx="9" cy="9" r="2.5" fill="#C4B5FD" opacity="0.45"/>
    </pattern>
  </defs>

  <!-- Canvas Background -->
  <rect width="${width}" height="${height}" fill="url(#bgGrad)"/>

  <!-- Decorative Dot Patterns -->
  <!-- Top Left Dots (5 cols x 4 rows) -->
  <rect x="36" y="36" width="90" height="72" fill="url(#dotGrid)"/>

  <!-- Bottom Right Dots (5 cols x 4 rows) -->
  <rect x="1080" y="570" width="90" height="72" fill="url(#dotGrid)"/>

  <!-- Bottom Left Concentric Ring Accents -->
  <g opacity="0.4" stroke="#DDD6FE" stroke-width="2" fill="none">
    <circle cx="20" cy="650" r="120"/>
    <circle cx="20" cy="650" r="180"/>
    <circle cx="20" cy="650" r="240"/>
  </g>

  <!-- ================= RIGHT SIDE: CIRCULAR HERO CONTAINER ================= -->
  <g transform="translate(880, 338)">
    <!-- White outer border ring -->
    <circle cx="0" cy="0" r="255" fill="none" stroke="#FFFFFF" stroke-width="10" opacity="0.95"/>
    <!-- Lavender circle fill -->
    <circle cx="0" cy="0" r="250" fill="url(#circleGrad)"/>

    <!-- Floor Drop Shadow for Bag -->
    <ellipse cx="0" cy="175" rx="175" ry="32" fill="url(#floorShadow)"/>

    <!-- 3D SHOPPING BAG -->
    <g id="heroBag" filter="url(#softGlow)" transform="translate(-145, -165)">
      <!-- Back / Inside Rim -->
      <polygon points="25,48 245,35 285,55 60,68" fill="url(#bagInside)"/>

      <!-- Rear Handles -->
      <!-- Left Handle -->
      <path d="M 95,55 C 95,-15 145,-15 145,55" fill="none" stroke="#F1F0FB" stroke-width="12" stroke-linecap="round"/>
      <path d="M 95,55 C 95,-15 145,-15 145,55" fill="none" stroke="#E2E0F5" stroke-width="12" stroke-linecap="round" opacity="0.3"/>

      <!-- Side Accordion 3D Face -->
      <polygon points="230,42 278,60 274,305 228,290" fill="url(#bagSide)"/>

      <!-- Front Face of Bag with rounded bottom -->
      <path d="M 28,52 L 230,42 L 228,290 C 228,298 220,305 210,305 L 42,305 C 32,305 25,298 25,290 Z" fill="url(#bagFront)"/>

      <!-- Top Trim Fold Highlight -->
      <polygon points="28,52 230,42 230,48 28,58" fill="#935BF8" opacity="0.5"/>

      <!-- Front Handle Rings (Grommets) -->
      <circle cx="85" cy="85" r="9" fill="#E5E3FA" stroke="#D1CEF7" stroke-width="2"/>
      <circle cx="85" cy="85" r="5" fill="#4C1BC7"/>

      <circle cx="175" cy="82" r="9" fill="#E5E3FA" stroke="#D1CEF7" stroke-width="2"/>
      <circle cx="175" cy="82" r="5" fill="#4C1BC7"/>

      <!-- Front Handle Arch (Pure White with 3D bevel) -->
      <path d="M 85,85 C 85, -2 175, -5 175, 82" fill="none" stroke="#FFFFFF" stroke-width="14" stroke-linecap="round"/>
      <path d="M 85,85 C 85, -2 175, -5 175, 82" fill="none" stroke="#ECE9FB" stroke-width="6" stroke-linecap="round" opacity="0.8"/>

      <!-- Bold 3D Embossed White Letter "N" -->
      <g filter="url(#embossShadow)">
        <path d="M 70,135 
                 C 70,126 77,120 86,120 
                 C 95,120 102,126 102,135 
                 L 102,215 
                 L 155,128 
                 C 160,122 168,120 174,120 
                 C 183,120 190,127 190,136 
                 L 190,265 
                 C 190,274 183,280 174,280 
                 C 165,280 158,274 158,265 
                 L 158,185 
                 L 105,272 
                 C 100,278 92,280 86,280 
                 C 77,280 70,273 70,264 
                 Z" 
              fill="#FFFFFF"/>
        <!-- Soft Inner Gradient Highlight on N -->
        <path d="M 74,136 L 98,136 L 98,218 L 158,126 L 186,126 L 186,145 L 102,274 L 74,274 Z" fill="#F8F7FF" opacity="0.7"/>
      </g>
    </g>
  </g>

  <!-- ================= LEFT SIDE: BRANDING & ARABIC TEXT ================= -->
  <g transform="translate(100, 110)">
    
    <!-- Top Left Brand Logo (Shopping bag icon + Text) -->
    <g transform="translate(0, 0)">
      <!-- Mini Shopping Bag Icon with N -->
      <g transform="translate(0, 5)">
        <!-- Bag Handle -->
        <path d="M 28,26 C 28,10 52,10 52,26" fill="none" stroke="#5B2FE3" stroke-width="6" stroke-linecap="round"/>
        <!-- Bag Body with rounded corners -->
        <rect x="10" y="24" width="60" height="60" rx="14" fill="url(#btnGrad)"/>
        <!-- White 'N' in logo -->
        <path d="M 26,40 L 33,40 L 47,62 L 47,40 L 54,40 L 54,68 L 47,68 L 33,46 L 33,68 L 26,68 Z" fill="#FFFFFF"/>
      </g>

      <!-- Logo Brand Typography -->
      <text x="88" y="52" class="font-brand" font-size="44" font-weight="900" fill="#181340" letter-spacing="-1">Nouva</text>
      <text x="88" y="90" class="font-brand" font-size="42" font-weight="400" fill="#5B2FE3" letter-spacing="-0.5">Market</text>
    </g>

    <!-- Main Arabic Headline -->
    <g transform="translate(0, 215)">
      <text x="0" y="0" class="font-cairo" font-size="52" font-weight="900" fill="#181340" text-anchor="start">
        منصة التسويق بالعمولة
      </text>
      <text x="0" y="72" class="font-cairo" font-size="52" font-weight="900" fill="#181340" text-anchor="start">
        الأولى <tspan fill="#5B2FE3">في الجزائر</tspan>
      </text>
    </g>

    <!-- Three Trust / Feature Badges: سهل | موثوق | مربح -->
    <g transform="translate(0, 360)">
      <!-- Badge 1: سهل (Easy with chart) -->
      <g transform="translate(0, 0)">
        <path d="M 4,18 L 10,10 L 16,15 L 24,5" fill="none" stroke="#5B2FE3" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M 19,5 L 24,5 L 24,10" fill="none" stroke="#5B2FE3" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="4" y1="22" x2="24" y2="22" stroke="#5B2FE3" stroke-width="2" stroke-linecap="round"/>
        <line x1="8" y1="22" x2="8" y2="16" stroke="#5B2FE3" stroke-width="2"/>
        <line x1="14" y1="22" x2="14" y2="17" stroke="#5B2FE3" stroke-width="2"/>
        <line x1="20" y1="22" x2="20" y2="12" stroke="#5B2FE3" stroke-width="2"/>
        <text x="36" y="20" class="font-cairo" font-size="24" font-weight="900" fill="#38305E">سهل</text>
      </g>

      <!-- Vertical Divider -->
      <line x1="105" y1="2" x2="105" y2="25" stroke="#CBD5E1" stroke-width="1.5"/>

      <!-- Badge 2: موثوق (Trusted with shield) -->
      <g transform="translate(125, 0)">
        <rect x="2" y="2" width="22" height="22" rx="6" fill="#5B2FE3"/>
        <path d="M 8,13 L 12,17 L 18,9" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        <text x="36" y="20" class="font-cairo" font-size="24" font-weight="900" fill="#38305E">موثوق</text>
      </g>

      <!-- Vertical Divider -->
      <line x1="240" y1="2" x2="240" y2="25" stroke="#CBD5E1" stroke-width="1.5"/>

      <!-- Badge 3: مربح (Profitable with upward graph) -->
      <g transform="translate(260, 0)">
        <path d="M 4,16 L 10,9 L 16,13 L 24,4" fill="none" stroke="#5B2FE3" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M 19,4 L 24,4 L 24,9" fill="none" stroke="#5B2FE3" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="6" y1="22" x2="6" y2="17" stroke="#5B2FE3" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="12" y1="22" x2="12" y2="13" stroke="#5B2FE3" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="18" y1="22" x2="18" y2="8" stroke="#5B2FE3" stroke-width="2.5" stroke-linecap="round"/>
        <text x="36" y="20" class="font-cairo" font-size="24" font-weight="900" fill="#38305E">مربح</text>
      </g>
    </g>

    <!-- Call-To-Action Pill Button: NOUVAMARKET.COM -->
    <g transform="translate(0, 435)">
      <!-- Rounded Pill Button -->
      <rect x="0" y="0" width="250" height="48" rx="24" fill="url(#btnGrad)"/>
      <!-- Globe Icon -->
      <g transform="translate(18, 14)">
        <circle cx="10" cy="10" r="9" fill="none" stroke="#FFFFFF" stroke-width="1.8"/>
        <line x1="1" y1="10" x2="19" y2="10" stroke="#FFFFFF" stroke-width="1.8"/>
        <ellipse cx="10" cy="10" rx="4.5" ry="9" fill="none" stroke="#FFFFFF" stroke-width="1.8"/>
      </g>
      <!-- Domain Text -->
      <text x="50" y="30" class="font-brand" font-size="16" font-weight="800" fill="#FFFFFF" letter-spacing="1">NOUVAMARKET.COM</text>
    </g>
  </g>
</svg>
`;

  // Write SVG file
  const svgPath = path.join(process.cwd(), 'public', 'og-image.svg');
  fs.writeFileSync(svgPath, svg, 'utf-8');
  console.log(`Saved SVG to ${svgPath}`);

  // Render to PNG 1200x675 (standard 16:9 for Open Graph)
  const pngPath = path.join(process.cwd(), 'public', 'og-image.png');
  await sharp(Buffer.from(svg))
    .png({ quality: 100 })
    .toFile(pngPath);
  console.log(`Rendered 1200x675 PNG to ${pngPath}`);

  // Also render full HD 1920x1080 banner
  const bannerPath = path.join(process.cwd(), 'public', 'social-banner.png');
  await sharp(Buffer.from(svg))
    .resize(1920, 1080)
    .png({ quality: 100 })
    .toFile(bannerPath);
  console.log(`Rendered 1920x1080 PNG to ${bannerPath}`);
}

generate().catch(err => {
  console.error('Error generating image:', err);
  process.exit(1);
});
