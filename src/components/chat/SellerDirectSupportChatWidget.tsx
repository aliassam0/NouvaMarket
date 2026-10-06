import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  MessageCircle,
  X,
  Send,
  Phone,
  ExternalLink,
  CheckCheck,
  ShieldCheck,
  Sparkles,
  Headphones,
  Paperclip,
  Smile,
  ChevronDown,
  Search,
  Download,
  Copy,
  Check,
  History,
  LifeBuoy,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  DirectChatConversation,
  getOrCreateDirectConversation,
  sendDirectChatMessage,
  markDirectConversationRead,
  playChatChimeSound,
  formatChatDateSeparator,
  exportDirectChatHistoryAsText,
} from '../../lib/directChatHelper';

interface SellerDirectSupportChatWidgetProps {
  partyType: 'RESELLER' | 'SUPPLIER';
}

export function SellerDirectSupportChatWidget({ partyType }: SellerDirectSupportChatWidgetProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [conversation, setConversation] = useState<DirectChatConversation | null>(null);
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Determine current user ID & details
  const partyId = user?.id || (partyType === 'RESELLER' ? 'sel-101' : 'sup-1');
  const partyName = user?.fullName || (partyType === 'RESELLER' ? 'المسوق المعتمد' : 'المورد المعتمد');
  const partyStoreName = (user as any)?.storeName || (user as any)?.companyName || 'متجر ديزاد';
  const partyPhone = user?.phone || '0555123456';
  const partyWilaya = (user as any)?.wilaya || 'الجزائر العاصمة';

  // Load / sync conversation
  const loadConversation = () => {
    const conv = getOrCreateDirectConversation({
      partyId,
      partyType,
      partyName,
      partyStoreName,
      partyPhone,
      partyWilaya,
    });
    setConversation({ ...conv });
  };

  useEffect(() => {
    loadConversation();

    const handleUpdate = () => {
      loadConversation();
    };

    window.addEventListener('nouva_direct_chat_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('nouva_direct_chat_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [partyId, partyType]);

  // When drawer opens, mark as read and scroll to bottom
  useEffect(() => {
    if (isOpen && conversation) {
      markDirectConversationRead(conversation.id, 'PARTY');
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, conversation?.messages.length]);

  // Scroll to bottom on new message if open
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation?.messages.length, isOpen]);

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !conversation) return;

    const text = inputText.trim();
    setInputText('');

    sendDirectChatMessage({
      conversationId: conversation.id,
      senderId: partyId,
      senderName: partyName,
      senderRole: partyType,
      text,
    });

    loadConversation();
  };

  const handleQuickPromptClick = (prompt: string) => {
    if (!conversation) return;
    sendDirectChatMessage({
      conversationId: conversation.id,
      senderId: partyId,
      senderName: partyName,
      senderRole: partyType,
      text: prompt,
    });
    loadConversation();
  };

  const handleOpenWhatsApp = () => {
    const rawPhone = conversation?.agentPhone || '0555000111';
    let fullPhone = rawPhone.replace(/[^0-9]/g, '');
    if (fullPhone.startsWith('0')) fullPhone = '213' + fullPhone.slice(1);
    const msg = `مرحباً، معك ${partyName} (${partyType === 'RESELLER' ? 'مسوق' : 'مورد'} في Nouva Market). أود التواصل معك مباشرة بخصوص حسابي!`;
    const url = `https://wa.me/${fullPhone}?text=${encodeURIComponent(msg)}`;
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noreferrer noopener';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleExportHistory = () => {
    if (!conversation) return;
    const text = exportDirectChatHistoryAsText(conversation);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-history-${partyType.toLowerCase()}-${conversation.partyName}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2500);
  };

  const filteredMessages = useMemo(() => {
    if (!conversation?.messages) return [];
    if (!chatSearchQuery.trim()) return conversation.messages;
    const q = chatSearchQuery.toLowerCase().trim();
    return conversation.messages.filter(
      (m) => m.text.toLowerCase().includes(q) || m.senderName.toLowerCase().includes(q)
    );
  }, [conversation?.messages, chatSearchQuery]);

  const unreadCount = conversation?.unreadByPartyCount || 0;

  // Format message time
  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const quickChips = useMemo(() => {
    if (partyType === 'RESELLER') {
      return [
        'استفسار عن سحب الأرباح 💰',
        'متابعة طرد متأخر 📦',
        'ربط متجر خارجي 🛒',
        'سؤال حول بيكسل الحملة 🎯',
      ];
    }
    return [
      'تحديث المخزون بالمستودع 🏭',
      'فواتير ومستحقات التوريد 📑',
      'شحنة جديدة قيد التجهيز 🚚',
      'استفسار عن فحص الجودة 🔍',
    ];
  }, [partyType]);

  return (
    <>
      {/* ================= FLOATING CHAT BUTTON (Support LifeBuoy Icon) ================= */}
      {!isOpen && (
        <div className="fixed bottom-20 sm:bottom-6 end-4 sm:end-6 z-40 flex items-center gap-2 group">
          {/* Tooltip Pill */}
          <div className="hidden sm:flex items-center gap-2 bg-slate-900/95 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-xl border border-slate-700/60 backdrop-blur-md opacity-0 group-hover:opacity-100 transition duration-200 pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-teal-400"></span>
            <span>الدعم الفني المباشر: {conversation?.agentName || 'وكيلك المخصص'}</span>
          </div>

          <button
            onClick={() => setIsOpen(true)}
            className="relative p-3.5 sm:p-4 rounded-full bg-gradient-to-tr from-teal-600 via-teal-500 to-emerald-500 hover:from-teal-500 hover:to-emerald-400 text-white shadow-2xl shadow-teal-600/30 active:scale-95 transition-all duration-200 cursor-pointer border-2 border-white/40 flex items-center justify-center group"
            title="محادثة مباشرة وفورية مع وكيل الدعم الفني الخاص بك"
            aria-label="أيقونة الدعم الفني المباشر"
          >
            {/* Online Static Indicator (No Heartbeat / No Pulse Animation) */}
            <span className="absolute -top-0.5 -start-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-xs"></span>

            {/* Unread Message Badge (Clean Static Badge) */}
            {unreadCount > 0 && (
              <span className="absolute -top-2 -end-2 bg-rose-600 text-white font-mono font-black text-[11px] px-2 py-0.5 rounded-full shadow-lg border-2 border-white">
                {unreadCount}
              </span>
            )}

            {/* Support LifeBuoy Icon */}
            <LifeBuoy className="w-6 h-6 sm:w-7 sm:h-7 text-white transition-transform duration-300 group-hover:rotate-45" />
          </button>
        </div>
      )}

      {/* ================= LIVE CHAT POPUP WINDOW ================= */}
      {isOpen && (
        <div className="fixed bottom-4 sm:bottom-6 end-4 sm:end-6 z-50 w-[94vw] sm:w-[400px] h-[550px] max-h-[85vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 font-sans">
          {/* Header (Support LifeBuoy Theme Banner) */}
          <div className="bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600 text-white p-3.5 flex items-center justify-between shrink-0 shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white font-black text-sm border border-white/30">
                  <LifeBuoy className="w-5 h-5" />
                </div>
                <span className="absolute bottom-0 end-0 w-3 h-3 bg-emerald-400 border-2 border-teal-700 rounded-full"></span>
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-black text-xs sm:text-sm leading-tight">
                    {conversation?.agentName || 'وكيل الدعم الفني'}
                  </h3>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-200" />
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-teal-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300"></span>
                  <span>متصل الآن • مخصص لرعايتك 1-on-1</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleOpenWhatsApp}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                title="فتح محادثة واتساب الرسمية مع هذا الوكيل"
              >
                <Phone className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                title="إغلاق المحادثة"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sub-banner: Permanent History & Search Controls */}
          <div className="bg-emerald-50 dark:bg-emerald-950/40 px-3.5 py-1.5 border-b border-emerald-100 dark:border-emerald-900/40 flex items-center justify-between text-[11px] text-emerald-800 dark:text-emerald-300 shrink-0">
            <div className="flex items-center gap-1.5 font-bold">
              <History className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>سجل المحادثات محفوظ دائماً ({conversation?.messages?.length || 0} رسالة)</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className={`p-1 rounded-lg transition cursor-pointer ${
                  isSearchOpen ? 'bg-emerald-200 dark:bg-emerald-800 text-emerald-900' : 'hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                }`}
                title="بحث في السجل"
              >
                <Search className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleExportHistory}
                className="p-1 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition cursor-pointer"
                title="تصدير وتحميل كامل السجل"
              >
                {copiedSuccess ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-300" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Search bar when toggled */}
          {isSearchOpen && (
            <div className="p-2 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2 shrink-0 animate-fadeIn">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={chatSearchQuery}
                onChange={(e) => setChatSearchQuery(e.target.value)}
                placeholder="ابحث في سجل الرسائل السابقة..."
                className="flex-1 bg-transparent text-xs font-bold outline-none text-slate-900 dark:text-white"
                autoFocus
              />
              {chatSearchQuery && (
                <button
                  type="button"
                  onClick={() => setChatSearchQuery('')}
                  className="text-slate-400 hover:text-slate-600 text-[10px] font-bold"
                >
                  إلغاء
                </button>
              )}
            </div>
          )}

          {/* Message Stream */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-2 bg-slate-50/70 dark:bg-slate-950/50">
            {filteredMessages.map((msg, idx) => {
              const isMe = msg.senderRole === partyType || msg.senderId === partyId;
              const prevMsg = filteredMessages[idx - 1];
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

                  <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs shadow-xs space-y-1 ${
                        isMe
                          ? 'bg-emerald-600 text-white rounded-be-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bs-xs border border-slate-200/70 dark:border-slate-700/60'
                      }`}
                    >
                      {!isMe && (
                        <span className="block font-black text-[10.5px] text-emerald-600 dark:text-emerald-400">
                          {msg.senderName}
                        </span>
                      )}

                      <p className="whitespace-pre-wrap leading-relaxed text-[12px]">{msg.text}</p>

                      <div
                        className={`flex items-center justify-end gap-1 text-[9.5px] font-mono ${
                          isMe ? 'text-emerald-100' : 'text-slate-400'
                        }`}
                      >
                        <span>{formatTime(msg.timestamp)}</span>
                        {isMe && (
                          <CheckCheck className="w-3.5 h-3.5 text-emerald-200" />
                        )}
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Chips */}
          <div className="px-3 py-2 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800/80 shrink-0">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
              {quickChips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickPromptClick(chip)}
                  className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-emerald-950/60 text-slate-700 hover:text-emerald-700 dark:text-slate-300 dark:hover:text-emerald-300 text-[11px] font-bold shrink-0 border border-slate-200/60 dark:border-slate-700 transition cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Input Footer */}
          <form
            onSubmit={handleSendMessage}
            className="p-2.5 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 flex items-center gap-2 shrink-0"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="اكتب رسالتك لوكيل الدعم هنا... (Enter للإرسال)"
              className="flex-1 py-2.5 px-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-emerald-500 text-xs text-slate-900 dark:text-white font-medium outline-none transition"
            />

            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white font-black shadow-md shadow-emerald-600/20 active:scale-95 transition cursor-pointer shrink-0"
              title="إرسال فوري"
            >
              <Send className="w-4 h-4 rtl:rotate-180" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
