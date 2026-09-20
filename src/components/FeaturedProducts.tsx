import React, { useState } from 'react';
import { Product } from '../types';
import { Star, ShoppingBag, Eye, Heart, Check, Sparkles, Filter } from 'lucide-react';

interface FeaturedProductsProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  onQuickView: (product: Product) => void;
  selectedCategory: string | null;
  onSelectCategory: (cat: string | null) => void;
  searchQuery: string;
}

export const FeaturedProducts: React.FC<FeaturedProductsProps> = ({
  products,
  onAddToCart,
  onQuickView,
  selectedCategory,
  onSelectCategory,
  searchQuery,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'bestsellers' | 'new' | 'offers'>('all');
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [addedIds, setAddedIds] = useState<string[]>([]);

  const toggleWishlist = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setWishlist((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(product);
    setAddedIds((prev) => [...prev, product.id]);
    setTimeout(() => {
      setAddedIds((prev) => prev.filter((id) => id !== product.id));
    }, 1500);
  };

  // Filter products based on category, tab, and search query
  const filteredProducts = products.filter((prod) => {
    if (selectedCategory && prod.category !== selectedCategory) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = prod.name.toLowerCase().includes(q);
      const matchEn = prod.nameEn.toLowerCase().includes(q);
      const matchCat = prod.categoryLabel.toLowerCase().includes(q);
      const matchDesc = prod.description.toLowerCase().includes(q);
      if (!matchName && !matchEn && !matchCat && !matchDesc) return false;
    }

    if (activeTab === 'bestsellers' && !prod.isBestseller) return false;
    if (activeTab === 'new' && !prod.isNew) return false;
    if (activeTab === 'offers' && !prod.originalPrice) return false;

    return true;
  });

  return (
    <section id="products" className="py-16 sm:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title and Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold mb-3 border border-emerald-100">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>تشكيلة حصرية منتقاة بعناية</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-stone-900 tracking-tight font-cairo">
            باقات الورد المميزة
          </h2>
          <p className="mt-3 text-stone-600 text-base sm:text-lg">
            تصاميم استثنائية من الزهور الطبيعية الهولندية الفاخرة المنسقة بأيدي محترفينا
          </p>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-10">
          <button
            onClick={() => {
              setActiveTab('all');
              onSelectCategory(null);
            }}
            className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 ${
              activeTab === 'all' && !selectedCategory
                ? 'bg-emerald-900 text-white shadow-md'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            جميع الباقات ({products.length})
          </button>

          <button
            onClick={() => setActiveTab('bestsellers')}
            className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 ${
              activeTab === 'bestsellers'
                ? 'bg-emerald-900 text-white shadow-md'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            🔥 الأكثر طلباً
          </button>

          <button
            onClick={() => setActiveTab('new')}
            className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 ${
              activeTab === 'new'
                ? 'bg-emerald-900 text-white shadow-md'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            ✨ وصل حديثاً
          </button>

          <button
            onClick={() => setActiveTab('offers')}
            className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 ${
              activeTab === 'offers'
                ? 'bg-emerald-900 text-white shadow-md'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            🏷️ خصومات خاصة
          </button>

          {selectedCategory && (
            <div className="flex items-center gap-2 bg-rose-100/80 text-rose-800 text-xs sm:text-sm font-bold px-4 py-2 rounded-full border border-rose-200">
              <Filter className="w-3.5 h-3.5" />
              <span>تصنيف محدد</span>
              <button
                onClick={() => onSelectCategory(null)}
                className="hover:text-rose-950 font-black text-sm ml-1"
                title="إلغاء التصفية"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Results summary if searching */}
        {searchQuery && (
          <div className="text-center mb-6 text-sm text-stone-500">
            نتائج البحث عن: <strong className="text-emerald-900">"{searchQuery}"</strong> ({filteredProducts.length} باقة)
          </div>
        )}

        {/* Product Cards Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-stone-50 rounded-3xl border border-dashed border-stone-300">
            <p className="text-stone-500 text-lg">لم يتم العثور على باقات تطابق خيارات البحث.</p>
            <button
              onClick={() => {
                setActiveTab('all');
                onSelectCategory(null);
              }}
              className="mt-4 px-6 py-2.5 rounded-full bg-emerald-900 text-white text-sm font-bold hover:bg-emerald-800 transition-colors"
            >
              عرض جميع الباقات
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {filteredProducts.map((product) => {
              const isWishlisted = wishlist.includes(product.id);
              const isRecentlyAdded = addedIds.includes(product.id);

              return (
                <div
                  key={product.id}
                  className="group relative bg-white rounded-3xl overflow-hidden border border-stone-200/90 hover:border-rose-200 hover:shadow-2xl transition-all duration-500 flex flex-col justify-between"
                >
                  {/* Image & Badges Container */}
                  <div className="relative aspect-[4/5] w-full overflow-hidden bg-stone-100">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
                      loading="lazy"
                    />

                    {/* Gradient Overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                    {/* Product Tags */}
                    <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10">
                      {product.tag && (
                        <span className="bg-emerald-900/95 backdrop-blur-sm text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-md">
                          {product.tag}
                        </span>
                      )}
                      {product.originalPrice && (
                        <span className="bg-rose-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm w-fit">
                          وفر {product.originalPrice - product.price} درهم
                        </span>
                      )}
                    </div>

                    {/* Wishlist Button */}
                    <button
                      onClick={(e) => toggleWishlist(product.id, e)}
                      className={`absolute top-3 left-3 p-2 rounded-full backdrop-blur-md transition-all duration-200 z-10 ${
                        isWishlisted
                          ? 'bg-rose-500 text-white shadow-md scale-110'
                          : 'bg-white/80 text-stone-600 hover:bg-white hover:text-rose-600 shadow-sm'
                      }`}
                      aria-label="إضافة للمفضلة"
                    >
                      <Heart className="w-4 h-4 fill-current" />
                    </button>

                    {/* Quick View Button overlay on hover */}
                    <div className="absolute inset-x-4 bottom-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 hidden sm:flex items-center justify-center">
                      <button
                        onClick={() => onQuickView(product)}
                        className="w-full py-2.5 bg-white/95 backdrop-blur-md hover:bg-white text-stone-900 font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"
                      >
                        <Eye className="w-4 h-4 text-emerald-800" />
                        <span>نظرة سريعة وتفاصيل</span>
                      </button>
                    </div>
                  </div>

                  {/* Product Details Section */}
                  <div className="p-5 flex flex-col flex-1 justify-between">
                    <div>
                      {/* Category Label and Rating */}
                      <div className="flex items-center justify-between text-xs text-stone-500 mb-1.5">
                        <span className="text-rose-600 font-semibold tracking-wide">
                          {product.categoryLabel}
                        </span>
                        <div className="flex items-center gap-1 text-amber-500 font-bold">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>{product.rating}</span>
                          <span className="text-[11px] text-stone-400">({product.reviewsCount})</span>
                        </div>
                      </div>

                      {/* Title */}
                      <h3
                        onClick={() => onQuickView(product)}
                        className="text-base sm:text-lg font-bold text-stone-900 group-hover:text-emerald-900 transition-colors line-clamp-1 cursor-pointer font-cairo"
                      >
                        {product.name}
                      </h3>

                      {/* Brief Description */}
                      <p className="text-xs text-stone-500 mt-1 line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>
                    </div>

                    {/* Price and Add to Cart Action */}
                    <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-lg sm:text-xl font-black text-emerald-900 font-cairo">
                            {product.price}
                          </span>
                          <span className="text-xs font-bold text-stone-600">درهم</span>
                        </div>
                        {product.originalPrice && (
                          <span className="text-[11px] text-stone-400 line-through block">
                            {product.originalPrice} درهم
                          </span>
                        )}
                      </div>

                      <button
                        id={`add-to-cart-${product.id}`}
                        onClick={(e) => handleAddToCart(product, e)}
                        disabled={isRecentlyAdded}
                        className={`px-4 py-2.5 rounded-full font-bold text-xs sm:text-sm flex items-center gap-2 transition-all duration-200 active:scale-95 shadow-sm ${
                          isRecentlyAdded
                            ? 'bg-emerald-600 text-white'
                            : 'bg-emerald-900 hover:bg-emerald-800 text-white hover:shadow-md'
                        }`}
                        aria-label={`أضف ${product.name} إلى السلة`}
                      >
                        {isRecentlyAdded ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-200" />
                            <span>تمت الإضافة!</span>
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="w-4 h-4 text-rose-200" />
                            <span>أضف للسلة</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
