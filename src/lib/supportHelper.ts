import { SystemUser } from '../types';
import { getStoredSystemUsers } from './systemUserHelper';
import { getStoredSellers } from './sellerHelper';
import { getStoredSuppliers } from './supplierHelper';

export type AutoDistributionAlgorithm = 'BALANCED_WORKLOAD' | 'CAPACITY_PRELOAD' | 'ROUND_ROBIN';

export interface AutoDistributionConfig {
  enabledAutoOnRegister: boolean;
  algorithm: AutoDistributionAlgorithm;
  maxCapacityPerAgent: number;
  agentQuotas?: Record<string, number>;
}

export interface AgentWorkloadStat {
  agentId: string;
  agentName: string;
  status: string;
  assignedResellersCount: number;
  assignedSuppliersCount: number;
  totalLoad: number;
  maxCapacity: number;
  loadPercent: number;
  availableCapacity: number;
}

export interface AutoDistributionResult {
  success: boolean;
  distributedResellersCount: number;
  distributedSuppliersCount: number;
  totalDistributed: number;
  agentBreakdown: Record<string, { agentName: string; resellersAssigned: number; suppliersAssigned: number; newTotal: number }>;
}

export interface TicketMessage {
  id: string;
  sender: 'RESELLER' | 'SUPPORT' | 'ADMIN';
  senderName: string;
  text: string;
  timestamp: string;
  attachmentUrl?: string;
}

export type TicketCategory =
  | 'ORDERS'
  | 'WITHDRAWAL'
  | 'STORE_SYNC'
  | 'PIXEL_TRACKING'
  | 'PRODUCTS'
  | 'ACCOUNT'
  | 'GENERAL';

export type TicketStatus = 'NEW' | 'IN_PROGRESS' | 'WAITING_RESELLER' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface SupportTicket {
  id: string; // e.g. TCK-8801
  resellerId: string;
  resellerName: string;
  resellerPhone: string;
  resellerStoreName?: string;
  assignedAgentId?: string;
  assignedAgentName?: string;
  category: TicketCategory;
  categoryLabelAr: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  relatedOrderId?: string;
  lastMessage: string;
  lastMessageAt: string;
  createdAt: string;
  unreadBySupport?: boolean;
  messages: TicketMessage[];
}

export interface SupportAssignment {
  resellerId: string;
  resellerName?: string;
  resellerPhone?: string;
  resellerStoreName?: string;
  agentId: string;
  agentName: string;
  assignedAt: string;
  assignedByAdmin?: string;
  notes?: string;
}

export interface SupplierSupportAssignment {
  supplierId: string;
  supplierName: string;
  companyName?: string;
  supplierPhone?: string;
  supplierWilaya?: string;
  activityType?: string;
  agentId: string;
  agentName: string;
  assignedAt: string;
  assignedByAdmin?: string;
  notes?: string;
}

export interface QuickCannedReply {
  id: string;
  category: string;
  title: string;
  content: string;
}

const STORAGE_KEY_TICKETS = 'nouva_support_tickets_v1';
const STORAGE_KEY_ASSIGNMENTS = 'nouva_reseller_support_assignments_v1';
const STORAGE_KEY_SUPPLIER_ASSIGNMENTS = 'nouva_supplier_support_assignments_v1';
const STORAGE_KEY_AUTO_DISTRIBUTION_CONFIG = 'nouva_auto_distribution_config_v1';

export const INITIAL_SUPPORT_TICKETS: SupportTicket[] = [
  {
    id: 'TCK-9401',
    resellerId: 'sel-101',
    resellerName: 'أحمد بن علي',
    resellerPhone: '0555123456',
    resellerStoreName: 'متجر الأناقة ديزاد',
    assignedAgentId: 'sys-usr-support-1',
    assignedAgentName: 'سارة مراد (الدعم الفني للمسوقين)',
    category: 'ORDERS',
    categoryLabelAr: 'متابعة وتعديل طلبيات',
    subject: 'الزبون يطلب تغيير ولاية التوصيل من وهران إلى مستغانم',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    relatedOrderId: 'ORD-8941',
    lastMessage: 'تم التواصل مع مندوب الشحن وتحديث وجهة الطرد رقم #ORD-8941 بنجاح.',
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    unreadBySupport: false,
    messages: [
      {
        id: 'msg-1',
        sender: 'RESELLER',
        senderName: 'أحمد بن علي',
        text: 'السلام عليكم، الزبون في الطلب #ORD-8941 اتصل بي وأخبرني أنه انتقل إلى ولاية مستغانم (دائرة سيدي علي) ويريد استلام الطرد هناك بدلاً من وهران. هل يمكن تعديلها قبل خروج السائق؟',
        timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      },
      {
        id: 'msg-2',
        sender: 'SUPPORT',
        senderName: 'سارة مراد',
        text: 'وعليكم السلام ورحمة الله أخي أحمد، بالتأكيد! قمنا الآن بالتنسيق مع مركز فرز شركة التوصيل وتعديل بوليصة الشحن نحو مستغانم - سيدي علي، ورقم هاتف الزبون مؤكد.',
        timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
      },
    ],
  },
  {
    id: 'TCK-9402',
    resellerId: 'sel-102',
    resellerName: 'ياسين بلعباس',
    resellerPhone: '0661987654',
    resellerStoreName: 'ProTech Algérie',
    assignedAgentId: 'sys-usr-support-1',
    assignedAgentName: 'سارة مراد (الدعم الفني للمسوقين)',
    category: 'STORE_SYNC',
    categoryLabelAr: 'ربط المتاجر (Shopify / YouCan)',
    subject: 'مساعدة في استيراد المنتجات والربط التلقائي للمخزون بمتجر YouCan',
    status: 'WAITING_RESELLER',
    priority: 'MEDIUM',
    lastMessage: 'يرجى تزويدنا بـ API Token الخاص بمتجرك في YouCan لضبط المزامنة الفورية.',
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
    unreadBySupport: false,
    messages: [
      {
        id: 'msg-3',
        sender: 'RESELLER',
        senderName: 'ياسين بلعباس',
        text: 'أريد ربط متجري في يوكان مع Nouva Market لمزامنة كميات المخزون وسحب الطلبيات أوتوماتيكياً.',
        timestamp: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
      },
      {
        id: 'msg-4',
        sender: 'SUPPORT',
        senderName: 'سارة مراد',
        text: 'أهلاً بك ياسين! تم إعداد وتفعيل قناة الربط الخاصة بمتجرك. يرجى تزويدنا بـ API Token الخاص بمتجرك في YouCan أو نسخه في تبويب "ربط المتاجر" لتبدأ المزامنة الفورية.',
        timestamp: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
      },
    ],
  },
  {
    id: 'TCK-9403',
    resellerId: 'sel-103',
    resellerName: 'فاطمة الزهراء عيساني',
    resellerPhone: '0770554433',
    resellerStoreName: 'بيوتي كوين ستور',
    assignedAgentId: 'sys-usr-support-1',
    assignedAgentName: 'سارة مراد (الدعم الفني للمسوقين)',
    category: 'WITHDRAWAL',
    categoryLabelAr: 'سحب الأرباح والمالية',
    subject: 'استفسار حول مدة وصول حوالة BaridiMob بعد قبول طلب السحب',
    status: 'RESOLVED',
    priority: 'LOW',
    lastMessage: 'تم تحويل مستحقاتك بمبلغ 35,000 دج وإرفاق وصل التحويل بنجاح.',
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 600).toISOString(),
    unreadBySupport: false,
    messages: [
      {
        id: 'msg-5',
        sender: 'RESELLER',
        senderName: 'فاطمة الزهراء عيساني',
        text: 'مرحباً، قمت بطلب سحب أرباحي بقيمة 35,000 دج عبر بريدي موب أمس، كم تستغرق المعالجة عادة؟',
        timestamp: new Date(Date.now() - 1000 * 60 * 600).toISOString(),
      },
      {
        id: 'msg-6',
        sender: 'SUPPORT',
        senderName: 'سارة مراد',
        text: 'مرحباً أختي فاطمة. تم فحص الطلب والموافقة عليه وتحويل المبلغ كاملاً إلى حساب BaridiMob الخاص بك مع إشعار رسمي ورمز العملية.',
        timestamp: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
      },
    ],
  },
  {
    id: 'TCK-9404',
    resellerId: 'sel-104',
    resellerName: 'خالد دراجي',
    resellerPhone: '0558112233',
    resellerStoreName: 'السوق الجزائري الذكي',
    category: 'PIXEL_TRACKING',
    categoryLabelAr: 'تتبع وبيكسل الحملات',
    subject: 'تثبيت بيكسل TikTok وتتبع صفحة الشكر للطلبيات المباشرة',
    status: 'NEW',
    priority: 'HIGH',
    lastMessage: 'طلبية جديدة من إعلانات تيك توك ولم تسجل في Events Manager',
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    unreadBySupport: true,
    messages: [
      {
        id: 'msg-7',
        sender: 'RESELLER',
        senderName: 'خالد دراجي',
        text: 'السلام عليكم فريق الدعم، أطلقت حملة على TikTok ووضعت البيكسل في رابط التخصيص، هل يمكنكم التأكد من إطلاق حدث Purchase بنجاح عند تسجيل الطلب؟',
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      },
    ],
  },
];

export const CANNED_QUICK_REPLIES: QuickCannedReply[] = [
  {
    id: 'qr-1',
    category: 'سحب الأرباح',
    title: 'موعد ومسار معالجة سحب الأرباح (CCP / BaridiMob)',
    content:
      'أهلاً بك أخي الكريم! تتم معالجة وتحويل طلبات سحب الأرباح يومياً وبشكل فوري بعد تأكيد تسليم الطرود واستلام مبالغ الـ COD. الحوالات عبر BaridiMob تصل خلال ساعات معدودة، بينما CCP تستغرق بين 24 إلى 48 ساعة كحد أقصى مع توفير وصل تحويل رسمي في حسابك.',
  },
  {
    id: 'qr-2',
    category: 'ربط المتاجر',
    title: 'خطوات ربط متجر Shopify أو YouCan بنقرة واحدة',
    content:
      'مرحباً بك! لربط متجرك بـ Nouva Market:\n1. توجه لتبويب "المتاجر المربوطة" في القائمة العلوية.\n2. اختر منصتك (Shopify أو YouCan أو WooCommerce).\n3. أدخل رابط المتجر ورمز الـ Access Token.\n4. فور الحفظ، يمكنك تصدير أي منتج لمتجرك مع تحديد هامش ربحك بنقرة زر واحدة!',
  },
  {
    id: 'qr-3',
    category: 'تأكيد وشحن',
    title: 'تأكيد طلبيات الزبائن والشحن إلى 69 ولاية',
    content:
      'تحية طيبة! فور تسجيلك لأي طلبية، يتولى فريق الكول سنتر المتخصص بالمنصة الاتصال بالزبون خلال أقل من ساعة لتأكيد العنوان والمقاس. بمجرد التأكيد، يخرج الطرد فوراً من أقرب مستودع مركزي للمنصة مع كود تتبع حي يظهر في حسابك.',
  },
  {
    id: 'qr-4',
    category: 'سياسة الإرجاع',
    title: 'ضمان الإرجاع وتكفل المنصة بالكامل',
    content:
      'نود طمأنتك بأن منصة Nouva Market تتحمل بالكامل تكاليف الإرجاع في حال رفض الزبون استلام الطرد أو إلغاء الطلبية، دون اقتطاع أي دينار من رصيد المسوق. أرباحك الصافية مضمونة ومحفوظة عن كل طلبية ناجحة.',
  },
  {
    id: 'qr-5',
    category: 'البيكسل والتتبع',
    title: 'تفعيل Meta و TikTok Pixel في روابط التخصيص',
    content:
      'مرحباً بك! لتتبع مبيعاتك الإعلانية، أدخل Pixel ID الخاص بك في إعدادات الحساب أو في نافذة "إنشاء رابط مخصص للمنتج". سيتم إطلاق أحداث PageView و AddToCart و Purchase تلقائياً في صفحة الطلب المباشر وصفحة الشكر.',
  },
];

/**
 * Get all support tickets
 */
export function getStoredSupportTickets(): SupportTicket[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TICKETS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_TICKETS, JSON.stringify(INITIAL_SUPPORT_TICKETS));
      return INITIAL_SUPPORT_TICKETS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    return INITIAL_SUPPORT_TICKETS;
  } catch {
    return INITIAL_SUPPORT_TICKETS;
  }
}

/**
 * Save support tickets
 */
export function saveStoredSupportTickets(tickets: SupportTicket[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_TICKETS, JSON.stringify(tickets));
    window.dispatchEvent(new CustomEvent('nouva_support_tickets_updated', { detail: tickets }));
  } catch (e) {
    console.error('Failed to save support tickets:', e);
  }
}

/**
 * Get all support assignments (Reseller <-> Support Agent)
 */
export function getStoredSupportAssignments(): Record<string, SupportAssignment> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ASSIGNMENTS);
    if (!raw) {
      // Default sample assignments
      const defaultAssignments: Record<string, SupportAssignment> = {
        'sel-101': {
          resellerId: 'sel-101',
          resellerName: 'أحمد بن علي',
          resellerPhone: '0555123456',
          resellerStoreName: 'متجر الأناقة ديزاد',
          agentId: 'sys-usr-support-1',
          agentName: 'سارة مراد',
          assignedAt: '2025-02-01',
          notes: 'مسوق متميز - يركز على الملابس والأحذية الرياضية',
        },
        'sel-102': {
          resellerId: 'sel-102',
          resellerName: 'ياسين بلعباس',
          resellerPhone: '0661987654',
          resellerStoreName: 'ProTech Algérie',
          agentId: 'sys-usr-support-1',
          agentName: 'سارة مراد',
          assignedAt: '2025-02-15',
          notes: 'متجر إلكتروني نشط في مستلزمات الهواتف والأجهزة الذكية',
        },
        'sel-103': {
          resellerId: 'sel-103',
          resellerName: 'فاطمة الزهراء عيساني',
          resellerPhone: '0770554433',
          resellerStoreName: 'بيوتي كوين ستور',
          agentId: 'sys-usr-support-1',
          agentName: 'سارة مراد',
          assignedAt: '2025-03-01',
          notes: 'مسوقة محترفة على تيك توك وإنستغرام في مجال التجميل',
        },
      };
      localStorage.setItem(STORAGE_KEY_ASSIGNMENTS, JSON.stringify(defaultAssignments));
      return defaultAssignments;
    }
    return JSON.parse(raw) || {};
  } catch {
    return {};
  }
}

/**
 * Save support assignments
 */
export function saveStoredSupportAssignments(assignments: Record<string, SupportAssignment>): void {
  try {
    localStorage.setItem(STORAGE_KEY_ASSIGNMENTS, JSON.stringify(assignments));
    window.dispatchEvent(new CustomEvent('nouva_support_assignments_updated', { detail: assignments }));
  } catch (e) {
    console.error('Failed to save support assignments:', e);
  }
}

/**
 * Assign a marketer / seller to a support agent
 */
export function assignResellerToSupportAgent(
  resellerId: string,
  agentId: string,
  agentName: string,
  extra?: {
    resellerName?: string;
    resellerPhone?: string;
    resellerStoreName?: string;
    notes?: string;
  }
): void {
  const current = getStoredSupportAssignments();
  current[resellerId] = {
    resellerId,
    resellerName: extra?.resellerName,
    resellerPhone: extra?.resellerPhone,
    resellerStoreName: extra?.resellerStoreName,
    agentId,
    agentName,
    assignedAt: new Date().toISOString().split('T')[0],
    notes: extra?.notes,
  };
  saveStoredSupportAssignments(current);

  // Also update any existing tickets for this reseller
  const tickets = getStoredSupportTickets();
  let modified = false;
  tickets.forEach((t) => {
    if (t.resellerId === resellerId) {
      t.assignedAgentId = agentId;
      t.assignedAgentName = agentName;
      modified = true;
    }
  });
  if (modified) {
    saveStoredSupportTickets(tickets);
  }
}

/**
 * Get assigned support agent for a reseller
 */
export function getAssignedSupportAgentForReseller(resellerId: string): SupportAssignment | null {
  const assignments = getStoredSupportAssignments();
  return assignments[resellerId] || null;
}

/**
 * Remove support assignment for a reseller
 */
export function unassignResellerFromSupportAgent(resellerId: string): void {
  const current = getStoredSupportAssignments();
  if (current[resellerId]) {
    delete current[resellerId];
    saveStoredSupportAssignments(current);
  }
}

/**
 * Bulk assign multiple resellers to one agent
 */
export function bulkAssignResellersToAgent(
  resellerIds: string[],
  agentId: string,
  agentName: string,
  sellersList?: { id: string; fullName: string; phone?: string; storeName?: string }[]
): void {
  const current = getStoredSupportAssignments();
  const today = new Date().toISOString().split('T')[0];

  resellerIds.forEach((rid) => {
    const s = sellersList?.find((item) => item.id === rid);
    current[rid] = {
      resellerId: rid,
      resellerName: s?.fullName,
      resellerPhone: s?.phone,
      resellerStoreName: s?.storeName,
      agentId,
      agentName,
      assignedAt: today,
    };
  });

  saveStoredSupportAssignments(current);
}

/**
 * Auto-distribute unassigned resellers evenly across active support agents
 */
export function autoDistributeUnassignedResellers(
  unassignedResellerIds: string[],
  agents: { id: string; fullName: string }[],
  sellersList?: { id: string; fullName: string; phone?: string; storeName?: string }[]
): void {
  if (!agents || agents.length === 0 || !unassignedResellerIds || unassignedResellerIds.length === 0) return;

  const current = getStoredSupportAssignments();
  const today = new Date().toISOString().split('T')[0];

  unassignedResellerIds.forEach((rid, index) => {
    const agent = agents[index % agents.length];
    const s = sellersList?.find((item) => item.id === rid);
    current[rid] = {
      resellerId: rid,
      resellerName: s?.fullName,
      resellerPhone: s?.phone,
      resellerStoreName: s?.storeName,
      agentId: agent.id,
      agentName: agent.fullName,
      assignedAt: today,
    };
  });

  saveStoredSupportAssignments(current);
}

/**
 * Get all stored supplier support assignments
 */
export function getStoredSupplierSupportAssignments(): Record<string, SupplierSupportAssignment> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SUPPLIER_ASSIGNMENTS);
    if (!raw) {
      const defaultAssignments: Record<string, SupplierSupportAssignment> = {
        'sup-201': {
          supplierId: 'sup-201',
          supplierName: 'أحمد بن قاسم',
          companyName: 'مصنع الأقمشة والملابس الجاهزة',
          supplierPhone: '0770987654',
          supplierWilaya: '19 - سطيف',
          activityType: 'ألبسة ونسيج وتصنيع',
          agentId: 'sys-usr-support-1',
          agentName: 'سارة مراد',
          assignedAt: '2025-02-15',
          notes: 'مورد معتمد للألبسة الجاهزة، يحتاج مرافقة في توريد الشحنات لمستودع المنصة',
        },
      };
      localStorage.setItem(STORAGE_KEY_SUPPLIER_ASSIGNMENTS, JSON.stringify(defaultAssignments));
      return defaultAssignments;
    }
    return JSON.parse(raw) || {};
  } catch {
    return {};
  }
}

/**
 * Save supplier support assignments
 */
export function saveStoredSupplierSupportAssignments(
  assignments: Record<string, SupplierSupportAssignment>
): void {
  try {
    localStorage.setItem(STORAGE_KEY_SUPPLIER_ASSIGNMENTS, JSON.stringify(assignments));
    window.dispatchEvent(
      new CustomEvent('nouva_supplier_support_assignments_updated', { detail: assignments })
    );
  } catch (e) {
    console.error('Failed to save supplier support assignments:', e);
  }
}

/**
 * Assign a supplier / vendor to a support agent
 */
export function assignSupplierToSupportAgent(
  supplierId: string,
  agentId: string,
  agentName: string,
  extra?: {
    supplierName?: string;
    companyName?: string;
    supplierPhone?: string;
    supplierWilaya?: string;
    activityType?: string;
    notes?: string;
  }
): void {
  const current = getStoredSupplierSupportAssignments();
  current[supplierId] = {
    supplierId,
    supplierName: extra?.supplierName || 'بائع / مورد',
    companyName: extra?.companyName,
    supplierPhone: extra?.supplierPhone,
    supplierWilaya: extra?.supplierWilaya,
    activityType: extra?.activityType,
    agentId,
    agentName,
    assignedAt: new Date().toISOString().split('T')[0],
    notes: extra?.notes,
  };
  saveStoredSupplierSupportAssignments(current);
}

/**
 * Get assigned support agent for a supplier
 */
export function getAssignedSupportAgentForSupplier(
  supplierId: string
): SupplierSupportAssignment | null {
  const assignments = getStoredSupplierSupportAssignments();
  return assignments[supplierId] || null;
}

/**
 * Remove support assignment for a supplier
 */
export function unassignSupplierFromSupportAgent(supplierId: string): void {
  const current = getStoredSupplierSupportAssignments();
  if (current[supplierId]) {
    delete current[supplierId];
    saveStoredSupplierSupportAssignments(current);
  }
}

/**
 * Bulk assign multiple suppliers to one agent
 */
export function bulkAssignSuppliersToAgent(
  supplierIds: string[],
  agentId: string,
  agentName: string,
  suppliersList?: {
    id: string;
    fullName: string;
    companyName?: string;
    phone?: string;
    wilaya?: string;
    activityType?: string;
  }[]
): void {
  const current = getStoredSupplierSupportAssignments();
  const today = new Date().toISOString().split('T')[0];

  supplierIds.forEach((sid) => {
    const s = suppliersList?.find((item) => item.id === sid);
    current[sid] = {
      supplierId: sid,
      supplierName: s?.fullName || 'بائع / مورد',
      companyName: s?.companyName,
      supplierPhone: s?.phone,
      supplierWilaya: s?.wilaya,
      activityType: s?.activityType,
      agentId,
      agentName,
      assignedAt: today,
    };
  });

  saveStoredSupplierSupportAssignments(current);
}

/**
 * Auto-distribute unassigned suppliers evenly across active support agents
 */
export function autoDistributeUnassignedSuppliers(
  unassignedSupplierIds: string[],
  agents: { id: string; fullName: string }[],
  suppliersList?: {
    id: string;
    fullName: string;
    companyName?: string;
    phone?: string;
    wilaya?: string;
    activityType?: string;
  }[]
): void {
  if (!agents || agents.length === 0 || !unassignedSupplierIds || unassignedSupplierIds.length === 0)
    return;

  const current = getStoredSupplierSupportAssignments();
  const today = new Date().toISOString().split('T')[0];

  unassignedSupplierIds.forEach((sid, index) => {
    const agent = agents[index % agents.length];
    const s = suppliersList?.find((item) => item.id === sid);
    current[sid] = {
      supplierId: sid,
      supplierName: s?.fullName || 'بائع / مورد',
      companyName: s?.companyName,
      supplierPhone: s?.phone,
      supplierWilaya: s?.wilaya,
      activityType: s?.activityType,
      agentId: agent.id,
      agentName: agent.fullName,
      assignedAt: today,
    };
  });

  saveStoredSupplierSupportAssignments(current);
}

/**
 * Get all support staff users (System users with RESELLER_SUPPORT role)
 */
export function getSupportStaffAgents(): SystemUser[] {
  const sysUsers = getStoredSystemUsers();
  return sysUsers.filter((u) => u.role === 'RESELLER_SUPPORT' && u.status === 'ACTIVE');
}

/**
 * Retrieve stored auto-distribution configuration
 */
export function getAutoDistributionConfig(): AutoDistributionConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUTO_DISTRIBUTION_CONFIG);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return {
    enabledAutoOnRegister: true,
    algorithm: 'BALANCED_WORKLOAD',
    maxCapacityPerAgent: 30,
    agentQuotas: {},
  };
}

/**
 * Save auto-distribution configuration
 */
export function saveAutoDistributionConfig(config: AutoDistributionConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY_AUTO_DISTRIBUTION_CONFIG, JSON.stringify(config));
    window.dispatchEvent(
      new CustomEvent('nouva_auto_distribution_config_updated', { detail: config })
    );
  } catch (err) {
    console.error('Failed to save auto distribution config:', err);
  }
}

/**
 * Calculate live workload metrics for each support agent
 */
export function getAgentWorkloadMatrix(
  agents?: { id: string; fullName: string; status?: string }[]
): AgentWorkloadStat[] {
  const staff = agents || getSupportStaffAgents();
  const config = getAutoDistributionConfig();
  const resellerAssignments = getStoredSupportAssignments();
  const supplierAssignments = getStoredSupplierSupportAssignments();

  return staff.map((agent) => {
    let resellersCount = 0;
    Object.values(resellerAssignments).forEach((a) => {
      if (a && a.agentId === agent.id) resellersCount++;
    });

    let suppliersCount = 0;
    Object.values(supplierAssignments).forEach((a) => {
      if (a && a.agentId === agent.id) suppliersCount++;
    });

    const totalLoad = resellersCount + suppliersCount;
    const maxCapacity = config.agentQuotas?.[agent.id] || config.maxCapacityPerAgent || 30;
    const loadPercent = Math.min(100, Math.round((totalLoad / Math.max(1, maxCapacity)) * 100));
    const availableCapacity = Math.max(0, maxCapacity - totalLoad);

    return {
      agentId: agent.id,
      agentName: agent.fullName,
      status: agent.status || 'ACTIVE',
      assignedResellersCount: resellersCount,
      assignedSuppliersCount: suppliersCount,
      totalLoad,
      maxCapacity,
      loadPercent,
      availableCapacity,
    };
  });
}

/**
 * Execute automated distribution of marketers and/or suppliers to support agents
 * Supports Fair Balanced Workload, Capacity Preload, and Round-Robin algorithms
 */
export function executeAutoDistribution(params: {
  target: 'RESELLERS' | 'SUPPLIERS' | 'BOTH';
  mode: 'UNASSIGNED_ONLY' | 'REBALANCE_ALL';
  algorithm?: AutoDistributionAlgorithm;
  maxCapacityPerAgent?: number;
  selectedAgentIds?: string[];
}): AutoDistributionResult {
  const allAgents = getSupportStaffAgents();
  const targetAgents = allAgents.filter((a) => {
    if (params.selectedAgentIds && params.selectedAgentIds.length > 0) {
      return params.selectedAgentIds.includes(a.id);
    }
    return a.status === 'ACTIVE';
  });

  if (targetAgents.length === 0) {
    return {
      success: false,
      distributedResellersCount: 0,
      distributedSuppliersCount: 0,
      totalDistributed: 0,
      agentBreakdown: {},
    };
  }

  const config = getAutoDistributionConfig();
  const algorithm = params.algorithm || config.algorithm || 'BALANCED_WORKLOAD';
  const maxCap = params.maxCapacityPerAgent || config.maxCapacityPerAgent || 30;

  const currentResellerAssignments = { ...getStoredSupportAssignments() };
  const currentSupplierAssignments = { ...getStoredSupplierSupportAssignments() };
  const allSellers = getStoredSellers();
  const allSuppliers = getStoredSuppliers();
  const today = new Date().toISOString().split('T')[0];

  // Track live workload per agent
  const agentLoadMap = new Map<string, { agentName: string; resellers: number; suppliers: number }>();
  targetAgents.forEach((a) => {
    agentLoadMap.set(a.id, { agentName: a.fullName, resellers: 0, suppliers: 0 });
  });

  // If UNASSIGNED_ONLY, tally existing assignments for these target agents so balancing takes them into account
  if (params.mode === 'UNASSIGNED_ONLY') {
    Object.values(currentResellerAssignments).forEach((a) => {
      if (a && a.agentId && agentLoadMap.has(a.agentId)) {
        agentLoadMap.get(a.agentId)!.resellers++;
      }
    });
    Object.values(currentSupplierAssignments).forEach((a) => {
      if (a && a.agentId && agentLoadMap.has(a.agentId)) {
        agentLoadMap.get(a.agentId)!.suppliers++;
      }
    });
  } else {
    // REBALANCE_ALL: clear assignments for targeted groups so we start fresh and completely balanced
    if (params.target === 'RESELLERS' || params.target === 'BOTH') {
      Object.keys(currentResellerAssignments).forEach((k) => delete currentResellerAssignments[k]);
    }
    if (params.target === 'SUPPLIERS' || params.target === 'BOTH') {
      Object.keys(currentSupplierAssignments).forEach((k) => delete currentSupplierAssignments[k]);
    }
  }

  // Helper to pick next agent based on chosen algorithm
  let roundRobinIndex = 0;
  const pickNextAgent = (): { id: string; fullName: string } => {
    if (algorithm === 'ROUND_ROBIN') {
      const agent = targetAgents[roundRobinIndex % targetAgents.length];
      roundRobinIndex++;
      return agent;
    }

    if (algorithm === 'CAPACITY_PRELOAD') {
      // Find first agent that has remaining capacity below maxCap
      for (const ag of targetAgents) {
        const load = agentLoadMap.get(ag.id)!;
        const total = load.resellers + load.suppliers;
        if (total < maxCap) {
          return ag;
        }
      }
      // If all reached capacity, fallback to least-loaded agent
    }

    // BALANCED_WORKLOAD (Least-loaded agent first)
    let minLoad = Infinity;
    let chosenAgent = targetAgents[0];

    for (const ag of targetAgents) {
      const load = agentLoadMap.get(ag.id)!;
      const total = load.resellers + load.suppliers;
      if (total < minLoad) {
        minLoad = total;
        chosenAgent = ag;
      }
    }

    return chosenAgent;
  };

  let distributedResellersCount = 0;
  let distributedSuppliersCount = 0;

  // 1. Distribute Resellers / Marketers if requested
  if (params.target === 'RESELLERS' || params.target === 'BOTH') {
    const sellersToDistribute = allSellers.filter((s) => {
      if (params.mode === 'UNASSIGNED_ONLY') {
        return !currentResellerAssignments[s.id]?.agentId;
      }
      return true;
    });

    sellersToDistribute.forEach((seller) => {
      const assignedAgent = pickNextAgent();
      currentResellerAssignments[seller.id] = {
        resellerId: seller.id,
        resellerName: seller.fullName,
        resellerPhone: seller.phone,
        resellerStoreName: seller.storeName,
        agentId: assignedAgent.id,
        agentName: assignedAgent.fullName,
        assignedAt: today,
      };

      const load = agentLoadMap.get(assignedAgent.id)!;
      load.resellers++;
      distributedResellersCount++;
    });
  }

  // 2. Distribute Suppliers if requested
  if (params.target === 'SUPPLIERS' || params.target === 'BOTH') {
    const suppliersToDistribute = allSuppliers.filter((sup) => {
      if (params.mode === 'UNASSIGNED_ONLY') {
        return !currentSupplierAssignments[sup.id]?.agentId;
      }
      return true;
    });

    suppliersToDistribute.forEach((supplier) => {
      const assignedAgent = pickNextAgent();
      currentSupplierAssignments[supplier.id] = {
        supplierId: supplier.id,
        supplierName: supplier.fullName || 'بائع / مورد',
        companyName: supplier.companyName,
        supplierPhone: supplier.phone,
        supplierWilaya: supplier.wilaya,
        activityType: supplier.activityType,
        agentId: assignedAgent.id,
        agentName: assignedAgent.fullName,
        assignedAt: today,
      };

      const load = agentLoadMap.get(assignedAgent.id)!;
      load.suppliers++;
      distributedSuppliersCount++;
    });
  }

  // Save assignments
  saveStoredSupportAssignments(currentResellerAssignments);
  saveStoredSupplierSupportAssignments(currentSupplierAssignments);

  // Sync direct conversations and dispatch update events
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('nouva_direct_chat_updated'));
    }
  } catch {}

  const agentBreakdown: Record<
    string,
    { agentName: string; resellersAssigned: number; suppliersAssigned: number; newTotal: number }
  > = {};

  agentLoadMap.forEach((val, agId) => {
    agentBreakdown[agId] = {
      agentName: val.agentName,
      resellersAssigned: val.resellers,
      suppliersAssigned: val.suppliers,
      newTotal: val.resellers + val.suppliers,
    };
  });

  return {
    success: true,
    distributedResellersCount,
    distributedSuppliersCount,
    totalDistributed: distributedResellersCount + distributedSuppliersCount,
    agentBreakdown,
  };
}

/**
 * Execute manual distribution of specified resellers and/or suppliers to a specific agent
 */
export function executeManualDistribution(params: {
  targetAgentId: string;
  targetAgentName: string;
  resellerIds?: string[];
  supplierIds?: string[];
  notes?: string;
  sellersList?: { id: string; fullName: string; phone?: string; storeName?: string }[];
  suppliersList?: {
    id: string;
    fullName: string;
    companyName?: string;
    phone?: string;
    wilaya?: string;
    activityType?: string;
  }[];
}): { assignedResellersCount: number; assignedSuppliersCount: number } {
  let assignedResellersCount = 0;
  let assignedSuppliersCount = 0;
  const today = new Date().toISOString().split('T')[0];

  if (params.resellerIds && params.resellerIds.length > 0) {
    const currentResellers = getStoredSupportAssignments();
    params.resellerIds.forEach((rid) => {
      const s =
        params.sellersList?.find((item) => item.id === rid) ||
        getStoredSellers().find((item) => item.id === rid);
      currentResellers[rid] = {
        resellerId: rid,
        resellerName: s?.fullName || 'مسوق',
        resellerPhone: s?.phone,
        resellerStoreName: s?.storeName,
        agentId: params.targetAgentId,
        agentName: params.targetAgentName,
        assignedAt: today,
        notes: params.notes,
      };
      assignedResellersCount++;
    });
    saveStoredSupportAssignments(currentResellers);
  }

  if (params.supplierIds && params.supplierIds.length > 0) {
    const currentSuppliers = getStoredSupplierSupportAssignments();
    params.supplierIds.forEach((sid) => {
      const s =
        params.suppliersList?.find((item) => item.id === sid) ||
        getStoredSuppliers().find((item) => item.id === sid);
      currentSuppliers[sid] = {
        supplierId: sid,
        supplierName: s?.fullName || 'بائع / مورد',
        companyName: s?.companyName,
        supplierPhone: s?.phone,
        supplierWilaya: s?.wilaya,
        activityType: s?.activityType,
        agentId: params.targetAgentId,
        agentName: params.targetAgentName,
        assignedAt: today,
        notes: params.notes,
      };
      assignedSuppliersCount++;
    });
    saveStoredSupplierSupportAssignments(currentSuppliers);
  }

  return { assignedResellersCount, assignedSuppliersCount };
}

/**
 * Transfer all or selected assignments from one agent to another manually
 */
export function transferAssignmentsBetweenAgents(params: {
  fromAgentId: string;
  toAgentId: string;
  toAgentName: string;
  target: 'RESELLERS' | 'SUPPLIERS' | 'BOTH';
  specificResellerIds?: string[];
  specificSupplierIds?: string[];
}): { transferredResellers: number; transferredSuppliers: number } {
  let transferredResellers = 0;
  let transferredSuppliers = 0;
  const today = new Date().toISOString().split('T')[0];

  if (params.target === 'RESELLERS' || params.target === 'BOTH') {
    const current = getStoredSupportAssignments();
    Object.values(current).forEach((a) => {
      if (a && a.agentId === params.fromAgentId) {
        if (!params.specificResellerIds || params.specificResellerIds.includes(a.resellerId)) {
          a.agentId = params.toAgentId;
          a.agentName = params.toAgentName;
          a.assignedAt = today;
          transferredResellers++;
        }
      }
    });
    if (transferredResellers > 0) {
      saveStoredSupportAssignments(current);
    }
  }

  if (params.target === 'SUPPLIERS' || params.target === 'BOTH') {
    const current = getStoredSupplierSupportAssignments();
    Object.values(current).forEach((a) => {
      if (a && a.agentId === params.fromAgentId) {
        if (!params.specificSupplierIds || params.specificSupplierIds.includes(a.supplierId)) {
          a.agentId = params.toAgentId;
          a.agentName = params.toAgentName;
          a.assignedAt = today;
          transferredSuppliers++;
        }
      }
    });
    if (transferredSuppliers > 0) {
      saveStoredSupplierSupportAssignments(current);
    }
  }

  return { transferredResellers, transferredSuppliers };
}

/**
 * Automatically assign newly registered reseller or supplier to the least-loaded support agent
 */
export function autoAssignNewRegistration(
  partyId: string,
  partyType: 'RESELLER' | 'SUPPLIER',
  details: {
    fullName: string;
    phone?: string;
    storeName?: string;
    companyName?: string;
    wilaya?: string;
    activityType?: string;
  }
): { agentId: string; agentName: string } | null {
  const config = getAutoDistributionConfig();
  if (!config.enabledAutoOnRegister) return null;

  const agents = getSupportStaffAgents();
  if (agents.length === 0) return null;

  // Find least loaded agent
  const matrix = getAgentWorkloadMatrix(agents);
  matrix.sort((a, b) => a.totalLoad - b.totalLoad);
  const bestAgent = matrix[0];
  if (!bestAgent) return null;

  const today = new Date().toISOString().split('T')[0];

  if (partyType === 'RESELLER') {
    const current = getStoredSupportAssignments();
    current[partyId] = {
      resellerId: partyId,
      resellerName: details.fullName,
      resellerPhone: details.phone,
      resellerStoreName: details.storeName,
      agentId: bestAgent.agentId,
      agentName: bestAgent.agentName,
      assignedAt: today,
    };
    saveStoredSupportAssignments(current);
  } else {
    const current = getStoredSupplierSupportAssignments();
    current[partyId] = {
      supplierId: partyId,
      supplierName: details.fullName,
      companyName: details.companyName,
      supplierPhone: details.phone,
      supplierWilaya: details.wilaya,
      activityType: details.activityType,
      agentId: bestAgent.agentId,
      agentName: bestAgent.agentName,
      assignedAt: today,
    };
    saveStoredSupplierSupportAssignments(current);
  }

  return { agentId: bestAgent.agentId, agentName: bestAgent.agentName };
}

/**
 * Create a new support ticket
 */
export function createSupportTicket(data: {
  resellerId: string;
  resellerName: string;
  resellerPhone: string;
  resellerStoreName?: string;
  category: TicketCategory;
  categoryLabelAr: string;
  subject: string;
  messageText: string;
  priority?: TicketPriority;
  relatedOrderId?: string;
  assignedAgentId?: string;
  assignedAgentName?: string;
}): SupportTicket {
  const current = getStoredSupportTickets();
  const ticketId = `TCK-${Math.floor(1000 + Math.random() * 9000)}`;

  // Auto-find assigned agent if not provided
  let agentId = data.assignedAgentId;
  let agentName = data.assignedAgentName;
  if (!agentId) {
    const assignment = getAssignedSupportAgentForReseller(data.resellerId);
    if (assignment) {
      agentId = assignment.agentId;
      agentName = assignment.agentName;
    }
  }

  const now = new Date().toISOString();
  const newTicket: SupportTicket = {
    id: ticketId,
    resellerId: data.resellerId,
    resellerName: data.resellerName,
    resellerPhone: data.resellerPhone,
    resellerStoreName: data.resellerStoreName,
    assignedAgentId: agentId,
    assignedAgentName: agentName,
    category: data.category,
    categoryLabelAr: data.categoryLabelAr,
    subject: data.subject,
    status: 'NEW',
    priority: data.priority || 'MEDIUM',
    relatedOrderId: data.relatedOrderId,
    lastMessage: data.messageText,
    lastMessageAt: now,
    createdAt: now,
    unreadBySupport: true,
    messages: [
      {
        id: `msg-${Date.now()}`,
        sender: 'RESELLER',
        senderName: data.resellerName,
        text: data.messageText,
        timestamp: now,
      },
    ],
  };

  const updated = [newTicket, ...current];
  saveStoredSupportTickets(updated);
  return newTicket;
}

/**
 * Add a reply message to a support ticket
 */
export function replyToSupportTicket(
  ticketId: string,
  text: string,
  sender: 'SUPPORT' | 'ADMIN' | 'RESELLER',
  senderName: string,
  newStatus?: TicketStatus
): SupportTicket | null {
  const current = getStoredSupportTickets();
  const index = current.findIndex((t) => t.id === ticketId);
  if (index === -1) return null;

  const now = new Date().toISOString();
  const target = current[index];
  const newMsg: TicketMessage = {
    id: `msg-${Date.now()}`,
    sender,
    senderName,
    text,
    timestamp: now,
  };

  target.messages.push(newMsg);
  target.lastMessage = text;
  target.lastMessageAt = now;
  target.unreadBySupport = sender === 'RESELLER';
  if (newStatus) {
    target.status = newStatus;
  } else if (sender === 'SUPPORT' || sender === 'ADMIN') {
    target.status = 'WAITING_RESELLER';
  } else {
    target.status = 'IN_PROGRESS';
  }

  saveStoredSupportTickets(current);
  return target;
}

/**
 * Update ticket status directly
 */
export function updateSupportTicketStatus(ticketId: string, status: TicketStatus): boolean {
  const current = getStoredSupportTickets();
  const target = current.find((t) => t.id === ticketId);
  if (!target) return false;

  target.status = status;
  if (status === 'RESOLVED' || status === 'CLOSED') {
    target.unreadBySupport = false;
  }
  saveStoredSupportTickets(current);
  return true;
}

/**
 * Assign ticket to agent
 */
export function assignTicketToAgent(ticketId: string, agentId: string, agentName: string): boolean {
  const current = getStoredSupportTickets();
  const target = current.find((t) => t.id === ticketId);
  if (!target) return false;

  target.assignedAgentId = agentId;
  target.assignedAgentName = agentName;
  saveStoredSupportTickets(current);
  return true;
}
