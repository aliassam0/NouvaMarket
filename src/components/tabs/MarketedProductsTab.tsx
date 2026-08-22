import React, { useState, useEffect } from 'react';
import { Search, Link, Share2, AlertCircle, ShoppingBag } from 'lucide-react';
import { getStoredProducts } from '../../data/mockProducts';
import { Product } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { MoneyText } from '../ui/MoneyText';
import { ProfitBadge } from '../ui/ProfitBadge';

interface MarketedProductsTabProps {
  onOpenProduct: (product: Product) => void;
  onOpenNewOrderForProduct: (product: Product) => void;
  onOpenShareModal: (product: Product) => void;
}

export function MarketedProductsTab({ onOpenProduct, onOpenNewOrderForProduct, onOpenShareModal }: MarketedProductsTabProps) {
  const { t, language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [marketedProducts, setMarketedProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchMarketedProducts = () => {
      const allProducts = getStoredProducts();
      const marketed: Product[] = [];
      
      let storageUpdated = false;

      allProducts.forEach(product => {
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
    return () => {
      window.removeEventListener('storage', fetchMarketedProducts);
      window.removeEventListener('products_updated', fetchMarketedProducts);
    };
  }, []);

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
              <Share2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              منتجاتي المسوقة
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">المنتجات التي قمت بإنشاء روابط تسويقية لها</p>
          </div>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 right-3" />
          <input
            type="text"
            placeholder={language === 'ar' ? "ابحث في منتجاتك المسوقة..." : "Rechercher..."}
            className="w-full py-2.5 pr-9 pl-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 dark:text-white transition"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400 dark:text-slate-500 space-y-3">
            <Link className="w-10 h-10 opacity-20" />
            <p className="text-sm font-semibold text-center">
              {searchTerm ? 'لم يتم العثور على منتجات مطابقة' : 'لم تقم بإنشاء أي روابط تسويقية بعد.'}
              <br/>
              <span className="text-xs mt-1 block">ملاحظة: المنتجات نافذة المخزون تحذف تلقائياً من هنا.</span>
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
            {filteredProducts.map((product) => {
              const totalStock = product.variants.reduce((acc, v) => acc + (v.stockCount || 0), 0);
              
              return (
                <div
                  key={product.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer flex flex-col"
                  onClick={() => onOpenProduct(product)}
                >
                  <div className="relative h-48 overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <img
                      src={product.images[0] || 'https://via.placeholder.com/300x300'}
                      alt={language === 'ar' ? product.nameAr : product.nameFr}
                      className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    
                    <div className="absolute top-2 end-2 flex flex-col gap-1.5 z-10">
                      <ProfitBadge
                        wholesalePrice={product.wholesalePrice}
                        suggestedPrice={product.suggestedSellingPrice}
                        className="shadow-sm backdrop-blur-md"
                      />
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        {language === 'ar' ? product.categoryAr : product.categoryFr}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-2 leading-tight mb-2 flex-1">
                      {language === 'ar' ? product.nameAr : product.nameFr}
                    </h3>

                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 font-semibold mb-0.5">سعر الجملة</span>
                        <span className="font-black text-purple-600 dark:text-purple-400 text-sm">
                          <MoneyText amount={product.wholesalePrice} />
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => { e.stopPropagation(); onOpenShareModal(product); }}
                          className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center hover:bg-purple-100 dark:hover:bg-purple-900/50 transition border border-purple-100 dark:border-purple-800/50 shadow-sm"
                          title="إدارة الروابط"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onOpenNewOrderForProduct(product); }}
                          className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 flex items-center justify-center hover:bg-slate-800 dark:hover:bg-white transition shadow-sm"
                          title="إنشاء طلبية"
                        >
                          <ShoppingBag className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
