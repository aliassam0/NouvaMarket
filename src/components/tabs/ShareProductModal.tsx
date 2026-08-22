import React, { useState } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  MessageSquare,
  Facebook,
  ExternalLink,
  Sparkles,
  Download,
  Power,
  Trash2,
  Plus,
  Tag,
  Edit3,
  Link as LinkIcon,
  AlertTriangle,
} from 'lucide-react';
import { Product } from '../../types';
import { MoneyText } from '../ui/MoneyText';
import { calculateProfit } from '../../lib/formatters';
import {
  getProductShareLinks,
  saveSingleShareLink,
  updateShareLinkPrice,
  toggleShareLinkActive,
  deleteShareLink,
  ProductShareLink,
} from '../../utils/shareUtils';
import { downloadAllImages } from '../../utils/imageDownloader';
import { isStandardSize, isStandardColor } from '../../utils/variantUtils';

interface ShareProductModalProps {
  product: Product;
  onClose: () => void;
  onShowToast: (msg: string) => void;
  onPreviewCustomerView?: (product: Product, linkId?: string) => void;
}

export function ShareProductModal({
  product,
  onClose,
  onShowToast,
  onPreviewCustomerView,
}: ShareProductModalProps) {
  const initialVariant = product.variants[0] || { size: 'Standard', color: 'Standard', colorHex: '#000' };
  const defaultSellingPrice = product.suggestedSellingPrice || product.wholesalePrice + 1000;

  // Load existing links for this product
  const [links, setLinks] = useState<ProductShareLink[]>(() =>
    getProductShareLinks(product.id, defaultSellingPrice, initialVariant.size, initialVariant.color)
  );

  // Modal Sub-Tab: 'links_list' | 'create_link'
  const [activeTab, setActiveTab] = useState<'links_list' | 'create_link'>('links_list');

  // Form state for creating a new link
  const [newTitle, setNewTitle] = useState('');
  const [newSellingPrice, setNewSellingPrice] = useState<number>(defaultSellingPrice);
  const [newSize, setNewSize] = useState<string>(initialVariant.size);
  const [newColor, setNewColor] = useState<string>(initialVariant.color);
  const [newQuantity, setNewQuantity] = useState<number>(1);

  // Price editing state for inline links: { [linkId]: editedPriceNumber }
  const [editedPrices, setEditedPrices] = useState<Record<string, number>>({});
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);

  // Available unique sizes and colors
  const sizes = Array.from(new Set(product.variants.map((v) => v.size))).filter((s) => !isStandardSize(s));
  const colors = Array.from(new Set(product.variants.map((v) => v.color))).filter((c) => !isStandardColor(c));

  const newProfit = calculateProfit(product.wholesalePrice, newSellingPrice);

  // Generate full Share URL for a specific link
  const getShareUrlForLink = (linkId: string) => {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    return `${origin}${pathname}?share=${product.id}&linkId=${linkId}`;
  };

  // Handle price update directly from list
  const handleSaveLinkPrice = (link: ProductShareLink) => {
    const targetPrice = editedPrices[link.id] ?? link.sellingPrice;
    if (targetPrice < product.wholesalePrice) {
      onShowToast('سعر البيع لا يمكن أن يكون أقل من سعر الجملة!');
      return;
    }

    const updated = updateShareLinkPrice(product.id, link.id, targetPrice, defaultSellingPrice);
    setLinks(updated);
    setEditedPrices((prev) => {
      const copy = { ...prev };
      delete copy[link.id];
      return copy;
    });
    onShowToast(`✔ تم تحديث سعر البيع لـ "${link.title || 'الرابط'}" إلى ${targetPrice} دج بنجاح!`);
  };

  // Handle toggle active/disabled status
  const handleToggleLinkActive = (link: ProductShareLink) => {
    const updated = toggleShareLinkActive(product.id, link.id, defaultSellingPrice);
    setLinks(updated);
    const newStatus = updated.find((l) => l.id === link.id)?.active;
    if (newStatus) {
      onShowToast(`🟢 تم تفعيل رابط البيع "${link.title || 'الرابط'}" بنجاح!`);
    } else {
      onShowToast(`🔴 تم تعطيل رابط البيع "${link.title || 'الرابط'}". لن يتمكن العملاء من طلب المنتج عبره.`);
    }
  };

  // Handle delete link
  const handleDeleteLink = (link: ProductShareLink) => {
    if (links.length <= 1) {
      onShowToast('يجب الإبقاء على رابط واحد على الأقل للمنتج!');
      return;
    }
    const updated = deleteShareLink(product.id, link.id, defaultSellingPrice);
    setLinks(updated);
    onShowToast(`🗑️ تم حذف رابط المشاركة بنجاح.`);
  };

  // Create new link
  const handleCreateNewLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSellingPrice < product.wholesalePrice) {
      onShowToast('سعر البيع لا يمكن أن يكون أقل من سعر الجملة!');
      return;
    }

    const titleText = newTitle.trim() || `رابط سعر ${newSellingPrice} دج`;
    const updated = saveSingleShareLink(
      {
        productId: product.id,
        title: titleText,
        sellingPrice: newSellingPrice,
        size: newSize,
        color: newColor,
        quantity: newQuantity,
        active: true,
      },
      defaultSellingPrice
    );

    setLinks(updated);
    setNewTitle('');
    setActiveTab('links_list');
    onShowToast(`✨ تم إنشاء رابط مشاركة مخصص جديد: "${titleText}"!`);
  };

  const handleCopyLink = (link: ProductShareLink) => {
    const url = getShareUrlForLink(link.id);
    navigator.clipboard.writeText(url);
    setCopiedLinkId(link.id);
    onShowToast('📋 تم نسخ رابط المنتج بنجاح!');
    setTimeout(() => setCopiedLinkId(null), 3000);
  };

  const handleWhatsApp = (link: ProductShareLink) => {
    const url = getShareUrlForLink(link.id);
    const text = `🔥 شُوف هاد المنتج المميز: ${product.nameAr}\n💰 السعر: ${link.sellingPrice} دج\n🛒 اطلب الآن مباشرة من هذا الرابط: ${url}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleFacebook = (link: ProductShareLink) => {
    const url = getShareUrlForLink(link.id);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
  };

  const handlePreviewLink = (link: ProductShareLink) => {
    const url = new URL(window.location.href);
    url.searchParams.set('share', product.id);
    url.searchParams.set('linkId', link.id);
    window.history.pushState({}, '', url.toString());

    if (onPreviewCustomerView) {
      onPreviewCustomerView(product, link.id);
    } else {
      window.dispatchEvent(new Event('popstate'));
    }
  };

  const activeLinksCount = links.filter((l) => l.active).length;
  const disabledLinksCount = links.filter((l) => !l.active).length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 bg-gradient-to-r from-violet-600 via-purple-600 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-xs">
              <Share2 className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-sm font-black">إدارة روابط مشاركة المنتج</h2>
              <p className="text-[11px] text-violet-200 font-medium">
                تعديل أسعار البيع وتفعيل/تعطيل روابط المبيعات المباشرة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product Card Summary */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={product.images[0]}
              alt={product.nameAr}
              className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
            />
            <div className="min-w-0">
              <h3 className="font-extrabold text-xs text-slate-900 dark:text-white truncate">{product.nameAr}</h3>
              <div className="flex items-center gap-2 text-[11px] mt-0.5">
                <span className="text-slate-500">سعر الجملة:</span>
                <span className="font-black text-slate-900 dark:text-white">
                  <MoneyText amount={product.wholesalePrice} />
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => downloadAllImages(product.images, product.nameAr, onShowToast)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-bold text-xs transition cursor-pointer shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">تحميل الصور</span>
          </button>
        </div>

        {/* Sub-Tabs Switcher */}
        <div className="px-4 pt-3 flex gap-2 border-b border-slate-200 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900">
          <button
            onClick={() => setActiveTab('links_list')}
            className={`py-2 px-3 rounded-t-xl text-xs font-extrabold flex items-center gap-1.5 border-b-2 transition cursor-pointer ${
              activeTab === 'links_list'
                ? 'border-violet-600 text-violet-600 dark:text-violet-400 bg-violet-50/50 dark:bg-violet-950/30'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>الروابط النشطة ({links.length})</span>
            <span className="px-1.5 py-0.2 rounded-full bg-purple-600 text-white text-[9px] font-black">
              {activeLinksCount} نشط
            </span>
            {disabledLinksCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-slate-400 text-white text-[9px] font-black">
                {disabledLinksCount} معطل
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('create_link')}
            className={`py-2 px-3 rounded-t-xl text-xs font-extrabold flex items-center gap-1.5 border-b-2 transition cursor-pointer ${
              activeTab === 'create_link'
                ? 'border-violet-600 text-violet-600 dark:text-violet-400 bg-violet-50/50 dark:bg-violet-950/30'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ إنشاء رابط جديد</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs flex-1">
          {/* TAB 1: LINKS LIST */}
          {activeTab === 'links_list' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                <span>يمكنك تعديل سعر البيع مباشرة لكل رابط أو تعطيله بنقرة واحدة:</span>
              </div>

              {links.map((link) => {
                const currentPrice = editedPrices[link.id] ?? link.sellingPrice;
                const isPriceModified = editedPrices[link.id] !== undefined && editedPrices[link.id] !== link.sellingPrice;
                const linkProfit = calculateProfit(product.wholesalePrice, currentPrice);
                const shareUrl = getShareUrlForLink(link.id);
                const isCopied = copiedLinkId === link.id;

                return (
                  <div
                    key={link.id}
                    className={`p-3.5 rounded-2xl border transition-all space-y-3 shadow-xs ${
                      link.active
                        ? 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 hover:border-violet-300 dark:hover:border-violet-700'
                        : 'bg-slate-50/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 opacity-75'
                    }`}
                  >
                    {/* Header Row: Title & Active Toggle */}
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Tag className="w-4 h-4 text-violet-500 shrink-0" />
                        <span className="font-extrabold text-slate-900 dark:text-white truncate">
                          {link.title || 'رابط مشاركة مخصص'}
                        </span>
                        {link.active ? (
                          <span className="px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-700 dark:text-purple-400 font-extrabold text-[10px] flex items-center gap-1 border border-purple-500/30 shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                            نشط
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-400 font-extrabold text-[10px] flex items-center gap-1 border border-rose-500/30 shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            معطل
                          </span>
                        )}
                      </div>

                      {/* Toggle & Delete Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleLinkActive(link)}
                          title={link.active ? 'تعطيل هذا الرابط' : 'تفعيل هذا الرابط'}
                          className={`px-2.5 py-1 rounded-xl font-bold text-[11px] flex items-center gap-1 transition cursor-pointer border ${
                            link.active
                              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 hover:bg-rose-100'
                              : 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-900 text-purple-700 dark:text-purple-300 hover:bg-purple-100'
                          }`}
                        >
                          <Power className="w-3.5 h-3.5" />
                          <span>{link.active ? 'تعطيل' : 'تفعيل'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteLink(link)}
                          title="حذف الرابط"
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Price Direct Edit Row */}
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                          <Edit3 className="w-3.5 h-3.5 text-violet-500" />
                          <span>سعر البيع المباشر:</span>
                        </label>

                        <div className="flex items-center gap-1.5">
                          <div className="relative w-32">
                            <input
                              type="number"
                              value={currentPrice}
                              onChange={(e) =>
                                setEditedPrices((prev) => ({
                                  ...prev,
                                  [link.id]: Number(e.target.value),
                                }))
                              }
                              className="w-full p-1.5 ps-2 pe-7 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-black text-slate-900 dark:text-white text-xs text-start focus:ring-2 focus:ring-violet-500"
                            />
                            <span className="absolute end-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                              دج
                            </span>
                          </div>

                          {isPriceModified && (
                            <button
                              type="button"
                              onClick={() => handleSaveLinkPrice(link)}
                              className="px-2.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-[11px] transition shadow-xs cursor-pointer"
                            >
                              حفظ
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                        <span className="text-slate-500">الربح المقدر من هذا الرابط:</span>
                        <span
                          className={`font-black ${
                            linkProfit > 0 ? 'text-purple-600 dark:text-purple-400' : 'text-rose-500'
                          }`}
                        >
                          +<MoneyText amount={linkProfit} />
                        </span>
                      </div>
                    </div>

                    {/* URL Display Box */}
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-[10px] text-slate-600 dark:text-slate-300 truncate">
                      {shareUrl}
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="grid grid-cols-4 gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleCopyLink(link)}
                        className={`py-1.5 px-2 rounded-xl font-extrabold text-[10px] flex items-center justify-center gap-1 transition cursor-pointer shadow-2xs ${
                          isCopied
                            ? 'bg-purple-600 text-white'
                            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 hover:border-violet-400'
                        }`}
                      >
                        {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3 text-violet-500" />}
                        <span>{isCopied ? 'تم النسخ' : 'نسخ'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleWhatsApp(link)}
                        className="py-1.5 px-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-[10px] flex items-center justify-center gap-1 transition cursor-pointer shadow-2xs"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>واتساب</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleFacebook(link)}
                        className="py-1.5 px-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-[10px] flex items-center justify-center gap-1 transition cursor-pointer shadow-2xs"
                      >
                        <Facebook className="w-3 h-3" />
                        <span>فيسبوك</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handlePreviewLink(link)}
                        className="py-1.5 px-2 rounded-xl bg-violet-100 dark:bg-violet-950/80 hover:bg-violet-200 dark:hover:bg-violet-900 text-violet-800 dark:text-violet-200 font-extrabold text-[10px] flex items-center justify-center gap-1 transition cursor-pointer border border-violet-200 dark:border-violet-800"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>معاينة</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: CREATE NEW LINK */}
          {activeTab === 'create_link' && (
            <form onSubmit={handleCreateNewLink} className="space-y-4">
              <div className="p-3 rounded-2xl bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-900/60 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-600 shrink-0" />
                <p className="text-[11px] text-violet-900 dark:text-violet-200 font-medium">
                  يمكنك إنشاء رابط منفصل لكل حملة إعلانية (مثلاً رابط بسعر مخفض لحملة فيسبوك، ورابط آخر لتيكتوك).
                </p>
              </div>

              {/* Title Input */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  اسم أو عنوان الرابط (اخاري):
                </label>
                <input
                  type="text"
                  placeholder="مثال: عرض خاص - 4500 دج"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-violet-500"
                />
              </div>

              {/* Selling Price */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  سعر البيع لهذا الرابط (دج):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={newSellingPrice}
                    onChange={(e) => setNewSellingPrice(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-extrabold text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-violet-500"
                  />
                  <span className="absolute end-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">دج</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">ربحك المقدر:</span>
                  <span
                    className={`font-black ${
                      newProfit > 0 ? 'text-purple-600 dark:text-purple-400' : 'text-rose-500'
                    }`}
                  >
                    +<MoneyText amount={newProfit} />
                  </span>
                </div>
              </div>

              {/* Size Selector */}
              {sizes.length > 0 && (
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">المقاس الافتراضي:</label>
                  <div className="flex flex-wrap gap-1.5">
                    {sizes.map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setNewSize(sz)}
                        className={`px-3 py-1.5 rounded-xl font-bold border transition cursor-pointer ${
                          newSize === sz
                            ? 'bg-violet-600 text-white border-violet-600'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Color Selector */}
              {colors.length > 0 && (
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">اللون الافتراضي:</label>
                  <div className="flex flex-wrap gap-1.5">
                    {colors.map((cl) => (
                      <button
                        key={cl}
                        type="button"
                        onClick={() => setNewColor(cl)}
                        className={`px-3 py-1.5 rounded-xl font-bold border transition cursor-pointer ${
                          newColor === cl
                            ? 'bg-violet-600 text-white border-violet-600'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {cl}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">الكمية الافتراضية:</label>
                <input
                  type="number"
                  min={1}
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-24 p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                />
              </div>

              {/* Create Submit Button */}
              <button
                type="submit"
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-600 to-purple-600 hover:from-purple-500 hover:to-purple-500 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>حفظ وإنشاء هذا الرابط الجديد</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
