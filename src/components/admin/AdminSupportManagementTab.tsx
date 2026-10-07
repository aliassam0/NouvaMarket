import React, { useState, useEffect, useMemo } from 'react';
import {
  Headset,
  Users,
  MessageSquare,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Phone,
  ExternalLink,
  UserCheck,
  ShieldCheck,
  ArrowRight,
  UserPlus,
  RefreshCw,
  Star,
  Trash2,
  Edit3,
  Check,
  X,
  Sparkles,
  Send,
  Eye,
  Store,
  ChevronDown,
  Building,
  Sliders,
  SlidersHorizontal,
  Layers,
  Cpu,
  Zap,
  BarChart2,
  ArrowLeftRight,
  Shuffle,
  Repeat,
  PenTool,
  CheckSquare,
  Square,
} from 'lucide-react';
import {
  SupportTicket,
  SupportAssignment,
  SupplierSupportAssignment,
  getStoredSupportTickets,
  getStoredSupportAssignments,
  getStoredSupplierSupportAssignments,
  saveStoredSupportAssignments,
  saveStoredSupplierSupportAssignments,
  assignResellerToSupportAgent,
  unassignResellerFromSupportAgent,
  bulkAssignResellersToAgent,
  autoDistributeUnassignedResellers,
  assignSupplierToSupportAgent,
  unassignSupplierFromSupportAgent,
  bulkAssignSuppliersToAgent,
  autoDistributeUnassignedSuppliers,
  getSupportStaffAgents,
  getAutoDistributionConfig,
  saveAutoDistributionConfig,
  getAgentWorkloadMatrix,
  executeAutoDistribution,
  executeManualDistribution,
  transferAssignmentsBetweenAgents,
  AgentWorkloadStat,
  AutoDistributionAlgorithm,
  AutoDistributionConfig,
} from '../../lib/supportHelper';
import { syncAllConversationsWithAssignments } from '../../lib/directChatHelper';
import { getStoredSellers, SellerProfile } from '../../lib/sellerHelper';
import { getStoredSuppliers, SupplierProfile } from '../../lib/supplierHelper';
import { SystemUser } from '../../types';

interface AdminSupportManagementTabProps {
  systemUsers: SystemUser[];
  onOpenAddUserModal: () => void;
  onEditUser: (user: SystemUser) => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onSwitchToSupportDashboard?: (agent?: any) => void;
}

export function AdminSupportManagementTab({
  systemUsers,
  onOpenAddUserModal,
  onEditUser,
  onShowToast,
  onSwitchToSupportDashboard,
}: AdminSupportManagementTabProps) {
  const [subTab, setSubTab] = useState<'agents' | 'assignments' | 'tickets'>('agents');

  // Support Agents (System users with role RESELLER_SUPPORT)
  const supportAgents = useMemo(() => {
    return systemUsers.filter((u) => u.role === 'RESELLER_SUPPORT');
  }, [systemUsers]);

  // Sellers / Marketers & Suppliers / Vendors
  const [sellers, setSellers] = useState<SellerProfile[]>(() => getStoredSellers());
  const [suppliers, setSuppliers] = useState<SupplierProfile[]>(() => getStoredSuppliers());
  const [assignments, setAssignments] = useState<Record<string, SupportAssignment>>(() =>
    getStoredSupportAssignments()
  );
  const [supplierAssignments, setSupplierAssignments] = useState<Record<string, SupplierSupportAssignment>>(() =>
    getStoredSupplierSupportAssignments()
  );
  const [tickets, setTickets] = useState<SupportTicket[]>(() => getStoredSupportTickets());

  // Assignment Target: RESELLERS vs SUPPLIERS
  const [assignmentTarget, setAssignmentTarget] = useState<'RESELLERS' | 'SUPPLIERS'>('RESELLERS');

  // Search & Filters in Assignments table
  const [assignmentSearch, setAssignmentSearch] = useState('');
  const [assignmentFilter, setAssignmentFilter] = useState<'ALL' | 'ASSIGNED' | 'UNASSIGNED'>('ALL');
  const [selectedAgentFilter, setSelectedAgentFilter] = useState<string>('ALL');

  // Bulk Selection for Resellers
  const [selectedSellerIds, setSelectedSellerIds] = useState<string[]>([]);
  const [bulkTargetAgentId, setBulkTargetAgentId] = useState<string>('');

  // Bulk Selection for Suppliers
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<string[]>([]);
  const [bulkTargetSupplierAgentId, setBulkTargetSupplierAgentId] = useState<string>('');

  // Selected Ticket for Modal View
  const [viewingTicket, setViewingTicket] = useState<SupportTicket | null>(null);

  // Auto-Distribution System State
  const [isAutoDistributeModalOpen, setIsAutoDistributeModalOpen] = useState(false);
  const [autoConfig, setAutoConfig] = useState<AutoDistributionConfig>(() => getAutoDistributionConfig());
  const [autoTarget, setAutoTarget] = useState<'RESELLERS' | 'SUPPLIERS' | 'BOTH'>('BOTH');
  const [autoMode, setAutoMode] = useState<'UNASSIGNED_ONLY' | 'REBALANCE_ALL'>('UNASSIGNED_ONLY');
  const [autoAlgorithm, setAutoAlgorithm] = useState<AutoDistributionAlgorithm>(
    autoConfig.algorithm || 'BALANCED_WORKLOAD'
  );
  const [autoMaxCapacity, setAutoMaxCapacity] = useState<number>(autoConfig.maxCapacityPerAgent || 30);
  const [selectedAgentIdsForAuto, setSelectedAgentIdsForAuto] = useState<string[]>(() =>
    supportAgents.map((a) => a.id)
  );

  // Manual Distribution Studio State
  const [isManualDistributeModalOpen, setIsManualDistributeModalOpen] = useState(false);
  const [manualDistributeSubMode, setManualDistributeSubMode] = useState<'DIRECT' | 'TRANSFER' | 'CUSTOM_QUOTA'>('DIRECT');

  // Mode 1: Direct Manual Assignment State
  const [manualTargetAgentId, setManualTargetAgentId] = useState<string>(() => supportAgents[0]?.id || '');
  const [manualUserGroup, setManualUserGroup] = useState<'RESELLERS' | 'SUPPLIERS' | 'BOTH'>('RESELLERS');
  const [manualSelectedSellerIds, setManualSelectedSellerIds] = useState<string[]>([]);
  const [manualSelectedSupplierIds, setManualSelectedSupplierIds] = useState<string[]>([]);
  const [manualUserSearch, setManualUserSearch] = useState('');
  const [manualUserFilter, setManualUserFilter] = useState<'ALL' | 'UNASSIGNED' | 'ASSIGNED'>('UNASSIGNED');
  const [manualNotes, setManualNotes] = useState('');

  // Mode 2: Transfer Between Agents State
  const [transferFromAgentId, setTransferFromAgentId] = useState<string>('');
  const [transferToAgentId, setTransferToAgentId] = useState<string>('');
  const [transferTargetGroup, setTransferTargetGroup] = useState<'RESELLERS' | 'SUPPLIERS' | 'BOTH'>('BOTH');
  const [transferMode, setTransferMode] = useState<'ALL' | 'SPECIFIC'>('ALL');
  const [transferSelectedUserIds, setTransferSelectedUserIds] = useState<string[]>([]);

  // Mode 3: Custom Quota Split State
  const [customAgentCounts, setCustomAgentCounts] = useState<Record<string, number>>({});

  // Ensure manualTargetAgentId is initialized
  useEffect(() => {
    if (!manualTargetAgentId && supportAgents.length > 0) {
      setManualTargetAgentId(supportAgents[0].id);
    }
  }, [supportAgents, manualTargetAgentId]);

  // Keep selectedAgentIdsForAuto updated with active agents
  useEffect(() => {
    setSelectedAgentIdsForAuto(supportAgents.map((a) => a.id));
  }, [supportAgents.length]);

  // Sync state on events
  useEffect(() => {
    const handleUpdate = () => {
      setAssignments(getStoredSupportAssignments());
      setSupplierAssignments(getStoredSupplierSupportAssignments());
      setTickets(getStoredSupportTickets());
      setSellers(getStoredSellers());
      setSuppliers(getStoredSuppliers());
      setAutoConfig(getAutoDistributionConfig());
    };
    window.addEventListener('nouva_support_assignments_updated', handleUpdate);
    window.addEventListener('nouva_supplier_support_assignments_updated', handleUpdate);
    window.addEventListener('nouva_support_tickets_updated', handleUpdate);
    window.addEventListener('nouva_sellers_updated', handleUpdate);
    window.addEventListener('nouva_suppliers_updated', handleUpdate);
    window.addEventListener('nouva_auto_distribution_config_updated', handleUpdate);
    return () => {
      window.removeEventListener('nouva_support_assignments_updated', handleUpdate);
      window.removeEventListener('nouva_supplier_support_assignments_updated', handleUpdate);
      window.removeEventListener('nouva_support_tickets_updated', handleUpdate);
      window.removeEventListener('nouva_sellers_updated', handleUpdate);
      window.removeEventListener('nouva_suppliers_updated', handleUpdate);
      window.removeEventListener('nouva_auto_distribution_config_updated', handleUpdate);
    };
  }, []);

  // Live Agent Workload Matrix
  const agentWorkloads = useMemo(() => {
    return getAgentWorkloadMatrix(supportAgents);
  }, [supportAgents, assignments, supplierAssignments]);

  // Stats
  const stats = useMemo(() => {
    const assignedCount = Object.keys(assignments).length;
    const totalSellers = sellers.length;
    const unassignedCount = Math.max(0, totalSellers - assignedCount);

    const assignedSuppliersCount = Object.keys(supplierAssignments).length;
    const totalSuppliers = suppliers.length;
    const unassignedSuppliersCount = Math.max(0, totalSuppliers - assignedSuppliersCount);

    const openTicketsCount = tickets.filter(
      (t) => t.status === 'NEW' || t.status === 'IN_PROGRESS' || t.status === 'WAITING_RESELLER'
    ).length;

    return {
      agentsCount: supportAgents.length,
      assignedCount,
      unassignedCount,
      totalSellers,
      assignedSuppliersCount,
      unassignedSuppliersCount,
      totalSuppliers,
      openTicketsCount,
    };
  }, [supportAgents, sellers, suppliers, assignments, supplierAssignments, tickets]);

  // Filtered sellers in the Assignment Matrix
  const filteredSellers = useMemo(() => {
    return sellers.filter((s) => {
      const assignment = assignments[s.id];
      const isAssigned = Boolean(assignment && assignment.agentId);

      // Status filter
      if (assignmentFilter === 'ASSIGNED' && !isAssigned) return false;
      if (assignmentFilter === 'UNASSIGNED' && isAssigned) return false;

      // Specific Agent filter
      if (selectedAgentFilter !== 'ALL') {
        if (!assignment || assignment.agentId !== selectedAgentFilter) return false;
      }

      // Search Query
      if (assignmentSearch.trim()) {
        const q = assignmentSearch.toLowerCase().trim();
        const match =
          s.fullName.toLowerCase().includes(q) ||
          (s.storeName && s.storeName.toLowerCase().includes(q)) ||
          s.phone.includes(q) ||
          (s.wilaya && s.wilaya.toLowerCase().includes(q)) ||
          (assignment?.agentName && assignment.agentName.toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    });
  }, [sellers, assignments, assignmentFilter, selectedAgentFilter, assignmentSearch]);

  // Filtered suppliers in the Assignment Matrix
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      const assignment = supplierAssignments[s.id];
      const isAssigned = Boolean(assignment && assignment.agentId);

      // Status filter
      if (assignmentFilter === 'ASSIGNED' && !isAssigned) return false;
      if (assignmentFilter === 'UNASSIGNED' && isAssigned) return false;

      // Specific Agent filter
      if (selectedAgentFilter !== 'ALL') {
        if (!assignment || assignment.agentId !== selectedAgentFilter) return false;
      }

      // Search Query
      if (assignmentSearch.trim()) {
        const q = assignmentSearch.toLowerCase().trim();
        const match =
          s.fullName.toLowerCase().includes(q) ||
          (s.companyName && s.companyName.toLowerCase().includes(q)) ||
          (s.phone && s.phone.includes(q)) ||
          (s.wilaya && s.wilaya.toLowerCase().includes(q)) ||
          (s.activityType && s.activityType.toLowerCase().includes(q)) ||
          (assignment?.agentName && assignment.agentName.toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    });
  }, [suppliers, supplierAssignments, assignmentFilter, selectedAgentFilter, assignmentSearch]);

  // Handle assign one seller to an agent
  const handleAssignSingle = (seller: SellerProfile, agentId: string) => {
    if (!agentId || agentId === 'NONE') {
      unassignResellerFromSupportAgent(seller.id);
      setAssignments(getStoredSupportAssignments());
      onShowToast(`تم إلغاء إسناد المسوق ${seller.fullName}`, 'info');
      return;
    }

    const agent = supportAgents.find((a) => a.id === agentId);
    if (!agent) return;

    assignResellerToSupportAgent(seller.id, agent.id, agent.fullName, {
      resellerName: seller.fullName,
      resellerPhone: seller.phone,
      resellerStoreName: seller.storeName,
    });
    setAssignments(getStoredSupportAssignments());
    onShowToast(`✔ تم إسناد المسوق ${seller.fullName} إلى ${agent.fullName} بنجاح!`, 'success');
  };

  // Handle assign one supplier to an agent
  const handleAssignSingleSupplier = (supplier: SupplierProfile, agentId: string) => {
    if (!agentId || agentId === 'NONE') {
      unassignSupplierFromSupportAgent(supplier.id);
      setSupplierAssignments(getStoredSupplierSupportAssignments());
      onShowToast(`تم إلغاء إسناد البائع ${supplier.companyName || supplier.fullName}`, 'info');
      return;
    }

    const agent = supportAgents.find((a) => a.id === agentId);
    if (!agent) return;

    assignSupplierToSupportAgent(supplier.id, agent.id, agent.fullName, {
      supplierName: supplier.fullName,
      companyName: supplier.companyName,
      supplierPhone: supplier.phone,
      supplierWilaya: supplier.wilaya,
      activityType: supplier.activityType,
    });
    setSupplierAssignments(getStoredSupplierSupportAssignments());
    onShowToast(`✔ تم إسناد البائع ${supplier.companyName || supplier.fullName} إلى ${agent.fullName} بنجاح!`, 'success');
  };

  // Handle Equitable Auto-Distribution of unassigned marketers
  const handleAutoDistribute = () => {
    if (supportAgents.length === 0) {
      onShowToast('❌ يرجى إضافة وكيل دعم فني واحد على الأقل قبل إجراء التوزيع التلقائي', 'error');
      return;
    }

    const unassigned = sellers.filter((s) => !assignments[s.id]?.agentId);
    if (unassigned.length === 0) {
      onShowToast('جميع المسوقين مسندون بالفعل لمسؤولي الدعم!', 'info');
      return;
    }

    const activeAgents = supportAgents.filter((a) => a.status === 'ACTIVE');
    if (activeAgents.length === 0) {
      onShowToast('لا يوجد وكلاء دعم في حالة نشطة حالياً', 'error');
      return;
    }

    autoDistributeUnassignedResellers(
      unassigned.map((s) => s.id),
      activeAgents.map((a) => ({ id: a.id, fullName: a.fullName })),
      sellers
    );

    setAssignments(getStoredSupportAssignments());
    onShowToast(`🎉 تم توزيع ${unassigned.length} مسوق بالتساوي على ${activeAgents.length} وكيل دعم بنجاح!`, 'success');
  };

  // Handle Equitable Auto-Distribution of unassigned suppliers
  const handleAutoDistributeSuppliers = () => {
    if (supportAgents.length === 0) {
      onShowToast('❌ يرجى إضافة وكيل دعم فني واحد على الأقل قبل إجراء التوزيع التلقائي', 'error');
      return;
    }

    const unassigned = suppliers.filter((s) => !supplierAssignments[s.id]?.agentId);
    if (unassigned.length === 0) {
      onShowToast('جميع البائعين مسندون بالفعل لمسؤولي الدعم!', 'info');
      return;
    }

    const activeAgents = supportAgents.filter((a) => a.status === 'ACTIVE');
    if (activeAgents.length === 0) {
      onShowToast('لا يوجد وكلاء دعم في حالة نشطة حالياً', 'error');
      return;
    }

    autoDistributeUnassignedSuppliers(
      unassigned.map((s) => s.id),
      activeAgents.map((a) => ({ id: a.id, fullName: a.fullName })),
      suppliers
    );

    setSupplierAssignments(getStoredSupplierSupportAssignments());
    onShowToast(`🎉 تم توزيع ${unassigned.length} بائع/مورد بالتساوي على ${activeAgents.length} وكيل دعم بنجاح!`, 'success');
  };

  // Bulk assign selected sellers
  const handleBulkAssignSubmit = () => {
    if (selectedSellerIds.length === 0) {
      onShowToast('يرجى تحديد مسوق واحد على الأقل', 'error');
      return;
    }
    if (!bulkTargetAgentId) {
      onShowToast('يرجى اختيار وكيل الدعم المستهدف', 'error');
      return;
    }

    const agent = supportAgents.find((a) => a.id === bulkTargetAgentId);
    if (!agent) return;

    bulkAssignResellersToAgent(selectedSellerIds, agent.id, agent.fullName, sellers);
    setAssignments(getStoredSupportAssignments());
    setSelectedSellerIds([]);
    setBulkTargetAgentId('');
    onShowToast(`✔ تم إسناد ${selectedSellerIds.length} مسوق إلى ${agent.fullName} بنجاح!`, 'success');
  };

  // Bulk assign selected suppliers
  const handleBulkAssignSuppliersSubmit = () => {
    if (selectedSupplierIds.length === 0) {
      onShowToast('يرجى تحديد بائع واحد على الأقل', 'error');
      return;
    }
    if (!bulkTargetSupplierAgentId) {
      onShowToast('يرجى اختيار وكيل الدعم المستهدف', 'error');
      return;
    }

    const agent = supportAgents.find((a) => a.id === bulkTargetSupplierAgentId);
    if (!agent) return;

    bulkAssignSuppliersToAgent(selectedSupplierIds, agent.id, agent.fullName, suppliers);
    setSupplierAssignments(getStoredSupplierSupportAssignments());
    setSelectedSupplierIds([]);
    setBulkTargetSupplierAgentId('');
    onShowToast(`✔ تم إسناد ${selectedSupplierIds.length} بائع/مورد إلى ${agent.fullName} بنجاح!`, 'success');
  };

  // Run comprehensive auto-distribution
  const handleRunAutoDistribution = () => {
    if (selectedAgentIdsForAuto.length === 0) {
      onShowToast('❌ يرجى تحديد وكيل دعم نشط واحد على الأقل لتوزيع الحسابات عليه', 'error');
      return;
    }

    const res = executeAutoDistribution({
      target: autoTarget,
      mode: autoMode,
      algorithm: autoAlgorithm,
      maxCapacityPerAgent: autoMaxCapacity,
      selectedAgentIds: selectedAgentIdsForAuto,
    });

    if (!res.success || res.totalDistributed === 0) {
      onShowToast('لم يتم توزيع أي حسابات (لا توجد حسابات غير مسندة أو لا تتوفر طاقة استيعابية)', 'info');
      return;
    }

    // Refresh state & sync conversations
    setAssignments(getStoredSupportAssignments());
    setSupplierAssignments(getStoredSupplierSupportAssignments());
    syncAllConversationsWithAssignments();

    setIsAutoDistributeModalOpen(false);

    onShowToast(
      `🎉 تم التوزيع الآلي بنجاح! تم توزيع ${res.distributedResellersCount} مسوق و ${res.distributedSuppliersCount} بائع/مورد على ${selectedAgentIdsForAuto.length} وكيل دعم بالتساوي والتكافؤ!`,
      'success'
    );
  };

  // Toggle auto distribution on registration
  const handleToggleAutoOnRegister = () => {
    const updated: AutoDistributionConfig = {
      ...autoConfig,
      enabledAutoOnRegister: !autoConfig.enabledAutoOnRegister,
    };
    setAutoConfig(updated);
    saveAutoDistributionConfig(updated);
    onShowToast(
      updated.enabledAutoOnRegister
        ? '✔ تم تفعيل التوزيع التلقائي الذكي فور تسجيل أي مسوق أو بائع جديد!'
        : 'تم تعطيل التوزيع التلقائي عند التسجيل',
      'info'
    );
  };

  // Filtered sellers for manual distribution modal
  const manualFilteredSellers = useMemo(() => {
    return sellers.filter((s) => {
      const isAssigned = Boolean(assignments[s.id]?.agentId);
      if (manualUserFilter === 'UNASSIGNED' && isAssigned) return false;
      if (manualUserFilter === 'ASSIGNED' && !isAssigned) return false;

      if (manualUserSearch.trim()) {
        const q = manualUserSearch.toLowerCase().trim();
        const match =
          s.fullName.toLowerCase().includes(q) ||
          (s.storeName && s.storeName.toLowerCase().includes(q)) ||
          s.phone.includes(q) ||
          (s.wilaya && s.wilaya.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [sellers, assignments, manualUserFilter, manualUserSearch]);

  // Filtered suppliers for manual distribution modal
  const manualFilteredSuppliers = useMemo(() => {
    return suppliers.filter((sup) => {
      const isAssigned = Boolean(supplierAssignments[sup.id]?.agentId);
      if (manualUserFilter === 'UNASSIGNED' && isAssigned) return false;
      if (manualUserFilter === 'ASSIGNED' && !isAssigned) return false;

      if (manualUserSearch.trim()) {
        const q = manualUserSearch.toLowerCase().trim();
        const match =
          sup.fullName.toLowerCase().includes(q) ||
          (sup.companyName && sup.companyName.toLowerCase().includes(q)) ||
          sup.phone.includes(q) ||
          (sup.wilaya && sup.wilaya.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [suppliers, supplierAssignments, manualUserFilter, manualUserSearch]);

  // Handlers for manual selection
  const handleToggleSelectAllManualSellers = () => {
    if (manualSelectedSellerIds.length === manualFilteredSellers.length) {
      setManualSelectedSellerIds([]);
    } else {
      setManualSelectedSellerIds(manualFilteredSellers.map((s) => s.id));
    }
  };

  const handleToggleSelectAllManualSuppliers = () => {
    if (manualSelectedSupplierIds.length === manualFilteredSuppliers.length) {
      setManualSelectedSupplierIds([]);
    } else {
      setManualSelectedSupplierIds(manualFilteredSuppliers.map((sup) => sup.id));
    }
  };

  const handleSelectUnassignedOnlyManual = () => {
    const unassignedS = sellers.filter((s) => !assignments[s.id]?.agentId).map((s) => s.id);
    const unassignedSup = suppliers.filter((sup) => !supplierAssignments[sup.id]?.agentId).map((sup) => sup.id);
    setManualSelectedSellerIds(unassignedS);
    setManualSelectedSupplierIds(unassignedSup);
    onShowToast(`تم تحديد ${unassignedS.length} مسوق و ${unassignedSup.length} بائع غير مسندين`, 'info');
  };

  // Run direct manual distribution
  const handleExecuteManualDirect = () => {
    if (!manualTargetAgentId) {
      onShowToast('❌ يرجى اختيار وكيل الدعم الفني المستهدف أولاً', 'error');
      return;
    }
    const agent = supportAgents.find((a) => a.id === manualTargetAgentId);
    if (!agent) return;

    const sellersToAssign =
      manualUserGroup === 'RESELLERS' || manualUserGroup === 'BOTH' ? manualSelectedSellerIds : [];
    const suppliersToAssign =
      manualUserGroup === 'SUPPLIERS' || manualUserGroup === 'BOTH' ? manualSelectedSupplierIds : [];

    if (sellersToAssign.length === 0 && suppliersToAssign.length === 0) {
      onShowToast('❌ يرجى تحديد مسوق أو بائع واحد على الأقل للإسناد اليدوي', 'error');
      return;
    }

    const res = executeManualDistribution({
      targetAgentId: agent.id,
      targetAgentName: agent.fullName,
      resellerIds: sellersToAssign,
      supplierIds: suppliersToAssign,
      notes: manualNotes.trim() || undefined,
      sellersList: sellers,
      suppliersList: suppliers,
    });

    setAssignments(getStoredSupportAssignments());
    setSupplierAssignments(getStoredSupplierSupportAssignments());
    syncAllConversationsWithAssignments();

    setManualSelectedSellerIds([]);
    setManualSelectedSupplierIds([]);
    setManualNotes('');
    setIsManualDistributeModalOpen(false);

    onShowToast(
      `✔ تم الإسناد اليدوي بنجاح! تم إسناد ${res.assignedResellersCount} مسوق و ${res.assignedSuppliersCount} بائع إلى ${agent.fullName}.`,
      'success'
    );
  };

  // Run transfer between agents
  const handleExecuteTransfer = () => {
    if (!transferFromAgentId || !transferToAgentId) {
      onShowToast('❌ يرجى تحديد الوكيل المصدر والوكيل البديل', 'error');
      return;
    }
    if (transferFromAgentId === transferToAgentId) {
      onShowToast('❌ لا يمكن نقل الحسابات لنفس الوكيل، يرجى اختيار وكيلين مختلفين', 'error');
      return;
    }

    const toAgent = supportAgents.find((a) => a.id === transferToAgentId);
    const fromAgent = supportAgents.find((a) => a.id === transferFromAgentId);
    if (!toAgent || !fromAgent) return;

    const res = transferAssignmentsBetweenAgents({
      fromAgentId: transferFromAgentId,
      toAgentId: transferToAgentId,
      toAgentName: toAgent.fullName,
      target: transferTargetGroup,
      specificResellerIds: transferMode === 'SPECIFIC' ? transferSelectedUserIds : undefined,
      specificSupplierIds: transferMode === 'SPECIFIC' ? transferSelectedUserIds : undefined,
    });

    setAssignments(getStoredSupportAssignments());
    setSupplierAssignments(getStoredSupplierSupportAssignments());
    syncAllConversationsWithAssignments();

    setTransferSelectedUserIds([]);
    setIsManualDistributeModalOpen(false);

    onShowToast(
      `✔ تم نقل ${res.transferredResellers} مسوق و ${res.transferredSuppliers} بائع من ${fromAgent.fullName} إلى ${toAgent.fullName} بنجاح!`,
      'success'
    );
  };

  // Run custom quota manual distribution
  const handleExecuteCustomQuota = () => {
    const unassignedSellers = sellers.filter((s) => !assignments[s.id]?.agentId);
    const unassignedSuppliers = suppliers.filter((sup) => !supplierAssignments[sup.id]?.agentId);

    let sellerIndex = 0;
    let supplierIndex = 0;
    let totalAssigned = 0;
    const currentResellers = getStoredSupportAssignments();
    const currentSuppliers = getStoredSupplierSupportAssignments();
    const today = new Date().toISOString().split('T')[0];

    supportAgents.forEach((agent) => {
      const count = customAgentCounts[agent.id] || 0;
      for (let i = 0; i < count; i++) {
        if (manualUserGroup === 'RESELLERS' || manualUserGroup === 'BOTH') {
          if (sellerIndex < unassignedSellers.length) {
            const s = unassignedSellers[sellerIndex++];
            currentResellers[s.id] = {
              resellerId: s.id,
              resellerName: s.fullName,
              resellerPhone: s.phone,
              resellerStoreName: s.storeName,
              agentId: agent.id,
              agentName: agent.fullName,
              assignedAt: today,
            };
            totalAssigned++;
          }
        }
        if (manualUserGroup === 'SUPPLIERS' || manualUserGroup === 'BOTH') {
          if (supplierIndex < unassignedSuppliers.length) {
            const sup = unassignedSuppliers[supplierIndex++];
            currentSuppliers[sup.id] = {
              supplierId: sup.id,
              supplierName: sup.fullName || 'بائع',
              companyName: sup.companyName,
              supplierPhone: sup.phone,
              supplierWilaya: sup.wilaya,
              activityType: sup.activityType,
              agentId: agent.id,
              agentName: agent.fullName,
              assignedAt: today,
            };
            totalAssigned++;
          }
        }
      }
    });

    if (totalAssigned === 0) {
      onShowToast('لم يتم إسناد أي حسابات، تأكد من إدخال أعداد أكبر من 0 وتوفر حسابات غير مسندة', 'info');
      return;
    }

    saveStoredSupportAssignments(currentResellers);
    saveStoredSupplierSupportAssignments(currentSuppliers);
    setAssignments(getStoredSupportAssignments());
    setSupplierAssignments(getStoredSupplierSupportAssignments());
    syncAllConversationsWithAssignments();

    setCustomAgentCounts({});
    setIsManualDistributeModalOpen(false);

    onShowToast(`🎉 تم تطبيق التوزيع اليدوي بالأعداد بنجاح على ${totalAssigned} حساب!`, 'success');
  };

  return (
    <div className="space-y-5 text-xs text-slate-800 dark:text-slate-100">
      {/* ================= HEADER BANNER ================= */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white border border-teal-500/30 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 rounded-2xl bg-teal-600 text-white shadow-lg shadow-teal-600/30">
            <Headset className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-black text-base flex items-center gap-2">
              <span>الدعم الفني للمسوقين وإسناد الحسابات</span>
              <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[11px] font-black border border-teal-500/30">
                {supportAgents.length} وكلاء دعم
              </span>
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              إدارة وكلاء الدعم الفني، ونظام التوزيع الآلي الذكي للبائعين والمسوقين لضمان عدالة تحميل العمل بين الوكلاء.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onOpenAddUserModal}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-teal-600/25 transition cursor-pointer active:scale-95 shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ إضافة حساب وكيل دعم</span>
          </button>

          <button
            onClick={() => setIsManualDistributeModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 hover:from-teal-500 hover:to-emerald-500 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-teal-600/25 transition cursor-pointer active:scale-95 shrink-0"
            title="فتح ورشة التوزيع والإسناد اليدوي المباشر ونقل الحسابات بين الوكلاء"
          >
            <Sliders className="w-4 h-4" />
            <span>✍️ ورشة التوزيع اليدوي</span>
            {(stats.unassignedCount > 0 || stats.unassignedSuppliersCount > 0) && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-mono font-black">
                {stats.unassignedCount + stats.unassignedSuppliersCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setIsAutoDistributeModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer active:scale-95 shrink-0"
            title="فتح نظام التوزيع الآلي والتحميل المسبق بناءً على توزيع عادل أو كوتا استيعابية"
          >
            <Cpu className="w-4 h-4" />
            <span>نظام التوزيع الآلي والتحميل المسبق</span>
            {(stats.unassignedCount > 0 || stats.unassignedSuppliersCount > 0) && (
              <span className="w-2 h-2 rounded-full bg-rose-600"></span>
            )}
          </button>

          {onSwitchToSupportDashboard && (
            <button
              onClick={() => onSwitchToSupportDashboard(supportAgents[0] || null)}
              className="px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs flex items-center gap-2 shadow-xs transition cursor-pointer shrink-0"
              title="معاينة لوحة تحكم وكيل الدعم الفني"
            >
              <Eye className="w-4 h-4" />
              <span>معاينة واجهة الدعم</span>
            </button>
          )}
        </div>
      </div>

      {/* ================= STATS CARDS ================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[10px] text-slate-400 font-bold block">وكلاء الدعم المعتمدين:</span>
          <span className="text-xl font-black text-teal-600 dark:text-teal-400 font-mono block">
            {stats.agentsCount} وكيل
          </span>
          <span className="text-[10px] text-slate-500">حسابات نشطة في النظام</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[10px] text-slate-400 font-bold block">المسوقين المسندين:</span>
          <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono block">
            {stats.assignedCount} / {stats.totalSellers}
          </span>
          <span className="text-[10px] text-slate-500">
            {stats.unassignedCount > 0 ? `${stats.unassignedCount} بانتظار الإسناد` : 'جميعهم مسندون'}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[10px] text-slate-400 font-bold block">البائعين والموردين المسندين:</span>
          <span className="text-xl font-black text-purple-600 dark:text-purple-400 font-mono block">
            {stats.assignedSuppliersCount} / {stats.totalSuppliers}
          </span>
          <span className="text-[10px] text-slate-500">
            {stats.unassignedSuppliersCount > 0 ? `${stats.unassignedSuppliersCount} بانتظار الإسناد` : 'جميعهم مسندون'}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[10px] text-slate-400 font-bold block">تذاكر الدعم المفتوحة:</span>
          <span className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono block">
            {stats.openTicketsCount} تذكرة
          </span>
          <span className="text-[10px] text-slate-500">استفسارات قيد المعالجة</span>
        </div>
      </div>

      {/* ================= SUB-TABS NAVIGATION ================= */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setSubTab('agents')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 ${
            subTab === 'agents'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>وكلاء الدعم وإحصائياتهم ({supportAgents.length})</span>
        </button>

        <button
          onClick={() => setSubTab('assignments')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 ${
            subTab === 'assignments'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>جدول توزيع وإسناد الحسابات (المسوقين والبائعين)</span>
        </button>

        <button
          onClick={() => setSubTab('tickets')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 ${
            subTab === 'tickets'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>سجل تذاكر واستفسارات الدعم ({tickets.length})</span>
        </button>
      </div>

      {/* ================= SUB-TAB 1: SUPPORT AGENTS & THEIR ASSIGNED PORTFOLIO ================= */}
      {subTab === 'agents' && (
        <div className="space-y-4">
          {supportAgents.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-3">
              <Headset className="w-10 h-10 text-teal-400 mx-auto" />
              <h4 className="font-black text-sm text-slate-800 dark:text-white">لا يوجد حسابات وكلاء دعم فني مضافة بعد</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                قم بإنشاء حساب دعم فني للمسوقين والبائعين الآن. سيتمكن الوكيل من الدخول إلى لوحة الدعم المخصصة له فقط ومرافقة الحسابات المسندة إليه.
              </p>
              <button
                onClick={onOpenAddUserModal}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-black text-xs inline-flex items-center gap-2 cursor-pointer shadow-md"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ إنشاء أول حساب وكيل دعم فني</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {supportAgents.map((agent) => {
                // Find all sellers and suppliers assigned to this agent
                const assignedSellers = sellers.filter((s) => assignments[s.id]?.agentId === agent.id);
                const assignedSuppliers = suppliers.filter((s) => supplierAssignments[s.id]?.agentId === agent.id);
                const agentTickets = tickets.filter(
                  (t) => t.assignedAgentId === agent.id || t.assignedAgentName?.includes(agent.fullName)
                );
                const openTickets = agentTickets.filter((t) => t.status === 'NEW' || t.status === 'IN_PROGRESS');

                return (
                  <div
                    key={agent.id}
                    className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4 hover:border-teal-400 transition"
                  >
                    <div className="space-y-3">
                      {/* Top Agent Bar */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 flex items-center justify-center font-black text-teal-600 dark:text-teal-400 text-base">
                            {agent.fullName.charAt(0) || 'S'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-black text-slate-900 dark:text-white text-sm">
                                {agent.fullName}
                              </h4>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                                وكيل دعم معتمد
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                              <span className="font-mono text-[11px]" dir="ltr">{agent.email}</span>
                            </div>
                          </div>
                        </div>

                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                            agent.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}
                        >
                          {agent.status === 'ACTIVE' ? 'نشط' : 'معطل'}
                        </span>
                      </div>

                      {/* Agent Metrics 3-columns */}
                      <div className="grid grid-cols-3 gap-2 text-[11px]">
                        <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 space-y-0.5 text-center">
                          <span className="text-[10px] text-slate-400 font-bold block">المسوقين:</span>
                          <span className="text-base font-black text-teal-600 dark:text-teal-400 font-mono">
                            {assignedSellers.length}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 space-y-0.5 text-center">
                          <span className="text-[10px] text-slate-400 font-bold block">البائعين:</span>
                          <span className="text-base font-black text-purple-600 dark:text-purple-400 font-mono">
                            {assignedSuppliers.length}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 space-y-0.5 text-center">
                          <span className="text-[10px] text-slate-400 font-bold block">التذاكر:</span>
                          <span className="text-base font-black text-amber-600 dark:text-amber-400 font-mono">
                            {openTickets.length}
                          </span>
                        </div>
                      </div>

                      {/* Preview of Assigned Portfolio (Sellers & Suppliers) */}
                      <div className="space-y-2">
                        {/* Assigned Sellers preview */}
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block mb-1">
                            عينة من المسوقين المسندين ({assignedSellers.length}):
                          </span>
                          {assignedSellers.length === 0 ? (
                            <span className="text-[11px] text-slate-400 italic">لا يوجد مسوقين مسندين</span>
                          ) : (
                            <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                              {assignedSellers.slice(0, 3).map((s) => (
                                <div
                                  key={s.id}
                                  className="p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs"
                                >
                                  <div className="truncate">
                                    <strong className="text-slate-800 dark:text-slate-100 font-bold">{s.fullName}</strong>
                                    {s.storeName && (
                                      <span className="text-slate-400 text-[10px] block truncate">متجر: {s.storeName}</span>
                                    )}
                                  </div>
                                  <span className="px-1.5 py-0.2 rounded text-[9px] bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 font-bold shrink-0">
                                    مسوق
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Assigned Suppliers preview */}
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block mb-1">
                            عينة من البائعين والموردين المسندين ({assignedSuppliers.length}):
                          </span>
                          {assignedSuppliers.length === 0 ? (
                            <span className="text-[11px] text-slate-400 italic">لا يوجد بائعين مسندين</span>
                          ) : (
                            <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                              {assignedSuppliers.slice(0, 3).map((sup) => (
                                <div
                                  key={sup.id}
                                  className="p-1.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-800/60 flex items-center justify-between text-xs"
                                >
                                  <div className="truncate">
                                    <strong className="text-purple-950 dark:text-purple-200 font-bold">
                                      {sup.companyName || sup.fullName}
                                    </strong>
                                    <span className="text-slate-400 text-[10px] block truncate">{sup.activityType || sup.wilaya}</span>
                                  </div>
                                  <span className="px-1.5 py-0.2 rounded text-[9px] bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 font-bold shrink-0">
                                    بائع
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Agent Card Actions */}
                    <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {onSwitchToSupportDashboard && (
                          <button
                            onClick={() => onSwitchToSupportDashboard(agent)}
                            className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-black text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>معاينة لوحة الوكيل</span>
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setAssignmentTarget('RESELLERS');
                            setSelectedAgentFilter(agent.id);
                            setSubTab('assignments');
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                          title="إدارة وتعديل مسوقي هذا الوكيل"
                        >
                          <UserCheck className="w-3.5 h-3.5 text-teal-600" />
                          <span>مسوقيه ({assignedSellers.length})</span>
                        </button>

                        <button
                          onClick={() => {
                            setAssignmentTarget('SUPPLIERS');
                            setSelectedAgentFilter(agent.id);
                            setSubTab('assignments');
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                          title="إدارة وتعديل بائعي هذا الوكيل"
                        >
                          <Building className="w-3.5 h-3.5 text-purple-600" />
                          <span>بائعيه ({assignedSuppliers.length})</span>
                        </button>
                      </div>

                      <button
                        onClick={() => onEditUser(agent)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
                        title="تعديل الحساب وكلمة المرور"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>تعديل</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= SUB-TAB 2: ASSIGNMENT MATRIX (MARKETERS & SUPPLIERS) ================= */}
      {subTab === 'assignments' && (
        <div className="space-y-4">
          {/* Target Mode Switcher (Resellers vs Suppliers) */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 w-fit">
            <button
              onClick={() => {
                setAssignmentTarget('RESELLERS');
                setAssignmentSearch('');
                setSelectedSellerIds([]);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 ${
                assignmentTarget === 'RESELLERS'
                  ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>إسناد المسوقين (Affiliates)</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 font-mono">
                {sellers.length} ({stats.assignedCount} مسند)
              </span>
            </button>

            <button
              onClick={() => {
                setAssignmentTarget('SUPPLIERS');
                setAssignmentSearch('');
                setSelectedSupplierIds([]);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 ${
                assignmentTarget === 'SUPPLIERS'
                  ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Building className="w-4 h-4" />
              <span>إسناد البائعين والموردين (Fournisseurs)</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 font-mono">
                {suppliers.length} ({stats.assignedSuppliersCount} مسند)
              </span>
            </button>
          </div>

          {/* ================= SECTION A: RESELLERS ASSIGNMENT ================= */}
          {assignmentTarget === 'RESELLERS' && (
            <div className="space-y-4">
              {/* Controls Bar */}
              <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 right-3.5" />
                  <input
                    type="text"
                    value={assignmentSearch}
                    onChange={(e) => setAssignmentSearch(e.target.value)}
                    placeholder="بحث باسم المسوق، المتجر، رقم الهاتف، أو الولاية..."
                    className="w-full py-2.5 pr-10 pl-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold">
                  {(['ALL', 'UNASSIGNED', 'ASSIGNED'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setAssignmentFilter(filter)}
                      className={`px-3 py-1.5 rounded-xl transition cursor-pointer shrink-0 ${
                        assignmentFilter === filter
                          ? 'bg-teal-600 text-white font-black shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      {filter === 'ALL'
                        ? `الكل (${sellers.length})`
                        : filter === 'UNASSIGNED'
                        ? `غير مسندين (${stats.unassignedCount})`
                        : `مسندين (${stats.assignedCount})`}
                    </button>
                  ))}

                  {/* Agent Filter Dropdown */}
                  <select
                    value={selectedAgentFilter}
                    onChange={(e) => setSelectedAgentFilter(e.target.value)}
                    className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">جميع وكلاء الدعم</option>
                    {supportAgents.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.fullName}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => {
                      setManualUserGroup('RESELLERS');
                      setIsManualDistributeModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/60 border border-teal-300 dark:border-teal-800 text-teal-900 dark:text-teal-200 text-xs font-black flex items-center gap-1.5 transition cursor-pointer shrink-0 shadow-xs"
                    title="فتح ورشة التوزيع اليدوي للمسوقين"
                  >
                    <Sliders className="w-3.5 h-3.5 text-teal-600" />
                    <span>التوزيع اليدوي</span>
                  </button>

                  <button
                    onClick={() => {
                      setAutoTarget('RESELLERS');
                      setIsAutoDistributeModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-black flex items-center gap-1.5 transition cursor-pointer shrink-0 shadow-xs"
                    title="فتح إعدادات التوزيع الآلي والتحميل المسبق للمسوقين"
                  >
                    <Cpu className="w-3.5 h-3.5 text-amber-600" />
                    <span>نظام التوزيع الآلي</span>
                  </button>

                  <button
                    onClick={handleAutoDistribute}
                    className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-200 text-xs font-black flex items-center gap-1 transition cursor-pointer shrink-0"
                    title="توزيع سريع عادل للمسوقين غير المسندين"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>توزيع سريع متوازن</span>
                  </button>
                </div>
              </div>

              {/* Bulk Assign Bar (Visible when sellers are checked) */}
              {selectedSellerIds.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-300 dark:border-teal-800 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fadeIn">
                  <span className="font-black text-xs text-teal-900 dark:text-teal-200 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-600" />
                    <span>تم تحديد {selectedSellerIds.length} مسوق</span>
                  </span>

                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      value={bulkTargetAgentId}
                      onChange={(e) => setBulkTargetAgentId(e.target.value)}
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-teal-300 dark:border-teal-700 text-xs font-bold text-slate-900 dark:text-white"
                    >
                      <option value="">-- اختر وكيل الدعم للإسناد الجماعي --</option>
                      {supportAgents.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.fullName}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={handleBulkAssignSubmit}
                      className="px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-black text-xs shadow-xs transition cursor-pointer"
                    >
                      إسناد فوري للمحددين
                    </button>

                    <button
                      onClick={() => setSelectedSellerIds([])}
                      className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white"
                      title="إلغاء التحديد"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Table of Sellers */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 font-extrabold">
                      <tr>
                        <th className="p-3 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={
                              filteredSellers.length > 0 &&
                              selectedSellerIds.length === filteredSellers.length
                            }
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedSellerIds(filteredSellers.map((s) => s.id));
                              } else {
                                setSelectedSellerIds([]);
                              }
                            }}
                            className="rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                          />
                        </th>
                        <th className="p-3">المسوق والمتجر</th>
                        <th className="p-3">الولاية والهاتف</th>
                        <th className="p-3">المبيعات والرصيد</th>
                        <th className="p-3">وكيل الدعم المخصص (Affectation)</th>
                        <th className="p-3 text-center">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredSellers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-400">
                            لا يوجد مسوقين يطابقون خيارات البحث والفلترة.
                          </td>
                        </tr>
                      ) : (
                        filteredSellers.map((seller) => {
                          const assignment = assignments[seller.id];
                          const isAssigned = Boolean(assignment && assignment.agentId);
                          const isSelected = selectedSellerIds.includes(seller.id);

                          return (
                            <tr
                              key={seller.id}
                              className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition ${
                                isSelected ? 'bg-teal-50/50 dark:bg-teal-950/20' : ''
                              }`}
                            >
                              <td className="p-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedSellerIds((prev) => [...prev, seller.id]);
                                    } else {
                                      setSelectedSellerIds((prev) => prev.filter((id) => id !== seller.id));
                                    }
                                  }}
                                  className="rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                                />
                              </td>

                              <td className="p-3">
                                <div className="space-y-0.5">
                                  <span className="font-black text-slate-900 dark:text-white block">
                                    {seller.fullName}
                                  </span>
                                  <span className="text-[11px] text-slate-400 block font-medium">
                                    متجر: {seller.storeName || 'بدون متجر'}
                                  </span>
                                </div>
                              </td>

                              <td className="p-3">
                                <div className="space-y-0.5 text-[11px]">
                                  <span className="text-slate-600 dark:text-slate-300 font-bold block">
                                    {seller.wilaya}
                                  </span>
                                  <span className="font-mono text-slate-400" dir="ltr">
                                    {seller.phone}
                                  </span>
                                </div>
                              </td>

                              <td className="p-3">
                                <div className="space-y-0.5 font-mono text-[11px]">
                                  <span className="font-bold text-slate-700 dark:text-slate-300 block">
                                    {seller.totalOrdersCount || 0} طلبية
                                  </span>
                                  <span className="text-purple-600 dark:text-purple-400 font-black block">
                                    {(seller.totalEarnedDzd || 0).toLocaleString()} دج
                                  </span>
                                </div>
                              </td>

                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <select
                                    value={assignment?.agentId || 'NONE'}
                                    onChange={(e) => handleAssignSingle(seller, e.target.value)}
                                    className={`p-2 rounded-xl border text-xs font-bold cursor-pointer transition ${
                                      isAssigned
                                        ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-300 dark:border-teal-700 text-teal-900 dark:text-teal-200'
                                        : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200'
                                    }`}
                                  >
                                    <option value="NONE">-- غير مسند (بدون وكيل) --</option>
                                    {supportAgents.map((agent) => (
                                      <option key={agent.id} value={agent.id}>
                                        👤 {agent.fullName}
                                      </option>
                                    ))}
                                  </select>

                                  {isAssigned && (
                                    <button
                                      type="button"
                                      onClick={() => handleAssignSingle(seller, 'NONE')}
                                      className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                                      title="إلغاء التعيين"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>

                              <td className="p-3 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <a
                                    href={`https://wa.me/${seller.phone.replace(/[^0-9]/g, '')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 transition"
                                    title="مراسلة سريعة عبر الواتساب"
                                  >
                                    <Phone className="w-3.5 h-3.5" />
                                  </a>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================= SECTION B: SUPPLIERS & VENDORS ASSIGNMENT ================= */}
          {assignmentTarget === 'SUPPLIERS' && (
            <div className="space-y-4">
              {/* Controls Bar for Suppliers */}
              <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 right-3.5" />
                  <input
                    type="text"
                    value={assignmentSearch}
                    onChange={(e) => setAssignmentSearch(e.target.value)}
                    placeholder="بحث باسم البائع، الشركة، نوع النشاط، الهاتف، أو الولاية..."
                    className="w-full py-2.5 pr-10 pl-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold">
                  {(['ALL', 'UNASSIGNED', 'ASSIGNED'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setAssignmentFilter(filter)}
                      className={`px-3 py-1.5 rounded-xl transition cursor-pointer shrink-0 ${
                        assignmentFilter === filter
                          ? 'bg-purple-600 text-white font-black shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      {filter === 'ALL'
                        ? `الكل (${suppliers.length})`
                        : filter === 'UNASSIGNED'
                        ? `غير مسندين (${stats.unassignedSuppliersCount})`
                        : `مسندين (${stats.assignedSuppliersCount})`}
                    </button>
                  ))}

                  {/* Agent Filter Dropdown */}
                  <select
                    value={selectedAgentFilter}
                    onChange={(e) => setSelectedAgentFilter(e.target.value)}
                    className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">جميع وكلاء الدعم</option>
                    {supportAgents.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.fullName}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => {
                      setManualUserGroup('SUPPLIERS');
                      setIsManualDistributeModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 border border-purple-300 dark:border-purple-800 text-purple-900 dark:text-purple-200 text-xs font-black flex items-center gap-1.5 transition cursor-pointer shrink-0 shadow-xs"
                    title="فتح ورشة التوزيع اليدوي للبائعين والموردين"
                  >
                    <Sliders className="w-3.5 h-3.5 text-purple-600" />
                    <span>التوزيع اليدوي</span>
                  </button>

                  <button
                    onClick={() => {
                      setAutoTarget('SUPPLIERS');
                      setIsAutoDistributeModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-black flex items-center gap-1.5 transition cursor-pointer shrink-0 shadow-xs"
                    title="فتح إعدادات التوزيع الآلي والتحميل المسبق للبائعين"
                  >
                    <Cpu className="w-3.5 h-3.5 text-amber-600" />
                    <span>نظام التوزيع الآلي</span>
                  </button>

                  <button
                    onClick={handleAutoDistributeSuppliers}
                    className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-200 text-xs font-black flex items-center gap-1 transition cursor-pointer shrink-0"
                    title="توزيع سريع عادل للبائعين غير المسندين"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>توزيع سريع متوازن</span>
                  </button>
                </div>
              </div>

              {/* Bulk Assign Bar for Suppliers */}
              {selectedSupplierIds.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-300 dark:border-purple-800 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fadeIn">
                  <span className="font-black text-xs text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-purple-600" />
                    <span>تم تحديد {selectedSupplierIds.length} بائع/مورد</span>
                  </span>

                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      value={bulkTargetSupplierAgentId}
                      onChange={(e) => setBulkTargetSupplierAgentId(e.target.value)}
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-purple-300 dark:border-purple-700 text-xs font-bold text-slate-900 dark:text-white"
                    >
                      <option value="">-- اختر وكيل الدعم للإسناد الجماعي --</option>
                      {supportAgents.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.fullName}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={handleBulkAssignSuppliersSubmit}
                      className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs shadow-xs transition cursor-pointer"
                    >
                      إسناد فوري للبائعين المحددين
                    </button>

                    <button
                      onClick={() => setSelectedSupplierIds([])}
                      className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white"
                      title="إلغاء التحديد"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Table of Suppliers */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 font-extrabold">
                      <tr>
                        <th className="p-3 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={
                              filteredSuppliers.length > 0 &&
                              selectedSupplierIds.length === filteredSuppliers.length
                            }
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedSupplierIds(filteredSuppliers.map((s) => s.id));
                              } else {
                                setSelectedSupplierIds([]);
                              }
                            }}
                            className="rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                          />
                        </th>
                        <th className="p-3">البائع والشركة / المصنع</th>
                        <th className="p-3">النشاط والولاية</th>
                        <th className="p-3">الكتالوج والتوثيق</th>
                        <th className="p-3">وكيل الدعم المخصص (Affectation)</th>
                        <th className="p-3 text-center">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredSuppliers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-400">
                            لا يوجد بائعين أو موردين يطابقون خيارات البحث والفلترة.
                          </td>
                        </tr>
                      ) : (
                        filteredSuppliers.map((supplier) => {
                          const assignment = supplierAssignments[supplier.id];
                          const isAssigned = Boolean(assignment && assignment.agentId);
                          const isSelected = selectedSupplierIds.includes(supplier.id);

                          return (
                            <tr
                              key={supplier.id}
                              className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition ${
                                isSelected ? 'bg-purple-50/50 dark:bg-purple-950/20' : ''
                              }`}
                            >
                              <td className="p-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedSupplierIds((prev) => [...prev, supplier.id]);
                                    } else {
                                      setSelectedSupplierIds((prev) => prev.filter((id) => id !== supplier.id));
                                    }
                                  }}
                                  className="rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                                />
                              </td>

                              <td className="p-3">
                                <div className="space-y-0.5">
                                  <span className="font-black text-slate-900 dark:text-white block text-sm">
                                    {supplier.companyName || supplier.fullName}
                                  </span>
                                  <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                                    <span>المسؤول: {supplier.fullName}</span>
                                    <span>•</span>
                                    <span className="font-mono" dir="ltr">{supplier.phone}</span>
                                  </div>
                                </div>
                              </td>

                              <td className="p-3">
                                <div className="space-y-0.5">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 inline-block">
                                    {supplier.activityType || 'توريد عام'}
                                  </span>
                                  <span className="text-slate-500 text-[11px] font-bold block mt-1">
                                    {supplier.wilaya}
                                  </span>
                                </div>
                              </td>

                              <td className="p-3">
                                <div className="space-y-0.5 text-[11px]">
                                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200 block">
                                    {supplier.totalProductsCount || 0} منتج في الكتالوج
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold inline-block ${
                                      supplier.status === 'APPROVED'
                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                    }`}
                                  >
                                    {supplier.status === 'APPROVED' ? 'حساب معتمد ✓' : 'قيد المراجعة'}
                                  </span>
                                </div>
                              </td>

                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <select
                                    value={assignment?.agentId || 'NONE'}
                                    onChange={(e) => handleAssignSingleSupplier(supplier, e.target.value)}
                                    className={`p-2 rounded-xl border text-xs font-bold cursor-pointer transition ${
                                      isAssigned
                                        ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-300 dark:border-purple-700 text-purple-900 dark:text-purple-200'
                                        : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200'
                                    }`}
                                  >
                                    <option value="NONE">-- غير مسند (بدون وكيل) --</option>
                                    {supportAgents.map((agent) => (
                                      <option key={agent.id} value={agent.id}>
                                        👤 {agent.fullName}
                                      </option>
                                    ))}
                                  </select>

                                  {isAssigned && (
                                    <button
                                      type="button"
                                      onClick={() => handleAssignSingleSupplier(supplier, 'NONE')}
                                      className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                                      title="إلغاء التعيين"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>

                              <td className="p-3 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <a
                                    href={`https://wa.me/${supplier.phone.replace(/[^0-9]/g, '')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 transition"
                                    title="مراسلة البائع واتساب"
                                  >
                                    <Phone className="w-3.5 h-3.5" />
                                  </a>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= SUB-TAB 3: SUPPORT TICKETS AUDIT ================= */}
      {subTab === 'tickets' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 font-extrabold">
                  <tr>
                    <th className="p-3">رقم التذكرة</th>
                    <th className="p-3">المسوق</th>
                    <th className="p-3">الموضوع والتصنيف</th>
                    <th className="p-3">وكيل الدعم المتابع</th>
                    <th className="p-3">الأولوية والحالة</th>
                    <th className="p-3">آخر رسالة والتاريخ</th>
                    <th className="p-3 text-center">عرض</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {tickets.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        لا توجد تذاكر دعم مسجلة حالياً.
                      </td>
                    </tr>
                  ) : (
                    tickets.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                        <td className="p-3 font-mono font-black text-slate-900 dark:text-white">
                          #{t.id}
                        </td>

                        <td className="p-3">
                          <span className="font-bold text-slate-900 dark:text-white block">
                            {t.resellerName}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400 block" dir="ltr">
                            {t.resellerPhone}
                          </span>
                        </td>

                        <td className="p-3 max-w-xs">
                          <span className="font-bold text-slate-800 dark:text-slate-100 block truncate">
                            {t.subject}
                          </span>
                          <span className="text-[10px] text-teal-600 dark:text-teal-400 font-bold block">
                            {t.categoryLabelAr || t.category}
                          </span>
                        </td>

                        <td className="p-3">
                          {t.assignedAgentName ? (
                            <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                              <UserCheck className="w-3.5 h-3.5 text-teal-500" />
                              <span>{t.assignedAgentName}</span>
                            </span>
                          ) : (
                            <span className="text-amber-500 font-bold text-[11px]">غير مخصص بعد</span>
                          )}
                        </td>

                        <td className="p-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                t.status === 'NEW'
                                  ? 'bg-amber-100 text-amber-900'
                                  : t.status === 'IN_PROGRESS'
                                  ? 'bg-blue-100 text-blue-900'
                                  : t.status === 'RESOLVED'
                                  ? 'bg-emerald-100 text-emerald-900'
                                  : 'bg-slate-100 text-slate-800'
                              }`}
                            >
                              {t.status === 'NEW'
                                ? 'جديدة'
                                : t.status === 'IN_PROGRESS'
                                ? 'قيد المعالجة'
                                : t.status === 'WAITING_RESELLER'
                                ? 'بانتظار المسوق'
                                : t.status === 'RESOLVED'
                                ? 'تم الحل'
                                : 'مغلقة'}
                            </span>
                          </div>
                        </td>

                        <td className="p-3 text-[11px] text-slate-500">
                          <span className="block truncate max-w-xs text-slate-600 dark:text-slate-300">
                            {t.lastMessage}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(t.lastMessageAt).toLocaleDateString('ar-DZ')}
                          </span>
                        </td>

                        <td className="p-3 text-center">
                          <button
                            onClick={() => setViewingTicket(t)}
                            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs"
                            title="عرض تفاصيل المحادثة"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TICKET DETAILS MODAL ================= */}
      {viewingTicket && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <span>تذكرة الدعم #{viewingTicket.id}</span>
                  <span className="text-xs text-slate-400">({viewingTicket.categoryLabelAr})</span>
                </h4>
                <p className="text-xs text-slate-500 font-bold mt-0.5">
                  المسوق: {viewingTicket.resellerName} • الوكيل المسؤول: {viewingTicket.assignedAgentName || 'غير مسند'}
                </p>
              </div>
              <button
                onClick={() => setViewingTicket(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80">
              <span className="text-[10px] text-slate-400 font-bold block mb-1">موضوع التذكرة:</span>
              <p className="font-extrabold text-xs text-slate-900 dark:text-white">{viewingTicket.subject}</p>
            </div>

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              <span className="text-[10px] text-slate-400 font-bold block">سجل الرسائل والمحادثة:</span>
              {viewingTicket.messages.map((m) => (
                <div
                  key={m.id}
                  className={`p-3 rounded-2xl text-xs space-y-1 ${
                    m.sender === 'SUPPORT'
                      ? 'bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 ms-6'
                      : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 me-6'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-[10px]">
                    <span className={m.sender === 'SUPPORT' ? 'text-teal-700 dark:text-teal-300' : 'text-slate-700 dark:text-slate-300'}>
                      {m.senderName} ({m.sender === 'SUPPORT' ? 'فريق الدعم' : 'المسوق'})
                    </span>
                    <span className="text-slate-400 font-mono">
                      {new Date(m.timestamp).toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium">{m.text}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setViewingTicket(null)}
                className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-black text-xs cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= AUTO-DISTRIBUTION & PRELOAD SYSTEM MODAL ================= */}
      {isAutoDistributeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn font-sans">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 shadow-lg shadow-amber-500/25">
                  <Cpu className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <span>نظام التوزيع الآلي والتحميل المسبق للوكلاء</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 text-[10px] font-black border border-amber-300 dark:border-amber-800">
                      ⚡ نظام ذكي متوازن
                    </span>
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    توزيع عادل يضمن تكافؤ أعباء العمل بين وكلاء الدعم الفني، أو تحميل مسبق وفق الكوتا الاستيعابية.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAutoDistributeModalOpen(false)}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Top Mode Switcher: Auto vs Manual */}
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl font-black text-xs">
              <button
                type="button"
                className="py-2 px-3 rounded-xl bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-300 shadow-xs flex items-center justify-center gap-2 cursor-pointer font-black"
              >
                <Cpu className="w-4 h-4 text-amber-500" />
                <span>⚡ خوارزميات التوزيع الآلي والذكي</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAutoDistributeModalOpen(false);
                  setIsManualDistributeModalOpen(true);
                }}
                className="py-2 px-3 rounded-xl text-slate-600 dark:text-slate-400 hover:text-teal-700 dark:hover:text-teal-300 hover:bg-white/50 dark:hover:bg-slate-700/50 flex items-center justify-center gap-2 transition cursor-pointer"
                title="التبديل إلى ورشة التوزيع اليدوي"
              >
                <Sliders className="w-4 h-4 text-teal-600" />
                <span>✍️ التوزيع والإسناد اليدوي المباشر</span>
              </button>
            </div>

            {/* 1. Algorithm Selection Cards */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-800 dark:text-slate-200 block">
                  1. اختر طريقة ونظام التوزيع (Distribution Strategy):
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsAutoDistributeModalOpen(false);
                    setIsManualDistributeModalOpen(true);
                  }}
                  className="text-[11px] font-black text-teal-700 dark:text-teal-300 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Sliders className="w-3 h-3" />
                  <span>فتح ورشة التوزيع اليدوي المتقدمة ←</span>
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {/* Strategy A: Balanced Workload */}
                <button
                  type="button"
                  onClick={() => setAutoAlgorithm('BALANCED_WORKLOAD')}
                  className={`p-3 rounded-2xl border text-right transition cursor-pointer flex flex-col justify-between ${
                    autoAlgorithm === 'BALANCED_WORKLOAD'
                      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 dark:border-amber-500 shadow-md shadow-amber-500/10'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-amber-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-black text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>توزيع متوازن</span>
                      </span>
                      {autoAlgorithm === 'BALANCED_WORKLOAD' && (
                        <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                      الأقل عبئاً أولاً: حساب العبء التراكمي لضمان تساوي الحسابات بين الجميع تماماً.
                    </p>
                  </div>
                  <span className="mt-2 text-[10px] font-black text-amber-700 dark:text-amber-400 block font-mono">
                    (موصى به للعدالة)
                  </span>
                </button>

                {/* Strategy B: Capacity Preload */}
                <button
                  type="button"
                  onClick={() => setAutoAlgorithm('CAPACITY_PRELOAD')}
                  className={`p-3 rounded-2xl border text-right transition cursor-pointer flex flex-col justify-between ${
                    autoAlgorithm === 'CAPACITY_PRELOAD'
                      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 dark:border-amber-500 shadow-md shadow-amber-500/10'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-amber-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-black text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                        <SlidersHorizontal className="w-4 h-4 text-orange-500 shrink-0" />
                        <span>تحميل مسبق</span>
                      </span>
                      {autoAlgorithm === 'CAPACITY_PRELOAD' && (
                        <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                      ملء طاقة الوكلاء حتى الحد الأقصى (الكوتا) تتابعاً لتركيز الرعاية.
                    </p>
                  </div>
                  <span className="mt-2 text-[10px] font-black text-orange-700 dark:text-orange-400 block font-mono">
                    (كوتا محددة)
                  </span>
                </button>

                {/* Strategy C: Round-Robin */}
                <button
                  type="button"
                  onClick={() => setAutoAlgorithm('ROUND_ROBIN')}
                  className={`p-3 rounded-2xl border text-right transition cursor-pointer flex flex-col justify-between ${
                    autoAlgorithm === 'ROUND_ROBIN'
                      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 dark:border-amber-500 shadow-md shadow-amber-500/10'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-amber-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-black text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                        <RefreshCw className="w-4 h-4 text-teal-500 shrink-0" />
                        <span>توزيع دوري</span>
                      </span>
                      {autoAlgorithm === 'ROUND_ROBIN' && (
                        <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                      توزيع تسلسلي دائري (1 لكل وكيل بالتتابع الدائري التام).
                    </p>
                  </div>
                  <span className="mt-2 text-[10px] font-black text-teal-700 dark:text-teal-400 block font-mono">
                    (تتابع تسلسلي)
                  </span>
                </button>

                {/* Strategy D: Manual Allocation */}
                <button
                  type="button"
                  onClick={() => {
                    setIsAutoDistributeModalOpen(false);
                    setIsManualDistributeModalOpen(true);
                  }}
                  className="p-3 rounded-2xl border text-right transition cursor-pointer flex flex-col justify-between bg-teal-50/70 hover:bg-teal-100/80 dark:bg-teal-950/40 dark:hover:bg-teal-950/70 border-teal-300 dark:border-teal-700 hover:border-teal-500 shadow-xs group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-black text-xs text-teal-950 dark:text-teal-200 flex items-center gap-1.5">
                        <Sliders className="w-4 h-4 text-teal-600 shrink-0" />
                        <span>توزيع يدوي</span>
                      </span>
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-teal-200 dark:bg-teal-800 text-teal-900 dark:text-teal-100">
                        مباشر
                      </span>
                    </div>
                    <p className="text-[11px] text-teal-900/80 dark:text-teal-300/80 leading-snug">
                      تحكم يدوي مخصص: اختيار الحسابات بالاسم أو تحديد أعداد معينة لكل وكيل.
                    </p>
                  </div>
                  <span className="mt-2 text-[10px] font-black text-teal-700 dark:text-teal-300 block font-mono flex items-center gap-1 group-hover:translate-x-[-2px] transition">
                    <span>افتح التوزيع اليدوي</span>
                    <span>←</span>
                  </span>
                </button>
              </div>
            </div>

            {/* 2. Target Group & Scope */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Target Group */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-800 dark:text-slate-200 block">
                  2. الفئة المستهدفة بالتوزيع:
                </label>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl font-bold">
                  <button
                    type="button"
                    onClick={() => setAutoTarget('BOTH')}
                    className={`py-2 px-2 rounded-xl text-center transition cursor-pointer text-xs ${
                      autoTarget === 'BOTH'
                        ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-xs font-black'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    الكل معاً
                  </button>
                  <button
                    type="button"
                    onClick={() => setAutoTarget('RESELLERS')}
                    className={`py-2 px-2 rounded-xl text-center transition cursor-pointer text-xs ${
                      autoTarget === 'RESELLERS'
                        ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-xs font-black'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    المسوقين ({stats.totalSellers})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAutoTarget('SUPPLIERS')}
                    className={`py-2 px-2 rounded-xl text-center transition cursor-pointer text-xs ${
                      autoTarget === 'SUPPLIERS'
                        ? 'bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-xs font-black'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    البائعين ({stats.totalSuppliers})
                  </button>
                </div>
              </div>

              {/* Scope Mode */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-800 dark:text-slate-200 block">
                  3. نطاق الإسناد:
                </label>
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl font-bold">
                  <button
                    type="button"
                    onClick={() => setAutoMode('UNASSIGNED_ONLY')}
                    className={`py-2 px-2 rounded-xl text-center transition cursor-pointer text-xs ${
                      autoMode === 'UNASSIGNED_ONLY'
                        ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs font-black'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    غير المسندين فقط (آمن)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAutoMode('REBALANCE_ALL')}
                    className={`py-2 px-2 rounded-xl text-center transition cursor-pointer text-xs ${
                      autoMode === 'REBALANCE_ALL'
                        ? 'bg-white dark:bg-slate-700 text-rose-700 dark:text-rose-300 shadow-xs font-black'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    إعادة موازنة شاملة
                  </button>
                </div>
              </div>
            </div>

            {/* 3. Max Capacity Quota Per Agent */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs text-slate-900 dark:text-white block">
                    الحد الأقصى للقدرة الاستيعابية لكل وكيل (Max Quota Capacity):
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    الحد الأقصى للمسوقين والموردين المسندين لكل وكيل دعم لتفادي الإرهاق وضمان الجودة.
                  </span>
                </div>
                <span className="text-sm font-black font-mono px-3 py-1 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300">
                  {autoMaxCapacity} حساب / وكيل
                </span>
              </div>

              <div className="flex items-center gap-2 pt-1">
                {[15, 25, 35, 50, 100].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setAutoMaxCapacity(num)}
                    className={`px-3 py-1 rounded-xl text-xs font-black transition cursor-pointer ${
                      autoMaxCapacity === num
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {num}
                  </button>
                ))}
                <input
                  type="number"
                  min="5"
                  max="500"
                  value={autoMaxCapacity}
                  onChange={(e) => setAutoMaxCapacity(Number(e.target.value) || 30)}
                  className="w-20 px-2 py-1 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-center font-mono font-bold text-xs outline-none"
                />
              </div>
            </div>

            {/* 4. Live Agent Workload Status Matrix */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-800 dark:text-slate-200 block">
                  4. وكلاء الدعم المشمولون بالتحميل والتوزيع ({selectedAgentIdsForAuto.length} / {supportAgents.length}):
                </label>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedAgentIdsForAuto.length === supportAgents.length) {
                      setSelectedAgentIdsForAuto([]);
                    } else {
                      setSelectedAgentIdsForAuto(supportAgents.map((a) => a.id));
                    }
                  }}
                  className="text-teal-600 dark:text-teal-400 font-bold text-[11px] hover:underline"
                >
                  {selectedAgentIdsForAuto.length === supportAgents.length ? 'إلغاء تحديد الكل' : 'تحديد جميع الوكلاء'}
                </button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {agentWorkloads.map((agent) => {
                  const isChecked = selectedAgentIdsForAuto.includes(agent.agentId);
                  const loadPct = Math.min(100, Math.round((agent.totalLoad / Math.max(1, autoMaxCapacity)) * 100));

                  return (
                    <div
                      key={agent.agentId}
                      className={`p-3 rounded-2xl border transition flex items-center justify-between gap-3 ${
                        isChecked
                          ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-2xs'
                          : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200/60 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedAgentIdsForAuto((prev) => [...prev, agent.agentId]);
                            } else {
                              setSelectedAgentIdsForAuto((prev) => prev.filter((id) => id !== agent.agentId));
                            }
                          }}
                          className="rounded text-teal-600 focus:ring-teal-500 cursor-pointer w-4 h-4"
                        />
                        <div>
                          <span className="font-black text-xs text-slate-900 dark:text-white block">
                            {agent.agentName}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {agent.assignedResellersCount} مسوق • {agent.assignedSuppliersCount} بائع
                          </span>
                        </div>
                      </div>

                      {/* Workload Progress Bar */}
                      <div className="flex items-center gap-3 min-w-[160px]">
                        <div className="flex-1 space-y-1">
                          <div className="flex justify-between text-[10px] font-mono">
                            <span className="font-bold text-slate-600 dark:text-slate-300">
                              العبء: {agent.totalLoad} / {autoMaxCapacity}
                            </span>
                            <span
                              className={`font-black ${
                                loadPct > 85 ? 'text-rose-600' : loadPct > 60 ? 'text-amber-600' : 'text-emerald-600'
                              }`}
                            >
                              {loadPct}%
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                loadPct > 85
                                  ? 'bg-rose-500'
                                  : loadPct > 60
                                  ? 'bg-amber-500'
                                  : 'bg-gradient-to-r from-teal-500 to-emerald-500'
                              }`}
                              style={{ width: `${loadPct}%` }}
                            />
                          </div>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                            agent.totalLoad >= autoMaxCapacity
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}
                        >
                          {agent.totalLoad >= autoMaxCapacity ? 'ممتلئ' : 'متاح'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 5. Auto-assign on new registration switch */}
            <div className="p-3.5 rounded-2xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Zap className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0" />
                <div>
                  <span className="font-black text-xs text-teal-950 dark:text-teal-200 block">
                    التوزيع التلقائي الذكي عند تسجيل أي مستخدم جديد (Auto-Assign on Register)
                  </span>
                  <span className="text-[11px] text-teal-800 dark:text-teal-300">
                    عند تسجيل مسوق أو بائع جديد، يتم إسناده فوراً للوكيل الأقل عبئاً لضمان توازن مستمر.
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleToggleAutoOnRegister}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  autoConfig.enabledAutoOnRegister ? 'bg-teal-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    autoConfig.enabledAutoOnRegister ? 'translate-x-0' : '-translate-x-5'
                  }`}
                />
              </button>
            </div>

            {/* Summary & Actions Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <div className="text-[11px] text-slate-500 font-bold text-center sm:text-right">
                {autoMode === 'UNASSIGNED_ONLY' ? (
                  <span>
                    سيتم توزيع{' '}
                    <strong className="text-teal-600 dark:text-teal-400">
                      {autoTarget === 'RESELLERS'
                        ? stats.unassignedCount
                        : autoTarget === 'SUPPLIERS'
                        ? stats.unassignedSuppliersCount
                        : stats.unassignedCount + stats.unassignedSuppliersCount}
                    </strong>{' '}
                    حساب غير مسند بالتساوي على{' '}
                    <strong className="text-amber-600 dark:text-amber-400">{selectedAgentIdsForAuto.length}</strong> وكيل
                    دعم.
                  </span>
                ) : (
                  <span>
                    إعادة توزيع شاملة لجميع الحسابات (
                    <strong className="text-teal-600">
                      {autoTarget === 'RESELLERS'
                        ? stats.totalSellers
                        : autoTarget === 'SUPPLIERS'
                        ? stats.totalSuppliers
                        : stats.totalSellers + stats.totalSuppliers}
                    </strong>
                    ) بالتكافؤ التام.
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setIsAutoDistributeModalOpen(false)}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-black text-xs transition cursor-pointer"
                >
                  إلغاء
                </button>

                <button
                  type="button"
                  onClick={handleRunAutoDistribution}
                  className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-teal-600 hover:from-amber-400 hover:to-teal-500 text-slate-950 hover:text-white font-black text-xs shadow-lg shadow-amber-500/25 active:scale-95 transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>تطبيق التوزيع الآلي الآن</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MANUAL DISTRIBUTION & REASSIGNMENT STUDIO MODAL ================= */}
      {isManualDistributeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn font-sans">
          <div className="w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-gradient-to-tr from-teal-600 via-emerald-600 to-teal-700 text-white shadow-lg shadow-teal-500/25">
                  <Sliders className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <span>ورشة التوزيع والإسناد اليدوي</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 text-[10px] font-black border border-teal-300 dark:border-teal-800">
                      ✍️ تحكم يدوي كامل
                    </span>
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    إسناد مباشر لحسابات محددة، نقل وتفويض الحسابات بين الوكلاء، أو التقسيم اليدوي المخصص بالأعداد.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsManualDistributeModalOpen(false)}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Top Mode Switcher: Manual vs Auto */}
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl font-black text-xs">
              <button
                type="button"
                className="py-2 px-3 rounded-xl bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-xs flex items-center justify-center gap-2 cursor-pointer font-black"
              >
                <Sliders className="w-4 h-4 text-teal-600" />
                <span>✍️ ورشة التوزيع والإسناد اليدوي</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsManualDistributeModalOpen(false);
                  setIsAutoDistributeModalOpen(true);
                }}
                className="py-2 px-3 rounded-xl text-slate-600 dark:text-slate-400 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-white/50 dark:hover:bg-slate-700/50 flex items-center justify-center gap-2 transition cursor-pointer"
                title="التبديل إلى نظام التوزيع الآلي"
              >
                <Cpu className="w-4 h-4 text-amber-500" />
                <span>⚡ الانتقال للتوزيع الآلي الذكي</span>
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl font-black text-xs">
              <button
                type="button"
                onClick={() => setManualDistributeSubMode('DIRECT')}
                className={`py-2 px-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  manualDistributeSubMode === 'DIRECT'
                    ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>إسناد يدوي مباشر</span>
              </button>

              <button
                type="button"
                onClick={() => setManualDistributeSubMode('TRANSFER')}
                className={`py-2 px-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  manualDistributeSubMode === 'TRANSFER'
                    ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>نقل بين الوكلاء</span>
              </button>

              <button
                type="button"
                onClick={() => setManualDistributeSubMode('CUSTOM_QUOTA')}
                className={`py-2 px-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  manualDistributeSubMode === 'CUSTOM_QUOTA'
                    ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Repeat className="w-3.5 h-3.5" />
                <span>تقسيم يدوي بالأعداد</span>
              </button>
            </div>

            {/* ================= SUB-MODE 1: DIRECT MANUAL ASSIGNMENT ================= */}
            {manualDistributeSubMode === 'DIRECT' && (
              <div className="space-y-4">
                {/* 1. Target Agent Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-800 dark:text-slate-200 block">
                    1. حدد وكيل الدعم الفني المستهدف بالإسناد:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {supportAgents.map((agent) => {
                      const isSelected = manualTargetAgentId === agent.id;
                      const workload = agentWorkloads.find((w) => w.agentId === agent.id);
                      return (
                        <button
                          key={agent.id}
                          type="button"
                          onClick={() => setManualTargetAgentId(agent.id)}
                          className={`p-3 rounded-2xl border text-right transition cursor-pointer ${
                            isSelected
                              ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-500 shadow-md shadow-teal-500/10'
                              : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-teal-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-black text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span>👤</span>
                              <span>{agent.fullName}</span>
                            </span>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                            <span>العبء الحالي:</span>
                            <span className="font-mono font-black text-teal-700 dark:text-teal-300">
                              {workload?.totalLoad || 0} حساب
                            </span>
                          </div>
                          {/* Progress Load Bar */}
                          <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-1.5">
                            <div
                              className="bg-teal-500 h-full rounded-full transition-all"
                              style={{ width: `${workload?.loadPercent || 0}%` }}
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Target Category */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-800 dark:text-slate-200 block">
                    2. اختر فئة الحسابات:
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl font-bold">
                    <button
                      type="button"
                      onClick={() => setManualUserGroup('RESELLERS')}
                      className={`py-2 px-2 rounded-xl text-center transition cursor-pointer text-xs ${
                        manualUserGroup === 'RESELLERS'
                          ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-xs font-black'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      المسوقين ({sellers.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setManualUserGroup('SUPPLIERS')}
                      className={`py-2 px-2 rounded-xl text-center transition cursor-pointer text-xs ${
                        manualUserGroup === 'SUPPLIERS'
                          ? 'bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-xs font-black'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      البائعين والموردين ({suppliers.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setManualUserGroup('BOTH')}
                      className={`py-2 px-2 rounded-xl text-center transition cursor-pointer text-xs ${
                        manualUserGroup === 'BOTH'
                          ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs font-black'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      كلاهما معاً ({sellers.length + suppliers.length})
                    </button>
                  </div>
                </div>

                {/* 3. User Selection Checklist */}
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <label className="text-xs font-black text-slate-800 dark:text-slate-200 block">
                      3. حدد الحسابات يدوياً (انقر لاختيار الحساب):
                    </label>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={handleSelectUnassignedOnlyManual}
                        className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 text-[11px] font-bold transition cursor-pointer"
                      >
                        ⚡ تحديد غير المسندين فقط
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (manualUserGroup === 'RESELLERS' || manualUserGroup === 'BOTH') {
                            setManualSelectedSellerIds(manualFilteredSellers.map((s) => s.id));
                          }
                          if (manualUserGroup === 'SUPPLIERS' || manualUserGroup === 'BOTH') {
                            setManualSelectedSupplierIds(manualFilteredSuppliers.map((s) => s.id));
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold transition cursor-pointer"
                      >
                        تحديد الكل المعروض
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setManualSelectedSellerIds([]);
                          setManualSelectedSupplierIds([]);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[11px] font-bold transition cursor-pointer"
                      >
                        إلغاء التحديد
                      </button>
                    </div>
                  </div>

                  {/* Search and status filter */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute start-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        value={manualUserSearch}
                        onChange={(e) => setManualUserSearch(e.target.value)}
                        placeholder="ابحث بالاسم، المتجر، الهاتف، الولاية..."
                        className="w-full ps-8 pe-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-teal-500"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-bold">
                      {(['ALL', 'UNASSIGNED', 'ASSIGNED'] as const).map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setManualUserFilter(f)}
                          className={`flex-1 py-1.5 rounded-xl transition cursor-pointer text-center text-[11px] ${
                            manualUserFilter === f
                              ? 'bg-teal-600 text-white font-black shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                          }`}
                        >
                          {f === 'ALL' ? 'الكل' : f === 'UNASSIGNED' ? 'غير مسندين' : 'مسندين'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Scrollable list of selectable items */}
                  <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-2 max-h-60 overflow-y-auto space-y-1.5 bg-slate-50/50 dark:bg-slate-900/40">
                    {/* Marketers list */}
                    {(manualUserGroup === 'RESELLERS' || manualUserGroup === 'BOTH') &&
                      manualFilteredSellers.map((s) => {
                        const isChecked = manualSelectedSellerIds.includes(s.id);
                        const assign = assignments[s.id];
                        return (
                          <div
                            key={s.id}
                            onClick={() => {
                              if (isChecked) {
                                setManualSelectedSellerIds(manualSelectedSellerIds.filter((id) => id !== s.id));
                              } else {
                                setManualSelectedSellerIds([...manualSelectedSellerIds, s.id]);
                              }
                            }}
                            className={`p-2.5 rounded-xl border flex items-center justify-between gap-2.5 transition cursor-pointer select-none ${
                              isChecked
                                ? 'bg-teal-50/80 dark:bg-teal-950/40 border-teal-500'
                                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-teal-300'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {}}
                                className="w-4 h-4 rounded text-teal-600 accent-teal-600 cursor-pointer"
                              />
                              <div className="truncate">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-black text-xs text-slate-900 dark:text-white truncate">
                                    {s.fullName}
                                  </span>
                                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 shrink-0">
                                    مسوق
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-400 block truncate">
                                  {s.storeName || 'متجر مستقل'} • {s.wilaya} • {s.phone}
                                </span>
                              </div>
                            </div>

                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                                assign?.agentId
                                  ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                  : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 font-black'
                              }`}
                            >
                              {assign?.agentName ? `مسند لـ: ${assign.agentName}` : 'غير مسند'}
                            </span>
                          </div>
                        );
                      })}

                    {/* Suppliers list */}
                    {(manualUserGroup === 'SUPPLIERS' || manualUserGroup === 'BOTH') &&
                      manualFilteredSuppliers.map((sup) => {
                        const isChecked = manualSelectedSupplierIds.includes(sup.id);
                        const assign = supplierAssignments[sup.id];
                        return (
                          <div
                            key={sup.id}
                            onClick={() => {
                              if (isChecked) {
                                setManualSelectedSupplierIds(manualSelectedSupplierIds.filter((id) => id !== sup.id));
                              } else {
                                setManualSelectedSupplierIds([...manualSelectedSupplierIds, sup.id]);
                              }
                            }}
                            className={`p-2.5 rounded-xl border flex items-center justify-between gap-2.5 transition cursor-pointer select-none ${
                              isChecked
                                ? 'bg-purple-50/80 dark:bg-purple-950/40 border-purple-500'
                                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-purple-300'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {}}
                                className="w-4 h-4 rounded text-purple-600 accent-purple-600 cursor-pointer"
                              />
                              <div className="truncate">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-black text-xs text-slate-900 dark:text-white truncate">
                                    {sup.companyName || sup.fullName}
                                  </span>
                                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 shrink-0">
                                    بائع / مورد
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-400 block truncate">
                                  المسؤول: {sup.fullName} • {sup.wilaya} • {sup.phone}
                                </span>
                              </div>
                            </div>

                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                                assign?.agentId
                                  ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                  : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 font-black'
                              }`}
                            >
                              {assign?.agentName ? `مسند لـ: ${assign.agentName}` : 'غير مسند'}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* 4. Notes for the agent */}
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-800 dark:text-slate-200 block">
                    4. ملاحظات وتوجيهات خاصة للإسناد (اختياري):
                  </label>
                  <input
                    type="text"
                    value={manualNotes}
                    onChange={(e) => setManualNotes(e.target.value)}
                    placeholder="مثال: يرجى المتابعة العاجلة لتجهيز الطلبيات وسحب الأرباح..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-teal-500"
                  />
                </div>

                {/* Direct execution footer */}
                <div className="p-3.5 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-xs">
                    <span className="font-black text-teal-950 dark:text-teal-200 block">
                      ملخص الإسناد اليدوي:
                    </span>
                    <span className="text-[11px] text-slate-600 dark:text-slate-300">
                      تم تحديد{' '}
                      <strong className="text-teal-700 dark:text-teal-300 font-mono">
                        {manualSelectedSellerIds.length + manualSelectedSupplierIds.length}
                      </strong>{' '}
                      حساب لإسنادهم إلى{' '}
                      <strong className="text-slate-900 dark:text-white">
                        {supportAgents.find((a) => a.id === manualTargetAgentId)?.fullName || 'الوكيل المحدد'}
                      </strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setIsManualDistributeModalOpen(false)}
                      className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
                    >
                      إلغاء
                    </button>
                    <button
                      type="button"
                      onClick={handleExecuteManualDirect}
                      className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-black text-xs shadow-md shadow-teal-600/25 transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>تأكيد الإسناد اليدوي المباشر</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ================= SUB-MODE 2: TRANSFER BETWEEN AGENTS ================= */}
            {manualDistributeSubMode === 'TRANSFER' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 text-xs text-indigo-900 dark:text-indigo-200">
                  <span className="font-black block flex items-center gap-1.5 mb-1">
                    <ArrowLeftRight className="w-4 h-4 text-indigo-600" />
                    <span>نقل وتفويض الحسابات يدوياً بين وكلاء الدعم</span>
                  </span>
                  <span>
                    تتيح لك هذه الميزة إعادة توجيه الحسابات المسندة من وكيل (مثلاً في حال إجازة أو تغيير وردية) إلى وكيل
                    بديل بسهولة تامة.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* From Agent */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-800 dark:text-slate-200 block">
                      من الوكيل المصدر (الحالي):
                    </label>
                    <select
                      value={transferFromAgentId}
                      onChange={(e) => {
                        setTransferFromAgentId(e.target.value);
                        setTransferSelectedUserIds([]);
                      }}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="">-- اختر الوكيل المصدر --</option>
                      {supportAgents.map((a) => {
                        const load = agentWorkloads.find((w) => w.agentId === a.id);
                        return (
                          <option key={a.id} value={a.id}>
                            {a.fullName} ({load?.totalLoad || 0} حساب مسند)
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* To Agent */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-800 dark:text-slate-200 block">
                      إلى الوكيل المستلم (البديل):
                    </label>
                    <select
                      value={transferToAgentId}
                      onChange={(e) => setTransferToAgentId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="">-- اختر الوكيل المستلم --</option>
                      {supportAgents
                        .filter((a) => a.id !== transferFromAgentId)
                        .map((a) => {
                          const load = agentWorkloads.find((w) => w.agentId === a.id);
                          return (
                            <option key={a.id} value={a.id}>
                              {a.fullName} ({load?.totalLoad || 0} حساب حالي)
                            </option>
                          );
                        })}
                    </select>
                  </div>
                </div>

                {/* Target Category for transfer */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-800 dark:text-slate-200 block">
                    نوع الحسابات المراد نقلها:
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl font-bold">
                    <button
                      type="button"
                      onClick={() => setTransferTargetGroup('BOTH')}
                      className={`py-2 px-2 rounded-xl text-center transition cursor-pointer text-xs ${
                        transferTargetGroup === 'BOTH'
                          ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs font-black'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      كل الحسابات معاً
                    </button>
                    <button
                      type="button"
                      onClick={() => setTransferTargetGroup('RESELLERS')}
                      className={`py-2 px-2 rounded-xl text-center transition cursor-pointer text-xs ${
                        transferTargetGroup === 'RESELLERS'
                          ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs font-black'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      المسوقين فقط
                    </button>
                    <button
                      type="button"
                      onClick={() => setTransferTargetGroup('SUPPLIERS')}
                      className={`py-2 px-2 rounded-xl text-center transition cursor-pointer text-xs ${
                        transferTargetGroup === 'SUPPLIERS'
                          ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs font-black'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      البائعين فقط
                    </button>
                  </div>
                </div>

                {/* Transfer scope mode */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-800 dark:text-slate-200 block">
                    نطاق النقل:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTransferMode('ALL')}
                      className={`p-3 rounded-2xl border text-right transition cursor-pointer ${
                        transferMode === 'ALL'
                          ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <span className="font-black text-xs text-slate-900 dark:text-white block">
                        نقل جميع الحسابات دفعة واحدة
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                        تحويل كامل حقيبة الوكيل المصدر إلى الوكيل المستلم.
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTransferMode('SPECIFIC')}
                      className={`p-3 rounded-2xl border text-right transition cursor-pointer ${
                        transferMode === 'SPECIFIC'
                          ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <span className="font-black text-xs text-slate-900 dark:text-white block">
                        تحديد حسابات معينة للنقل
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                        اختيار يدوي للحسابات المراد نقلها فقط.
                      </span>
                    </button>
                  </div>

                  {/* If specific, list source agent's accounts */}
                  {transferMode === 'SPECIFIC' && transferFromAgentId && (
                    <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-2 max-h-52 overflow-y-auto space-y-1.5 bg-slate-50/50 dark:bg-slate-900/40">
                      {/* Source agent's resellers */}
                      {(transferTargetGroup === 'RESELLERS' || transferTargetGroup === 'BOTH') &&
                        sellers
                          .filter((s) => assignments[s.id]?.agentId === transferFromAgentId)
                          .map((s) => {
                            const isChecked = transferSelectedUserIds.includes(s.id);
                            return (
                              <div
                                key={s.id}
                                onClick={() => {
                                  if (isChecked) {
                                    setTransferSelectedUserIds(transferSelectedUserIds.filter((id) => id !== s.id));
                                  } else {
                                    setTransferSelectedUserIds([...transferSelectedUserIds, s.id]);
                                  }
                                }}
                                className={`p-2 rounded-xl border flex items-center justify-between text-xs cursor-pointer ${
                                  isChecked ? 'bg-indigo-50 border-indigo-500' : 'bg-white border-slate-200'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <input type="checkbox" checked={isChecked} onChange={() => {}} />
                                  <span className="font-bold text-slate-900">{s.fullName} (مسوق)</span>
                                </div>
                                <span className="text-[10px] text-slate-400">{s.storeName || s.wilaya}</span>
                              </div>
                            );
                          })}

                      {/* Source agent's suppliers */}
                      {(transferTargetGroup === 'SUPPLIERS' || transferTargetGroup === 'BOTH') &&
                        suppliers
                          .filter((sup) => supplierAssignments[sup.id]?.agentId === transferFromAgentId)
                          .map((sup) => {
                            const isChecked = transferSelectedUserIds.includes(sup.id);
                            return (
                              <div
                                key={sup.id}
                                onClick={() => {
                                  if (isChecked) {
                                    setTransferSelectedUserIds(transferSelectedUserIds.filter((id) => id !== sup.id));
                                  } else {
                                    setTransferSelectedUserIds([...transferSelectedUserIds, sup.id]);
                                  }
                                }}
                                className={`p-2 rounded-xl border flex items-center justify-between text-xs cursor-pointer ${
                                  isChecked ? 'bg-indigo-50 border-indigo-500' : 'bg-white border-slate-200'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <input type="checkbox" checked={isChecked} onChange={() => {}} />
                                  <span className="font-bold text-slate-900">
                                    {sup.companyName || sup.fullName} (بائع)
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-400">{sup.wilaya}</span>
                              </div>
                            );
                          })}
                    </div>
                  )}
                </div>

                {/* Transfer Action Bar */}
                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsManualDistributeModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteTransfer}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-md shadow-indigo-600/25 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <ArrowLeftRight className="w-4 h-4" />
                    <span>تأكيد نقل الحسابات الآن</span>
                  </button>
                </div>
              </div>
            )}

            {/* ================= SUB-MODE 3: CUSTOM QUOTA MANUAL DISTRIBUTION ================= */}
            {manualDistributeSubMode === 'CUSTOM_QUOTA' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200">
                  <span className="font-black block flex items-center gap-1.5 mb-1">
                    <Repeat className="w-4 h-4 text-amber-600" />
                    <span>توزيع يدوي مخصص بالأعداد على الوكلاء</span>
                  </span>
                  <span>
                    حدد يدوياً عدد الحسابات غير المسندة التي ترغب بإسنادها لكل وكيل دعم، وسيقوم النظام بتوزيع العدد
                    المطلوب فوراً.
                  </span>
                </div>

                {/* Presets */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                    أعداد الحسابات المخصصة لكل وكيل:
                  </span>
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => {
                        const updated: Record<string, number> = {};
                        supportAgents.forEach((a) => (updated[a.id] = 5));
                        setCustomAgentCounts(updated);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 text-[11px] cursor-pointer"
                    >
                      +5 لكل وكيل
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const updated: Record<string, number> = {};
                        supportAgents.forEach((a) => (updated[a.id] = 10));
                        setCustomAgentCounts(updated);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 text-[11px] cursor-pointer"
                    >
                      +10 لكل وكيل
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomAgentCounts({})}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 text-[11px] cursor-pointer"
                    >
                      تصفير
                    </button>
                  </div>
                </div>

                {/* Agent Inputs */}
                <div className="space-y-2.5">
                  {supportAgents.map((agent) => {
                    const count = customAgentCounts[agent.id] || 0;
                    const workload = agentWorkloads.find((w) => w.agentId === agent.id);
                    return (
                      <div
                        key={agent.id}
                        className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 shadow-xs"
                      >
                        <div>
                          <span className="font-black text-xs text-slate-900 dark:text-white block">
                            👤 {agent.fullName}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            العبء الحالي: {workload?.totalLoad || 0} حساب (سعة قصوى: {workload?.maxCapacity || 30})
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <label className="text-[11px] font-bold text-slate-500">العدد المطلوب:</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={count}
                            onChange={(e) => {
                              const val = Math.max(0, parseInt(e.target.value) || 0);
                              setCustomAgentCounts({
                                ...customAgentCounts,
                                [agent.id]: val,
                              });
                            }}
                            className="w-20 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-center text-xs font-mono font-black text-amber-600 dark:text-amber-400 outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Custom quota footer */}
                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-xs">
                    <span className="font-black text-amber-950 dark:text-amber-200 block">
                      إجمالي الحسابات المطلوب إسنادها:
                    </span>
                    <span className="text-[11px] text-slate-600 dark:text-slate-300">
                      سيتم سحب{' '}
                      <strong className="text-amber-600 font-mono">
                        {(Object.values(customAgentCounts) as number[]).reduce((a, b) => a + (Number(b) || 0), 0)}
                      </strong>{' '}
                      حساب غير مسند وتوزيعها حسب الأعداد المحددة أعلاه.
                    </span>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setIsManualDistributeModalOpen(false)}
                      className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
                    >
                      إلغاء
                    </button>
                    <button
                      type="button"
                      onClick={handleExecuteCustomQuota}
                      className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/25 transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Repeat className="w-4 h-4" />
                      <span>تطبيق التوزيع اليدوي بالأعداد</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
