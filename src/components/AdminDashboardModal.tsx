import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Edit2,
  Trash2,
  Save,
  Image as ImageIcon,
  DollarSign,
  Package,
  ShoppingBag,
  Settings as SettingsIcon,
  Search,
  CheckCircle2,
  AlertCircle,
  LogIn,
  LogOut,
  ExternalLink,
  Sparkles,
  Phone,
  MessageCircle,
  Truck,
  Eye,
  RefreshCw,
  FileSpreadsheet,
  Database,
} from 'lucide-react';
import { Product, OrderRecord, StoreSettings } from '../types';
import {
  saveProduct,
  deleteProduct,
  subscribeToOrders,
  updateOrderStatus,
  subscribeToStoreSettings,
  updateStoreSettings,
  seedInitialProducts,
} from '../lib/productService';
import { useAuth } from '../lib/AuthContext';
import { ADMIN_EMAIL } from '../lib/firebase';
import { OrdersDatabaseTable } from './OrdersDatabaseTable';
import { getSavedSheetId, getSpreadsheetUrl, subscribeToCloudSheetConfig } from '../lib/googleSheetsService';
import { GoogleSheetsSyncDashboard } from './GoogleSheetsSyncDashboard';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onProductUpdated?: () => void;
  initialTab?: 'products' | 'orders' | 'sheets-sync' | 'settings';
}

// Curated high quality flower photos for 1-click photo replacement
const CURATED_FLOWER_PHOTOS = [
  { label: 'باقة جوري أحمر ملكي', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=900&q=80' },
  { label: 'باقة ياسمين وورود ناعمة', url: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=900&q=80' },
  { label: 'باقة عروس بيضاء كلاسيك', url: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=900&q=80' },
  { label: 'تنسيق ألوان مبهجة ربيعية', url: 'https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?auto=format&fit=crop&w=900&q=80' },
  { label: 'بوكس ورد فاخر هدايا', url: 'https://images.unsplash.com/photo-1533616688419-b7a585564566?auto=format&fit=crop&w=900&q=80' },
  { label: 'زهور وردية رومانسية', url: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=900&q=80' },
  { label: 'تنسيق توليب وأوركيد فخم', url: 'https://images.unsplash.com/photo-1508615039623-a25605d2b022?auto=format&fit=crop&w=900&q=80' },
  { label: 'فازة كريستال أنيقة', url: 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=900&q=80' },
];

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  isOpen,
  onClose,
  products,
  initialTab = 'products',
}) => {
  const { currentUser, isAdmin, signInWithGoogle, signOut, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'sheets-sync' | 'settings'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Orders state
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Store Settings state
  const [settings, setSettings] = useState<StoreSettings>({
    freeShippingThreshold: 250,
    whatsappNumber: '212611938119',
    formattedPhone: '06 11 93 81 19',
    announcementText: '🌸 توصيل فوري لجميع أحياء القنيطرة والمهدية ونواحيها في أقل من ساعتين!',
  });

  // Google Sheets state
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(getSavedSheetId());

  useEffect(() => {
    const unsub = subscribeToCloudSheetConfig((info) => {
      if (info?.id) setSpreadsheetId(info.id);
    });
    return () => unsub();
  }, []);

  // Subscribe to store settings
  useEffect(() => {
    const unsub = subscribeToStoreSettings((loadedSettings) => {
      setSettings(loadedSettings);
    });
    return () => unsub();
  }, []);

  // Subscribe to orders if signed in
  useEffect(() => {
    if (activeTab === 'orders') {
      setOrdersLoading(true);
      const unsub = subscribeToOrders(
        (loadedOrders) => {
          setOrders(loadedOrders);
          setOrdersLoading(false);
        },
        () => {
          setOrdersLoading(false);
        }
      );
      return () => unsub();
    }
  }, [activeTab]);

  if (!isOpen) return null;

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.categoryLabel && p.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleEditClick = (product: Product) => {
    setEditingProduct({ ...product });
    setIsAddingNew(false);
  };

  const handleAddNewClick = () => {
    setEditingProduct({
      id: 'prod-' + Date.now(),
      name: '',
      nameEn: '',
      price: 250,
      originalPrice: 300,
      rating: 5.0,
      reviewsCount: 1,
      image: CURATED_FLOWER_PHOTOS[0].url,
      category: 'anniversary',
      categoryLabel: 'ذكرى وحب',
      tag: 'جديد',
      description: 'باقة زهور طبيعية منسقة بعناية فائقة بأيدي أمهر المنسقين بمدينة القنيطرة.',
      flowerTypes: ['جوري طبيعي', 'جبسوفيلا', 'أوراق خضراء'],
      inStock: true,
      isBestseller: false,
      isNew: true,
    });
    setIsAddingNew(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    if (!editingProduct.name?.trim()) {
      alert('يرجى كتابة اسم الباقة');
      return;
    }

    setIsSubmitting(true);
    setSaveStatus(null);
    try {
      await saveProduct(editingProduct);
      setSaveStatus('تم حفظ وتحديث الباقة في قاعدة البيانات بنجاح!');
      setTimeout(() => {
        setSaveStatus(null);
        setEditingProduct(null);
        setIsAddingNew(false);
      }, 1200);
    } catch (err: any) {
      console.error(err);
      alert('حدث خطأ أثناء الحفظ. تأكد من صلاحيات المسؤول.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف باقة "${name}"؟`)) return;
    try {
      await deleteProduct(id);
      if (editingProduct?.id === id) {
        setEditingProduct(null);
      }
    } catch (err) {
      console.error(err);
      alert('فشل الحذف. تأكد من صلاحياتك.');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await updateStoreSettings(settings);
      alert('تم تحديث إعدادات المتجر بنجاح!');
    } catch (err) {
      console.error(err);
      alert('فشل تحديث الإعدادات');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetCatalog = async () => {
    if (!confirm('هل تريد إعادة تعيين باقات المتجر للكتالوج الافتراضي؟')) return;
    try {
      await seedInitialProducts();
      alert('تمت مزامنة الباقات بنجاح!');
    } catch (err) {
      console.error(err);
      alert('فشلت العملية.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-sm overflow-y-auto font-cairo" dir="rtl">
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-auto flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-stone-900 text-white p-5 sm:p-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-800/80 rounded-2xl border border-emerald-700/50 shadow-inner">
              <SettingsIcon className="w-6 h-6 text-rose-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black font-cairo flex items-center gap-2">
                <span>لوحة تحكم المتجر وقاعدة البيانات</span>
                <span className="text-[10px] bg-emerald-800/80 text-emerald-200 border border-emerald-700 px-2 py-0.5 rounded-full font-sans">
                  Firestore Connected
                </span>
              </h2>
              <p className="text-xs text-stone-300">
                إدارة أسعار وباقات وصور المتجر والطلبات الواردة بمدينة القنيطرة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {spreadsheetId && (
              <a
                href={getSpreadsheetUrl(spreadsheetId)}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl border border-emerald-600/60 shadow-sm transition-all active:scale-95"
                title="فتح جدول الطلبات مباشرة في Google Sheets"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
                <span>فتح في Google Sheets ↗</span>
              </a>
            )}

            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
              aria-label="إغلاق"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Auth / Admin Bar */}
        <div className="bg-stone-50 border-b border-stone-200 px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-stone-500 font-medium">حساب المسؤول:</span>
            {currentUser ? (
              <span className="font-bold text-stone-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                <span>{currentUser.email}</span>
                {isAdmin ? (
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                    مسؤول معتمد ✓
                  </span>
                ) : (
                  <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                    (تنبيه: يتطلب حساب {ADMIN_EMAIL})
                  </span>
                )}
              </span>
            ) : (
              <span className="text-stone-400">غير مسجل الدخول</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!currentUser ? (
              <button
                onClick={signInWithGoogle}
                className="flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold px-3.5 py-1.5 rounded-xl transition-all shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>دخول بجوجل كمسؤول ({ADMIN_EMAIL})</span>
              </button>
            ) : (
              <button
                onClick={signOut}
                className="flex items-center gap-1 text-stone-600 hover:text-rose-700 px-2.5 py-1 rounded-lg hover:bg-stone-200 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>تسجيل الخروج</span>
              </button>
            )}

            <button
              onClick={handleResetCatalog}
              title="مزامنة وتحديث كتالوج باقات القنيطرة الأساسية في Firestore"
              className="flex items-center gap-1 text-stone-500 hover:text-emerald-800 px-2 py-1 rounded-lg hover:bg-stone-200 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">مزامنة الكتالوج</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-stone-200 bg-white px-5 gap-2 shrink-0">
          <button
            onClick={() => { setActiveTab('products'); setEditingProduct(null); }}
            className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'products'
                ? 'border-emerald-800 text-emerald-900 bg-emerald-50/50'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>الباقات والأسعار والصور ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'orders'
                ? 'border-emerald-800 text-emerald-900 bg-emerald-50/50'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>قاعدة بيانات الطلبات (Google Sheets) {orders.length > 0 && `(${orders.length})`}</span>
          </button>

          <button
            onClick={() => setActiveTab('sheets-sync')}
            className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'sheets-sync'
                ? 'border-emerald-800 text-emerald-900 bg-emerald-50/50'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Database className="w-4 h-4 text-emerald-700" />
            <span>مزامنة Google Sheets (Backup DB)</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'settings'
                ? 'border-emerald-800 text-emerald-900 bg-emerald-50/50'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <SettingsIcon className="w-4 h-4" />
            <span>إعدادات المتجر والهاتف</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-stone-50/50">
          {/* TAB 1: PRODUCTS MANAGEMENT */}
          {activeTab === 'products' && (
            <div className="space-y-5">
              {/* Top Controls: Search & Add Button */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث عن باقة بالاسم أو التصنيف..."
                    className="w-full pl-3 pr-9 py-2 rounded-xl border border-stone-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800/20 bg-white"
                  />
                </div>

                <button
                  onClick={handleAddNewClick}
                  className="flex items-center justify-center gap-1.5 bg-emerald-800 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة باقة جديدة</span>
                </button>
              </div>

              {/* Product Edit / Add Drawer Modal */}
              {editingProduct && (
                <div className="bg-white rounded-2xl border-2 border-emerald-800/30 p-5 shadow-lg space-y-4 animate-scaleUp">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                    <h3 className="text-sm sm:text-base font-black text-stone-900 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-800" />
                      <span>{isAddingNew ? 'إضافة باقة زهور جديدة' : `تعديل باقة: ${editingProduct.name}`}</span>
                    </h3>
                    <button
                      onClick={() => setEditingProduct(null)}
                      className="text-stone-400 hover:text-stone-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveProduct} className="space-y-4 text-xs sm:text-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="font-bold text-stone-700 block mb-1">اسم الباقة بالعربية: *</label>
                        <input
                          type="text"
                          required
                          value={editingProduct.name || ''}
                          onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                          placeholder="مثال: باقة ورد ميموزا الفاخرة"
                          className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-800/20"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-stone-700 block mb-1">اسم الباقة بالإنجليزية (اختياري):</label>
                        <input
                          type="text"
                          value={editingProduct.nameEn || ''}
                          onChange={(e) => setEditingProduct({ ...editingProduct, nameEn: e.target.value })}
                          placeholder="e.g. Mimosa Luxury Bouquet"
                          className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-800/20 dir-ltr text-left"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="font-bold text-stone-700 block mb-1">السعر الحالي (بالدرهم): *</label>
                        <div className="relative">
                          <input
                            type="number"
                            required
                            min="1"
                            value={editingProduct.price || ''}
                            onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                            className="w-full p-2.5 pl-14 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-800/20 font-bold text-emerald-900"
                          />
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-xs">
                            درهم
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="font-bold text-stone-700 block mb-1">السعر قبل التخفيض (اختياري):</label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            value={editingProduct.originalPrice || ''}
                            onChange={(e) => setEditingProduct({ ...editingProduct, originalPrice: e.target.value ? Number(e.target.value) : undefined })}
                            placeholder="350"
                            className="w-full p-2.5 pl-14 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-800/20 text-stone-600"
                          />
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-xs">
                            درهم
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="font-bold text-stone-700 block mb-1">التصنيف / المناسبة:</label>
                        <select
                          value={editingProduct.category || 'anniversary'}
                          onChange={(e) => setEditingProduct({
                            ...editingProduct,
                            category: e.target.value as any,
                            categoryLabel: e.target.options[e.target.selectedIndex].text
                          })}
                          className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-800/20 bg-white"
                        >
                          <option value="anniversary">ذكرى وحب</option>
                          <option value="birthday">أعياد ميلاد</option>
                          <option value="wedding">زفاف وخطوبة</option>
                          <option value="get-well">شفاء وتهنئة</option>
                          <option value="newborn">مواليد جدد</option>
                          <option value="vip">باقات فاخرة VIP</option>
                        </select>
                      </div>
                    </div>

                    {/* Image URL & Quick Preset Selector */}
                    <div className="space-y-2">
                      <label className="font-bold text-stone-700 block">رابط صورة الباقة (Photo URL):</label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          required
                          value={editingProduct.image || ''}
                          onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })}
                          placeholder="https://images.unsplash.com/..."
                          className="flex-1 p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-800/20 dir-ltr text-left text-xs"
                        />
                        {editingProduct.image && (
                          <div className="w-12 h-12 rounded-xl overflow-hidden border border-stone-300 shrink-0">
                            <img src={editingProduct.image} alt="معاينة" className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>

                      {/* 1-Click Curated Presets */}
                      <div>
                        <span className="text-[11px] text-stone-500 block mb-1.5">
                          أو اختر صورة جاهزة عالية الدقة بضغطة واحدة:
                        </span>
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {CURATED_FLOWER_PHOTOS.map((item, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setEditingProduct({ ...editingProduct, image: item.url })}
                              className={`shrink-0 flex items-center gap-1.5 p-1 rounded-xl border transition-all text-right ${
                                editingProduct.image === item.url
                                  ? 'border-emerald-800 ring-2 ring-emerald-800/30 bg-emerald-50'
                                  : 'border-stone-200 hover:border-emerald-400 bg-white'
                              }`}
                            >
                              <img src={item.url} alt={item.label} className="w-8 h-8 rounded-lg object-cover" />
                              <span className="text-[10px] font-medium text-stone-700 px-1">{item.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-stone-700 block mb-1">وصف وتفاصيل الباقة:</label>
                      <textarea
                        rows={2}
                        value={editingProduct.description || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                        placeholder="وصف مكونات الأزهار وتفاصيل التغليف الفاخر..."
                        className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-800/20"
                      />
                    </div>

                    {/* Stock & Badges Toggles */}
                    <div className="flex flex-wrap items-center gap-5 pt-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingProduct.inStock !== false}
                          onChange={(e) => setEditingProduct({ ...editingProduct, inStock: e.target.checked })}
                          className="w-4 h-4 rounded text-emerald-800 focus:ring-emerald-800"
                        />
                        <span className="font-bold text-stone-800">متوفر في المخزون (En stock)</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(editingProduct.isBestseller)}
                          onChange={(e) => setEditingProduct({ ...editingProduct, isBestseller: e.target.checked })}
                          className="w-4 h-4 rounded text-emerald-800 focus:ring-emerald-800"
                        />
                        <span className="text-stone-700">شارة الأكثر طلباً</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(editingProduct.isNew)}
                          onChange={(e) => setEditingProduct({ ...editingProduct, isNew: e.target.checked })}
                          className="w-4 h-4 rounded text-emerald-800 focus:ring-emerald-800"
                        />
                        <span className="text-stone-700">شارة باقة جديدة</span>
                      </label>
                    </div>

                    {/* Submit Bar */}
                    <div className="flex items-center justify-between pt-3 border-t border-stone-100">
                      <div>
                        {saveStatus && (
                          <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>{saveStatus}</span>
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingProduct(null)}
                          className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-medium"
                        >
                          إلغاء
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="flex items-center gap-2 bg-emerald-800 hover:bg-emerald-700 text-white px-6 py-2 rounded-xl font-bold transition-all shadow-sm disabled:opacity-50"
                        >
                          <Save className="w-4 h-4" />
                          <span>{isSubmitting ? 'جاري الحفظ...' : 'حفظ في قاعدة البيانات'}</span>
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              )}

              {/* Products Table / Grid */}
              <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs sm:text-sm">
                    <thead className="bg-stone-100 text-stone-600 font-bold border-b border-stone-200">
                      <tr>
                        <th className="p-3">صورة الباقة</th>
                        <th className="p-3">اسم الباقة</th>
                        <th className="p-3">التصنيف</th>
                        <th className="p-3">السعر بالدرهم</th>
                        <th className="p-3">الحالة</th>
                        <th className="p-3 text-center">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {filteredProducts.map((product) => (
                        <tr key={product.id} className="hover:bg-stone-50/80 transition-colors">
                          <td className="p-3">
                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-stone-100 border border-stone-200">
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </td>
                          <td className="p-3 font-bold text-stone-900">
                            <div>{product.name}</div>
                            {product.nameEn && (
                              <div className="text-[11px] text-stone-400 dir-ltr text-right">{product.nameEn}</div>
                            )}
                          </td>
                          <td className="p-3 text-stone-600">
                            <span className="px-2 py-0.5 bg-stone-100 rounded-md text-[11px]">
                              {product.categoryLabel || product.category}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="font-extrabold text-emerald-900 font-cairo">
                              {product.price} درهم
                            </span>
                            {product.originalPrice && (
                              <span className="text-[11px] text-stone-400 line-through mr-1.5">
                                {product.originalPrice} درهم
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            {product.inStock !== false ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[11px] font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                <span>متوفر</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full text-[11px] font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                <span>نفذت الكمية</span>
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleEditClick(product)}
                                className="p-1.5 text-stone-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors"
                                title="تعديل السعر والصورة والمعلومات"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(product.id, product.name)}
                                className="p-1.5 text-stone-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                                title="حذف الباقة"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ORDERS MANAGEMENT & GOOGLE SHEETS DATABASE TABLE */}
          {activeTab === 'orders' && (
            <OrdersDatabaseTable
              orders={orders}
              loading={ordersLoading}
              onRefreshOrders={() => {
                setOrdersLoading(true);
                const unsub = subscribeToOrders(
                  (loadedOrders) => {
                    setOrders(loadedOrders);
                    setOrdersLoading(false);
                  },
                  () => setOrdersLoading(false)
                );
                return () => unsub();
              }}
            />
          )}

          {/* TAB 3: STORE SETTINGS */}
          {activeTab === 'settings' && (
            <div className="max-w-xl mx-auto bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-stone-900 border-b border-stone-100 pb-3">
                إعدادات المتجر العامة بالقنيطرة
              </h3>

              <form onSubmit={handleSaveSettings} className="space-y-4 text-xs sm:text-sm">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    عتبة التوصيل المجاني داخل القنيطرة (بالدرهم):
                  </label>
                  <input
                    type="number"
                    value={settings.freeShippingThreshold}
                    onChange={(e) => setSettings({ ...settings, freeShippingThreshold: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-800/20"
                  />
                  <span className="text-[11px] text-stone-400">الطلبات التي تتجاوز هذا المبلغ تحصل على توصيل مجاني تلقائياً.</span>
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    رقم الواتساب السريع (مع الرمز الدولي بدون +):
                  </label>
                  <input
                    type="text"
                    value={settings.whatsappNumber}
                    onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-800/20 dir-ltr text-left"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    رقم الهاتف الظاهر للزبناء:
                  </label>
                  <input
                    type="text"
                    value={settings.formattedPhone}
                    onChange={(e) => setSettings({ ...settings, formattedPhone: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-800/20 dir-ltr text-left"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    نص الشريط الإعلاني العلوي:
                  </label>
                  <input
                    type="text"
                    value={settings.announcementText}
                    onChange={(e) => setSettings({ ...settings, announcementText: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-800/20"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-emerald-800 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition-all shadow-sm disabled:opacity-50"
                  >
                    {isSubmitting ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 4: GOOGLE SHEETS SECONDARY / BACKUP DATABASE SYNC */}
          {activeTab === 'sheets-sync' && (
            <GoogleSheetsSyncDashboard
              products={products}
              orders={orders}
            />
          )}
        </div>
      </div>
    </div>
  );
};
