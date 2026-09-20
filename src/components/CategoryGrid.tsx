import React from 'react';
import { CATEGORIES } from '../data/flowerData';
import { ArrowLeft, Sparkles } from 'lucide-react';

interface CategoryGridProps {
  selectedCategory: string | null;
  onSelectCategory: (categoryKey: string | null) => void;
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <section id="categories" className="py-16 sm:py-20 bg-stone-50/70 border-y border-stone-200/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>تنسيقات مصممة لكل لحظة</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight font-cairo">
              تسوق حسب المناسبة
            </h2>
            <p className="mt-2 text-base text-stone-600 max-w-xl">
              اختر المناسبة الخاصة بك ودعنا نبتكر لك باقة تنبض بالحياة والمشاعر الصادقة
            </p>
          </div>

          {selectedCategory && (
            <button
              onClick={() => onSelectCategory(null)}
              className="self-start md:self-auto text-xs sm:text-sm font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-4 py-2 rounded-full transition-colors flex items-center gap-1.5"
            >
              <span>عرض جميع التصنيفات</span>
              <span>×</span>
            </button>
          )}
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.key;
            return (
              <div
                key={cat.id}
                onClick={() => {
                  onSelectCategory(isSelected ? null : cat.key);
                  const productsSection = document.getElementById('products');
                  if (productsSection) {
                    productsSection.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className={`group cursor-pointer rounded-2xl overflow-hidden bg-white p-3 border transition-all duration-300 flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 ${
                  isSelected
                    ? 'border-emerald-800 ring-2 ring-emerald-800/20 shadow-md bg-emerald-50/20'
                    : 'border-stone-200/80 hover:border-rose-200'
                }`}
              >
                {/* Image Container */}
                <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-stone-100">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                  />
                  {cat.badge && (
                    <span className="absolute top-2 right-2 bg-emerald-900/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                      {cat.badge}
                    </span>
                  )}
                  {isSelected && (
                    <div className="absolute inset-0 bg-emerald-900/30 flex items-center justify-center">
                      <span className="bg-white text-emerald-900 text-xs font-bold px-2.5 py-1 rounded-full shadow">
                        محدد ✓
                      </span>
                    </div>
                  )}
                </div>

                {/* Info Text */}
                <div className="mt-3 text-center">
                  <h3 className={`text-sm sm:text-base font-bold transition-colors ${
                    isSelected ? 'text-emerald-900' : 'text-stone-800 group-hover:text-emerald-800'
                  }`}>
                    {cat.name}
                  </h3>
                  <p className="text-[11px] text-stone-500 mt-1 line-clamp-1">
                    {cat.itemCount} باقة متوفرة
                  </p>
                </div>

                <div className="mt-2 pt-2 border-t border-stone-100 flex items-center justify-center gap-1 text-[11px] font-semibold text-rose-600 group-hover:text-emerald-800 transition-colors">
                  <span>تصفح</span>
                  <ArrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-1" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
