/**
 * Google Sheets Secondary Database & Backup Service
 * Supports Products, Orders, Customers, and Categories
 */

export interface SheetHeaderDefinition {
  title: string;
  columns: string[];
}

export const REQUIRED_SHEETS: SheetHeaderDefinition[] = [
  {
    title: 'Products',
    columns: [
      'id',
      'name',
      'description',
      'category',
      'price',
      'old_price',
      'stock',
      'image',
      'images',
      'active',
      'created_at',
      'updated_at',
    ],
  },
  {
    title: 'Orders',
    columns: [
      'order_id',
      'customer_name',
      'phone',
      'email',
      'address',
      'city',
      'products',
      'subtotal',
      'delivery_fee',
      'total',
      'payment_method',
      'status',
      'created_at',
      'updated_at',
    ],
  },
  {
    title: 'Customers',
    columns: [
      'customer_id',
      'name',
      'phone',
      'email',
      'address',
      'city',
      'created_at',
      'updated_at',
    ],
  },
  {
    title: 'Categories',
    columns: [
      'id',
      'name',
      'description',
      'image',
      'active',
      'created_at',
      'updated_at',
    ],
  },
];

const SHEETS_BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets';

// Helper for Google API requests
async function googleFetch(
  url: string,
  accessToken: string,
  options: RequestInit = {}
) {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    let errorDetail = '';
    try {
      const errJson = await res.json();
      errorDetail = errJson.error?.message || JSON.stringify(errJson);
    } catch {
      errorDetail = await res.text();
    }
    throw new Error(`Google Sheets API error (${res.status}): ${errorDetail}`);
  }
  return res.json();
}

/**
 * 1. Create a new Google Spreadsheet named "Flower Store Database" with the 4 tabs and headers
 */
export async function createSpreadsheet(
  accessToken: string,
  title = 'Flower Store Database'
): Promise<{ id: string; spreadsheetUrl: string; title: string }> {
  const body = {
    properties: {
      title,
    },
    sheets: REQUIRED_SHEETS.map((s, idx) => ({
      properties: {
        sheetId: idx,
        title: s.title,
        gridProperties: {
          frozenRowCount: 1,
        },
      },
    })),
  };

  const createRes = await googleFetch(SHEETS_BASE_URL, accessToken, {
    method: 'POST',
    body: JSON.stringify(body),
  });

  const spreadsheetId = createRes.spreadsheetId;

  // Populate headers and apply styling to each tab
  await writeAllHeaders(accessToken, spreadsheetId);

  return {
    id: spreadsheetId,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
    title,
  };
}

/**
 * Write headers for all required sheets
 */
async function writeAllHeaders(accessToken: string, spreadsheetId: string) {
  const data = REQUIRED_SHEETS.map((s) => ({
    range: `${s.title}!A1:${getColumnLetter(s.columns.length)}1`,
    values: [s.columns],
  }));

  await googleFetch(
    `${SHEETS_BASE_URL}/${spreadsheetId}/values:batchUpdate`,
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data,
      }),
    }
  );

  // Format headers (bold text, emerald green background, white text)
  try {
    const meta = await googleFetch(
      `${SHEETS_BASE_URL}/${spreadsheetId}?fields=sheets.properties`,
      accessToken
    );

    const requests = (meta.sheets || []).map((sheet: any) => ({
      repeatCell: {
        range: {
          sheetId: sheet.properties.sheetId,
          startRowIndex: 0,
          endRowIndex: 1,
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.04, green: 0.35, blue: 0.25 }, // Emerald green
            textFormat: {
              foregroundColor: { red: 1, green: 1, blue: 1 },
              bold: true,
              fontSize: 10,
            },
            horizontalAlignment: 'CENTER',
          },
        },
        fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
      },
    }));

    await googleFetch(
      `${SHEETS_BASE_URL}/${spreadsheetId}:batchUpdate`,
      accessToken,
      {
        method: 'POST',
        body: JSON.stringify({ requests }),
      }
    );
  } catch (err) {
    console.warn('Google Sheets formatting note:', err);
  }
}

function getColumnLetter(colIndex: number): string {
  let letter = '';
  while (colIndex > 0) {
    const mod = (colIndex - 1) % 26;
    letter = String.fromCharCode(65 + mod) + letter;
    colIndex = Math.floor((colIndex - mod) / 26);
  }
  return letter || 'A';
}

/**
 * 2. Ensure all required sheets/tabs exist in the spreadsheet and have proper headers
 * without overwriting or deleting any existing rows.
 */
export async function ensureSheets(
  accessToken: string,
  spreadsheetId: string
): Promise<{ missingCreated: string[]; headersAdded: string[] }> {
  const meta = await googleFetch(
    `${SHEETS_BASE_URL}/${spreadsheetId}?fields=sheets.properties`,
    accessToken
  );

  const existingSheetTitles = new Set<string>(
    (meta.sheets || []).map((s: any) => s.properties?.title)
  );

  const missingCreated: string[] = [];
  const addSheetRequests: any[] = [];

  for (const reqSheet of REQUIRED_SHEETS) {
    if (!existingSheetTitles.has(reqSheet.title)) {
      missingCreated.push(reqSheet.title);
      addSheetRequests.push({
        addSheet: {
          properties: {
            title: reqSheet.title,
            gridProperties: { frozenRowCount: 1 },
          },
        },
      });
    }
  }

  if (addSheetRequests.length > 0) {
    await googleFetch(
      `${SHEETS_BASE_URL}/${spreadsheetId}:batchUpdate`,
      accessToken,
      {
        method: 'POST',
        body: JSON.stringify({ requests: addSheetRequests }),
      }
    );
  }

  // Check headers for each sheet
  const headersAdded: string[] = [];
  for (const reqSheet of REQUIRED_SHEETS) {
    try {
      const headerRange = `${reqSheet.title}!A1:${getColumnLetter(reqSheet.columns.length)}1`;
      const valRes = await googleFetch(
        `${SHEETS_BASE_URL}/${spreadsheetId}/values/${encodeURIComponent(headerRange)}`,
        accessToken
      );

      const existingHeaders = valRes.values?.[0] || [];
      if (existingHeaders.length === 0) {
        // Headers missing: add them
        await googleFetch(
          `${SHEETS_BASE_URL}/${spreadsheetId}/values/${encodeURIComponent(headerRange)}?valueInputOption=USER_ENTERED`,
          accessToken,
          {
            method: 'PUT',
            body: JSON.stringify({
              range: headerRange,
              majorDimension: 'ROWS',
              values: [reqSheet.columns],
            }),
          }
        );
        headersAdded.push(reqSheet.title);
      }
    } catch (err) {
      console.warn(`Error ensuring headers for ${reqSheet.title}:`, err);
    }
  }

  return { missingCreated, headersAdded };
}

// ----------------------------------------------------
// Entity Row Mappers
// ----------------------------------------------------

export function productToRow(product: any): any[] {
  return [
    product.id || '',
    product.name || product.arabicName || '',
    product.description || '',
    product.category || '',
    Number(product.price) || 0,
    product.originalPrice ? Number(product.originalPrice) : '',
    product.inStock !== false ? 100 : 0,
    product.image || '',
    Array.isArray(product.gallery) ? product.gallery.join(', ') : '',
    product.inStock !== false ? 'TRUE' : 'FALSE',
    product.createdAt || new Date().toISOString(),
    product.updatedAt || new Date().toISOString(),
  ];
}

export function orderToRow(order: any): any[] {
  const itemsSummary = Array.isArray(order.items)
    ? order.items.map((i: any) => `${i.productName || i.name} (×${i.quantity})`).join(' + ')
    : '';

  const total = Number(order.total) || 0;
  const deliveryFee = total >= 250 ? 0 : 25;
  const subtotal = Math.max(0, total - deliveryFee);

  return [
    order.orderNumber || order.id || '',
    order.recipientName || order.customer_name || '',
    order.recipientPhone || order.phone || '',
    order.email || '',
    `${order.district || ''} ${order.address || ''}`.trim(),
    order.city || 'القنيطرة',
    itemsSummary,
    subtotal,
    deliveryFee,
    total,
    order.paymentMethod || 'cod',
    order.status || 'pending',
    order.createdAt || new Date().toISOString(),
    order.updatedAt || new Date().toISOString(),
  ];
}

export function customerToRow(customer: any): any[] {
  return [
    customer.id || customer.customer_id || '',
    customer.name || '',
    customer.phone || '',
    customer.email || '',
    customer.address || '',
    customer.city || 'القنيطرة',
    customer.createdAt || customer.created_at || new Date().toISOString(),
    customer.updatedAt || customer.updated_at || new Date().toISOString(),
  ];
}

export function categoryToRow(category: any): any[] {
  return [
    category.id || category.key || '',
    category.name || '',
    category.description || '',
    category.image || '',
    'TRUE',
    category.createdAt || new Date().toISOString(),
    category.updatedAt || new Date().toISOString(),
  ];
}

// ----------------------------------------------------
// Entity CRUD Functions
// ----------------------------------------------------

/**
 * 3. Products: Append, Update, Delete
 */
export async function appendProduct(
  accessToken: string,
  spreadsheetId: string,
  product: any
) {
  const row = productToRow(product);
  return googleFetch(
    `${SHEETS_BASE_URL}/${spreadsheetId}/values/Products!A:L:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify({ values: [row] }),
    }
  );
}

export async function updateProduct(
  accessToken: string,
  spreadsheetId: string,
  product: any
) {
  const rowIndex = await findRowIndexById(accessToken, spreadsheetId, 'Products', product.id);
  const row = productToRow(product);

  if (rowIndex > 0) {
    return googleFetch(
      `${SHEETS_BASE_URL}/${spreadsheetId}/values/Products!A${rowIndex}:L${rowIndex}?valueInputOption=USER_ENTERED`,
      accessToken,
      {
        method: 'PUT',
        body: JSON.stringify({ values: [row] }),
      }
    );
  } else {
    return appendProduct(accessToken, spreadsheetId, product);
  }
}

export async function deleteProduct(
  accessToken: string,
  spreadsheetId: string,
  productId: string
) {
  const rowIndex = await findRowIndexById(accessToken, spreadsheetId, 'Products', productId);
  if (rowIndex > 0) {
    // Mark active column (Col J) as FALSE
    return googleFetch(
      `${SHEETS_BASE_URL}/${spreadsheetId}/values/Products!J${rowIndex}:J${rowIndex}?valueInputOption=USER_ENTERED`,
      accessToken,
      {
        method: 'PUT',
        body: JSON.stringify({ values: [['FALSE']] }),
      }
    );
  }
}

/**
 * 4. Orders: Append, Update
 */
export async function appendOrder(
  accessToken: string,
  spreadsheetId: string,
  order: any
) {
  const row = orderToRow(order);
  const appendRes = await googleFetch(
    `${SHEETS_BASE_URL}/${spreadsheetId}/values/Orders!A:N:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify({ values: [row] }),
    }
  );

  // Also auto-sync Customer record if present
  try {
    const customerPhone = order.recipientPhone || order.phone;
    if (customerPhone) {
      await updateCustomer(accessToken, spreadsheetId, {
        id: `cust-${customerPhone.replace(/[^0-9]/g, '')}`,
        name: order.recipientName || order.customer_name || 'زبون المتجر',
        phone: customerPhone,
        email: order.email || '',
        address: `${order.district || ''} ${order.address || ''}`.trim(),
        city: order.city || 'القنيطرة',
        createdAt: order.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.warn('Auto customer sync note:', err);
  }

  return appendRes;
}

export async function updateOrder(
  accessToken: string,
  spreadsheetId: string,
  order: any
) {
  const orderId = order.orderNumber || order.id;
  const rowIndex = await findRowIndexById(accessToken, spreadsheetId, 'Orders', orderId);
  const row = orderToRow(order);

  if (rowIndex > 0) {
    return googleFetch(
      `${SHEETS_BASE_URL}/${spreadsheetId}/values/Orders!A${rowIndex}:N${rowIndex}?valueInputOption=USER_ENTERED`,
      accessToken,
      {
        method: 'PUT',
        body: JSON.stringify({ values: [row] }),
      }
    );
  } else {
    return appendOrder(accessToken, spreadsheetId, order);
  }
}

/**
 * 5. Customers: Append, Update
 */
export async function appendCustomer(
  accessToken: string,
  spreadsheetId: string,
  customer: any
) {
  const row = customerToRow(customer);
  return googleFetch(
    `${SHEETS_BASE_URL}/${spreadsheetId}/values/Customers!A:H:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify({ values: [row] }),
    }
  );
}

export async function updateCustomer(
  accessToken: string,
  spreadsheetId: string,
  customer: any
) {
  const customerId = customer.id || customer.customer_id;
  let rowIndex = await findRowIndexById(accessToken, spreadsheetId, 'Customers', customerId);

  // If not found by ID, try finding by phone in column C
  if (rowIndex === -1 && customer.phone) {
    rowIndex = await findRowIndexByCol(accessToken, spreadsheetId, 'Customers', 'C', customer.phone);
  }

  const row = customerToRow(customer);
  if (rowIndex > 0) {
    return googleFetch(
      `${SHEETS_BASE_URL}/${spreadsheetId}/values/Customers!A${rowIndex}:H${rowIndex}?valueInputOption=USER_ENTERED`,
      accessToken,
      {
        method: 'PUT',
        body: JSON.stringify({ values: [row] }),
      }
    );
  } else {
    return appendCustomer(accessToken, spreadsheetId, customer);
  }
}

/**
 * 6. Categories: Append, Update
 */
export async function appendCategory(
  accessToken: string,
  spreadsheetId: string,
  category: any
) {
  const row = categoryToRow(category);
  return googleFetch(
    `${SHEETS_BASE_URL}/${spreadsheetId}/values/Categories!A:G:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify({ values: [row] }),
    }
  );
}

export async function updateCategory(
  accessToken: string,
  spreadsheetId: string,
  category: any
) {
  const catId = category.id || category.key;
  const rowIndex = await findRowIndexById(accessToken, spreadsheetId, 'Categories', catId);
  const row = categoryToRow(category);

  if (rowIndex > 0) {
    return googleFetch(
      `${SHEETS_BASE_URL}/${spreadsheetId}/values/Categories!A${rowIndex}:G${rowIndex}?valueInputOption=USER_ENTERED`,
      accessToken,
      {
        method: 'PUT',
        body: JSON.stringify({ values: [row] }),
      }
    );
  } else {
    return appendCategory(accessToken, spreadsheetId, category);
  }
}

// ----------------------------------------------------
// Utility Row Finders & Sync Helpers
// ----------------------------------------------------

async function findRowIndexById(
  accessToken: string,
  spreadsheetId: string,
  sheetTitle: string,
  targetId: string
): Promise<number> {
  return findRowIndexByCol(accessToken, spreadsheetId, sheetTitle, 'A', targetId);
}

async function findRowIndexByCol(
  accessToken: string,
  spreadsheetId: string,
  sheetTitle: string,
  columnLetter: string,
  targetValue: string
): Promise<number> {
  if (!targetValue) return -1;
  try {
    const res = await googleFetch(
      `${SHEETS_BASE_URL}/${spreadsheetId}/values/${sheetTitle}!${columnLetter}:${columnLetter}`,
      accessToken
    );
    const rows = res.values || [];
    const normalizedTarget = String(targetValue).trim().toLowerCase();
    for (let i = 0; i < rows.length; i++) {
      const cellVal = rows[i]?.[0];
      if (cellVal && String(cellVal).trim().toLowerCase() === normalizedTarget) {
        return i + 1; // 1-indexed row number
      }
    }
  } catch (err) {
    console.warn(`Error scanning column ${columnLetter} in ${sheetTitle}:`, err);
  }
  return -1;
}

/**
 * Test connection and return overview stats
 */
export async function testConnection(
  accessToken: string,
  spreadsheetId: string
): Promise<{
  connected: boolean;
  title: string;
  tabs: { name: string; rowsCount: number }[];
}> {
  const meta = await googleFetch(
    `${SHEETS_BASE_URL}/${spreadsheetId}?fields=properties.title,sheets.properties`,
    accessToken
  );

  const tabs: { name: string; rowsCount: number }[] = [];
  for (const sheet of meta.sheets || []) {
    const title = sheet.properties?.title || 'Unknown';
    let rowsCount = 0;
    try {
      const valRes = await googleFetch(
        `${SHEETS_BASE_URL}/${spreadsheetId}/values/${encodeURIComponent(title)}!A:A`,
        accessToken
      );
      rowsCount = Math.max(0, (valRes.values?.length || 1) - 1);
    } catch {
      rowsCount = 0;
    }
    tabs.push({ name: title, rowsCount });
  }

  return {
    connected: true,
    title: meta.properties?.title || 'Flower Store Database',
    tabs,
  };
}

/**
 * Full Batch Sync for all entities (Products, Orders, Customers, Categories)
 */
export async function syncAllEntities(
  accessToken: string,
  spreadsheetId: string,
  data: {
    products?: any[];
    orders?: any[];
    customers?: any[];
    categories?: any[];
  }
): Promise<{
  productsSynced: number;
  ordersSynced: number;
  customersSynced: number;
  categoriesSynced: number;
}> {
  await ensureSheets(accessToken, spreadsheetId);

  let productsSynced = 0;
  let ordersSynced = 0;
  let customersSynced = 0;
  let categoriesSynced = 0;

  if (data.products && data.products.length > 0) {
    const rows = data.products.map(productToRow);
    await googleFetch(
      `${SHEETS_BASE_URL}/${spreadsheetId}/values/Products!A2:${getColumnLetter(REQUIRED_SHEETS[0].columns.length)}?valueInputOption=USER_ENTERED`,
      accessToken,
      {
        method: 'PUT',
        body: JSON.stringify({ values: rows }),
      }
    );
    productsSynced = rows.length;
  }

  if (data.orders && data.orders.length > 0) {
    const rows = data.orders.map(orderToRow);
    await googleFetch(
      `${SHEETS_BASE_URL}/${spreadsheetId}/values/Orders!A2:${getColumnLetter(REQUIRED_SHEETS[1].columns.length)}?valueInputOption=USER_ENTERED`,
      accessToken,
      {
        method: 'PUT',
        body: JSON.stringify({ values: rows }),
      }
    );
    ordersSynced = rows.length;
  }

  // Derive and sync customers from orders or customers list
  const customersList = data.customers && data.customers.length > 0
    ? data.customers
    : deriveCustomersFromOrders(data.orders || []);

  if (customersList.length > 0) {
    const rows = customersList.map(customerToRow);
    await googleFetch(
      `${SHEETS_BASE_URL}/${spreadsheetId}/values/Customers!A2:${getColumnLetter(REQUIRED_SHEETS[2].columns.length)}?valueInputOption=USER_ENTERED`,
      accessToken,
      {
        method: 'PUT',
        body: JSON.stringify({ values: rows }),
      }
    );
    customersSynced = rows.length;
  }

  if (data.categories && data.categories.length > 0) {
    const rows = data.categories.map(categoryToRow);
    await googleFetch(
      `${SHEETS_BASE_URL}/${spreadsheetId}/values/Categories!A2:${getColumnLetter(REQUIRED_SHEETS[3].columns.length)}?valueInputOption=USER_ENTERED`,
      accessToken,
      {
        method: 'PUT',
        body: JSON.stringify({ values: rows }),
      }
    );
    categoriesSynced = rows.length;
  }

  return {
    productsSynced,
    ordersSynced,
    customersSynced,
    categoriesSynced,
  };
}

function deriveCustomersFromOrders(orders: any[]): any[] {
  const customerMap = new Map<string, any>();
  for (const o of orders) {
    const phone = o.recipientPhone || o.phone;
    if (!phone) continue;
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (!customerMap.has(cleanPhone)) {
      customerMap.set(cleanPhone, {
        id: `cust-${cleanPhone}`,
        name: o.recipientName || o.customer_name || 'زبون المتجر',
        phone: phone,
        email: o.email || '',
        address: `${o.district || ''} ${o.address || ''}`.trim(),
        city: o.city || 'القنيطرة',
        createdAt: o.createdAt || new Date().toISOString(),
        updatedAt: o.updatedAt || new Date().toISOString(),
      });
    }
  }
  return Array.from(customerMap.values());
}
