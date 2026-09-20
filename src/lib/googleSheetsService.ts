import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { OrderRecord } from '../types';

export interface GoogleSpreadsheetInfo {
  id: string;
  title: string;
  url: string;
  lastSyncedAt?: string;
}

export const SHEETS_COLUMNS = [
  'رقم الطلب',
  'تاريخ ووقت الطلب',
  'اسم الزبون / المستلم',
  'رقم الهاتف',
  'الحي / المنطقة بالقنيطرة',
  'العنوان التفصيلي',
  'باقات الورد والمنتجات',
  'المبلغ الإجمالي (درهم)',
  'طريقة الدفع',
  'موعد وفترة التوصيل',
  'رسالة الإهداء المرفقة',
  'اسم المرسل',
  'حالة الطلب',
];

const LOCAL_STORAGE_SHEET_KEY = 'baqa_ward_google_sheet_id';
const LOCAL_STORAGE_LAST_SYNC = 'baqa_ward_google_sheet_last_sync';
const SETTINGS_DOC_SHEETS = 'google_sheets';

export function getSpreadsheetUrl(id: string): string {
  return `https://docs.google.com/spreadsheets/d/${id}/edit`;
}

export function openSpreadsheetInNewTab(id: string) {
  const url = getSpreadsheetUrl(id);
  window.open(url, '_blank', 'noopener,noreferrer');
}

export function getSavedSheetId(): string | null {
  try {
    return localStorage.getItem(LOCAL_STORAGE_SHEET_KEY);
  } catch {
    return null;
  }
}

export function setSavedSheetId(id: string | null) {
  try {
    if (id) {
      localStorage.setItem(LOCAL_STORAGE_SHEET_KEY, id);
    } else {
      localStorage.removeItem(LOCAL_STORAGE_SHEET_KEY);
    }
  } catch {
    // ignore
  }
}

export function getSavedLastSync(): string | null {
  try {
    return localStorage.getItem(LOCAL_STORAGE_LAST_SYNC);
  } catch {
    return null;
  }
}

export function setSavedLastSync(dateStr: string) {
  try {
    localStorage.setItem(LOCAL_STORAGE_LAST_SYNC, dateStr);
  } catch {
    // ignore
  }
}

/**
 * Sync Google Sheet configuration to Firestore so it is shared across all devices
 */
export async function saveSheetConfigToCloud(info: GoogleSpreadsheetInfo) {
  try {
    setSavedSheetId(info.id);
    if (info.lastSyncedAt) {
      setSavedLastSync(info.lastSyncedAt);
    }
    const docRef = doc(db, 'settings', SETTINGS_DOC_SHEETS);
    await setDoc(docRef, {
      spreadsheetId: info.id,
      spreadsheetTitle: info.title,
      spreadsheetUrl: info.url,
      lastSyncedAt: info.lastSyncedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.warn('Could not save sheet config to Firestore:', err);
  }
}

/**
 * Subscribe to Google Sheet configuration from Firestore
 */
export function subscribeToCloudSheetConfig(
  onUpdate: (info: GoogleSpreadsheetInfo | null) => void
) {
  const docRef = doc(db, 'settings', SETTINGS_DOC_SHEETS);
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.spreadsheetId) {
          const info: GoogleSpreadsheetInfo = {
            id: data.spreadsheetId,
            title: data.spreadsheetTitle || 'طلبيات باقة وورد بالقنيطرة',
            url: data.spreadsheetUrl || getSpreadsheetUrl(data.spreadsheetId),
            lastSyncedAt: data.lastSyncedAt,
          };
          setSavedSheetId(info.id);
          if (info.lastSyncedAt) setSavedLastSync(info.lastSyncedAt);
          onUpdate(info);
          return;
        }
      }
      onUpdate(null);
    },
    (err) => {
      console.warn('Cloud sheet config subscription note:', err);
      const localId = getSavedSheetId();
      if (localId) {
        onUpdate({
          id: localId,
          title: 'طلبيات باقة وورد بالقنيطرة',
          url: getSpreadsheetUrl(localId),
          lastSyncedAt: getSavedLastSync() || undefined,
        });
      } else {
        onUpdate(null);
      }
    }
  );
}

export function orderToRow(order: OrderRecord): (string | number)[] {
  const itemsSummary = (order.items || [])
    .map((i) => `${i.productName} (x${i.quantity})`)
    .join(' + ');

  const statusLabel =
    {
      pending: 'قيد المراجعة',
      processing: 'جاري التنسيق والتجهيز',
      out_for_delivery: 'جاري التوصيل بالقنيطرة 🚚',
      delivered: 'تم التسليم بنجاح ✓',
      cancelled: 'ملغي ❌',
    }[order.status] || order.status;

  const paymentMethodMap: Record<string, string> = {
    cod: 'الدفع عند الاستلام (كاش بالقنيطرة)',
    card_cmi: 'بطاقة بنكية CMI',
    bank_transfer: 'تحويل بنكي',
    cashplus: 'كاش بلوس / وفاش كاش',
  };
  const paymentLabel = paymentMethodMap[order.paymentMethod] || order.paymentMethod;

  const formattedDate = order.createdAt
    ? new Date(order.createdAt).toLocaleString('fr-FR', {
        dateStyle: 'short',
        timeStyle: 'short',
      })
    : '';

  return [
    order.orderNumber,
    formattedDate,
    order.recipientName,
    order.recipientPhone,
    order.district || order.city || 'القنيطرة',
    order.address || '-',
    itemsSummary || '-',
    order.total,
    paymentLabel,
    `${order.deliveryDate || ''} (${order.deliveryTime || ''})`,
    order.cardMessage ? `"${order.cardMessage}"` : '-',
    order.senderName || '-',
    statusLabel,
  ];
}

/**
 * 1. Create a new Google Spreadsheet specifically styled for Baqa & Ward flower orders in Kenitra
 */
export async function createOrdersSpreadsheet(
  accessToken: string,
  customTitle?: string
): Promise<GoogleSpreadsheetInfo> {
  const title =
    customTitle || `باقة وورد - جدول طلبات وتوصيل القنيطرة (${new Date().getFullYear()})`;

  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: title,
        locale: 'ar_MA',
        timeZone: 'Africa/Casablanca',
      },
      sheets: [
        {
          properties: {
            sheetId: 0,
            title: 'طلبيات القنيطرة',
            gridProperties: {
              frozenRowCount: 1,
              columnCount: 15,
            },
            rightToLeft: true,
          },
        },
      ],
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`فشل إنشاء جدول Google Sheets: ${res.status} - ${errorText}`);
  }

  const data = await res.json();
  const spreadsheetId = data.spreadsheetId;
  const spreadsheetUrl = getSpreadsheetUrl(spreadsheetId);

  // Initialize header row with emerald styling and formatting
  await initializeSheetHeaders(accessToken, spreadsheetId, 'طلبيات القنيطرة');

  const info: GoogleSpreadsheetInfo = {
    id: spreadsheetId,
    title: title,
    url: spreadsheetUrl,
    lastSyncedAt: new Date().toISOString(),
  };

  setSavedSheetId(spreadsheetId);
  await saveSheetConfigToCloud(info);

  return info;
}

/**
 * Initialize headers and visual formatting on the Google Sheet
 */
async function initializeSheetHeaders(
  accessToken: string,
  spreadsheetId: string,
  sheetName: string = 'طلبيات القنيطرة'
) {
  // 1. Add header values
  const range = `${sheetName}!A1:M1`;
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      range
    )}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: range,
        majorDimension: 'ROWS',
        values: [SHEETS_COLUMNS],
      }),
    }
  );

  // 2. Format header row styling (Dark Emerald background #064E3B, white bold text)
  try {
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: 0,
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: SHEETS_COLUMNS.length,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: {
                    red: 0.023,
                    green: 0.305,
                    blue: 0.231, // #064E3B Emerald
                  },
                  horizontalAlignment: 'CENTER',
                  textFormat: {
                    foregroundColor: { red: 1.0, green: 1.0, blue: 1.0 },
                    fontSize: 11,
                    bold: true,
                  },
                  wrapStrategy: 'WRAP',
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,wrapStrategy)',
            },
          },
          // Set row height for header
          {
            updateDimensionProperties: {
              range: {
                sheetId: 0,
                dimension: 'ROWS',
                startIndex: 0,
                endIndex: 1,
              },
              properties: {
                pixelSize: 42,
              },
              fields: 'pixelSize',
            },
          },
        ],
      }),
    });
  } catch (err) {
    console.warn('Styling header row skipped or partially supported:', err);
  }
}

/**
 * 2. Sync all existing orders from the application/Firestore to Google Sheets
 */
export async function syncAllOrdersToSheet(
  accessToken: string,
  spreadsheetId: string,
  orders: OrderRecord[],
  sheetName: string = 'طلبيات القنيطرة'
): Promise<{ rowsSynced: number }> {
  if (!orders || orders.length === 0) {
    // If no orders, ensure at least headers exist
    await initializeSheetHeaders(accessToken, spreadsheetId, sheetName);
    return { rowsSynced: 0 };
  }

  // First ensure headers exist
  await initializeSheetHeaders(accessToken, spreadsheetId, sheetName);

  // Prepare full data matrix (Headers + All Rows)
  const rows = [SHEETS_COLUMNS, ...orders.map((o) => orderToRow(o))];

  const range = `${sheetName}!A1:M${rows.length}`;

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      range
    )}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: range,
        majorDimension: 'ROWS',
        values: rows,
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`فشلت مزامنة الطلبات مع Google Sheets: ${res.status} - ${err}`);
  }

  const now = new Date().toLocaleString('ar-MA', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
  setSavedLastSync(now);

  return { rowsSynced: orders.length };
}

/**
 * 3. Append a single new order into the Google Sheet automatically
 */
export async function appendOrderToSheet(
  accessToken: string,
  spreadsheetId: string,
  order: OrderRecord,
  sheetName: string = 'طلبيات القنيطرة'
): Promise<boolean> {
  const rowValues = orderToRow(order);
  const range = `${sheetName}!A:M`;

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      range
    )}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: range,
        majorDimension: 'ROWS',
        values: [rowValues],
      }),
    }
  );

  if (res.ok) {
    setSavedLastSync(new Date().toLocaleString('ar-MA'));
    return true;
  }
  return false;
}

/**
 * 4. Verify Google Spreadsheet accessibility & retrieve its metadata
 */
export async function verifySpreadsheet(
  accessToken: string,
  spreadsheetId: string
): Promise<{ title: string; sheets: string[] }> {
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error('تعذر الوصول إلى جدول Google Sheets. يرجى التأكد من المعرّف أو إعادة تسجيل الدخول.');
  }

  const data = await res.json();
  const sheets = (data.sheets || []).map((s: any) => s.properties?.title || 'Sheet1');

  return {
    title: data.properties?.title || 'جدول الطلبات',
    sheets,
  };
}
