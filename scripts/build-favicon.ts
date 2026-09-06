import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

async function generateFaviconAndLogo() {
  const size = 512;

  // Exact 3D clay render SVG matching the uploaded image 9A97B94C-2A46-4A6C-BB69-9D4B64AC7601.png
  // Features:
  // - 3D purple shopping bag rotated in three-quarter view
  // - Deep purple interior accordion side panel with realistic fold shadow
  // - Vibrant smooth purple front face with soft glossy gradient
  // - Dual glossy white looped tube handles with rounded rim rings (grommets)
  // - Chunky, organic, glossy white 3D letter "N" centered on the front face
  // - Soft radial ground shadow
  const svg = `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Ground Shadow Beneath Bag -->
    <radialGradient id="groundShadow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#2a087a" stop-opacity="0.38"/>
      <stop offset="60%" stop-color="#4913b8" stop-opacity="0.14"/>
      <stop offset="100%" stop-color="#5521b5" stop-opacity="0"/>
    </radialGradient>

    <!-- Front Face Main Purple Gradient (Smooth, rich 3D clay lighting) -->
    <linearGradient id="frontGradient" x1="10%" y1="0%" x2="90%" y2="100%">
      <stop offset="0%" stop-color="#7942F8"/>
      <stop offset="40%" stop-color="#672CEE"/>
      <stop offset="85%" stop-color="#5518DC"/>
      <stop offset="100%" stop-color="#470ec7"/>
    </linearGradient>

    <!-- Front Face Specular / Sheen Highlight (Top edge) -->
    <linearGradient id="topSheen" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#9d6efc" stop-opacity="0.7"/>
      <stop offset="60%" stop-color="#7d45f5" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="#5518dc" stop-opacity="0"/>
    </linearGradient>

    <!-- Side Panel (Deep rich purple with 3D shadow) -->
    <linearGradient id="sidePanelGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4812C4"/>
      <stop offset="50%" stop-color="#320796"/>
      <stop offset="100%" stop-color="#200468"/>
    </linearGradient>

    <!-- Inner Side Crease / Shadow inside the side gusset -->
    <linearGradient id="creaseShadow" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#1b0359" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#3b0c9e" stop-opacity="0.2"/>
    </linearGradient>

    <!-- Handle Gradient (Glossy white tube with subtle grey contour) -->
    <linearGradient id="handleGloss" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="35%" stop-color="#F6F5FD"/>
      <stop offset="70%" stop-color="#E5E1F9"/>
      <stop offset="100%" stop-color="#D7D1F5"/>
    </linearGradient>

    <!-- Back Handle (Slightly dimmer to create true depth) -->
    <linearGradient id="backHandleGloss" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ECEAF8"/>
      <stop offset="60%" stop-color="#DDD8F3"/>
      <stop offset="100%" stop-color="#C5BEEA"/>
    </linearGradient>

    <!-- Grommet White Ring Gradient -->
    <linearGradient id="grommetGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="60%" stop-color="#F1EFFC"/>
      <stop offset="100%" stop-color="#D6CEF5"/>
    </linearGradient>

    <!-- 3D Letter N Front & Bevel Drop Shadow -->
    <filter id="nDropShadow" x="-20%" y="-20%" width="150%" height="150%">
      <feDropShadow dx="5" dy="9" stdDeviation="6" flood-color="#220566" flood-opacity="0.5"/>
    </filter>

    <!-- Soft Ambient Glow for Whole Bag -->
    <filter id="bagAmbientGlow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#3f0f9c" flood-opacity="0.25"/>
    </filter>
  </defs>

  <!-- Ground Drop Shadow -->
  <ellipse cx="270" cy="460" rx="195" ry="34" fill="url(#groundShadow)"/>

  <!-- ================= MAIN BAG COMPOSITION ================= -->
  <g filter="url(#bagAmbientGlow)">
    <!-- 1. BACK HANDLE (Reaches high with round organic curve) -->
    <g>
      <!-- Back Handle Arch -->
      <path d="M 215,160 C 215, 30 355, 30 355, 160"
            fill="none"
            stroke="url(#backHandleGloss)"
            stroke-width="26"
            stroke-linecap="round"/>
      <!-- Soft inner shading for back handle -->
      <path d="M 215,160 C 215, 30 355, 30 355, 160"
            fill="none"
            stroke="#B5ACE0"
            stroke-width="6"
            stroke-linecap="round"
            opacity="0.5"
            transform="translate(4, 2)"/>
    </g>

    <!-- 2. SIDE GUSSET / 3D ACCORDION PANEL (Right side) -->
    <g>
      <!-- Side Wall Polygon -->
      <polygon points="384,136 432,154 456,428 382,450" fill="url(#sidePanelGradient)"/>
      <!-- Inner fold triangular shadow (gives the bag fold illusion) -->
      <polygon points="384,136 415,150 422,438 382,450" fill="url(#creaseShadow)"/>
    </g>

    <!-- 3. MAIN FRONT FACE (Smooth rounded 3D bag body) -->
    <!-- Curved quad matching the perspective of the reference image -->
    <path d="M 104,158
             C 104,150 110,144 118,143
             L 384,132
             C 392,132 398,138 398,146
             L 382,444
             C 382,454 374,460 364,460
             L 86,448
             C 76,447 70,438 72,428
             L 104,158 Z"
          fill="url(#frontGradient)"/>

    <!-- Subtle Top Rim Sheen on Front Face -->
    <path d="M 104,158 L 384,132 L 384,142 L 104,168 Z"
          fill="url(#topSheen)"/>

    <!-- Left side subtle edge light -->
    <path d="M 104,158 L 72,428 C 72,434 76,442 84,446 L 90,446 L 118,158 Z"
          fill="#8D5CF8"
          opacity="0.3"/>

    <!-- 4. FRONT HANDLE & GROMMETS (Lies in foreground) -->
    <g>
      <!-- Front Handle Arch (Pure glossy white tube) -->
      <path d="M 168,180 C 168, 22 308, 20 308, 172"
            fill="none"
            stroke="url(#handleGloss)"
            stroke-width="30"
            stroke-linecap="round"/>
      <!-- Glossy highlight strip along the handle top -->
      <path d="M 172,175 C 172, 28 304, 26 304, 168"
            fill="none"
            stroke="#FFFFFF"
            stroke-width="10"
            stroke-linecap="round"
            opacity="0.9"/>
      <!-- Handle subtle bottom shadow edge -->
      <path d="M 166,182 C 166, 38 310, 36 310, 175"
            fill="none"
            stroke="#CFC8F2"
            stroke-width="6"
            stroke-linecap="round"
            opacity="0.6"/>

      <!-- Left Handle Grommet (Raised White 3D Donut Ring) -->
      <g transform="translate(168, 180)">
        <circle cx="0" cy="0" r="18" fill="url(#grommetGrad)" filter="drop-shadow(2px 4px 4px rgba(25,3,75,0.4))"/>
        <circle cx="0" cy="0" r="15" fill="none" stroke="#FFFFFF" stroke-width="3"/>
        <circle cx="0" cy="0" r="9" fill="#3D0B9C"/>
      </g>

      <!-- Right Handle Grommet (Raised White 3D Donut Ring) -->
      <g transform="translate(308, 172)">
        <circle cx="0" cy="0" r="18" fill="url(#grommetGrad)" filter="drop-shadow(2px 4px 4px rgba(25,3,75,0.4))"/>
        <circle cx="0" cy="0" r="15" fill="none" stroke="#FFFFFF" stroke-width="3"/>
        <circle cx="0" cy="0" r="9" fill="#3D0B9C"/>
      </g>
    </g>

    <!-- 5. ICONIC 3D EMBOSSED LETTER 'N' (Smooth, chunky, organic typography) -->
    <!-- Matches the exact thick, curved aesthetic of reference 9A97B94C-2A46-4A6C-BB69-9D4B64AC7601.png -->
    <g filter="url(#nDropShadow)">
      <!-- Main White 3D N Body -->
      <path d="M 154,232
               C 154,220 164,212 176,212
               C 188,212 198,220 198,232
               L 198,342
               L 268,224
               C 276,214 286,210 296,210
               C 308,210 316,218 318,230
               C 324,260 318,310 316,368
               C 315,384 303,396 288,396
               C 274,396 264,385 264,372
               L 265,286
               L 194,398
               C 187,408 176,412 166,412
               C 154,412 144,402 144,388
               L 146,242
               C 146,236 150,232 154,232 Z"
            fill="#FFFFFF"/>

      <!-- Smooth Top Soft Highlight overlay on 'N' -->
      <path d="M 152,238
               C 152,228 160,220 170,220
               L 190,220
               L 190,320
               L 272,216
               L 302,216
               C 310,216 314,222 316,232
               L 316,255
               L 262,342
               L 186,396
               L 152,380 Z"
            fill="#F8F7FF"
            opacity="0.85"/>

      <!-- Soft bottom shading on 'N' for 3D bevel look -->
      <path d="M 148,382 C 152,402 170,410 182,404 L 194,384 L 148,382 Z"
            fill="#DDD8F5"
            opacity="0.6"/>
      <path d="M 268,370 C 272,390 286,394 298,388 L 312,364 L 268,370 Z"
            fill="#DDD8F5"
            opacity="0.6"/>
    </g>
  </g>
</svg>
`;

  // Write favicon.svg (Vector SVG used directly by modern browsers)
  const faviconSvgPath = path.join(process.cwd(), 'public', 'favicon.svg');
  fs.writeFileSync(faviconSvgPath, svg.trim(), 'utf-8');
  console.log(`Updated vector favicon.svg at ${faviconSvgPath}`);

  // Write logo.svg (Used inside the application navigation and landing pages)
  const logoSvgPath = path.join(process.cwd(), 'public', 'logo.svg');
  fs.writeFileSync(logoSvgPath, svg.trim(), 'utf-8');
  console.log(`Updated vector logo.svg at ${logoSvgPath}`);

  // Generate multi-resolution PNGs:
  // 1. standard favicon.ico / favicon.png (32x32)
  await sharp(Buffer.from(svg))
    .resize(32, 32)
    .png()
    .toFile(path.join(process.cwd(), 'public', 'favicon-32x32.png'));

  // 2. favicon-192x192.png (PWA / Android standard)
  await sharp(Buffer.from(svg))
    .resize(192, 192)
    .png()
    .toFile(path.join(process.cwd(), 'public', 'favicon-192x192.png'));

  // 3. apple-touch-icon.png (180x180 for iOS)
  await sharp(Buffer.from(svg))
    .resize(180, 180)
    .png()
    .toFile(path.join(process.cwd(), 'public', 'apple-touch-icon.png'));

  // 4. favicon-512x512.png (High-res app icon)
  await sharp(Buffer.from(svg))
    .resize(512, 512)
    .png()
    .toFile(path.join(process.cwd(), 'public', 'favicon-512x512.png'));

  // 5. logo.png (512x512 PNG copy)
  await sharp(Buffer.from(svg))
    .resize(512, 512)
    .png()
    .toFile(path.join(process.cwd(), 'public', 'logo.png'));

  console.log('Successfully generated all favicon and app icon assets in /public!');
}

generateFaviconAndLogo().catch((err) => {
  console.error('Error generating favicon:', err);
  process.exit(1);
});
