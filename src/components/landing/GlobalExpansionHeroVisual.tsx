import React, { useState } from 'react';
import {
  Sparkles,
  Lock,
  Globe2,
  HelpCircle,
  Plane,
  Gift,
  Package,
  ArrowLeft,
  CheckCircle2,
  Bell,
  X,
  TrendingUp,
  MapPin,
  ShieldCheck,
  Send,
  Zap,
} from 'lucide-react';

export interface MysteryMarket {
  id: string;
  code: string;
  titleAr: string;
  mysteryTag: string;
  teaserAr: string;
  hintAr: string;
  approxDistance: string;
  marketSizePotential: string;
  logisticsReadiness: string;
  shippingMode: string;
  position: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
  };
  theme: 'royal-purple' | 'midnight-emerald' | 'imperial-amber' | 'deep-sapphire' | 'crimson-violet' | 'platinum-cyan' | 'rose-gold';
  animationClass: string;
}

export const MYSTERY_MARKETS: MysteryMarket[] = [
  {
    id: 'market-1',
    code: 'INTL-01',
    titleAr: 'سوق دولي مفاجأة #1',
    mysteryTag: 'وجهة سرية كبرى 🎁',
    teaserAr: 'بوابة تجارية ضخمة وسوق استهلاكي سريع النمو',
    hintAr: 'قوة شرائية عالية وملايين المتسوقين الرقميين مع رغبة متزايدة في المنتجات الحصرية',
    approxDistance: '~ 2,400 كم',
    marketSizePotential: '+45,000 طلب يومياً',
    logisticsReadiness: 'مكتمل بنسبة 85% (تجهيز الشحن الجوي COD)',
    shippingMode: 'شحن جوي سريع مع دفع عند الاستلام',
    position: { top: '8%', right: '12%' },
    theme: 'royal-purple',
    animationClass: 'animate-float-slow',
  },
  {
    id: 'market-2',
    code: 'INTL-02',
    titleAr: 'سوق دولي مفاجأة #2',
    mysteryTag: 'توسع إقليمي واعد 🎁',
    teaserAr: 'مركز تجاري إقليمي ناشط بمعدل تسليم استثنائي',
    hintAr: 'تسهيلات جمركية سلسة وطلب متضاعف على الأزياء، مستحضرات التجميل والأدوات المنزلية',
    approxDistance: '~ 1,950 كم',
    marketSizePotential: 'هامش ربح مضاعف لكل طلبية',
    logisticsReadiness: 'مكتمل بنسبة 70% (ربط شركات التوصيل المحلية)',
    shippingMode: 'توزيع فوري خلال 48 ساعة',
    position: { top: '12%', left: '10%' },
    theme: 'midnight-emerald',
    animationClass: 'animate-float-reverse',
  },
  {
    id: 'market-3',
    code: 'INTL-03',
    titleAr: 'سوق دولي مفاجأة #3',
    mysteryTag: 'سوق قاري صاعد 🎁',
    teaserAr: 'اقتصاد رقمي فتي ونمو قياسي في مبيعات التجارة الإلكترونية',
    hintAr: 'منافسة منخفضة جداً مع هوامش أرباح مرتفعة للمسوقين الرواد',
    approxDistance: '~ 3,200 كم',
    marketSizePotential: 'أكثر من 80 مليون مستهلك مستهدف',
    logisticsReadiness: 'المرحلة اللوجستية: مستودعات إقليمية مسبقة التخزين',
    shippingMode: 'شحن مباشر مع نظام تحصيل العملات',
    position: { bottom: '14%', left: '14%' },
    theme: 'imperial-amber',
    animationClass: 'animate-float-slow',
  },
  {
    id: 'market-4',
    code: 'INTL-04',
    titleAr: 'سوق دولي مفاجأة #4',
    mysteryTag: 'مركز اقتصادي متقدم 🎁',
    teaserAr: 'سوق عالمي عالي الكفاءة اللوجستية والدفع الفوري',
    hintAr: 'متوسط قيمة السلة الشرائية مرتفع جداً وقنوات تسويقية فعالة عبر تيك توك وسناب شات',
    approxDistance: '~ 4,100 كم',
    marketSizePotential: 'مبيعات بملايين الدولارات سنوياً',
    logisticsReadiness: 'المرحلة: الفحص القانوني والتراخيص',
    shippingMode: 'تأكيد آلي وشحن سريع ومؤمّن',
    position: { bottom: '12%', right: '14%' },
    theme: 'deep-sapphire',
    animationClass: 'animate-float-reverse',
  },
  {
    id: 'market-5',
    code: 'INTL-05',
    titleAr: 'سوق دولي مفاجأة #5',
    mysteryTag: 'وجهة استثنائية 🎁',
    teaserAr: 'سوق عالمي ذو قدرة شرائية قياسية ونظام COD محكم',
    hintAr: 'منتجات التجميل، الإكسسوارات والابتكارات المنزلية تحقق فيه أعلى معدلات تحويل',
    approxDistance: '~ 2,800 كم',
    marketSizePotential: 'أرباح مضاعفة بالعملات الصعبة',
    logisticsReadiness: 'المرحلة: توقيع عقود التحصيل المالي',
    shippingMode: 'تسليم معتمد بالدفع عند الاستلام',
    position: { top: '3%', left: '47%' },
    theme: 'crimson-violet',
    animationClass: 'animate-float-slow',
  },
  {
    id: 'market-6',
    code: 'INTL-06',
    titleAr: 'سوق دولي مفاجأة #6',
    mysteryTag: 'بوابة إقليمية كبرى 🎁',
    teaserAr: 'مركز تجاري حيوي وطلب متزايد على التجارة الإلكترونية',
    hintAr: 'تسهيلات لوجستية مباشرة مع إمكانية تحصيل المبالغ وتحويلها بنظام COD',
    approxDistance: '~ 2,650 كم',
    marketSizePotential: '+38,000 طلب شهرياً',
    logisticsReadiness: 'المرحلة: تجهيز الربط مع شركات التوزيع الإقليمية',
    shippingMode: 'شحن جوي سريع مع دفع عند الاستلام',
    position: { top: '44%', right: '5%' },
    theme: 'platinum-cyan',
    animationClass: 'animate-float-slow',
  },
  {
    id: 'market-7',
    code: 'INTL-07',
    titleAr: 'سوق دولي مفاجأة #7',
    mysteryTag: 'وجهة نوعية رائدة 🎁',
    teaserAr: 'سوق استهلاكي واعد بهوامش ربحية مرتفعة للمسوقين',
    hintAr: 'إقبال قياسي على المنتجات الحصرية والأجهزة المنزلية والعطور',
    approxDistance: '~ 3,450 كم',
    marketSizePotential: 'أرباح مضاعفة لكل مسوق مؤهل',
    logisticsReadiness: 'المرحلة: استكمال التراخيص اللوجستية',
    shippingMode: 'شحن مباشر وتأكيد آلي',
    position: { top: '44%', left: '5%' },
    theme: 'rose-gold',
    animationClass: 'animate-float-reverse',
  },
];

/**
 * Luxury 3D Algeria Globe Navigational Emblem
 * Designed with astronomical astrolabe rings, 3D spherical curvature,
 * ruby-red crescent & star, and realistic studio lighting.
 */
function LuxuryAlgeriaEmblem() {
  return (
    <div className="relative w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center transition-transform duration-500 hover:scale-105 select-none">
      {/* Outer Glow Halo */}
      <div className="absolute inset-0 rounded-full bg-radial from-emerald-500/25 via-purple-600/15 to-transparent blur-2xl pointer-events-none" />

      {/* SVG 3D Globe with Astrolabe Gyroscope Rings */}
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full drop-shadow-[0_12px_30px_rgba(0,0,0,0.35)]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Champagne Gold Gradient for Gyroscope Rings & Rim */}
          <linearGradient id="goldRimGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="25%" stopColor="#f59e0b" />
            <stop offset="50%" stopColor="#fbbf24" />
            <stop offset="75%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#78350f" />
          </linearGradient>

          {/* Platinum / Metallic Highlights */}
          <linearGradient id="platinumHighlight" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#fde68a" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.8" />
          </linearGradient>

          {/* Algerian Green 3D Spherical Gradient */}
          <radialGradient id="algeriaGreen3D" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#008844" />
            <stop offset="45%" stopColor="#006633" />
            <stop offset="85%" stopColor="#004724" />
            <stop offset="100%" stopColor="#002b15" />
          </radialGradient>

          {/* Pure Pearl White 3D Spherical Gradient */}
          <radialGradient id="algeriaWhite3D" cx="40%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="55%" stopColor="#f1f5f9" />
            <stop offset="85%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#94a3b8" />
          </radialGradient>

          {/* Ruby Red 3D Crescent & Star Gradient */}
          <linearGradient id="rubyRed3D" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff2a4b" />
            <stop offset="40%" stopColor="#d21034" />
            <stop offset="85%" stopColor="#9f0c25" />
            <stop offset="100%" stopColor="#5c0011" />
          </linearGradient>

          {/* Fresnel Glass Highlight Gradient */}
          <linearGradient id="glassGloss" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.75" />
            <stop offset="40%" stopColor="#ffffff" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          {/* Sphere Clip Path (radius 68px) */}
          <clipPath id="algeriaGlobeClip">
            <circle cx="100" cy="100" r="68" />
          </clipPath>
        </defs>

        {/* 1. Outer Astrolabe Gyroscope Ring (Tilted Orbital Coordinate) */}
        <ellipse
          cx="100"
          cy="100"
          rx="94"
          ry="32"
          fill="none"
          stroke="url(#goldRimGrad)"
          strokeWidth="1.2"
          strokeDasharray="4 3"
          className="animate-[spin_40s_linear_infinite]"
          opacity="0.6"
        />

        {/* 2. Outer Astrolabe Vertical Gyroscope Ring */}
        <ellipse
          cx="100"
          cy="100"
          rx="32"
          ry="94"
          fill="none"
          stroke="url(#goldRimGrad)"
          strokeWidth="1.2"
          strokeDasharray="4 3"
          className="animate-[spin_60s_linear_infinite_reverse]"
          opacity="0.5"
        />

        {/* 3. Shadow beneath sphere */}
        <ellipse
          cx="100"
          cy="186"
          rx="52"
          ry="8"
          fill="rgba(15,23,42,0.4)"
          className="blur-[4px]"
        />

        {/* 4. Luxury Chamfered Golden Rim Frame */}
        <circle
          cx="100"
          cy="100"
          r="72"
          fill="#1e1b4b"
          stroke="url(#goldRimGrad)"
          strokeWidth="3.5"
        />
        <circle
          cx="100"
          cy="100"
          r="69"
          fill="none"
          stroke="url(#platinumHighlight)"
          strokeWidth="1"
          opacity="0.7"
        />

        {/* 5. Clipped 3D Globe Body */}
        <g clipPath="url(#algeriaGlobeClip)">
          {/* Base Globe Fill */}
          <rect x="30" y="30" width="140" height="140" fill="#006633" />

          {/* Left Half: Green 3D Radial */}
          <path
            d="M 100,32 A 68,68 0 0,0 100,168 Z"
            fill="url(#algeriaGreen3D)"
          />

          {/* Right Half: White 3D Radial */}
          <path
            d="M 100,32 A 68,68 0 0,1 100,168 Z"
            fill="url(#algeriaWhite3D)"
          />

          {/* Subtle Curving Latitude Parallels */}
          <path
            d="M 36,80 Q 100,95 164,80"
            fill="none"
            stroke="rgba(255,255,255,0.22)"
            strokeWidth="0.8"
            strokeDasharray="2 2"
          />
          <path
            d="M 32,100 Q 100,118 168,100"
            fill="none"
            stroke="rgba(255,255,255,0.28)"
            strokeWidth="1"
          />
          <path
            d="M 36,120 Q 100,135 164,120"
            fill="none"
            stroke="rgba(255,255,255,0.22)"
            strokeWidth="0.8"
            strokeDasharray="2 2"
          />

          {/* Subtle Curving Longitude Meridian */}
          <path
            d="M 100,32 C 60,65 60,135 100,168"
            fill="none"
            stroke="rgba(0,0,0,0.15)"
            strokeWidth="0.8"
          />
          <path
            d="M 100,32 C 140,65 140,135 100,168"
            fill="none"
            stroke="rgba(0,0,0,0.08)"
            strokeWidth="0.8"
          />

          {/* 6. RED CRESCENT (Crafted with spherical elegance and gold rim) */}
          {/* Crescent Outer Edge */}
          <circle
            cx="100"
            cy="100"
            r="24"
            fill="url(#rubyRed3D)"
            stroke="#fbbf24"
            strokeWidth="0.6"
          />
          {/* Crescent Inner Mask Cutout */}
          <circle
            cx="106.8"
            cy="100"
            r="19.2"
            fill="url(#algeriaWhite3D)"
          />

          {/* 7. RED 5-POINT STAR (Positioned precisely inside crescent horns) */}
          <polygon
            points="
              103,88
              104.5,92.5 109,92.5
              105.5,95 106.8,99.5
              103,96.8
              99.2,99.5 100.5,95
              97,92.5 101.5,92.5
            "
            fill="url(#rubyRed3D)"
            stroke="#fbbf24"
            strokeWidth="0.5"
          />

          {/* 8. 3D Glass Specular Reflection Dome Highlight */}
          <path
            d="M 40,70 C 45,45 75,34 100,34 C 80,48 55,60 40,70 Z"
            fill="url(#glassGloss)"
          />
          <ellipse
            cx="75"
            cy="55"
            rx="20"
            ry="8"
            transform="rotate(-28 75 55)"
            fill="#ffffff"
            opacity="0.35"
          />
        </g>

        {/* 9. Golden Ring Bevel Overlap & Coordinates */}
        <circle
          cx="100"
          cy="100"
          r="68"
          fill="none"
          stroke="url(#goldRimGrad)"
          strokeWidth="1.5"
        />
        {/* Subtle North/South/East/West Navigation Studs */}
        <circle cx="100" cy="28" r="2" fill="#fef08a" />
        <circle cx="100" cy="172" r="2" fill="#fef08a" />
        <circle cx="28" cy="100" r="2" fill="#fef08a" />
        <circle cx="172" cy="100" r="2" fill="#fef08a" />
      </svg>
    </div>
  );
}

/**
 * Isometric Luxury Mystery Parcel Box Component
 * Rendered with isometric 3D geometry (Top, Left, Right faces),
 * realistic wrapping silk ribbons, vector metallic bow, and
 * a glowing holographic mystery question mark seal. NO childish emojis!
 */
interface IsometricGiftBoxProps {
  theme: MysteryMarket['theme'];
}

function IsometricMysteryGiftBox({ theme }: IsometricGiftBoxProps) {
  // Color presets for the luxury 3D faces
  const getThemePalette = () => {
    switch (theme) {
      case 'midnight-emerald':
        return {
          top: ['#059669', '#047857'],
          left: ['#047857', '#065f46'],
          right: ['#064e3b', '#022c22'],
          ribbon: ['#fef08a', '#eab308', '#ca8a04'],
          glow: 'rgba(16, 185, 129, 0.45)',
        };
      case 'imperial-amber':
        return {
          top: ['#d97706', '#b45309'],
          left: ['#b45309', '#92400e'],
          right: ['#78350f', '#451a03'],
          ribbon: ['#ffffff', '#f1f5f9', '#cbd5e1'],
          glow: 'rgba(245, 158, 11, 0.45)',
        };
      case 'deep-sapphire':
        return {
          top: ['#2563eb', '#1d4ed8'],
          left: ['#1d4ed8', '#1e40af'],
          right: ['#1e3a8a', '#172554'],
          ribbon: ['#fef08a', '#f59e0b', '#b45309'],
          glow: 'rgba(37, 99, 235, 0.45)',
        };
      case 'crimson-violet':
        return {
          top: ['#9333ea', '#7e22ce'],
          left: ['#7e22ce', '#6b21a8'],
          right: ['#581c87', '#3b0764'],
          ribbon: ['#fef08a', '#f59e0b', '#b45309'],
          glow: 'rgba(147, 51, 234, 0.45)',
        };
      case 'platinum-cyan':
        return {
          top: ['#0891b2', '#0e7490'],
          left: ['#0e7490', '#155e75'],
          right: ['#164e63', '#083344'],
          ribbon: ['#fef08a', '#fbbf24', '#d97706'],
          glow: 'rgba(6, 182, 212, 0.45)',
        };
      case 'rose-gold':
        return {
          top: ['#e11d48', '#be123c'],
          left: ['#be123c', '#9f1239'],
          right: ['#881337', '#4c0519'],
          ribbon: ['#fef08a', '#fbbf24', '#d97706'],
          glow: 'rgba(244, 63, 94, 0.45)',
        };
      case 'royal-purple':
      default:
        return {
          top: ['#7c3aed', '#6d28d9'],
          left: ['#6d28d9', '#5b21b6'],
          right: ['#4c1d95', '#2e1065'],
          ribbon: ['#fef08a', '#f59e0b', '#d97706'],
          glow: 'rgba(124, 58, 237, 0.5)',
        };
    }
  };

  const palette = getThemePalette();

  return (
    <div
      className="relative w-18 h-18 sm:w-22 sm:h-22 md:w-24 md:h-24 select-none pointer-events-none transition-all duration-500"
      style={{
        filter: `drop-shadow(0 12px 24px rgba(0,0,0,0.5)) drop-shadow(0 0 20px ${palette.glow})`,
      }}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Top Face Gradient */}
          <linearGradient id={`topFace-${theme}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={palette.top[0]} />
            <stop offset="100%" stopColor={palette.top[1]} />
          </linearGradient>

          {/* Left Face Gradient */}
          <linearGradient id={`leftFace-${theme}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={palette.left[0]} />
            <stop offset="100%" stopColor={palette.left[1]} />
          </linearGradient>

          {/* Right Face Gradient (In Shadow) */}
          <linearGradient id={`rightFace-${theme}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={palette.right[0]} />
            <stop offset="100%" stopColor={palette.right[1]} />
          </linearGradient>

          {/* Metallic Gold Ribbon Gradient */}
          <linearGradient id={`ribbonGrad-${theme}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={palette.ribbon[0]} />
            <stop offset="50%" stopColor={palette.ribbon[1]} />
            <stop offset="100%" stopColor={palette.ribbon[2]} />
          </linearGradient>

          {/* Neon Glow Filter for Question Mark */}
          <filter id={`neonGlow-${theme}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 1. Isometric Shadow Underneath */}
        <polygon
          points="50,86 82,72 50,62 18,72"
          fill="rgba(0,0,0,0.35)"
          className="blur-[2px]"
        />

        {/* 2. Left Face */}
        <polygon
          points="18,36 50,52 50,86 18,70"
          fill={`url(#leftFace-${theme})`}
        />

        {/* 3. Right Face (Darker Shadow) */}
        <polygon
          points="50,52 82,36 82,70 50,86"
          fill={`url(#rightFace-${theme})`}
        />

        {/* 4. Top Face (Illuminated diamond) */}
        <polygon
          points="50,20 82,36 50,52 18,36"
          fill={`url(#topFace-${theme})`}
          stroke="rgba(255,255,255,0.25)"
          strokeWidth="0.6"
        />

        {/* 5. Golden Silk Ribbons */}
        {/* Top Face - Ribbon Band 1 */}
        <polygon
          points="32,27 38,24 68,40 62,43"
          fill={`url(#ribbonGrad-${theme})`}
        />
        {/* Top Face - Ribbon Band 2 */}
        <polygon
          points="68,29 62,26 32,42 38,45"
          fill={`url(#ribbonGrad-${theme})`}
        />

        {/* Left Face - Vertical Ribbon Band */}
        <polygon
          points="32,43 38,46 38,80 32,77"
          fill={`url(#ribbonGrad-${theme})`}
        />

        {/* Right Face - Vertical Ribbon Band */}
        <polygon
          points="62,45 68,42 68,76 62,79"
          fill={`url(#ribbonGrad-${theme})`}
          opacity="0.85"
        />

        {/* 6. Realistic 3D Vector Ribbon Bow on Top (NO childish emojis) */}
        {/* Left Bow Loop */}
        <path
          d="M 50,20 C 35,9 33,16 47,21 Z"
          fill={`url(#ribbonGrad-${theme})`}
          stroke="#b45309"
          strokeWidth="0.4"
        />
        {/* Right Bow Loop */}
        <path
          d="M 50,20 C 65,9 67,16 53,21 Z"
          fill={`url(#ribbonGrad-${theme})`}
          stroke="#b45309"
          strokeWidth="0.4"
        />
        {/* Ribbon Bow Tails */}
        <path
          d="M 48,21 C 42,26 38,30 36,33 C 40,31 46,26 49,22 Z"
          fill={palette.ribbon[2]}
        />
        <path
          d="M 52,21 C 58,26 62,30 64,33 C 60,31 54,26 51,22 Z"
          fill={palette.ribbon[2]}
        />
        {/* Center Ribbon Knot */}
        <circle
          cx="50"
          cy="20.5"
          r="3"
          fill={`url(#ribbonGrad-${theme})`}
          stroke="#92400e"
          strokeWidth="0.5"
        />

        {/* 7. Precision Etched Glowing Holographic Question Mark (?) */}
        {/* Metallic Dark Seal Backing on front corner */}
        <circle
          cx="50"
          cy="68"
          r="10"
          fill="#090d16"
          stroke={`url(#ribbonGrad-${theme})`}
          strokeWidth="1.2"
        />
        <circle
          cx="50"
          cy="68"
          r="8.5"
          fill="none"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="0.5"
        />
        {/* Neon Question Mark */}
        <text
          x="50"
          y="73"
          textAnchor="middle"
          fill="#fef08a"
          fontSize="14"
          fontWeight="900"
          fontFamily="system-ui, -apple-system, sans-serif"
          filter={`url(#neonGlow-${theme})`}
        >
          ?
        </text>
      </svg>
    </div>
  );
}

interface GlobalExpansionHeroVisualProps {
  onNotifyMe?: (marketTitle: string) => void;
  onExploreMore?: () => void;
}

export function GlobalExpansionHeroVisual({
  onNotifyMe,
  onExploreMore,
}: GlobalExpansionHeroVisualProps) {
  return (
    <div className="relative w-full max-w-5xl mx-auto mt-6 sm:mt-10 select-none">
      {/* Background Radial Tech Lights & Nebula Aura */}
      <div className="absolute inset-0 -m-6 sm:-m-12 rounded-3xl bg-radial from-purple-500/10 via-indigo-950/5 to-transparent pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 sm:w-[500px] h-80 sm:h-[500px] bg-gradient-to-tr from-purple-600/15 via-indigo-600/10 to-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Orbit Stage Container - Pure, High-End Visual Stage with NO sentences */}
      <div className="relative h-[520px] sm:h-[620px] w-full rounded-3xl bg-gradient-to-b from-slate-900/90 via-slate-950/95 to-slate-950/90 backdrop-blur-2xl border border-purple-500/30 shadow-[0_20px_60px_rgba(15,23,42,0.6)] overflow-hidden flex items-center justify-center p-3 sm:p-6">
        
        {/* Subtle Technological Coordinate Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.18] pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, #a855f7 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />

        {/* Elliptical Orbital Track 1 (Inner Track) */}
        <div className="absolute w-[300px] h-[300px] sm:w-[390px] sm:h-[390px] rounded-full border border-dashed border-purple-400/35 pointer-events-none animate-[spin_90s_linear_infinite]" />

        {/* Elliptical Orbital Track 2 (Middle Track) */}
        <div className="absolute w-[410px] h-[410px] sm:w-[510px] sm:h-[510px] rounded-full border border-dashed border-indigo-400/25 pointer-events-none animate-[spin_130s_linear_infinite_reverse]" />

        {/* Elliptical Orbital Track 3 (Outer Horizon Track) */}
        <div className="absolute w-[490px] h-[490px] sm:w-[620px] sm:h-[620px] rounded-full border border-dotted border-purple-500/20 pointer-events-none" />

        {/* ================= CENTERPIECE: 3D ALGERIA GLOBE EMBLEM ================= */}
        <div className="relative z-20 flex flex-col items-center text-center">
          {/* Sonar Radar Waves Radiating from Algeria */}
          <div className="absolute w-36 h-36 sm:w-48 sm:h-48 rounded-full bg-emerald-500/15 animate-radar-pulse pointer-events-none" />
          <div className="absolute w-52 h-52 sm:w-68 sm:h-68 rounded-full border border-emerald-500/20 pointer-events-none" />
          <div className="absolute w-72 h-72 sm:w-92 sm:h-92 rounded-full border border-purple-500/15 pointer-events-none" />

          {/* Luxury 3D Algeria Navigational Astrolabe Emblem */}
          <LuxuryAlgeriaEmblem />
        </div>

        {/* ================= ORBITING 3D ISOMETRIC MYSTERY GIFT BOXES (Enlarged & Non-Clickable) ================= */}
        {MYSTERY_MARKETS.map((market) => (
          <div
            key={market.id}
            style={{
              position: 'absolute',
              ...market.position,
            }}
            className={`z-30 transition-all duration-500 pointer-events-none select-none ${market.animationClass}`}
          >
            {/* Pure Visual 3D Mystery Box (Non-Clickable) */}
            <div
              className="relative select-none pointer-events-none"
              aria-hidden="true"
            >
              <IsometricMysteryGiftBox
                theme={market.theme}
              />
            </div>
          </div>
        ))}

        {/* Orbit Flight trajectories connecting Algeria to mystery markets (Curved Bezier Paths) */}
        <svg
          viewBox="0 0 1000 600"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Glowing Trajectory Gradients */}
            <linearGradient id="curveGrad1" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.2" />
              <stop offset="60%" stopColor="#c084fc" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#e9d5ff" stopOpacity="1" />
            </linearGradient>

            <linearGradient id="curveGrad2" x1="100%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
              <stop offset="60%" stopColor="#34d399" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#a7f3d0" stopOpacity="1" />
            </linearGradient>

            <linearGradient id="curveGrad3" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.2" />
              <stop offset="60%" stopColor="#fbbf24" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#fef08a" stopOpacity="1" />
            </linearGradient>

            <linearGradient id="curveGrad4" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
              <stop offset="60%" stopColor="#60a5fa" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#bfdbfe" stopOpacity="1" />
            </linearGradient>

            <linearGradient id="curveGrad5" x1="50%" y1="100%" x2="50%" y2="0%">
              <stop offset="0%" stopColor="#ec4899" stopOpacity="0.2" />
              <stop offset="60%" stopColor="#f472b6" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#fbcfe8" stopOpacity="1" />
            </linearGradient>

            <linearGradient id="curveGrad6" x1="0%" y1="50%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#0891b2" stopOpacity="0.2" />
              <stop offset="60%" stopColor="#06b6d4" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#67e8f9" stopOpacity="1" />
            </linearGradient>

            <linearGradient id="curveGrad7" x1="100%" y1="50%" x2="0%" y2="50%">
              <stop offset="0%" stopColor="#e11d48" stopOpacity="0.2" />
              <stop offset="60%" stopColor="#f43f5e" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#fda4af" stopOpacity="1" />
            </linearGradient>

            <filter id="trajectoryGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* 1. Curved Flight Route 1: North-East (Arched Orbital Parabola) */}
          <path
            d="M 500,300 C 620,270 760,190 880,120"
            fill="none"
            stroke="url(#curveGrad1)"
            strokeWidth="3.5"
            opacity="0.3"
            filter="url(#trajectoryGlow)"
          />
          <path
            d="M 500,300 C 620,270 760,190 880,120"
            fill="none"
            stroke="url(#curveGrad1)"
            strokeWidth="1.6"
            strokeDasharray="6 7"
            className="animate-flight-dash"
          />

          {/* 2. Curved Flight Route 2: North-West */}
          <path
            d="M 500,300 C 380,270 240,200 130,150"
            fill="none"
            stroke="url(#curveGrad2)"
            strokeWidth="3.5"
            opacity="0.3"
            filter="url(#trajectoryGlow)"
          />
          <path
            d="M 500,300 C 380,270 240,200 130,150"
            fill="none"
            stroke="url(#curveGrad2)"
            strokeWidth="1.6"
            strokeDasharray="6 7"
            className="animate-flight-dash"
          />

          {/* 3. Curved Flight Route 3: South-West */}
          <path
            d="M 500,300 C 370,330 250,400 170,480"
            fill="none"
            stroke="url(#curveGrad3)"
            strokeWidth="3.5"
            opacity="0.3"
            filter="url(#trajectoryGlow)"
          />
          <path
            d="M 500,300 C 370,330 250,400 170,480"
            fill="none"
            stroke="url(#curveGrad3)"
            strokeWidth="1.6"
            strokeDasharray="6 7"
            className="animate-flight-dash"
          />

          {/* 4. Curved Flight Route 4: South-East */}
          <path
            d="M 500,300 C 630,330 750,410 830,490"
            fill="none"
            stroke="url(#curveGrad4)"
            strokeWidth="3.5"
            opacity="0.3"
            filter="url(#trajectoryGlow)"
          />
          <path
            d="M 500,300 C 630,330 750,410 830,490"
            fill="none"
            stroke="url(#curveGrad4)"
            strokeWidth="1.6"
            strokeDasharray="6 7"
            className="animate-flight-dash"
          />

          {/* 5. Curved Flight Route 5: North Center (Graceful Arc) */}
          <path
            d="M 500,300 C 470,210 535,130 500,60"
            fill="none"
            stroke="url(#curveGrad5)"
            strokeWidth="3.5"
            opacity="0.3"
            filter="url(#trajectoryGlow)"
          />
          <path
            d="M 500,300 C 470,210 535,130 500,60"
            fill="none"
            stroke="url(#curveGrad5)"
            strokeWidth="1.6"
            strokeDasharray="6 7"
            className="animate-flight-dash"
          />

          {/* 6. Curved Flight Route 6: Center-East (Mid-Right) */}
          <path
            d="M 500,300 C 650,330 800,310 930,290"
            fill="none"
            stroke="url(#curveGrad6)"
            strokeWidth="3.5"
            opacity="0.3"
            filter="url(#trajectoryGlow)"
          />
          <path
            d="M 500,300 C 650,330 800,310 930,290"
            fill="none"
            stroke="url(#curveGrad6)"
            strokeWidth="1.6"
            strokeDasharray="6 7"
            className="animate-flight-dash"
          />

          {/* 7. Curved Flight Route 7: Center-West (Mid-Left) */}
          <path
            d="M 500,300 C 350,330 200,310 70,290"
            fill="none"
            stroke="url(#curveGrad7)"
            strokeWidth="3.5"
            opacity="0.3"
            filter="url(#trajectoryGlow)"
          />
          <path
            d="M 500,300 C 350,330 200,310 70,290"
            fill="none"
            stroke="url(#curveGrad7)"
            strokeWidth="1.6"
            strokeDasharray="6 7"
            className="animate-flight-dash"
          />
        </svg>
      </div>
    </div>
  );
}
