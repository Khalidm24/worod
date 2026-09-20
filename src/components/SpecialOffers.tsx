import React, { useState } from 'react';
import { Tag, Copy, Check, Clock, Sparkles, ArrowLeft } from 'lucide-react';

interface SpecialOffersProps {
  onShopOffers: () => void;
}

export const SpecialOffers: React.FC<SpecialOffersProps> = ({ onShopOffers }) => {
  const [copied, setCopied] = useState(false);
  const couponCode = 'WARD20';

  const copyCoupon = () => {
    navigator.clipboard.writeText(couponCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="offers" className="py-16 sm:py-20 bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-white relative overflow-hidden">
      {/* Decorative patterns */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/15 rounded-3xl p-8 sm:p-12 lg:p-14 backdrop-blur-xl shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-right">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/20 text-rose-200 border border-rose-400/30 text-xs sm:text-sm font-bold">
                <Sparkles className="w-4 h-4 text-rose-300" />
                <span>عرض حصري لفترة محدودة</span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white font-cairo leading-tight">
                خصم <span className="text-rose-300">20%</span> على كافة باقات المناسبات
              </h2>

              <p className="text-emerald-100 text-sm sm:text-base leading-relaxed max-w-xl mx-auto lg:mx-0">
                استمتع بتنسيقاتنا الفاخرة للورود الهولندية والإكوادورية مع بطاقة إهداء مذهبة مجانية وتوصيل مجاني داخل القنيطرة للطلبات فوق 250 درهم.
              </p>

              {/* Coupon Box */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
                <div className="flex items-center bg-white/10 border border-white/25 rounded-2xl p-1.5 px-4 gap-3 w-full sm:w-auto justify-between">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-rose-300" />
                    <span className="text-xs text-emerald-200">كود الخصم:</span>
                    <span className="font-mono text-lg font-black text-white tracking-widest">
                      {couponCode}
                    </span>
                  </div>

                  <button
                    onClick={copyCoupon}
                    className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors flex items-center gap-1.5 text-xs font-bold"
                    title="نسخ الكود"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-300" />
                        <span className="text-emerald-300">تم النسخ</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-rose-200" />
                        <span>نسخ</span>
                      </>
                    )}
                  </button>
                </div>

                <button
                  onClick={onShopOffers}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-rose-500 hover:bg-rose-400 active:scale-95 text-white font-bold text-sm shadow-lg shadow-rose-900/40 transition-all flex items-center justify-center gap-2 group"
                >
                  <span>استفد من العرض الآن</span>
                  <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                </button>
              </div>
            </div>

            {/* Right Visual Card */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 bg-stone-900/40 group">
                <img
                  src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=700&q=80"
                  alt="صندوق الورد الأحمر الفاخر"
                  className="w-full h-72 sm:h-80 object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent flex flex-col justify-end p-6">
                  <span className="text-xs font-bold text-rose-300">أكثر من 300+ باقة مشمولة بالعرض</span>
                  <h3 className="text-lg font-bold text-white font-cairo">تغليف كوري ومخملي ملكي مجاني</h3>
                  <div className="flex items-center gap-2 mt-2 text-xs text-emerald-200">
                    <Clock className="w-3.5 h-3.5 text-rose-300" />
                    <span>صالح حتى نهاية هذا الأسبوع</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
