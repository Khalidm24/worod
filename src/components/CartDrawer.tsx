import React, { useState } from 'react';
import { CartItem } from '../types';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowLeft, Tag, Truck, ShieldCheck } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onProceedToCheckout: () => void;
  promoCode: string;
  onApplyPromoCode: (code: string) => boolean;
  discountRate: number;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
  promoCode,
  onApplyPromoCode,
  discountRate,
}) => {
  const [couponInput, setCouponInput] = useState(promoCode || '');
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState(discountRate > 0);

  if (!isOpen) return null;

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const discountAmount = subtotal * discountRate;
  const shippingFee = subtotal >= 250 || subtotal === 0 ? 0 : 20;
  const total = Math.max(0, subtotal - discountAmount + shippingFee);

  const freeShippingThreshold = 250;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const progressPercent = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    if (!couponInput.trim()) return;

    const ok = onApplyPromoCode(couponInput.trim().toUpperCase());
    if (ok) {
      setCouponSuccess(true);
      setCouponError('');
    } else {
      setCouponSuccess(false);
      setCouponError('كود الخصم غير صالح أو منتهي الصلاحية');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-stone-900/60 backdrop-blur-xs flex justify-end animate-fadeIn">
      {/* Backdrop Click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer Body */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-slideLeft">
        {/* Header */}
        <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-emerald-900 text-white flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-rose-200" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-stone-900 font-cairo">سلة المشتريات</h2>
              <span className="text-xs text-stone-500">
                {items.length} {items.length === 1 ? 'باقة مختارة' : 'باقات مختارة'}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-stone-200/70 text-stone-500 hover:text-stone-800 transition-colors"
            aria-label="إغلاق السلة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Shipping Progress Indicator */}
        <div className="px-5 py-3 bg-rose-50/70 border-b border-rose-100/70">
          <div className="flex items-center justify-between text-xs font-semibold mb-1.5 text-stone-800">
            <span className="flex items-center gap-1 text-emerald-900">
              <Truck className="w-3.5 h-3.5" />
              {remainingForFreeShipping === 0 ? (
                <strong className="text-emerald-800">تهانينا! حصلت على توصيل مجاني داخل القنيطرة 🎉</strong>
              ) : (
                <span>أضف <strong className="text-rose-600 font-bold">{remainingForFreeShipping} درهم</strong> للشحن المجاني بالقنيطرة</span>
              )}
            </span>
            <span className="text-stone-500 text-[11px]">{progressPercent}%</span>
          </div>
          <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-rose-400 to-emerald-700 transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-5 divide-y divide-stone-100 space-y-4">
          {items.length === 0 ? (
            <div className="py-16 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-400 flex items-center justify-center mx-auto">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-stone-800">سلتك لا تزال فارغة</h3>
              <p className="text-xs text-stone-500 max-w-xs mx-auto">
                استكشف مجموعتنا الرائعة من الزهور الطبيعية واختر الباقة التي تعبر عن مشاعرك
              </p>
              <button
                onClick={onClose}
                className="mt-2 px-6 py-2.5 rounded-full bg-emerald-900 text-white text-xs font-bold hover:bg-emerald-800 transition-colors"
              >
                تصفح الباقات الآن
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.product.id} className="pt-4 first:pt-0 flex gap-3.5">
                {/* Thumbnail */}
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="w-20 h-20 rounded-2xl object-cover border border-stone-200"
                />

                {/* Info */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-stone-900 font-cairo line-clamp-1">
                        {item.product.name}
                      </h4>
                      <button
                        onClick={() => onRemoveItem(item.product.id)}
                        className="text-stone-400 hover:text-rose-600 transition-colors p-1"
                        title="حذف من السلة"
                        aria-label="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {item.selectedRibbon && (
                      <span className="text-[10px] text-stone-500 block mt-0.5">
                        شريط: {item.selectedRibbon}
                      </span>
                    )}
                    {item.cardMessage && (
                      <span className="text-[10px] text-emerald-800 block mt-0.5 font-medium line-clamp-1">
                        ✉️ رسالة: "{item.cardMessage}"
                      </span>
                    )}
                  </div>

                  {/* Quantity and Line Total */}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center border border-stone-200 rounded-full px-2 py-0.5 bg-stone-50">
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                        className="w-5 h-5 text-stone-600 hover:text-stone-900 font-bold text-xs flex items-center justify-center"
                        aria-label="تقليل"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-bold text-stone-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                        className="w-5 h-5 text-stone-600 hover:text-stone-900 font-bold text-xs flex items-center justify-center"
                        aria-label="زيادة"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="text-left font-cairo">
                      <span className="text-sm font-bold text-emerald-900">
                        {item.product.price * item.quantity} درهم
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer & Checkout Action */}
        {items.length > 0 && (
          <div className="p-5 border-t border-stone-200 bg-stone-50/50 space-y-3.5">
            {/* Promo code input */}
            <form onSubmit={handleApplyCoupon} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder="كود الخصم (مثال: WARD20)"
                  className="w-full text-xs py-2 px-3 pl-8 bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-800 text-stone-800"
                />
                <Tag className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white rounded-xl text-xs font-bold transition-colors"
              >
                تطبيق
              </button>
            </form>

            {couponError && <p className="text-[11px] text-rose-600">{couponError}</p>}
            {couponSuccess && (
              <p className="text-[11px] text-emerald-700 font-bold">
                ✓ تم تطبيق خصم 20% بنجاح!
              </p>
            )}

            {/* Price Calculations */}
            <div className="space-y-1.5 text-xs text-stone-600 pt-2 border-t border-stone-200/70">
              <div className="flex justify-between">
                <span>المجموع الفرعي:</span>
                <span className="font-bold text-stone-800">{subtotal} درهم</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-rose-600 font-semibold">
                  <span>خصم كود (WARD20):</span>
                  <span>-{Math.round(discountAmount)} درهم</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>توصيل داخل القنيطرة:</span>
                <span>{shippingFee === 0 ? <strong className="text-emerald-700">مجاني</strong> : `${shippingFee} درهم`}</span>
              </div>

              <div className="flex justify-between text-sm sm:text-base font-black text-stone-900 pt-2 border-t border-stone-200">
                <span>الإجمالي النهائي:</span>
                <span className="text-emerald-900 font-cairo">{Math.round(total)} درهم</span>
              </div>
              <p className="text-[10px] text-stone-400 text-center">الأسعار تشمل التوصيل والضريبة</p>
            </div>

            {/* Checkout Button */}
            <button
              onClick={() => {
                onClose();
                onProceedToCheckout();
              }}
              className="w-full py-3.5 rounded-full bg-emerald-900 hover:bg-emerald-800 active:scale-98 text-white font-bold text-sm shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center gap-2 group"
            >
              <span>متابعة إتمام الطلب</span>
              <ArrowLeft className="w-4 h-4 text-rose-300 transition-transform group-hover:-translate-x-1" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
