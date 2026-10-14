import React, { useState } from 'react';
import {
  X,
  Printer,
  Truck,
  FileText,
  CheckCircle2,
  Calendar,
  Building,
  UserCheck,
  ShieldCheck,
  DollarSign,
  Phone,
  Car,
  Package,
} from 'lucide-react';
import { Order, CourierManifest } from '../../types';
import { MoneyText } from '../ui/MoneyText';
import { createCourierManifest } from '../../lib/courierManifestHelper';

interface CourierManifestModalProps {
  orders: Order[];
  onClose: () => void;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  onMarkOrdersShipped?: (orderIds: string[]) => void;
}

export const CourierManifestModal: React.FC<CourierManifestModalProps> = ({
  orders,
  onClose,
  onShowToast,
  onMarkOrdersShipped,
}) => {
  const [courierName, setCourierName] = useState('Yalidine Express');
  const [driverName, setDriverName] = useState('أحمد بلحاج (سائق التوزيع)');
  const [driverPhone, setDriverPhone] = useState('0550 12 34 56');
  const [vehiclePlate, setVehiclePlate] = useState('16-54321-00');
  const [warehouseOfficer, setWarehouseOfficer] = useState('مسؤول الشحن والتوزيع - مستودع العاصمة');
  const [notes, setNotes] = useState('تسليم دفعة طرود الشحن اليومية بعد التدقيق والمطابقة');
  const [isSaved, setIsSaved] = useState(false);
  const [generatedManifest, setGeneratedManifest] = useState<CourierManifest | null>(null);

  const totalCodAmount = orders.reduce(
    (sum, o) => sum + (Number(o.totalAmount) || 0) + (Number(o.shippingFee) || 0),
    0
  );

  const manifestNumber =
    generatedManifest?.manifestNumber ||
    `MNF-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

  const handleSaveAndPrint = () => {
    if (orders.length === 0) {
      onShowToast('لا توجد طلبيات لتوليد المانيفست!', 'error');
      return;
    }

    const manifest = createCourierManifest({
      courierId: courierName.toLowerCase().replace(/\s+/g, '-'),
      courierName,
      driverName,
      driverPhone,
      vehiclePlate,
      orders,
      warehouseOfficerName: warehouseOfficer,
      notes,
    });

    setGeneratedManifest(manifest);
    setIsSaved(true);

    if (onMarkOrdersShipped) {
      onMarkOrdersShipped(orders.map((o) => o.id));
    }

    onShowToast(`✔ تم توليد وحفظ مانيفست التسليم الرسمي (${manifest.manifestNumber}) بنجاح!`, 'success');

    // Trigger Print
    setTimeout(() => {
      window.print();
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-5xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* MODAL CONTROLS HEADER */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap justify-between items-center gap-3 bg-gradient-to-r from-slate-50 to-amber-50/40 dark:from-slate-900 dark:to-amber-950/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-600 text-white rounded-2xl shadow-md shadow-amber-600/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-slate-900 dark:text-white text-base">
                  وصل تسليم الشحنات للناقل (Bordereau de Remise)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-mono font-black border border-amber-200 dark:border-amber-800">
                  {orders.length} طرد
                </span>
              </div>
              <p className="text-slate-500 text-xs">
                وثيقة التسليم الرسمية بين المستودع وشركة التوصيل تتضمن تفاصيل الطرود ومجموع تحصيل الدفع عند الاستلام COD.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveAndPrint}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-black flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-amber-600/20"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة وصل التسليم (Bordereau A4)</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* INPUTS BAR FOR DRIVER & COURIER */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">شركة التوصيل المستلمة:</label>
            <select
              value={courierName}
              onChange={(e) => setCourierName(e.target.value)}
              className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
            >
              <option value="Yalidine Express">Yalidine Express</option>
              <option value="Zimou Express">Zimou Express</option>
              <option value="E-com Delivery">E-com Delivery</option>
              <option value="Procolis Delivery">Procolis Delivery</option>
              <option value="Maystro Delivery">Maystro Delivery</option>
              <option value="ZR Express">ZR Express</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">اسم سائق التوصيل:</label>
            <input
              type="text"
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
              className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
              placeholder="مثلاً: كريم بلخير"
            />
          </div>

          <div>
            <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">رقم هاتف السائق:</label>
            <input
              type="text"
              value={driverPhone}
              onChange={(e) => setDriverPhone(e.target.value)}
              className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold"
              placeholder="0550 00 00 00"
            />
          </div>

          <div>
            <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">ترقيم سيارة الشحن:</label>
            <input
              type="text"
              value={vehiclePlate}
              onChange={(e) => setVehiclePlate(e.target.value)}
              className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold"
              placeholder="16-12345-00"
            />
          </div>
        </div>

        {/* PRINTABLE MANIFEST SHEET PREVIEW */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 dark:bg-slate-950 flex justify-center">
          <div className="bg-white text-slate-900 max-w-4xl w-full p-6 sm:p-8 rounded-2xl shadow-xl border border-slate-200 space-y-5 print:p-0 print:shadow-none print:border-none print:max-w-none">
            
            {/* Manifest Header */}
            <div className="flex flex-wrap justify-between items-start border-b-2 border-slate-900 pb-4 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-purple-700 text-white font-black flex items-center justify-center text-lg shadow-sm">
                    N
                  </div>
                  <div>
                    <h1 className="font-black text-xl text-slate-900 tracking-tight">NOUVA MARKET LOGISTICS</h1>
                    <span className="text-[11px] text-slate-500 font-bold block">
                      مركز التجهيز والشحن اللوجستي المركزي - الجزائر العاصمة
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-end">
                <span className="text-xs font-mono font-black text-amber-700 block bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 inline-block">
                  {manifestNumber}
                </span>
                <span className="text-[11px] text-slate-500 block mt-1 font-mono">
                  التاريخ: {new Date().toLocaleDateString('ar-DZ')} - {new Date().toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            {/* Document Title */}
            <div className="text-center py-1 bg-slate-900 text-white rounded-xl font-black text-sm">
              مانيفست تسليم الطرود لشركة التوصيل — BORDEREAU D'EXPÉDITION ET DE REMISE
            </div>

            {/* Handover Details Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <span className="text-[10px] text-slate-500 block">شركة التوصيل:</span>
                <strong className="text-slate-900 font-black">{courierName}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">سائق الشاحنة:</span>
                <strong className="text-slate-900">{driverName}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">الهاتف والمركبة:</span>
                <strong className="text-slate-900 font-mono">{driverPhone} ({vehiclePlate})</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">إجمالي الطرود:</span>
                <strong className="text-purple-700 font-mono font-black text-sm">{orders.length} طرد</strong>
              </div>
            </div>

            {/* Orders Table */}
            <div className="border border-slate-300 rounded-xl overflow-hidden">
              <table className="w-full text-start text-[11px] border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-black border-b border-slate-300">
                    <th className="p-2 text-center w-8">#</th>
                    <th className="p-2 text-start">رقم التتبع (Tracking)</th>
                    <th className="p-2 text-start">رقم الطلب</th>
                    <th className="p-2 text-start">اسم المستلم</th>
                    <th className="p-2 text-start">الهاتف</th>
                    <th className="p-2 text-start">الولاية والبلدية</th>
                    <th className="p-2 text-start">محتوى الطرد</th>
                    <th className="p-2 text-end">مبلغ التحصيل (COD)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {orders.map((ord, idx) => {
                    const tracking = ord.trackingCode || `DZ-${ord.id}`;
                    const cod = (Number(ord.totalAmount) || 0) + (Number(ord.shippingFee) || 0);
                    const itemsDesc = ord.items
                      .map((i) => `${i.productName} (${i.variantSize}/${i.variantColor}) × ${i.quantity}`)
                      .join(' + ');

                    return (
                      <tr key={ord.id} className="hover:bg-slate-50">
                        <td className="p-2 text-center font-bold text-slate-500">{idx + 1}</td>
                        <td className="p-2 font-mono font-black text-purple-700">{tracking}</td>
                        <td className="p-2 font-mono text-slate-600">#{ord.id.slice(-6)}</td>
                        <td className="p-2 font-bold text-slate-900">{ord.customerName}</td>
                        <td className="p-2 font-mono text-slate-700">{ord.phone}</td>
                        <td className="p-2 font-bold text-slate-800">
                          {ord.wilaya} ({ord.commune})
                        </td>
                        <td className="p-2 text-slate-600 truncate max-w-[200px]" title={itemsDesc}>
                          {itemsDesc}
                        </td>
                        <td className="p-2 text-end font-mono font-black text-slate-900">
                          <MoneyText amount={cod} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Total Summary Footer */}
            <div className="flex justify-between items-center p-3.5 bg-slate-100 rounded-xl border border-slate-300 font-black text-xs">
              <span>المجموع الكلي لشحنة التسليم:</span>
              <div className="flex items-center gap-6 font-mono text-sm">
                <span>الطرود: <strong>{orders.length} طرد</strong></span>
                <span className="text-purple-800">
                  إجمالي التحصيل COD: <MoneyText amount={totalCodAmount} />
                </span>
              </div>
            </div>

            {/* Legal Handover Clause & Signatures */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[10px] text-slate-600 leading-relaxed">
              إقرار واستلام: يشهد سائق شركة التوصيل الموقع أسفله بأنه استلم كامل الطرود المذكورة في هذا البيان بحالة مغلقة وسليمة، ويلتزم بتسليمها إلى العناوين المحددة وتحصيل مبالغ الدفع عند الاستلام (COD) لحساب المنصة.
            </div>

            <div className="grid grid-cols-2 gap-8 pt-4">
              <div className="border border-slate-300 rounded-xl p-4 h-32 flex flex-col justify-between text-xs">
                <span className="font-bold text-slate-700">ختم وتوقيع مسؤول مستودع نوفا ماركت:</span>
                <div className="text-[10px] text-slate-400 font-mono">
                  {warehouseOfficer}
                </div>
              </div>

              <div className="border border-slate-300 rounded-xl p-4 h-32 flex flex-col justify-between text-xs">
                <span className="font-bold text-slate-700">توقيع واستلام سائق شركة الشحن:</span>
                <div className="text-[10px] text-slate-400 font-mono">
                  السائق: {driverName} ({courierName})
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
