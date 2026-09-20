import React, { useState } from 'react';
import { Sparkles, Phone, Mail, MapPin, Send, Check, Clock, MessageCircle } from 'lucide-react';

export const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    setTimeout(() => {
      setEmail('');
      setSubscribed(false);
    }, 3000);
  };

  return (
    <footer id="contact" className="bg-stone-950 text-stone-300 pt-16 pb-12 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Newsletter Bar */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 p-8 sm:p-10 rounded-3xl border border-emerald-800/40 mb-14 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-7 space-y-2 text-center lg:text-right">
              <span className="text-xs font-bold text-rose-300 uppercase tracking-widest flex items-center justify-center lg:justify-start gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                النشرة الإخبارية الحصرية
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold text-white font-cairo">
                انضم لمجتمع "باقة وورد" واحصل على خصم 10%
              </h3>
              <p className="text-xs sm:text-sm text-emerald-100/80">
                كن أول من يعلم عن وصول تشكيلات الزهور الهولندية النادرة وعروض المناسبات الخاصة.
              </p>
            </div>

            <div className="lg:col-span-5">
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="أدخل بريدك الإلكتروني..."
                  className="flex-1 text-xs sm:text-sm px-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white/15"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-rose-500 hover:bg-rose-400 text-white rounded-2xl font-bold text-xs sm:text-sm transition-all shadow-md flex items-center gap-2 active:scale-95 shrink-0"
                >
                  {subscribed ? (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      <span>تم الاشتراك!</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>اشتراك</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* 4-Columns Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-stone-800 text-right">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-800 flex items-center justify-center text-white shadow-md">
                <Sparkles className="w-5 h-5 text-rose-300" />
              </div>
              <div>
                <span className="text-xl font-black text-white font-cairo">
                  باقة <span className="text-rose-400">وورد</span>
                </span>
                <span className="block text-[10px] text-stone-400 font-mono tracking-widest">
                  BAQA & WARD BOUTIQUE
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-stone-400 leading-relaxed max-w-sm">
              بوتيك زهور وهدايا فاخرة بمدينة القنيطرة، المغرب. متخصصون في تنسيق وتوصيل أرقى الزهور الطبيعية والهدايا التذكارية مع خدمة التوصيل السريع لجميع أحياء القنيطرة والمهدية ونواحيها.
            </p>

            <div className="flex items-center gap-3 pt-2 text-stone-400">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-stone-900 hover:bg-rose-600 hover:text-white flex items-center justify-center transition-colors text-xs font-bold"
                aria-label="Instagram"
              >
                IG
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-stone-900 hover:bg-emerald-700 hover:text-white flex items-center justify-center transition-colors text-xs font-bold"
                aria-label="X Twitter"
              >
                𝕏
              </a>
              <a
                href="https://snapchat.com"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-stone-900 hover:bg-amber-500 hover:text-white flex items-center justify-center transition-colors text-xs font-bold"
                aria-label="Snapchat"
              >
                SC
              </a>
              <a
                href="https://tiktok.com"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-stone-900 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-colors text-xs font-bold"
                aria-label="TikTok"
              >
                TT
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white font-cairo">روابط سريعة</h4>
            <ul className="space-y-2 text-xs text-stone-400">
              <li>
                <a href="#hero" className="hover:text-rose-300 transition-colors">الصفحة الرئيسية</a>
              </li>
              <li>
                <a href="#categories" className="hover:text-rose-300 transition-colors">تسوق حسب المناسبة</a>
              </li>
              <li>
                <a href="#products" className="hover:text-rose-300 transition-colors">الأكثر مبيعاً ورواجاً</a>
              </li>
              <li>
                <a href="#offers" className="hover:text-rose-300 transition-colors">عروض الخصم الحصرية</a>
              </li>
              <li>
                <a href="#testimonials" className="hover:text-rose-300 transition-colors">تقييمات وآراء العملاء</a>
              </li>
            </ul>
          </div>

          {/* Customer Service & Policies */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white font-cairo">خدمة العملاء</h4>
            <ul className="space-y-2 text-xs text-stone-400">
              <li>
                <span className="hover:text-stone-200 cursor-pointer">سياسة النضارة والاستبدال</span>
              </li>
              <li>
                <span className="hover:text-stone-200 cursor-pointer">الشحن والتوصيل السريع</span>
              </li>
              <li>
                <span className="hover:text-stone-200 cursor-pointer">دليل العناية بالزهور</span>
              </li>
              <li>
                <span className="hover:text-stone-200 cursor-pointer">الأسئلة الشائعة (FAQ)</span>
              </li>
              <li>
                <span className="hover:text-stone-200 cursor-pointer">الخصوصية والشروط</span>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white font-cairo">تواصل معنا بالقنيطرة</h4>
            <ul className="space-y-2.5 text-xs text-stone-400">
              <li className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <a href="tel:+212611938119" className="hover:text-white dir-ltr">+212 6 11 93 81 19</a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <a href="mailto:contact@baqaward-kenitra.ma" className="hover:text-white">contact@baqaward-kenitra.ma</a>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>المغرب، القنيطرة - شارع محمد الخامس، حي ميموزا</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>يومياً: 8:30 ص - 10:30 ليلاً</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar & Payment Brands */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <p>
            © {new Date().getFullYear()} باقة وورد - القنيطرة (Baqa & Ward Kénitra). جميع الحقوق محفوظة
          </p>

          {/* Payment Badges */}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <span className="text-[11px] text-stone-400 font-medium ml-2">وسائل دفع موثوقة بالمغرب:</span>
            <span className="px-2.5 py-1 bg-stone-900 border border-stone-800 rounded-md text-[10px] font-bold text-emerald-400">
              الدفع عند الاستلام كاش
            </span>
            <span className="px-2.5 py-1 bg-stone-900 border border-stone-800 rounded-md text-[10px] font-bold text-sky-400">
              بطاقة بنكية CMI
            </span>
            <span className="px-2.5 py-1 bg-stone-900 border border-stone-800 rounded-md text-[10px] font-bold text-orange-400">
              CIH Bank
            </span>
            <span className="px-2.5 py-1 bg-stone-900 border border-stone-800 rounded-md text-[10px] font-bold text-yellow-400">
              التجاري وفا بنك
            </span>
            <span className="px-2.5 py-1 bg-stone-900 border border-stone-800 rounded-md text-[10px] font-bold text-blue-400">
              VISA / MasterCard
            </span>
            <span className="px-2.5 py-1 bg-stone-900 border border-stone-800 rounded-md text-[10px] font-bold text-rose-400">
              Cash Plus / وفاكاش
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
