import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Sparkles,
  TrendingUp,
  Package,
  ArrowRight,
  Share2,
  DollarSign,
  Tag,
  CheckCircle2,
  ChevronDown,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { PublicNavbar } from './PublicNavbar';
import { PublicFooter } from './PublicFooter';
import { SeoHead } from '../seo/SeoHead';
import { getStoredProducts } from '../../data/mockProducts';
import { Product } from '../../types';
import { useRouter } from '../../router/RouterContext';

export function PublicProductsPage({
  onOpenLogin,
  onOpenRegister,
}: {
  onOpenLogin: () => void;
  onOpenRegister: () => void;
}) {
  const { navigate } = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const products = useMemo(() => getStoredProducts(), []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['all', ...Array.from(set)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [products, searchQuery, selectedCategory]);

  // Generate ItemList JSON-LD for top products to boost Google Shopping & Rich Snippets
  const productsJsonLd = useMemo(() => {
    return {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: products.slice(0, 10).map((product, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        item: {
          '@type': 'Product',
          name: product.name,
          image: product.image,
          description: product.description || `منتج رابح متاح للتسويق بالعمولة في الجزائر بسعر جملة ${product.price} دج.`,
          offers: {
            '@type': 'Offer',
            price: product.price,
            priceCurrency: 'DZD',
            availability: 'https://schema.org/InStock',
            priceValidUntil: '2026-12-31',
          },
        },
      })),
    };
  }, [products]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <SeoHead
        title="كتالوج المنتجات وسوق الجملة | نوفا ماركت الجزائر"
        description="تصفح آلاف المنتجات الرابحة بأسعار الجملة في الجزائر. ابدأ التسويق بالعمولة والدروبشيبينغ بدون رأس مال مع هوامش ربح تصل إلى 2500 دج للقطعة الواحدة وشحن لـ 58 ولاية."
        keywords="منتجات دروبشيبينغ الجزائر, منتجات الجملة بالجزائر, منتجات مربحة للتسويق بالعمولة, سوق الجملة الجزائر, بضاعة جملة وهران قسنطينة سطيف الجزائر, منتجات تريند الجزائر"
        canonical="https://nouvamarket.com/products"
        jsonLd={productsJsonLd}
      />

      <PublicNavbar onOpenLogin={onOpenLogin} onOpenRegister={onOpenRegister} />

      <main className="flex-1">
        {/* Hero Banner Section */}
        <section className="bg-gradient-to-b from-purple-900 via-indigo-900 to-slate-900 text-white py-12 sm:py-16 px-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-600/20 via-transparent to-transparent pointer-events-none" />
          <div className="max-w-6xl mx-auto relative z-10 text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>كتالوج منتجات دروبشيبينغ والجملة 2026 في الجزائر</span>
            </div>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
              سوق المنتجات الرابحة <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-purple-300">بأسعار الجملة المباشرة</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
              اختر أي منتج، ضعه في متجرك أو صفحتك الإعلانية، ونحن نتكفل بالتأكيد الهاتفي، الشحن لـ 58 ولاية، وتحصيل أموالك وإرسال أرباحك الصافية عبر بريدي موب.
            </p>

            {/* Quick stats pills */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-4 text-xs font-bold text-slate-300">
              <div className="px-3.5 py-1.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-emerald-400" />
                <span>+1000 منتج متوفر بالمستودعات</span>
              </div>
              <div className="px-3.5 py-1.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <span>هامش ربح حتى 3,500 دج للقطعة</span>
              </div>
              <div className="px-3.5 py-1.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-purple-400" />
                <span>توصيل سريع و COD مضمون</span>
              </div>
            </div>
          </div>
        </section>

        {/* Filter and Search Bar */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن منتج، تصنيف، أو فكرة رابحة..."
                className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                >
                  مسح
                </button>
              )}
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat === 'all' ? 'جميع التصنيفات' : cat}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Products Grid */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                قائمة المنتجات المتاحة للتسويق ({filteredProducts.length})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                أسعار الجملة الرسمية مع هوامش الربح المقترحة لكل قطعة
              </p>
            </div>
            <button
              onClick={onOpenRegister}
              className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1"
            >
              <span>تسجيل مسوق للوصول الفوري للروابط</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800 space-y-3">
              <Package className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-200">لم يتم العثور على منتجات مطابقة للبحث</h3>
              <p className="text-xs text-slate-500">جرب البحث بكلمات أخرى أو اختر تصنيفاً مختلفاً.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {filteredProducts.map((product) => {
                const wholesalePrice = product.price || 1500;
                const suggestedSellingPrice = Math.round(wholesalePrice * 1.55);
                const estimatedProfit = suggestedSellingPrice - wholesalePrice;

                return (
                  <article
                    key={product.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col group"
                  >
                    {/* Image Box */}
                    <div className="relative aspect-square bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <img
                        src={product.image}
                        alt={`${product.name} - منتج دروبشيبينغ في الجزائر`}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-2.5 right-2.5">
                        <span className="px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-sm text-[10px] font-black text-white">
                          {product.category || 'عام'}
                        </span>
                      </div>
                      <div className="absolute bottom-2.5 left-2.5">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-[10px] font-extrabold text-white flex items-center gap-1 shadow-sm">
                          <span>ربح: +{estimatedProfit.toLocaleString()} دج</span>
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-purple-600 transition-colors">
                          {product.name}
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                          {product.description || 'منتج عالي الجودة ومطلوب بشدة في السوق الجزائري مع ضمان التوصيل.'}
                        </p>
                      </div>

                      {/* Pricing Info */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                        <div className="flex items-center justify-between text-xs">
                          <div>
                            <span className="text-[10px] text-slate-400 block">سعر الجملة للمسوق</span>
                            <span className="font-black text-purple-600 dark:text-purple-400 text-sm">
                              {wholesalePrice.toLocaleString()} دج
                            </span>
                          </div>
                          <div className="text-left">
                            <span className="text-[10px] text-slate-400 block">البيع المقترح</span>
                            <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">
                              {suggestedSellingPrice.toLocaleString()} دج
                            </span>
                          </div>
                        </div>

                        {/* CTA Buttons */}
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <button
                            onClick={() => setSelectedProduct(product)}
                            className="py-2 px-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition text-center cursor-pointer"
                          >
                            معاينة سريعة
                          </button>
                          <button
                            onClick={() => navigate(`/p/${product.id}`)}
                            className="py-2 px-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition text-center flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <span>صفحة البيع</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Bottom Call to Action */}
        <section className="bg-gradient-to-r from-purple-700 to-indigo-800 text-white py-12 px-4 text-center my-8 rounded-3xl max-w-7xl mx-auto shadow-xl">
          <div className="max-w-2xl mx-auto space-y-4">
            <h2 className="text-xl sm:text-3xl font-black">
              هل أنت مورد أو صاحب مصنع؟ اعرض منتجاتك الآن
            </h2>
            <p className="text-xs sm:text-sm text-purple-100 leading-relaxed">
              اربط منتجاتك مع أكثر من 15,000 مسوق نشط في جميع ولايات الجزائر. نضمن لك بيعاً سريعاً، تسويات أسبوعية مؤكدة، وبدون أي عمولات خفية.
            </p>
            <div className="pt-2 flex flex-wrap justify-center gap-3">
              <button
                onClick={() => navigate('/suppliers')}
                className="px-6 py-3 rounded-xl bg-white text-purple-800 font-black text-xs sm:text-sm hover:bg-purple-50 transition shadow-md cursor-pointer"
              >
                انضم كمورد معتمد
              </button>
              <button
                onClick={onOpenRegister}
                className="px-6 py-3 rounded-xl bg-purple-900/60 border border-white/30 text-white font-bold text-xs sm:text-sm hover:bg-purple-900 transition cursor-pointer"
              >
                فتح حساب مسوق بالعمولة
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Quick Preview Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 p-6 relative">
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute left-4 top-4 p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 transition"
            >
              ✕
            </button>

            <img
              src={selectedProduct.image}
              alt={selectedProduct.name}
              className="w-full h-56 object-cover rounded-2xl"
            />
            <div className="space-y-2">
              <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                {selectedProduct.category}
              </span>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {selectedProduct.name}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {selectedProduct.description || 'منتج مضمون للتسويق بالعمولة في الجزائر مع سرعة توصيل عالية وتحصيل أموال سريع.'}
              </p>
            </div>

            <div className="bg-purple-50 dark:bg-purple-950/40 p-3.5 rounded-2xl border border-purple-100 dark:border-purple-900 flex justify-between items-center text-xs">
              <div>
                <span className="text-slate-500 block text-[10px]">سعر الجملة</span>
                <span className="font-black text-purple-700 dark:text-purple-300 text-sm">{selectedProduct.price} دج</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">ربحك المقترح</span>
                <span className="font-black text-emerald-600 text-sm">+{Math.round(selectedProduct.price * 0.5)} دج</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">المخزون</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">{selectedProduct.stock || 100} قطعة</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => {
                  setSelectedProduct(null);
                  navigate(`/p/${selectedProduct.id}`);
                }}
                className="py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs transition cursor-pointer text-center"
              >
                صفحة الزبون والطلب
              </button>
              <button
                onClick={() => {
                  setSelectedProduct(null);
                  onOpenRegister();
                }}
                className="py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs transition cursor-pointer text-center"
              >
                تسجيل لبدء البيع
              </button>
            </div>
          </div>
        </div>
      )}

      <PublicFooter />
    </div>
  );
}

function ArrowLeft(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m12 19-7-7 7-7"/>
      <path d="M19 12H5"/>
    </svg>
  );
}
