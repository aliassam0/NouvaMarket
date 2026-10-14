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

export const INITIAL_SUPPORT_TICKETS: SupportTicket[] = [];

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
      localStorage.setItem(STORAGE_KEY_TICKETS, JSON.stringify([]));
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Strip any old legacy dummy tickets (e.g. TCK-940*)
      const clean = parsed.filter((t) => t && t.id && !t.id.startsWith('TCK-940'));
      if (clean.length !== parsed.length) {
        localStorage.setItem(STORAGE_KEY_TICKETS, JSON.stringify(clean));
      }
      return clean;
    }
    return [];
  } catch {
    return [];
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
      return {};
    }
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      // Clean legacy dummy test reseller assignments if present
      delete parsed['sel-101'];
      delete parsed['sel-102'];
      delete parsed['sel-103'];
      return parsed;
    }
    return {};
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
      return {};
    }
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      delete parsed['sup-201'];
      return parsed;
    }
    return {};
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
