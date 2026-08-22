import React, { useState, useEffect } from 'react';
import { Search, Filter, Share2, TrendingUp, Sparkles, Plus, Layers, Heart } from 'lucide-react';
import { getStoredProducts } from '../../data/mockProducts';
import { Product, Gender } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useCategories } from '../../context/CategoryContext';
import { useOrders } from '../../context/OrderContext';
import { MoneyText } from '../ui/MoneyText';
import { ProfitBadge } from '../ui/ProfitBadge';

interface ProduitsTabProps {
  onOpenProduct: (product: Product) => void;
  onOpenNewOrderForProduct: (product: Product) => void;
  onOpenShareModal?: (product: Product) => void;
}

export function ProduitsTab({ onOpenProduct, onOpenNewOrderForProduct, onOpenShareModal }: ProduitsTabProps) {
  const { t, language } = useLanguage();
  const { categories } = useCategories();
  const { favorites = [], toggleFavorite } = useOrders();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [products, setProducts] = useState<Product[]>(getStoredProducts);

  useEffect(() => {
    const syncProducts = () => {
      setProducts(getStoredProducts());
    };
    window.addEventListener('products_updated', syncProducts);
    window.addEventListener('storage', syncProducts);
    return () => {
      window.removeEventListener('products_updated', syncProducts);
      window.removeEventListener('storage', syncProducts);
    };
  }, []);

  const visibleCategories = categories
    .filter((c) => c.visible !== false)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  const categoryChips = [
    { id: 'ALL', labelAr: 'جميع الفئات', labelFr: 'Toutes les catégories', icon: '⚡' },
    { id: 'FAVORITES', labelAr: `المفضلة (${favorites.length})`, labelFr: `Favoris (${favorites.length})`, icon: '❤️' },
    ...visibleCategories.map((cat) => ({
      id: cat.nameAr,
      labelAr: cat.nameAr,
      labelFr: cat.nameFr,
      icon: cat.icon || '🏷️',
    })),
  ];

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.nameAr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.nameFr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.categoryAr.toLowerCase().includes(searchTerm.toLowerCase());

    if (selectedCategory === 'FAVORITES') {
      return matchesSearch && favorites.includes(p.id);
    }

    const matchesCategory =
      selectedCategory === 'ALL' ||
      p.categoryAr === selectedCategory ||
      p.categoryAr.includes(selectedCategory);

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex-1 pb-24 overflow-y-auto p-4 text-slate-900 dark:text-slate-100 space-y-4">
      {/* Title Bar */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-purple-500" />
          <span>كتالوج المنتجات</span>
        </h1>
        <span className="text-xs text-slate-500 font-bold bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
          {filteredProducts.length} منتج
        </span>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={t('catalog.searchPlaceholder')}
          className="w-full ps-10 pe-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 shadow-xs"
        />
      </div>

      {/* Category Filter Chips Horizontal Scroll */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categoryChips.map((chip) => (
          <button
            key={chip.id}
            onClick={() => setSelectedCategory(chip.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
              selectedCategory === chip.id
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <span>{chip.icon}</span>
            <span>{language === 'ar' ? chip.labelAr : chip.labelFr}</span>
          </button>
        ))}
      </div>

      {/* Products Grid (FlashList simulation) */}
      <div className="grid grid-cols-2 gap-3.5">
        {filteredProducts.map((product) => {
          const maxProfit = product.suggestedSellingPrice - product.wholesalePrice;

          return (
            <div
              key={product.id}
              className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3 shadow-xs hover:shadow-md transition flex flex-col justify-between group"
            >
              <div>
                {/* Product Image */}
                <div
                  className="relative w-full aspect-4/3 rounded-xl overflow-hidden mb-2.5 bg-slate-100 cursor-pointer"
                >
                  <img
                    src={product.images[0]}
                    alt={product.nameAr}
                    onClick={() => onOpenProduct(product)}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-2 start-2 flex flex-col gap-1 pointer-events-none">
                    <span className="px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold">
                      {product.ageGroup}
                    </span>
                  </div>

                  {/* Favorite Toggle Heart Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(product.id);
                    }}
                    className="absolute top-2 end-2 p-1.5 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white backdrop-blur-md transition cursor-pointer shadow-md"
                    title={favorites.includes(product.id) ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
                  >
                    <Heart
                      className={`w-3.5 h-3.5 transition-colors ${
                        favorites.includes(product.id)
                          ? 'fill-rose-500 text-rose-500'
                          : 'text-white hover:text-rose-400'
                      }`}
                    />
                  </button>
                </div>

                {/* Product Titles */}
                <h3
                  onClick={() => onOpenProduct(product)}
                  className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 cursor-pointer hover:text-violet-600 mb-1.5"
                >
                  {language === 'ar' ? product.nameAr : product.nameFr}
                </h3>

                {/* Wholesale & Profit */}
                <div className="space-y-1 mb-3">
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>{t('catalog.wholesalePrice')}</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      <MoneyText amount={product.wholesalePrice} />
                    </span>
                  </div>

                  <div className="pt-1 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <ProfitBadge profit={maxProfit} size="sm" />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-1.5 pt-1">
                <button
                  onClick={() => onOpenProduct(product)}
                  className="px-2 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold transition text-center"
                  title="تفاصيل المنتج"
                >
                  التفاصيل
                </button>
                <button
                  onClick={() => onOpenNewOrderForProduct(product)}
                  className="flex-1 py-2 px-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-[10px] transition text-center flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>إضافة طلب</span>
                </button>
                <button
                  onClick={() => onOpenShareModal?.(product)}
                  className="py-2 px-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-extrabold text-[10px] transition text-center flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                  title="مشاركة المنتج"
                >
                  <Share2 className="w-3 h-3" />
                  <span>مشاركة المنتج</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
