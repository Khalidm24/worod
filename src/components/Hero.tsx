import React from 'react';
import { ArrowLeft, Sparkles, Clock, ShieldCheck, HeartHandshake } from 'lucide-react';

interface HeroProps {
  onShopClick: () => void;
  onExploreOffers: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onShopClick, onExploreOffers }) => {
  return (
    <section id="hero" className="relative overflow-hidden bg-gradient-to-b from-rose-50/50 via-white to-stone-50/50 py-12 lg:py-20">
      {/* Decorative ambient gradients */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-rose-200/30 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-emerald-100/40 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Text and Actions Column */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8 text-center lg:text-right">
            {/* Tagline pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-100/70 text-rose-800 border border-rose-200/60 shadow-xs">
              <Sparkles className="w-4 h-4 text-rose-600" />
              <span className="text-xs sm:text-sm font-semibold">
                زهور طبيعية هولندية طازجة يومياً
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-stone-900 tracking-tight leading-[1.25] sm:leading-[1.2] font-cairo">
              نُوصّل مشاعرك <br className="hidden sm:inline" />
              <span className="bg-gradient-to-l from-rose-600 via-rose-700 to-emerald-900 bg-clip-text text-transparent">
                بأجمل وأرقى الورود
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg lg:text-xl text-stone-600 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-normal">
              في متجر <strong className="font-semibold text-emerald-900">باقة وورد بالقنيطرة</strong> نعتني بكل بتلة لتصل هديتك مفعمة بالحب والبهجة. تصاميم حصرية وتوصيل فوري خلال ساعتين لكافة أحياء القنيطرة والمهدية ونواحيها.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <button
                id="hero-cta-shop"
                onClick={onShopClick}
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-emerald-900 hover:bg-emerald-800 active:scale-95 text-white font-bold text-base sm:text-lg shadow-lg shadow-emerald-900/15 hover:shadow-emerald-900/25 transition-all duration-300 flex items-center justify-center gap-3 group"
              >
                <span>تسوق الباقات الآن</span>
                <ArrowLeft className="w-5 h-5 text-rose-300 transition-transform group-hover:-translate-x-1" />
              </button>

              <button
                id="hero-cta-offers"
                onClick={onExploreOffers}
                className="w-full sm:w-auto px-7 py-4 rounded-full bg-white hover:bg-rose-50 text-stone-800 hover:text-emerald-900 font-bold text-base sm:text-lg border border-stone-200 hover:border-rose-300 shadow-sm transition-all duration-200 flex items-center justify-center gap-2"
              >
                <span>عروض وخصومات الموسم</span>
                <span className="text-xs bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-bold">20%-</span>
              </button>
            </div>

            {/* Trust Mini Badges */}
            <div className="pt-6 border-t border-stone-200/60 grid grid-cols-3 gap-4 max-w-lg mx-auto lg:mx-0">
              <div className="flex flex-col items-center lg:items-start">
                <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-sm sm:text-base">
                  <Clock className="w-4 h-4 text-emerald-700" />
                  <span>خلال ساعتين</span>
                </div>
                <span className="text-xs text-stone-500 mt-0.5">توصيل بالقنيطرة ونواحيها</span>
              </div>

              <div className="flex flex-col items-center lg:items-start">
                <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-sm sm:text-base">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>ضمان النضارة</span>
                </div>
                <span className="text-xs text-stone-500 mt-0.5">تدوم طازجة لأسبوعين</span>
              </div>

              <div className="flex flex-col items-center lg:items-start">
                <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-sm sm:text-base">
                  <HeartHandshake className="w-4 h-4 text-emerald-700" />
                  <span>+5,000</span>
                </div>
                <span className="text-xs text-stone-500 mt-0.5">زبون سعيد بالقنيطرة</span>
              </div>
            </div>
          </div>

          {/* Hero Visual Imagery Column */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Decorative Frame */}
              <div className="absolute inset-0 bg-gradient-to-tr from-rose-200 to-emerald-200 rounded-3xl transform rotate-2 scale-102 opacity-70 blur-xs"></div>

              {/* Main Bouquet Visual */}
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-white group">
                <img
                  src="https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=1000&q=85"
                  alt="باقة همس الياسمين الفاخرة - باقة وورد القنيطرة"
                  className="w-full h-[400px] sm:h-[480px] object-cover object-center group-hover:scale-105 transition-transform duration-700"
                  loading="eager"
                />

                {/* Floating Product Badge */}
                <div className="absolute bottom-5 right-5 left-5 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-rose-100/80 shadow-lg flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-rose-600 block">الباقة الأكثر طلباً هذا الأسبوع</span>
                    <h2 className="text-sm sm:text-base font-bold text-stone-900 mt-0.5">باقة همس الياسمين الملكية</h2>
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-stone-500">
                      <span className="text-amber-500 font-bold">★ 4.9</span>
                      <span>(128 تقييم حقيقي)</span>
                    </div>
                  </div>
                  <div className="text-left">
                    <span className="text-lg font-black text-emerald-900 font-cairo">380 درهم</span>
                    <span className="block text-[11px] text-stone-400 line-through">450 درهم</span>
                  </div>
                </div>

                {/* Top Corner Badge */}
                <div className="absolute top-4 right-4 bg-emerald-900/90 backdrop-blur-sm text-white text-xs font-bold px-3.5 py-1.5 rounded-full shadow-md">
                  ✨ الأكثر مبيعاً
                </div>
              </div>

              {/* Floating review card */}
              <div className="hidden sm:flex absolute -bottom-6 -left-6 bg-white p-3.5 rounded-2xl shadow-xl border border-stone-100 items-center gap-3 z-10 max-w-xs animate-float">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
                  alt="نادية المرابطي"
                  className="w-10 h-10 rounded-full object-cover border-2 border-rose-200"
                />
                <div className="text-right">
                  <div className="flex items-center gap-1 text-[11px] text-amber-500">★★★★★</div>
                  <p className="text-xs font-semibold text-stone-800 line-clamp-1">"الورد وصل فريش وفاق التوقعات!"</p>
                  <span className="text-[10px] text-stone-400">نادية • القنيطرة (ميموزا)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
