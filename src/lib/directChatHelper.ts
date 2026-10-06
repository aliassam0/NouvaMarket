import {
  getAssignedSupportAgentForReseller,
  getAssignedSupportAgentForSupplier,
  getStoredSupportAssignments,
  getStoredSupplierSupportAssignments,
} from './supportHelper';
import { getStoredSystemUsers } from './systemUserHelper';

export interface DirectChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: 'RESELLER' | 'SUPPLIER' | 'SUPPORT' | 'ADMIN';
  text: string;
  timestamp: string; // ISO date string
  readByRecipient: boolean;
  attachmentUrl?: string;
}

export interface DirectChatConversation {
  id: string; // e.g. `conv_${partyId}`
  partyId: string;
  partyType: 'RESELLER' | 'SUPPLIER';
  partyName: string;
  partyStoreName?: string;
  partyPhone: string;
  partyWilaya?: string;
  agentId: string;
  agentName: string;
  agentPhone?: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadByAgentCount: number;
  unreadByPartyCount: number;
  messages: DirectChatMessage[];
}

const STORAGE_KEY_DIRECT_CONVERSATIONS = 'nouva_direct_chat_conversations_v1';

// Cross-tab broadcast channel for instant zero-latency sync
let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel('nouva_direct_chat_broadcast');
    broadcastChannel.onmessage = (event) => {
      if (event.data?.type === 'CONVERSATIONS_UPDATED') {
        window.dispatchEvent(
          new CustomEvent('nouva_direct_chat_updated', { detail: event.data.conversations })
        );
      }
    };
  }
} catch {
  // Silent fallback
}

/**
 * Play a light synthesized notification chime
 */
export function playChatChimeSound(): void {
  try {
    if (typeof window === 'undefined') return;
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch {
    // Audio autoplay restrictions or not supported
  }
}

/**
 * Smart merge two sets of conversations so NO message or conversation is ever deleted
 */
export function mergeDirectConversations(
  target: Record<string, DirectChatConversation>,
  incoming: Record<string, DirectChatConversation>
): { merged: Record<string, DirectChatConversation>; hasNewMessages: boolean } {
  const merged: Record<string, DirectChatConversation> = { ...target };
  let hasNewMessages = false;

  for (const [convId, inConv] of Object.entries(incoming)) {
    if (!inConv) continue;

    if (!merged[convId]) {
      merged[convId] = inConv;
      hasNewMessages = true;
    } else {
      const curMsgs = merged[convId].messages || [];
      const newMsgs = inConv.messages || [];
      const msgMap = new Map<string, DirectChatMessage>();

      curMsgs.forEach((m) => {
        if (m && m.id) msgMap.set(m.id, m);
      });

      newMsgs.forEach((m) => {
        if (m && m.id) {
          if (!msgMap.has(m.id)) {
            hasNewMessages = true;
          }
          msgMap.set(m.id, { ...(msgMap.get(m.id) || {}), ...m });
        }
      });

      const allMsgs = Array.from(msgMap.values()).sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      merged[convId] = {
        ...merged[convId],
        ...inConv,
        messages: allMsgs,
        lastMessage: allMsgs.length > 0 ? allMsgs[allMsgs.length - 1].text : merged[convId].lastMessage,
        lastMessageAt: allMsgs.length > 0 ? allMsgs[allMsgs.length - 1].timestamp : merged[convId].lastMessageAt,
      };
    }
  }

  return { merged, hasNewMessages };
}

/**
 * Bidirectional background sync with server to ensure 100% persistent history
 */
let isSyncing = false;
export async function syncDirectChatWithServer(): Promise<void> {
  if (isSyncing || typeof window === 'undefined') return;
  isSyncing = true;
  try {
    const rawLocal = localStorage.getItem(STORAGE_KEY_DIRECT_CONVERSATIONS);
    const localConvs: Record<string, DirectChatConversation> = rawLocal ? JSON.parse(rawLocal) : {};

    // 1. Fetch server conversations
    const res = await fetch('/api/support/direct-chat', { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    const serverConvs: Record<string, DirectChatConversation> = data.conversations || {};

    // 2. Merge local + server
    const { merged, hasNewMessages } = mergeDirectConversations(localConvs, serverConvs);

    // 3. Save merged to local
    localStorage.setItem(STORAGE_KEY_DIRECT_CONVERSATIONS, JSON.stringify(merged));

    // 4. Send updated union to server to guarantee server has everything
    fetch('/api/support/direct-chat/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversations: merged }),
    }).catch(() => {});

    if (hasNewMessages) {
      window.dispatchEvent(
        new CustomEvent('nouva_direct_chat_updated', { detail: merged })
      );
    }
  } catch (err) {
    // Offline or network hiccup, local storage is reliable
  } finally {
    isSyncing = false;
  }
}

/**
 * Get all stored conversations with server sync
 */
export function getStoredDirectConversations(): Record<string, DirectChatConversation> {
  try {
    // Fire background server sync
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        syncDirectChatWithServer().catch(() => {});
      }, 50);
    }

    const raw = localStorage.getItem(STORAGE_KEY_DIRECT_CONVERSATIONS);
    if (!raw) {
      const initial = getSampleInitialConversations();
      localStorage.setItem(STORAGE_KEY_DIRECT_CONVERSATIONS, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed;
    }
    return {};
  } catch {
    return {};
  }
}

/**
 * Save all direct chat conversations & broadcast & sync to server
 */
export function saveStoredDirectConversations(
  conversations: Record<string, DirectChatConversation>,
  notifyBroadcast = true
): void {
  try {
    localStorage.setItem(STORAGE_KEY_DIRECT_CONVERSATIONS, JSON.stringify(conversations));
    window.dispatchEvent(
      new CustomEvent('nouva_direct_chat_updated', { detail: conversations })
    );

    if (notifyBroadcast && broadcastChannel) {
      broadcastChannel.postMessage({ type: 'CONVERSATIONS_UPDATED', conversations });
    }

    // Persist to server permanently
    if (typeof window !== 'undefined') {
      fetch('/api/support/direct-chat/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversations }),
      }).catch(() => {});
    }
  } catch (e) {
    console.error('Failed to save direct chat conversations:', e);
  }
}

/**
 * Default support agent fallback when no assignment is made yet
 */
export function getDefaultSupportAgent(): { id: string; fullName: string; phone: string } {
  const users = getStoredSystemUsers();
  const supportUser = users.find((u) => u.role === 'RESELLER_SUPPORT' && u.status === 'ACTIVE');
  if (supportUser) {
    return {
      id: supportUser.id,
      fullName: supportUser.fullName,
      phone: supportUser.phone || '0555000111',
    };
  }
  return {
    id: 'sys-usr-support-1',
    fullName: 'سارة مراد (الدعم الفني المباشر)',
    phone: '0555000111',
  };
}

/**
 * Get or automatically create a conversation for a seller/marketer with their assigned agent
 */
export function getOrCreateDirectConversation(params: {
  partyId: string;
  partyType: 'RESELLER' | 'SUPPLIER';
  partyName: string;
  partyStoreName?: string;
  partyPhone: string;
  partyWilaya?: string;
}): DirectChatConversation {
  const conversations = getStoredDirectConversations();
  const convId = `conv_${params.partyId}`;

  // Find assigned agent
  let assignedAgentId = '';
  let assignedAgentName = '';
  let assignedAgentPhone = '';

  if (params.partyType === 'RESELLER') {
    const assignment = getAssignedSupportAgentForReseller(params.partyId);
    if (assignment && assignment.agentId) {
      assignedAgentId = assignment.agentId;
      assignedAgentName = assignment.agentName;
    }
  } else {
    const assignment = getAssignedSupportAgentForSupplier(params.partyId);
    if (assignment && assignment.agentId) {
      assignedAgentId = assignment.agentId;
      assignedAgentName = assignment.agentName;
    }
  }

  // Fallback to default agent if not assigned
  if (!assignedAgentId) {
    const defAgent = getDefaultSupportAgent();
    assignedAgentId = defAgent.id;
    assignedAgentName = defAgent.fullName;
    assignedAgentPhone = defAgent.phone;
  }

  const existing = conversations[convId];
  if (existing) {
    // Update agent if assignment changed
    if (assignedAgentId && existing.agentId !== assignedAgentId) {
      existing.agentId = assignedAgentId;
      existing.agentName = assignedAgentName;
      if (assignedAgentPhone) existing.agentPhone = assignedAgentPhone;
      saveStoredDirectConversations(conversations, false);
    }
    return existing;
  }

  // Create initial conversation with a warm welcome from the assigned agent
  const welcomeText =
    params.partyType === 'RESELLER'
      ? `مرحباً بك أخي ${params.partyName}! معك ${assignedAgentName}، وكيل الدعم الفني الخاص بك في منصة Nouva Market. أنا هنا لمساعدتك في أي استفسار حول طلبيات متجرك، الشحن، سحب الأرباح، أو ربط المنتجات. يمكنك مراسلتي في أي وقت وسأجيبك فوراً!`
      : `أهلاً وسهلاً بحضرتك ${params.partyName}! معك ${assignedAgentName} من فريق الدعم الفني للموردين والبائعين. يسعدني مرافقتك في متابعة توريد المنتجات للمستودعات المركزية وحل أي استفسار مالي أو لوجستي. كيف يمكنني خدمتك اليوم؟`;

  const newConv: DirectChatConversation = {
    id: convId,
    partyId: params.partyId,
    partyType: params.partyType,
    partyName: params.partyName,
    partyStoreName: params.partyStoreName,
    partyPhone: params.partyPhone,
    partyWilaya: params.partyWilaya,
    agentId: assignedAgentId,
    agentName: assignedAgentName,
    agentPhone: assignedAgentPhone || '0555000111',
    lastMessage: welcomeText,
    lastMessageAt: new Date().toISOString(),
    unreadByAgentCount: 0,
    unreadByPartyCount: 1,
    messages: [
      {
        id: `msg_welcome_${Date.now()}`,
        conversationId: convId,
        senderId: assignedAgentId,
        senderName: assignedAgentName,
        senderRole: 'SUPPORT',
        text: welcomeText,
        timestamp: new Date().toISOString(),
        readByRecipient: false,
      },
    ],
  };

  conversations[convId] = newConv;
  saveStoredDirectConversations(conversations);
  return newConv;
}

/**
 * Send a message in a direct conversation
 */
export function sendDirectChatMessage(params: {
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: 'RESELLER' | 'SUPPLIER' | 'SUPPORT' | 'ADMIN';
  text: string;
  attachmentUrl?: string;
}): DirectChatMessage {
  const conversations = getStoredDirectConversations();
  const conv = conversations[params.conversationId];

  if (!conv) {
    throw new Error(`Conversation not found: ${params.conversationId}`);
  }

  const nowIso = new Date().toISOString();
  const newMsg: DirectChatMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    conversationId: params.conversationId,
    senderId: params.senderId,
    senderName: params.senderName,
    senderRole: params.senderRole,
    text: params.text.trim(),
    timestamp: nowIso,
    readByRecipient: false,
    attachmentUrl: params.attachmentUrl,
  };

  conv.messages.push(newMsg);
  conv.lastMessage = newMsg.text;
  conv.lastMessageAt = nowIso;

  if (params.senderRole === 'RESELLER' || params.senderRole === 'SUPPLIER') {
    conv.unreadByAgentCount = (conv.unreadByAgentCount || 0) + 1;
  } else {
    conv.unreadByPartyCount = (conv.unreadByPartyCount || 0) + 1;
  }

  saveStoredDirectConversations(conversations);
  playChatChimeSound();

  return newMsg;
}

/**
 * Mark all messages in a conversation as read by the current viewer
 */
export function markDirectConversationRead(
  conversationId: string,
  readerRole: 'PARTY' | 'SUPPORT'
): void {
  const conversations = getStoredDirectConversations();
  const conv = conversations[conversationId];
  if (!conv) return;

  let changed = false;

  if (readerRole === 'PARTY') {
    if (conv.unreadByPartyCount > 0) {
      conv.unreadByPartyCount = 0;
      changed = true;
    }
    conv.messages.forEach((m) => {
      if (m.senderRole === 'SUPPORT' && !m.readByRecipient) {
        m.readByRecipient = true;
        changed = true;
      }
    });
  } else {
    if (conv.unreadByAgentCount > 0) {
      conv.unreadByAgentCount = 0;
      changed = true;
    }
    conv.messages.forEach((m) => {
      if (
        (m.senderRole === 'RESELLER' || m.senderRole === 'SUPPLIER') &&
        !m.readByRecipient
      ) {
        m.readByRecipient = true;
        changed = true;
      }
    });
  }

  if (changed) {
    saveStoredDirectConversations(conversations, false);
  }
}

/**
 * Synchronize all direct conversations with active support assignments
 * Guarantees that conversation agent IDs strictly match current assignments in Admin
 */
export function syncAllConversationsWithAssignments(): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DIRECT_CONVERSATIONS);
    if (!raw) return;
    const conversations: Record<string, DirectChatConversation> = JSON.parse(raw);
    const resellerAssignments = getStoredSupportAssignments();
    const supplierAssignments = getStoredSupplierSupportAssignments();
    let changed = false;

    Object.values(conversations).forEach((conv) => {
      if (!conv || !conv.partyId) return;

      if (conv.partyType === 'RESELLER') {
        const assign = resellerAssignments[conv.partyId];
        if (assign && assign.agentId && conv.agentId !== assign.agentId) {
          conv.agentId = assign.agentId;
          conv.agentName = assign.agentName;
          changed = true;
        }
      } else if (conv.partyType === 'SUPPLIER') {
        const assign = supplierAssignments[conv.partyId];
        if (assign && assign.agentId && conv.agentId !== assign.agentId) {
          conv.agentId = assign.agentId;
          conv.agentName = assign.agentName;
          changed = true;
        }
      }
    });

    if (changed) {
      saveStoredDirectConversations(conversations, false);
    }
  } catch (err) {
    console.error('Error syncing direct chat with assignments:', err);
  }
}

/**
 * Get all conversations for a specific support agent (STRICT PRIVACY ISOLATION)
 * Every support agent sees ONLY the conversations belonging to users assigned to them!
 */
export function getConversationsForAgent(agentId?: string): DirectChatConversation[] {
  // Always synchronize conversations with the latest assignments
  syncAllConversationsWithAssignments();

  const conversations = getStoredDirectConversations();
  const list = Object.values(conversations);
  if (!agentId || agentId === 'ALL') {
    return list.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
  }

  // Strict agent filter: ONLY conversations belonging to this specific agent!
  return list
    .filter((conv) => {
      if (conv.agentId === agentId) return true;
      if (
        (conv.agentId === 'sys-usr-support-1' && agentId === 'usr-4') ||
        (conv.agentId === 'usr-4' && agentId === 'sys-usr-support-1')
      ) {
        return true;
      }
      return false;
    })
    .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
}

/**
 * Get total unread count for an agent
 */
export function getTotalUnreadForAgent(agentId?: string): number {
  const agentConvs = getConversationsForAgent(agentId);
  return agentConvs.reduce((sum, c) => sum + (c.unreadByAgentCount || 0), 0);
}

/**
 * Initial sample seed conversations so support dashboard has realistic data immediately
 */
function getSampleInitialConversations(): Record<string, DirectChatConversation> {
  const now = Date.now();
  return {
    conv_sel_101: {
      id: 'conv_sel_101',
      partyId: 'sel-101',
      partyType: 'RESELLER',
      partyName: 'أحمد بن علي',
      partyStoreName: 'متجر الأناقة ديزاد',
      partyPhone: '0555123456',
      partyWilaya: 'الجزائر العاصمة',
      agentId: 'sys-usr-support-1',
      agentName: 'سارة مراد',
      agentPhone: '0555000111',
      lastMessage: 'تمام أختي سارة، شكراً جزيلاً تم تحويل أرباح الـ BaridiMob بنجاح!',
      lastMessageAt: new Date(now - 1000 * 60 * 12).toISOString(),
      unreadByAgentCount: 1,
      unreadByPartyCount: 0,
      messages: [
        {
          id: 'msg_init_1',
          conversationId: 'conv_sel_101',
          senderId: 'sys-usr-support-1',
          senderName: 'سارة مراد',
          senderRole: 'SUPPORT',
          text: 'مرحباً بك أخي أحمد! معك سارة مراد من الدعم الفني. تمت مراجعة طلب السحب الخاص بك وجارٍ إرسال الحوالة.',
          timestamp: new Date(now - 1000 * 60 * 45).toISOString(),
          readByRecipient: true,
        },
        {
          id: 'msg_init_2',
          conversationId: 'conv_sel_101',
          senderId: 'sel-101',
          senderName: 'أحمد بن علي',
          senderRole: 'RESELLER',
          text: 'تمام أختي سارة، شكراً جزيلاً تم تحويل أرباح الـ BaridiMob بنجاح!',
          timestamp: new Date(now - 1000 * 60 * 12).toISOString(),
          readByRecipient: false,
        },
      ],
    },
    conv_sup_1: {
      id: 'conv_sup_1',
      partyId: 'sup-1',
      partyType: 'SUPPLIER',
      partyName: 'كمال بلقاسم',
      partyStoreName: 'مؤسسة النور للاستيراد والتصنيع',
      partyPhone: '0661223344',
      partyWilaya: 'البليدة',
      agentId: 'sys-usr-support-1',
      agentName: 'سارة مراد',
      agentPhone: '0555000111',
      lastMessage: 'السلام عليكم، أرسلنا اليوم شحنة 200 قطعة من الحقائب الجلدية إلى مستودع الوسط 1.',
      lastMessageAt: new Date(now - 1000 * 60 * 5).toISOString(),
      unreadByAgentCount: 1,
      unreadByPartyCount: 0,
      messages: [
        {
          id: 'msg_init_3',
          conversationId: 'conv_sup_1',
          senderId: 'sup-1',
          senderName: 'كمال بلقاسم',
          senderRole: 'SUPPLIER',
          text: 'السلام عليكم، أرسلنا اليوم شحنة 200 قطعة من الحقائب الجلدية إلى مستودع الوسط 1.',
          timestamp: new Date(now - 1000 * 60 * 5).toISOString(),
          readByRecipient: false,
        },
      ],
    },
  };
}

/**
 * Format date for chat separator badges (اليوم / أمس / التاريخ)
 */
export function formatChatDateSeparator(isoString: string): string {
  try {
    const d = new Date(isoString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return 'اليوم';
    }
    if (d.toDateString() === yesterday.toDateString()) {
      return 'أمس';
    }

    return d.toLocaleDateString('ar-DZ', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return 'سابقاً';
  }
}

/**
 * Export conversation history as text/transcript
 */
export function exportDirectChatHistoryAsText(conv: DirectChatConversation): string {
  let output = `سجل محادثة الدعم الفني - Nouva Market\n`;
  output += `الطرف: ${conv.partyName} (${conv.partyType === 'RESELLER' ? 'مسوق' : 'مورد'})\n`;
  output += `المتجر/النشاط: ${conv.partyStoreName || 'لا يوجد'}\n`;
  output += `الهاتف: ${conv.partyPhone}\n`;
  output += `وكيل الدعم المخصص: ${conv.agentName}\n`;
  output += `تاريخ التصدير: ${new Date().toLocaleString('ar-DZ')}\n`;
  output += `عدد الرسائل: ${conv.messages.length}\n`;
  output += `-------------------------------------------------------\n\n`;

  conv.messages.forEach((msg, idx) => {
    const time = new Date(msg.timestamp).toLocaleString('ar-DZ');
    output += `[${idx + 1}] (${time}) ${msg.senderName} [${msg.senderRole}]:\n${msg.text}\n\n`;
  });

  return output;
}
