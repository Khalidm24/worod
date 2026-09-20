import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  X,
  Send,
  RotateCcw,
  Bot,
  User,
  ShoppingBag,
  ExternalLink,
  MessageCircle,
  HelpCircle,
  ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product } from '../types';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  suggestedProducts?: string[];
}

interface AIFloristChatProps {
  products: Product[];
  onAddToCart?: (product: Product) => void;
  onQuickView?: (product: Product) => void;
}

const INITIAL_GREETING = `مرحباً بك في باقة وورد بالقنيطرة 🌸!
أنا **وردة**، مساعدتك الذكية لاختيار أجمل باقات الزهور وتنسيق الهدايا.

كيف يمكنني مساعدتك اليوم؟
• اقتراح باقة مناسبة لمناسبتك وميزانيتك
• كتابة بطاقة إهداء رومانسية أو تهنئة خاصة
• الاستفسار عن التوصيل السريع لجميع أحياء القنيطرة والمهدية`;

const SUGGESTED_PROMPTS = [
  '💐 اقترح علي باقة رومانسية لذكرى سنوية',
  '🎂 أريد باقة أنيقة لعيد ميلاد تحت 350 درهم',
  '🚚 كيف يتم التوصيل في أحياء القنيطرة؟',
  '✍️ اكتب لي بطاقة إهداء لطيفة بالدارجة',
  '👑 ما هي أفخم باقة لديكم للمناسبات الكبرى؟',
];

export const AIFloristChat: React.FC<AIFloristChatProps> = ({
  products,
  onAddToCart,
  onQuickView,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showNotificationBadge, setShowNotificationBadge] = useState(true);

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    // Try to load saved history from localStorage
    try {
      const saved = localStorage.getItem('baqa_ward_chat_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return [
      {
        id: 'init-1',
        role: 'model',
        text: INITIAL_GREETING,
        timestamp: new Date().toLocaleTimeString('ar-MA', { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Persist messages to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('baqa_ward_chat_history', JSON.stringify(messages));
    } catch {
      // ignore
    }
  }, [messages]);

  // Scroll to bottom when messages update or chat opens
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [messages, isOpen, isLoading]);

  // Handle message submission
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMessageId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMessageId,
      role: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString('ar-MA', { hour: '2-digit', minute: '2-digit' }),
    };

    // Update messages list immediately
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Format history for the server Gemini API endpoint
      const historyPayload = updatedMessages.map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: historyPayload.slice(0, -1), // previous history excluding current message
        }),
      });

      if (!res.ok) {
        throw new Error(`Server responded with ${res.status}`);
      }

      const data = await res.json();
      const botReply = data.reply || 'يسعدنا خدمتكم في باقة وورد بالقنيطرة 🌸!';

      // Identify if any product is referenced in the reply
      const matchedProductIds: string[] = [];
      products.forEach((prod) => {
        if (
          botReply.includes(prod.name) ||
          (prod.nameEn && botReply.toLowerCase().includes(prod.nameEn.toLowerCase())) ||
          botReply.includes(prod.id)
        ) {
          matchedProductIds.push(prod.id);
        }
      });

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'model',
        text: botReply,
        timestamp: new Date().toLocaleTimeString('ar-MA', { hour: '2-digit', minute: '2-digit' }),
        suggestedProducts: matchedProductIds.length > 0 ? matchedProductIds : undefined,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      console.error('Chat error:', error);
      const fallbackMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        text: 'عفواً، حدث اتصال بطيء مؤقتاً. يمكنك دائماً مراسلتنا فورياً على الواتساب 0611938119 وسنكون سعداء جداً بخدمتك في القنيطرة 🌸',
        timestamp: new Date().toLocaleTimeString('ar-MA', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    if (window.confirm('هل تريد إعادة تعيين المحادثة وبدء استشارة جديدة؟')) {
      const resetMsg: ChatMessage = {
        id: `init-${Date.now()}`,
        role: 'model',
        text: INITIAL_GREETING,
        timestamp: new Date().toLocaleTimeString('ar-MA', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([resetMsg]);
      localStorage.removeItem('baqa_ward_chat_history');
    }
  };

  // Helper to render bold and bullet points cleanly
  const renderFormattedText = (text: string) => {
    return text.split('\n').map((line, idx) => {
      // Bold handling
      const formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

      if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
        return (
          <li
            key={idx}
            className="mr-3 list-disc text-stone-700 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: formattedLine.replace(/^[•-]\s*/, '') }}
          />
        );
      }
      return (
        <p
          key={idx}
          className="mb-1.5 last:mb-0 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: formattedLine }}
        />
      );
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end font-cairo select-none" dir="rtl">
      {/* Floating Action Button */}
      <div className="relative flex items-center gap-3">
        {/* Helper Tooltip if Chat is closed */}
        {!isOpen && showNotificationBadge && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            onClick={() => {
              setIsOpen(true);
              setShowNotificationBadge(false);
            }}
            className="hidden md:flex cursor-pointer items-center gap-2 bg-white/95 backdrop-blur text-stone-800 text-xs font-bold px-3.5 py-2 rounded-2xl shadow-xl border border-rose-100 hover:border-rose-300 hover:text-rose-900 transition-all group"
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            <span>مساعدة ذكية: <strong className="text-emerald-800 font-extrabold">استشر وردة للزهور</strong> 🌸</span>
          </motion.div>
        )}

        <button
          id="gemini-chatbot-btn"
          onClick={() => {
            setIsOpen((prev) => !prev);
            setShowNotificationBadge(false);
          }}
          className="relative group bg-gradient-to-r from-emerald-800 via-emerald-700 to-stone-900 text-white p-3.5 sm:p-4 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 transform hover:scale-105 active:scale-95 ring-4 ring-rose-300/40 hover:ring-rose-400/60"
          aria-label="المساعدة الذكية للزهور"
          title="المساعدة الذكية لاختيار الزهور (Gemini AI)"
        >
          {/* Pulsing AI badge */}
          <span className="absolute -top-1 -left-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 border-2 border-white"></span>
          </span>

          {isOpen ? (
            <ChevronDown className="w-6 h-6 sm:w-7 sm:h-7" />
          ) : (
            <div className="flex items-center gap-1">
              <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-rose-300 animate-pulse" />
            </div>
          )}
        </button>
      </div>

      {/* Chat Window Drawer / Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="mb-3 w-[340px] sm:w-[410px] h-[580px] max-h-[82vh] bg-white rounded-3xl shadow-2xl border border-stone-200/80 flex flex-col overflow-hidden text-stone-800 z-50"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-stone-900 text-white p-4 flex items-center justify-between border-b border-emerald-800/40 shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-400 flex items-center justify-center text-white shadow-md">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 border-2 border-emerald-900 rounded-full"></span>
                </div>
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-1.5">
                    <span>وردة - مستشارة باقة وورد</span>
                    <span className="bg-rose-500/80 text-white text-[10px] px-1.5 py-0.2 rounded font-medium">
                      Gemini AI
                    </span>
                  </h3>
                  <p className="text-[11px] text-emerald-200">
                    بوتيك الزهور بالقنيطرة • إجابة فورية ذكية
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 text-emerald-200">
                <button
                  onClick={handleResetChat}
                  className="p-1.5 rounded-lg hover:bg-emerald-800/60 hover:text-white transition-colors"
                  title="إعادة بدء المحادثة"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-emerald-800/60 hover:text-white transition-colors"
                  title="تصغير المحادثة"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Message Thread */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-stone-50/70 text-right">
              {messages.map((msg) => {
                const isBot = msg.role === 'model';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isBot ? 'items-start' : 'items-end'}`}
                  >
                    <div className="flex items-start gap-2 max-w-[88%]">
                      {isBot && (
                        <div className="w-7 h-7 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 mt-1 shadow-xs">
                          <Bot className="w-4 h-4" />
                        </div>
                      )}

                      <div
                        className={`p-3.5 rounded-2xl text-xs sm:text-sm shadow-xs ${
                          isBot
                            ? 'bg-white text-stone-800 border border-stone-200/80 rounded-tr-none'
                            : 'bg-emerald-800 text-white rounded-tl-none font-medium'
                        }`}
                      >
                        {renderFormattedText(msg.text)}

                        {/* Interactive Recommended Products Cards */}
                        {isBot && msg.suggestedProducts && msg.suggestedProducts.length > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-stone-100 space-y-2">
                            <span className="text-[11px] font-bold text-emerald-900 block">
                              الباقات المقترحة في المحادثة:
                            </span>
                            <div className="space-y-1.5">
                              {msg.suggestedProducts.map((prodId) => {
                                const prod = products.find((p) => p.id === prodId);
                                if (!prod) return null;
                                return (
                                  <div
                                    key={prod.id}
                                    className="flex items-center justify-between p-2 rounded-xl bg-stone-50 hover:bg-rose-50/60 border border-stone-200/60 transition-colors"
                                  >
                                    <div className="flex items-center gap-2">
                                      <img
                                        src={prod.image}
                                        alt={prod.name}
                                        className="w-9 h-9 rounded-lg object-cover border border-stone-200"
                                      />
                                      <div className="text-right">
                                        <h4 className="text-xs font-bold text-stone-900">
                                          {prod.name}
                                        </h4>
                                        <span className="text-[11px] font-black text-rose-700">
                                          {prod.price} درهم
                                        </span>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-1">
                                      {onQuickView && (
                                        <button
                                          onClick={() => onQuickView(prod)}
                                          className="text-[10px] font-bold px-2 py-1 bg-white border border-stone-200 rounded-lg text-stone-700 hover:text-emerald-900 transition-colors"
                                        >
                                          تفاصيل
                                        </button>
                                      )}
                                      {onAddToCart && (
                                        <button
                                          onClick={() => onAddToCart(prod)}
                                          className="text-[10px] font-bold px-2 py-1 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-1"
                                        >
                                          <ShoppingBag className="w-3 h-3" />
                                          <span>طلب</span>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        <span
                          className={`block text-[9px] mt-1.5 ${
                            isBot ? 'text-stone-400' : 'text-emerald-200'
                          }`}
                        >
                          {msg.timestamp}
                        </span>
                      </div>

                      {!isBot && (
                        <div className="w-7 h-7 rounded-full bg-emerald-900 text-white flex items-center justify-center shrink-0 mt-1 shadow-xs">
                          <User className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Animated Loading Indicator */}
              {isLoading && (
                <div className="flex items-start gap-2">
                  <div className="w-7 h-7 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 mt-1">
                    <Sparkles className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="bg-white border border-stone-200 rounded-2xl rounded-tr-none p-3 shadow-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-400 animate-bounce"></span>
                    <span
                      className="w-2 h-2 rounded-full bg-rose-500 animate-bounce"
                      style={{ animationDelay: '0.15s' }}
                    ></span>
                    <span
                      className="w-2 h-2 rounded-full bg-rose-600 animate-bounce"
                      style={{ animationDelay: '0.3s' }}
                    ></span>
                    <span className="text-xs text-stone-400 mr-2 font-medium">
                      وردة تفكر في أفضل تنسيق...
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompt Chips */}
            {messages.length <= 3 && (
              <div className="px-3 py-2 bg-stone-100/70 border-t border-stone-200/60 overflow-x-auto no-scrollbar flex items-center gap-1.5 shrink-0">
                {SUGGESTED_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(prompt)}
                    disabled={isLoading}
                    className="whitespace-nowrap text-[11px] font-semibold bg-white hover:bg-rose-50 text-stone-700 hover:text-rose-900 px-2.5 py-1.5 rounded-full border border-stone-200/80 hover:border-rose-300 transition-all shrink-0 active:scale-95"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {/* Input Form */}
            <div className="p-3 bg-white border-t border-stone-200 shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="اسأل وردة عن أي باقة أو مناسبة بالقنيطرة..."
                  disabled={isLoading}
                  className="flex-1 bg-stone-100 hover:bg-stone-50 focus:bg-white text-stone-800 text-xs sm:text-sm px-3.5 py-2.5 rounded-2xl border border-stone-200 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 focus:outline-none transition-all placeholder:text-stone-400"
                />

                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isLoading}
                  className="bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 disabled:hover:bg-emerald-800 text-white p-2.5 rounded-2xl transition-all shadow-sm active:scale-95 flex items-center justify-center shrink-0"
                  aria-label="إرسال"
                  title="إرسال"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>

              <div className="mt-2 flex items-center justify-between text-[10px] text-stone-400 px-1">
                <span>مدعوم بواسطة ذكاء Google Gemini 3.5</span>
                <span className="flex items-center gap-1 text-emerald-700 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  توصيل فوري بالقنيطرة
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
