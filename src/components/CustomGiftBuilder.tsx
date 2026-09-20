import React, { useState } from 'react';
import { Mail, Sparkles, Heart, Check, Flower } from 'lucide-react';

interface CustomGiftBuilderProps {
  onApplyGiftCard: (message: string, sender: string) => void;
}

export const CustomGiftBuilder: React.FC<CustomGiftBuilderProps> = ({ onApplyGiftCard }) => {
  const [recipient, setRecipient] = useState('إلى من أضاء قلبي');
  const [message, setMessage] = useState('كل عام وأنتِ النبض والبهجة في حياتي.. دمتِ لي ورداً لا يذبل أبداً.');
  const [sender, setSender] = useState('المحب لك دوماً');
  const [theme, setTheme] = useState<'emerald' | 'rose' | 'black' | 'gold'>('emerald');
  const [isSaved, setIsSaved] = useState(false);

  const presets = [
    { title: 'عيد ميلاد', text: 'كل عام وروحك يملؤها الفرح والزهور، أتمنى لك عاماً مليئاً بالتحقق والمسرات.' },
    { title: 'ذكرى حب', text: 'في كل يوم معك أدرك كم أن الحياة أجمل بجانبك.. أدامك الله لي نبضاً لا ينتهي.' },
    { title: 'شفاء عاجل', text: 'حمداً لله على سلامتك، نسأل الله أن يمن عليك بدوام الصحة والعافية والبهجة.' },
    { title: 'تهنئة ترقية', text: 'مبارك لك هذا الإنجاز المستحق، ومن نجاح إلى نجاح أكبر بإذن الله.' },
  ];

  const handleSave = () => {
    onApplyGiftCard(message, sender);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <section className="py-16 sm:py-20 bg-rose-50/40 border-t border-rose-100/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold mb-3">
            <Mail className="w-3.5 h-3.5" />
            <span>خدمة مجانية مع كل باقة</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-900 font-cairo">
            صمم بطاقة إهدائك الفاخرة
          </h2>
          <p className="mt-2 text-stone-600 text-sm sm:text-base">
            اكتب رسالتك الخاصة وشاهد كيف ستظهر مطبوعة داخل ظرف شمعي فاخر مرفق مع باقتك
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-5xl mx-auto">
          {/* Inputs Column */}
          <div className="lg:col-span-6 bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-4">
            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1.5">
                المهدى إليه (العنوان العلوي):
              </label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full text-xs sm:text-sm p-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800 text-stone-800"
                placeholder="مثال: إلى الغالية أمي"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-stone-700 block">
                  نص الرسالة:
                </label>
                <span className="text-[11px] text-stone-400">نماذج سريعة:</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {presets.map((preset) => (
                  <button
                    key={preset.title}
                    type="button"
                    onClick={() => setMessage(preset.text)}
                    className="text-[10px] px-2.5 py-1 bg-stone-100 hover:bg-rose-50 text-stone-700 hover:text-rose-700 rounded-lg transition-colors font-medium"
                  >
                    {preset.title}
                  </button>
                ))}
              </div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                className="w-full text-xs sm:text-sm p-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800 text-stone-800 resize-none"
                placeholder="اكتب كلماتك العذبة..."
              />
            </div>

            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1.5">
                اسم المُهدي (المرسل):
              </label>
              <input
                type="text"
                value={sender}
                onChange={(e) => setSender(e.target.value)}
                className="w-full text-xs sm:text-sm p-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800 text-stone-800"
                placeholder="مثال: فيصل أو (فاعل خير)"
              />
            </div>

            {/* Card style selection */}
            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1.5">
                طابع البطاقة والظرف:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'emerald', label: 'زمردي ملكي', bg: 'bg-emerald-900 text-white' },
                  { id: 'rose', label: 'وردي هادئ', bg: 'bg-rose-100 text-rose-900 border border-rose-300' },
                  { id: 'gold', label: 'ذهبي كلاسيكي', bg: 'bg-amber-100 text-amber-900 border border-amber-300' },
                  { id: 'black', label: 'أسود فاخر', bg: 'bg-stone-900 text-white' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTheme(item.id as any)}
                    className={`py-2 px-1 text-[11px] font-bold rounded-xl text-center transition-all ${item.bg} ${
                      theme === item.id ? 'ring-2 ring-emerald-800 ring-offset-2 scale-102' : 'opacity-80 hover:opacity-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSave}
              className={`w-full py-3 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-2 ${
                isSaved ? 'bg-emerald-600 text-white' : 'bg-emerald-900 hover:bg-emerald-800 text-white'
              }`}
            >
              {isSaved ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>تم حفظ البطاقة مع الطلب!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-rose-300" />
                  <span>اعتماد وإرفاق البطاقة بالسلة</span>
                </>
              )}
            </button>
          </div>

          {/* Interactive Live Preview Column */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="w-full max-w-sm">
              <div className="text-center text-xs font-bold text-stone-500 mb-3 flex items-center justify-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                <span>معاينة حية لشكل البطاقة عند الطباعة</span>
              </div>

              {/* Physical Greeting Card Mockup */}
              <div
                className={`relative rounded-3xl p-8 shadow-xl transition-all duration-300 min-h-[320px] flex flex-col justify-between border ${
                  theme === 'emerald'
                    ? 'bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950 text-white border-emerald-700/60'
                    : theme === 'rose'
                    ? 'bg-gradient-to-br from-rose-50 via-pink-50 to-rose-100 text-stone-900 border-rose-200'
                    : theme === 'gold'
                    ? 'bg-gradient-to-br from-amber-50 via-stone-100 to-amber-100 text-amber-950 border-amber-300'
                    : 'bg-gradient-to-br from-stone-950 via-stone-900 to-black text-white border-stone-700'
                }`}
              >
                {/* Gold foil border inner */}
                <div className="absolute inset-3 border border-amber-400/40 rounded-2xl pointer-events-none" />

                <div>
                  {/* Card Brand Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-amber-400/20">
                    <span className="text-[11px] font-mono tracking-widest text-amber-400 uppercase">
                      Baqa & Ward
                    </span>
                    <Flower className="w-4 h-4 text-amber-400" />
                  </div>

                  {/* Recipient */}
                  <div className="mt-4">
                    <span className="text-xs text-amber-400/80 block font-light">إلى:</span>
                    <h3 className="text-base font-extrabold mt-0.5 font-cairo">
                      {recipient || 'اسم المهدى إليه'}
                    </h3>
                  </div>

                  {/* Card Message Body */}
                  <div className="mt-4">
                    <p className="text-xs sm:text-sm leading-relaxed font-normal italic opacity-95">
                      "{message || 'اكتب رسالتك الخاصة هنا لتظهر في هذا المكان الأنيق...'}"
                    </p>
                  </div>
                </div>

                {/* Sender Footer with Wax Seal Icon */}
                <div className="mt-6 pt-4 border-t border-amber-400/20 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-amber-400/80 block">مع كل المحبة من:</span>
                    <span className="text-xs font-bold">{sender || 'اسمك أو فاعل خير'}</span>
                  </div>

                  {/* Simulated Wax Seal Stamp */}
                  <div className="w-8 h-8 rounded-full bg-rose-600 border border-amber-300 flex items-center justify-center text-amber-200 shadow-md transform rotate-12">
                    <Heart className="w-4 h-4 fill-current" />
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
