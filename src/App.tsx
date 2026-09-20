/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { PRODUCTS } from './data/flowerData';
import { Product, CartItem } from './types';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { CategoryGrid } from './components/CategoryGrid';
import { FeaturedProducts } from './components/FeaturedProducts';
import { SpecialOffers } from './components/SpecialOffers';
import { CustomGiftBuilder } from './components/CustomGiftBuilder';
import { WhyUs } from './components/WhyUs';
import { Testimonials } from './components/Testimonials';
import { Footer } from './components/Footer';
import { QuickViewModal } from './components/QuickViewModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { Toast } from './components/Toast';
import { WhatsAppFloatingButton } from './components/WhatsAppFloatingButton';
import { AdminDashboardModal } from './components/AdminDashboardModal';
import { AIFloristChat } from './components/AIFloristChat';
import { subscribeToProducts } from './lib/productService';

export default function App() {
  // Products from Firestore (with initial fallback)
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);
  const [adminInitialTab, setAdminInitialTab] = useState<'products' | 'orders' | 'settings'>('products');

  // Subscribe to real-time products in Firestore
  useEffect(() => {
    // If URL contains ?orders=true, ?tab=orders, #orders, ?admin=true, or #admin, allow opening dashboard modal
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const isOrdersRequested =
        searchParams.get('orders') === 'true' ||
        searchParams.get('tab') === 'orders' ||
        searchParams.get('admin') === 'orders' ||
        window.location.hash === '#orders';

      if (isOrdersRequested) {
        setAdminInitialTab('orders');
        setIsAdminDashboardOpen(true);
      } else if (searchParams.get('admin') === 'true' || window.location.hash === '#admin') {
        setAdminInitialTab('products');
        setIsAdminDashboardOpen(true);
      }
    }

    const unsub = subscribeToProducts((loadedProducts) => {
      if (loadedProducts && loadedProducts.length > 0) {
        setProducts(loadedProducts);
      }
    });
    return () => unsub();
  }, []);

  // Cart State (Initialized with 1 default item so the user immediately sees a populated luxury cart, but can easily modify or empty it)
  const [cartItems, setCartItems] = useState<CartItem[]>([
    {
      product: PRODUCTS[0],
      quantity: 1,
      selectedRibbon: 'أخضر زمردي',
      cardMessage: 'مع أطيب الأمنيات وأجمل باقات الورد',
      senderName: 'المحب لك'
    }
  ]);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  // Search & Filtering State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Discount / Promo Code State
  const [promoCode, setPromoCode] = useState('');
  const [discountRate, setDiscountRate] = useState(0);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  // Scroll animations observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('opacity-100', 'translate-y-0');
            entry.target.classList.remove('opacity-0', 'translate-y-6');
          }
        });
      },
      { threshold: 0.1 }
    );

    const animatedElements = document.querySelectorAll('.scroll-reveal');
    animatedElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  // Cart total items count
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  // Add to cart handler
  const handleAddToCart = (
    product: Product,
    quantity: number = 1,
    customMessage?: string,
    ribbonColor?: string
  ) => {
    setCartItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === product.id);
      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + quantity,
          cardMessage: customMessage || next[existingIndex].cardMessage,
          selectedRibbon: ribbonColor || next[existingIndex].selectedRibbon,
        };
        return next;
      }
      return [
        ...prev,
        {
          product,
          quantity,
          cardMessage: customMessage,
          selectedRibbon: ribbonColor,
        },
      ];
    });

    showToast(`تمت إضافة "${product.name}" إلى السلة بنجاح! 🌸`);
  };

  // Update quantity in cart
  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(productId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, quantity } : item))
    );
  };

  // Remove from cart
  const handleRemoveFromCart = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
    showToast('تم حذف الباقة من سلة المشتريات');
  };

  // Apply promo coupon
  const handleApplyPromoCode = (code: string): boolean => {
    if (code === 'WARD20') {
      setPromoCode('WARD20');
      setDiscountRate(0.2); // 20% discount
      showToast('تم تفعيل كود الخصم WARD20 بنجاح (20%-) ✨');
      return true;
    }
    return false;
  };

  // Attach card from gift builder
  const handleApplyGiftCard = (message: string, sender: string) => {
    if (cartItems.length > 0) {
      setCartItems((prev) =>
        prev.map((item, idx) =>
          idx === 0 ? { ...item, cardMessage: message, senderName: sender } : item
        )
      );
    }
    showToast('تم إرفاق بطاقة الإهداء الفاخرة مع باقة الزهور في السلة! ✉️');
  };

  // Smooth scroll to sections
  const scrollToProducts = () => {
    const el = document.getElementById('products');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToOffers = () => {
    const el = document.getElementById('offers');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white text-stone-800 flex flex-col selection:bg-rose-200 selection:text-rose-900">
      {/* Navigation Header */}
      <Navbar
        cartCount={cartCount}
        onOpenCart={() => setIsCartOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* Hero Section */}
        <Hero onShopClick={scrollToProducts} onExploreOffers={scrollToOffers} />

        {/* Categories Section (تسوق حسب المناسبة) */}
        <CategoryGrid
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        {/* Featured Products Section (المنتجات المميزة) */}
        <FeaturedProducts
          products={products}
          onAddToCart={handleAddToCart}
          onQuickView={(prod) => setQuickViewProduct(prod)}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          searchQuery={searchQuery}
        />

        {/* Special Offer Banner Section (العروض والخصومات) */}
        <SpecialOffers onShopOffers={scrollToProducts} />

        {/* Interactive Gift Card Customizer */}
        <CustomGiftBuilder onApplyGiftCard={handleApplyGiftCard} />

        {/* Why Choose Us & Guarantees */}
        <WhyUs />

        {/* Testimonials Section (آراء العملاء) */}
        <Testimonials />
      </main>

      {/* Footer */}
      <Footer
        onOpenOrdersDatabase={() => {
          setAdminInitialTab('orders');
          setIsAdminDashboardOpen(true);
        }}
      />

      {/* Quick View Product Modal */}
      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={handleAddToCart}
      />

      {/* Slide-over Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveFromCart}
        onProceedToCheckout={() => setIsCheckoutOpen(true)}
        promoCode={promoCode}
        onApplyPromoCode={handleApplyPromoCode}
        discountRate={discountRate}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={cartItems}
        subtotal={subtotal}
        discountRate={discountRate}
        onOrderSuccess={() => {
          setCartItems([]);
          showToast('تم استلام وتأكيد طلبك بنجاح! شكراً لك 💐');
        }}
      />

      {/* Admin Dashboard Modal with Orders Database & Google Sheets */}
      <AdminDashboardModal
        isOpen={isAdminDashboardOpen}
        onClose={() => setIsAdminDashboardOpen(false)}
        products={products}
        initialTab={adminInitialTab}
      />

      {/* Floating WhatsApp Quick Contact Button (Bottom Left) */}
      <WhatsAppFloatingButton phoneNumber="212611938119" formattedNumber="06 11 93 81 19" />

      {/* Gemini AI Florist Chatbot "وردة" (Bottom Right) */}
      <AIFloristChat
        products={products}
        onAddToCart={handleAddToCart}
        onQuickView={(prod) => setQuickViewProduct(prod)}
      />

      {/* Feedback Toast Notification */}
      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      )}
    </div>
  );
}
