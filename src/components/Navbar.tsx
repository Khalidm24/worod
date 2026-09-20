import React, { useState, useEffect } from 'react';
import { ShoppingBag, Menu, X, Search, Sparkles, Phone, Heart } from 'lucide-react';

interface NavbarProps {
  cartCount: number;
  onOpenCart: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeCategory: string | null;
  onSelectCategory: (cat: string | null) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  cartCount,
  onOpenCart,
  searchQuery,
  onSearchChange,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'الرئيسية', href: '#hero' },
    { name: 'تسوق حسب المناسبة', href: '#categories' },
    { name: 'المنتجات المميزة', href: '#products' },
    { name: 'العروض الحصرية', href: '#offers' },
    { name: 'آراء العملاء', href: '#testimonials' },
    { name: 'تواصل معنا', href: '#contact' },
  ];

  return (
    <>
      {/* Top Announcement Bar */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-950 text-white text-xs sm:text-sm py-2 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 mx-auto sm:mx-0">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-300 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-400"></span>
            </span>
            <span className="font-medium">
              توصيل مجاني داخل القنيطرة للطلبات فوق 250 درهم | كود الخصم: <span className="font-bold text-rose-200 underline decoration-rose-300">WARD20</span> (خصم 20%)
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-4 text-xs text-emerald-100">
            <a href="tel:+212611938119" className="flex items-center gap-1.5 hover:text-white transition-colors">
              <Phone className="w-3.5 h-3.5 text-rose-300" />
              <span>خدمة الزبناء: 0611938119</span>
            </a>
            <span className="text-emerald-500">|</span>
            <span className="text-emerald-200">مدينة القنيطرة • مهدية ونواحيها</span>
          </div>
        </div>
      </div>

      {/* Main Sticky Navbar */}
      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-rose-100/80 py-3'
            : 'bg-white border-b border-stone-100 py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Mobile Hamburger Button */}
            <div className="flex items-center gap-2 lg:hidden">
              <button
                id="mobile-menu-toggle-btn"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-xl text-stone-700 hover:text-emerald-900 hover:bg-rose-50 transition-colors focus:outline-none"
                aria-label="القائمة الرئيسية"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              <button
                id="mobile-search-toggle-btn"
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="p-2 rounded-xl text-stone-700 hover:text-emerald-900 hover:bg-rose-50 transition-colors focus:outline-none"
                aria-label="البحث"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>

            {/* Brand Logo */}
            <a href="#hero" className="flex items-center gap-3 group">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-emerald-900 via-emerald-800 to-emerald-700 flex items-center justify-center text-white shadow-md shadow-emerald-900/10 group-hover:scale-105 transition-transform duration-300">
                <Sparkles className="w-5 h-5 text-rose-200" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-stone-900 font-cairo">
                  باقة <span className="text-emerald-800">وورد</span>
                </span>
                <span className="text-[10px] sm:text-xs text-rose-500 font-medium tracking-widest -mt-1 uppercase">
                  Kénitra • Fleuriste de Luxe
                </span>
              </div>
            </a>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="px-3.5 py-2 text-sm font-semibold text-stone-600 hover:text-emerald-900 hover:bg-rose-50/70 rounded-full transition-all duration-200"
                >
                  {link.name}
                </a>
              ))}
            </nav>

            {/* Right Action Icons & Cart */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Desktop Search Bar */}
              <div className="hidden md:flex items-center relative">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="ابحث عن باقة، مناسبة، أو نوع ورد..."
                    className="w-48 lg:w-64 pl-4 pr-10 py-2 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800 transition-all text-stone-800 placeholder-stone-400"
                  />
                  <Search className="w-4 h-4 text-stone-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Wishlist Icon Dummy Indicator */}
              <a
                href="#products"
                className="hidden sm:flex p-2.5 rounded-full text-stone-600 hover:text-rose-600 hover:bg-rose-50 transition-colors relative"
                title="المفضلة"
                aria-label="المفضلة"
              >
                <Heart className="w-5 h-5" />
              </a>

              {/* Cart Drawer Trigger Button */}
              <button
                id="cart-trigger-btn"
                onClick={onOpenCart}
                className="flex items-center gap-2.5 bg-emerald-900 hover:bg-emerald-800 active:scale-95 text-white px-4 py-2.5 rounded-full shadow-sm hover:shadow-md transition-all duration-200 relative group"
                aria-label="سلة المشتريات"
              >
                <div className="relative">
                  <ShoppingBag className="w-5 h-5 text-rose-200 transition-transform group-hover:scale-110" />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-emerald-900 shadow-sm animate-pulse">
                      {cartCount}
                    </span>
                  )}
                </div>
                <span className="text-xs sm:text-sm font-bold tracking-wide">
                  السلة
                </span>
              </button>
            </div>
          </div>

          {/* Mobile Search Dropdown */}
          {isSearchOpen && (
            <div className="mt-3 pt-3 border-t border-stone-100 lg:hidden animate-fadeIn">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="ابحث عن باقة، مناسبة، أو نوع ورد..."
                  className="w-full pl-4 pr-10 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800 text-stone-800"
                  autoFocus
                />
                <Search className="w-4 h-4 text-stone-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          )}
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-x-0 top-full bg-white/98 backdrop-blur-xl border-b border-rose-100 shadow-xl transition-all duration-300">
            <div className="px-6 py-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="text-xs font-semibold text-rose-600 tracking-wider">أقسام المتجر</div>
              <div className="grid grid-cols-1 gap-2">
                {navLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between px-4 py-3 rounded-xl text-stone-800 hover:text-emerald-900 hover:bg-rose-50/80 font-medium text-base transition-colors"
                  >
                    <span>{link.name}</span>
                    <span className="text-xs text-rose-400">←</span>
                  </a>
                ))}
              </div>

              <div className="pt-4 border-t border-stone-100 flex flex-col gap-3">
                <a
                  href="tel:+212611938119"
                  className="flex items-center justify-center gap-2 py-3 rounded-xl bg-stone-100 text-stone-900 font-semibold text-sm hover:bg-stone-200 transition-colors"
                >
                  <Phone className="w-4 h-4 text-emerald-800" />
                  <span>اتصال مباشر: 0611938119</span>
                </a>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenCart();
                  }}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-900 text-white font-semibold text-sm shadow hover:bg-emerald-800 transition-colors"
                >
                  <ShoppingBag className="w-4 h-4 text-rose-300" />
                  <span>فتح سلة المشتريات ({cartCount})</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
};
