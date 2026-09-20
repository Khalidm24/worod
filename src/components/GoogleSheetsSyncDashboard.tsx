import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  ExternalLink,
  Play,
  RotateCcw,
  Clock,
  Database,
  Users,
  ShoppingBag,
  Package,
  Layers,
  Sparkles,
  ArrowUpRight,
  Info,
} from 'lucide-react';
import { Product, OrderRecord, CustomerRecord, SyncQueueItem } from '../types';
import { useAuth } from '../lib/AuthContext';
import {
  getSavedSheetId,
  setSavedSheetId,
  getSpreadsheetUrl,
  getSavedLastSync,
  setSavedLastSync,
  saveSheetConfigToCloud,
  subscribeToCloudSheetConfig,
} from '../lib/googleSheetsService';
import {
  subscribeToSyncQueue,
  processQueueItem,
  retryAllFailedItems,
  clearCompletedQueue,
  removeQueueItem,
} from '../lib/syncQueueService';
import { CATEGORIES } from '../data/flowerData';

interface GoogleSheetsSyncDashboardProps {
  products: Product[];
  orders: OrderRecord[];
  customers?: CustomerRecord[];
}

export const GoogleSheetsSyncDashboard: React.FC<GoogleSheetsSyncDashboardProps> = ({
  products,
  orders,
  customers = [],
}) => {
  const { accessToken, currentUser, isAdmin, signInWithGoogle } = useAuth();

  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(getSavedSheetId());
  const [spreadsheetTitle, setSpreadsheetTitle] = useState<string>('Flower Store Database');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(getSavedLastSync());
  const [queueItems, setQueueItems] = useState<SyncQueueItem[]>([]);

  // Action states
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Filter for queue table
  const [queueFilter, setQueueFilter] = useState<'all' | 'pending' | 'failed' | 'completed'>('all');

  // Listen to Firestore cloud sheet config
  useEffect(() => {
    const unsub = subscribeToCloudSheetConfig((info) => {
      if (info?.id) {
        setSpreadsheetId(info.id);
        if (info.title) setSpreadsheetTitle(info.title);
        if (info.lastSyncedAt) setLastSyncTime(info.lastSyncedAt);
      }
    });
    return () => unsub();
  }, []);

  // Listen to sync queue in real-time
  useEffect(() => {
    const unsub = subscribeToSyncQueue((items) => {
      setQueueItems(items);
    });
    return () => unsub();
  }, []);

  // Stats calculation
  const pendingCount = queueItems.filter((i) => i.status === 'pending').length;
  const failedCount = queueItems.filter((i) => i.status === 'failed').length;
  const completedCount = queueItems.filter((i) => i.status === 'completed').length;

  const isConnected = Boolean(spreadsheetId);

  // 1. Initialize or connect "Flower Store Database"
  const handleInitializeSheet = async () => {
    if (!accessToken) {
      alert('يرجى تسجيل الدخول أولاً بواسطة حساب Google للمتابعة');
      signInWithGoogle();
      return;
    }

    setIsInitializing(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/sheets/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          spreadsheetId: spreadsheetId || undefined,
          title: 'Flower Store Database',
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'فشل إنشاء أو تهيئة ملف Google Sheets');
      }

      const data = await res.json();
      setSpreadsheetId(data.spreadsheetId);
      setSpreadsheetTitle(data.title || 'Flower Store Database');
      setSavedSheetId(data.spreadsheetId);

      await saveSheetConfigToCloud({
        id: data.spreadsheetId,
        title: data.title || 'Flower Store Database',
        url: data.spreadsheetUrl || getSpreadsheetUrl(data.spreadsheetId),
        lastSyncedAt: new Date().toISOString(),
      });

      setStatusMessage({
        type: 'success',
        text: 'تم إنشاء وتجهيز قاعدة بيانات Google Sheets مع التبويبات الأربعة بنجاح!',
      });
    } catch (err: any) {
      console.error(err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'حدث خطأ أثناء إعداد Google Sheets',
      });
    } finally {
      setIsInitializing(false);
    }
  };

  // 2. Test Connection
  const handleTestConnection = async () => {
    if (!spreadsheetId) {
      setStatusMessage({ type: 'error', text: 'لا يوجد معرف Google Sheet محدد بعد' });
      return;
    }
    if (!accessToken) {
      setStatusMessage({
        type: 'error',
        text: 'يلزم تسجيل الدخول بحساب Google لفحص الصلاحيات والاتصال',
      });
      return;
    }

    setIsTesting(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/sheets/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ spreadsheetId }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'فشل فحص الاتصال');
      }

      const data = await res.json();
      const tabsSummary = (data.tabs || [])
        .map((t: any) => `${t.name} (${t.rowsCount} صف)`)
        .join(' • ');

      setStatusMessage({
        type: 'success',
        text: `الاتصال ممتاز ومؤكد ✓ تم التحقق من التبويبات: ${tabsSummary}`,
      });
    } catch (err: any) {
      console.error(err);
      setStatusMessage({
        type: 'error',
        text: `فشل الاتصال: ${err.message || 'تأكد من صلاحيات حساب Google'}`,
      });
    } finally {
      setIsTesting(false);
    }
  };

  // 3. Full Batch Sync Now
  const handleSyncNow = async () => {
    if (!spreadsheetId) {
      setStatusMessage({ type: 'error', text: 'يرجى تهيئة أو ربط ملف Google Sheet أولاً' });
      return;
    }
    if (!accessToken) {
      setStatusMessage({ type: 'error', text: 'يرجى تسجيل الدخول بحساب Google' });
      return;
    }

    setIsSyncingAll(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/sheets/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          spreadsheetId,
          products,
          orders,
          customers,
          categories: CATEGORIES,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'فشلت المزامنة الكاملة');
      }

      const data = await res.json();
      const nowStr = new Date().toISOString();
      setLastSyncTime(nowStr);
      setSavedLastSync(nowStr);

      await saveSheetConfigToCloud({
        id: spreadsheetId,
        title: spreadsheetTitle,
        url: getSpreadsheetUrl(spreadsheetId),
        lastSyncedAt: nowStr,
      });

      setStatusMessage({
        type: 'success',
        text: `تمت المزامنة بنجاح! تم نسخ: ${data.productsSynced} باقة، ${data.ordersSynced} طلبية، ${data.customersSynced} زبون، و ${data.categoriesSynced} أقسام إلى Google Sheets.`,
      });
    } catch (err: any) {
      console.error(err);
      setStatusMessage({
        type: 'error',
        text: `خطأ في المزامنة: ${err.message || 'حدث خطأ غير متوقع'}`,
      });
    } finally {
      setIsSyncingAll(false);
    }
  };

  // 4. Retry Failed Syncs
  const handleRetryFailed = async () => {
    if (!spreadsheetId || !accessToken) {
      setStatusMessage({ type: 'error', text: 'يلزم تسجيل الدخول وربط Google Sheet' });
      return;
    }

    setIsRetrying(true);
    setStatusMessage(null);

    try {
      const result = await retryAllFailedItems(accessToken, spreadsheetId);
      setStatusMessage({
        type: result.failed === 0 ? 'success' : 'info',
        text: `اكتملت إعادة المحاولة: تم مزامنة ${result.succeeded} بنجاح، ومتبقي ${result.failed} للمحاولة لاحقاً.`,
      });
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ type: 'error', text: 'فشلت عملية إعادة المحاولة' });
    } finally {
      setIsRetrying(false);
    }
  };

  // Single item retry
  const handleRetrySingleItem = async (item: SyncQueueItem) => {
    if (!spreadsheetId || !accessToken) {
      alert('يلزم الاتصال وتسجيل الدخول بحساب Google');
      return;
    }
    await processQueueItem(item, accessToken, spreadsheetId);
  };

  // Filtered queue items
  const filteredQueue = queueItems.filter((item) => {
    if (queueFilter === 'all') return true;
    return item.status === queueFilter;
  });

  return (
    <div className="space-y-6 pb-8 text-right font-sans">
      {/* Top Banner Alert */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl flex items-start gap-3 border text-sm animate-fadeIn ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : statusMessage.type === 'error'
              ? 'bg-rose-50 text-rose-900 border-rose-200'
              : 'bg-amber-50 text-amber-900 border-amber-200'
          }`}
        >
          {statusMessage.type === 'success' && (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          )}
          {statusMessage.type === 'error' && (
            <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          {statusMessage.type === 'info' && (
            <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 font-medium">{statusMessage.text}</div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs opacity-60 hover:opacity-100 px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Primary Card: Connection Status & Spreadsheet Info */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-stone-900">
                  {spreadsheetTitle}
                </h3>
                {isConnected ? (
                  <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    متصل (Connected)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 bg-stone-100 text-stone-600 text-xs font-bold px-2.5 py-0.5 rounded-full">
                    غير متصل (Not Connected)
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                قاعدة بيانات احتياطية حية لمتجر باقة وورد بالقنيطرة (Products, Orders, Customers, Categories)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
            {spreadsheetId ? (
              <a
                href={getSpreadsheetUrl(spreadsheetId)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm active:scale-95"
              >
                <span>فتح Google Sheet</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            ) : (
              <button
                onClick={handleInitializeSheet}
                disabled={isInitializing}
                className="inline-flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-emerald-300" />
                <span>{isInitializing ? 'جاري الإنشاء والتهيئة...' : 'إنشاء وتفعيل Flower Store Database'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Spreadsheet Meta Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 text-xs">
          <div className="bg-stone-50 rounded-xl p-3 border border-stone-200/80">
            <span className="text-stone-400 font-medium block mb-1">معرف المستند (Spreadsheet ID):</span>
            <div className="flex items-center justify-between font-mono text-[11px] text-stone-800 truncate select-all">
              <span>{spreadsheetId || 'لم يتم الربط بعد — انقر فوق الزر أعلاه للإنشاء التلقائي'}</span>
            </div>
          </div>

          <div className="bg-stone-50 rounded-xl p-3 border border-stone-200/80 flex items-center justify-between">
            <div>
              <span className="text-stone-400 font-medium block mb-1">تاريخ آخر مزامنة:</span>
              <span className="font-bold text-stone-800">
                {lastSyncTime ? new Date(lastSyncTime).toLocaleString('ar-MA') : 'لا توجد مزامنة سابقة'}
              </span>
            </div>
            <Clock className="w-5 h-5 text-stone-400" />
          </div>
        </div>
      </div>

      {/* Metrics Grid: Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Pending Syncs */}
        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs flex flex-col justify-between">
          <span className="text-xs text-stone-500 font-medium">قيد الانتظار</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-stone-900">{pendingCount}</span>
            {pendingCount > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
            )}
          </div>
          <span className="text-[10px] text-amber-700 font-medium mt-1">Pending Syncs</span>
        </div>

        {/* Failed Syncs */}
        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs flex flex-col justify-between">
          <span className="text-xs text-stone-500 font-medium">المزامنات الفاشلة</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className={`text-2xl font-bold ${failedCount > 0 ? 'text-rose-600' : 'text-stone-900'}`}>
              {failedCount}
            </span>
            {failedCount > 0 && (
              <AlertTriangle className="w-4 h-4 text-rose-500" />
            )}
          </div>
          <span className="text-[10px] text-rose-700 font-medium mt-1">Failed Syncs</span>
        </div>

        {/* Synced Products */}
        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs flex flex-col justify-between">
          <span className="text-xs text-stone-500 font-medium">المنتجات والباقات</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-emerald-800">{products.length}</span>
            <Package className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-[10px] text-stone-400 font-medium mt-1">Products</span>
        </div>

        {/* Synced Orders */}
        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs flex flex-col justify-between">
          <span className="text-xs text-stone-500 font-medium">الطلبيات</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-emerald-800">{orders.length}</span>
            <ShoppingBag className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-[10px] text-stone-400 font-medium mt-1">Orders</span>
        </div>

        {/* Synced Customers */}
        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs flex flex-col justify-between">
          <span className="text-xs text-stone-500 font-medium">الزبائن</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-emerald-800">
              {customers.length > 0 ? customers.length : Math.max(orders.length, 1)}
            </span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-[10px] text-stone-400 font-medium mt-1">Customers</span>
        </div>

        {/* Synced Categories */}
        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs flex flex-col justify-between">
          <span className="text-xs text-stone-500 font-medium">الأقسام والتبويبات</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-emerald-800">{CATEGORIES.length}</span>
            <Layers className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-[10px] text-stone-400 font-medium mt-1">Categories</span>
        </div>
      </div>

      {/* Action Buttons Bar */}
      <div className="bg-stone-50 rounded-2xl border border-stone-200 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Test Connection Button */}
          <button
            onClick={handleTestConnection}
            disabled={isTesting || !spreadsheetId}
            className="flex items-center gap-2 bg-white hover:bg-stone-100 text-stone-800 text-xs font-bold px-3.5 py-2 rounded-xl border border-stone-300 transition-all shadow-2xs active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-emerald-700' : 'text-stone-600'}`} />
            <span>{isTesting ? 'جاري الفحص...' : 'فحص الاتصال (Test Connection)'}</span>
          </button>

          {/* Sync Now Button */}
          <button
            onClick={handleSyncNow}
            disabled={isSyncingAll || !spreadsheetId}
            className="flex items-center gap-2 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 ${isSyncingAll ? 'animate-spin' : ''}`} />
            <span>{isSyncingAll ? 'جاري المزامنة...' : 'مزامنة فورية الآن (Sync Now)'}</span>
          </button>

          {/* Retry Failed Syncs Button */}
          {failedCount > 0 && (
            <button
              onClick={handleRetryFailed}
              disabled={isRetrying}
              className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
              <span>{isRetrying ? 'جاري المحاولة...' : `إعادة محاولة المزامنات الفاشلة (${failedCount})`}</span>
            </button>
          )}
        </div>

        {spreadsheetId && (
          <a
            href={getSpreadsheetUrl(spreadsheetId)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-emerald-800 hover:text-emerald-700 flex items-center gap-1 hover:underline"
          >
            <span>فتح جدول الإكسيل في Google Sheets</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      {/* Sync Queue Table Section */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3 bg-stone-50/50">
          <div>
            <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-700" />
              <span>طابور المزامنة التلقائية (Sync Queue)</span>
              <span className="text-xs font-normal text-stone-500">
                ({filteredQueue.length} عملية)
              </span>
            </h4>
            <p className="text-[11px] text-stone-500 mt-0.5">
              يتم إرسال العمليات تلقائياً في الخلفية بدون أي تأثير على سرعة المتجر أو تجربة الزبون.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter Tabs */}
            <div className="bg-stone-100 p-0.5 rounded-xl flex items-center text-[11px] font-bold">
              <button
                onClick={() => setQueueFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  queueFilter === 'all'
                    ? 'bg-white text-stone-900 shadow-2xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                الكل ({queueItems.length})
              </button>
              <button
                onClick={() => setQueueFilter('pending')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  queueFilter === 'pending'
                    ? 'bg-white text-amber-900 shadow-2xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                معلقة ({pendingCount})
              </button>
              <button
                onClick={() => setQueueFilter('failed')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  queueFilter === 'failed'
                    ? 'bg-white text-rose-900 shadow-2xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                فاشلة ({failedCount})
              </button>
              <button
                onClick={() => setQueueFilter('completed')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  queueFilter === 'completed'
                    ? 'bg-white text-emerald-900 shadow-2xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                ناجحة ({completedCount})
              </button>
            </div>

            {completedCount > 0 && (
              <button
                onClick={clearCompletedQueue}
                title="حذف العمليات المكتملة من السجل"
                className="text-[11px] text-stone-500 hover:text-rose-700 px-2 py-1 rounded-lg hover:bg-stone-200 transition-colors"
              >
                مسح المكتملة
              </button>
            )}
          </div>
        </div>

        {/* Table Content */}
        {filteredQueue.length === 0 ? (
          <div className="p-8 text-center text-stone-400 text-xs">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-70" />
            <p className="font-bold text-stone-700">لا توجد عمليات في طابور المزامنة حالياً</p>
            <p className="text-stone-400 mt-1">
              جميع التحديثات والطلبيات والمنتجات متزامنة بالكامل مع قاعدة البيانات.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead className="bg-stone-50 text-stone-500 font-bold border-b border-stone-200">
                <tr>
                  <th className="p-3">الكيان</th>
                  <th className="p-3">العملية</th>
                  <th className="p-3">المعرف (ID)</th>
                  <th className="p-3">الحالة</th>
                  <th className="p-3">المحاولات</th>
                  <th className="p-3">الخطأ الأخير</th>
                  <th className="p-3">الوقت</th>
                  <th className="p-3 text-center">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredQueue.slice(0, 50).map((item) => {
                  const entityLabels: Record<string, string> = {
                    product: 'منتج / باقة',
                    order: 'طلبية زبون',
                    customer: 'زبون',
                    category: 'قسم',
                  };

                  const operationLabels: Record<string, string> = {
                    create: 'إضافة جديدة',
                    update: 'تحديث',
                    delete: 'حذف',
                  };

                  return (
                    <tr key={item.id} className="hover:bg-stone-50/80 transition-colors">
                      <td className="p-3 font-bold text-stone-800">
                        {entityLabels[item.entity_type] || item.entity_type}
                      </td>
                      <td className="p-3">
                        <span className="font-medium text-stone-600">
                          {operationLabels[item.operation] || item.operation}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-[11px] text-stone-500 truncate max-w-[120px]">
                        {item.entity_id}
                      </td>
                      <td className="p-3">
                        {item.status === 'completed' && (
                          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" />
                            ناجحة
                          </span>
                        )}
                        {item.status === 'failed' && (
                          <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            <XCircle className="w-3 h-3" />
                            فاشلة
                          </span>
                        )}
                        {item.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            <Clock className="w-3 h-3" />
                            معلقة
                          </span>
                        )}
                        {item.status === 'processing' && (
                          <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            جاري المعالجة
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-mono text-stone-600">
                        {item.attempts || 0}
                      </td>
                      <td className="p-3 text-[11px] text-rose-600 max-w-[200px] truncate" title={item.last_error}>
                        {item.last_error || '—'}
                      </td>
                      <td className="p-3 text-[10px] text-stone-400">
                        {new Date(item.created_at).toLocaleTimeString('ar-MA', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {item.status !== 'completed' && (
                            <button
                              onClick={() => handleRetrySingleItem(item)}
                              title="إعادة محاولة المزامنة الآن"
                              className="p-1 hover:bg-stone-200 text-stone-600 hover:text-emerald-800 rounded-md transition-colors"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => removeQueueItem(item.id)}
                            title="حذف من الطابور"
                            className="p-1 hover:bg-rose-100 text-stone-400 hover:text-rose-700 rounded-md transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
