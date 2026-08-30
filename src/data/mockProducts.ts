import { Product } from '../types';

export const MOCK_PRODUCTS: Product[] = [
  {
    "id": "prod-grooming-1",
    "nameAr": "VGR Professional Trimmer - ماكينة الحلاقة الاحترافية للتنعيم والتحديد",
    "nameFr": "Tondeuse Professionnelle VGR Precision",
    "categoryAr": "أدوات الحلاقة والتجميل",
    "categoryFr": "Outils de Rasage & Beauté",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://images.unsplash.com/photo-1621607512214-68297480165e?auto=format&fit=crop&q=80&w=600",
      "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=600"
    ],
    "wholesalePrice": 3200,
    "suggestedSellingPrice": 4800,
    "floorPrice": 4200,
    "ceilingPrice": 5800,
    "descriptionAr": "ماكينة الحلاقة والتحديد الاحترافية ذات المحرك القوي والشفرات الفولاذية الحادة المقاومة للصدأ. مثالية لتحديد اللحية والقص الدقيق وتنعيم الشعر بكل سهولة وأمان.",
    "descriptionFr": "Tondeuse de précision professionnelle avec lames en acier inoxydable et batterie lithium longue durée.",
    "featuresAr": [
      "شفرات فولاذية فائقة الحدة T-Blade",
      "بطارية ليثيوم تدوم حتى 120 دقيقة",
      "شحن سريع USB ورأس قابل للغسل",
      "تأتي مع 4 أمشاط قياس متدرجة"
    ],
    "featuresFr": [
      "Lames en acier inoxydable T-Blade",
      "Batterie Lithium 120 min d autonomie",
      "Charge rapide USB"
    ],
    "variants": [
      {
        "id": "var-groom-1-1",
        "size": "Gold Edition",
        "color": "Gold",
        "colorHex": "#eab308",
        "stockCount": 65
      },
      {
        "id": "var-groom-1-2",
        "size": "Black Edition",
        "color": "Black",
        "colorHex": "#0f172a",
        "stockCount": 40
      }
    ],
    "isBestSeller": true,
    "isNewArrival": true
  },
  {
    "id": "prod-grooming-2",
    "nameAr": "Philips OneBlade Hybrid Styler - ماكينة حلاقة وتحديد اللحية الهجينة",
    "nameFr": "Rasoir & Tondeuse Hybride Philips OneBlade",
    "categoryAr": "أدوات الحلاقة والتجميل",
    "categoryFr": "Outils de Rasage & Beauté",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&q=80&w=600"
    ],
    "wholesalePrice": 5400,
    "suggestedSellingPrice": 7500,
    "floorPrice": 6900,
    "ceilingPrice": 8500,
    "descriptionAr": "تقنية أون بليد الثورية المصممة لحلاقة وتشذيب وتحديد شعر الوجه بأي طول. تحمي البشرة من التهيج والجروح بفضل الحافة الواقية المزدوجة.",
    "descriptionFr": "Technologie révolutionnaire Philips OneBlade pour tailler, styliser et raser votre barbe en toute sécurité.",
    "featuresAr": [
      "حلاقة جافة أو رطبة مقاومة للماء 100%",
      "شفرة تدوم حتى 4 أشهر مع مؤشر استبدال",
      "حماية قصوى للبشرة الحساسة ضد التهيج"
    ],
    "featuresFr": [
      "Utilisation à sec ou sous la douche",
      "Protection optimale de la peau",
      "Lame double sens de coupe"
    ],
    "variants": [
      {
        "id": "var-groom-2-1",
        "size": "Pro Kit",
        "color": "Lime Green",
        "colorHex": "#84cc16",
        "stockCount": 35
      }
    ],
    "isBestSeller": true
  },
  {
  "id": "prod-teeth-1",
  "nameAr": "Crest 3D White Professional Effects - لصقات تبييض الأسنان الاحترافية",
  "nameFr": "Crest 3D White Professional Effects Whitening Strips",
  "categoryAr": "منتجات الأسنان",
  "categoryFr": "Soins Dentaires",
  "ageGroup": "general",
  "gender": "unisex",
  "images": [
    "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/S336e03adcba24c70a9f8fd00e6d8ac86n.webp?v=1765051906"
  ],
  "wholesalePrice": 3800,
  "suggestedSellingPrice": 5200,
  "floorPrice": 4800,
  "ceilingPrice": 6200,
  "descriptionAr": "شرائط تبييض الأسنان الاحترافية من كرست 3D White تمنحك ابتسامة ناصعة البياض ونتائج تدوم طويلاً مثل التبييض عند الطبيب.",
  "descriptionFr": "Bandes blanchissantes Crest 3D White pour un sourire éclatant et blanc dès les premières utilisations.",
  "featuresAr": [
    "تبييض إحترافي مضمون",
    "آمن على ميناء الأسنان",
    "نتائج سريعة خلال أيام"
  ],
  "featuresFr": [
    "Blanchiment professionnel",
    "Sûr pour l email",
    "Résultats rapides"
  ],
  "variants": [
    {
      "id": "var-teeth-1-1",
      "size": "20 لصقة",
      "color": "Original",
      "colorHex": "#38bdf8",
      "stockCount": 40
    }
  ],
  "isBestSeller": true
},
  {
  "id": "prod-teeth-2",
  "nameAr": "Sensodyne Repair & Protect - معجون أسنان لترميم الأسنان الحساسة 75ml",
  "nameFr": "Sensodyne Repair & Protect Toothpaste 75ml",
  "categoryAr": "منتجات الأسنان",
  "categoryFr": "Soins Dentaires",
  "ageGroup": "general",
  "gender": "unisex",
  "images": [
    "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/S336e03adcba24c70a9f8fd00e6d8ac86n.webp?v=1765051906"
  ],
  "wholesalePrice": 850,
  "suggestedSellingPrice": 1250,
  "floorPrice": 1100,
  "ceilingPrice": 1500,
  "descriptionAr": "معجون سنسوداين لترميم وحماية الأسنان الحساسة بتركيبة النوفامين المثبتة علمياً لإغلاق الثقوب المجهرية وتقوية اللثة.",
  "descriptionFr": "Dentifrice Sensodyne Repair & Protect pour soulager la sensibilité dentaire et protéger l email au quotidien.",
  "featuresAr": [
    "ترميم ميناء الأسنان",
    "حماية من الحساسية 24/7",
    "إنعاش النفس"
  ],
  "featuresFr": [
    "Soulagement sensibilité",
    "Protection longue durée",
    "Haleine fraîche"
  ],
  "variants": [
    {
      "id": "var-teeth-2-1",
      "size": "75ml",
      "color": "Original",
      "colorHex": "#0284c7",
      "stockCount": 80
    }
  ],
  "isNewArrival": true
},
  {
  "id": "prod-teeth-3",
  "nameAr": "Oral-B Pro 3 3000 - فرشاة أسنان كهربائية قابلة للشحن",
  "nameFr": "Oral-B Pro 3 Electric Rechargeable Toothbrush",
  "categoryAr": "منتجات الأسنان",
  "categoryFr": "Soins Dentaires",
  "ageGroup": "general",
  "gender": "unisex",
  "images": [
    "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/S336e03adcba24c70a9f8fd00e6d8ac86n.webp?v=1765051906"
  ],
  "wholesalePrice": 4500,
  "suggestedSellingPrice": 6500,
  "floorPrice": 5900,
  "ceilingPrice": 7800,
  "descriptionAr": "فرشاة أورال بي الكهربائية ثلاثية الأبعاد تنظف 100% أكثر من الفرشاة اليدوية مع مستشعر ضغط لحماية اللثة.",
  "descriptionFr": "Brosse à dents électrique Oral-B Pro 3 avec contrôle de la pression sur les gencives et minuteur intégré.",
  "featuresAr": [
    "تنظيف دقيق 3D",
    "مستشعر ضغط اللثة",
    "مؤقت 2 دقيقة"
  ],
  "featuresFr": [
    "Nettoyage 3D",
    "Capteur de pression",
    "Minuteur 2 min"
  ],
  "variants": [
    {
      "id": "var-teeth-3-1",
      "size": "Standard",
      "color": "White",
      "colorHex": "#f8fafc",
      "stockCount": 25
    }
  ],
  "isBestSeller": true
},
  {
  "id": "prod-hair-1",
  "nameAr": "Kérastase Elixir Ultime - زيت الشعر الفاخر للتغذية واللمعان 100ml",
  "nameFr": "Kérastase Elixir Ultime L Huile Originale 100ml",
  "categoryAr": "منتجات الشعر",
  "categoryFr": "Soins Cheveux",
  "ageGroup": "general",
  "gender": "unisex",
  "images": [
    "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/IMG-6917.jpg?v=1785196392"
  ],
  "wholesalePrice": 4200,
  "suggestedSellingPrice": 5900,
  "floorPrice": 5400,
  "ceilingPrice": 6900,
  "descriptionAr": "زيت كيراستاس الفاخر المعزز بأربعة زيوت ثمينة يغذي الشعر، يمنحه لمعاناً كالحرير ويحميه من الحرارة حتى 230 درجة.",
  "descriptionFr": "Huile capillaire sublimatrice Kérastase Elixir Ultime pour une brillance intense et une protection thermique.",
  "featuresAr": [
    "لمعان حريري ساحر",
    "حماية من حرارة السشوار",
    "تغذية عميقة للأطراف"
  ],
  "featuresFr": [
    "Brillance intense",
    "Protection thermique",
    "Nutrition profonde"
  ],
  "variants": [
    {
      "id": "var-hair-1-1",
      "size": "100ml",
      "color": "Gold",
      "colorHex": "#eab308",
      "stockCount": 35
    }
  ],
  "isBestSeller": true
},
  {
  "id": "prod-hair-2",
  "nameAr": "Olaplex No. 3 Hair Perfector - معالج وترميم روابط الشعر التالف 100ml",
  "nameFr": "Olaplex No. 3 Hair Perfector Treatment 100ml",
  "categoryAr": "منتجات الشعر",
  "categoryFr": "Soins Cheveux",
  "ageGroup": "general",
  "gender": "unisex",
  "images": [
    "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/IMG-6917.jpg?v=1785196392"
  ],
  "wholesalePrice": 3600,
  "suggestedSellingPrice": 4900,
  "floorPrice": 4500,
  "ceilingPrice": 5800,
  "descriptionAr": "علاج أولابليكس رقم 3 الشهير عالمياً يجدد ويرمم روابط الشعر المكسورة نتيجة الصبغات والحرارة ويعيد إحيائه من الجذور.",
  "descriptionFr": "Soin réparateur Olaplex N°3 pour rétablir les liaisons capillaires brisées et renforcer la fibre.",
  "featuresAr": [
    "ترميم وتجديد روابط الشعر",
    "يقوي الشعر المصبوغ",
    "نتائج مذهلة من أول استخدام"
  ],
  "featuresFr": [
    "Réparation des ponts",
    "Fortifie les cheveux colorés",
    "Action visible"
  ],
  "variants": [
    {
      "id": "var-hair-2-1",
      "size": "100ml",
      "color": "White",
      "colorHex": "#ffffff",
      "stockCount": 45
    }
  ],
  "isNewArrival": true
},
  {
  "id": "prod-hair-3",
  "nameAr": "L Oreal Absolut Repair Shampoo - شامبو إصلاح الشعر التالف والجاف 300ml",
  "nameFr": "L Oreal Professionnel Absolut Repair Shampoo 300ml",
  "categoryAr": "منتجات الشعر",
  "categoryFr": "Soins Cheveux",
  "ageGroup": "general",
  "gender": "unisex",
  "images": [
    "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/IMG-6917.jpg?v=1785196392"
  ],
  "wholesalePrice": 1800,
  "suggestedSellingPrice": 2600,
  "floorPrice": 2300,
  "ceilingPrice": 3100,
  "descriptionAr": "شامبو لوريال ابسولوت ريبير بالبروتين والكينوا الذهبية ينظف ويرمم الشعر التالف ويقلل التقصف بنسبة 77%.",
  "descriptionFr": "Shampooing restructurant L Oréal Professionnel Absolut Repair infusé à la protéine de quinoa d or.",
  "featuresAr": [
    "إصلاح 77% من تلف الشعر",
    "نعومة فائقة بدون إثقال",
    "تركيبة احترافية"
  ],
  "featuresFr": [
    "Répare les dommages",
    "Toucher léger",
    "Formule pro"
  ],
  "variants": [
    {
      "id": "var-hair-3-1",
      "size": "300ml",
      "color": "Gold",
      "colorHex": "#ca8a04",
      "stockCount": 60
    }
  ],
  "isBestSeller": true
},
  
  {
    "id": "prod-7716198154334",
    "nameAr": "Daylong Extrême - Lait solaire liposomal SPF50+ 100ml",
    "nameFr": "Daylong Extrême - Lait solaire liposomal SPF50+ 100ml",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/IMG-6929.png?v=1785197156",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/IMG-6930.png?v=1785197156"
    ],
    "wholesalePrice": 2650,
    "suggestedSellingPrice": 3650,
    "floorPrice": 3150,
    "ceilingPrice": 4650,
    "descriptionAr": "⸻\n\n✨ أساسيات العناية اليومية بأسعار ما تتفوتش! ✨\n\n💙 منتجات أصلية وجودة معروفة، باش تبقي منتعشة وتهتمي ببشرتك كل يوم.\n\n🧴 NIVEA Soft\n💰 500 دج فقط\n✔️ ترطيب سريع للوجه، اليدين والجسم.\n✔️ قوام خفيف وما يخليش إحساس دهني.\n\n💙 NIVEA Creme\n💰 800 دج فقط\n✔️ ترطيب عميق للبشرة الجافة.\n✔️ مثالي للاستعمال اليومي.\n\n🌸 Rexona Women Invisible\n💰 550 دج فقط\n✔️ حماية حتى 48 ساعة من التعرق والروائح.\n✔️ ما يخليش بقع على الملابس.\n\n🚚 التوصيل متوفر إلى جميع الولايات\n💵 الدفع عند الاستلام\n📦 الكمية محدودة",
    "descriptionFr": "Le Lait Solaire Liposomal SPF50+ de la gamme DAYLONG™ Extrême est un soin pour le visage et le corps, à la texture velouté lait et non grasse, sans effet collant, avec une très haute protection solaire qui convient parfaitement aux peaux les plus sensibles (allergiques ou intolérantes) au soleil, co...",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7716198154334-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": true,
    "isBestSeller": true
  },
  {
    "id": "prod-7716198088798",
    "nameAr": "Vaseline Gluta-Hya Dewy Radiance Lotion Hydratante Serum Burst avec Antioxydants pour une Peau Douce et Radieuse, 300ml",
    "nameFr": "Vaseline Gluta-Hya Dewy Radiance Lotion Hydratante Serum Burst avec Antioxydants pour une Peau Douce et Radieuse, 300ml",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/IMG-6922.jpg?v=1785196715",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/IMG-6923.jpg?v=1785196715",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/IMG-6924.jpg?v=1785196715",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/IMG-6925.jpg?v=1785196715",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/IMG-6926.jpg?v=1785196715"
    ],
    "wholesalePrice": 1300,
    "suggestedSellingPrice": 2300,
    "floorPrice": 1800,
    "ceilingPrice": 3300,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (Vaseline). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "À propos de la lotion Vaseline Gluta-Hya Dewy Radiance Serum Burst : Obtenez une peau éclatante et visiblement saine avec la lotion Vaseline Gluta-Hya Dewy Radiance Serum Burst. Sa formule unique, enrichie par la technologie GlutaGlow**, contient des antioxydants dix fois plus puissants que la vitam...",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7716198088798-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": true,
    "isBestSeller": false
  },
  {
    "id": "prod-7716197859422",
    "nameAr": "Eucerin ANTI-PIGMENT Crème Corps pour Zones Ciblées 200 ml",
    "nameFr": "Eucerin ANTI-PIGMENT Crème Corps pour Zones Ciblées 200 ml",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/IMG-6917.jpg?v=1785196392",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/IMG-6918.jpg?v=1785196391",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/IMG-6919.jpg?v=1785196391",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/IMG-6920.jpg?v=1785196391",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/IMG-6921.png?v=1785196391"
    ],
    "wholesalePrice": 6300,
    "suggestedSellingPrice": 7300,
    "floorPrice": 6800,
    "ceilingPrice": 8300,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (Eucerin). ينتمي لفئة منتجات الشعر، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "Une crème pour le corps qui atténue les taches pigmentaires et réduit la peau épaissie sur les zones de friction (genoux, coudes). Le Thiamidol® réduit les taches pigmentaires et unifie le teint. L'association d'Acide Lactique et de Dexpanthénol exfolie en douceur, lisse et régénère la peau.",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7716197859422-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": true,
    "isBestSeller": false
  },
  {
    "id": "prod-7716197531742",
    "nameAr": "LA ROCHE POSAY Anthelios UV Air Stick SPF 50+ stick solaire Vitaminé transparent",
    "nameFr": "LA ROCHE POSAY Anthelios UV Air Stick SPF 50+ stick solaire Vitaminé transparent",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/IMG-6916.jpg?v=1785196123"
    ],
    "wholesalePrice": 1700,
    "suggestedSellingPrice": 2700,
    "floorPrice": 2200,
    "ceilingPrice": 3700,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (LA). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "Découvrez le stick solaire Anthelios UVAIR d e La Roche-Posay , conçu pour offrir une protection optimale contre les rayons UVA et UVB. Sa formule innovante, enrichie en Vitamine E et Astaxanthine , hydrate et protège la peau des agressions extérieures. Ce stick léger comme l'air s'applique facileme...",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7716197531742-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": true,
    "isBestSeller": true
  },
  {
    "id": "prod-7716130947166",
    "nameAr": "La Roche-Posay\nAnthelios UVsport Stick Pro-Resistance SPF50+ 10 ml",
    "nameFr": "La Roche-Posay\nAnthelios UVsport Stick Pro-Resistance SPF50+ 10 ml",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/IMG-6911.webp?v=1785195785",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/IMG-6912.webp?v=1785195785",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/IMG-6913.webp?v=1785195785",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/IMG-6914.webp?v=1785195785"
    ],
    "wholesalePrice": 900,
    "suggestedSellingPrice": 1900,
    "floorPrice": 1400,
    "ceilingPrice": 2900,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (La). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "La Roche-Posay Anthelios UVsport Stick Pro-Resistance SPF50+ 10 ml est idéal pour une protection solaire haute performance lors des activités physiques intenses. Enrichi en Mexoryl 400 et en vitamine E, il assure une très haute protection UVA/UVB tout en aidant à préserver la peau des agressions ext...",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7716130947166-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": true,
    "isBestSeller": false
  },
  {
    "id": "prod-7716120035422",
    "nameAr": "Eucerin Oil Control Sun Gel Crème Spf50+ 200ml",
    "nameFr": "Eucerin Oil Control Sun Gel Crème Spf50+ 200ml",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/IMG-6894.png?v=1785176012"
    ],
    "wholesalePrice": 2900,
    "suggestedSellingPrice": 3900,
    "floorPrice": 3400,
    "ceilingPrice": 4900,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (Eucerin). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "Gel-crème solaire SPF50+ spécialement formulé pour les peaux grasses et à tendance acnéique. Offre une protection très haute contre les UVA/UVB et la lumière visible (HEVL) grâce à la technologie Advanced Spectral Technology. Contient de la Licochalcone A antioxydante qui neutralise les radicaux lib...",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7716120035422-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": true,
    "isBestSeller": false
  },
  {
    "id": "prod-7713622687838",
    "nameAr": "CeraVe Invisible Mineral Face Sunscreen SPF 50 1.75 fl. oz.(52ml)",
    "nameFr": "CeraVe Invisible Mineral Face Sunscreen SPF 50 1.75 fl. oz.(52ml)",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/6AC2CB87-C598-4192-A93D-103617B09424.jpg?v=1784763395"
    ],
    "wholesalePrice": 1600,
    "suggestedSellingPrice": 2600,
    "floorPrice": 2100,
    "ceilingPrice": 3600,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (CeraVe). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "100% invisible and weightless application against UVB + UVA with 24 hour hydration. Invisible and weightless protection suitable for all skin types and tones, including sensitive and acne-prone skin, and ages 18+ years old. Dermatologist tested for safety. Alcohol free, fragrance free, and non-comed...",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7713622687838-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": true,
    "isBestSeller": true
  },
  {
    "id": "prod-7713619378270",
    "nameAr": "Anti-Pigment Eucerin Gel Nettoyant –Visage 400 ml",
    "nameFr": "Anti-Pigment Eucerin Gel Nettoyant –Visage 400 ml",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/69B53F1D-21AC-43D6-B4C4-84A7FF4FBD20.webp?v=1784763047"
    ],
    "wholesalePrice": 2900,
    "suggestedSellingPrice": 3900,
    "floorPrice": 3400,
    "ceilingPrice": 4900,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (Anti-Pigment). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "Type de produit : Gel nettoyant exfoliant visage Marque : Eucerin Contenance : 400 ml Type de peau : Tous types de peau, même sensibles Quand l’utiliser : Matin et soir, avant le sérum et la crème Gel nettoyant visage unifiant, à base d’AHA doux et de gluco-glycérol. Pour un teint lumineux, hydraté ...",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7713619378270-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": true,
    "isBestSeller": false
  },
  {
    "id": "prod-7713602535518",
    "nameAr": "Vaseline Healthy Bright Gluta-Hya Serum Burst UV Lotion Flawless Bright.",
    "nameFr": "Vaseline Healthy Bright Gluta-Hya Serum Burst UV Lotion Flawless Bright.",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/IMG-6723.jpg?v=1784760357",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/IMG-6725.png?v=1784761227",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/IMG-6726.png?v=1784761227",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/IMG-6727.png?v=1784761227"
    ],
    "wholesalePrice": 1500,
    "suggestedSellingPrice": 2500,
    "floorPrice": 2000,
    "ceilingPrice": 3500,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (Vaseline). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "Depuis plus de 150 ans, Vaseline se passionne pour la guérison de la peau et s’engage à assurer une peau heureuse, chaque jour, pour tous. Nous croyons que « Une peau saine est une belle peau », ce qui vous aide à faire face aux exigences de la vie. Vaseline Gluta Hya est une gamme de produits révol...",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7713602535518-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": true,
    "isBestSeller": false
  },
  {
    "id": "prod-7640601985118",
    "nameAr": "Eucerin Face Sunscreen Even Perfector Pigment Control Sun Fluid with Thiamidol, High UVA/UVB Protection, SPF50+, Reduces Spots for Uneven Skin Tone, 50ml’",
    "nameFr": "Eucerin Face Sunscreen Even Perfector Pigment Control Sun Fluid with Thiamidol, High UVA/UVB Protection, SPF50+, Reduces Spots for Uneven Skin Tone, 50ml’",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/71suctXC-IL._AC_SL1500.jpg?v=1778338568"
    ],
    "wholesalePrice": 2350,
    "suggestedSellingPrice": 3350,
    "floorPrice": 2850,
    "ceilingPrice": 4350,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (Eucerin). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "Eucerin Face Sunscreen Even Perfector Pigment Control Sun Fluid with Thiamidol, High UVA/UVB Protection, SPF50+, Reduces Spots for Uneven Skin Tone, 50ml’ - Soin de beauté et de santé authentique.",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7640601985118-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": true,
    "isBestSeller": true
  },
  {
    "id": "prod-7640601460830",
    "nameAr": "Eucerin Oil Control Face Sun Gel-Creme LSF 50+, 50 ml Cream",
    "nameFr": "Eucerin Oil Control Face Sun Gel-Creme LSF 50+, 50 ml Cream",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/71TA9bzO0nL._AC_SY300_SX300_QL70_ML2.jpg?v=1778338210"
    ],
    "wholesalePrice": 2150,
    "suggestedSellingPrice": 3150,
    "floorPrice": 2650,
    "ceilingPrice": 4150,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (Eucerin). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "Eucerin Oil Control Face Sun Gel Cream SPF 50+ 50ml - Fast Absorbing Sunscreen with Dry Touch for Oily Skin The Eucerin Sun Protection range offers effective protection against sun damage in various formulations to meet the needs of different skin types. The Eucerin Oil Control 50+ face sunscreen ha...",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7640601460830-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": true,
    "isBestSeller": false
  },
  {
    "id": "prod-7587843440734",
    "nameAr": "ANTI-PIGMENT Sérum Duo",
    "nameFr": "ANTI-PIGMENT Sérum Duo",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/IMG-6728.webp?v=1784763821"
    ],
    "wholesalePrice": 6400,
    "suggestedSellingPrice": 7400,
    "floorPrice": 6900,
    "ceilingPrice": 8400,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (ANTI-PIGMENT). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "Eucerin Anti-Pigment Night Care Dark Spots 50ml هو كريم ليلي يوفر تجديدًا للبشرة خلال الليل مما يؤدي إلى بشرة أكثر نضارة وإشراقًا. وصف المنتج Eucerin Anti-Pigment Night Care Dark Spots 50ml كريم ليلي مجدد للبشرة يساعد في تقليل البقع الداكنة ومنع ظهورها مرة أخرى. يحتوي ، كمكون نجمي ، Thiamidol. عنصر ...",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7587843440734-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": true,
    "isBestSeller": false
  },
  {
    "id": "prod-7565565198430",
    "nameAr": "Medicube PDRN PINK CICA SOOTHING TONER 250 ml",
    "nameFr": "Medicube PDRN PINK CICA SOOTHING TONER 250 ml",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/medi1.webp?v=1770049252",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/medi2.jpg?v=1770049252",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/medi3.webp?v=1770049252",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/medi4.webp?v=1770049252"
    ],
    "wholesalePrice": 3700,
    "suggestedSellingPrice": 4700,
    "floorPrice": 4200,
    "ceilingPrice": 5700,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (Medicube). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "Medicube PDRN PINK CICA SOOTHING TONER 250 ml - Soin de beauté et de santé authentique.",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7565565198430-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": true,
    "isBestSeller": true
  },
  {
    "id": "prod-7565563101278",
    "nameAr": "medicube - PDRN Pink Peptide Eye Cream 30ml",
    "nameFr": "medicube - PDRN Pink Peptide Eye Cream 30ml",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/05-29-2025_0225pmf048bfc601ddac58d19d_1c1e63c2-aead-4f54-9ac7-452b35f4f706.webp?v=1770048515",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/05-29-2025_0225pm969de97975be2deae301_5bbe3a62-6c0c-40ea-8c4c-0e638ac3a93d.webp?v=1770048515",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/05-29-2025_0225pm718472a6e4ae5d711771_9d416ed5-1fd9-40b8-abbd-8b97645cf7ce.webp?v=1770048511"
    ],
    "wholesalePrice": 2900,
    "suggestedSellingPrice": 3900,
    "floorPrice": 3400,
    "ceilingPrice": 4900,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (medicube). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "medicube - PDRN Pink Peptide Eye Cream 30ml - Soin de beauté et de santé authentique.",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7565563101278-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": true,
    "isBestSeller": false
  },
  {
    "id": "prod-7555007545438",
    "nameAr": "Medicube Zero Pore Pad / Mild (70 pads)",
    "nameFr": "Medicube Zero Pore Pad / Mild (70 pads)",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/9e3a596c-9e5f-47e5-8397-7d408114b742.webp?v=1768599638",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/30035b0c-96a1-4f54-9b79-c7ea29894adc.webp?v=1768599638",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/cf217bf9-dcc2-400f-a8d1-9f56ef932028.webp?v=1768599638",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/MCUB-414315_NEW202504_2__website_1024x1024_e5502c3f-90c1-4e47-9f63-5b6a7e3ddf24.webp?v=1768599638",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/mild.webp?v=1768599638",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/mild_1.webp?v=1768599638",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/mild_2.webp?v=1768599638"
    ],
    "wholesalePrice": 3300,
    "suggestedSellingPrice": 4300,
    "floorPrice": 3800,
    "ceilingPrice": 5300,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (Medicube). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "\\",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7555007545438-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": true,
    "isBestSeller": false
  },
  {
    "id": "prod-7555007021150",
    "nameAr": "SH SAKORA Shampoo 300ml",
    "nameFr": "SH SAKORA Shampoo 300ml",
    "categoryAr": "منتجات الشعر",
    "categoryFr": "Soins Cheveux",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/sa1.webp?v=1768598980",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/sa2.webp?v=1768598980",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/sa3.webp?v=1768598980",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/sa4.webp?v=1768598980",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/sa5.webp?v=1768598980",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/sa6.webp?v=1768598980"
    ],
    "wholesalePrice": 1000,
    "suggestedSellingPrice": 2000,
    "floorPrice": 1500,
    "ceilingPrice": 3000,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (SH). ينتمي لفئة منتجات الشعر، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "SH SAKORA Shampoo 300ml - Soin de beauté et de santé authentique.",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7555007021150-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": false,
    "isBestSeller": true
  },
  {
    "id": "prod-7555006300254",
    "nameAr": "ANUA 100+ PDRN Hyaluronic Acid Capsule Serum",
    "nameFr": "ANUA 100+ PDRN Hyaluronic Acid Capsule Serum",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/100.webp?v=1768598630",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/102.webp?v=1768598630",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/104.webp?v=1768598630",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/105.webp?v=1768598631",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/106.webp?v=1768598630",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/107.webp?v=1768598630"
    ],
    "wholesalePrice": 3200,
    "suggestedSellingPrice": 4200,
    "floorPrice": 3700,
    "ceilingPrice": 5200,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (ANUA). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "ANUA 100+ PDRN Hyaluronic Acid Capsule Serum - Soin de beauté et de santé authentique.",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7555006300254-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": false,
    "isBestSeller": false
  },
  {
    "id": "prod-7555005939806",
    "nameAr": "Anua 10+ Azelaic acid 10+ hyaluron",
    "nameFr": "Anua 10+ Azelaic acid 10+ hyaluron",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/10_62eb9484-0f65-4357-a70b-0914f3c2671e.webp?v=1768598464",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/11.webp?v=1768598464",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/13.webp?v=1768598464"
    ],
    "wholesalePrice": 3200,
    "suggestedSellingPrice": 4200,
    "floorPrice": 3700,
    "ceilingPrice": 5200,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (Anua). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "Anua 10+ Azelaic acid 10+ hyaluron - Soin de beauté et de santé authentique.",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7555005939806-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": false,
    "isBestSeller": false
  },
  {
    "id": "prod-7555001942110",
    "nameAr": "Anua Niacinamide 10% + TXA 4% Dark Spot Correcting Serum",
    "nameFr": "Anua Niacinamide 10% + TXA 4% Dark Spot Correcting Serum",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/anua1_80dfcdc4-516e-411f-9899-9b2aad1e6896.webp?v=1768596436",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/anua2_017f1b7f-683e-4274-825a-5dbb94cb3df2.webp?v=1768596436",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/anua3_8ea10d50-e123-4c14-a565-71296d9451f5.webp?v=1768596436",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/anua4_fda09cf4-952e-4381-bb52-66c30209f7e3.webp?v=1768596436",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/anua5.webp?v=1768596436"
    ],
    "wholesalePrice": 3200,
    "suggestedSellingPrice": 4200,
    "floorPrice": 3700,
    "ceilingPrice": 5200,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (Anua). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "Anua Niacinamide 10% + TXA 4% Dark Spot Correcting Serum - Soin de beauté et de santé authentique.",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7555001942110-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": false,
    "isBestSeller": true
  },
  {
    "id": "prod-7525091049566",
    "nameAr": "معجون أسنان Niacinamide Whitening Toothpaste",
    "nameFr": "معجون أسنان Niacinamide Whitening Toothpaste",
    "categoryAr": "منتجات الأسنان",
    "categoryFr": "Soins Dentaires",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/IMG_8893.png?v=1766413333",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/efdre.png?v=1766413350"
    ],
    "wholesalePrice": 2100,
    "suggestedSellingPrice": 3100,
    "floorPrice": 2600,
    "ceilingPrice": 4100,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (معجون). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "معجون أسنان Niacinamide Whitening Toothpaste - Soin de beauté et de santé authentique.",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7525091049566-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": false,
    "isBestSeller": false
  },
  {
    "id": "prod-7524684005470",
    "nameAr": "Bioderma Pigmentbio Sensitive Areas 75mL",
    "nameFr": "Bioderma Pigmentbio Sensitive Areas 75mL",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/IMG-8881.jpg?v=1766261916",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/IMG-8882.jpg?v=1766261916",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/IMG-8883.jpg?v=1766261916"
    ],
    "wholesalePrice": 5250,
    "suggestedSellingPrice": 6250,
    "floorPrice": 5750,
    "ceilingPrice": 7250,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (Bioderma). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "تفاصيل لمناطق البشرة التي يؤدي فيها الاحتكاك، الشمع والملابس إلى تغير لونها لتصبح داكنة بمرور الوقت (الركبتين والمرفقين والعنق والإبطين والفخذين) ، طورت \"بايودرما\" منتجًا محددًا لتفتيح البشرة وتنظيفها. يعمل هذا المستحضر بشكل فعال على فرط التصبغ ويؤمن تحمل جيد للغاية ، بحيث يمكن استخدامه في المناطق ا...",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7524684005470-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": false,
    "isBestSeller": false
  },
  {
    "id": "prod-7524683710558",
    "nameAr": "AXIS-Y Vegan Collagen Eye Serum 10 ML",
    "nameFr": "AXIS-Y Vegan Collagen Eye Serum 10 ML",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/IMG-8880.jpg?v=1766261744",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/IMG-8879.jpg?v=1766261746"
    ],
    "wholesalePrice": 2600,
    "suggestedSellingPrice": 3600,
    "floorPrice": 3100,
    "ceilingPrice": 4600,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (AXIS-Y). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "وصف المنتج \"منتج أصلي 100%\" سيروم الكولاجين النباتي للهالات تحت العين من AXIS-Y هو منتج مثالي لمكافحة الهالات السوداء وتجاعيد تحت العين. يحتوي على الكولاجين النباتي الذي يساعد في تعزيز مرونة البشرة وتنعيمها، كما أنه غني بمكونات طبيعية مهدئة تعزز ترطيب البشرة وتقويتها. بفضل تركيبته الخفيفة وسريعة الا...",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7524683710558-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": false,
    "isBestSeller": true
  },
  {
    "id": "prod-7524683448414",
    "nameAr": "SA Gel Nettoyant Anti-Rugosités Cerave",
    "nameFr": "SA Gel Nettoyant Anti-Rugosités Cerave",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/2055594D-F3B4-480E-93B1-3D6E8CF4D8BB.jpg?v=1766261532"
    ],
    "wholesalePrice": 2400,
    "suggestedSellingPrice": 3400,
    "floorPrice": 2900,
    "ceilingPrice": 4400,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (SA). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "سيراڨي SA Gel Nettoyant Anti-Rugosités 236 ml CeraVe هلام للتطهير SA مكافحة الروغوسات 236 مل CeraVe يقشر بلطف البشرة بفضل الصيغة المخصبة في حمض الساليسيليك ومواد سطحية خفيفة . القضاء على الخشونة من أجل بشرة ناعمة يخفف الجلد بفضل الجمع بين 3 السيراميدات الاساسي وحمض الهيالورونيك و نياسيناميد . هذا ال...",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7524683448414-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": false,
    "isBestSeller": false
  },
  {
    "id": "prod-7524683317342",
    "nameAr": "Ceravi Crème Lavante Hydratante",
    "nameFr": "Ceravi Crème Lavante Hydratante",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/75ECBF4D-2D52-4795-B573-A0E8FC48F3C7.jpg?v=1766261428"
    ],
    "wholesalePrice": 2000,
    "suggestedSellingPrice": 3000,
    "floorPrice": 2500,
    "ceilingPrice": 4000,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (Ceravi). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "سيراڨي Crème Lavante Hydratante CeraVe 8 FL OZ/236 ml للبشرة العادية إلى الجد جافة . ینظف ویرطب بلطف البشرة العادیة والجافة ویساعد على تقویة الحاجز الواقي للبشرة مطورمع أطباء الجلد، ینظف بشكل فعال ویرطب دون تغییر الحاجز الواقي للبشرة. غني بسیرامیدات أساسیة وحمض الھیالورونیك ، ھذا الكریم غیر الرغوي ی...",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7524683317342-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": false,
    "isBestSeller": false
  },
  {
    "id": "prod-7524682924126",
    "nameAr": "Ceravi Gel Moussant Anti-Imperfections",
    "nameFr": "Ceravi Gel Moussant Anti-Imperfections",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/IMG-8875.png?v=1766261047"
    ],
    "wholesalePrice": 2200,
    "suggestedSellingPrice": 3200,
    "floorPrice": 2700,
    "ceilingPrice": 4200,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (Ceravi). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "منظف الوجه بحمض الساليسيليك للبشرة المعرضة لحب الشباب ويقلل من الرؤوس السوداء ، ويمنع ظهور البثور الجديدة ويحافظ على الحاجز الواقي للبشرة. تتم إزالة الدهون الزائدة والخلايا الميتة بلطف دون تجفيف الجلد. مصمم خصيصا للبشرة الدهنية. لتأثير مطفأ اللمعة. غير كوميدوغينيك. خالي من البارابين والعطور. أختبار ...",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7524682924126-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": false,
    "isBestSeller": true
  },
  {
    "id": "prod-7524682596446",
    "nameAr": "Cerave Gel Moussant Foaming Cleanser",
    "nameFr": "Cerave Gel Moussant Foaming Cleanser",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/IMG-8874.jpg?v=1766260823"
    ],
    "wholesalePrice": 1700,
    "suggestedSellingPrice": 2700,
    "floorPrice": 2200,
    "ceilingPrice": 3700,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (Cerave). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "سيراڨي Gel Moussant CeraVe 8 FL OZ/236 ml جل رغوي للبشرة العادية إلى الدهنية یعمل على تنظیف فائض الدھون وإزالتھا مع الحفاظ على الحاجز الواقي للبشرة مبتكر مع أطباء الجلد، یعمل جل سیراڤي الرغوي على تنظیف البشرة بنعومة وتطھیرھا من الأعماق من دون المساس بالحاجز الواقي للبشرة. إن ھذا الجل المُطھر للبشرة ...",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7524682596446-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": false,
    "isBestSeller": false
  },
  {
    "id": "prod-7510777200734",
    "nameAr": "Bioderma Sebium Sensitive 30mL",
    "nameFr": "Bioderma Sebium Sensitive 30mL",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/sebium1.webp?v=1765095610",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/sebium4.webp?v=1765095610",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/sebium3.webp?v=1765095610",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/sebium2.webp?v=1765095610"
    ],
    "wholesalePrice": 1600,
    "suggestedSellingPrice": 2600,
    "floorPrice": 2100,
    "ceilingPrice": 3600,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (Bioderma). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "Bioderma Sebium Sensitive 30mL - Soin de beauté et de santé authentique.",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7510777200734-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": false,
    "isBestSeller": false
  },
  {
    "id": "prod-7510559064158",
    "nameAr": "Marvis 9 Colors Italy Whitening Toothpaste Removing Smoke Stains For Women & Men 85ml",
    "nameFr": "Marvis 9 Colors Italy Whitening Toothpaste Removing Smoke Stains For Women & Men 85ml",
    "categoryAr": "منتجات الأسنان",
    "categoryFr": "Soins Dentaires",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/S336e03adcba24c70a9f8fd00e6d8ac86n.webp?v=1765051906",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/S2fb7da8f4e2a4f2ebc3ef7464b94f440L.webp?v=1765051906",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/S4d8d294dab9c45d6afb8062de26f3fc1L.webp?v=1765051906",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/S116bb87fffb74ffabb62be80409257dct.webp?v=1765051906",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/S353effe9b8b949e19d17683538b345e5b.webp?v=1765051906",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/S7595205ef0de459c814d6c7da56fc0e1z.webp?v=1765051906",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/Sc843f994f82c4ccd8c17daf1b24cfb79P.webp?v=1765051906",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/Sc848d304147942b4bec2831161d67672A.webp?v=1765051906",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/Sff2dc14330ae49719577cb94badccc701.webp?v=1765051906"
    ],
    "wholesalePrice": 1500,
    "suggestedSellingPrice": 2500,
    "floorPrice": 2000,
    "ceilingPrice": 3500,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (Marvis). ينتمي لفئة منتجات الأسنان، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "Marvis 9 Colors Italy Whitening Toothpaste Removing Smoke Stains For Women & Men 85ml - Soin de beauté et de santé authentique.",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7510559064158-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": false,
    "isBestSeller": true
  },
  {
    "id": "prod-7510557655134",
    "nameAr": "Autogru Niacinamide Whitening Toothpaste Refreshing",
    "nameFr": "Autogru Niacinamide Whitening Toothpaste Refreshing",
    "categoryAr": "منتجات الأسنان",
    "categoryFr": "Soins Dentaires",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/7cf01b94-9068-49f4-826b-21d5a71d2367.342b08ff956e7de3b2888b4e43841df7.webp?v=1765051431"
    ],
    "wholesalePrice": 1300,
    "suggestedSellingPrice": 2300,
    "floorPrice": 1800,
    "ceilingPrice": 3300,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (Autogru). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "Autogru Niacinamide Whitening Toothpaste Refreshing - Soin de beauté et de santé authentique.",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7510557655134-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": false,
    "isBestSeller": false
  },
  {
    "id": "prod-7510556770398",
    "nameAr": "Seven-green Usman Orchidaceae Shampoo Refreshing Cleansing Oil Control Anti-Itch Replenishing Soap Soft Handmade Soap 120g",
    "nameFr": "Seven-green Usman Orchidaceae Shampoo Refreshing Cleansing Oil Control Anti-Itch Replenishing Soap Soft Handmade Soap 120g",
    "categoryAr": "منتجات الشعر",
    "categoryFr": "Soins Cheveux",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/S3e1f6f1b2be84c309a46454b78f213d6o.webp?v=1765050875"
    ],
    "wholesalePrice": 1200,
    "suggestedSellingPrice": 2200,
    "floorPrice": 1700,
    "ceilingPrice": 3200,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (Seven-green). ينتمي لفئة منتجات الشعر، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "Seven-green Usman Orchidaceae Shampoo Refreshing Cleansing Oil Control Anti-Itch Replenishing Soap Soft Handmade Soap 120g - Soin de beauté et de santé authentique.",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7510556770398-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": false,
    "isBestSeller": false
  },
  {
    "id": "prod-7510232399966",
    "nameAr": "Numbuzin No.9 NAD+ BIO Lifting Serum",
    "nameFr": "Numbuzin No.9 NAD+ BIO Lifting Serum",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/61L8AG9x1XL._SX466.jpg?v=1765047925",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/61f6WluvCLL._SL1500.jpg?v=1765047925",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/61xX0ihoWxL._SL1500.jpg?v=1765047613",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/71EYUaw9FSL._SX466.jpg?v=1765047613",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/71OK7Dk6ICL._SL1500.jpg?v=1765047613",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/71P7iQSeA2L._SX466.jpg?v=1765047613",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/81fWisUSusL._SX466.jpg?v=1765047613",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/610IGnf8BJL._SX466.jpg?v=1765047613"
    ],
    "wholesalePrice": 2800,
    "suggestedSellingPrice": 3800,
    "floorPrice": 3300,
    "ceilingPrice": 4800,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (Numbuzin). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "Numbuzin No.9 NAD+ BIO Lifting Serum - Soin de beauté et de santé authentique.",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7510232399966-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": false,
    "isBestSeller": true
  },
  {
    "id": "prod-7508593377374",
    "nameAr": "Numbuzin No 9 NAD Bio Lifting-sil Essence – Essence anti-âge",
    "nameFr": "Numbuzin No 9 NAD Bio Lifting-sil Essence – Essence anti-âge",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/nadbio1.webp?v=1764786101",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/nadbio2.webp?v=1764786101",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/nadbio3.webp?v=1764786100",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/nadbio4.webp?v=1764786101"
    ],
    "wholesalePrice": 2700,
    "suggestedSellingPrice": 3700,
    "floorPrice": 3200,
    "ceilingPrice": 4700,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (Numbuzin). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "سيروم الشد No.9 NAD Bio Lifting Essence من Numbuzin تركيبة متقدمة لمحاربة التجاعيد وشد البشرة لو بشرتك محتاجة لشد واضح وعناية مكثفة بمظهر التجاعيد، سيروم *No.9 NAD Bio Lifting Essence من Numbuzin هو الحل! تركيبة غنية بمزيج من NAD+والببتيدات تعزز مرونة البشرة، تحفّز إنتاج الكولاجين، وتساعد على تحسين ...",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7508593377374-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": false,
    "isBestSeller": false
  },
  {
    "id": "prod-7499902877790",
    "nameAr": "Bi-Oil Huile de soin Natural 200 ml",
    "nameFr": "Bi-Oil Huile de soin Natural 200 ml",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/Bio_Oil_200ml__57511.jpg?v=1763398900",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/Bio_Oil_200ml_product__16692.jpg?v=1763398900",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/Bio_Oil_200ml_profile__29103.jpg?v=1763398900"
    ],
    "wholesalePrice": 2700,
    "suggestedSellingPrice": 3700,
    "floorPrice": 3200,
    "ceilingPrice": 4700,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (Bi-Oil). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "Bio Oil est une huile de soin spécialisée qui aide à améliorer l'apparence des cicatrices, des vergetures et des irrégularités du teint. Elle est également efficace sur les peaux matures et déshydratées. La formule de soin Bio Oil est une combinaison d'extraits de plantes et de vitamines en suspensi...",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7499902877790-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": false,
    "isBestSeller": false
  },
  {
    "id": "prod-7499899273310",
    "nameAr": "Celimax Crème intensive Retinal Shot Tightening Booster",
    "nameFr": "Celimax Crème intensive Retinal Shot Tightening Booster",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/celimax-crema-intensiva-retinal-shot-tightening-booster-1-90080.jpg?v=1763398091",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/celimax-crema-intensiva-retinal-shot-tightening-booster-2-90080.jpg?v=1763398091",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/celimax-crema-intensiva-retinal-shot-tightening-booster-3-90080.jpg?v=1763398091",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/celimax-crema-intensiva-retinal-shot-tightening-booster-4-90080.jpg?v=1763398091"
    ],
    "wholesalePrice": 2100,
    "suggestedSellingPrice": 3100,
    "floorPrice": 2600,
    "ceilingPrice": 4100,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (Celimax). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "Cette crème intensive Retinal Shot Tightening Booster de Celimax est un soin visage puissant formulé pour améliorer la fermeté, lisser les rides et revitaliser la peau avec des résultats visibles. Idéale pour les peaux matures ou vieillissantes. Principaux avantages : Raffermit et redéfinit le conto...",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7499899273310-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": false,
    "isBestSeller": true
  },
  {
    "id": "prod-7429077237854",
    "nameAr": "SKIN1004 – Sérum Éclat MadeWhite™ À La Centella De Madagascar",
    "nameFr": "SKIN1004 – Sérum Éclat MadeWhite™ À La Centella De Madagascar",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/62113E5A-9329-4718-99F2-ECF2D228E7B2.webp?v=1754212626",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/699F4B63-08C7-47BC-8646-C659BEAF5C87.webp?v=1754212626",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/454B7524-73EC-4630-92A7-28926A91C9E2.webp?v=1754212626"
    ],
    "wholesalePrice": 2700,
    "suggestedSellingPrice": 3700,
    "floorPrice": 3200,
    "ceilingPrice": 4700,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (SKIN1004). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "SKIN1004 – Sérum Éclat MadeWhite™ À La Centella De Madagascar Tone Brightening Capsule Ampoule Description Redonnez vie à votre teint terne avec le sérum éclat MadeWhite™ de SKIN1004 , une formule 2-en-1 qui hydrate intensément tout en éclaircissant visiblement la peau. Ce sérum léger, mais hautemen...",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7429077237854-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": false,
    "isBestSeller": false
  },
  {
    "id": "prod-7429072224350",
    "nameAr": "The Ordinary Vitamin C Suspension",
    "nameFr": "The Ordinary Vitamin C Suspension",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/2A32D532-7DC0-4B57-A79C-A311B1775A86.jpg?v=1754208669"
    ],
    "wholesalePrice": 1900,
    "suggestedSellingPrice": 2900,
    "floorPrice": 2400,
    "ceilingPrice": 3900,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (The). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "Notre produit Suspension de Vitamine C 23% + Sphères de HA 2% utilise de la vitamine C directe et de l'acide hyaluronique pour aider à réduire visiblement les signes de l'âge en illuminant et en unifiant le teint. Cette formule sans eau contient 23% d'acide L-ascorbique pur qui reste complètement st...",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7429072224350-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": false,
    "isBestSeller": false
  },
  {
    "id": "prod-7429069209694",
    "nameAr": "THE ORDINARY Natural Moisturizing Factors + HA - 30 ML",
    "nameFr": "THE ORDINARY Natural Moisturizing Factors + HA - 30 ML",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/FullSizeRender_14645a68-c2ce-4be6-9381-342c3501aacc.jpg?v=1754208049"
    ],
    "wholesalePrice": 1900,
    "suggestedSellingPrice": 2900,
    "floorPrice": 2400,
    "ceilingPrice": 3900,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (THE). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "مرطب غير دهني مناسب لجميع انواع البشره يحتوي على الاحماض الامينيه والهيالورونيك اسيد. يساعد في ترطيب البشره بعمق لفتره طويله جدا. يقوم بحماية الطبقه الخارجيه للبشره والمساعده في حفظ رطوبة الجلد. لايحتوي على : البارابين. كبريتات. الفثالات. منتج نباتي خالي من الكحول والسيليكون الحجم : 30 مل",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7429069209694-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": false,
    "isBestSeller": true
  },
  {
    "id": "prod-7429068554334",
    "nameAr": "Ordinary Retinol 0.5 / 0.2 in squalane",
    "nameFr": "Ordinary Retinol 0.5 / 0.2 in squalane",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/9F35B816-E814-45A7-947F-E03FB6B8462D.jpg?v=1754207885"
    ],
    "wholesalePrice": 2100,
    "suggestedSellingPrice": 3100,
    "floorPrice": 2600,
    "ceilingPrice": 4100,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (Ordinary). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "سيروم تجديد البشرة الريتينول من ذا اورديناري - Retinol 0.5% in Squalan: سيروم الريتينول مضاد للشيخوخة و مقاوم للخطوط التعبيرية بالبشرة و يعالج مشاكل البشرة كالبثور واثارها . تم تصميم - Retinol 0.5٪ In Squalene - : لتقليل الخطوط الدقيقة وتقليل علامات الشيخوخة. تجديد الطبقه السطحيه للبشره. ازالة اثار ...",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7429068554334-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": false,
    "isBestSeller": false
  },
  {
    "id": "prod-7429068488798",
    "nameAr": "Glycolic Acid 7% Toning Solution",
    "nameFr": "Glycolic Acid 7% Toning Solution",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/A0692161-9BF1-450E-AA14-DA2FEF9FC071.jpg?v=1754207742"
    ],
    "wholesalePrice": 3300,
    "suggestedSellingPrice": 4300,
    "floorPrice": 3800,
    "ceilingPrice": 5300,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (Glycolic). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "بمنتج واحد راح يخلصج من أثار التعب والبهتان ويصفي بشرتك من أثر الحبوب والرؤوس السوداء 👌🏻 تونر ذا اورديناري يحتوي على 7% حمض الجلايكوليك المنظف والمقشر مع أحماض أمينية مهمة لصحة ونضارة وصفاء بشرتك فعلا من افضل و اروع انواع التونر الي ممكن تستعمليهم . يعمل على ازالة الخلايا الميتة و تفتيح البشرة إزا...",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7429068488798-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": false,
    "isBestSeller": false
  },
  {
    "id": "prod-7429064786014",
    "nameAr": "Dr. Althea - 345 Relief Cream 50 ml",
    "nameFr": "Dr. Althea - 345 Relief Cream 50 ml",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/IMG-3960.jpg?v=1754204697"
    ],
    "wholesalePrice": 3100,
    "suggestedSellingPrice": 4100,
    "floorPrice": 3600,
    "ceilingPrice": 5100,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (Dr.). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "Dr. Althea 345 Relief Cream est un produit nutritif gel-crème nutritif conçu pour traiter efficacement les peaux post-acnéiques. La crème contient un riche mélange d'ingrédients qui traitent les problèmes de peau, apaisent et nourrissent. Dr. Althea 345 Relief Cream Les ingrédients comprennent des c...",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7429064786014-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": false,
    "isBestSeller": true
  },
  {
    "id": "prod-7429064589406",
    "nameAr": "PanOxyl Acné Moussant Nettoyant Peroxyde de Benzoyle",
    "nameFr": "PanOxyl Acné Moussant Nettoyant Peroxyde de Benzoyle",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/59C1F7D6-3787-4283-9C20-2803E273B70F.jpg?v=1754204463"
    ],
    "wholesalePrice": 2700,
    "suggestedSellingPrice": 3700,
    "floorPrice": 3200,
    "ceilingPrice": 4700,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (PanOxyl). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "Produit Originaux Le nettoyant moussant PanOxyl à 10% ou 4% de peroxyde de benzoyle est un traitement efficace contre l'acné, recommandé par les dermatologues. Il aide à éliminer rapidement les éruptions cutanées et à prévenir les boutons. Sa formule est puissante et adaptée pour le traitement de l'...",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7429064589406-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": false,
    "isBestSeller": false
  },
  {
    "id": "prod-7418042974302",
    "nameAr": "Vichy Dercos Energising Shampoo With Aminexil",
    "nameFr": "Vichy Dercos Energising Shampoo With Aminexil",
    "categoryAr": "منتجات الشعر",
    "categoryFr": "Soins Cheveux",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/466888_500.webp?v=1752519350"
    ],
    "wholesalePrice": 2600,
    "suggestedSellingPrice": 3600,
    "floorPrice": 3100,
    "ceilingPrice": 4600,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (Vichy). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "هل ترغبي بشعر أقوى وملء طبيعي من الجذور؟ جربي Vichy Dercos Energising Shampoo with Aminexil لمحاربة التساقط وإعادة الحيوية 🔬 وصف المنتج – التعرف على المفعول شامبو Dercos Energy+ من فيتشي هو الخيار المثالي لدعم علاجات تساقط الشعر . تركيبة مميزة تحتوي على: Aminexil : جزيء محمي ببراءات اختراع، يعمل عل...",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7418042974302-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": false,
    "isBestSeller": false
  },
  {
    "id": "prod-7418039435358",
    "nameAr": "Vichy Dercos Technique Anti-Dandruff Shampoo",
    "nameFr": "Vichy Dercos Technique Anti-Dandruff Shampoo",
    "categoryAr": "منتجات الشعر",
    "categoryFr": "Soins Cheveux",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/405181_768_1.jpg?v=1752519001"
    ],
    "wholesalePrice": 2600,
    "suggestedSellingPrice": 3600,
    "floorPrice": 3100,
    "ceilingPrice": 4600,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (Vichy). ينتمي لفئة منتجات الشعر، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "ما هو شامبو Vichy Dercos Technique Anti‑Dandruff شامبو طبي خاص مضاد للقشرة، مزيج من سفنيوم سلفيد (Selenium Sulfide) وحمض الساليسيليك (Salicylic Acid)، يُقضي على القشرة من أول استعمال ويوفر حماية ممتدة قد تصل إلى 6 أسابيع من التقشر . يُناسب فروة الرأس الدهنية والعاديّة، ويعمل بلطف على التقشير وتنقية ...",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7418039435358-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": false,
    "isBestSeller": true
  },
  {
    "id": "prod-7417246580830",
    "nameAr": "Dr Rashel SUN CREAM SPF 60",
    "nameFr": "Dr Rashel SUN CREAM SPF 60",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/images.jpg?v=1752352834"
    ],
    "wholesalePrice": 500,
    "suggestedSellingPrice": 1500,
    "floorPrice": 1000,
    "ceilingPrice": 2500,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (Dr). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "🌞 كريم واقي الشمس Dr Rashel – حماية تدوم، جمال يدوم! 🌞 هل تبحثين عن الحماية المثالية من أشعة الشمس دون ترك أي آثار دهنية أو بيضاء؟ ✨ كريم Dr Rashel واقي الشمس هو خيارك الأمثل لبشرة صحية، ناعمة ومشرقة كل يوم! ✅ المميزات: SPF 50+ لحماية فائقة من أشعة UVA وUVB الضارة تركيبة خفيفة تمتص بسرعة ولا تترك ...",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7417246580830-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": false,
    "isBestSeller": false
  },
  {
    "id": "prod-7392255311966",
    "nameAr": "Some By Mi 30 Days Miracle",
    "nameFr": "Some By Mi 30 Days Miracle",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/35158047-ABCB-4312-B2FC-AD996B5586D3.jpg?v=1749222247",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/686F95C7-443F-4538-AA61-E1D9CAA3CD4F.jpg?v=1749222247",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/DD24BAAB-2EDE-4AC5-BDA8-F4944C30FABB.jpg?v=1749221813",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/8E73E4CB-EA44-4A91-9C16-B33A334A0393.jpg?v=1749221813",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/D43A418E-81BF-4CD0-A513-E85671C06D42.jpg?v=1749221813"
    ],
    "wholesalePrice": 2700,
    "suggestedSellingPrice": 3700,
    "floorPrice": 3200,
    "ceilingPrice": 4700,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (Some). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "يقدم هذا الكريم المعجزة للعناية بالبقع نتائج مرئية خلال 14 يومًا، موفرًا عناية فعّالة لبشرة صافية وصحية. كريم علاجي مركز لحب الشباب والبقع يجمع بين التقشير الكيميائي اللطيف والمكونات المهدئة لتحسين مظهر البشرة بسرعة وأمان. تركيبته الخفيفة والهلامية تمتص بسهولة دون أن تترك أثراً دهنياً، مما يساعد على...",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7392255311966-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": false,
    "isBestSeller": false
  },
  {
    "id": "prod-7392254427230",
    "nameAr": "L’Oreal Paris Revitalift Derm Intensives 1.5% Pure Hyaluronic Acid Serum – 30ml",
    "nameFr": "L’Oreal Paris Revitalift Derm Intensives 1.5% Pure Hyaluronic Acid Serum – 30ml",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/8C373F14-8D81-4470-9B84-7E25F9390B9B.png?v=1749221011",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/D59C7D32-614F-4068-9953-DB95F8B8B3E7.png?v=1749221011"
    ],
    "wholesalePrice": 1700,
    "suggestedSellingPrice": 2700,
    "floorPrice": 2200,
    "ceilingPrice": 3700,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (L’Oreal). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "رجّعي الترطيب لبشرتك في 1 ساعة فقط 💧 مع سيروم L’Oréal Revitalift 1.5% Hyaluronic Acid اللي يحتوي على تركيز قوي وفعّال من حمض الهيالورونيك النقي، لترطيب مكثّف، ملء التجاعيد الدقيقة، ونضارة من أوّل استخدام! 🔬 مصادق عليه من طرف أطباء الجلد 🚫 خالي من العطور 🧪 مناسب لجميع أنواع البشرة (حتى الحساسة) \ud83d...",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7392254427230-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": false,
    "isBestSeller": true
  },
  {
    "id": "prod-7392252166238",
    "nameAr": "Bioderma Sensibio Gel Moussant 200 ML",
    "nameFr": "Bioderma Sensibio Gel Moussant 200 ML",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/3AB15EEC-E5A5-4C07-AF62-E46B96F5EE0F.jpg?v=1749219051"
    ],
    "wholesalePrice": 1200,
    "suggestedSellingPrice": 2200,
    "floorPrice": 1700,
    "ceilingPrice": 3200,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (Bioderma). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "Bioderma Sensibio Gel Moussant هو جل رغوي منظّف لطيف مصمم خصيصًا للبشرة الحساسة والمتهيجة. ينظف البشرة بلطف دون أن يسبب الجفاف أو التهيّج، ويُعتبر مثاليًا للاستعمال اليومي. ✅ الفوائد الأساسية ينظف البشرة بلطف: يزيل الأوساخ، الشوائب، والمكياج دون تخريب الحاجز الواقي للبشرة. يرطب ويهدّئ: يحتوي على مكو...",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7392252166238-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": false,
    "isBestSeller": false
  },
  {
    "id": "prod-7381871722590",
    "nameAr": "korean Anua\nBirch 70% Moisture Boosting Serum",
    "nameFr": "korean Anua\nBirch 70% Moisture Boosting Serum",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_c507f724-16ab-41b5-b86c-df2eb546f564.jpg?v=1747395703",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_a736b0e1-0d28-46ba-b623-b58209e5079c.jpg?v=1747395703",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_0e49e45e-9c88-4c5d-b1ce-250fc7270698.jpg?v=1747395703",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_8eec47b9-e488-4d00-9645-11b07bb4aa54.jpg?v=1747395549",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_ff82011f-43c0-4ac0-96a9-8ca910a32f9f.jpg?v=1747395549"
    ],
    "wholesalePrice": 2600,
    "suggestedSellingPrice": 3600,
    "floorPrice": 3100,
    "ceilingPrice": 4600,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (korean). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "#Birch 70% Moisture Boosting Serum ترطيب نقي وعناية فائقة من قلب الطبيعة فوائد المنتج يحتوي على 70% من مستخلص شجرة البتولا لترطيب عميق يقوي حاجز البشرة ويحافظ على مرونتها يمنح إشراقة ناعمة ولمسة صحية طريقة الاستعمال بعد تنظيف الوجه، ضعي كمية مناسبة من السيروم على البشرة دلكي بلطف حتى يتم امتصاصه بال...",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7381871722590-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": false,
    "isBestSeller": true
  },
  {
    "id": "prod-7381855731806",
    "nameAr": "korean Anua\nPeach 70% Niacin Serum",
    "nameFr": "korean Anua\nPeach 70% Niacin Serum",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_898b2ede-fe3a-48e7-adc4-6b99f4080467.jpg?v=1747395434",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_f008e944-7cf3-4b05-9ee2-da9e58c26581.jpg?v=1747395434",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_2d3f0380-c29a-4621-82b1-3fe3323604d5.png?v=1747395434",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_5021f553-590e-457c-bbf2-be9381d75719.jpg?v=1747395163",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_fcca89fe-4e15-4cf6-a81e-f33f02d751f4.jpg?v=1747395163",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_dfaf4df5-51a0-4fcb-a09e-42c3074976d7.jpg?v=1747395163"
    ],
    "wholesalePrice": 2700,
    "suggestedSellingPrice": 3700,
    "floorPrice": 3200,
    "ceilingPrice": 4700,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (korean). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "#Peach 70% Niacin Serum نعومة الخوخ، ونقاء النياسيناميد لبشرة مشرقة ومتجانسة فوائد المنتج يحتوي على 70% مستخلص الخوخ لترطيب وتغذية البشرة مدعّم بـ Niacinamide لتفتيح وتوحيد لون البشرة يمنح ملمس ناعم ولمعان صحي طريقة الاستعمال بعد تنظيف البشرة وتجفيفها، ضعي 2-3 قطرات من السيروم على الوجه دلكي بلطف حت...",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7381855731806-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": false,
    "isBestSeller": false
  },
  {
    "id": "prod-7381851766878",
    "nameAr": "korean Anua\nHeartleaf 80% Moisture Soothing Ampoule",
    "nameFr": "korean Anua\nHeartleaf 80% Moisture Soothing Ampoule",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_faac6ca7-72d0-451a-bc45-2167a16dd307.jpg?v=1747395089",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_f1fbc120-77aa-4286-b0ab-3b6aee5f1274.jpg?v=1747395089",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_b485cb8b-baf5-4d57-ac9d-98d0d0393739.jpg?v=1747395089",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_8e8ab211-8858-47c4-aabf-a843b448ce58.jpg?v=1747395089",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_52694c4a-a4d1-46d9-bf51-5c0ab5af5eff.jpg?v=1747395089",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_9bc9c7a0-410b-4f04-b898-ef058e00be46.jpg?v=1747395089",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_367810c5-8415-454e-8aea-bb0e7726376e.jpg?v=1747394904"
    ],
    "wholesalePrice": 2700,
    "suggestedSellingPrice": 3700,
    "floorPrice": 3200,
    "ceilingPrice": 4700,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (korean). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "Heartleaf 80% Moisture Soothing Ampoule ترطيب وتهدئة فورية للبشرة الحساسة فوائد المنتج يحتوي على 80% من مستخلص الـHeartleafلتهدئة التهيجات يمنح ترطيباً عميقاً ولمعاناً طبيعياً مثالي للبشرة الحساسة والمتهيجة طريقة الاستعمال بعد تنظيف الوجه، ضعي كمية مناسبة من الأمبول على البشرة. دلكي بلطف حتى يتم امت...",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7381851766878-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": false,
    "isBestSeller": false
  },
  {
    "id": "prod-7381842100318",
    "nameAr": "korean Anua Peach 70 Niacinamide Serum 30ml",
    "nameFr": "korean Anua Peach 70 Niacinamide Serum 30ml",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_a2f4e4b5-e30c-4667-a153-0717f85c5418.jpg?v=1747394786",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_78809204-1d6f-4b45-b83d-548d63458973.webp?v=1747394786"
    ],
    "wholesalePrice": 2700,
    "suggestedSellingPrice": 3700,
    "floorPrice": 3200,
    "ceilingPrice": 4700,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (korean). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "#Anua Peach 70 Niacinamide Serum – 30ml اشراقة طبيعية ببشرة ناعمة وخالية من البقع فوائد المنتج يحتوي على 70% مستخلص الخوخ لترطيب وتغذية البشرة غني بالنياسيناميد لتفتيح البشرة وتوحيد لونها يقلل من البقع والتصبغات بلطف وفعالية طريقة الاستعمال بعد تنظيف البشرة، ضعي كمية مناسبة من السيروم على الوجه وزعي...",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7381842100318-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": false,
    "isBestSeller": true
  },
  {
    "id": "prod-7381826502750",
    "nameAr": "Numbuzin\nNo.5 Vitamin Concentrated Serum",
    "nameFr": "Numbuzin\nNo.5 Vitamin Concentrated Serum",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_cda48260-1a50-4376-a28d-a875e3bc08bc.jpg?v=1747394251",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_cb4e7f48-ea6a-44aa-8831-6e3be5172c35.jpg?v=1747394251",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_e2e4b442-939b-450f-ac8d-0d33f8ff22f8.jpg?v=1747394251",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_698e4bbf-a9b5-4cda-8698-8eac16987c20.jpg?v=1747394251",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_f863237a-9d7c-4283-b13f-f55a7fe1c470.jpg?v=1747394251"
    ],
    "wholesalePrice": 3100,
    "suggestedSellingPrice": 4100,
    "floorPrice": 3600,
    "ceilingPrice": 5100,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (Numbuzin\nNo.5). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "No.5 Vitamin Concentrated Serum جرعة مركزة من الفيتامينات لبشرة صحية ومضيئة فوائد المنتج يغذي البشرة بعمق ويعزز إشراقتها يقلل من علامات التعب ويوحد لون البشرة يحتوي على مزيج فعّال من الفيتامينات المغذية طريقة الاستعمال بعد تنظيف البشرة، ضعي بضع قطرات من السيروم على الوجه دلكي بلطف بحركات دائرية حتى ...",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7381826502750-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": false,
    "isBestSeller": false
  },
  {
    "id": "prod-7381813264478",
    "nameAr": "korean Anua – Niacinamide 10% + TXA 4% Dark Spot Correcting Serum – Sérum",
    "nameFr": "korean Anua – Niacinamide 10% + TXA 4% Dark Spot Correcting Serum – Sérum",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/IMAGE-EDIT_eaf48504-186f-44ef-8962-8d2eafce64f9.png?v=1747393809",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_32a53d32-5c0b-40fc-bf9d-70ae715617c3.jpg?v=1747393809",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_c2b2cf58-dad4-4fd6-9d60-21cc4bd0d1f3.jpg?v=1747393809",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_be7452ce-fcab-429e-9bd9-9e0a39ca5b3a.jpg?v=1747393809",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_53f3ba4f-91fc-4e84-b809-d6e7d7ec7a17.jpg?v=1747393809"
    ],
    "wholesalePrice": 2700,
    "suggestedSellingPrice": 3700,
    "floorPrice": 3200,
    "ceilingPrice": 4700,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (korean). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "Anua – Niacinamide 10% + TXA 4% Dark Spot Correcting Serum ودّعي التصبغات ومرحبا ببشرة موحدة ومشرقة فوائد المنتج يخفف من البقع الداكنة والتصبغات يوحد لون البشرة ويمنحها إشراقة صحية يحتوي على تركيز فعّال من النياسيناميد والتراكساميك أسيد طريقة الاستعمال بعد تنظيف البشرة وتجفيفها، ضعي كمية مناسبة من ا...",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7381813264478-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": false,
    "isBestSeller": false
  },
  {
    "id": "prod-7381800484958",
    "nameAr": "VICHY EST SELLER MINÉRAL 89\nBOOSTER QUOTIDIEN\nHydratation renforçant la peau.",
    "nameFr": "VICHY EST SELLER MINÉRAL 89\nBOOSTER QUOTIDIEN\nHydratation renforçant la peau.",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_35015db1-df05-4346-8f56-459efa8535e5.webp?v=1747392749",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_d12f30e0-cf34-4487-a853-f6f5ad861357.webp?v=1747392749",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_d4be3de4-c599-4cb6-92a8-77868d7fc252.webp?v=1747392749",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_e3316371-a14d-4ac1-b314-35de0a17d86e.webp?v=1747392749"
    ],
    "wholesalePrice": 2300,
    "suggestedSellingPrice": 3300,
    "floorPrice": 2800,
    "ceilingPrice": 4300,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (VICHY). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "#BEST SELLER – MINÉRAL 89 BOOSTER QUOTIDIEN قوة الترطيب والنضارة في كل قطرة! فوائد المنتج ترطيب فوري وعميق للبشرة يعزز الحاجز الطبيعي للبشرة يمنح إشراقة صحية ولمسة ناعمة طريقة الاستعمال على بشرة نظيفة وجافة، ضعي قطرتين من Minéral 89 صباحاً ومساءً دلكي بلطف حتى الامتصاص الكامل تابعي بروتينك المعتاد ل...",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7381800484958-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": false,
    "isBestSeller": true
  },
  {
    "id": "prod-7381776629854",
    "nameAr": "VICHY NORMADERM SOIN QUOTIDIEN DOUBLE CORRECTION\nCorrige les imperfections et régénère la peau.",
    "nameFr": "VICHY NORMADERM SOIN QUOTIDIEN DOUBLE CORRECTION\nCorrige les imperfections et régénère la peau.",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_e41f9786-3cda-4952-bf05-1c930d3625c3.webp?v=1747392210",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_e883ef01-ada9-4c83-be79-a06c2bc1900e.webp?v=1747392210",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_af68c13c-9596-48f1-a1c8-0e902a6c49bf.webp?v=1747392016"
    ],
    "wholesalePrice": 2100,
    "suggestedSellingPrice": 3100,
    "floorPrice": 2600,
    "ceilingPrice": 4100,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (VICHY). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "#NORMADERM العناية اليومية مزدوجة التصحيح امنحي بشرتك بداية جديدة NORMADERM Double Correction يصحّح العيوب وينشّط تجديد البشرة، ليمنحك بشرة نقية، ناعمة ومتجددة يومًا بعد يوم الفوائد يقاوم البثور واللمعان يرطّب البشرة ويُعيد توازنها يُنعّم الملمس ويقلّل من مظهر المسام طريقة الاستعمال يُستخدم صباحًا و...",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7381776629854-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": false,
    "isBestSeller": false
  },
  {
    "id": "prod-7381748351070",
    "nameAr": "VICHY NEOVADIOL CRÈME DE NUIT REDENSIFIANTE REVITALISANTE",
    "nameFr": "VICHY NEOVADIOL CRÈME DE NUIT REDENSIFIANTE REVITALISANTE",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_397609b7-efe1-4dbb-aa58-5f0c1a552f1a.webp?v=1747392426",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_c6e3dba2-5133-4dea-adc5-590057f23dc9.png?v=1747392426",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_a6976fae-a72c-495b-97f3-80d21e2b1cfd.webp?v=1747392384",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_c6408db0-a7ec-4ef8-85a5-e96b9b8c4cee.webp?v=1747392384"
    ],
    "wholesalePrice": 2700,
    "suggestedSellingPrice": 3700,
    "floorPrice": 3200,
    "ceilingPrice": 4700,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (VICHY). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "استيقظي على بشرة أكثر امتلاءً وحيوية دلّلي بشرتك بكريم الليل Vichy Neovadiol ، المصمم خصيصاً لتجديد البشرة الناضجة خلال النوم تركيبة فعالة تعزز كثافة البشرة، وتُعيد لها إشراقها ومرونتها بفضل مزيج من البروكسيل، حمض الهيالورونيك، ومياه فيشي الحرارية النتيجة؟ بشرة مشدودة، ممتلئة، ناعمة، وأكثر إشراقاً ك...",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7381748351070-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": false,
    "isBestSeller": false
  },
  {
    "id": "prod-7381737406558",
    "nameAr": "VICHY Nutrilogie 1 Soulage instantanément",
    "nameFr": "VICHY Nutrilogie 1 Soulage instantanément",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_76732107-6ab4-4aba-bb2f-12fcd4680680.webp?v=1747390029",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_7228aed0-8ece-43de-b842-1b3d99d92bca.jpg?v=1747390029",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_d3f98d83-8b1c-4d69-abcf-34015a7e0d19.webp?v=1747390029"
    ],
    "wholesalePrice": 2200,
    "suggestedSellingPrice": 3200,
    "floorPrice": 2700,
    "ceilingPrice": 4200,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (VICHY). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "ودّعي جفاف البشرة مع لمسة من النعومة الفائقة كريم Vichy Nutrilogie 1 يغذي البشرة الجافة بعمق ويمنحها الراحة الفورية والترطيب المستمر طوال اليوم. تركيبته الغنية بالأحماض الدهنية والزيوت الأساسية تعزز من حاجز البشرة الطبيعي وتعيد لها مرونتها المناسب: للبشرة الجافة طريقة الاستعمال نظفي وجهك جيداً خذي ك...",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7381737406558-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": false,
    "isBestSeller": true
  },
  {
    "id": "prod-7381729673310",
    "nameAr": "VICHY AQUALIA THERMAL CREME REHYDRATANTE LEGERE",
    "nameFr": "VICHY AQUALIA THERMAL CREME REHYDRATANTE LEGERE",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_f320ac31-c136-4782-baee-1c3cee0659e4.jpg?v=1747389360",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_f4acde1f-6651-43c7-ba50-ef219d3812d4.webp?v=1747389360",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_e508c72a-3001-4f00-96fb-7137fdb767b5.webp?v=1747389360",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_4dd11ebe-8d54-421b-a826-40d56073d681.jpg?v=1747389360"
    ],
    "wholesalePrice": 1900,
    "suggestedSellingPrice": 2900,
    "floorPrice": 2400,
    "ceilingPrice": 3900,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (VICHY). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "امنحي بشرتك انتعاشاً يدوم طوال اليوم كريم Vichy Aqualia Thermal Light بتركيبته الغنية بالمياه الحرارية وحمض الهيالورونيك، يمنح بشرتك ترطيباً عميقاً يدوم حتى 48 ساعة. مثالي للبشرة العادية إلى المختلطة، بملمس خفيف ومنعش لا يترك أثراً دهنياً. طريقة الاستعمال . ضعي كمية صغيرة من الكريم على الوجه صباحاً ...",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7381729673310-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": false,
    "isBestSeller": false
  },
  {
    "id": "prod-7380495695966",
    "nameAr": "Avène Cicalfate+ 100ml Crème réparatrice protectrice",
    "nameFr": "Avène Cicalfate+ 100ml Crème réparatrice protectrice",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_765b007f-2758-4410-99a5-34cb969813a9.png?v=1747334764",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_d0625078-32e6-48e6-b2cc-30f66beb67ed.png?v=1747334765"
    ],
    "wholesalePrice": 2200,
    "suggestedSellingPrice": 3200,
    "floorPrice": 2700,
    "ceilingPrice": 4200,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (Avène). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "استرجعي نعومة بشرتك مع Cicalfate+ من Avène! كريم إصلاحي وواقٍ، يرمم، يهدئ، ويحمي البشرة الحساسة والمتهيّجة. مثالي للجروح الطفيفة، التهيّج بعد الحلاقة أو التقشير، حروق خفيفة أو حتى بعد التاتو. طريقة الاستعمال 1. نظّفي المنطقة المصابة بلطف وجففيها. 2. ضعي طبقة رقيقة من الكريم. 3. كرري الاستخدام 2 إلى ...",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7380495695966-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": false,
    "isBestSeller": false
  },
  {
    "id": "prod-7378389401694",
    "nameAr": "VICHY LIFTACTIVCOLLAGEN SPECIALIST 16 Crème de jour.",
    "nameFr": "VICHY LIFTACTIVCOLLAGEN SPECIALIST 16 Crème de jour.",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_711c2565-55d1-402f-a6b0-309f7c988748.png?v=1747242995",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_588463f2-babe-4439-8e67-35fc3cae729c.jpg?v=1747242995",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_ce2d42a3-040b-4929-be2d-c96cc32ae346.webp?v=1747242995",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_ac685ca8-a46a-4e5a-8a67-9aad8aab525d.webp?v=1747242995",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_85949a4b-7231-4f08-9bcb-eb824437c6b1.webp?v=1747242995"
    ],
    "wholesalePrice": 1800,
    "suggestedSellingPrice": 2800,
    "floorPrice": 2300,
    "ceilingPrice": 3800,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (VICHY). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "احصلي على بشرة مشدودة ومشرقة مع Vichy Liftactiv Collagen Specialist 16 Day! تركيبة فعالة مدعّمة بالكولاجين ومكونات مقاومة لعلامات التقدم في السن، تقلل من التجاعيد وتمنحك مظهرًا أكثر شبابًا مع كل استخدام. :الفوائد شد فوري للبشرة تقليل ظهور الخطوط الدقيقة والتجاعيد تعزيز إشراقة البشرة ونضارتها :طريقة ...",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7378389401694-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": false,
    "isBestSeller": true
  },
  {
    "id": "prod-7379298648158",
    "nameAr": "SOMEBYMI Retinol Intense",
    "nameFr": "SOMEBYMI Retinol Intense",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/45BC6CBF-C373-4F4A-A8F6-2DF750C5719A.webp?v=1747170267",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/7BCC4CCA-F850-464A-A068-D4628BFD9744.webp?v=1747170267"
    ],
    "wholesalePrice": 2100,
    "suggestedSellingPrice": 3100,
    "floorPrice": 2600,
    "ceilingPrice": 4100,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (SOMEBYMI). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "تألّقي بنظرة شابة ومشرقة! كريم العين SOMEBYMI Retinol Intense بتركيبة الريتينول المتقدمة، يحارب التجاعيد، يخفف الهالات السوداء، ويمنحك إشراقة لا تقاوم! مناسب للبشرة الحساسة – فعالية عالية ونتائج ملموسة. طريقة الاستخدام: بعد تنظيف الوجه، ضعي نقطة صغيرة تحت كل عين. ربّتي بلطف باستخدام أطراف الأصابع حت...",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7379298648158-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": false,
    "isBestSeller": false
  },
  {
    "id": "prod-7378389205086",
    "nameAr": "Medicube Collagen Jelly Cream",
    "nameFr": "Medicube Collagen Jelly Cream",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/54020453-6507-4787-8CD2-5A359D008C11.webp?v=1746867364",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/5105353F-6B4B-4919-8103-8F33463A1397.jpg?v=1746867364",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/77AB18D4-7547-402F-B67A-D7C4CFA53F97.png?v=1746867364",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/C855AB77-8F66-4F45-AE1A-78E26C46FE3F.webp?v=1746867364"
    ],
    "wholesalePrice": 2200,
    "suggestedSellingPrice": 3200,
    "floorPrice": 2700,
    "ceilingPrice": 4200,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (Medicube). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "Medicube Collagen Jelly Cream est un gel crème translucide qui offre de multiples avantages pour améliorer les contours de la peau, favoriser la fermeté et obtenir un teint brillant et éclatant. Le produit est enrichi en niacinamide et en collagène hydrolysé lyophilisé, ce qui contribue à améliorer ...",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7378389205086-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": false,
    "isBestSeller": false
  },
  {
    "id": "prod-7378389041246",
    "nameAr": "Medicube Collagen Night Wrapping Mask",
    "nameFr": "Medicube Collagen Night Wrapping Mask",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/89215790-C6FC-47FD-9299-E7F30A44F14C.webp?v=1746867141",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/DF5B6363-3331-4956-9C02-0AC35E802B58.webp?v=1746867141",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/E07266C0-6C17-4259-B1B3-03B7A6A9A710.webp?v=1746867141"
    ],
    "wholesalePrice": 2200,
    "suggestedSellingPrice": 3200,
    "floorPrice": 2700,
    "ceilingPrice": 4200,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (Medicube). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "Medicube Collagen Night Wrapping Mask est un sleeping mask conçu pour améliorer l'élasticité de la peau et l'hydrater pendant la nuit. Le masque contient un film de collagène unique qui enveloppe la peau et agit pendant votre sommeil, vous laissant au réveil avec une peau plus ferme et plus hydratée...",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7378389041246-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": false,
    "isBestSeller": true
  },
  {
    "id": "prod-7378388779102",
    "nameAr": "SOME BY MI Sérum Anti-âge Réactivant Intense au Rétinol",
    "nameFr": "SOME BY MI Sérum Anti-âge Réactivant Intense au Rétinol",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/659E7FEF-A21E-4016-B3C2-3C2B41F64D92.jpg?v=1746866899",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/CB97DE91-57ED-4270-994D-97916890D67C.jpg?v=1746866900",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/68D66927-402D-4BFF-9CE7-7A5DAE33D9A9.webp?v=1746866899",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/8E525AAA-745F-4960-8A9E-FDDEE66A6259.webp?v=1746866899"
    ],
    "wholesalePrice": 2200,
    "suggestedSellingPrice": 3200,
    "floorPrice": 2700,
    "ceilingPrice": 4200,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (SOME). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "Le sérum réactivant intense au rétinol Some By Mi est infusé de rétinol, de rétinal et de bakuchiol pour stimuler l'élasticité de la peau et réduire les signes du vieillissement. Il est créé avec la technologie brevetée des liposomes élastiques pour fournir des ingrédients actifs profondément dans l...",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7378388779102-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": false,
    "isBestSeller": false
  },
  {
    "id": "prod-7378071322718",
    "nameAr": "VICHY LIFTACTIV SÉRUM H.A. EPIDERMIC FILLER – RIDES & FERMETÉ",
    "nameFr": "VICHY LIFTACTIV SÉRUM H.A. EPIDERMIC FILLER – RIDES & FERMETÉ",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_5ddc0cf1-1f42-43d7-b9b0-2b6ec202d92f.jpg?v=1746788987",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_8a0e5ba3-1ca8-4ffc-baad-5d51e0bb3f12.webp?v=1746788986",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_3299faf4-7446-4938-91a2-8c2257560716.png?v=1746788987",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_ebb99523-f903-4cdd-9987-aef45d799219.webp?v=1746788986",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_15fba985-1b21-4efa-90dc-ba235d7f85f8.webp?v=1746788986",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_bd947262-aeca-49c3-b26a-14dea39f917d.webp?v=1746788986",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_ce2c1b5a-a04b-498b-ad72-32cbfca4ab0c.jpg?v=1746788987",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_9f0dd91e-e66e-49f6-ad50-e69d13df8eea.jpg?v=1746788986"
    ],
    "wholesalePrice": 3700,
    "suggestedSellingPrice": 4700,
    "floorPrice": 4200,
    "ceilingPrice": 5700,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (VICHY). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "استعيدي شباب بشرتك مع Vichy Liftactiv Hyaluronic Specialist! سيروم بتركيبة مزدوجة من حمض الهيالورونيك النقي بنسبة عالية، يعمل كـ«فيلر» طبيعي لملء التجاعيد وترطيب البشرة بعمق. يمنحك إشراقة فورية وبشرة مشدودة وأكثر امتلاءً من أول استخدام. مثالي لجميع أنواع البشرة، حتى الحساسة. : طريقة الاستعمال استخدم...",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7378071322718-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": false,
    "isBestSeller": false
  },
  {
    "id": "prod-7378070995038",
    "nameAr": "Vichy Liftactiv Retinol Specialist Sérum Rides Profondes",
    "nameFr": "Vichy Liftactiv Retinol Specialist Sérum Rides Profondes",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_b646f558-384f-4d3b-9fbe-5d805d23013a.jpg?v=1746788624",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_de6a9a26-70f1-43bb-8311-bc0b4692d4e8.png?v=1746788624",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_c553613a-c042-46f5-a866-dd0e9c6f0616.jpg?v=1746788624",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_2e42a559-d1c1-4bbb-b59c-cf716db3fa9f.jpg?v=1746788624",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_d93a7c5e-0537-4120-b02e-866a1cd669c7.jpg?v=1746788624",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_c8573f82-e99a-4f6a-b7c3-5dd550334054.jpg?v=1746788623"
    ],
    "wholesalePrice": 3700,
    "suggestedSellingPrice": 4700,
    "floorPrice": 4200,
    "ceilingPrice": 5700,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (Vichy). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "ودّعي التجاعيد العميقة مع فيشي ريتينول سبيشاليست! سيروم قوي بتركيز 0.2% ريتينول نقي، مدعّم بالبروبيوتيك والببتيدات الحيوية. يقلل التجاعيد العميقة، يحسّن ملمس البشرة ويوحّد لونها. خالٍ من العطور، مناسب للبشرة الحساسة. : طريقة الاستعمال يُستخدم مساءً فقط على بشرة نظيفة وجافة. ضعي كمية صغيرة (2-3 نقاط)...",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7378070995038-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": false,
    "isBestSeller": true
  },
  {
    "id": "prod-7378069618782",
    "nameAr": "VICHY LIFTACTIV VITAMINE C SERUM – 30ML",
    "nameFr": "VICHY LIFTACTIV VITAMINE C SERUM – 30ML",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_38e2679e-e020-4f50-abfa-a3a53fd2cd31.webp?v=1746787870",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_ebc4bc73-2a43-431c-a016-c2d799374ece.png?v=1746787870",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_cae39896-4e14-4508-ae08-ee43a16f0599.webp?v=1746787870",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_bd5646b0-d090-43f3-9014-1fdefc58aaf7.webp?v=1746787870",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_5d66430a-062c-42d6-8836-c7e36cea732d.jpg?v=1746787870"
    ],
    "wholesalePrice": 4300,
    "suggestedSellingPrice": 5300,
    "floorPrice": 4800,
    "ceilingPrice": 6300,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (VICHY). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "Vichy Liftactiv Sérum Éclat 16% Vitamine C Pure: فيشي ليفت أكتيف – إشراقة فورية لبشرتك سيروم فيتامين C النقي بتركيز 16% يعزز نضارة البشرة، يقلل التجاعيد خلال 10 أيام، ويرطب حتى 72 ساعة. تركيبة فعّالة تحتوي على حمض الهيالورونيك والكارنوزين لنعومة فورية وإشراق يدوم. :طريقة الاستعمال يُستخدم صباحًا على...",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7378069618782-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": false,
    "isBestSeller": false
  },
  {
    "id": "prod-7378068865118",
    "nameAr": "La Roche-Posay EFFACLAR Sérum à l'Acide Salicylique Ultra Concentré",
    "nameFr": "La Roche-Posay EFFACLAR Sérum à l'Acide Salicylique Ultra Concentré",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_e0c35905-0bbd-4370-a108-13110e5e69a3.jpg?v=1746787299",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_f68fd348-621f-4f94-8921-a1f4391c73cb.jpg?v=1746787299",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_49481a8b-1721-4086-87a6-301a64cc1406.jpg?v=1746787299",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_dec56a83-89d3-405f-96f2-8ebb140c9554.jpg?v=1746787299",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_5b5998bb-d78d-437a-af83-e8a590bc726d.jpg?v=1746787299",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_935c59e2-bdba-47c9-aed5-322e648c18b9.jpg?v=1746787299",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_65468c8b-5acf-4341-96d3-02b0f53cf5c7.jpg?v=1746787299",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_5af86a30-5e2c-46af-8a95-b7493a244574.jpg?v=1746787299",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_9ed1764a-dc73-431e-abaf-99f2c77c9870.jpg?v=1746787299"
    ],
    "wholesalePrice": 3300,
    "suggestedSellingPrice": 4300,
    "floorPrice": 3800,
    "ceilingPrice": 5300,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (La). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "ودّعي شوائب البشرة بتركيبة مركّزة سيروم Effaclar Ultra Concentrated La Roche-Posay للبشرة المعرضة لحب الشباب، يقلل الشوائب، آثار الحبوب، ويضيق المسام. تركيبة فعالة بحمض الساليسيليك، الجليكوليك، النياسيناميد، وماء لا روش بوزيه الحراري. طريقة الاستعمال: يُستخدم مساءً فقط على بشرة نظيفة وجافة. ضعي 2-3 ...",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7378068865118-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": false,
    "isBestSeller": false
  },
  {
    "id": "prod-7378058575966",
    "nameAr": "La Roche-Posay HYALU B5 SÉRUM À L'ACIDE HYALURONIQUE 30ml",
    "nameFr": "La Roche-Posay HYALU B5 SÉRUM À L'ACIDE HYALURONIQUE 30ml",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_9f5a176f-ddd7-4389-b0c6-6c15e7196fc1.jpg?v=1746784949",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_cb04daaf-d169-4e40-975f-90656e2b056c.jpg?v=1746784949"
    ],
    "wholesalePrice": 3300,
    "suggestedSellingPrice": 4300,
    "floorPrice": 3800,
    "ceilingPrice": 5300,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (La). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "استعيدي شباب بشرتك مع سيروم Hyalu B5 من La Roche-Posay! تركيبة فريدة تحتوي على حمض الهيالورونيك وفيتامين B5 لملء التجاعيد، ترطيب عميق، وإعادة مرونة البشرة. مثالي للبشرة المتعبة والباهتة – حتى الحساسة. نتائج ملحوظة من الاستخدام الأول. طريقة الاستعمال: ضعي بضع قطرات صباحاً و/أو مساءً على بشرة نظيفة قب...",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7378058575966-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": false,
    "isBestSeller": true
  },
  {
    "id": "prod-7378054512734",
    "nameAr": "La Roche-Posay Sérum Pure Niacinamide 10 - 30ml",
    "nameFr": "La Roche-Posay Sérum Pure Niacinamide 10 - 30ml",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_b6ff2950-fc14-426b-a2b3-73cd5a4715d6.png?v=1746784454",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_b52e4d0d-4ff0-4f20-a782-6c14a6a1a31e.jpg?v=1746784454"
    ],
    "wholesalePrice": 3300,
    "suggestedSellingPrice": 4300,
    "floorPrice": 3800,
    "ceilingPrice": 5300,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (La). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "ودّعي البقع الداكنة مع سيروم النياسيناميد 10 من La Roche-Posay تركيبة مركّزة لتفتيح البشرة، توحيد لونها، وتقليل مظهر التصبغات. نتائج ملحوظة، بشرة أكثر إشراقاً ونقاءً. مدعّم بماء لا روش بوزيه الحراري لتهدئة البشرة. طريقة الاستعمال: ضعي 2-3 قطرات على بشرة نظيفة وجافة صباحاً و/أو مساءً، قبل المرطب. تجن...",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7378054512734-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": false,
    "isBestSeller": false
  },
  {
    "id": "prod-7377475141726",
    "nameAr": "VICHY LIFTACTIV SÉRUM B3 ANTI-TACHES BRUNES ET ANTI-RIDES",
    "nameFr": "VICHY LIFTACTIV SÉRUM B3 ANTI-TACHES BRUNES ET ANTI-RIDES",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/background-editor_output_72e4e6d5-209a-43ab-a8f8-c6d655fa0afa.png?v=1746789363",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/img4.webp?v=1746789363",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/img2.png?v=1746789363",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/img3.webp?v=1746789363",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/img7.webp?v=1746789363",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/img5.webp?v=1746789363",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_bcc0454e-525f-4753-84a1-850be822fc6e.jpg?v=1746789292"
    ],
    "wholesalePrice": 3900,
    "suggestedSellingPrice": 4900,
    "floorPrice": 4400,
    "ceilingPrice": 5900,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (VICHY). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "🔴 Vichy Liftactiv B3 Serum ✨ سر إشراقة البشرة الخالية من البقع والتجاعيد! سيروم مركز يعالج البقع الداكنة ويقلل التجاعيد بفضل مزيج قوي من النياسيناميد B3، حمض الجليكوليك، فيتامين Cg، والبيبتيدات، ليمنحك بشرة موحّدة، ناعمة وأكثر شباباً. ✅ يوحد لون البشرة ✅ يقلل البقع الداكنة ✅ ينعم الخطوط الدقيقة ✅ م...",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7377475141726-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": false,
    "isBestSeller": false
  },
  {
    "id": "prod-7377459085406",
    "nameAr": "La Roche-Posay Effaclar Gel Micropeeling 400ml",
    "nameFr": "La Roche-Posay Effaclar Gel Micropeeling 400ml",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/3337875708289_Effaclar-Micropeeling-Gel_400ml_01_La-Roche-Posay.jpg?v=1746702841",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/3337875708289_Effaclar-Micropeeling-Gel_400ml_02_La-Roche-Posay.jpg?v=1746702841",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/3337875708289_Effaclar-Micropeeling-Gel_400ml_03_La-Roche-Posay.jpg?v=1746702841",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/3337875708289_Effaclar-Micropeeling-Gel_400ml_04_La-Roche-Posay.jpg?v=1746702841",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/3337875708289_Effaclar-Micropeeling-Gel_400ml_05_La-Roche-Posay.jpg?v=1746702841",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/3337875708289_Effaclar-Micropeeling-Gel_400ml_06_La-Roche-Posay.jpg?v=1746702841",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/3337875708289_Effaclar-Micropeeling-Gel_400ml_07_La-Roche-Posay.jpg?v=1746702841",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/3337875708289_Effaclar-Micropeeling-Gel_400ml_08_La-Roche-Posay.jpg?v=1746702841"
    ],
    "wholesalePrice": 2400,
    "suggestedSellingPrice": 3400,
    "floorPrice": 2900,
    "ceilingPrice": 4400,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (La). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "La Roche-Posay Effaclar Gel Purifiant Micro-Peeling وهو غسول مقشر لطيف مناسب للبشرة المعرضة لعيوب شديدة، ويتميز بتركيبته الفعالة التي تجمع بين التنظيف العميق والتقشير اليومي. 💧 نقاء أعمق... تقشير لطيف يومي! اكتشف قوة التنظيف المقشّر مع Effaclar Micro-Peeling Gel من لاروش بوزاي. ينظف المسام بعمق، يز...",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7377459085406-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": false,
    "isBestSeller": true
  },
  {
    "id": "prod-7377456169054",
    "nameAr": "La Roche-Posay EFFACLAR GEL MOUSSANT PURIFIANT NETTOYANT PEAU GRASSE",
    "nameFr": "La Roche-Posay EFFACLAR GEL MOUSSANT PURIFIANT NETTOYANT PEAU GRASSE",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/3337872411991_Effaclar-Purifying-Cleansing-Gel_400ml_01_La-Roche-Posay.jpg?v=1746702501",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/3337872411991_Effaclar-Purifying-Cleansing-Gel_400ml_02_La-Roche-Posay.jpg?v=1746702501",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/3337872411991_Effaclar-Purifying-Cleansing-Gel_400ml_03_La-Roche-Posay.jpg?v=1746702501",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/3337872411991_Effaclar-Purifying-Cleansing-Gel_400ml_04_La-Roche-Posay.jpg?v=1746702501",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/3337872411991_Effaclar-Purifying-Cleansing-Gel_400ml_05_La-Roche-Posay.jpg?v=1746702501",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/3337872411991_Effaclar-Purifying-Cleansing-Gel_400ml_07_La-Roche-Posay.jpg?v=1746702501",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/3337872411991_Effaclar-Purifying-Cleansing-Gel_400ml_11_La-Roche-Posay.jpg?v=1746702501",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/3337872411991_Effaclar-Purifying-Cleansing-Gel_400ml_12_La-Roche-Posay.jpg?v=1746702501"
    ],
    "wholesalePrice": 2000,
    "suggestedSellingPrice": 3000,
    "floorPrice": 2500,
    "ceilingPrice": 4000,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (La). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "✨ نقاء يبدأ من الغسلة الأولى نظفي بشرتك بعمق وبلطف مع La Roche-Posay Effaclar Gel . تركيبة غنية بمياه لاروش بوزاي الحرارية ومصممة لتقليل الإفرازات الدهنية وتهدئة البشرة، دون التسبب في جفافها. مناسب للبشرة الحساسة والدهنية. 🔵 خالٍ من الصابون – خالٍ من البارابين – خالٍ من الكحول 🧴 طريقة الاستعمال: ب...",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7377456169054-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": false,
    "isBestSeller": false
  },
  {
    "id": "prod-7376798318686",
    "nameAr": "La Roche Posay Sérum Pure Vitamine C10 30 ML",
    "nameFr": "La Roche Posay Sérum Pure Vitamine C10 30 ML",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_5d94b50a-10c6-424d-89e5-492e2d046eca.jpg?v=1746659759",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_982e98d0-5075-4d90-8c1e-39986a7c3b57.jpg?v=1746659759"
    ],
    "wholesalePrice": 2900,
    "suggestedSellingPrice": 3900,
    "floorPrice": 3400,
    "ceilingPrice": 4900,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (La). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "La Roche-Posay Sérum Pure Vitamine C10 – إشراقة فورية لبشرة أكثر نضارة وشبابًا اكتشفي قوة فيتامين C النقي بتركيز 10% مع هذا السيروم المضاد للتجاعيد والتعب. تركيبة فريدة تحتوي على فيتامين C النقي، حمض الساليسيليك، ومياه La Roche-Posay الحرارية، تعمل على تفتيح البشرة، تنعيم الملمس، وتقليل مظهر الخطوط ...",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7376798318686-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": false,
    "isBestSeller": false
  },
  {
    "id": "prod-7376787963998",
    "nameAr": "La Roche Posay EFFACLAR DUO (+)\nSOIN CORRECTEUR DÉSINCRUSTANT",
    "nameFr": "La Roche Posay EFFACLAR DUO (+)\nSOIN CORRECTEUR DÉSINCRUSTANT",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_5b20d63a-9457-47c4-8423-ad7a67cfc9d9.webp?v=1746658949",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_997719f9-9b1d-47a2-950a-1001d879b2f1.webp?v=1746658949",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_f4cb3f0f-55c2-42d0-9ffd-0a998b5b71b2.webp?v=1746658949",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_fc4435dd-319a-491c-844b-e6f6d5491e15.webp?v=1746658949",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_edc219ad-53ea-4a65-a589-3df74c1a44f9.webp?v=1746658949"
    ],
    "wholesalePrice": 1800,
    "suggestedSellingPrice": 2800,
    "floorPrice": 2300,
    "ceilingPrice": 3800,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (La). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "Effaclar DUO (+) العناية المصححة والمنظّفة بعمق للبشرة المعرضة للشوائب احصلي على بشرة أنقى يوماً بعد يوم! تركيبة فعالة من La Roche-Posay تجمع بين النياسيناميد، LHA، والبيروكتون أولامين، لتقليل البثور والاحمرار وتنقية المسام بعمق دون تجفيف البشرة. يقلل من ظهور الآثار ويمنع تكرار الشوائب، مع نتائج ملم...",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7376787963998-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": false,
    "isBestSeller": true
  },
  {
    "id": "prod-7376752607326",
    "nameAr": "La Roche Posay Effaclar DUO+M Soin triple correction anti-imperfections",
    "nameFr": "La Roche Posay Effaclar DUO+M Soin triple correction anti-imperfections",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_15ceed3e-06e1-4b95-b06e-bfa785a56b5d.jpg?v=1746658477",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_d8f33f1c-18df-4964-8c4d-ba6e93e13595.jpg?v=1746658477",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_3c1f4536-25c4-4cfa-838c-577ccff7a033.jpg?v=1746656394",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_78584c77-de34-4c11-92da-b28b65ea4169.jpg?v=1746656393",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_3fa2b7fa-9975-4a35-a9fe-957b65bbaad2.jpg?v=1746656394",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_26eb6641-fa17-4047-ae8d-ba9e0e18a106.jpg?v=1746656393",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_787dbf7e-2fb6-4c87-8509-3af842294563.jpg?v=1746656394"
    ],
    "wholesalePrice": 1800,
    "suggestedSellingPrice": 2800,
    "floorPrice": 2300,
    "ceilingPrice": 3800,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (La). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "Effaclar DUO+M – عناية ثلاثية المفعول للبشرة المعرضة لعيوب متكررة ابتكار جديد من La Roche-Posay للبشرة الدهنية والمُعرضة لظهور الحبوب والآثار. تركيبة مطوّرة تعمل على تصحيح العيوب، منع ظهور العلامات، وتنقية المسام بفضل النياسيناميد، البروبيوتيك والمواد المقشرة الدقيقة. فعالية مثبتة من اليوم الأول مع ...",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7376752607326-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": false,
    "isBestSeller": false
  },
  {
    "id": "prod-7376733995102",
    "nameAr": "LA ROCHE-POSAY EFFACLAR DUO [+] SPF 30 40ML .",
    "nameFr": "LA ROCHE-POSAY EFFACLAR DUO [+] SPF 30 40ML .",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_9f1268d5-c967-4154-a478-3f6b81d6ef14.jpg?v=1746655463",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_f18e8a56-f050-4264-8321-045e82603aed.jpg?v=1746655463",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_777b2fc5-a2f8-4007-b5d0-86f97b6bb14a.jpg?v=1746655463",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_0a95f9f7-5602-4be4-b587-f275d903075e.jpg?v=1746655463",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_422be296-8645-4bb7-bf5e-38d06408f08a.jpg?v=1746655463",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_0ff4412d-14cd-447b-9bf4-b4040ead9fe8.jpg?v=1746655463"
    ],
    "wholesalePrice": 1600,
    "suggestedSellingPrice": 2600,
    "floorPrice": 2100,
    "ceilingPrice": 3600,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (LA). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "LA ROCHE-POSAY EFFACLAR DUO [+] SPF 30 40ML علاج فعال للبشرة المعرضة لحب الشباب مع حماية من الشمس كريم علاج فريد من نوعه لبشرة الوجه المعرضة لحب الشباب والمشاكل الجلدية. يحتوي على تركيبة فعالة للتقليل من البثور والاحمرار ويعمل على تحسين مظهر البشرة بشكل عام. يحتوي على SPF 30 لحماية إضافية ضد الأشعة ...",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7376733995102-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": false,
    "isBestSeller": false
  },
  {
    "id": "prod-7376724459614",
    "nameAr": "La Roche Posay Anthelios UVMUNE 400 Crème Solaire fluide invisible SPF50+",
    "nameFr": "La Roche Posay Anthelios UVMUNE 400 Crème Solaire fluide invisible SPF50+",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_214f1321-39a2-4fb3-a0ff-da165737de4c.jpg?v=1746654614",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_3301d901-1472-410c-9477-6a402f8dce0a.jpg?v=1746654614",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_d1c14c1b-89c5-4379-8ac4-04e49bf1dc88.jpg?v=1746654615",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_d93dd017-6e15-488b-9d0b-d4f4d00936d4.jpg?v=1746654615"
    ],
    "wholesalePrice": 1700,
    "suggestedSellingPrice": 2700,
    "floorPrice": 2200,
    "ceilingPrice": 3700,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (La). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "Anthelios UVMUNE 400 Fluide Invisible SPF50+ حماية قصوى، ملمس غير مرئي ابتكار جديد من La Roche-Posay بحماية فائقة ضد أشعة UVA وUVB بفضل الفلتر الثوري Mexoryl 400. تركيبة خفيفة غير دهنية، غير مرئية على جميع ألوان البشرة، مقاومة للماء والعرق والرمل. مثالي للبشرة الحساسة والمختلطة إلى الدهنية. طريقة ال...",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7376724459614-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": false,
    "isBestSeller": true
  },
  {
    "id": "prod-7376712597598",
    "nameAr": "La Roche-Posay Eau Thermale",
    "nameFr": "La Roche-Posay Eau Thermale",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_13bf778d-32e9-49f9-969f-0580722f29b6.jpg?v=1746653756",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_ac314355-2678-4fdf-8d92-5d198141edf7.jpg?v=1746653756",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_f4646603-0518-4ac5-9987-0ca8a42476ff.jpg?v=1746653756",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_fa814bfa-783d-4371-b52d-f52f16ea5bd5.jpg?v=1746653756",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_6a755495-6a71-4f22-9d85-429702f51bcb.jpg?v=1746653756",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_1daf7977-5109-471a-9d0c-011fe3ac4fc2.jpg?v=1746653756",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_2d7f0c38-fa4b-45a0-8b30-a64e45696d5f.jpg?v=1746653756"
    ],
    "wholesalePrice": 2300,
    "suggestedSellingPrice": 3300,
    "floorPrice": 2800,
    "ceilingPrice": 4300,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (La). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "Eau Thermale de La Roche-Posay – رذاذ مياه حرارية مهدئ ومنقٍ للبشرة مياه حرارية طبيعية نقية غنية بالمعادن والسيلينيوم، تساعد على تهدئة البشرة وتقليل التهيج، وتمنح شعورًا بالانتعاش الفوري. مثالية للبشرة الحساسة، بعد التعرض للشمس، أو كخطوة نهائية للعناية بالبشرة والمكياج. طريقة الاستعمال: 1. رُشي المي...",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7376712597598-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": false,
    "isBestSeller": false
  },
  {
    "id": "prod-7376691822686",
    "nameAr": "La Roche Posay Cicaplast Baume B5+ Crème Ultra-Réparatrice Apaisante 40ml",
    "nameFr": "La Roche Posay Cicaplast Baume B5+ Crème Ultra-Réparatrice Apaisante 40ml",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_de5aa030-5433-4089-9d4f-5fea312fac4a.jpg?v=1746651667",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_94aede1e-8186-4862-945c-9b6708977c63.jpg?v=1746651667",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_d3961453-df72-48b2-a95a-4f7d3e91ec95.jpg?v=1746651667",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_1856b210-5e3a-4bc2-805b-a6845b6de29d.jpg?v=1746651667",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_76541a86-c3bc-4c02-a8b9-6ae2ff2428e1.jpg?v=1746651667",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_67eb7faf-cc9a-4b79-8e3d-d2c62237da29.jpg?v=1746651667",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_8a9a49be-cb67-4bc5-8d0d-9d92fd7d9e82.jpg?v=1746651667"
    ],
    "wholesalePrice": 900,
    "suggestedSellingPrice": 1900,
    "floorPrice": 1400,
    "ceilingPrice": 2900,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (La). ينتمي لفئة منتجات الشعر، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "كريم ترميم وتهدئة فائق الفعالية، غني بالبروفيتامين B5 والمادكاسوسايد، يعزز تجدد البشرة ويرطبها بعمق. مثالي للبشرة المتهيجة أو المتضررة، سواء بعد العلاجات الجلدية أو العوامل البيئية القاسية. مناسب للأطفال والبالغين، حتى على البشرة الحساسة. طريقة الاستعمال: 1. نظّف المنطقة المتأثرة بلطف وجففها جيدًا. ...",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7376691822686-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": false,
    "isBestSeller": false
  },
  {
    "id": "prod-7376674586718",
    "nameAr": "La Roche Posay Cicaplast Baume B5+ Crème Ultra-Réparatrice Apaisante 100 ml",
    "nameFr": "La Roche Posay Cicaplast Baume B5+ Crème Ultra-Réparatrice Apaisante 100 ml",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_de5aa030-5433-4089-9d4f-5fea312fac4a.jpg?v=1746651667",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_8a9a49be-cb67-4bc5-8d0d-9d92fd7d9e82.jpg?v=1746651667",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_67eb7faf-cc9a-4b79-8e3d-d2c62237da29.jpg?v=1746651667",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_76541a86-c3bc-4c02-a8b9-6ae2ff2428e1.jpg?v=1746651667",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_1856b210-5e3a-4bc2-805b-a6845b6de29d.jpg?v=1746651667",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_d3961453-df72-48b2-a95a-4f7d3e91ec95.jpg?v=1746651667",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_3ed0400f-cd9b-4eab-8063-9d1ca43465b6.jpg?v=1746651667",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_94aede1e-8186-4862-945c-9b6708977c63.jpg?v=1746651667"
    ],
    "wholesalePrice": 1800,
    "suggestedSellingPrice": 2800,
    "floorPrice": 2300,
    "ceilingPrice": 3800,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (La). ينتمي لفئة منتجات الشعر، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "كريم ترميم وتهدئة فائق الفعالية، غني بالبروفيتامين B5 والمادكاسوسايد، يعزز تجدد البشرة ويرطبها بعمق. مثالي للبشرة المتهيجة أو المتضررة، سواء بعد العلاجات الجلدية أو العوامل البيئية القاسية. مناسب للأطفال والبالغين، حتى على البشرة الحساسة. طريقة الاستعمال: 1. نظّف المنطقة كريم ترميم وتهدئة فائق الفعا...",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7376674586718-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": false,
    "isBestSeller": true
  },
  {
    "id": "prod-7376360734814",
    "nameAr": "La Roche-Posay Rétinol B3 Sérum anti-rides au rétinol régénérant resurfaçant",
    "nameFr": "La Roche-Posay Rétinol B3 Sérum anti-rides au rétinol régénérant resurfaçant",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/1_d14dcd2c-8bc1-4247-aa49-0b514e55ca95.jpg?v=1746629634",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/3337875694469_Retinol-B3-Anti-Ageing-Serum-for-Sensitive-Skin_30ml_02_La-Roche-Posay.jpg?v=1746629600",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/3337875694469_Retinol-B3-Anti-Ageing-Serum-for-Sensitive-Skin_30ml_03_La-Roche-Posay.jpg?v=1746629600",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/3337875694469_Retinol-B3-Anti-Ageing-Serum-for-Sensitive-Skin_30ml_04_La-Roche-Posay.jpg?v=1746629600",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/3337875694469_Retinol-B3-Anti-Ageing-Serum-for-Sensitive-Skin_30ml_05_La-Roche-Posay.jpg?v=1746629600",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/3337875694469_Retinol-B3-Anti-Ageing-Serum-for-Sensitive-Skin_30ml_01_La-Roche-Posay.jpg?v=1746629600"
    ],
    "wholesalePrice": 3100,
    "suggestedSellingPrice": 4100,
    "floorPrice": 3600,
    "ceilingPrice": 5100,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (La). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "La Roche-Posay Rétinol B3 Sérum – تجديد مكثف للبشرة وعلاج فعال للتجاعيد سيروم مبتكر يحتوي على الريتينول الفعّال وفيتامين B3، يعمل على تجديد البشرة وتقليل التجاعيد بشكل واضح. يساعد على تحسين ملمس البشرة ونعومتها، ويحفز تجديد خلايا البشرة ليتركها أكثر شبابًا وإشراقة. مناسب للبشرة الحساسة بفضل تركيبته ...",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7376360734814-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": false,
    "isBestSeller": false
  },
  {
    "id": "prod-7376346611806",
    "nameAr": "Eucerin SPOTELESS BRIGHTENING Ultra White+ Spotless Gentle Cleansing Foam 150G",
    "nameFr": "Eucerin SPOTELESS BRIGHTENING Ultra White+ Spotless Gentle Cleansing Foam 150G",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/47c20928-a0f6-410a-82d1-db0bf440c0ad.webp?v=1746628698",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/b4069d69-48a2-4b4d-afbf-c0919bc437f9.webp?v=1746628699",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/df7d3df9-2877-43c9-972a-6692a05908ae.webp?v=1746628699"
    ],
    "wholesalePrice": 1600,
    "suggestedSellingPrice": 2600,
    "floorPrice": 2100,
    "ceilingPrice": 3600,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (Eucerin). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "لتفتيح البشرة وتقليل البقع الداكنة، يحتوي على مكونات فعّالة مثل حمض الجليكوليك وبيتا-غلوكان التي تساعد في توحيد لون البشرة وتحسين مظهرها. يقلل من التصبغات ويمنحك بشرة ناعمة ومشرقة. مناسب لجميع أنواع البشرة، بما في ذلك البشرة الحساسة. طريقة الاستعمال: استخدمه صباحًا ومساءً بعد تنظيف الوجه. ضعي طبقة ر...",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7376346611806-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": false,
    "isBestSeller": false
  },
  {
    "id": "prod-7376324722782",
    "nameAr": "Eucerin DermatoCLEAN [HYALURON] Cleansing Gel",
    "nameFr": "Eucerin DermatoCLEAN [HYALURON] Cleansing Gel",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/49eb1d28a6c94ea68c9d7afea7f82ac3-screen.webp?v=1746626681",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/76aa3fdc0ba34da6b697249d507dc117-screen.webp?v=1746626681",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/2822e1816fbc400eac7c609128370ea3-screen.webp?v=1746626681",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/cb4c91b16ab146b5ab92295a2c08c1c1-screen.webp?v=1746626681"
    ],
    "wholesalePrice": 1700,
    "suggestedSellingPrice": 2700,
    "floorPrice": 2200,
    "ceilingPrice": 3700,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (Eucerin). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "Eucerin DermatoCLEAN [HYALURON] Cleansing Gel نظافة وترطيب مثالي مع غسول مائي لطيف ينظف البشرة بعمق ويزيل الشوائب والمكياج بدون جفاف. يحتوي على حمض الهيالورونيك لترطيب البشرة ومنحها شعورًا بالنعومة والانتعاش. مناسب للبشرة الحساسة، ويترك البشرة نظيفة، مرطبة، ومنتعشة طوال اليوم.",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7376324722782-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": false,
    "isBestSeller": true
  },
  {
    "id": "prod-7376320823390",
    "nameAr": "Eucerin ProACNE Solution A.I. Clearing Treatment",
    "nameFr": "Eucerin ProACNE Solution A.I. Clearing Treatment",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/b2f596c7314343e4a8c2414687f8c3ad-screen.webp?v=1746626392",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/6e9d29acb1274a55b4bdae12dac15e25-screen.webp?v=1746626393",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/320f05db921d43b39723b3b0c30321b7-screen.webp?v=1746626393",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/7400bebcce9b4831a552c0e45628262d-screen.webp?v=1746626393",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/bd19da7a96e2487e9cbe5f82fb76431a-screen.webp?v=1746626392"
    ],
    "wholesalePrice": 1800,
    "suggestedSellingPrice": 2800,
    "floorPrice": 2300,
    "ceilingPrice": 3800,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (Eucerin). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "Eucerin ProACNE A.I. Clearing Treatment تحكّم فعال في حب الشباب مع تركيبة مركّزة مصممة خصيصًا للبشرة المعرضة لحب الشباب، تقلل بشكل واضح البثور والآثار المزعجة خلال أسبوعين فقط. تحتوي على أحماض فعّالة (مثل الساليسيليك واللاكتيك) لتنقية المسام، وتقنية A.I. لتهدئة التهيج وتقليل الاحمرار. خالٍ من الزيوت...",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7376320823390-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": false,
    "isBestSeller": false
  },
  {
    "id": "prod-7376312827998",
    "nameAr": "Eucerin Advanced Repair Hand Cream -Hand Lotion for Very Dry Skin - 2.7 oz Tubes",
    "nameFr": "Eucerin Advanced Repair Hand Cream -Hand Lotion for Very Dry Skin - 2.7 oz Tubes",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/71wBUsCtQTL._AC_SL1500.jpg?v=1746625504",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/81wX4eONUlL._AC_SL1500.jpg?v=1746625504",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/71KjMgN1yYL._AC_SX679.jpg?v=1746625504",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/713Vw56LJ-L._AC_SX679.jpg?v=1746625504",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/81r9ydgbDtL._AC_SX679.jpg?v=1746625504",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/81_QFLmdV4L._AC_SL1500.jpg?v=1746625505",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/71nv_gOu2lL._AC_SL1500.jpg?v=1746625504",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/71RisO1ogdL._AC_SL1500.jpg?v=1746625504",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/71dn-jUdETL._AC_SL1500.jpg?v=1746625505"
    ],
    "wholesalePrice": 600,
    "suggestedSellingPrice": 1600,
    "floorPrice": 1100,
    "ceilingPrice": 2600,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (Eucerin). ينتمي لفئة منتجات الشعر، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "كريم اليد يوريا بلص من شركة يوسرين العالمية ✔️✔️ احلى كريم ترطيب لليدين وبشهادة اللي جربوه 😍🔥 الي وصلت مرحلة اليأس وماخلت شي ماستخدمته لليدين😭❤️ ⬅️ يمنح اليدين الجافة والخشنة العناية اليومية التي تحتاجها. ⬅️ يبيض ويرطب اليدين ترطيب عميق ⬅️ ترمم حاجز الحماية الطبيعي للبشرة لمنع المزيد من فقدان الر...",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7376312827998-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": false,
    "isBestSeller": false
  },
  {
    "id": "prod-7376299458654",
    "nameAr": "Eucerin Redness Relief Skin Soothing Night Cream - 1.7 Oz",
    "nameFr": "Eucerin Redness Relief Skin Soothing Night Cream - 1.7 Oz",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/0-715.jpg?v=1746624575",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/6-268.jpg?v=1746624575",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/7-201.jpg?v=1746624575",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/1-685-600x600.jpg?v=1746624575"
    ],
    "wholesalePrice": 2000,
    "suggestedSellingPrice": 3000,
    "floorPrice": 2500,
    "ceilingPrice": 4000,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (Eucerin). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "Eucerin, كريم ليلي مضاد للتجاعيد غني بالريتينول ومساعد إنزيم Q10، ‏سائلة (48 مل) -يساعد علي تقليل ظهور الخطوط الرفيعة والتجاعيد -يحسن مظهر الخطوط الرفيعة والتجاعيد في أقل من 5 أسابيع. -يرطب البشرة للحصول على بشرة أكثر نعومة ورقة. -خالٍ من العطور، والبارابين، الأصباغ، ولا يسبب انسداد المسام طريقة الإ...",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7376299458654-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": false,
    "isBestSeller": true
  },
  {
    "id": "prod-7376272621662",
    "nameAr": "Eucerin Sun Oil Control SPF 50 Face Sunscreen Lotion",
    "nameFr": "Eucerin Sun Oil Control SPF 50 Face Sunscreen Lotion",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/Untitled.jpg?v=1746622360",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/dddd.jpg?v=1746622361"
    ],
    "wholesalePrice": 2000,
    "suggestedSellingPrice": 3000,
    "floorPrice": 2500,
    "ceilingPrice": 4000,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (Eucerin). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "#واقي شمس يوسيرين مناسب للبشرة الدهنية والبشرة المعرضة لحب الشباب تركيبة خفيفة سريع الامتصاص غير دهني مقاوم للماء. لا يتسبب في انسداد المسام. لا يتسبب بلمعة للبشرة. و يتميز هذا المنتج بتركيبة فريدة تعمل على تقليل التصبغات",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7376272621662-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": false,
    "isBestSeller": false
  },
  {
    "id": "prod-7376249585758",
    "nameAr": "Chanel ROUGE ALLURE VELVET Nuit blanche limited edition lipstick .",
    "nameFr": "Chanel ROUGE ALLURE VELVET Nuit blanche limited edition lipstick .",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/1732195704589-07newpackjpg_1298x974_854c67ce-507e-4d13-ba45-beab5afde67b.webp?v=1746626979",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/9563906965534.webp?v=1746626979",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/9565073539102.webp?v=1746626979",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/9565131800606.webp?v=1746626979",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/195584-2_9fec4852-fca8-4a9c-9b8c-b33910d83cdd.webp?v=1746626979"
    ],
    "wholesalePrice": 4500,
    "suggestedSellingPrice": 5500,
    "floorPrice": 5000,
    "ceilingPrice": 6500,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (Chanel). ينتمي لفئة منتجات الأسنان، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "ROUGE ALLURE VELVET nuit blanche limited edition lipstick by CHANEL The luminous velvety lipstick: the ultra-comfortable second-skin texture sublimates the lips with a concentrate of pure pigments for a luminous, intense and long-lasting finish. Thanks to the derivative of jojoba oil and shea butter...",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7376249585758-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": false,
    "isBestSeller": false
  },
  {
    "id": "prod-7376024469598",
    "nameAr": "Eucerin, Face, Q10 Revitalize, Night Cream, Fragrance Free, 1.7 fl oz  (48 g)",
    "nameFr": "Eucerin, Face, Q10 Revitalize, Night Cream, Fragrance Free, 1.7 fl oz  (48 g)",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/41Qvnw5dHNL._SS400.jpg?v=1746627799",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/41TnU4wHs7L._SS400.jpg?v=1746627799",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/31St6UAyHKL._SS400.jpg?v=1746627799",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/411V4RpWaXL._SS400.jpg?v=1746627799",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/41JGAHzBk5L._SS400.jpg?v=1746627799",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/41QOwOZY80L._SS400.jpg?v=1746627799",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/41epHR5beQL._SS400.jpg?v=1746627785"
    ],
    "wholesalePrice": 2000,
    "suggestedSellingPrice": 3000,
    "floorPrice": 2500,
    "ceilingPrice": 4000,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (Eucerin,). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "Eucerin Q10 Anti-Ride Facial Night Cream + Pro-Retinol est une crème de nuit pour la peau sensible qui agit pendant que vous dormez pour aider à réduire l'apparence des ridules en seulement 5 semaines (1).Cette crème de nuit pour le visage est formulée avec Coenzyme Q10, Vitamine E, Huile de noix de...",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7376024469598-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": false,
    "isBestSeller": true
  },
  {
    "id": "prod-7376060121182",
    "nameAr": "Clarins Double Serum Traitement Complet Anti-Âge Intensif",
    "nameFr": "Clarins Double Serum Traitement Complet Anti-Âge Intensif",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_33216901-2078-422d-8f28-6861953a6482.webp?v=1746569428",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_aaad4b57-f3bc-44fb-b2a3-2b7bf835b882.jpg?v=1746569428"
    ],
    "wholesalePrice": 15400,
    "suggestedSellingPrice": 16400,
    "floorPrice": 15900,
    "ceilingPrice": 17400,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (Clarins). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "Double Serum Traitement Complet Anti-Âge Intensif ...La jeunesse et la beauté de la peau sont préservées.Le seul traitement anti-âge à double phase hydrique et lipidique riche de extraits de plantes qui stimule les 5 fonctions vitales de la peau et décode pour la 1ère fois le langage de la jeunesse....",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7376060121182-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": false,
    "isBestSeller": false
  },
  {
    "id": "prod-7376056713310",
    "nameAr": "Avéne Réflexe Solaire très haute protection SPF 50+",
    "nameFr": "Avéne Réflexe Solaire très haute protection SPF 50+",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_d66ec83f-28ab-4cb4-bcd2-f6ebf3f1ab01.jpg?v=1746569175"
    ],
    "wholesalePrice": 1300,
    "suggestedSellingPrice": 2300,
    "floorPrice": 1800,
    "ceilingPrice": 3300,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (Avéne). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "Association exclusive d'actifs, Sunsitive® protection, issue de la Recherche Pierre Fabre : - Minimum de filtres, stables et efficaces dans le temps, offrant une protection optimale contre les UVB et les UVA (courts et longs). - Puissant antioxydant, le Pré-tocophéryl, pour une protection cellulaire...",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7376056713310-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": false,
    "isBestSeller": false
  },
  {
    "id": "prod-7376050847838",
    "nameAr": "Embryolisse Lait-Crème Concentré-75ml",
    "nameFr": "Embryolisse Lait-Crème Concentré-75ml",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_afc53b92-9399-4ca3-86b7-5f33b2163774.jpg?v=1746567812",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_c0b22508-841c-416f-ab2b-6600eb923c7f.png?v=1746567812",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_1f113653-ad14-4ffc-be7a-ed0b29e55f05.png?v=1746567812",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_5780a78d-268b-4b5e-a8b3-727478e6fcef.png?v=1746567812",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_7d5e8741-480e-42a0-86eb-7450b057f719.jpg?v=1746567812",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_6254be11-9e31-4be7-82c8-91b43dea41b6.jpg?v=1746567812",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_90df760d-c56f-4478-ae0e-9427253810d0.png?v=1746567812",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_2554192a-a748-4914-b76f-087390f8e90b.jpg?v=1746567812",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_1514df5e-25b9-4d6f-a572-3de724f7e4fd.jpg?v=1746567812",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/rn-image_picker_lib_temp_21f4620a-6b0d-4f03-a182-305126108ab9.jpg?v=1746567812"
    ],
    "wholesalePrice": 1900,
    "suggestedSellingPrice": 2900,
    "floorPrice": 2400,
    "ceilingPrice": 3900,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (Embryolisse). ينتمي لفئة منتجات الشعر، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "Formulé par un dermatologue et véritable secret de beauté depuis des décennies, le Lait-Crème Concentré est LE soin universel chouchou des maquilleurs professionnels utilisé sur les peaux sur-sollicitées des actrices et mannequins du monde entier ! Ce soin hydratant nutritif multi-fonctions laisse u...",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7376050847838-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": false,
    "isBestSeller": true
  },
  {
    "id": "prod-7375939797086",
    "nameAr": "Avéne Cicalfate+ Crème Réparatrice Protectrice 40ml",
    "nameFr": "Avéne Cicalfate+ Crème Réparatrice Protectrice 40ml",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/2.webp?v=1746619084",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/1.webp?v=1746619084",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/3.webp?v=1746619084"
    ],
    "wholesalePrice": 1300,
    "suggestedSellingPrice": 2300,
    "floorPrice": 1800,
    "ceilingPrice": 3300,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (Avéne). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "Peaux sensibles, irritées et lésées Crème réparatrice antibactérienne Cuivre Cette crème aux actifs réparateurs* et assainissants apaise immédiatement les inconforts et favorise la réparation* des peaux sensibles et irritées dès 48 h**.",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7375939797086-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": false,
    "isBestSeller": false
  },
  {
    "id": "prod-7375429861470",
    "nameAr": "LA ROCHE-POSAY ANTHELIOS – SPF50+ Crème Solaire Visage",
    "nameFr": "LA ROCHE-POSAY ANTHELIOS – SPF50+ Crème Solaire Visage",
    "categoryAr": "منتجات البشرة والجسم",
    "categoryFr": "Soins Peau & Corps",
    "ageGroup": "general",
    "gender": "unisex",
    "images": [
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/1-1.jpg?v=1746462496",
      "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/1.jpg?v=1746462496"
    ],
    "wholesalePrice": 1700,
    "suggestedSellingPrice": 2700,
    "floorPrice": 2200,
    "ceilingPrice": 3700,
    "descriptionAr": "منتج أصلي 100% من ماركة عالمية مرموقة (LA). ينتمي لفئة منتجات البشرة والجسم، مصمم خصيصاً لتقديم العناية الفائقة والنتائج المضمونة للبشرة والجمال. مناسب للاستخدام اليومي ويضمن أعلى مستويات الجودة والأمان.",
    "descriptionFr": "La Roche Posay Anthelios Crème solaire visage hydratante très haute protection SPF50+ 50ml",
    "featuresAr": [
      "منتج أصلي 100% مستورد ومضمون",
      "توصيل سريع متاح لجميع الـ 69 ولاية",
      "هامش ربح ممتاز ومضمون للبائعين",
      "جودة عالية ونتائج مثبتة"
    ],
    "featuresFr": [
      "Produit 100% Authentique",
      "Livraison rapide dans 69 Wilayas",
      "Marge bénéficiaire garantie pour les revendeurs",
      "Qualité supérieure certifiée"
    ],
    "variants": [
      {
        "id": "var-7375429861470-1",
        "size": "Standard",
        "color": "Original",
        "colorHex": "#1e293b",
        "stockCount": 50
      }
    ],
    "isNewArrival": false,
    "isBestSeller": false
  }
];

const LOCAL_STORAGE_KEY = 'nouvamarket_products_v6';

export function getStoredProducts(): Product[] {
  try {
    // Clean up legacy keys
    ['nouvamarket_products_v1', 'nouvamarket_products_v2', 'nouvamarket_products_v3', 'nouvamarket_products_v4', 'nouvamarket_products_v5'].forEach((key) => {
      localStorage.removeItem(key);
    });

    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading products from localStorage:', e);
  }
  return MOCK_PRODUCTS;
}

export function saveStoredProducts(products: Product[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(products));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('products_updated'));
    }
  } catch (e) {
    console.error('Error saving products to localStorage:', e);
  }
}
