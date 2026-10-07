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

    <!-- 3D SHOPPING BAG (Exact match to reference image) -->
    <g id="heroBag" filter="url(#softGlow)" transform="translate(-145, -165)">
      <!-- Rear Handle in depth parallax -->
      <path d="M 85,55 C 85,-18 185,-22 185,55" fill="none" stroke="#ECE8F8" stroke-width="15" stroke-linecap="round"/>
      <path d="M 85,55 C 85,-18 185,-22 185,55" fill="none" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round" opacity="0.9"/>

      <!-- Side Accordion 3D Gusset Fold -->
      <polygon points="225,48 245,55 272,285 220,305" fill="#2E0A86"/>
      <polygon points="214,44 225,48 220,305 210,305" fill="#3E10A6"/>
      <!-- Bottom inward fold triangle -->
      <polygon points="210,305 220,275 272,285" fill="#1C035A"/>

      <!-- Front Face of Bag with smooth 3D purple gradient -->
      <path d="M 38,58 L 214,44 L 210,305 C 210,312 202,316 194,316 L 30,308 C 22,308 16,300 18,292 L 34,64 C 34,60 36,58 38,58 Z" fill="url(#bagFront)"/>

      <!-- Top Rim Specular Highlight -->
      <path d="M 38,58 L 214,44 L 214,48 L 38,62 Z" fill="#9B66FC" opacity="0.7"/>

      <!-- Front Handle Left Grommet -->
      <circle cx="82" cy="78" r="10" fill="#FFFFFF" filter="drop-shadow(1px 2px 3px rgba(25,3,70,0.4))"/>
      <circle cx="82" cy="78" r="8" fill="none" stroke="#FAF8FF" stroke-width="2"/>
      <circle cx="82" cy="78" r="5" fill="#3D0B9C"/>

      <!-- Front Handle Right Grommet -->
      <circle cx="165" cy="72" r="10" fill="#FFFFFF" filter="drop-shadow(1px 2px 3px rgba(25,3,70,0.4))"/>
      <circle cx="165" cy="72" r="8" fill="none" stroke="#FAF8FF" stroke-width="2"/>
      <circle cx="165" cy="72" r="5" fill="#3D0B9C"/>

      <!-- Front Handle Arch (Thick Glossy White Tube) -->
      <path d="M 82,78 C 82,-16 165,-18 165,72" fill="none" stroke="#FFFFFF" stroke-width="17" stroke-linecap="round"/>
      <path d="M 82,78 C 82,-16 165,-18 165,72" fill="none" stroke="#DDD7F5" stroke-width="5" stroke-linecap="round" opacity="0.6" transform="translate(1, 2)"/>
      <path d="M 84,74 C 84,-12 163,-14 163,68" fill="none" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round"/>

      <!-- Signature 3D White Embossed Letter 'N' with Organic Curved Crest Flick -->
      <g filter="url(#embossShadow)">
        <!-- 3D Bevel Offset -->
        <path d="M 82,108
                 C 74,108 68,114 68,122
                 L 68,238
                 C 68,246 74,252 82,252
                 C 90,252 96,246 96,238
                 L 96,195
                 L 138,242
                 C 142,248 149,252 156,252
                 C 164,252 170,246 170,238
                 L 170,165
                 C 174,158 178,148 178,138
                 C 177,130 173,125 167,126
                 C 162,127 158,132 154,142
                 L 96,122
                 C 94,114 88,108 82,108 Z"
              fill="#D9D4F2"
              transform="translate(2, 3)"/>

        <!-- Front Pure White Surface of 'N' -->
        <path d="M 82,108
                 C 74,108 68,114 68,122
                 L 68,238
                 C 68,246 74,252 82,252
                 C 90,252 96,246 96,238
                 L 96,195
                 L 138,242
                 C 142,248 149,252 156,252
                 C 164,252 170,246 170,238
                 L 170,165
                 C 174,158 178,148 178,138
                 C 177,130 173,125 167,126
                 C 162,127 158,132 154,142
                 L 96,122
                 C 94,114 88,108 82,108 Z"
              fill="#FFFFFF"/>

        <!-- Top highlight on 'N' -->
        <path d="M 82,110 C 76,110 72,114 72,120 L 72,150 L 88,150 L 88,116 C 86,112 84,110 82,110 Z" fill="#FFFFFF" opacity="0.9"/>
        <!-- Flick Highlight -->
        <path d="M 167,126 C 171,127 175,131 176,138 C 175,146 172,154 168,162 L 164,162 C 168,152 170,144 169,136 C 168,131 166,128 163,127 Z" fill="#FFFFFF"/>
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
