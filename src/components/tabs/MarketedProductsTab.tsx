import React, { useState, useEffect } from 'react';
import { Search, Link as LinkIcon, Share2, ShoppingBag, Trash2, AlertTriangle, X, Layers, Plus } from 'lucide-react';
import { getStoredProducts } from '../../data/mockProducts';
import { Product } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { MoneyText } from '../ui/MoneyText';
import { ProfitBadge } from '../ui/ProfitBadge';
import { removeProductShareData, getProductShareLinks } from '../../utils/shareUtils';

interface MarketedProductsTabProps {
  onOpenProduct: (product: Product) => void;
  onOpenNewOrderForProduct: (product: Product) => void;
  onOpenShareModal: (product: Product) => void;
  onShowToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onNavigateTab?: (tab: string) => void;
}

export function MarketedProductsTab({
  onOpenProduct,
  onOpenNewOrderForProduct,
  onOpenShareModal,
  onShowToast,
  onNavigateTab,
}: MarketedProductsTabProps) {
  const { t, language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [marketedProducts, setMarketedProducts] = useState<Product[]>([]);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  useEffect(() => {
    const fetchMarketedProducts = () => {
      const allProducts = getStoredProducts();
      const marketed: Product[] = [];
      let storageUpdated = false;

      allProducts.forEach((product) => {
        const linkKey = `nouvamarket_share_links_${product.id}`;
        const configKey = `nouvamarket_share_config_${product.id}`;

        const hasLinks = localStorage.getItem(linkKey) || localStorage.getItem(configKey);

        if (hasLinks) {
          // Check stock
          const totalStock = product.variants.reduce((acc, v) => acc + (v.stockCount || 0), 0);

          if (totalStock <= 0) {
            // Remove automatically from marketed if out of stock
            localStorage.removeItem(linkKey);
            localStorage.removeItem(configKey);
            storageUpdated = true;
          } else {
            marketed.push(product);
          }
        }
      });

      setMarketedProducts(marketed);

      if (storageUpdated) {
        window.dispatchEvent(new Event('storage'));
      }
    };

    fetchMarketedProducts();
    window.addEventListener('storage', fetchMarketedProducts);
    window.addEventListener('products_updated', fetchMarketedProducts);
    window.addEventListener('marketed_products_updated', fetchMarketedProducts);

    return () => {
      window.removeEventListener('storage', fetchMarketedProducts);
      window.removeEventListener('products_updated', fetchMarketedProducts);
      window.removeEventListener('marketed_products_updated', fetchMarketedProducts);
    };
  }, []);

  const handleDeleteProduct = (product: Product) => {
    removeProductShareData(product.id);
    setMarketedProducts((prev) => prev.filter((p) => p.id !== product.id));
    setProductToDelete(null);
    if (onShowToast) {
      onShowToast(
        language === 'ar'
          ? `تم حذف "${product.nameAr}" من قائمة الروابط بنجاح`
          : `Produit retiré des liens avec succès`,
        'success'
      );
    }
  };

  const filteredProducts = marketedProducts.filter((p) => {
    return (
      p.nameAr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.nameFr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.categoryAr.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950/40">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-4 sticky top-0 z-10 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              {language === 'ar' ? 'الروابط' : 'Liens'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {language === 'ar'
                ? 'المنتجات التي قمت بإنشاء روابط تسويقية لها'
                : 'Produits avec des liens de partage actifs'}
            </p>
          </div>
          {marketedProducts.length > 0 && (
            <span className="px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-bold text-xs border border-purple-200 dark:border-purple-800/60">
              {marketedProducts.length} {language === 'ar' ? 'منتج' : 'produits'}
            </span>
          )}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 right-3" />
          <input
            type="text"
            placeholder={language === 'ar' ? 'ابحث في منتجات الروابط...' : 'Rechercher dans les liens...'}
            className="w-full py-2.5 pr-9 pl-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 dark:text-white transition"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 p-3 sm:p-4 overflow-y-auto">
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-slate-400 dark:text-slate-500 space-y-3 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
            <LinkIcon className="w-10 h-10 opacity-20 text-purple-500" />
            <div className="text-center">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                {searchTerm
                  ? language === 'ar'
                    ? 'لم يتم العثور على منتجات مطابقة للبحث'
                    : 'Aucun produit correspondant'
                  : language === 'ar'
                  ? 'لم تقم بإنشاء أي روابط تسويقية بعد'
                  : "Vous n'avez pas encore créé de liens"}
              </p>
              <p className="text-xs mt-1 text-slate-400 max-w-sm mx-auto">
                {language === 'ar'
                  ? 'اختر المنتجات الرابحة من الكتالوج، خصص سعر البيع وعروض UpSell، واحصل على روابط فورية للإعلانات'
                  : 'Sélectionnez des produits, personnalisez le prix et obtenez vos liens'}
              </p>
            </div>
            {onNavigateTab && !searchTerm && (
              <button
                id="btn-empty-state-browse-catalog"
                type="button"
                onClick={() => onNavigateTab('produits')}
                className="mt-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>تصفح كتالوج المنتجات لإنشاء أول رابط</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3.5 pb-24">
            {filteredProducts.map((product, pIdx) => {
              const links = getProductShareLinks(
                product.id,
                product.suggestedSellingPrice || product.wholesalePrice + 1000
              );
              const activeLinks = links.filter((l) => l.active).length;
              const profit = Math.max(0, (product.suggestedSellingPrice || 0) - (product.wholesalePrice || 0));

              return (
                <div
                  key={`${product.id}-${pIdx}`}
                  className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-200 group cursor-pointer flex flex-col justify-between"
                  onClick={() => onOpenProduct(product)}
                >
                  <div>
                    {/* Image & Overlay Badges */}
                    <div className="relative aspect-square sm:aspect-4/3 overflow-hidden bg-slate-100 dark:bg-slate-800">
                      <img
                        src={product.images[0] || 'https://via.placeholder.com/300x300'}
                        alt={language === 'ar' ? product.nameAr : product.nameFr}
                        className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                        loading="lazy"
                      />

                      {/* Profit Tag */}
                      <div className="absolute top-1.5 end-1.5 z-10 scale-90 sm:scale-100 origin-top-right">
                        <ProfitBadge profit={profit} />
                      </div>

                      {/* Links Badge */}
                      <div className="absolute bottom-1.5 start-1.5 z-10">
                        <span className="px-1.5 sm:px-2 py-0.5 rounded-md bg-slate-900/85 backdrop-blur-xs text-white text-[9px] sm:text-[10px] font-bold flex items-center gap-1 shadow-xs">
                          <LinkIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-purple-400 shrink-0" />
                          <span>{links.length}</span>
                          <span className="hidden xs:inline">{language === 'ar' ? 'روابط' : 'liens'}</span>
                          {activeLinks > 0 && <span className="text-emerald-400">({activeLinks})</span>}
                        </span>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-2 sm:p-3">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-slate-400 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md truncate max-w-[90px] sm:max-w-[120px]">
                          {language === 'ar' ? product.categoryAr : product.categoryFr}
                        </span>
                      </div>

                      <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white line-clamp-2 leading-snug mb-1.5 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        {language === 'ar' ? product.nameAr : product.nameFr}
                      </h3>

                      {/* Price Row */}
                      <div className="flex items-baseline justify-between gap-1 mt-1 mb-2">
                        <span className="text-[9px] sm:text-[10px] text-slate-400 font-semibold truncate">
                          {language === 'ar' ? 'الجملة:' : 'Gros:'}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {product.upsells && product.upsells.length > 0 && (
                            <span
                              title={`${product.upsells.length} عروض UpSell متوفرة`}
                              className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 text-[9px] font-extrabold border border-purple-300/40"
                            >
                              <Layers className="w-2.5 h-2.5 text-purple-600 dark:text-purple-400" />
                              <span>+{product.upsells.length} UpSell</span>
                            </span>
                          )}
                          <span className="font-black text-purple-600 dark:text-purple-400 text-xs sm:text-sm">
                            <MoneyText amount={product.wholesalePrice} />
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar: Mobile-friendly buttons */}
                  <div className="p-2 sm:p-2.5 pt-0 mt-auto">
                    <div className="grid grid-cols-3 gap-1 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenShareModal(product);
                        }}
                        className="h-8 sm:h-9 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center hover:bg-purple-100 dark:hover:bg-purple-900/50 active:scale-95 transition border border-purple-100 dark:border-purple-800/50 shadow-2xs"
                        title={language === 'ar' ? 'إدارة الروابط والمشاركة' : 'Gérer les liens'}
                      >
                        <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenNewOrderForProduct(product);
                        }}
                        className="h-8 sm:h-9 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 flex items-center justify-center hover:bg-slate-800 dark:hover:bg-white active:scale-95 transition shadow-2xs"
                        title={language === 'ar' ? 'إنشاء طلبية' : 'Créer une commande'}
                      >
                        <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setProductToDelete(product);
                        }}
                        className="h-8 sm:h-9 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 flex items-center justify-center hover:bg-rose-100 dark:hover:bg-rose-900/50 active:scale-95 transition border border-rose-100 dark:border-rose-900/40 shadow-2xs"
                        title={language === 'ar' ? 'حذف من الروابط' : 'Supprimer des liens'}
                      >
                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirmation Modal for Deleting Product from Links */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-100 dark:border-rose-900/50 flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-black text-sm">
                  {language === 'ar' ? 'حذف المنتج من الروابط' : 'Supprimer le produit des liens'}
                </h3>
              </div>
              <button
                onClick={() => setProductToDelete(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <img
                  src={productToDelete.images[0] || 'https://via.placeholder.com/100'}
                  alt={productToDelete.nameAr}
                  className="w-14 h-14 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                />
                <div className="min-w-0">
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white line-clamp-1">
                    {language === 'ar' ? productToDelete.nameAr : productToDelete.nameFr}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {language === 'ar' ? 'سعر الجملة:' : 'Prix de gros:'}{' '}
                    <span className="font-black text-purple-600 dark:text-purple-400">
                      <MoneyText amount={productToDelete.wholesalePrice} />
                    </span>
                  </p>
                </div>
              </div>

              <p className="text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                {language === 'ar'
                  ? 'هل أنت متأكد من رغبتك في حذف هذا المنتج من قائمة الروابط؟ سيتم حذف جميع الروابط التسويقية المرتبطة به ولن تظهر في صفحة الروابط بعد الآن.'
                  : 'Êtes-vous sûr de vouloir supprimer ce produit de vos liens ? Tous les liens de partage associés seront supprimés définitivement.'}
              </p>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleDeleteProduct(productToDelete)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{language === 'ar' ? 'تأكيد الحذف' : 'Confirmer la suppression'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setProductToDelete(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs transition cursor-pointer"
                >
                  {language === 'ar' ? 'إلغاء' : 'Annuler'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
