import React, { useState, useEffect, useMemo } from 'react';
import {
  Table,
  FileSpreadsheet,
  ExternalLink,
  RefreshCw,
  Plus,
  Search,
  Filter,
  Download,
  Phone,
  MessageCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  Eye,
  Check,
  ChevronDown,
  Sparkles,
  DollarSign,
  Package,
  Layers,
  Calendar,
  X,
  Link2,
} from 'lucide-react';
import { OrderRecord } from '../types';
import { useAuth } from '../lib/AuthContext';
import {
  createOrdersSpreadsheet,
  syncAllOrdersToSheet,
  getSavedSheetId,
  setSavedSheetId,
  getSavedLastSync,
  verifySpreadsheet,
  openSpreadsheetInNewTab,
  subscribeToCloudSheetConfig,
  getSpreadsheetUrl,
} from '../lib/googleSheetsService';
import { updateOrderStatus } from '../lib/productService';

interface OrdersDatabaseTableProps {
  orders: OrderRecord[];
  loading?: boolean;
  onRefreshOrders?: () => void;
}

export const OrdersDatabaseTable: React.FC<OrdersDatabaseTableProps> = ({
  orders,
  loading = false,
  onRefreshOrders,
}) => {
  const { currentUser, accessToken, signInWithGoogle } = useAuth();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'total_desc' | 'total_asc'>('date_desc');

  // Google Sheets Integration State
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(getSavedSheetId());
  const [spreadsheetTitle, setSpreadsheetTitle] = useState<string>('طلبيات باقة وورد بالقنيطرة');
  const [lastSync, setLastSync] = useState<string | null>(getSavedLastSync());
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [customSheetInput, setCustomSheetInput] = useState('');
  const [showConnectSheetModal, setShowConnectSheetModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Subscribe to Cloud Sheet Config
  useEffect(() => {
    const unsub = subscribeToCloudSheetConfig((cloudInfo) => {
      if (cloudInfo) {
        setSpreadsheetId(cloudInfo.id);
        setSpreadsheetTitle(cloudInfo.title);
        if (cloudInfo.lastSyncedAt) {
          try {
            setLastSync(new Date(cloudInfo.lastSyncedAt).toLocaleTimeString('ar-MA', { hour: '2-digit', minute: '2-digit' }));
          } catch {
            setLastSync(cloudInfo.lastSyncedAt);
          }
        }
      }
    });
    return () => unsub();
  }, []);

  // Selected Order for Detail Modal
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);

  // Verify and load sheet title if sheet ID exists and we have a token
  useEffect(() => {
    if (spreadsheetId && accessToken) {
      verifySpreadsheet(accessToken, spreadsheetId)
        .then((info) => {
          if (info?.title) setSpreadsheetTitle(info.title);
        })
        .catch(() => {
          // Token might need re-auth or sheet ID is invalid
        });
    }
  }, [spreadsheetId, accessToken]);

  // Statistics calculation
  const stats = useMemo(() => {
    const totalCount = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const pendingCount = orders.filter((o) => o.status === 'pending').length;
    const processingCount = orders.filter((o) => o.status === 'processing').length;
    const deliveringCount = orders.filter((o) => o.status === 'out_for_delivery').length;
    const deliveredCount = orders.filter((o) => o.status === 'delivered').length;

    return {
      totalCount,
      totalRevenue,
      pendingCount,
      processingCount,
      deliveringCount,
      deliveredCount,
    };
  }, [orders]);

  // Filter and sort orders
  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => {
        // Status filter
        if (statusFilter !== 'all' && order.status !== statusFilter) {
          return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesNum = order.orderNumber.toLowerCase().includes(q);
          const matchesName = (order.recipientName || '').toLowerCase().includes(q);
          const matchesPhone = (order.recipientPhone || '').includes(q);
          const matchesDistrict = (order.district || order.city || '').toLowerCase().includes(q);
          const matchesProducts = (order.items || []).some((i) =>
            i.productName.toLowerCase().includes(q)
          );

          if (!matchesNum && !matchesName && !matchesPhone && !matchesDistrict && !matchesProducts) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date_desc') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === 'date_asc') {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (sortBy === 'total_desc') {
          return (b.total || 0) - (a.total || 0);
        }
        if (sortBy === 'total_asc') {
          return (a.total || 0) - (b.total || 0);
        }
        return 0;
      });
  }, [orders, statusFilter, searchQuery, sortBy]);

  // Google Sheets Action: Create New Spreadsheet
  const handleCreateNewSheet = async () => {
    let tokenToUse = accessToken;
    if (!tokenToUse) {
      try {
        const signRes = await signInWithGoogle();
        tokenToUse = signRes.accessToken;
      } catch {
        setSyncFeedback({
          type: 'error',
          message: 'يرجى تسجيل الدخول بحساب Google أولاً لمنح صلاحية إنشاء جدول Google Sheets.',
        });
        return;
      }
    }

    if (!tokenToUse) {
      setSyncFeedback({
        type: 'error',
        message: 'تعذر الحصول على رمز تصريح Google. يرجى إعادة المحاولة.',
      });
      return;
    }

    setIsCreatingSheet(true);
    setSyncFeedback(null);

    try {
      const sheetInfo = await createOrdersSpreadsheet(tokenToUse);
      setSpreadsheetId(sheetInfo.id);
      setSpreadsheetTitle(sheetInfo.title);

      // Now sync all existing orders into this new sheet
      if (orders.length > 0) {
        await syncAllOrdersToSheet(tokenToUse, sheetInfo.id, orders);
      }

      const syncTime = new Date().toLocaleTimeString('ar-MA', { hour: '2-digit', minute: '2-digit' });
      setLastSync(syncTime);
      setSyncFeedback({
        type: 'success',
        message: `تم إنشاء جدول Google Sheets الحقيقي بنجاح في حسابك Google Drive ومزامنة (${orders.length}) طلبية! يتم الآن فتحه في نافذة جديدة...`,
      });

      // Directly open the external Google Sheet
      openSpreadsheetInNewTab(sheetInfo.id);
    } catch (err: any) {
      console.error('Error creating Google Sheet:', err);
      setSyncFeedback({
        type: 'error',
        message: err.message || 'حدث خطأ أثناء إنشاء جدول Google Sheets.',
      });
    } finally {
      setIsCreatingSheet(false);
    }
  };

  // Google Sheets Action: Sync existing orders to current sheet
  const handleSyncToSheet = async () => {
    if (!spreadsheetId) {
      setSyncFeedback({
        type: 'error',
        message: 'لا يوجد جدول مرتبط حالياً. انقر على "إنشاء جدول Google Sheets الآن".',
      });
      return;
    }

    let tokenToUse = accessToken;
    if (!tokenToUse) {
      try {
        const signRes = await signInWithGoogle();
        tokenToUse = signRes.accessToken;
      } catch {
        setSyncFeedback({
          type: 'error',
          message: 'يرجى تسجيل الدخول بحساب Google لتحديث جدول الطلبات.',
        });
        return;
      }
    }

    if (!tokenToUse) return;

    // Prompt user confirmation before updating spreadsheet data
    const confirmed = window.confirm(
      `هل تريد مزامنة وتحديث جدول Google Sheets (${orders.length} طلبات)؟ سيتم تحديث الصفوف بأحدث البيانات.`
    );
    if (!confirmed) return;

    setIsSyncing(true);
    setSyncFeedback(null);

    try {
      const res = await syncAllOrdersToSheet(tokenToUse, spreadsheetId, orders);
      const syncTime = new Date().toLocaleTimeString('ar-MA', { hour: '2-digit', minute: '2-digit' });
      setLastSync(syncTime);
      setSyncFeedback({
        type: 'success',
        message: `تمت مزامنة (${res.rowsSynced}) طلبات بنجاح مع جدول Google Sheets في ${syncTime}!`,
      });
    } catch (err: any) {
      console.error('Error syncing to Google Sheet:', err);
      setSyncFeedback({
        type: 'error',
        message: err.message || 'فشلت المزامنة. تأكد من أن حساب Google مصرح له بتعديل هذا الملف.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Google Sheets Action: Connect an existing Google Sheet by ID or URL
  const handleConnectExistingSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSheetInput.trim()) return;

    let extractedId = customSheetInput.trim();
    // Check if user pasted full URL: https://docs.google.com/spreadsheets/d/12345/edit
    const match = extractedId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      extractedId = match[1];
    }

    setSpreadsheetId(extractedId);
    setSavedSheetId(extractedId);
    setShowConnectSheetModal(false);
    setCustomSheetInput('');

    setSyncFeedback({
      type: 'success',
      message: 'تم ربط معرّف جدول Google Sheets بنجاح! يمكنك المزامنة الآن.',
    });
  };

  // Export orders to CSV
  const handleExportCSV = () => {
    if (orders.length === 0) return;

    const headers = [
      'Order Number',
      'Created At',
      'Customer Name',
      'Phone',
      'City',
      'District',
      'Address',
      'Products',
      'Total MAD',
      'Payment Method',
      'Status',
      'Delivery Time',
      'Card Message',
    ];

    const rows = orders.map((o) => [
      `"${o.orderNumber}"`,
      `"${o.createdAt}"`,
      `"${o.recipientName}"`,
      `"${o.recipientPhone}"`,
      `"${o.city}"`,
      `"${o.district || ''}"`,
      `"${(o.address || '').replace(/"/g, '""')}"`,
      `"${(o.items || []).map((i) => `${i.productName} (x${i.quantity})`).join(', ')}"`,
      o.total,
      `"${o.paymentMethod}"`,
      `"${o.status}"`,
      `"${o.deliveryDate || ''} - ${o.deliveryTime || ''}"`,
      `"${(o.cardMessage || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `baqa_ward_orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle status update directly
  const handleStatusChange = async (orderId: string, newStatus: any) => {
    try {
      await updateOrderStatus(orderId, newStatus);
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>تم التسليم بنجاح</span>
          </span>
        );
      case 'out_for_delivery':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-200 animate-pulse">
            <Truck className="w-3.5 h-3.5 text-sky-600" />
            <span>جاري التوصيل بالقنيطرة</span>
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>جاري التنسيق والتجهيز</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <X className="w-3.5 h-3.5 text-rose-600" />
            <span>ملغي</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-stone-100 text-stone-800 border border-stone-300">
            <Clock className="w-3.5 h-3.5 text-stone-500" />
            <span>قيد المراجعة</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 font-cairo text-stone-800" dir="rtl">
      {/* 1. TOP GOOGLE SHEETS CLOUD DATABASE INTEGRATION BANNER */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-stone-900 text-white p-5 sm:p-7 rounded-3xl shadow-2xl border border-emerald-700/50 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="w-12 h-12 rounded-2xl bg-emerald-800 border border-emerald-500/50 flex items-center justify-center text-emerald-200 shadow-lg">
                <FileSpreadsheet className="w-6 h-6 text-emerald-300" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
                  <span>جدول الطلبيات الحي على Google Sheets</span>
                  <span className="bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-400 shadow-sm flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping inline-block"></span>
                    <span>Live مباشر</span>
                  </span>
                </h2>
                <p className="text-xs sm:text-sm text-emerald-200/90 font-medium">
                  جدول سحابي حقيقي على Google Drive الخاص بك - كل طلبية جديدة من المتجر تُسجل تلقائياً في صف مستقل
                </p>
              </div>
            </div>

            {/* Connection Status & Sheet Info */}
            <div className="flex items-center gap-3 text-xs text-emerald-100/90 pt-1 flex-wrap">
              {spreadsheetId ? (
                <>
                  <span className="flex items-center gap-1.5 bg-emerald-800/90 border border-emerald-600 px-3 py-1.5 rounded-xl font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>الجدول متصل:</span>
                    <strong className="text-white font-mono">{spreadsheetTitle || spreadsheetId.slice(0, 16)}</strong>
                  </span>

                  <button
                    onClick={() => {
                      if (spreadsheetId) {
                        navigator.clipboard.writeText(getSpreadsheetUrl(spreadsheetId));
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 2500);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 bg-emerald-950/60 hover:bg-emerald-800 text-emerald-200 px-3 py-1.5 rounded-xl border border-emerald-700/60 transition-colors text-xs font-semibold"
                    title="نسخ رابط الجدول لمشاركته مع فريق التوصيل"
                  >
                    <span>{copiedLink ? 'تم نسخ الرابط ✓' : 'نسخ رابط الجدول 📋'}</span>
                  </button>

                  {lastSync && (
                    <span className="text-[11px] text-emerald-300 flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5" />
                      آخر مزامنة: {lastSync}
                    </span>
                  )}
                </>
              ) : (
                <div className="text-xs bg-amber-500/20 text-amber-200 border border-amber-500/40 px-3.5 py-2 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-300 shrink-0" />
                  <span>لم يتم إنشاء جدول Google Sheets بعد. انقر على الزر الأخضر لإنشائه فوراً في Google Drive الخاص بك!</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons for Google Sheets */}
          <div className="flex items-center gap-3 flex-wrap">
            {spreadsheetId ? (
              <>
                <a
                  id="open-live-google-sheets-btn"
                  href={getSpreadsheetUrl(spreadsheetId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 bg-white hover:bg-emerald-50 text-emerald-950 font-black text-sm px-5 py-3 rounded-2xl shadow-xl transition-all transform hover:-translate-y-0.5 active:scale-95"
                >
                  <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
                  <span>فتح الجدول مباشرة في Google Sheets ↗</span>
                </a>

                <button
                  id="sync-google-sheets-btn"
                  onClick={handleSyncToSheet}
                  disabled={isSyncing}
                  className="flex items-center gap-2 bg-emerald-700/90 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold text-xs sm:text-sm px-4 py-3 rounded-2xl shadow-md border border-emerald-600 transition-all active:scale-95"
                  title="تحديث ومزامنة كافة الطلبيات في حال عدم ظهور أحدها"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'جاري المزامنة...' : 'مزامنة الطلبات'}</span>
                </button>
              </>
            ) : (
              <button
                id="create-google-sheets-btn"
                onClick={handleCreateNewSheet}
                disabled={isCreatingSheet}
                className="flex items-center gap-2.5 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-sm px-6 py-3.5 rounded-2xl shadow-xl transition-all transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-50"
              >
                <Plus className="w-5 h-5" />
                <span>{isCreatingSheet ? 'جاري إنشاء الجدول في Google Drive...' : '⚡ إنشاء جدول Google Sheets الآن'}</span>
              </button>
            )}

            <button
              onClick={() => setShowConnectSheetModal(true)}
              className="px-3.5 py-3 bg-white/10 hover:bg-white/20 text-emerald-100 rounded-2xl text-xs font-semibold border border-white/15 transition-colors"
              title="ربط معرف جدول موجود مسبقاً"
            >
              <Link2 className="w-4 h-4 inline ml-1" />
              <span>معرّف يدوي</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {syncFeedback && (
          <div
            className={`mt-4 p-3 rounded-2xl text-xs flex items-center justify-between gap-2 border ${
              syncFeedback.type === 'success'
                ? 'bg-emerald-800/80 border-emerald-600 text-emerald-100'
                : 'bg-rose-900/80 border-rose-700 text-rose-100'
            }`}
          >
            <div className="flex items-center gap-2">
              {syncFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-300 shrink-0" />
              )}
              <span>{syncFeedback.message}</span>
            </div>
            <button
              onClick={() => setSyncFeedback(null)}
              className="text-white/70 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* 2. DATABASE STATS METRICS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-stone-400 font-bold block mb-0.5">إجمالي الطلبيات</span>
            <span className="text-xl sm:text-2xl font-black text-stone-900 font-sans">
              {stats.totalCount}
            </span>
            <span className="text-[10px] text-emerald-700 block mt-0.5">طلب مسجل في النظام</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-stone-100 text-stone-700 flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-stone-400 font-bold block mb-0.5">مبيعات الطلبيات</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-950 font-cairo">
              {stats.totalRevenue}{' '}
              <span className="text-xs font-bold text-stone-500">درهم</span>
            </span>
            <span className="text-[10px] text-stone-400 block mt-0.5">المجموع الكلي</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-stone-400 font-bold block mb-0.5">قيد المراجعة / التجهيز</span>
            <span className="text-xl sm:text-2xl font-black text-amber-800 font-sans">
              {stats.pendingCount + stats.processingCount}
            </span>
            <span className="text-[10px] text-amber-700 block mt-0.5">تتطلب التنسيق والتأكيد</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-stone-400 font-bold block mb-0.5">تم التوصيل والتسليم</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-800 font-sans">
              {stats.deliveredCount}
            </span>
            <span className="text-[10px] text-emerald-600 block mt-0.5">
              {stats.totalCount > 0 ? Math.round((stats.deliveredCount / stats.totalCount) * 100) : 0}% نسبة الإنجاز
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. DATABASE TOOLBAR: SEARCH, STATUS TABS, SORT, EXPORT */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-3">
        {/* Search & Actions Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث برقم الطلب، اسم الزبون، الهاتف، أو حي القنيطرة..."
              className="w-full pl-4 pr-10 py-2.5 bg-stone-50 hover:bg-stone-100/60 focus:bg-white text-xs sm:text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800 transition-all placeholder:text-stone-400"
            />
            <Search className="w-4 h-4 text-stone-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort & Export Buttons */}
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs font-semibold px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none text-stone-700"
            >
              <option value="date_desc">الأحدث أولاً</option>
              <option value="date_asc">الأقدم أولاً</option>
              <option value="total_desc">الأعلى سعراً</option>
              <option value="total_asc">الأقل سعراً</option>
            </select>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-colors"
              title="تصدير ملف CSV"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">تصدير CSV</span>
            </button>

            {onRefreshOrders && (
              <button
                onClick={onRefreshOrders}
                className="p-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl transition-colors"
                title="تحديث البيانات"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 border-t border-stone-100">
          {[
            { id: 'all', label: 'جميع الطلبات', count: stats.totalCount },
            { id: 'pending', label: 'قيد المراجعة', count: stats.pendingCount },
            { id: 'processing', label: 'جاري التنسيق', count: stats.processingCount },
            { id: 'out_for_delivery', label: 'جاري التوصيل بالقنيطرة', count: stats.deliveringCount },
            { id: 'delivered', label: 'تم التسليم', count: stats.deliveredCount },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                statusFilter === tab.id
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-stone-100 hover:bg-stone-200/70 text-stone-600'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  statusFilter === tab.id ? 'bg-emerald-700 text-emerald-100' : 'bg-stone-200 text-stone-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 4. MAIN ORDERS DATABASE TABLE */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-16 space-y-3">
            <RefreshCw className="w-8 h-8 text-emerald-700 animate-spin mx-auto" />
            <p className="text-sm font-bold text-stone-600">جاري تحميل جدول الطلبيات...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-16 px-4 space-y-3">
            <div className="w-14 h-14 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
              <Package className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-stone-800">لا توجد طلبيات تطابق هذا البحث</h4>
            <p className="text-xs text-stone-400 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'all'
                ? 'جرب إزالة معايير البحث أو اختيار فلتر آخر.'
                : 'عندما يُكمل أي زبون طلبه في المتجر، سيظهر في هذا الجدول فوراً ومزامناً مع Google Sheets.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs sm:text-sm border-collapse">
              <thead className="bg-stone-100/80 text-stone-600 font-bold border-b border-stone-200 select-none">
                <tr>
                  <th className="p-3.5 whitespace-nowrap">رقم الطلب</th>
                  <th className="p-3.5 whitespace-nowrap">التاريخ والوقت</th>
                  <th className="p-3.5 whitespace-nowrap">الزبون / المستلم</th>
                  <th className="p-3.5 whitespace-nowrap">حي التوصيل بالقنيطرة</th>
                  <th className="p-3.5 whitespace-nowrap">الباقات والزهور</th>
                  <th className="p-3.5 whitespace-nowrap">المبلغ</th>
                  <th className="p-3.5 whitespace-nowrap">الدفع</th>
                  <th className="p-3.5 whitespace-nowrap">حالة الطلب</th>
                  <th className="p-3.5 text-center whitespace-nowrap">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-emerald-50/40 transition-colors group cursor-pointer"
                    onClick={() => setSelectedOrder(order)}
                  >
                    {/* Order Number */}
                    <td className="p-3.5 whitespace-nowrap">
                      <span className="font-extrabold text-emerald-950 font-mono text-xs bg-emerald-50 border border-emerald-200/80 px-2 py-1 rounded-lg">
                        {order.orderNumber}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="p-3.5 whitespace-nowrap text-stone-500 text-xs">
                      {order.createdAt ? (
                        <div>
                          <div>
                            {new Date(order.createdAt).toLocaleDateString('ar-MA', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </div>
                          <div className="text-[10px] text-stone-400 font-mono">
                            {new Date(order.createdAt).toLocaleTimeString('ar-MA', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>

                    {/* Customer & Phone */}
                    <td className="p-3.5">
                      <div className="font-bold text-stone-900">{order.recipientName}</div>
                      <div className="flex items-center gap-2 text-stone-400 text-xs mt-0.5">
                        <span className="dir-ltr text-stone-600 font-mono text-[11px]">
                          {order.recipientPhone}
                        </span>
                        <a
                          href={`https://wa.me/${order.recipientPhone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-emerald-600 hover:text-emerald-700"
                          title="واتساب مباشر للزبون"
                        >
                          <MessageCircle className="w-3.5 h-3.5 fill-current" />
                        </a>
                      </div>
                    </td>

                    {/* Delivery Area */}
                    <td className="p-3.5">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 text-xs font-semibold">
                        {order.district || order.city || 'القنيطرة'}
                      </span>
                      {order.address && (
                        <div className="text-[11px] text-stone-400 truncate max-w-[160px] mt-0.5" title={order.address}>
                          {order.address}
                        </div>
                      )}
                    </td>

                    {/* Products list */}
                    <td className="p-3.5 max-w-[200px]">
                      <div className="space-y-1">
                        {(order.items || []).map((item, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 text-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0"></span>
                            <span className="font-medium text-stone-800 truncate" title={item.productName}>
                              {item.productName}
                            </span>
                            <span className="text-stone-400 font-bold text-[10px]">
                              ×{item.quantity}
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>

                    {/* Total Amount */}
                    <td className="p-3.5 whitespace-nowrap">
                      <span className="font-black text-emerald-900 font-cairo text-sm">
                        {order.total} درهم
                      </span>
                    </td>

                    {/* Payment Method */}
                    <td className="p-3.5 whitespace-nowrap text-stone-600 text-xs">
                      {order.paymentMethod === 'cod' ? (
                        <span className="text-emerald-700 font-semibold">كاش عند الاستلام</span>
                      ) : (
                        <span>{order.paymentMethod}</span>
                      )}
                    </td>

                    {/* Status Dropdown */}
                    <td className="p-3.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className={`text-xs font-bold rounded-xl px-2.5 py-1.5 border focus:outline-none cursor-pointer transition-all ${
                          order.status === 'delivered'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : order.status === 'out_for_delivery'
                            ? 'bg-sky-50 text-sky-800 border-sky-300'
                            : order.status === 'processing'
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : order.status === 'cancelled'
                            ? 'bg-rose-50 text-rose-800 border-rose-300'
                            : 'bg-stone-50 text-stone-800 border-stone-300'
                        }`}
                      >
                        <option value="pending">قيد المراجعة</option>
                        <option value="processing">جاري التنسيق والتجهيز</option>
                        <option value="out_for_delivery">جاري التوصيل بالقنيطرة 🚚</option>
                        <option value="delivered">تم التسليم بنجاح ✓</option>
                        <option value="cancelled">ملغي</option>
                      </select>
                    </td>

                    {/* Action Buttons */}
                    <td className="p-3.5 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-1.5 text-stone-500 hover:text-emerald-900 hover:bg-stone-100 rounded-lg transition-colors"
                          title="عرض تفاصيل الطلب كاملة"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <a
                          href={`https://wa.me/${order.recipientPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                            `السلام عليكم أخي/أختي ${order.recipientName}، نتواصل معكم من متجر "باقة وورد" بمدينة القنيطرة لتأكيد توصيل باقة الأزهار للطلب رقم ${order.orderNumber} 🌸.`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="إرسال رسالة واتساب جاهزة"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. MODAL: ORDER FULL DETAILS PREVIEW */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 space-y-4 animate-scaleUp text-right">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <span className="text-xs text-stone-400 block">تفاصيل الطلبية</span>
                <h3 className="text-lg font-black text-stone-900 font-sans">
                  {selectedOrder.orderNumber}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/70 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-stone-400">اسم المستلم:</span>
                  <strong className="text-stone-800">{selectedOrder.recipientName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">الهاتف:</span>
                  <strong className="text-stone-900 dir-ltr font-mono">{selectedOrder.recipientPhone}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">العنوان بالقنيطرة:</span>
                  <span className="text-stone-800">{selectedOrder.district || selectedOrder.city}</span>
                </div>
                {selectedOrder.address && (
                  <div className="flex justify-between">
                    <span className="text-stone-400">العنوان التفصيلي:</span>
                    <span className="text-stone-800">{selectedOrder.address}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-stone-400">موعد التوصيل:</span>
                  <span className="text-stone-800 font-semibold">{selectedOrder.deliveryDate} ({selectedOrder.deliveryTime})</span>
                </div>
              </div>

              {/* Items */}
              <div>
                <span className="font-bold text-stone-700 block mb-1.5">الباقات المطلوبة:</span>
                <div className="space-y-1.5">
                  {(selectedOrder.items || []).map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-xl bg-stone-50 border border-stone-200"
                    >
                      <div className="flex items-center gap-2">
                        {item.productImage && (
                          <img
                            src={item.productImage}
                            alt={item.productName}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        )}
                        <div>
                          <div className="font-bold text-stone-900">{item.productName}</div>
                          <div className="text-[11px] text-stone-400">الكمية: {item.quantity}</div>
                        </div>
                      </div>
                      <span className="font-bold text-emerald-900">{item.price * item.quantity} درهم</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card Message */}
              {selectedOrder.cardMessage && (
                <div className="p-3 bg-rose-50/70 rounded-2xl border border-rose-100 text-xs">
                  <span className="font-bold text-rose-900 block mb-0.5">رسالة بطاقة الإهداء:</span>
                  <p className="text-stone-800 italic">"{selectedOrder.cardMessage}"</p>
                  {selectedOrder.senderName && (
                    <span className="text-[11px] text-rose-700 block mt-1">المرسل: {selectedOrder.senderName}</span>
                  )}
                </div>
              )}

              {/* Total & Status */}
              <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                <div>
                  <span className="text-xs text-stone-400 block">المبلغ الإجمالي:</span>
                  <span className="text-xl font-black text-emerald-950 font-cairo">
                    {selectedOrder.total} درهم
                  </span>
                </div>

                <div>
                  {statusBadge(selectedOrder.status)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL: CONNECT CUSTOM GOOGLE SHEET ID */}
      {showConnectSheetModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4 animate-scaleUp text-right">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
                <span>ربط جدول Google Sheets موجود</span>
              </h3>
              <button
                onClick={() => setShowConnectSheetModal(false)}
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConnectExistingSheet} className="space-y-3 text-xs sm:text-sm">
              <p className="text-stone-500 text-xs">
                الصق رابط جدول Google Sheets أو معرّفه (Spreadsheet ID) الذي ترغب في مزامنة الطلبات معه:
              </p>

              <input
                type="text"
                value={customSheetInput}
                onChange={(e) => setCustomSheetInput(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/... أو المعرّف مباشرة"
                className="w-full p-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-800/20 font-mono text-xs text-stone-800"
                dir="ltr"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConnectSheetModal(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={!customSheetInput.trim()}
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all"
                >
                  ربط الجدول
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
