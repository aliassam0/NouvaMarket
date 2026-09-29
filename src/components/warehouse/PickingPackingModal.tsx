import React, { useState, useMemo } from 'react';
import {
  X,
  PackageCheck,
  Printer,
  Boxes,
  Barcode,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Tag,
  MapPin,
  Truck,
  Check,
  Search,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Order, Product } from '../../types';
import { MoneyText } from '../ui/MoneyText';

interface PickingPackingModalProps {
  orders: Order[];
  products: Product[];
  onClose: () => void;
  onUpdateOrderStatus: (orderId: string, status: 'SHIPPED') => void;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

interface PickItem {
  key: string;
  productId: string;
  productName: string;
  productImage?: string;
  variantSize?: string;
  variantColor?: string;
  shelfLocation: string;
  barcode: string;
  totalQuantity: number;
  orderIds: string[];
}

export const PickingPackingModal: React.FC<PickingPackingModalProps> = ({
  orders,
  products,
  onClose,
  onUpdateOrderStatus,
  onShowToast,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'picking' | 'packing'>('picking');
  const [pickedKeys, setPickedKeys] = useState<Record<string, boolean>>({});
  const [selectedPackingOrderId, setSelectedPackingOrderId] = useState<string>(
    orders[0]?.id || ''
  );
  const [packedItemsMap, setPackedItemsMap] = useState<Record<string, Record<string, boolean>>>({});
  const [barcodeInput, setBarcodeInput] = useState('');

  // Map product shelf locations
  const productMetaMap = useMemo(() => {
    const map = new Map<string, { shelfLocation: string; barcode: string; image?: string }>();
    products.forEach((p) => {
      map.set(p.id, {
        shelfLocation: p.shelfLocation || 'مستودع العاصمة - رف A1',
        barcode: p.barcode || `EAN-${p.id.slice(-6)}`,
        image: p.images?.[0],
      });
    });
    return map;
  }, [products]);

  // Aggregate items across all orders for the Picking List
  const pickingList: PickItem[] = useMemo(() => {
    const agg: Record<string, PickItem> = {};

    orders.forEach((ord) => {
      ord.items.forEach((it) => {
        const key = `${it.productId}_${it.variantSize || 'std'}_${it.variantColor || 'std'}`;
        const meta = productMetaMap.get(it.productId);

        if (!agg[key]) {
          agg[key] = {
            key,
            productId: it.productId,
            productName: it.productName,
            productImage: it.productImage || meta?.image,
            variantSize: it.variantSize,
            variantColor: it.variantColor,
            shelfLocation: meta?.shelfLocation || 'مستودع المنصة - رف عام',
            barcode: meta?.barcode || `EAN-${it.productId.slice(-5)}`,
            totalQuantity: 0,
            orderIds: [],
          };
        }

        agg[key].totalQuantity += Number(it.quantity) || 1;
        if (!agg[key].orderIds.includes(ord.id)) {
          agg[key].orderIds.push(ord.id);
        }
      });
    });

    return Object.values(agg).sort((a, b) => a.shelfLocation.localeCompare(b.shelfLocation));
  }, [orders, productMetaMap]);

  const totalItemsCount = useMemo(
    () => pickingList.reduce((sum, item) => sum + item.totalQuantity, 0),
    [pickingList]
  );

  const pickedCount = useMemo(
    () =>
      pickingList.filter((item) => pickedKeys[item.key]).reduce((sum, item) => sum + item.totalQuantity, 0),
    [pickingList, pickedKeys]
  );

  const togglePickItem = (key: string) => {
    setPickedKeys((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handlePrintPickingSheet = () => {
    window.print();
  };

  // Selected Order for Packing Station
  const selectedOrder = orders.find((o) => o.id === selectedPackingOrderId) || orders[0];

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim() || !selectedOrder) return;

    const term = barcodeInput.trim().toLowerCase();
    // Match item in selected order
    const matchingItemIndex = selectedOrder.items.findIndex((it) => {
      const meta = productMetaMap.get(it.productId);
      return (
        it.productId.toLowerCase() === term ||
        it.productName.toLowerCase().includes(term) ||
        (meta?.barcode && meta.barcode.toLowerCase() === term)
      );
    });

    if (matchingItemIndex !== -1) {
      const itemKey = `${selectedOrder.id}_${matchingItemIndex}`;
      setPackedItemsMap((prev) => ({
        ...prev,
        [selectedOrder.id]: {
          ...(prev[selectedOrder.id] || {}),
          [itemKey]: true,
        },
      }));
      onShowToast(`✔ تم فحص وتأكيد وضع السلعة (${selectedOrder.items[matchingItemIndex].productName}) بالطرْد!`, 'success');
      setBarcodeInput('');
    } else {
      onShowToast(`⚠️ الرمز (${term}) لا يطابق أي سلعة في هذا الطرد!`, 'error');
    }
  };

  const isOrderFullyPacked = useMemo(() => {
    if (!selectedOrder) return false;
    const packed = packedItemsMap[selectedOrder.id] || {};
    return selectedOrder.items.every((_, idx) => packed[`${selectedOrder.id}_${idx}`]);
  }, [selectedOrder, packedItemsMap]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-5xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* MODAL HEADER */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap justify-between items-center gap-3 bg-gradient-to-r from-slate-50 to-indigo-50/40 dark:from-slate-900 dark:to-indigo-950/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-md shadow-indigo-600/20">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-slate-900 dark:text-white text-base">
                  محطة الجني المجمع والتغليف الذكي (Smart Picking & Packing)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-mono font-black border border-indigo-200 dark:border-indigo-800">
                  {orders.length} طلبية
                </span>
              </div>
              <p className="text-slate-500 text-xs">
                تجميع السلع من أرفف المستودع المركزي مرة واحدة، فحص الطرود، وتفادي أخطاء التغليف.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintPickingSheet}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
              title="طباعة بيان تحضير الطلبيات"
            >
              <Printer className="w-4 h-4 text-indigo-300" />
              <span>طباعة بيان التحضير</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* TABS SELECTOR */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-2 gap-2 text-xs font-bold">
          <button
            onClick={() => setActiveSubTab('picking')}
            className={`flex-1 py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer ${
              activeSubTab === 'picking'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/80 dark:border-slate-700 font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>1. بيان تحضير الطلبيات المجمّع (Picking Sheet)</span>
            <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 text-[10px]">
              {pickedCount}/{totalItemsCount} قطعة
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('packing')}
            className={`flex-1 py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer ${
              activeSubTab === 'packing'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/80 dark:border-slate-700 font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Barcode className="w-4 h-4" />
            <span>2. محطة فحص وتغليف الطرود (Packing Station)</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 text-[10px]">
              فحص باركود
            </span>
          </button>
        </div>

        {/* TAB 1: PICKING SHEET */}
        {activeSubTab === 'picking' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {/* Progress Bar */}
            <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-black text-indigo-950 dark:text-indigo-200 block">
                  تقدم عملية جني السلع من أرفف المستودع
                </span>
                <span className="text-[11px] text-indigo-700 dark:text-indigo-400">
                  تم التقاط <strong>{pickedCount}</strong> من إجمالي <strong>{totalItemsCount}</strong> قطعة عبر {pickingList.length} صنف مختلف.
                </span>
              </div>
              <div className="w-full sm:w-48 bg-indigo-200 dark:bg-indigo-900 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${totalItemsCount > 0 ? (pickedCount / totalItemsCount) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Picking Table */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-start text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                    <th className="p-3 text-center w-12">تم</th>
                    <th className="p-3 text-start">موقع الرف (Bin)</th>
                    <th className="p-3 text-start">المنتج والمواصفات</th>
                    <th className="p-3 text-center">الكمية الإجمالية</th>
                    <th className="p-3 text-start">كود الباركود</th>
                    <th className="p-3 text-start">الطلبيات المعنية</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {pickingList.map((item) => {
                    const isPicked = !!pickedKeys[item.key];
                    return (
                      <tr
                        key={item.key}
                        onClick={() => togglePickItem(item.key)}
                        className={`transition cursor-pointer ${
                          isPicked
                            ? 'bg-emerald-50/50 dark:bg-emerald-950/20 text-slate-500'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={isPicked}
                            onChange={() => togglePickItem(item.key)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                        </td>
                        <td className="p-3 font-mono font-black text-indigo-600 dark:text-indigo-400">
                          <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800">
                            {item.shelfLocation}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            {item.productImage ? (
                              <img
                                src={item.productImage}
                                alt={item.productName}
                                className="w-9 h-9 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                <Boxes className="w-4 h-4 text-slate-400" />
                              </div>
                            )}
                            <div>
                              <span className={`font-black block text-slate-900 dark:text-white ${isPicked ? 'line-through text-slate-400' : ''}`}>
                                {item.productName}
                              </span>
                              <span className="text-[11px] text-slate-500 font-medium">
                                المقاس: {item.variantSize || 'قياسي'} | اللون: {item.variantColor || 'أصلي'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <span className="px-3 py-1 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 font-mono font-black text-sm">
                            × {item.totalQuantity}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-[11px] text-slate-500">
                          {item.barcode}
                        </td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1 max-w-[180px]">
                            {item.orderIds.map((id) => (
                              <span
                                key={id}
                                className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                              >
                                #{id.slice(-4)}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: PACKING STATION */}
        {activeSubTab === 'packing' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col md:flex-row gap-4">
            {/* Orders Sidebar */}
            <div className="w-full md:w-72 shrink-0 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 space-y-2 bg-slate-50/40 dark:bg-slate-800/20 max-h-[60vh] overflow-y-auto">
              <span className="text-[11px] font-black text-slate-500 uppercase block mb-1">
                طلبيات الدفعة ({orders.length})
              </span>
              {orders.map((ord) => {
                const isSelected = ord.id === selectedOrder?.id;
                const packed = packedItemsMap[ord.id] || {};
                const isFullyPacked = ord.items.every((_, idx) => packed[`${ord.id}_${idx}`]);

                return (
                  <div
                    key={ord.id}
                    onClick={() => setSelectedPackingOrderId(ord.id)}
                    className={`p-2.5 rounded-xl border transition cursor-pointer text-xs space-y-1 ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-300 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-center font-bold">
                      <span className="font-mono">#{ord.id}</span>
                      <span className="text-[10px]">
                        {isFullyPacked ? '✔ جاهز للتغليف' : 'قيد الفحص'}
                      </span>
                    </div>
                    <div className="text-[11px] truncate opacity-90">
                      {ord.customerName} ({ord.wilaya})
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Packing Work Area */}
            {selectedOrder ? (
              <div className="flex-1 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 bg-white dark:bg-slate-900">
                {/* Order Top Bar */}
                <div className="flex flex-wrap justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3 gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-base text-slate-900 dark:text-white font-mono">
                        طلب #{selectedOrder.id}
                      </span>
                      {isOrderFullyPacked ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-black">
                          ✔ تم فحص جميع السلع
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-[10px] font-black">
                          يرجى فحص عناصر الطرد
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500">
                      الزبون: {selectedOrder.customerName} | {selectedOrder.phone} | {selectedOrder.wilaya} - {selectedOrder.commune}
                    </span>
                  </div>

                  <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-sm">
                    المبلغ المطلوب تحصيله: <MoneyText amount={selectedOrder.totalAmount + selectedOrder.shippingFee} />
                  </span>
                </div>

                {/* Barcode Scan Input */}
                <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
                  <div className="relative flex-1">
                    <Barcode className="w-5 h-5 absolute start-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                      placeholder="امسح باركود السلعة بالماسح أو اكتب اسم المنتج للتحقق الفوري..."
                      className="w-full ps-10 pe-3 py-2.5 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/30 dark:bg-indigo-950/20 text-xs font-mono font-bold focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black transition cursor-pointer shadow-sm"
                  >
                    فحص
                  </button>
                </form>

                {/* Items in this order */}
                <div className="space-y-2">
                  <span className="text-xs font-black text-slate-700 dark:text-slate-300 block">
                    سلع الطرد المطلوب وضعها في الكيس:
                  </span>
                  {selectedOrder.items.map((it, idx) => {
                    const itemKey = `${selectedOrder.id}_${idx}`;
                    const isChecked = !!packedItemsMap[selectedOrder.id]?.[itemKey];
                    const meta = productMetaMap.get(it.productId);

                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          setPackedItemsMap((prev) => ({
                            ...prev,
                            [selectedOrder.id]: {
                              ...(prev[selectedOrder.id] || {}),
                              [itemKey]: !isChecked,
                            },
                          }));
                        }}
                        className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between gap-3 text-xs ${
                          isChecked
                            ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                            : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                          />
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">
                              {it.productName}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              المقاس: {it.variantSize} | اللون: {it.variantColor} | الرف: {meta?.shelfLocation || 'A1'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-mono bg-white dark:bg-slate-900 px-2 py-0.5 rounded border text-xs font-black">
                            × {it.quantity}
                          </span>
                          {isChecked && (
                            <span className="text-emerald-600 font-bold text-[11px] flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>تم الفحص</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Packaging Actions */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-wrap justify-between items-center gap-3 pt-4">
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    💡 عند اكتمال الفحص، يغلق الكيس بإحكام ويوضع عليه ملصق الباركود الحراري.
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        window.print();
                        onShowToast('🖨️ جاري إرسال ملصق الشحن الحراري A6 إلى الطابعة...', 'info');
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                    >
                      <Printer className="w-3.5 h-3.5 text-indigo-400" />
                      <span>طباعة بوليصة الشحن A6</span>
                    </button>

                    <button
                      onClick={() => {
                        onUpdateOrderStatus(selectedOrder.id, 'SHIPPED');
                        onShowToast(`🚚 تم إغلاق الطرد #${selectedOrder.id} وتأكيد جاهزيته للتسليم لشركة التوصيل!`, 'success');
                      }}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-emerald-600/20"
                    >
                      <Check className="w-4 h-4" />
                      <span>تأكيد جاهزية الطرد للشحن</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};
