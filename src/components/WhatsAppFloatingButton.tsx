import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, PhoneCall, Sparkles, Check, Clock } from 'lucide-react';

interface WhatsAppFloatingButtonProps {
  phoneNumber?: string;
  formattedNumber?: string;
}

export const WhatsAppFloatingButton: React.FC<WhatsAppFloatingButtonProps> = ({
  phoneNumber = '212611938119',
  formattedNumber = '06 11 93 81 19',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [showTooltip, setShowTooltip] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Quick inquiry templates tailored for Moroccan flower shopping in Kenitra
  const quickInquiries = [
    {
      title: 'تنسيق باقة مخصصة',
      text: 'السلام عليكم، بغيت نستفسر على تنسيق باقة زهور مخصصة لمناسبة خاصة بالقنيطرة 🌸',
    },
    {
      title: 'التوصيل اليوم بالقنيطرة',
      text: 'مرحباً، واش ممكن توصيل باقة زهور اليوم لعنوان بالقنيطرة؟ وكم المدة؟ 🚚',
    },
    {
      title: 'استشارة لاختيار الباقة',
      text: 'مرحباً باقة وورد، محتاج مساعدة لاختيار أحسن باقة مناسبة لعيد ميلاد/ذكرى زواج 💐',
    },
    {
      title: 'إضافة هدية أو شوكولاتة',
      text: 'السلام عليكم، واش كتوفروا إمكانية إضافة شوكولاتة فاخرة أو بطاقة إهداء مخصصة مع الباقة؟ 🎁',
    },
  ];

  // Auto-hide the initial prompt tooltip after 8 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTooltip(false);
    }, 8000);
    return () => clearTimeout(timer);
  }, []);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSendToWhatsApp = (textToSend?: string) => {
    const message = textToSend || customMessage.trim() || 'مرحباً باقة وورد القنيطرة، أود الاستفسار حول باقات الزهور والتوصيل.';
    const encoded = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encoded}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className="fixed bottom-6 left-6 z-40 flex flex-col items-start font-cairo select-none"
      dir="rtl"
    >
      {/* Interactive Chat Card Popover */}
      {isOpen && (
        <div className="mb-3 w-[330px] sm:w-[370px] bg-white rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden animate-scaleUp text-stone-800">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-[#25D366] flex items-center justify-center text-white shadow-md">
                  <MessageCircle className="w-6 h-6 fill-current" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 border-2 border-emerald-900 rounded-full"></span>
              </div>
              <div className="text-right">
                <h3 className="text-sm font-bold flex items-center gap-1.5">
                  <span>باقة وورد - القنيطرة</span>
                  <span className="bg-emerald-600/70 text-emerald-100 text-[10px] px-1.5 py-0.5 rounded font-medium">
                    متصل
                  </span>
                </h3>
                <p className="text-[11px] text-emerald-200 flex items-center gap-1">
                  <Clock className="w-3 h-3 inline" />
                  <span>يجيب فوراً • هاتف: {formattedNumber}</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="text-emerald-200 hover:text-white p-1 rounded-lg hover:bg-emerald-700/50 transition-colors"
              aria-label="إغلاق المحادثة"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat Body */}
          <div className="p-4 bg-stone-50/70 max-h-[380px] overflow-y-auto space-y-3.5 text-right">
            {/* Store Greeting Bubble */}
            <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-stone-100 text-xs sm:text-sm text-stone-700 space-y-1.5 leading-relaxed">
              <p className="font-semibold text-emerald-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-rose-500" />
                <span>مرحباً بك في باقة وورد بالقنيطرة!</span>
              </p>
              <p className="text-stone-600 text-xs">
                فريقنا رهن إشارتكم لتنسيق أجمل باقات الزهور الطبيعية، التوصيل السريع داخل القنيطرة ونواحيها، أو تخصيص هداياكم.
              </p>
              <span className="text-[10px] text-stone-400 block pt-1">
                اختر استفساراً سريعاً أو اكتب رسالتك مباشرة:
              </span>
            </div>

            {/* Quick Action Inquiries */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-stone-500 block px-1">
                استفسارات شائعة بضغطة واحدة:
              </span>
              <div className="grid grid-cols-1 gap-1.5">
                {quickInquiries.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendToWhatsApp(item.text)}
                    className="w-full text-right p-2.5 rounded-xl bg-white hover:bg-emerald-50/80 border border-stone-200/80 hover:border-emerald-300 text-xs text-stone-700 hover:text-emerald-900 transition-all flex items-center justify-between group"
                  >
                    <span className="font-medium group-hover:translate-x-[-2px] transition-transform">
                      {item.title}
                    </span>
                    <Send className="w-3.5 h-3.5 text-stone-400 group-hover:text-emerald-700 transition-colors" />
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Input Message Form */}
            <div className="pt-2">
              <div className="flex items-center gap-1.5 bg-white border border-stone-200 rounded-2xl p-1.5 shadow-sm focus-within:border-emerald-700 focus-within:ring-2 focus-within:ring-emerald-700/20">
                <input
                  type="text"
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendToWhatsApp();
                  }}
                  placeholder="اكتب استفسارك هنا..."
                  className="flex-1 bg-transparent px-3 py-1.5 text-xs sm:text-sm text-stone-800 placeholder-stone-400 focus:outline-none"
                />
                <button
                  onClick={() => handleSendToWhatsApp()}
                  className="bg-[#25D366] hover:bg-[#20bd5a] text-white p-2 rounded-xl transition-all shadow-sm flex items-center justify-center shrink-0 active:scale-95"
                  title="إرسال لواتساب"
                  aria-label="إرسال"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Call Direct Option */}
            <div className="pt-1 flex items-center justify-between text-[11px] text-stone-500 border-t border-stone-200/60">
              <a
                href={`tel:+${phoneNumber}`}
                className="flex items-center gap-1 text-emerald-800 font-bold hover:underline"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>أو اتصال هاتفي: {formattedNumber}</span>
              </a>
              <span className="flex items-center gap-1 text-emerald-600 font-semibold text-[10px]">
                <Check className="w-3 h-3" />
                <span>توصيل اليوم متاح</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Trigger Button & Tooltip */}
      <div className="relative flex items-center gap-3">
        {/* Floating WhatsApp Button */}
        <button
          onClick={() => {
            setIsOpen((prev) => !prev);
            setShowTooltip(false);
          }}
          className="relative group bg-[#25D366] hover:bg-[#20bd5a] text-white p-3.5 sm:p-4 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 transform hover:scale-110 active:scale-95 focus:outline-none ring-4 ring-emerald-500/20"
          aria-label="تواصل سريع عبر واتساب"
          title="تواصل مباشر عبر واتساب"
        >
          {/* Pulsing Status Ring */}
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white"></span>
          </span>

          {isOpen ? (
            <X className="w-6 h-6 sm:w-7 sm:h-7 animate-scaleUp" />
          ) : (
            <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7 fill-current animate-pulse" />
          )}
        </button>

        {/* Text Pill / Tooltip */}
        {!isOpen && (
          <div
            onClick={() => {
              setIsOpen(true);
              setShowTooltip(false);
            }}
            className={`cursor-pointer bg-white text-stone-800 text-xs font-bold px-3.5 py-2 rounded-2xl shadow-xl border border-stone-100 flex items-center gap-2 transition-all duration-300 hover:border-emerald-300 hover:text-emerald-900 group ${
              showTooltip ? 'opacity-100 translate-x-0' : 'hidden sm:flex'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>واتساب القنيطرة: <strong className="text-emerald-700 font-black">{formattedNumber}</strong></span>
          </div>
        )}
      </div>
    </div>
  );
};
