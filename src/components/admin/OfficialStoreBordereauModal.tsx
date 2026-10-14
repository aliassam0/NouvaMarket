import React from 'react';
import {
  Printer,
  X,
  Package,
  Truck,
  CheckCircle2,
  Phone,
  MapPin,
  Calendar,
  AlertCircle,
  ShieldCheck,
  Building,
  QrCode,
  FileText
} from 'lucide-react';
import { Order } from '../../types';

interface OfficialStoreBordereauModalProps {
  order: Order | null;
  courierName: string;
  onClose: () => void;
  onConfirmPrinted?: (orderId: string) => void;
}

export function OfficialStoreBordereauModal({
  order,
  courierName,
  onClose,
  onConfirmPrinted,
}: OfficialStoreBordereauModalProps) {
  if (!order) return null;

  const trackingNumber =
    order.trackingCode ||
    `NV-${(order.courierPartnerId || courierName || 'YAL').toUpperCase().slice(0, 3)}-${order.id.replace(/\D/g, '').slice(-6) || '202688'}`;

  const totalCodAmount = (order.totalAmount || 0) + (order.shippingFee || 0);
  const formattedDate = new Date().toLocaleDateString('fr-DZ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const formattedTime = new Date().toLocaleTimeString('fr-DZ', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const handlePrint = () => {
    if (onConfirmPrinted) {
      onConfirmPrinted(order.id);
    }
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="relative w-full max-w-3xl bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto print:border-none print:shadow-none print:rounded-none print:w-full">
        {/* Screen Header (Hidden in Print) */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <span>بوردورو شحن الطرد الرسمي (Bordereau d'Expédition)</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono">
                  #{trackingNumber}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                قسيمة شحن رسمية معتمدة للتغليف والتسليم لشركة التوصيل ({courierName})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة البوردورو</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Voucher Content */}
        <div className="p-6 sm:p-8 space-y-6 printable-voucher font-sans" dir="rtl">
          {/* Top Header: Courier & Store Brand */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded bg-slate-900 text-white text-xs font-black tracking-wider uppercase">
                  {courierName || 'YALIDINE EXPRESS'}
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-300">
                  ⚡ المتجر الرسمي NOUVA STORE
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 mt-1">
                وصل إرسال وشحن طرد تجاري (Bordereau de Colis)
              </h1>
              <p className="text-xs text-slate-600">
                مركز التجهيز والشحن: مستودع المنصة المركزي (Nouva Hub) • الدفع عند الاستلام (COD)
              </p>
            </div>

            {/* Barcode Mock Visual */}
            <div className="text-left shrink-0">
              <div className="inline-block p-2 bg-slate-50 border border-slate-300 rounded-lg text-center">
                <div className="flex items-center justify-center gap-[2px] h-10 px-2 bg-white border border-slate-200">
                  <span className="w-1 h-8 bg-slate-900 inline-block" />
                  <span className="w-0.5 h-8 bg-slate-900 inline-block" />
                  <span className="w-1.5 h-8 bg-slate-900 inline-block" />
                  <span className="w-0.5 h-8 bg-slate-900 inline-block" />
                  <span className="w-2 h-8 bg-slate-900 inline-block" />
                  <span className="w-0.5 h-8 bg-slate-900 inline-block" />
                  <span className="w-1 h-8 bg-slate-900 inline-block" />
                  <span className="w-2 h-8 bg-slate-900 inline-block" />
                  <span className="w-1 h-8 bg-slate-900 inline-block" />
                  <span className="w-0.5 h-8 bg-slate-900 inline-block" />
                  <span className="w-2 h-8 bg-slate-900 inline-block" />
                  <span className="w-1 h-8 bg-slate-900 inline-block" />
                </div>
                <div className="font-mono text-xs font-black text-slate-900 mt-1 tracking-widest">
                  {trackingNumber}
                </div>
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-1 text-center">
                تاريخ الإصدار: {formattedDate} {formattedTime}
              </div>
            </div>
          </div>

          {/* Parties: Expéditeur & Destinataire (2 columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. Shipper (Expéditeur) */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 border-b border-slate-200 pb-1.5">
                <Building className="w-4 h-4 text-emerald-600" />
                <span>المرسل (Expéditeur):</span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="font-bold text-slate-900">Nouva Official Store (المتجر الرسمي)</div>
                <div className="text-slate-600 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span className="font-mono">0550 12 34 56</span>
                </div>
                <div className="text-slate-600 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  <span>المستودع المركزي - الجزائر العاصمة (16)</span>
                </div>
                <div className="text-[10px] text-emerald-700 font-bold">
                  خدمة الزبائن: متوفرة 7/7 أيام
                </div>
              </div>
            </div>

            {/* 2. Recipient (Destinataire) */}
            <div className="p-3.5 rounded-xl border-2 border-slate-900 bg-amber-50/40 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-300 pb-1.5">
                <div className="flex items-center gap-1.5 text-xs font-black text-slate-900">
                  <MapPin className="w-4 h-4 text-amber-600" />
                  <span>المرسل إليه / الزبون (Destinataire):</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-mono text-[10px] font-black">
                  {order.deliveryType === 'home' ? 'توصيل للمنزل' : 'مكتب Stop Desk'}
                </span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="font-black text-sm text-slate-900">{order.customerName}</div>
                <div className="text-slate-800 font-mono font-bold flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{order.phone}</span>
                  {order.phone2 && (
                    <span className="text-slate-500">| {order.phone2}</span>
                  )}
                </div>
                <div className="font-bold text-slate-900 flex items-center gap-1">
                  <span className="px-2 py-0.5 bg-slate-200 rounded text-slate-800 font-black">
                    الولاية: {order.wilaya}
                  </span>
                  <span className="px-2 py-0.5 bg-slate-200 rounded text-slate-800 font-bold">
                    البلدية: {order.commune}
                  </span>
                </div>
                <div className="text-slate-700 text-[11px] leading-tight">
                  العنوان: {order.address || 'العنوان المذكور أعلاه'}
                </div>
              </div>
            </div>
          </div>

          {/* Package Content & Items Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-slate-700" />
                <span>تفاصيل ومحتويات الطرد ({order.items?.length || 1} منتجات):</span>
              </h3>
              <span className="text-[10px] text-slate-500 font-mono">
                رقم الطلبية الداخلي: #{order.id}
              </span>
            </div>

            <table className="w-full text-xs border border-slate-300 rounded-lg overflow-hidden">
              <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                <tr>
                  <th className="py-2 px-3 text-right">المنتج والمواصفات</th>
                  <th className="py-2 px-2 text-center">اللون / المقاس</th>
                  <th className="py-2 px-2 text-center">الكمية</th>
                  <th className="py-2 px-3 text-left">السعر</th>
                  <th className="py-2 px-3 text-left">الإجمالي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {order.items?.map((it, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-2 px-3 font-bold text-slate-900">
                      {it.productName}
                    </td>
                    <td className="py-2 px-2 text-center text-slate-600 font-mono text-[11px]">
                      {it.variantColor && it.variantColor !== 'Standard' ? it.variantColor : ''}
                      {it.variantSize && it.variantSize !== 'Standard' ? ` / ${it.variantSize}` : ''}
                      {(!it.variantColor || it.variantColor === 'Standard') && (!it.variantSize || it.variantSize === 'Standard') ? 'عادي' : ''}
                    </td>
                    <td className="py-2 px-2 text-center font-mono font-black text-slate-900">
                      x{it.quantity}
                    </td>
                    <td className="py-2 px-3 text-left font-mono text-slate-700">
                      {(it.sellingPrice || 0).toLocaleString()} دج
                    </td>
                    <td className="py-2 px-3 text-left font-mono font-bold text-slate-900">
                      {((it.sellingPrice || 0) * (it.quantity || 1)).toLocaleString()} دج
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial COD Summary Box (Prominent Bold Border) */}
          <div className="p-4 rounded-2xl border-2 border-slate-900 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-right">
              <div className="text-xs font-bold text-slate-600">
                المبلغ الصافي للمنتجات: {(order.totalAmount || 0).toLocaleString()} دج
              </div>
              <div className="text-xs font-bold text-slate-600">
                مصاريف التوصيل المعتمدة: {(order.shippingFee || 0).toLocaleString()} دج
              </div>
              <div className="text-[11px] text-emerald-700 font-bold flex items-center gap-1 justify-center sm:justify-start">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>ضمان الجودة والدفع بعد المعاينة والتأكد</span>
              </div>
            </div>

            <div className="p-3 px-6 rounded-xl bg-slate-900 text-white text-center shrink-0 w-full sm:w-auto">
              <div className="text-[10px] font-bold text-emerald-400 tracking-wider">
                المبلغ المطلوب تحصيله (COD à Encaisser)
              </div>
              <div className="font-mono text-2xl sm:text-3xl font-black text-white mt-0.5">
                {totalCodAmount.toLocaleString()} <span className="text-sm font-normal text-slate-300">دج</span>
              </div>
            </div>
          </div>

          {/* Delivery Driver Instructions & Platform Stamp */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-[11px] border-t border-slate-200">
            <div className="sm:col-span-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
              <div className="font-black flex items-center gap-1 text-amber-950">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>تعليمات هامة لعون التوصيل (Instructions Livreur):</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[10.5px]">
                <li><strong>يُسمح للزبون</strong> بفتح الطرد والتحقق من سلامة وجودة المحتوى قبل تسليم المبلغ.</li>
                <li>في حال تعذر الوصول للزبون، يرجى إعادة المحاولة أو إشعار الإدارة قبل تسجيل الروتور.</li>
              </ul>
            </div>

            {/* Warehouse Stamp / Signature */}
            <div className="p-3 rounded-xl border border-slate-300 text-center flex flex-col justify-between h-24 bg-white">
              <span className="text-[10px] font-bold text-slate-500">
                ختم وتأشيرة مستودع المتجر الرسمي
              </span>
              <div className="font-mono text-[9px] text-slate-400 border border-dashed border-slate-300 py-1">
                [Nouva Hub Validated]
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls (Hidden in Print) */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between print:hidden">
          <span className="text-xs text-slate-500">
            جاهز للطباعة على طابعات الليزر، الحبر، أو الطابعات الحرارية A4 / A5.
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-200 text-slate-700 font-bold text-xs transition border border-slate-300 cursor-pointer"
            >
              إغلاق
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة الآن (Ctrl + P)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
