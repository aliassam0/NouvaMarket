import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Headphones,
  MessageSquare,
  X,
  Send,
  Search,
  Phone,
  ExternalLink,
  Users,
  Building2,
  CheckCheck,
  Sparkles,
  ArrowRight,
  Filter,
  CheckCircle2,
  Clock,
  ChevronLeft,
  Download,
  Check,
  History,
  LifeBuoy,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  DirectChatConversation,
  getStoredDirectConversations,
  sendDirectChatMessage,
  markDirectConversationRead,
  getTotalUnreadForAgent,
  getConversationsForAgent,
  playChatChimeSound,
  formatChatDateSeparator,
  exportDirectChatHistoryAsText,
} from '../../lib/directChatHelper';
import { CANNED_QUICK_REPLIES } from '../../lib/supportHelper';

export function SupportAgentInboxWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<DirectChatConversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'RESELLER' | 'SUPPLIER' | 'UNREAD'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCannedReplies, setShowCannedReplies] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const agentId = user?.id || 'sys-usr-support-1';
  const agentName = user?.fullName || 'سارة مراد (الدعم الفني)';

  // Load conversations for this agent
  const reloadData = () => {
    const list = getConversationsForAgent(agentId);
    setConversations([...list]);
  };

  useEffect(() => {
    reloadData();

    const handleUpdate = () => {
      reloadData();
    };

    window.addEventListener('nouva_direct_chat_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('nouva_direct_chat_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [agentId]);

  // Set default selected conversation if none selected and popup opens
  useEffect(() => {
    if (isOpen && !selectedConvId && conversations.length > 0) {
      setSelectedConvId(conversations[0].id);
    }
  }, [isOpen, conversations.length, selectedConvId]);

  const activeConversation = useMemo(() => {
    return conversations.find((c) => c.id === selectedConvId) || conversations[0] || null;
  }, [conversations, selectedConvId]);

  // Mark as read when active conversation changes or drawer opens
  useEffect(() => {
    if (isOpen && activeConversation) {
      markDirectConversationRead(activeConversation.id, 'SUPPORT');
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        inputRef.current?.focus();
      }, 80);
    }
  }, [isOpen, activeConversation?.id, activeConversation?.messages.length]);

  // Auto-scroll on new message
  useEffect(() => {
    if (isOpen && activeConversation) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeConversation?.messages.length, isOpen]);

  // Total unread for this agent
  const totalUnread = useMemo(() => {
    return conversations.reduce((sum, c) => sum + (c.unreadByAgentCount || 0), 0);
  }, [conversations]);

  // Filtered conversations list
  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      if (filterType === 'RESELLER' && c.partyType !== 'RESELLER') return false;
      if (filterType === 'SUPPLIER' && c.partyType !== 'SUPPLIER') return false;
      if (filterType === 'UNREAD' && (c.unreadByAgentCount || 0) === 0) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          c.partyName.toLowerCase().includes(q) ||
          (c.partyStoreName && c.partyStoreName.toLowerCase().includes(q)) ||
          c.partyPhone.includes(q) ||
          (c.partyWilaya && c.partyWilaya.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [conversations, filterType, searchQuery]);

  const handleSendReply = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!replyText.trim() || !activeConversation) return;

    const text = replyText.trim();
    setReplyText('');

    sendDirectChatMessage({
      conversationId: activeConversation.id,
      senderId: agentId,
      senderName: agentName,
      senderRole: 'SUPPORT',
      text,
    });

    reloadData();
  };

  const handleInsertCannedReply = (content: string) => {
    setReplyText(content);
    setShowCannedReplies(false);
    inputRef.current?.focus();
  };

  const handleExportHistory = () => {
    if (!activeConversation) return;
    const text = exportDirectChatHistoryAsText(activeConversation);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent-chat-history-${activeConversation.partyType.toLowerCase()}-${activeConversation.partyName}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2500);
  };

  const handleOpenWhatsApp = (phone: string, name: string) => {
    let cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '213' + cleanPhone.slice(1);
    const msg = `مرحباً سيدي الكريم ${name}، معك ${agentName} من فريق الدعم الفني بمنصة Nouva Market.`;
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noreferrer noopener';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <>
      {/* ================= FLOATING SUPPORT INBOX BUTTON ================= */}
      {!isOpen && (
        <div className="fixed bottom-6 end-6 z-40 flex items-center gap-2 group">
          <div className="hidden sm:flex items-center gap-2 bg-slate-900/90 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-xl border border-slate-700/60 backdrop-blur-md opacity-0 group-hover:opacity-100 transition duration-200 pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-teal-400"></span>
            <span>صندوق محادثات الدعم المباشرة</span>
          </div>

          <button
            onClick={() => setIsOpen(true)}
            className="relative p-3.5 sm:p-4 rounded-full bg-gradient-to-tr from-teal-700 via-teal-600 to-indigo-600 hover:from-teal-600 hover:to-indigo-500 text-white shadow-2xl shadow-teal-700/40 active:scale-95 transition-all duration-200 cursor-pointer border-2 border-white/30 flex items-center justify-center group"
            title="فتح صندوق الرسائل المباشرة للمسوقين والبائعين التابعين لك"
            aria-label="صندوق رسائل الدعم الفني"
          >
            {/* Online Static Indicator (No Heartbeat / Ping) */}
            <span className="absolute -top-0.5 -start-0.5 w-3.5 h-3.5 rounded-full bg-teal-400 border-2 border-white shadow-xs"></span>

            {/* Unread Messages Pill (Static Clean Badge) */}
            {totalUnread > 0 && (
              <span className="absolute -top-2 -end-2 bg-rose-600 text-white font-mono font-black text-xs px-2 py-0.5 rounded-full shadow-lg border-2 border-white">
                {totalUnread}
              </span>
            )}

            <LifeBuoy className="w-6 h-6 sm:w-7 sm:h-7 text-white transition-transform group-hover:rotate-45 duration-300" />
          </button>
        </div>
      )}

      {/* ================= SUPPORT AGENT LIVE INBOX POPUP ================= */}
      {isOpen && (
        <div className="fixed bottom-4 sm:bottom-6 end-4 sm:end-6 z-50 w-[96vw] sm:w-[760px] h-[600px] max-h-[90vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 font-sans">
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-800 via-teal-700 to-slate-900 text-white p-3.5 flex items-center justify-between shrink-0 shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white font-black text-sm border border-white/20">
                <Headphones className="w-5 h-5 text-teal-300" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-sm sm:text-base leading-tight">
                    صندوق محادثات الدعم المباشرة (Live Support Hub)
                  </h3>
                  {totalUnread > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white font-mono">
                      {totalUnread} جديدة
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-teal-200 font-medium">
                  الرسائل والاستفسارات الحية من المسوقين والبائعين التابعين لك
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              title="إغلاق الصندوق"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Main Dual-Pane Container */}
          <div className="flex-1 min-h-0 flex flex-col sm:flex-row overflow-hidden">
            {/* ================= LEFT PANE: CONVERSATIONS LIST ================= */}
            <div
              className={`w-full sm:w-[280px] border-b sm:border-b-0 sm:border-s border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-950/40 shrink-0 ${
                activeConversation && 'hidden sm:flex'
              }`}
            >
              {/* Search Bar */}
              <div className="p-2.5 border-b border-slate-200/80 dark:border-slate-800">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute start-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="بحث باسم المسوق أو المورد..."
                    className="w-full ps-8 pe-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1 p-2 overflow-x-auto no-scrollbar border-b border-slate-200/60 dark:border-slate-800 text-[10.5px] font-bold">
                {[
                  { id: 'ALL', label: 'الكل' },
                  { id: 'RESELLER', label: 'المسوقين' },
                  { id: 'SUPPLIER', label: 'الموردين' },
                  { id: 'UNREAD', label: 'غير مقروءة' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setFilterType(tab.id as any)}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer shrink-0 ${
                      filterType === tab.id
                        ? 'bg-teal-600 text-white font-black'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Conversations List */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredConversations.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    لا توجد محادثات تطابق الفلترة الحالية.
                  </div>
                ) : (
                  filteredConversations.map((conv) => {
                    const isSelected = selectedConvId === conv.id;
                    const unread = conv.unreadByAgentCount || 0;

                    return (
                      <button
                        key={conv.id}
                        onClick={() => setSelectedConvId(conv.id)}
                        className={`w-full p-3 text-right flex items-start justify-between gap-2 transition cursor-pointer ${
                          isSelected
                            ? 'bg-teal-50/80 dark:bg-teal-950/40 border-r-4 border-teal-600'
                            : 'hover:bg-slate-100/70 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <div className="flex items-start gap-2 min-w-0">
                          <div className="relative shrink-0">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs ${
                                conv.partyType === 'RESELLER'
                                  ? 'bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300'
                                  : 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300'
                              }`}
                            >
                              {conv.partyType === 'RESELLER' ? (
                                <Users className="w-4 h-4" />
                              ) : (
                                <Building2 className="w-4 h-4" />
                              )}
                            </div>
                            <span className="absolute -bottom-0.5 -end-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900"></span>
                          </div>

                          <div className="min-w-0 flex-1 space-y-0.5">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-black text-xs text-slate-900 dark:text-white truncate">
                                {conv.partyName}
                              </span>
                            </div>

                            <span className="text-[10px] text-slate-400 block truncate font-medium">
                              {conv.partyStoreName || conv.partyWilaya}
                            </span>

                            <p className="text-[11px] text-slate-600 dark:text-slate-300 truncate">
                              {conv.lastMessage || 'محادثة جديدة'}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="text-[9.5px] font-mono text-slate-400">
                            {formatTime(conv.lastMessageAt)}
                          </span>
                          {unread > 0 && (
                            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-600 text-white font-mono">
                              {unread}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* ================= RIGHT PANE: ACTIVE CHAT VIEW ================= */}
            <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-900">
              {activeConversation ? (
                <>
                  {/* Active Header */}
                  <div className="p-3 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0 bg-slate-50/50 dark:bg-slate-900">
                    <div className="flex items-center gap-2">
                      {/* Back button on mobile */}
                      <button
                        onClick={() => setSelectedConvId(null)}
                        className="sm:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white"
                        title="رجوع للقائمة"
                      >
                        <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
                      </button>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white">
                            {activeConversation.partyName}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                              activeConversation.partyType === 'RESELLER'
                                ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
                                : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                            }`}
                          >
                            {activeConversation.partyType === 'RESELLER' ? 'مسوق معتمد' : 'بائع ومورد'}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-400 flex items-center gap-2 font-medium">
                          <span>{activeConversation.partyStoreName || 'متجر'}</span>
                          <span>•</span>
                          <span>{activeConversation.partyWilaya}</span>
                          <span>•</span>
                          <span className="font-mono" dir="ltr">{activeConversation.partyPhone}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={handleExportHistory}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                        title="تصدير وتحميل كامل سجل المحادثة كملف محفوظ"
                      >
                        {copiedSuccess ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Download className="w-3.5 h-3.5" />
                        )}
                        <span className="hidden sm:inline font-mono text-[11px]">
                          ({activeConversation.messages.length} رسالة)
                        </span>
                      </button>

                      <button
                        onClick={() =>
                          handleOpenWhatsApp(
                            activeConversation.partyPhone,
                            activeConversation.partyName
                          )
                        }
                        className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                        title="فتح واتساب مباشر مع هذا العميل"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">واتساب</span>
                      </button>
                    </div>
                  </div>

                  {/* Messages Stream with Permanent History and Date Separators */}
                  <div className="flex-1 overflow-y-auto p-3.5 space-y-2 bg-slate-50/70 dark:bg-slate-950/40">
                    {activeConversation.messages.map((msg, idx) => {
                      const isAgent = msg.senderRole === 'SUPPORT' || msg.senderRole === 'ADMIN';
                      const prevMsg = activeConversation.messages[idx - 1];
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

                          <div className={`flex flex-col ${isAgent ? 'items-end' : 'items-start'}`}>
                            <div
                              className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs shadow-xs space-y-1 ${
                                isAgent
                                  ? 'bg-teal-700 text-white rounded-be-xs'
                                  : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bs-xs border border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              <span
                                className={`block font-black text-[10.5px] ${
                                  isAgent ? 'text-teal-200' : 'text-teal-600 dark:text-teal-400'
                                }`}
                              >
                                {msg.senderName}
                              </span>

                              <p className="whitespace-pre-wrap leading-relaxed text-[12px]">{msg.text}</p>

                              <div
                                className={`flex items-center justify-end gap-1 text-[9.5px] font-mono ${
                                  isAgent ? 'text-teal-200' : 'text-slate-400'
                                }`}
                              >
                                <span>{formatTime(msg.timestamp)}</span>
                                {isAgent && (
                                  <CheckCheck className="w-3.5 h-3.5 text-teal-300" />
                                )}
                              </div>
                            </div>
                          </div>
                        </React.Fragment>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Canned Responses Popover */}
                  {showCannedReplies && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 max-h-48 overflow-y-auto space-y-2 animate-fadeIn shrink-0">
                      <div className="flex items-center justify-between text-xs font-black text-slate-700 dark:text-slate-300">
                        <span>اختر رداً نموذجياً للإدراج الفوري:</span>
                        <button
                          onClick={() => setShowCannedReplies(false)}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {CANNED_QUICK_REPLIES.map((cr) => (
                          <button
                            key={cr.id}
                            type="button"
                            onClick={() => handleInsertCannedReply(cr.content)}
                            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-teal-500 text-right text-xs transition cursor-pointer"
                          >
                            <strong className="block text-teal-700 dark:text-teal-300 font-bold truncate">
                              {cr.title}
                            </strong>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">
                              {cr.content}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Reply Input Bar */}
                  <form
                    onSubmit={handleSendReply}
                    className="p-2.5 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 flex items-center gap-2 shrink-0"
                  >
                    <button
                      type="button"
                      onClick={() => setShowCannedReplies(!showCannedReplies)}
                      className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer shrink-0 ${
                        showCannedReplies
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                      title="قوالب الردود الجاهزة"
                    >
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span className="hidden sm:inline">ردود جاهزة</span>
                    </button>

                    <input
                      ref={inputRef}
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="اكتب رد الدعم الفني الفوري هنا... (Enter للإرسال)"
                      className="flex-1 py-2 px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-teal-500 text-xs text-slate-900 dark:text-white font-medium outline-none transition"
                    />

                    <button
                      type="submit"
                      disabled={!replyText.trim()}
                      className="py-2 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-40 disabled:hover:bg-teal-600 text-white font-black text-xs shadow-md shadow-teal-600/20 active:scale-95 transition cursor-pointer flex items-center gap-1.5 shrink-0"
                      title="إرسال الرد فوراً"
                    >
                      <span>إرسال</span>
                      <Send className="w-3.5 h-3.5 rtl:rotate-180" />
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 text-xs">
                  <MessageSquare className="w-12 h-12 opacity-30 text-teal-600 mb-2" />
                  <p className="font-bold text-slate-600 dark:text-slate-300">
                    اختر محادثة من القائمة للبدء في الرد الفوري المباشر.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
