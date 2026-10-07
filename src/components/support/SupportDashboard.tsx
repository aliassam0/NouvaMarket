import React, { useState, useEffect, useMemo } from 'react';
import {
  Headset,
  MessageSquare,
  Users,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Phone,
  Send,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Filter,
  Package,
  ShoppingBag,
  Sparkles,
  Copy,
  Plus,
  RefreshCw,
  X,
  FileText,
  HelpCircle,
  Truck,
  ArrowRight,
  UserCheck,
  Building2,
  Calendar,
  Layers,
  MessageCircle,
  CheckCheck,
  Download,
  History,
  ShieldCheck,
} from 'lucide-react';
import {
  DirectChatConversation,
  getConversationsForAgent,
  sendDirectChatMessage,
  markDirectConversationRead,
  exportDirectChatHistoryAsText,
  formatChatDateSeparator,
  getOrCreateDirectConversation,
} from '../../lib/directChatHelper';
import { useAuth } from '../../context/AuthContext';
import { useOrders } from '../../context/OrderContext';
import {
  SupportTicket,
  TicketMessage,
  TicketStatus,
  TicketPriority,
  TicketCategory,
  getStoredSupportTickets,
  saveStoredSupportTickets,
  replyToSupportTicket,
  updateSupportTicketStatus,
  createSupportTicket,
  getStoredSupportAssignments,
  getStoredSupplierSupportAssignments,
  SupplierSupportAssignment,
  CANNED_QUICK_REPLIES,
  QuickCannedReply,
  getSupportStaffAgents,
} from '../../lib/supportHelper';
import { getStoredSellers, SellerProfile } from '../../lib/sellerHelper';
import { getStoredSuppliers, SupplierProfile } from '../../lib/supplierHelper';
import { getStoredPlatformWarehouses, PlatformWarehouse } from '../../lib/warehouseAddressHelper';
import { DashboardSwitcher, DashboardRole } from '../common/DashboardSwitcher';
import { OrderItem } from '../../types';

interface SupportDashboardProps {
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onSwitchRole?: (role: DashboardRole) => void;
  impersonatedAgentId?: string | null;
  impersonatedAgentName?: string | null;
  onClearImpersonation?: () => void;
}

export function SupportDashboard({
  onShowToast,
  onSwitchRole,
  impersonatedAgentId,
  impersonatedAgentName,
  onClearImpersonation,
}: SupportDashboardProps) {
  const { user, logout } = useAuth();
  const { orders } = useOrders();

  const supportAgentsList = useMemo(() => getSupportStaffAgents(), []);

  // When admin visits, allow switching agent view or viewing all
  const [adminSelectedAgentId, setAdminSelectedAgentId] = useState<string>(() => {
    if (impersonatedAgentId) return impersonatedAgentId;
    if (user?.role === 'admin') return 'ALL';
    return user?.id || 'usr-4';
  });

  useEffect(() => {
    if (impersonatedAgentId) {
      setAdminSelectedAgentId(impersonatedAgentId);
    }
  }, [impersonatedAgentId]);

  // Determine effective agent (real support staff is strictly locked to their own ID)
  const isRealSupportAgent = user?.role === 'support' || user?.role === 'RESELLER_SUPPORT';
  const effectiveAgentId = isRealSupportAgent
    ? user?.id || 'usr-4'
    : adminSelectedAgentId;

  const currentAgentInfo = useMemo(() => {
    if (effectiveAgentId === 'ALL') {
      return { id: 'ALL', fullName: 'جميع الوكلاء (نظرة المشرف الكاملة)', role: 'ADMIN' };
    }
    const found = supportAgentsList.find((a) => a.id === effectiveAgentId);
    if (found) return found;
    return {
      id: effectiveAgentId,
      fullName: impersonatedAgentName || user?.fullName || 'وكيل الدعم الفني',
    };
  }, [effectiveAgentId, supportAgentsList, impersonatedAgentName, user]);

  const currentAgentId = currentAgentInfo.id;
  const currentAgentName = currentAgentInfo.fullName;

  const [activeTab, setActiveTab] = useState<
    'tickets' | 'live_chats' | 'assigned_marketers' | 'assigned_suppliers' | 'orders_lookup' | 'canned_replies'
  >('tickets');
  const [tickets, setTickets] = useState<SupportTicket[]>(() => getStoredSupportTickets());
  const [assignments, setAssignments] = useState(() => getStoredSupportAssignments());
  const [supplierAssignments, setSupplierAssignments] = useState(() => getStoredSupplierSupportAssignments());
  const [sellers, setSellers] = useState<SellerProfile[]>(() => getStoredSellers());
  const [suppliers, setSuppliers] = useState<SupplierProfile[]>(() => getStoredSuppliers());
  const [warehouses, setWarehouses] = useState<PlatformWarehouse[]>(() => getStoredPlatformWarehouses());

  // Direct Live Chats State (Strictly filtered to this agent)
  const [liveChatConversations, setLiveChatConversations] = useState<DirectChatConversation[]>(() =>
    getConversationsForAgent(effectiveAgentId === 'ALL' ? undefined : effectiveAgentId)
  );
  const [selectedLiveChatId, setSelectedLiveChatId] = useState<string | null>(null);
  const [liveChatInput, setLiveChatInput] = useState('');
  const [liveChatFilter, setLiveChatFilter] = useState<'ALL' | 'RESELLER' | 'SUPPLIER' | 'UNREAD'>('ALL');
  const [liveChatSearch, setLiveChatSearch] = useState('');

  // Ticket selection and reply
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(tickets[0]?.id || null);
  const [replyText, setReplyText] = useState('');
  const [replyStatus, setReplyStatus] = useState<TicketStatus | ''>('');
  const [ticketSearch, setTicketSearch] = useState('');
  const [ticketFilterStatus, setTicketFilterStatus] = useState<string>('ALL');
  const [ticketFilterScope, setTicketFilterScope] = useState<'MY_ASSIGNED' | 'ALL'>('MY_ASSIGNED');

  // New Ticket Modal
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
  const [newTicketTargetType, setNewTicketTargetType] = useState<'RESELLER' | 'SUPPLIER'>('RESELLER');
  const [newTicketResellerId, setNewTicketResellerId] = useState('');
  const [newTicketSupplierId, setNewTicketSupplierId] = useState('');
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketCategory, setNewTicketCategory] = useState<TicketCategory>('ORDERS');
  const [newTicketPriority, setNewTicketPriority] = useState<TicketPriority>('MEDIUM');
  const [newTicketMessage, setNewTicketMessage] = useState('');
  const [newTicketOrderId, setNewTicketOrderId] = useState('');

  // Order Lookup state
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<OrderItem | null>(null);

  // Escalate to warehouse modal
  const [isEscalateModalOpen, setIsEscalateModalOpen] = useState(false);
  const [selectedWarehouseForEscalation, setSelectedWarehouseForEscalation] = useState(warehouses[0]?.id || '');
  const [escalationReason, setEscalationReason] = useState('يرجى التحقق من تجهيز الطرد وتحديث مسار الشحن للزبون فوراً');

  // Canned replies search
  const [cannedSearch, setCannedSearch] = useState('');
  const [cannedRepliesList, setCannedRepliesList] = useState<QuickCannedReply[]>(CANNED_QUICK_REPLIES);

  // Supplier search query
  const [supplierSearchQuery, setSupplierSearchQuery] = useState('');

  // Sync tickets and assignments on updates
  useEffect(() => {
    const handleUpdate = () => {
      setTickets(getStoredSupportTickets());
      setAssignments(getStoredSupportAssignments());
      setSupplierAssignments(getStoredSupplierSupportAssignments());
      setSellers(getStoredSellers());
      setSuppliers(getStoredSuppliers());
    };
    window.addEventListener('nouva_support_tickets_updated', handleUpdate);
    window.addEventListener('nouva_support_assignments_updated', handleUpdate);
    window.addEventListener('nouva_supplier_support_assignments_updated', handleUpdate);
    window.addEventListener('nouva_sellers_updated', handleUpdate);
    window.addEventListener('nouva_suppliers_updated', handleUpdate);
    return () => {
      window.removeEventListener('nouva_support_tickets_updated', handleUpdate);
      window.removeEventListener('nouva_support_assignments_updated', handleUpdate);
      window.removeEventListener('nouva_supplier_support_assignments_updated', handleUpdate);
      window.removeEventListener('nouva_sellers_updated', handleUpdate);
      window.removeEventListener('nouva_suppliers_updated', handleUpdate);
    };
  }, []);

  const activeTicket = useMemo(() => {
    return tickets.find((t) => t.id === selectedTicketId) || tickets[0] || null;
  }, [tickets, selectedTicketId]);

  // Marketers assigned to this specific support user (Strict Privacy Isolation)
  const myAssignedResellers = useMemo(() => {
    return sellers.filter((s) => {
      const assign = assignments[s.id];
      if (!assign || !assign.agentId) return false;
      if (effectiveAgentId === 'ALL') {
        return true;
      }
      const targetId = effectiveAgentId;
      if (
        assign.agentId === targetId ||
        (assign.agentId === 'sys-usr-support-1' && targetId === 'usr-4') ||
        (assign.agentId === 'usr-4' && targetId === 'sys-usr-support-1')
      ) {
        return true;
      }
      return false;
    });
  }, [sellers, assignments, effectiveAgentId]);

  // Suppliers assigned to this specific support user (Strict Privacy Isolation)
  const myAssignedSuppliers = useMemo(() => {
    return suppliers.filter((sup) => {
      const assign = supplierAssignments[sup.id];
      if (!assign || !assign.agentId) return false;
      if (effectiveAgentId === 'ALL') {
        return true;
      }
      const targetId = effectiveAgentId;
      if (
        assign.agentId === targetId ||
        (assign.agentId === 'sys-usr-support-1' && targetId === 'usr-4') ||
        (assign.agentId === 'usr-4' && targetId === 'sys-usr-support-1')
      ) {
        return true;
      }
      return false;
    });
  }, [suppliers, supplierAssignments, effectiveAgentId]);

  // Reload direct live chat conversations strictly for this agent
  const reloadLiveChats = () => {
    const list = getConversationsForAgent(effectiveAgentId === 'ALL' ? undefined : effectiveAgentId);
    setLiveChatConversations([...list]);
  };

  useEffect(() => {
    reloadLiveChats();
    const handleUpdate = () => {
      reloadLiveChats();
    };
    window.addEventListener('nouva_direct_chat_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('nouva_direct_chat_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [effectiveAgentId]);

  // Filtered live chats
  const filteredLiveChats = useMemo(() => {
    return liveChatConversations.filter((c) => {
      if (liveChatFilter === 'RESELLER' && c.partyType !== 'RESELLER') return false;
      if (liveChatFilter === 'SUPPLIER' && c.partyType !== 'SUPPLIER') return false;
      if (liveChatFilter === 'UNREAD' && (c.unreadByAgentCount || 0) === 0) return false;

      if (liveChatSearch.trim()) {
        const q = liveChatSearch.toLowerCase().trim();
        const match =
          c.partyName.toLowerCase().includes(q) ||
          (c.partyStoreName && c.partyStoreName.toLowerCase().includes(q)) ||
          c.partyPhone.includes(q) ||
          (c.partyWilaya && c.partyWilaya.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [liveChatConversations, liveChatFilter, liveChatSearch]);

  const activeLiveChat = useMemo(() => {
    return (
      filteredLiveChats.find((c) => c.id === selectedLiveChatId) ||
      liveChatConversations.find((c) => c.id === selectedLiveChatId) ||
      filteredLiveChats[0] ||
      null
    );
  }, [filteredLiveChats, liveChatConversations, selectedLiveChatId]);

  // Total unread messages for this agent
  const totalLiveChatUnread = useMemo(() => {
    return liveChatConversations.reduce((sum, c) => sum + (c.unreadByAgentCount || 0), 0);
  }, [liveChatConversations]);

  // Auto mark live chat as read when active changes
  useEffect(() => {
    if (activeTab === 'live_chats' && activeLiveChat && activeLiveChat.unreadByAgentCount > 0) {
      markDirectConversationRead(activeLiveChat.id, 'SUPPORT');
      reloadLiveChats();
    }
  }, [activeTab, activeLiveChat?.id]);

  // Handle send reply in live chat tab
  const handleSendLiveChatReply = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!liveChatInput.trim() || !activeLiveChat) return;

    const text = liveChatInput.trim();
    setLiveChatInput('');

    sendDirectChatMessage({
      conversationId: activeLiveChat.id,
      senderId: currentAgentId,
      senderName: currentAgentName,
      senderRole: 'SUPPORT',
      text,
    });

    reloadLiveChats();
  };

  // Filtered assigned suppliers by search
  const filteredMyAssignedSuppliers = useMemo(() => {
    if (!supplierSearchQuery.trim()) return myAssignedSuppliers;
    const q = supplierSearchQuery.toLowerCase().trim();
    return myAssignedSuppliers.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        (s.companyName && s.companyName.toLowerCase().includes(q)) ||
        s.phone.includes(q) ||
        s.wilaya.toLowerCase().includes(q) ||
        (s.activityType && s.activityType.toLowerCase().includes(q))
    );
  }, [myAssignedSuppliers, supplierSearchQuery]);

  // Stats calculation
  const stats = useMemo(() => {
    const openCount = tickets.filter((t) => t.status === 'NEW' || t.status === 'IN_PROGRESS').length;
    const resolvedCount = tickets.filter((t) => t.status === 'RESOLVED').length;
    const urgentCount = tickets.filter((t) => t.priority === 'URGENT' || t.priority === 'HIGH').length;
    return {
      assignedCount: myAssignedResellers.length,
      assignedSuppliersCount: myAssignedSuppliers.length,
      openCount,
      resolvedCount,
      urgentCount,
    };
  }, [tickets, myAssignedResellers, myAssignedSuppliers]);

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      // Scope filter
      if (ticketFilterScope === 'MY_ASSIGNED' && effectiveAgentId !== 'ALL') {
        const isAssignedToMe =
          t.assignedAgentId === effectiveAgentId ||
          (t.assignedAgentId === 'sys-usr-support-1' && effectiveAgentId === 'usr-4') ||
          (t.assignedAgentId === 'usr-4' && effectiveAgentId === 'sys-usr-support-1') ||
          (currentAgentName && t.assignedAgentName?.includes(currentAgentName));
        if (!isAssignedToMe) return false;
      }
      // Status filter
      if (ticketFilterStatus !== 'ALL' && t.status !== ticketFilterStatus) {
        return false;
      }
      // Search
      if (ticketSearch.trim()) {
        const q = ticketSearch.toLowerCase().trim();
        const match =
          t.id.toLowerCase().includes(q) ||
          t.subject.toLowerCase().includes(q) ||
          t.resellerName.toLowerCase().includes(q) ||
          t.resellerPhone.includes(q) ||
          (t.relatedOrderId && t.relatedOrderId.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [tickets, ticketFilterScope, ticketFilterStatus, ticketSearch, effectiveAgentId, currentAgentName]);

  // Quick Launcher: Start direct live chat with a marketer or supplier
  const handleStartDirectChat = (
    partyId: string,
    partyType: 'RESELLER' | 'SUPPLIER',
    details: { fullName: string; storeName?: string; phone: string; wilaya?: string }
  ) => {
    const conv = getOrCreateDirectConversation({
      partyId,
      partyType,
      partyName: details.fullName,
      partyStoreName: details.storeName,
      partyPhone: details.phone,
      partyWilaya: details.wilaya,
    });
    setSelectedLiveChatId(conv.id);
    setActiveTab('live_chats');
    reloadLiveChats();
    onShowToast(`💬 تم فتح المحادثة المباشرة مع ${details.fullName}`, 'info');
  };

  // Handle Send Reply
  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !replyText.trim()) return;

    const updated = replyToSupportTicket(
      activeTicket.id,
      replyText.trim(),
      'SUPPORT',
      user?.fullName || 'فريق الدعم الفني',
      replyStatus ? (replyStatus as TicketStatus) : undefined
    );

    if (updated) {
      setReplyText('');
      setReplyStatus('');
      onShowToast(`✔ تم إرسال الرد وتحديث التذكرة #${activeTicket.id} بنجاح!`, 'success');
    }
  };

  // Quick WhatsApp Launcher
  const handleOpenWhatsApp = (phone: string, text?: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    let fullPhone = cleanPhone;
    if (fullPhone.startsWith('0')) {
      fullPhone = '213' + fullPhone.slice(1);
    }
    const defaultText = text || `مرحباً، معك ${user?.fullName || 'فريق الدعم الفني'} من منصة Nouva Market. يسعدنا التواصل معك لمساعدتك بخصوص حسابك أو طلبياتك!`;
    const url = `https://wa.me/${fullPhone}?text=${encodeURIComponent(defaultText)}`;
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noreferrer noopener';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Create Ticket Submit
  const handleCreateTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (newTicketTargetType === 'RESELLER') {
      if (!newTicketResellerId || !newTicketSubject || !newTicketMessage) {
        onShowToast('يرجى اختيار المسوق وملء جميع الحقول الإلزامية', 'error');
        return;
      }

      const targetSeller = sellers.find((s) => s.id === newTicketResellerId);
      const catLabels: Record<TicketCategory, string> = {
        ORDERS: 'متابعة وتعديل طلبيات',
        WITHDRAWAL: 'سحب الأرباح والمالية',
        STORE_SYNC: 'ربط المتاجر (Shopify / YouCan)',
        PIXEL_TRACKING: 'تتبع وبيكسل الحملات',
        PRODUCTS: 'كتالوج المنتجات والمخزون',
        ACCOUNT: 'بيانات الحساب والتوثيق',
        GENERAL: 'استفسار عام',
      };

      const created = createSupportTicket({
        resellerId: newTicketResellerId,
        resellerName: targetSeller?.fullName || 'مسوق معتمد',
        resellerPhone: targetSeller?.phone || '0550000000',
        resellerStoreName: targetSeller?.storeName,
        category: newTicketCategory,
        categoryLabelAr: catLabels[newTicketCategory] || 'استفسار عام',
        subject: newTicketSubject.trim(),
        messageText: newTicketMessage.trim(),
        priority: newTicketPriority,
        relatedOrderId: newTicketOrderId.trim() || undefined,
        assignedAgentId: user?.id,
        assignedAgentName: user?.fullName || 'الدعم الفني للمسوقين',
      });

      setIsNewTicketModalOpen(false);
      setSelectedTicketId(created.id);
      setNewTicketSubject('');
      setNewTicketMessage('');
      setNewTicketOrderId('');
      setNewTicketResellerId('');
      onShowToast(`✔ تم فتح تذكرة دعم جديدة للمسوق #${created.id} وإسنادها بنجاح!`, 'success');
    } else {
      if (!newTicketSupplierId || !newTicketSubject || !newTicketMessage) {
        onShowToast('يرجى اختيار البائع/المورد وملء جميع الحقول الإلزامية', 'error');
        return;
      }

      const targetSupplier = suppliers.find((s) => s.id === newTicketSupplierId);
      const catLabels: Record<TicketCategory, string> = {
        ORDERS: 'شحنات وتوريد المستودعات',
        WITHDRAWAL: 'مستحقات وفواتير التوريد',
        STORE_SYNC: 'تكامل المخزون والربط',
        PIXEL_TRACKING: 'متابعة حركة المنتجات',
        PRODUCTS: 'تحديث الكتالوج والأسعار',
        ACCOUNT: 'بيانات الشركة والتوثيق',
        GENERAL: 'استفسار عام للموردين',
      };

      const created = createSupportTicket({
        resellerId: targetSupplier?.id || newTicketSupplierId,
        resellerName: targetSupplier ? `${targetSupplier.fullName} (مورد: ${targetSupplier.companyName || 'شركة'})` : 'بائع ومورد معتمد',
        resellerPhone: targetSupplier?.phone || '0550000000',
        resellerStoreName: targetSupplier?.companyName || targetSupplier?.activityType || 'مورد ومصنع',
        category: newTicketCategory,
        categoryLabelAr: catLabels[newTicketCategory] || 'استفسار ودعم موردين',
        subject: newTicketSubject.trim(),
        messageText: newTicketMessage.trim(),
        priority: newTicketPriority,
        relatedOrderId: newTicketOrderId.trim() || undefined,
        assignedAgentId: user?.id,
        assignedAgentName: user?.fullName || 'الدعم الفني للموردين',
      });

      setIsNewTicketModalOpen(false);
      setSelectedTicketId(created.id);
      setNewTicketSubject('');
      setNewTicketMessage('');
      setNewTicketOrderId('');
      setNewTicketSupplierId('');
      onShowToast(`✔ تم فتح تذكرة دعم للبائع/المورد #${created.id} وإسنادها بنجاح!`, 'success');
    }
  };

  // Search orders lookup
  const searchedOrders = useMemo(() => {
    if (!orderSearchQuery.trim()) return [];
    const q = orderSearchQuery.toLowerCase().trim();
    return orders.filter(
      (o) =>
        o.id.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.phone.includes(q) ||
        (o.trackingCode && o.trackingCode.toLowerCase().includes(q)) ||
        o.wilaya.toLowerCase().includes(q)
    );
  }, [orders, orderSearchQuery]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans">
      {/* ================= TOP SUPPORT NAVBAR ================= */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 px-4 py-3 shrink-0 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Logo & Portal Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
              <Headset className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base font-black text-slate-900 dark:text-white">
                  بوابة الدعم الفني للمسوقين والبائعين
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                  🎧 SUPPORT AGENT
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-slate-100 dark:bg-slate-800 text-teal-700 dark:text-teal-300 border border-slate-200 dark:border-slate-700">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span>الوكيل: {currentAgentName}</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                مرافقة المسوقين، معالجة الاستفسارات، حل مشاكل الشحن، وتنسيق العمليات مع المستودعات المركزية.
              </p>
            </div>
          </div>

          {/* Quick Actions & Role Switcher */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsNewTicketModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-teal-600/20 active:scale-95 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>فتح تذكرة دعم جديدة</span>
            </button>

            {/* Internal Staff Team Chat Shortcut */}
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(
                  new CustomEvent('open_internal_team_chat', {
                    detail: { channelId: 'channel_confirmer_help' },
                  })
                );
              }}
              className="px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 text-purple-900 dark:text-purple-200 border border-purple-200 dark:border-purple-800 font-black text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              title="فتح شبكة المحادثة والتنسيق الداخلي لطاقم المنصة"
            >
              <MessageSquare className="w-4 h-4 text-purple-600" />
              <span>تنسيق الفريق (#Team)</span>
            </button>

            {onSwitchRole && (
              <DashboardSwitcher
                currentRole="support"
                onSwitchRole={onSwitchRole}
              />
            )}

            <button
              onClick={logout}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
            >
              تسجيل الخروج
            </button>
          </div>
        </div>
      </header>

      {/* ================= ADMIN AGENT INSPECTION SWITCHER ================= */}
      {user?.role === 'admin' && (
        <div className="bg-amber-500/10 border-b border-amber-500/25 px-4 py-2 shrink-0">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-lg bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider">
                ADMIN HQ
              </span>
              <span className="font-extrabold text-amber-900 dark:text-amber-200">
                وضع معاينة المشرف (Agent View Switcher):
              </span>
              <span className="text-slate-600 dark:text-slate-400 hidden lg:inline text-[11px]">
                انقر لمعاينة ما يراه كل وكيل بالضبط وفق الإسناد الآلي:
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setAdminSelectedAgentId('ALL')}
                className={`px-3 py-1 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                  effectiveAgentId === 'ALL'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-amber-100 dark:hover:bg-slate-700'
                }`}
              >
                <span>🌐 جميع الوكلاء (عرض كامل)</span>
              </button>

              {supportAgentsList.map((agent) => {
                const isSelected = effectiveAgentId === agent.id;
                const agentConvs = getConversationsForAgent(agent.id);
                return (
                  <button
                    key={agent.id}
                    type="button"
                    onClick={() => setAdminSelectedAgentId(agent.id)}
                    className={`px-3 py-1 rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-teal-600 text-white shadow-xs font-black'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-bold'
                    }`}
                  >
                    <span>👤 {agent.fullName.split(' ')[0]} {agent.fullName.split(' ')[1] || ''}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-black ${
                        isSelected
                          ? 'bg-teal-800 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-teal-600 dark:text-teal-400'
                      }`}
                    >
                      {agentConvs.length} محادثة
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================= EXECUTIVE METRICS BANNER ================= */}
      <div className="bg-white dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-800 px-4 py-2.5 shrink-0">
        <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 text-xs">
          {/* Metric 1: Assigned Resellers */}
          <div className="p-3 rounded-2xl bg-teal-50/60 dark:bg-teal-950/20 border border-teal-200/60 dark:border-teal-900/40 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-teal-800 dark:text-teal-300 block">
                المسوقين المسندين لي
              </span>
              <strong className="text-xl font-black text-teal-700 dark:text-teal-400 font-mono">
                {stats.assignedCount}
              </strong>
            </div>
            <Users className="w-5 h-5 text-teal-600 dark:text-teal-400 opacity-80" />
          </div>

          {/* Metric 2: Assigned Suppliers */}
          <div className="p-3 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/40 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-purple-800 dark:text-purple-300 block">
                البائعين والموردين المسندين
              </span>
              <strong className="text-xl font-black text-purple-700 dark:text-purple-400 font-mono">
                {stats.assignedSuppliersCount}
              </strong>
            </div>
            <Building2 className="w-5 h-5 text-purple-600 dark:text-purple-400 opacity-80" />
          </div>

          {/* Metric 3: Open Tickets */}
          <div className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 block">
                تذاكر مفتوحة قيد المتابعة
              </span>
              <strong className="text-xl font-black text-amber-700 dark:text-amber-400 font-mono">
                {stats.openCount}
              </strong>
            </div>
            <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 opacity-80" />
          </div>

          {/* Metric 4: Urgent Requests */}
          <div className="p-3 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-rose-800 dark:text-rose-300 block">
                طلبات ذات أولوية عاجلة
              </span>
              <strong className="text-xl font-black text-rose-700 dark:text-rose-400 font-mono">
                {stats.urgentCount}
              </strong>
            </div>
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 opacity-80" />
          </div>

          {/* Metric 5: Resolved Tickets */}
          <div className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 flex items-center justify-between col-span-2 sm:col-span-1">
            <div>
              <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 block">
                تذاكر تم حلها بنجاح
              </span>
              <strong className="text-xl font-black text-emerald-700 dark:text-emerald-400 font-mono">
                {stats.resolvedCount}
              </strong>
            </div>
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 opacity-80" />
          </div>
        </div>
      </div>

      {/* ================= TABS NAVIGATION ================= */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 px-4 shrink-0">
        <div className="max-w-7xl mx-auto flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar text-xs font-bold pt-1">
          <button
            onClick={() => setActiveTab('tickets')}
            className={`py-3 px-4 border-b-2 transition flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'tickets'
                ? 'border-teal-600 text-teal-600 dark:text-teal-400 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>تذاكر الدعم</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 font-mono">
              {filteredTickets.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('live_chats')}
            className={`py-3 px-4 border-b-2 transition flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'live_chats'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <MessageCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>المحادثات اللحظية للمسندين</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-mono">
              {liveChatConversations.length}
            </span>
            {totalLiveChatUnread > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-rose-600 text-white font-mono font-black">
                {totalLiveChatUnread} جديدة
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('assigned_marketers')}
            className={`py-3 px-4 border-b-2 transition flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'assigned_marketers'
                ? 'border-teal-600 text-teal-600 dark:text-teal-400 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>المسوقين المسندين لي</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
              {myAssignedResellers.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('assigned_suppliers')}
            className={`py-3 px-4 border-b-2 transition flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'assigned_suppliers'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>البائعين والموردين المسندين لي</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 font-mono">
              {myAssignedSuppliers.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('orders_lookup')}
            className={`py-3 px-4 border-b-2 transition flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'orders_lookup'
                ? 'border-teal-600 text-teal-600 dark:text-teal-400 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>معالجة وتتبع مشاكل الطلبيات</span>
          </button>

          <button
            onClick={() => setActiveTab('canned_replies')}
            className={`py-3 px-4 border-b-2 transition flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'canned_replies'
                ? 'border-teal-600 text-teal-600 dark:text-teal-400 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>قاعدة الردود الجاهزة والتعليمات</span>
          </button>
        </div>
      </div>

      {/* ================= TAB 1: TICKETS CONVERSATION SPLIT ================= */}
      {activeTab === 'tickets' && (
        <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden max-w-7xl w-full mx-auto p-2 sm:p-4 gap-3">
          {/* TICKETS LIST SIDEBAR */}
          <div className="w-full md:w-80 lg:w-96 flex flex-col bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden shrink-0">
            {/* Search & Filter Controls */}
            <div className="p-3 border-b border-slate-100 dark:border-slate-800 space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute start-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={ticketSearch}
                  onChange={(e) => setTicketSearch(e.target.value)}
                  placeholder="بحث برقم التذكرة، المسوق، الهاتف..."
                  className="w-full ps-9 pe-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none"
                />
              </div>

              <div className="flex gap-1.5">
                {user?.role === 'admin' ? (
                  <select
                    value={ticketFilterScope}
                    onChange={(e) => setTicketFilterScope(e.target.value as any)}
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-300 outline-none"
                  >
                    <option value="MY_ASSIGNED">تذاكري المسندة فقط 👤</option>
                    <option value="ALL">جميع التذاكر (الأدمن) 🌐</option>
                  </select>
                ) : (
                  <div className="flex-1 px-2.5 py-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-[11px] font-black text-teal-800 dark:text-teal-300 flex items-center justify-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-teal-600" />
                    <span>تذاكري المسندة لي 👤</span>
                  </div>
                )}

                <select
                  value={ticketFilterStatus}
                  onChange={(e) => setTicketFilterStatus(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-300 outline-none"
                >
                  <option value="ALL">كل الحالات</option>
                  <option value="NEW">جديدة (NEW)</option>
                  <option value="IN_PROGRESS">قيد المعالجة</option>
                  <option value="WAITING_RESELLER">بانتظار المسوق</option>
                  <option value="RESOLVED">تم الحل ✔</option>
                </select>
              </div>
            </div>

            {/* Tickets list */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {filteredTickets.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs space-y-2">
                  <Headset className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                  <p>لا توجد تذاكر تطابق معايير البحث الحالية.</p>
                </div>
              ) : (
                filteredTickets.map((t) => {
                  const isSelected = t.id === activeTicket?.id;
                  const priorityColor =
                    t.priority === 'URGENT' || t.priority === 'HIGH'
                      ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-900'
                      : t.priority === 'MEDIUM'
                      ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-900'
                      : 'text-slate-600 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700';

                  const statusBadgeColor =
                    t.status === 'NEW'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200'
                      : t.status === 'IN_PROGRESS'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200'
                      : t.status === 'WAITING_RESELLER'
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-200'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200';

                  const statusLabelAr =
                    t.status === 'NEW'
                      ? 'جديدة'
                      : t.status === 'IN_PROGRESS'
                      ? 'قيد المعالجة'
                      : t.status === 'WAITING_RESELLER'
                      ? 'بانتظار المسوق'
                      : 'تم الحل';

                  return (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTicketId(t.id)}
                      className={`p-3 transition cursor-pointer text-xs space-y-1.5 ${
                        isSelected
                          ? 'bg-teal-50/70 dark:bg-teal-950/30 border-r-4 border-r-teal-600'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-black text-slate-900 dark:text-white">
                            #{t.id}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusBadgeColor}`}>
                            {statusLabelAr}
                          </span>
                        </div>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${priorityColor}`}>
                          {t.priority === 'URGENT' ? 'عاجل جداً' : t.priority === 'HIGH' ? 'عالي' : 'عادي'}
                        </span>
                      </div>

                      <div className="font-bold text-slate-800 dark:text-slate-100 line-clamp-1">
                        {t.subject}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="truncate">👤 {t.resellerName} ({t.resellerStoreName || 'متجر'})</span>
                        <span className="font-mono text-[10px] shrink-0">
                          {new Date(t.lastMessageAt).toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ACTIVE TICKET CONVERSATION WORKSPACE */}
          <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden min-h-0">
            {activeTicket ? (
              <>
                {/* Ticket Top bar */}
                <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap justify-between items-center gap-2.5 bg-slate-50/50 dark:bg-slate-850/50">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-black text-base text-slate-900 dark:text-white">
                        تذكرة #{activeTicket.id}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-200">
                        {activeTicket.categoryLabelAr}
                      </span>
                      {activeTicket.relatedOrderId && (
                        <span className="px-2 py-0.5 rounded-md font-mono text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200">
                          الطلب #{activeTicket.relatedOrderId}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-3 flex-wrap">
                      <span>المسوق: <strong className="text-slate-800 dark:text-slate-200">{activeTicket.resellerName}</strong></span>
                      <span>الهاتف: <strong className="text-slate-800 dark:text-slate-200 font-mono">{activeTicket.resellerPhone}</strong></span>
                      {activeTicket.assignedAgentName && (
                        <span>المسؤول: <strong className="text-teal-600 dark:text-teal-400">{activeTicket.assignedAgentName}</strong></span>
                      )}
                    </div>
                  </div>

                  {/* Top Ticket Quick Actions */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => handleOpenWhatsApp(activeTicket.resellerPhone, `مرحباً أخي ${activeTicket.resellerName}، بخصوص تذكرة الدعم #${activeTicket.id} (${activeTicket.subject}) على منصة Nouva Market:`)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                      title="فتح محادثة واتساب فورية مع المسوق"
                    >
                      <span>واتساب</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>

                    <a
                      href={`tel:${activeTicket.resellerPhone}`}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>اتصال</span>
                    </a>

                    {/* Status updater */}
                    <select
                      value={activeTicket.status}
                      onChange={(e) => {
                        updateSupportTicketStatus(activeTicket.id, e.target.value as TicketStatus);
                        onShowToast(`تم تحديث حالة التذكرة #${activeTicket.id}`, 'info');
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold text-xs outline-none"
                    >
                      <option value="NEW">جديدة (NEW)</option>
                      <option value="IN_PROGRESS">قيد المعالجة</option>
                      <option value="WAITING_RESELLER">بانتظار المسوق</option>
                      <option value="RESOLVED">تم الحل بنجاح ✔</option>
                      <option value="CLOSED">مغلقة ✖</option>
                    </select>
                  </div>
                </div>

                {/* Subject banner */}
                <div className="px-4 py-2 bg-teal-50/40 dark:bg-teal-950/20 border-b border-teal-100/60 dark:border-teal-900/40 text-xs font-black text-teal-950 dark:text-teal-200">
                  موضوع التذكرة: {activeTicket.subject}
                </div>

                {/* Messages conversation flow */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3.5 min-h-0 bg-slate-50/30 dark:bg-slate-950/20">
                  {activeTicket.messages.map((msg) => {
                    const isFromSupport = msg.sender === 'SUPPORT' || msg.sender === 'ADMIN';
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isFromSupport ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-0.5">
                          <span className="font-bold">{msg.senderName}</span>
                          <span>•</span>
                          <span className="font-mono">
                            {new Date(msg.timestamp).toLocaleString('ar-DZ', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                          </span>
                        </div>

                        <div
                          className={`p-3 rounded-2xl max-w-xl text-xs leading-relaxed space-y-1 ${
                            isFromSupport
                              ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-tl-xs shadow-md shadow-teal-600/10'
                              : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700 rounded-tr-xs shadow-xs'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Reply Form */}
                <form
                  onSubmit={handleSendReply}
                  className="p-3 border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-bold">كتابة رد للمسوق:</span>
                    <div className="flex items-center gap-2">
                      {/* Canned Quick Insert Button */}
                      <button
                        type="button"
                        onClick={() => {
                          const firstReply = CANNED_QUICK_REPLIES[0]?.content || '';
                          setReplyText((prev) => (prev ? prev + '\n\n' + firstReply : firstReply));
                          onShowToast('تم إدراج قالب الرد بنجاح!', 'info');
                        }}
                        className="text-[11px] text-teal-600 dark:text-teal-400 font-bold hover:underline flex items-center gap-1"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>إدراج رد جاهز</span>
                      </button>

                      <select
                        value={replyStatus}
                        onChange={(e) => setReplyStatus(e.target.value as any)}
                        className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 outline-none"
                      >
                        <option value="">الحالة بعد الإرسال: تلقائي</option>
                        <option value="WAITING_RESELLER">بانتظار رد المسوق</option>
                        <option value="RESOLVED">تعيين كمحلولة بنجاح ✔</option>
                        <option value="IN_PROGRESS">قيد المعالجة</option>
                      </select>
                    </div>
                  </div>

                  <div className="relative">
                    <textarea
                      rows={3}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="اكتب ردك الواضح والمهني هنا لمساعدة المسوق..."
                      className="w-full p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                    />
                  </div>

                  <div className="flex justify-between items-center pt-1">
                    <div className="text-[11px] text-slate-400">
                      💡 يتلقى المسوق الرد فوراً داخل حسابه مع إشعار بالخطوات.
                    </div>

                    <button
                      type="submit"
                      disabled={!replyText.trim()}
                      className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-teal-600/20 transition cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>إرسال الرد للمسوق</span>
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 text-xs space-y-2">
                <Headset className="w-12 h-12 text-slate-300 dark:text-slate-700" />
                <p className="font-bold text-sm">حدد تذكرة من القائمة الجانبية لبدء المحادثة والمتابعة.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 1B: LIVE DIRECT CHATS (STRICT AGENT ISOLATION) ================= */}
      {activeTab === 'live_chats' && (
        <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden max-w-7xl w-full mx-auto p-2 sm:p-4 gap-3">
          {/* CONVERSATIONS SIDEBAR */}
          <div className="w-full md:w-80 lg:w-96 flex flex-col bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden shrink-0">
            {/* Search and Filters */}
            <div className="p-3 border-b border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-black text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>المحادثات المباشرة المسندة إليك</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold">
                  {liveChatConversations.length} غرفة نشطة
                </span>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 absolute start-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={liveChatSearch}
                  onChange={(e) => setLiveChatSearch(e.target.value)}
                  placeholder="بحث باسم المسوق، المورد، أو المتجر..."
                  className="w-full ps-9 pe-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none"
                />
              </div>

              {/* Filters */}
              <div className="flex items-center gap-1 text-[11px] font-bold">
                {[
                  { id: 'ALL', label: `الكل (${liveChatConversations.length})` },
                  {
                    id: 'RESELLER',
                    label: `مسوقين (${liveChatConversations.filter((c) => c.partyType === 'RESELLER').length})`,
                  },
                  {
                    id: 'SUPPLIER',
                    label: `بائعين (${liveChatConversations.filter((c) => c.partyType === 'SUPPLIER').length})`,
                  },
                  { id: 'UNREAD', label: `غير مقروءة (${totalLiveChatUnread})` },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setLiveChatFilter(item.id as any)}
                    className={`px-2.5 py-1 rounded-xl transition cursor-pointer text-[10.5px] ${
                      liveChatFilter === item.id
                        ? 'bg-emerald-600 text-white font-black shadow-2xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Conversation Items List (Strictly filtered to this agent) */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 min-h-0">
              {filteredLiveChats.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs space-y-2">
                  <MessageCircle className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 opacity-60" />
                  <p className="font-bold">لا توجد محادثات مباشرة حالياً.</p>
                  <p className="text-[11px]">
                    ستظهر هنا فور مراسلة أي مسوق أو بائع مسند إليك من خلال الزر العائم في حسابه.
                  </p>
                </div>
              ) : (
                filteredLiveChats.map((conv) => {
                  const isSelected = activeLiveChat?.id === conv.id;
                  const unread = conv.unreadByAgentCount || 0;

                  return (
                    <button
                      key={conv.id}
                      onClick={() => {
                        setSelectedLiveChatId(conv.id);
                        if (unread > 0) {
                          markDirectConversationRead(conv.id, 'SUPPORT');
                          reloadLiveChats();
                        }
                      }}
                      className={`w-full p-3 text-right transition cursor-pointer flex items-start gap-3 border-s-4 ${
                        isSelected
                          ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-s-emerald-600'
                          : unread > 0
                          ? 'bg-amber-50/40 dark:bg-amber-950/20 border-s-amber-500 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                          : 'border-s-transparent hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="relative shrink-0">
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shadow-xs ${
                            conv.partyType === 'RESELLER'
                              ? 'bg-gradient-to-tr from-teal-500 to-emerald-500 text-white'
                              : 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white'
                          }`}
                        >
                          {conv.partyName.slice(0, 1)}
                        </div>
                        <span className="absolute -bottom-0.5 -start-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-2xs"></span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className="font-black text-xs text-slate-900 dark:text-white truncate">
                            {conv.partyName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono shrink-0">
                            {new Date(conv.lastMessageAt).toLocaleTimeString('ar-DZ', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1">
                          <span
                            className={`px-1.5 py-0.2 rounded-md font-bold text-[9.5px] ${
                              conv.partyType === 'RESELLER'
                                ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
                                : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                            }`}
                          >
                            {conv.partyType === 'RESELLER' ? 'مسوق' : 'بائع / مورد'}
                          </span>
                          <span className="truncate">{conv.partyStoreName || conv.partyWilaya}</span>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-300 truncate font-medium">
                          {conv.lastMessage}
                        </p>
                      </div>

                      {unread > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white font-mono font-black text-[10px] shadow-sm shrink-0">
                          {unread}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* ACTIVE CHAT MAIN VIEW */}
          <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden min-h-0">
            {activeLiveChat ? (
              <>
                {/* Chat Header */}
                <div className="p-3.5 border-b border-slate-200/80 dark:border-slate-800 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white flex items-center justify-between gap-3 shrink-0">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm text-white ${
                        activeLiveChat.partyType === 'RESELLER' ? 'bg-emerald-600' : 'bg-purple-600'
                      }`}
                    >
                      {activeLiveChat.partyName.slice(0, 1)}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-sm leading-tight">{activeLiveChat.partyName}</h4>
                        <span className="px-2 py-0.2 rounded-full text-[10px] font-black bg-white/20 text-white">
                          {activeLiveChat.partyType === 'RESELLER' ? 'مسوق معتمد 🛒' : 'بائع / مورد معتمد 🏭'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        {activeLiveChat.partyStoreName || 'بدون متجر'} • {activeLiveChat.partyWilaya} •{' '}
                        <span dir="ltr" className="font-mono">
                          {activeLiveChat.partyPhone}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const transcript = exportDirectChatHistoryAsText(activeLiveChat);
                        const blob = new Blob([transcript], { type: 'text/plain;charset=utf-8' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `chat_${activeLiveChat.partyId}_${new Date().toISOString().split('T')[0]}.txt`;
                        a.click();
                        URL.revokeObjectURL(url);
                        onShowToast('✔ تم تحميل وتصدير سجل المحادثة بنجاح!', 'success');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                      title="تحميل وتصدير سجل المحادثة كملف نصي"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">تصدير السجل</span>
                    </button>

                    <a
                      href={`https://wa.me/${activeLiveChat.partyPhone.replace(/^0/, '213')}?text=${encodeURIComponent(
                        `مرحباً ${activeLiveChat.partyName}، معك ${currentAgentName} من الدعم الفني لمنصة Nouva Market.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 transition cursor-pointer shadow-xs"
                      title="فتح محادثة واتساب الرسمية"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">واتساب</span>
                    </a>
                  </div>
                </div>

                {/* Messages stream */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 bg-slate-50/40 dark:bg-slate-950/30">
                  {activeLiveChat.messages.map((msg, idx) => {
                    const isFromAgent = msg.senderRole === 'SUPPORT' || msg.senderRole === 'ADMIN';
                    const prevMsg = activeLiveChat.messages[idx - 1];
                    const prevDate = prevMsg ? new Date(prevMsg.timestamp).toDateString() : null;
                    const curDate = new Date(msg.timestamp).toDateString();
                    const showDateSeparator = idx === 0 || prevDate !== curDate;

                    return (
                      <React.Fragment key={msg.id}>
                        {showDateSeparator && (
                          <div className="flex justify-center my-2">
                            <span className="px-3 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400 font-mono shadow-2xs">
                              {formatChatDateSeparator(msg.timestamp)}
                            </span>
                          </div>
                        )}

                        <div className={`flex flex-col ${isFromAgent ? 'items-end' : 'items-start'}`}>
                          <div
                            className={`max-w-[85%] sm:max-w-md rounded-2xl px-3.5 py-2.5 text-xs shadow-xs space-y-1 ${
                              isFromAgent
                                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-be-xs shadow-emerald-600/10'
                                : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bs-xs border border-slate-200/80 dark:border-slate-700/80'
                            }`}
                          >
                            {!isFromAgent && (
                              <span className="block font-black text-[11px] text-emerald-600 dark:text-emerald-400">
                                {msg.senderName}
                              </span>
                            )}
                            <p className="whitespace-pre-wrap leading-relaxed text-[12px]">{msg.text}</p>
                            <div
                              className={`flex items-center justify-end gap-1 text-[9.5px] font-mono ${
                                isFromAgent ? 'text-emerald-100' : 'text-slate-400'
                              }`}
                            >
                              <span>
                                {new Date(msg.timestamp).toLocaleTimeString('ar-DZ', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                              {isFromAgent && <CheckCheck className="w-3.5 h-3.5 text-emerald-200" />}
                            </div>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* Quick replies chip bar */}
                <div className="px-3 py-2 bg-slate-100/70 dark:bg-slate-800/60 border-t border-slate-200/80 dark:border-slate-800 shrink-0">
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                    <span className="text-[10px] font-bold text-slate-500 shrink-0">ردود سريعة:</span>
                    {CANNED_QUICK_REPLIES.slice(0, 5).map((reply) => (
                      <button
                        key={reply.id}
                        type="button"
                        onClick={() =>
                          setLiveChatInput((prev) => (prev ? prev + ' ' + reply.content : reply.content))
                        }
                        className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-[10.5px] text-slate-700 dark:text-slate-200 font-bold shrink-0 border border-slate-200 dark:border-slate-600 transition cursor-pointer"
                      >
                        {reply.title}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Input form */}
                <form
                  onSubmit={handleSendLiveChatReply}
                  className="p-3 border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2 shrink-0"
                >
                  <input
                    type="text"
                    value={liveChatInput}
                    onChange={(e) => setLiveChatInput(e.target.value)}
                    placeholder={`اكتب رداً فورياً لـ ${activeLiveChat.partyName}... (Enter للإرسال)`}
                    className="flex-1 py-2.5 px-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-emerald-500 text-xs text-slate-900 dark:text-white font-medium outline-none transition"
                  />
                  <button
                    type="submit"
                    disabled={!liveChatInput.trim()}
                    className="p-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white font-black shadow-md shadow-emerald-600/20 active:scale-95 transition cursor-pointer shrink-0"
                    title="إرسال فوري"
                  >
                    <Send className="w-4 h-4 rtl:rotate-180" />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 text-xs space-y-2">
                <MessageCircle className="w-12 h-12 text-slate-300 dark:text-slate-700 opacity-60" />
                <p className="font-bold text-sm">حدد محادثة من القائمة الجانبية للتواصل المباشر مع المستخدم المسند.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 2: ASSIGNED MARKETERS (AFFECTATION) ================= */}
      {activeTab === 'assigned_marketers' && (
        <div className="flex-1 overflow-y-auto max-w-7xl w-full mx-auto p-4 space-y-4">
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-teal-600" />
                <span>المسوقين والبائعين المسندين لرعايتي (My Assigned Portfolio)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                قائمة المسوقين والبائعين الذين تم إسنادهم لحسابك بواسطة الإدارة، لمرافقتهم في المبيعات، حل العقبات، وتسريع نمو متاجرهم.
              </p>
            </div>
            <span className="px-3 py-1 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 font-mono font-black text-sm">
              {myAssignedResellers.length} مسوق مسند
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {myAssignedResellers.map((seller) => {
              const assignmentInfo = assignments[seller.id];
              return (
                <div
                  key={seller.id}
                  className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3 hover:border-teal-400/60 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-black text-slate-900 dark:text-white block">
                        {seller.fullName}
                      </span>
                      <span className="text-[11px] text-teal-600 dark:text-teal-400 font-bold block">
                        {seller.storeName || 'متجر مستقل'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {seller.wilaya} • انضم في {seller.joinDate}
                      </span>
                    </div>

                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200">
                      ⭐ {seller.rank || 'GOLD'}
                    </span>
                  </div>

                  {assignmentInfo?.notes && (
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-[10.5px] text-slate-600 dark:text-slate-300">
                      <strong>ملاحظات المرافقة:</strong> {assignmentInfo.notes}
                    </div>
                  )}

                  {/* Metrics summary */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono pt-1">
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                      <span className="text-[10px] text-slate-400 block font-sans">الطلبيات</span>
                      <strong className="text-slate-800 dark:text-slate-200">{seller.totalOrdersCount || 0}</strong>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                      <span className="text-[10px] text-slate-400 block font-sans">المسلّمة</span>
                      <strong className="text-emerald-600">{seller.deliveredOrdersCount || 0}</strong>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                      <span className="text-[10px] text-slate-400 block font-sans">الأرباح</span>
                      <strong className="text-purple-600 text-[11px]">{(seller.totalEarnedDzd || 0).toLocaleString()} دج</strong>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() =>
                        handleStartDirectChat(seller.id, 'RESELLER', {
                          fullName: seller.fullName,
                          storeName: seller.storeName,
                          phone: seller.phone,
                          wilaya: seller.wilaya,
                        })
                      }
                      className="flex-1 py-2 px-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-black text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                      title="محادثة مباشرة ولحظية مع المسوق داخل المنصة"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>دردشة فورية</span>
                    </button>

                    <button
                      onClick={() =>
                        handleOpenWhatsApp(
                          seller.phone,
                          `مرحباً أخي ${seller.fullName}، معك ${currentAgentName} من منصة Nouva Market. يسعدني الاطمئنان على سير مبيعات متجرك ومساعدتك في أي استفسار!`
                        )
                      }
                      className="py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1 transition cursor-pointer shadow-xs"
                      title="مراسلة عبر واتساب"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>واتساب</span>
                    </button>

                    <button
                      onClick={() => {
                        setNewTicketResellerId(seller.id);
                        setNewTicketSubject(`متابعة خاصة لمتجر ${seller.storeName || seller.fullName}`);
                        setIsNewTicketModalOpen(true);
                      }}
                      className="py-2 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
                      title="فتح تذكرة خاصة لهذا المسوق"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= TAB 2B: ASSIGNED SUPPLIERS & VENDORS ================= */}
      {activeTab === 'assigned_suppliers' && (
        <div className="flex-1 overflow-y-auto max-w-7xl w-full mx-auto p-4 space-y-4">
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-600" />
                <span>حقيبة البائعين والموردين المسندين لي (Assigned Suppliers & Manufacturers)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                متابعة شحنات التوريد إلى مستودعات المنصة، تحديث المخزون والأسعار، ودعم تسويات CCP و BaridiMob.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 font-mono font-black text-sm">
                {myAssignedSuppliers.length} مورد مسند
              </span>
            </div>
          </div>

          {/* Search bar for suppliers */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="relative">
              <Search className="w-4 h-4 absolute start-3 top-3 text-slate-400" />
              <input
                type="text"
                value={supplierSearchQuery}
                onChange={(e) => setSupplierSearchQuery(e.target.value)}
                placeholder="ابحث باسم المورد، اسم الشركة، النشاط، الولاية أو الهاتف..."
                className="w-full ps-9 pe-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {filteredMyAssignedSuppliers.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 text-slate-400 text-xs">
              <Building2 className="w-12 h-12 mx-auto mb-2 opacity-30 text-purple-500" />
              <p className="font-bold text-slate-600 dark:text-slate-300">
                لا يوجد بائعين أو موردين مسندين لك حالياً يطابقون البحث.
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                يمكن لمدير النظام (الأدمن) إسناد الموردين وتوزيعهم عبر تبويب "إدارة الدعم الفني".
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredMyAssignedSuppliers.map((supplier) => {
                const assignmentInfo = supplierAssignments[supplier.id];
                return (
                  <div
                    key={supplier.id}
                    className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3 hover:border-purple-400/60 transition"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs font-black text-slate-900 dark:text-white block">
                          {supplier.companyName || supplier.fullName}
                        </span>
                        <span className="text-[11px] text-purple-600 dark:text-purple-400 font-bold block">
                          المسؤول: {supplier.fullName}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {supplier.wilaya} • هاتف: {supplier.phone}
                        </span>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                          supplier.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200'
                        }`}
                      >
                        {supplier.status === 'APPROVED' ? 'معتمد ✓' : 'قيد المراجعة'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        النشاط: {supplier.activityType || 'توريد عام'}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                        {supplier.totalProductsCount || 0} منتج بالكتالوج
                      </span>
                    </div>

                    {assignmentInfo?.notes && (
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-[10.5px] text-slate-600 dark:text-slate-300">
                        <strong>ملاحظات المرافقة:</strong> {assignmentInfo.notes}
                      </div>
                    )}

                    {/* Actions Bar */}
                    <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() =>
                          handleStartDirectChat(supplier.id, 'SUPPLIER', {
                            fullName: supplier.fullName,
                            storeName: supplier.companyName,
                            phone: supplier.phone,
                            wilaya: supplier.wilaya,
                          })
                        }
                        className="flex-1 py-2 px-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                        title="محادثة مباشرة ولحظية مع البائع/المورد داخل المنصة"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>دردشة فورية</span>
                      </button>

                      <button
                        onClick={() =>
                          handleOpenWhatsApp(
                            supplier.phone,
                            `مرحباً سيدي الكريم ${supplier.fullName} (${supplier.companyName || 'المورد'})، معك ${currentAgentName} من منصة Nouva Market. يسعدني التواصل معك لمتابعة توريد منتجاتك وتحديث المخزون بالمستودعات!`
                          )
                        }
                        className="py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1 transition cursor-pointer shadow-xs"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>واتساب</span>
                      </button>

                      <button
                        onClick={() => {
                          setNewTicketTargetType('SUPPLIER');
                          setNewTicketSupplierId(supplier.id);
                          setNewTicketSubject(`متابعة توريد ومخزون: ${supplier.companyName || supplier.fullName}`);
                          setIsNewTicketModalOpen(true);
                        }}
                        className="py-2 px-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-bold text-xs transition cursor-pointer flex items-center gap-1"
                        title="فتح تذكرة دعم فني لهذا المورد"
                      >
                        <Plus className="w-4 h-4" />
                        <span>تذكرة</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 3: ORDERS LOOKUP & ESCALATIONS ================= */}
      {activeTab === 'orders_lookup' && (
        <div className="flex-1 overflow-y-auto max-w-7xl w-full mx-auto p-4 space-y-4">
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Truck className="w-5 h-5 text-indigo-600" />
                <span>فحص ومتابعة مشاكل الشحن والطلبيات (Order Assistance & Escalation)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ابحث عن أي طلبية عبر رقمها أو هاتف الزبون أو اسم المسوق، لمتابعة حالتها لدى شركة التوصيل أو تصعيدها للمستودع المركزي فوراً.
              </p>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute start-3 top-3 text-slate-400" />
              <input
                type="text"
                value={orderSearchQuery}
                onChange={(e) => setOrderSearchQuery(e.target.value)}
                placeholder="أدخل رقم الطلبية (#ORD-XXXX)، هاتف الزبون، أو اسم المسوق..."
                className="w-full ps-9 pe-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Searched Results Table */}
          {searchedOrders.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="p-3 border-b border-slate-100 dark:border-slate-800 font-black text-xs text-slate-700 dark:text-slate-300">
                نتائج البحث ({searchedOrders.length} طلبية):
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {searchedOrders.map((ord) => (
                  <div key={ord.id} className="p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                          #{ord.id}
                        </span>
                        <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200">
                          {ord.status}
                        </span>
                        {ord.trackingCode && (
                          <span className="font-mono text-[11px] text-slate-500 font-bold">
                            بوليصة: {ord.trackingCode}
                          </span>
                        )}
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        الزبون: <strong className="text-slate-800 dark:text-slate-200">{ord.customerName}</strong> ({ord.phone}) • {ord.wilaya} - {ord.commune}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenWhatsApp(ord.phone, `مرحباً سيدي الكريم ${ord.customerName}، معك فريق الدعم من Nouva Market بخصوص طلبيتك #${ord.id}:`)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                      >
                        واتساب الزبون
                      </button>

                      <button
                        onClick={() => {
                          setSelectedOrderDetails(ord);
                          setIsEscalateModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <span>تصعيد للمستودع المركزي</span>
                        <Layers className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 4: CANNED RESPONSES & KNOWLEDGE BASE ================= */}
      {activeTab === 'canned_replies' && (
        <div className="flex-1 overflow-y-auto max-w-7xl w-full mx-auto p-4 space-y-4">
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span>قاعدة المعرفة والردود الجاهزة للمسوقين (Canned Responses)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ردود نموذجية سريعة ومعتمدة لنسخها وإرسالها للمسوقين بنقرة زر واحدة عبر الواتساب أو تذاكر الدعم.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {cannedRepliesList.map((cr) => (
              <div
                key={cr.id}
                className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200">
                      {cr.category}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(cr.content);
                        onShowToast('✔ تم نسخ الرد للحافظة بنجاح!', 'success');
                      }}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-teal-50 hover:text-teal-700 flex items-center gap-1 transition cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>نسخ النص</span>
                    </button>
                  </div>
                  <h4 className="font-black text-slate-900 dark:text-white text-sm">
                    {cr.title}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed pt-1">
                    {cr.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= MODAL: CREATE NEW SUPPORT TICKET ================= */}
      {isNewTicketModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Plus className="w-4 h-4 text-teal-600" />
                <span>فتح تذكرة دعم فني جديدة</span>
              </h3>
              <button
                onClick={() => setIsNewTicketModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTicketSubmit} className="space-y-3 text-xs">
              {/* Type Switcher: Reseller vs Supplier */}
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold text-xs">
                <button
                  type="button"
                  onClick={() => setNewTicketTargetType('RESELLER')}
                  className={`py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    newTicketTargetType === 'RESELLER'
                      ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-xs font-black'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>مسوق معتمد (Affiliate)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setNewTicketTargetType('SUPPLIER')}
                  className={`py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    newTicketTargetType === 'SUPPLIER'
                      ? 'bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-xs font-black'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5 text-purple-500" />
                  <span>بائع ومورد (Supplier)</span>
                </button>
              </div>

              {/* Target Party Dropdown */}
              {newTicketTargetType === 'RESELLER' ? (
                <div>
                  <label className="font-bold block text-slate-700 dark:text-slate-300 mb-1">
                    المسوق المعني: *
                  </label>
                  <select
                    value={newTicketResellerId}
                    onChange={(e) => setNewTicketResellerId(e.target.value)}
                    className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold outline-none"
                    required
                  >
                    <option value="">-- اختر المسوق من القائمة --</option>
                    {sellers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} ({s.storeName || 'متجر'}) - {s.phone}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="font-bold block text-slate-700 dark:text-slate-300 mb-1">
                    البائع أو المورد المعني: *
                  </label>
                  <select
                    value={newTicketSupplierId}
                    onChange={(e) => setNewTicketSupplierId(e.target.value)}
                    className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold outline-none"
                    required
                  >
                    <option value="">-- اختر البائع/المورد من القائمة --</option>
                    {suppliers.map((sup) => (
                      <option key={sup.id} value={sup.id}>
                        {sup.companyName || sup.fullName} ({sup.fullName}) - {sup.activityType || 'توريد'} - {sup.phone}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold block text-slate-700 dark:text-slate-300 mb-1">
                    تصنيف المشكلة:
                  </label>
                  <select
                    value={newTicketCategory}
                    onChange={(e) => setNewTicketCategory(e.target.value as any)}
                    className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold outline-none"
                  >
                    {newTicketTargetType === 'RESELLER' ? (
                      <>
                        <option value="ORDERS">متابعة وتعديل طلبيات</option>
                        <option value="WITHDRAWAL">سحب الأرباح والمالية</option>
                        <option value="STORE_SYNC">ربط المتاجر (Shopify / YouCan)</option>
                        <option value="PIXEL_TRACKING">تتبع وبيكسل الحملات</option>
                        <option value="PRODUCTS">كتالوج المنتجات والمخزون</option>
                        <option value="ACCOUNT">بيانات الحساب والتوثيق</option>
                        <option value="GENERAL">استفسار عام</option>
                      </>
                    ) : (
                      <>
                        <option value="ORDERS">شحنات وتوريد المستودعات</option>
                        <option value="WITHDRAWAL">مستحقات وفواتير التوريد</option>
                        <option value="STORE_SYNC">تكامل المخزون والربط</option>
                        <option value="PIXEL_TRACKING">متابعة حركة المنتجات</option>
                        <option value="PRODUCTS">تحديث الكتالوج والأسعار</option>
                        <option value="ACCOUNT">بيانات الشركة والتوثيق</option>
                        <option value="GENERAL">استفسار عام للموردين</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="font-bold block text-slate-700 dark:text-slate-300 mb-1">
                    الأولوية:
                  </label>
                  <select
                    value={newTicketPriority}
                    onChange={(e) => setNewTicketPriority(e.target.value as any)}
                    className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold outline-none"
                  >
                    <option value="LOW">منخفضة</option>
                    <option value="MEDIUM">متوسطة</option>
                    <option value="HIGH">عالية</option>
                    <option value="URGENT">عاجلة جداً</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold block text-slate-700 dark:text-slate-300 mb-1">
                  موضوع التذكرة: *
                </label>
                <input
                  type="text"
                  value={newTicketSubject}
                  onChange={(e) => setNewTicketSubject(e.target.value)}
                  placeholder="مثال: استفسار حول وجهة الطرد #ORD-1234"
                  className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold outline-none"
                  required
                />
              </div>

              <div>
                <label className="font-bold block text-slate-700 dark:text-slate-300 mb-1">
                  رقم الطلبية المرتبطة (اختياري):
                </label>
                <input
                  type="text"
                  value={newTicketOrderId}
                  onChange={(e) => setNewTicketOrderId(e.target.value)}
                  placeholder="ORD-XXXX"
                  className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono outline-none"
                />
              </div>

              <div>
                <label className="font-bold block text-slate-700 dark:text-slate-300 mb-1">
                  تفاصيل المشكلة أو الرسالة الأولى: *
                </label>
                <textarea
                  rows={4}
                  value={newTicketMessage}
                  onChange={(e) => setNewTicketMessage(e.target.value)}
                  placeholder="اكتب التفاصيل والملاحظات..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium outline-none resize-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewTicketModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-slate-600 dark:text-slate-300"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-black shadow-md shadow-teal-600/20"
                >
                  إنشاء وإسناد التذكرة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ESCALATE TO PLATFORM WAREHOUSE ================= */}
      {isEscalateModalOpen && selectedOrderDetails && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3.5">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-600" />
                <span>تصعيد الطلبية #{selectedOrderDetails.id} للمستودع المركزي</span>
              </h3>
              <button onClick={() => setIsEscalateModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <label className="font-bold block text-slate-700 dark:text-slate-300 mb-1">
                  اختر مستودع المنصة المعني بالتصعيد:
                </label>
                <select
                  value={selectedWarehouseForEscalation}
                  onChange={(e) => setSelectedWarehouseForEscalation(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold outline-none"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.hubName} ({w.wilaya})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold block text-slate-700 dark:text-slate-300 mb-1">
                  تعليمات التصعيد لمسؤول المستودع:
                </label>
                <textarea
                  rows={3}
                  value={escalationReason}
                  onChange={(e) => setEscalationReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium outline-none resize-none"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-[11px] text-purple-900 dark:text-purple-300">
                💡 سيتم إرسال إشعار فوري لمسؤول المستودع مع تنبيه باركود وإضافة ملاحظة على مسار الطلبية.
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setIsEscalateModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-xs"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  setIsEscalateModalOpen(false);
                  onShowToast(`✔ تم تصعيد الطلبية #${selectedOrderDetails.id} إلى المستودع المركزي بنجاح!`, 'success');
                }}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs shadow-md shadow-purple-600/20"
              >
                تأكيد التصعيد
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
