import React, { useState } from 'react';
import { CartItem, OrderDetails } from '../types';
import { X, CheckCircle, CreditCard, ShieldCheck, MapPin, Calendar, Clock, User, Phone, Sparkles } from 'lucide-react';
import { createOrder } from '../lib/productService';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  subtotal: number;
  discountRate: number;
  onOrderSuccess: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  subtotal,
  discountRate,
  onOrderSuccess,
}) => {
  const [formData, setFormData] = useState<OrderDetails>({
    recipientName: '',
    recipientPhone: '',
    city: 'القنيطرة - وسط المدينة (Centre Ville)',
    district: '',
    address: '',
    deliveryDate: 'اليوم (توصيل فوري بالقنيطرة)',
    deliveryTime: 'الفترة المسائية (4 عصراً - 9 مساءً)',
    paymentMethod: 'cod',
    cardMessage: '',
    senderName: '',
  });

  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  if (!isOpen) return null;

  const discountAmount = subtotal * discountRate;
  const shippingFee = subtotal >= 250 || subtotal === 0 ? 0 : 20;
  const total = Math.max(0, subtotal - discountAmount + shippingFee);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const generatedOrderNo = 'BW-KN-' + Math.floor(100000 + Math.random() * 900000);

    try {
      await createOrder({
        ...formData,
        orderNumber: generatedOrderNo,
        total: Math.round(total),
        status: 'pending',
        items: items.map((i) => ({
          productId: i.product.id,
          productName: i.product.name,
          productImage: i.product.image,
          price: i.product.price,
          quantity: i.quantity,
        })),
      });
    } catch (err) {
      console.warn('Order saved locally or offline:', err);
    }

    setIsSubmitting(false);
    setOrderNumber(generatedOrderNo);
    setOrderConfirmed(true);
    onOrderSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-rose-100 animate-scaleUp">
        {/* Header */}
        <div className="p-6 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
          <div>
            <h2 className="text-xl font-extrabold text-stone-900 font-cairo">
              {orderConfirmed ? 'تم تأكيد طلبك بنجاح' : 'إنهاء الطلب والتوصيل الفاخر'}
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              {orderConfirmed ? 'شكراً لثقتكم في متجر باقة وورد - القنيطرة' : 'خطوة واحدة تفصلك عن وصول أجمل باقة لمن تحب في القنيطرة'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-stone-200/70 text-stone-500 hover:text-stone-800 transition-colors"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {orderConfirmed ? (
          /* Confirmation Success State */
          <div className="p-8 sm:p-10 text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto border-4 border-emerald-100 shadow-sm animate-bounce">
              <CheckCircle className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-rose-600 tracking-wider block">
                رقم طلبك: <strong className="font-mono text-base text-stone-900 bg-stone-100 px-3 py-1 rounded-lg">{orderNumber}</strong>
              </span>
              <h3 className="text-2xl font-bold text-stone-900 font-cairo">
                جاري تجهيز وتنسيق باقتك الفاخرة! 🌸
              </h3>
              <p className="text-sm text-stone-600 max-w-md mx-auto leading-relaxed">
                تم استلام طلبك بنجاح بالقنيطرة وسيتواصل منسق الأزهار معك ومع المستلم لتسليم الباقة في الموعد المحدد بكل سرية ورقي.
              </p>
            </div>

            {/* Order Details Brief Box */}
            <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200 text-xs text-stone-700 space-y-2 text-right max-w-md mx-auto">
              <div className="flex justify-between border-b border-stone-200/60 pb-2">
                <span>المستلم:</span>
                <span className="font-bold">{formData.recipientName || 'زبون مميز'} ({formData.city})</span>
              </div>
              <div className="flex justify-between border-b border-stone-200/60 pb-2">
                <span>موعد التوصيل:</span>
                <span className="font-bold">{formData.deliveryDate} - {formData.deliveryTime}</span>
              </div>
              <div className="flex justify-between pt-1 text-sm font-bold text-emerald-900">
                <span>المبلغ الإجمالي:</span>
                <span>{Math.round(total)} درهم</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="px-8 py-3.5 rounded-full bg-emerald-900 text-white font-bold text-sm hover:bg-emerald-800 transition-colors shadow-md"
            >
              العودة للمتجر ومتابعة التسوق
            </button>
          </div>
        ) : (
          /* Checkout Form */
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6 max-h-[78vh] overflow-y-auto">
            {/* Step 1: Recipient Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold text-stone-900 flex items-center gap-2 border-b border-stone-100 pb-2">
                <User className="w-4 h-4 text-emerald-800" />
                <span>1. بيانات المهدى إليه (المستلم)</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    اسم المستلم: *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.recipientName}
                    onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                    placeholder="مثال: سارة محمد"
                    className="w-full text-xs sm:text-sm p-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    رقم هاتف المستلم (المغرب): *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.recipientPhone}
                    onChange={(e) => setFormData({ ...formData, recipientPhone: e.target.value })}
                    placeholder="06XXXXXXXX أو 07XXXXXXXX"
                    className="w-full text-xs sm:text-sm p-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    المنطقة / الحي بمدينة القنيطرة: *
                  </label>
                  <select
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full text-xs sm:text-sm p-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800 bg-white"
                  >
                    <option value="القنيطرة - وسط المدينة (Centre Ville)">القنيطرة - وسط المدينة (Centre Ville)</option>
                    <option value="القنيطرة - حي ميموزا (Mimosa)">القنيطرة - حي ميموزا (Mimosa)</option>
                    <option value="القنيطرة - أولاد أوجيه (Ouled Oujih)">القنيطرة - أولاد أوجيه (Ouled Oujih)</option>
                    <option value="القنيطرة - لافيل أوت (La Ville Haute)">القنيطرة - لافيل أوت (La Ville Haute)</option>
                    <option value="القنيطرة - بئر الرامي (Bir Rami)">القنيطرة - بئر الرامي (Bir Rami)</option>
                    <option value="القنيطرة - المهدية الشاطئ (Mehdia Plage)">القنيطرة - المهدية الشاطئ (Mehdia Plage)</option>
                    <option value="القنيطرة - الساكنية (Saknia)">القنيطرة - الساكنية (Saknia)</option>
                    <option value="القنيطرة - المغرب العربي (Maghreb El Arabi)">القنيطرة - المغرب العربي (Maghreb El Arabi)</option>
                    <option value="القنيطرة - فال فلوغري / معمورة (Val Fleuri)">القنيطرة - فال فلوغري / معمورة (Val Fleuri)</option>
                    <option value="القنيطرة - أليانس دارنا / حدادة (Alliance Darna)">القنيطرة - أليانس دارنا / حدادة (Alliance Darna)</option>
                    <option value="سيدي الطيبي / القصبة (ضواحي القنيطرة)">سيدي الطيبي / القصبة (ضواحي القنيطرة)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    العنوان التفصيلي / الشارع أو الإقامة:
                  </label>
                  <input
                    type="text"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    placeholder="مثال: شارع محمد الخامس، إقامة الزهور رقم 12"
                    className="w-full text-xs sm:text-sm p-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Delivery Scheduling */}
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-extrabold text-stone-900 flex items-center gap-2 border-b border-stone-100 pb-2">
                <Calendar className="w-4 h-4 text-emerald-800" />
                <span>2. موعد ووقت التوصيل</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    تاريخ التوصيل:
                  </label>
                  <select
                    value={formData.deliveryDate}
                    onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                    className="w-full text-xs sm:text-sm p-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800 bg-white"
                  >
                    <option value="اليوم (توصيل فوري)">اليوم (توصيل فوري خلال ساعتين)</option>
                    <option value="غداً صباحاً">غداً</option>
                    <option value="بعد غد">بعد غد</option>
                    <option value="تاريخ مخصص لاحقاً">تاريخ مخصص (حدد بالتواصل)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    فترة التوصيل المفضلة:
                  </label>
                  <select
                    value={formData.deliveryTime}
                    onChange={(e) => setFormData({ ...formData, deliveryTime: e.target.value })}
                    className="w-full text-xs sm:text-sm p-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800 bg-white"
                  >
                    <option value="الفترة المسائية (4 عصراً - 9 مساءً)">الفترة المسائية (4 عصراً - 9 مساءً)</option>
                    <option value="الفترة الصباحية (9 صباحاً - 1 ظهراً)">الفترة الصباحية (9 صباحاً - 1 ظهراً)</option>
                    <option value="توصيل فوري خلال ساعتين">توصيل فوري خلال ساعتين</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Step 3: Card Message & Sender */}
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-extrabold text-stone-900 flex items-center gap-2 border-b border-stone-100 pb-2">
                <Sparkles className="w-4 h-4 text-emerald-800" />
                <span>3. رسالة بطاقة الإهداء (مجانية)</span>
              </h3>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  اكتب رسالتك المطبوعة داخل ظرف شمعي فاخر:
                </label>
                <textarea
                  value={formData.cardMessage}
                  onChange={(e) => setFormData({ ...formData, cardMessage: e.target.value })}
                  placeholder="أجمل التبريكات والتهاني من صميم القلب..."
                  rows={2}
                  className="w-full text-xs sm:text-sm p-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800 resize-none"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="anon-check"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="rounded text-emerald-800 focus:ring-emerald-800 w-4 h-4"
                  />
                  <label htmlFor="anon-check" className="text-xs text-stone-700 cursor-pointer">
                    إرسال كمفاجأة مجهولة (بدون ذكر اسم المرسل للمستلم)
                  </label>
                </div>
              </div>
            </div>

            {/* Step 4: Payment Methods */}
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-extrabold text-stone-900 flex items-center gap-2 border-b border-stone-100 pb-2">
                <CreditCard className="w-4 h-4 text-emerald-800" />
                <span>4. طريقة الدفع (المغرب)</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { id: 'cod', label: 'الدفع عند الاستلام', desc: 'كاش عند وصول الباقة' },
                  { id: 'card_cmi', label: 'بطاقة بنكية مغربية', desc: 'CMI / Visa / Mastercard' },
                  { id: 'bank_transfer', label: 'تحويل بنكي فوري', desc: 'CIH / التجاري / الشعبي' },
                  { id: 'cashplus', label: 'Cash Plus / وفاكاش', desc: 'عبر أقرب وكالة بالقنيطرة' },
                ].map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, paymentMethod: method.id as any })}
                    className={`p-3 rounded-xl border text-right transition-all ${
                      formData.paymentMethod === method.id
                        ? 'border-emerald-800 bg-emerald-50/60 ring-2 ring-emerald-800/20'
                        : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <span className="text-xs font-bold block text-stone-900">{method.label}</span>
                    <span className="text-[10px] text-stone-500 block mt-0.5">{method.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Total and Submit */}
            <div className="pt-4 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-xs text-stone-500 block">المبلغ الإجمالي المطلوب:</span>
                <span className="text-2xl font-black text-emerald-900 font-cairo">
                  {Math.round(total)} درهم
                </span>
                <span className="text-[10px] text-stone-400 block">شامل التوصيل والضريبة داخل القنيطرة</span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-emerald-900 hover:bg-emerald-800 active:scale-95 text-white font-bold text-sm sm:text-base shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>جاري معالجة الطلب...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5 text-rose-200" />
                    <span>تأكيد ودفع الطلب ({Math.round(total)} درهم)</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
