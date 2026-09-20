import React, { useState } from 'react';
import { Product } from '../types';
import { X, Star, ShoppingBag, Truck, ShieldCheck, Heart, Sparkles, Check } from 'lucide-react';

interface QuickViewModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number, customMessage?: string, ribbonColor?: string) => void;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({
  product,
  onClose,
  onAddToCart,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedRibbon, setSelectedRibbon] = useState('أخضر زمردي');
  const [cardMessage, setCardMessage] = useState('');
  const [senderName, setSenderName] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!product) return null;

  const ribbonColors = [
    { name: 'أخضر زمردي', color: 'bg-emerald-900', border: 'border-emerald-700' },
    { name: 'وردي هادئ', color: 'bg-rose-300', border: 'border-rose-400' },
    { name: 'عاجي لؤلؤي', color: 'bg-stone-200', border: 'border-stone-400' },
    { name: 'أحمر كلاسيكي', color: 'bg-red-700', border: 'border-red-800' },
  ];

  const handleAdd = () => {
    onAddToCart(product, quantity, cardMessage, selectedRibbon);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div
        className="relative bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden border border-rose-100 animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 z-20 p-2.5 rounded-full bg-white/90 hover:bg-white text-stone-600 hover:text-stone-900 shadow-md transition-colors"
          aria-label="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-12 max-h-[85vh] overflow-y-auto">
          {/* Product Image Column */}
          <div className="md:col-span-6 bg-stone-100 relative min-h-[300px] md:min-h-[460px]">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover object-center"
            />
            {product.tag && (
              <span className="absolute top-4 right-4 bg-emerald-900 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
                {product.tag}
              </span>
            )}
          </div>

          {/* Product Details & Customization Column */}
          <div className="md:col-span-6 p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div>
              {/* Category & Rating */}
              <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
                <span className="font-bold text-rose-600 tracking-wide">
                  {product.categoryLabel}
                </span>
                <div className="flex items-center gap-1 text-amber-500 font-bold">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>{product.rating}</span>
                  <span className="text-stone-400 font-normal">({product.reviewsCount} تقييم حقيقي)</span>
                </div>
              </div>

              {/* Title */}
              <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-cairo">
                {product.name}
              </h2>
              <p className="text-xs text-stone-400 font-mono mt-0.5">{product.nameEn}</p>

              {/* Price */}
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-emerald-900 font-cairo">
                  {product.price} درهم
                </span>
                {product.originalPrice && (
                  <span className="text-sm text-stone-400 line-through">
                    {product.originalPrice} درهم
                  </span>
                )}
                <span className="text-xs text-stone-500 font-medium">شامل الضريبة وتوصيل القنيطرة</span>
              </div>

              {/* Description */}
              <p className="mt-4 text-sm text-stone-600 leading-relaxed">
                {product.description}
              </p>

              {/* Composition Breakdown */}
              <div className="mt-4 p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80">
                <span className="text-xs font-bold text-stone-800 block mb-2">
                  محتويات وتنسيق الباقة:
                </span>
                <ul className="text-xs text-stone-600 space-y-1.5 list-disc list-inside">
                  {product.flowerTypes.map((item, idx) => (
                    <li key={idx} className="leading-tight">{item}</li>
                  ))}
                </ul>
              </div>

              {/* Ribbon Selection */}
              <div className="mt-5">
                <label className="text-xs font-bold text-stone-700 block mb-2">
                  اختر لون شريط الساتان الفاخر:
                </label>
                <div className="flex items-center gap-3">
                  {ribbonColors.map((ribbon) => (
                    <button
                      key={ribbon.name}
                      type="button"
                      onClick={() => setSelectedRibbon(ribbon.name)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                        selectedRibbon === ribbon.name
                          ? 'border-emerald-800 bg-emerald-50/50 text-emerald-900 ring-2 ring-emerald-800/20 font-bold'
                          : 'border-stone-200 text-stone-600 hover:border-stone-300'
                      }`}
                    >
                      <span className={`w-3.5 h-3.5 rounded-full ${ribbon.color} shadow-xs border ${ribbon.border}`} />
                      <span>{ribbon.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Card Message Input */}
              <div className="mt-4">
                <label className="text-xs font-bold text-stone-700 block mb-1.5">
                  رسالة الإهداء (مجاناً داخل ظرف شمعي فاخر):
                </label>
                <textarea
                  value={cardMessage}
                  onChange={(e) => setCardMessage(e.target.value)}
                  placeholder="اكتب كلماتك العذبة للمهدى إليه..."
                  rows={2}
                  className="w-full text-xs p-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800 transition-all text-stone-800 resize-none"
                />
              </div>
            </div>

            {/* Actions: Quantity & Add to Cart */}
            <div className="pt-4 border-t border-stone-100 space-y-3">
              <div className="flex items-center gap-4">
                {/* Quantity Controls */}
                <div className="flex items-center border border-stone-200 rounded-full px-3 py-1.5 bg-stone-50">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-6 h-6 text-stone-600 hover:text-stone-900 font-bold text-base flex items-center justify-center"
                    aria-label="تقليل الكمية"
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-sm font-bold text-stone-900">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-6 h-6 text-stone-600 hover:text-stone-900 font-bold text-base flex items-center justify-center"
                    aria-label="زيادة الكمية"
                  >
                    +
                  </button>
                </div>

                {/* Add Button */}
                <button
                  onClick={handleAdd}
                  disabled={isSuccess}
                  className={`flex-1 py-3.5 px-6 rounded-full font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 ${
                    isSuccess
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-900 hover:bg-emerald-800 text-white hover:shadow-lg'
                  }`}
                >
                  {isSuccess ? (
                    <>
                      <Check className="w-5 h-5 text-emerald-200" />
                      <span>تمت الإضافة بنجاح!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-5 h-5 text-rose-200" />
                      <span>أضف إلى السلة ({product.price * quantity} درهم)</span>
                    </>
                  )}
                </button>
              </div>

              {/* Guarantees */}
              <div className="flex items-center justify-between text-[11px] text-stone-500 pt-2">
                <span className="flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-emerald-700" />
                  <span>توصيل اليوم بالقنيطرة متاح</span>
                </span>
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  <span>ضمان نضارة 100%</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
