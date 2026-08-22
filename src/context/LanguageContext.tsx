import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language } from '../types';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  isRtl: boolean;
  t: (key: string, defaultText?: string) => string;
}

const TRANSLATIONS: Record<Language, Record<string, string>> = {
  ar: {
    // Nav Tabs
    'tab.home': 'الرئيسية',
    'tab.products': 'المنتجات',
    'tab.orders': 'طلباتي',
    'tab.wallet': 'المحفظة',
    'tab.profile': 'الحساب',
    'tab.analytics': 'الإحصائيات',
    'tab.marketing': 'التسويق',

    // App header & welcome
    'app.title': 'Nouva Market',
    'app.subtitle': 'منصة التجارة بالعمولة والدروبشيبينغ الشاملة بالجزائر',
    'app.offline': 'أنت تعمل بدون إنترنت (Offline) — يتم حفظ الطلبات محلياً',

    // Home / Dashboard
    'home.greeting': 'مرحباً بك،',
    'home.availableEarnings': 'الأرباح المتاحة للسحب',
    'home.pendingEarnings': 'أرباح قيد التوصيل',
    'home.totalEarned': 'مجموع الأرباح المكتسبة',
    'home.withdrawBtn': 'سحب الأرباح',
    'home.activeOrders': 'الطلبيات النشطة',
    'home.newProducts': 'جديد المنتجات',
    'home.deliveryRate': 'نسبة التسليم',
    'home.ordersToday': 'طلبات اليوم',
    'home.salesThisMonth': 'مبيعات الشهر',
    'home.rankLevel': 'مستوى الحساب',
    'home.nextRank': 'الهدف للمستوى القادم',

    // Products / Catalog
    'catalog.searchPlaceholder': 'ابحث عن ساعة ذكية، سماعات، أجهزة منزلية، منتجات...',
    'catalog.allCategories': 'كل الفئات',
    'catalog.filterTitle': 'تصفية المنتجات',
    'catalog.gender': 'الجنس',
    'catalog.ageGroup': 'الفئة العمرية',
    'catalog.wholesalePrice': 'سعر الجملة:',
    'catalog.retailPrice': 'السعر المقترح:',
    'catalog.yourProfit': 'ربحك المقدر:',
    'catalog.stock': 'المخزون:',
    'catalog.inStock': 'متوفر',
    'catalog.limitedStock': 'كمية محدودة',
    'catalog.outOfStock': 'نفذت الكمية',
    'catalog.newBadge': 'جديد',
    'catalog.bestSellerBadge': 'الأكثر مبيعاً',
    'catalog.shareQuick': 'إضافة طلب',
    'catalog.createOrderBtn': 'إنشاء طلبية فورية',

    // Profit Calculator
    'calc.title': 'حاسبة الأرباح الفورية',
    'calc.sellingPrice': 'سعر البيع للزبون (دج)',
    'calc.wholesalePrice': 'سعر الجملة (المنصة)',
    'calc.netProfit': 'صافي ربحك في هذه القطعة:',
    'calc.suggested': 'استخدام السعر المقترح',

    // Order Creation Modal
    'order.newTitle': 'إنشاء طلبية جديدة',
    'order.step1': '1. السلعة والأرباح',
    'order.step2': '2. معلومات الزبون',
    'order.step3': '3. التأكيد والتوصيل',
    'order.customerName': 'اسم الزبون الكامل',
    'order.phone': 'رقم الهاتف (05/06/07)',
    'order.wilaya': 'الولاية',
    'order.commune': 'البلدية',
    'order.address': 'العنوان التفصيلي',
    'order.deliveryType': 'نوع التوصيل',
    'order.homeDelivery': 'توصيل للمنزل',
    'order.officeDelivery': 'توصيل للمكتب / نقطة استلام',
    'order.shippingFee': 'مصاريف التوصيل:',
    'order.totalAmount': 'المبلغ الإجمالي على الزبون:',
    'order.yourTotalProfit': 'صافي أرباحك في الطلبية:',
    'order.confirmBtn': 'تأكيد الطلبية وتسجيلها',
    'order.shareReceiptWhatsApp': 'إرسال وصل الطلب للزبون عبر واتساب',

    // Orders List
    'orders.title': 'سجل الطلبيات',
    'orders.all': 'الكل',
    'orders.processing': 'قيد التحضير',
    'orders.shipped': 'قيد التوصيل',
    'orders.delivered': 'تم التسليم',
    'orders.failed': 'فشل التسليم',
    'orders.cancelled': 'ملغاة',
    'orders.tracking': 'كود التتبع:',
    'orders.retryDelivery': 'إعادة محاولة التوصيل',

    // Wallet
    'wallet.title': 'محفظة الأرباح',
    'wallet.available': 'الرصيد القابل للسحب',
    'wallet.pending': 'أرباح معلقة (في الطريق)',
    'wallet.withdrawTitle': 'طلب سحب الأرباح',
    'wallet.amount': 'المبلغ المطلوب (دج)',
    'wallet.method': 'طريقة الدفع',
    'wallet.accountNum': 'رقم الحساب (CCP / RIP / Baridimob)',
    'wallet.history': 'سجل المعاملات المالية',
    'wallet.downloadStatement': 'تحميل كشف الحساب الشهري PDF',

    // Analytics
    'analytics.title': 'لوحة التحليلات والأداء',
    'analytics.period7d': '7 أيام',
    'analytics.period30d': '30 يوم',
    'analytics.period90d': '3 أشهر',
    'analytics.earningsChart': 'تطور الأرباح (دج)',
    'analytics.statusBreakdown': 'توزيع حالات الطلبيات',
    'analytics.topProducts': 'المنتجات الأكثر مبيعاً لديك',

    // Marketing AI
    'marketing.title': 'مركز التسويق بالذكاء الاصطناعي',
    'marketing.generatorTitle': 'مولد المنشورات والإعلانات',
    'marketing.platform': 'المنصة المستهدفة',
    'marketing.tone': 'نبرة الإعلان',
    'marketing.generateBtn': 'توليد النص التسويقي بواسطة Gemini AI',
    'marketing.copyBtn': 'نسخ النص',
    'marketing.shareWhatsApp': 'مشاركة مباشرة إلى WhatsApp',

    // Profile & Settings
    'profile.title': 'الحساب والخيارات',
    'profile.editProfile': 'تعديل بيانات المتجر',
    'profile.kycTitle': 'توثيق الهوية (KYC)',
    'profile.kycStatus': 'حالة التوثيق:',
    'profile.language': 'لغة التطبيق',
    'profile.devTools': 'أدوات اختبار محاكاة الشبكة',
    'profile.logout': 'تسجيل الخروج',

    // Common
    'common.cancel': 'إلغاء',
    'common.close': 'إغلاق',
    'common.save': 'حفظ',
    'common.retry': 'إعادة المحاولة',
    'common.loading': 'جاري التحميل...',
    'common.copied': 'تم النسخ بنجاح!',
  },
  fr: {
    // Nav Tabs
    'tab.home': 'Accueil',
    'tab.products': 'Produits',
    'tab.orders': 'Commandes',
    'tab.wallet': 'Portefeuille',
    'tab.profile': 'Compte',
    'tab.analytics': 'Analytics',
    'tab.marketing': 'Marketing',

    // App header & welcome
    'app.title': 'Nouva Market',
    'app.subtitle': 'Reseller Operating System — Commerce & Dropshipping',
    'app.offline': 'Mode Hors-ligne — Commandes sauvegardées en local',

    // Home / Dashboard
    'home.greeting': 'Bienvenue,',
    'home.availableEarnings': 'Gains disponibles au retrait',
    'home.pendingEarnings': 'Gains en cours de livraison',
    'home.totalEarned': 'Total des gains cumulés',
    'home.withdrawBtn': 'Retirer mes gains',
    'home.activeOrders': 'Commandes actives',
    'home.newProducts': 'Nouveautés',
    'home.deliveryRate': 'Taux de livraison',
    'home.ordersToday': 'Commandes du jour',
    'home.salesThisMonth': 'Ventes du mois',
    'home.rankLevel': 'Niveau compte',
    'home.nextRank': 'Prochain palier',

    // Products / Catalog
    'catalog.searchPlaceholder': 'Chercher une robe, ensemble, manteau...',
    'catalog.allCategories': 'Toutes catégories',
    'catalog.filterTitle': 'Filtrer le catalogue',
    'catalog.gender': 'Genre',
    'catalog.ageGroup': 'Tranche d’âge',
    'catalog.wholesalePrice': 'Prix gros:',
    'catalog.retailPrice': 'Prix suggéré:',
    'catalog.yourProfit': 'Ton profit estimé:',
    'catalog.stock': 'Stock:',
    'catalog.inStock': 'Disponible',
    'catalog.limitedStock': 'Stock limité',
    'catalog.outOfStock': 'Rupture de stock',
    'catalog.newBadge': 'Nouveau',
    'catalog.bestSellerBadge': 'Top vente',
    'catalog.shareQuick': 'Ajouter commande',
    'catalog.createOrderBtn': 'Créer une commande',

    // Profit Calculator
    'calc.title': 'Calculateur de Profit Live',
    'calc.sellingPrice': 'Prix de vente client (DZD)',
    'calc.wholesalePrice': 'Prix de gros (Plateforme)',
    'calc.netProfit': 'Ton profit net sur cet article:',
    'calc.suggested': 'Utiliser prix suggéré',

    // Order Creation Modal
    'order.newTitle': 'Nouvelle commande',
    'order.step1': '1. Articles & Profit',
    'order.step2': '2. Infos Client',
    'order.step3': '3. Validation',
    'order.customerName': 'Nom complet du client',
    'order.phone': 'N° Téléphone (05/06/07)',
    'order.wilaya': 'Wilaya',
    'order.commune': 'Commune',
    'order.address': 'Adresse détaillée',
    'order.deliveryType': 'Mode de livraison',
    'order.homeDelivery': 'À domicile',
    'order.officeDelivery': 'En bureau / point relais',
    'order.shippingFee': 'Frais de livraison:',
    'order.totalAmount': 'Total à encaisser client:',
    'order.yourTotalProfit': 'Ton profit net total:',
    'order.confirmBtn': 'Confirmer la commande',
    'order.shareReceiptWhatsApp': 'Partager le reçu client sur WhatsApp',

    // Orders List
    'orders.title': 'Mes Commandes',
    'orders.all': 'Toutes',
    'orders.processing': 'En préparation',
    'orders.shipped': 'En transit',
    'orders.delivered': 'Livrées',
    'orders.failed': 'Échecs',
    'orders.cancelled': 'Annulées',
    'orders.tracking': 'Suivi:',
    'orders.retryDelivery': 'Relancer la livraison',

    // Wallet
    'wallet.title': 'Portefeuille & Gains',
    'wallet.available': 'Solde disponible',
    'wallet.pending': 'Gains en attente',
    'wallet.withdrawTitle': 'Demande de retrait',
    'wallet.amount': 'Montant (DZD)',
    'wallet.method': 'Moyen de paiement',
    'wallet.accountNum': 'N° Compte (CCP / Baridimob / RIB)',
    'wallet.history': 'Historique des transactions',
    'wallet.downloadStatement': 'Télécharger relevé mensuel PDF',

    // Analytics
    'analytics.title': 'Tableau de bord Analytics',
    'analytics.period7d': '7 jours',
    'analytics.period30d': '30 jours',
    'analytics.period90d': '3 mois',
    'analytics.earningsChart': 'Évolution des gains (DZD)',
    'analytics.statusBreakdown': 'Répartition des statuts',
    'analytics.topProducts': 'Vos meilleures ventes',

    // Marketing AI
    'marketing.title': 'Centre Marketing IA',
    'marketing.generatorTitle': 'Générateur de textes IA',
    'marketing.platform': 'Plateforme visée',
    'marketing.tone': 'Ton du message',
    'marketing.generateBtn': 'Générer avec Gemini AI',
    'marketing.copyBtn': 'Copier le texte',
    'marketing.shareWhatsApp': 'Partager sur WhatsApp',

    // Profile & Settings
    'profile.title': 'Profil & Paramètres',
    'profile.editProfile': 'Modifier le magasin',
    'profile.kycTitle': 'Vérification d’identité (KYC)',
    'profile.kycStatus': 'Statut KYC:',
    'profile.language': 'Langue de l’application',
    'profile.devTools': 'Simulateur réseau & fiabilité',
    'profile.logout': 'Déconnexion',

    // Common
    'common.cancel': 'Annuler',
    'common.close': 'Fermer',
    'common.save': 'Enregistrer',
    'common.retry': 'Réessayer',
    'common.loading': 'Chargement...',
    'common.copied': 'Copié dans le presse-papier !',
  },
};

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('ar');

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  };

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string, defaultText?: string) => {
    return TRANSLATIONS[language][key] || defaultText || key;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        isRtl: language === 'ar',
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider');
  return ctx;
}
