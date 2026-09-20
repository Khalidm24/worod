import React from 'react';
import { TESTIMONIALS } from '../data/flowerData';
import { Star, CheckCircle, Quote, Sparkles } from 'lucide-react';

export const Testimonials: React.FC = () => {
  return (
    <section id="testimonials" className="py-16 sm:py-24 bg-white border-t border-stone-200/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100/80 text-rose-800 text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>ثقة ومصداقية</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-stone-900 font-cairo">
            ماذا يقول عملاؤنا عنا؟
          </h2>
          <p className="mt-3 text-stone-600 text-sm sm:text-base">
            أكثر من 15,000 عميل شاركونا ذكرياتهم السعيدة وعبروا عن مشاعرهم بأزهارنا الفاخرة
          </p>
        </div>

        {/* Testimonials Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.id}
              className="bg-stone-50/80 hover:bg-white rounded-3xl p-6 border border-stone-200/80 hover:border-rose-200 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Quote Icon & Rating */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1 text-amber-500">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <Quote className="w-6 h-6 text-rose-300/60" />
                </div>

                {/* Comment Text */}
                <p className="text-xs sm:text-sm text-stone-700 leading-relaxed italic">
                  "{t.comment}"
                </p>
              </div>

              {/* Author Info */}
              <div className="mt-6 pt-4 border-t border-stone-200/60 flex items-center gap-3">
                <img
                  src={t.avatar}
                  alt={t.name}
                  className="w-11 h-11 rounded-full object-cover border-2 border-emerald-800/30"
                />
                <div>
                  <div className="flex items-center gap-1">
                    <h3 className="text-xs sm:text-sm font-bold text-stone-900">{t.name}</h3>
                    {t.verified && (
                      <span title="مشتري موثق">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-stone-500 block">{t.city}</span>
                  <span className="text-[10px] text-emerald-800 font-semibold block mt-0.5">
                    الطلب: {t.boughtProduct}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
