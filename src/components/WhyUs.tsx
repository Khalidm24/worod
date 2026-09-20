import React from 'react';
import { Flower2, Truck, MailOpen, ShieldCheck, HeartHandshake, Sparkles } from 'lucide-react';

export const WhyUs: React.FC = () => {
  const features = [
    {
      icon: Flower2,
      title: 'زهور طبيعية 100% طازجة',
      description: 'نستورد زهورنا يومياً من أرقى مزارع هولندا والإكوادور ونضمن نضارتها لمدة أسبوعين مع المحلول المرفق.',
      color: 'text-emerald-800 bg-emerald-50 border-emerald-100',
    },
    {
      icon: Truck,
      title: 'توصيل فوري داخل القنيطرة',
      description: 'خدمة توصيل سريعة ومتقنة تغطي جميع أحياء القنيطرة والمهدية ونواحيها في أقل من ساعتين مع عناية فائقة بسلامة الزهور.',
      color: 'text-rose-700 bg-rose-50 border-rose-100',
    },
    {
      icon: MailOpen,
      title: 'بطاقة إهداء مخصصة مجاناً',
      description: 'نطبع كلماتك بخطوط عربية فاخرة داخل ظرف شمعي أنيق ومختوم لتعبر عن مشاعرك بكل خصوصية ورقي.',
      color: 'text-emerald-800 bg-emerald-50 border-emerald-100',
    },
    {
      icon: ShieldCheck,
      title: 'دفع آمن ومرن بالمغرب',
      description: 'خيارات دفع مريحة تشمل الدفع عند الاستلام كاش، البطاقة البنكية المغربية (CMI)، والتحويل البنكي المباشر.',
      color: 'text-rose-700 bg-rose-50 border-rose-100',
    },
  ];

  return (
    <section className="py-16 sm:py-20 bg-stone-50/60 border-t border-stone-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/70 text-emerald-900 text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>تجربة هدايا لا تُنسى</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-900 font-cairo">
            لماذا تختار "باقة وورد"؟
          </h2>
          <p className="mt-2 text-stone-600 text-sm sm:text-base">
            لأننا نؤمن أن كل باقة تحمل مشاعر حقيقية تستحق الكمال في كل تفصيلة
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="bg-white p-6 rounded-3xl border border-stone-200/80 hover:border-emerald-800/40 hover:shadow-xl transition-all duration-300 group"
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 border ${feat.color} group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-stone-900 mb-2 font-cairo group-hover:text-emerald-900 transition-colors">
                  {feat.title}
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                  {feat.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
