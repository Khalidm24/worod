import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, getCachedAccessToken } from './firebase';
import { Product, OrderRecord, StoreSettings, CustomerRecord, Category, SyncQueueItem } from '../types';
import { PRODUCTS as INITIAL_PRODUCTS } from '../data/flowerData';
import { enqueueSync } from './syncQueueService';
import { getSavedSheetId } from './googleSheetsService';

const PRODUCTS_COLLECTION = 'products';
const ORDERS_COLLECTION = 'orders';
const CUSTOMERS_COLLECTION = 'customers';
const SETTINGS_COLLECTION = 'settings';
const MAIN_SETTINGS_DOC = 'main_config';

/**
 * Trigger Secondary Database (Google Sheets) Synchronization
 * Non-blocking: Primary database operation remains successful even if Google Sheets is unreachable.
 */
export async function triggerEntitySync(
  entity_type: SyncQueueItem['entity_type'],
  entity_id: string,
  operation: SyncQueueItem['operation'],
  payload: any
) {
  const token = getCachedAccessToken();
  const sheetId = getSavedSheetId();

  if (!token || !sheetId) {
    // If not currently authenticated with Google or no sheet selected, enqueue for later
    await enqueueSync(
      entity_type,
      entity_id,
      operation,
      payload,
      'في انتظار تفويض أو اتصال Google Sheets'
    );
    return;
  }

  try {
    const res = await fetch('/api/sheets/sync-item', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        spreadsheetId: sheetId,
        entity_type,
        operation,
        payload,
      }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || `Failed with status ${res.status}`);
    }
  } catch (err: any) {
    console.warn(`[Secondary DB Backup] Google Sheets sync failed for ${entity_type}:${entity_id}:`, err);
    await enqueueSync(entity_type, entity_id, operation, payload, err.message || String(err));
  }
}

// 1. Subscribe to products from Firestore in real time
export function subscribeToProducts(
  onSuccess: (products: Product[]) => void,
  onError?: (err: Error) => void
) {
  const colRef = collection(db, PRODUCTS_COLLECTION);

  return onSnapshot(
    colRef,
    async (snapshot) => {
      if (snapshot.empty) {
        // If DB is empty, use initial catalog without throwing unauthenticated write errors
        onSuccess(INITIAL_PRODUCTS);
        return;
      }

      const products: Product[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        products.push({
          id: docSnap.id,
          name: data.name || data.arabicName || 'باقة زهور',
          nameEn: data.nameEn || '',
          price: Number(data.price) || 0,
          originalPrice: data.originalPrice ? Number(data.originalPrice) : undefined,
          rating: Number(data.rating) || 4.9,
          reviewsCount: Number(data.reviewsCount) || 12,
          image: data.image || '',
          gallery: Array.isArray(data.gallery) ? data.gallery : undefined,
          category: data.category || 'anniversary',
          categoryLabel: data.categoryLabel || 'باقات زهور',
          tag: data.tag || undefined,
          description: data.description || '',
          flowerTypes: Array.isArray(data.flowerTypes) ? data.flowerTypes : ['ورود طبيعية مستوردة'],
          inStock: data.inStock !== false,
          isBestseller: Boolean(data.isBestseller),
          isNew: Boolean(data.isNew),
        });
      });

      onSuccess(products);
    },
    (error) => {
      console.warn('Firestore subscription fallback to local catalog:', error);
      onSuccess(INITIAL_PRODUCTS);
      if (onError) onError(error);
    }
  );
}

// 2. Seed initial catalog to Firestore
export async function seedInitialProducts() {
  const path = PRODUCTS_COLLECTION;
  try {
    for (const prod of INITIAL_PRODUCTS) {
      const docRef = doc(db, PRODUCTS_COLLECTION, prod.id);
      await setDoc(docRef, {
        name: prod.name,
        arabicName: prod.name,
        nameEn: prod.nameEn || '',
        price: prod.price,
        originalPrice: prod.originalPrice || null,
        rating: prod.rating || 4.9,
        reviewsCount: prod.reviewsCount || 20,
        image: prod.image,
        category: prod.category,
        categoryLabel: prod.categoryLabel,
        tag: prod.tag || '',
        description: prod.description || '',
        flowerTypes: prod.flowerTypes || [],
        inStock: prod.inStock !== false,
        isBestseller: Boolean(prod.isBestseller),
        isNew: Boolean(prod.isNew),
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// 3. Add or update product (Admin)
export async function saveProduct(product: Partial<Product> & { id?: string }) {
  const productId = product.id || 'prod-' + Date.now();
  const path = `${PRODUCTS_COLLECTION}/${productId}`;

  const payload = {
    name: product.name || 'باقة زهور جديدة',
    arabicName: product.name || 'باقة زهور جديدة',
    nameEn: product.nameEn || '',
    price: Number(product.price) || 0,
    originalPrice: product.originalPrice ? Number(product.originalPrice) : null,
    rating: Number(product.rating) || 4.9,
    reviewsCount: Number(product.reviewsCount) || 1,
    image: product.image || 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=900&q=80',
    category: product.category || 'anniversary',
    categoryLabel: product.categoryLabel || 'باقات زهور',
    tag: product.tag || '',
    description: product.description || '',
    flowerTypes: product.flowerTypes && product.flowerTypes.length > 0 ? product.flowerTypes : ['ورود طبيعية'],
    inStock: product.inStock !== false,
    isBestseller: Boolean(product.isBestseller),
    isNew: Boolean(product.isNew),
    updatedAt: new Date().toISOString(),
  };

  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, productId);
    await setDoc(docRef, payload, { merge: true });

    // Secondary DB (Google Sheets) Sync
    triggerEntitySync('product', productId, 'update', { id: productId, ...payload });

    return productId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    // Even if Firestore write fails, try secondary backup
    triggerEntitySync('product', productId, 'update', { id: productId, ...payload });
    return productId;
  }
}

// 4. Delete product (Admin)
export async function deleteProduct(productId: string) {
  const path = `${PRODUCTS_COLLECTION}/${productId}`;
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, productId);
    await deleteDoc(docRef);

    // Secondary DB (Google Sheets) Sync
    triggerEntitySync('product', productId, 'delete', { id: productId });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    triggerEntitySync('product', productId, 'delete', { id: productId });
  }
}

// Local storage cache keys
const LOCAL_ORDERS_KEY = 'kenitra_orders_local_cache';

function getCachedLocalOrders(): OrderRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_ORDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCachedLocalOrders(orders: OrderRecord[]) {
  try {
    localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(orders));
  } catch {
    // Ignore storage quota
  }
}

// 5. Submit customer order to Firestore (with local fallback and Google Sheets secondary sync)
export async function createOrder(order: Omit<OrderRecord, 'id' | 'createdAt'>) {
  const orderId = 'ord-' + Date.now();
  const path = `${ORDERS_COLLECTION}/${orderId}`;
  const payload: OrderRecord = {
    ...order,
    id: orderId,
    createdAt: new Date().toISOString(),
    status: 'pending',
  };

  // Always cache locally so orders are never lost
  const existingOrders = getCachedLocalOrders();
  saveCachedLocalOrders([payload, ...existingOrders]);

  try {
    const docRef = doc(db, ORDERS_COLLECTION, orderId);
    await setDoc(docRef, payload);
  } catch (error) {
    console.warn('Order saved to local cache; Firestore write deferred:', error);
  }

  // Auto-sync Customer entity
  if (order.recipientPhone) {
    const custId = `cust-${order.recipientPhone.replace(/[^0-9]/g, '')}`;
    saveCustomer({
      id: custId,
      name: order.recipientName || 'زبون المتجر',
      phone: order.recipientPhone,
      email: '',
      address: `${order.district || ''} ${order.address || ''}`.trim(),
      city: order.city || 'القنيطرة',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }).catch((e) => console.warn('Auto customer sync note:', e));
  }

  // Secondary DB (Google Sheets) Sync
  triggerEntitySync('order', orderId, 'create', payload);

  return orderId;
}

// Customer Directory Persistence
export async function saveCustomer(customer: CustomerRecord) {
  const customerId = customer.id || `cust-${Date.now()}`;
  try {
    const docRef = doc(db, CUSTOMERS_COLLECTION, customerId);
    await setDoc(docRef, customer, { merge: true });
    triggerEntitySync('customer', customerId, 'update', customer);
    return customerId;
  } catch (err) {
    console.warn('Customer save to Firestore deferred:', err);
    triggerEntitySync('customer', customerId, 'update', customer);
    return customerId;
  }
}

export function subscribeToCustomers(
  onSuccess: (customers: CustomerRecord[]) => void
) {
  const colRef = collection(db, CUSTOMERS_COLLECTION);
  return onSnapshot(
    colRef,
    (snap) => {
      const customers: CustomerRecord[] = [];
      snap.forEach((d) => {
        customers.push(d.data() as CustomerRecord);
      });
      onSuccess(customers);
    },
    (err) => {
      console.warn('Customers snapshot note:', err);
      onSuccess([]);
    }
  );
}

// 6. Subscribe to orders (Admin)
export function subscribeToOrders(
  onSuccess: (orders: OrderRecord[]) => void,
  onError?: (err: Error) => void
) {
  const colRef = collection(db, ORDERS_COLLECTION);
  const q = query(colRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const orders: OrderRecord[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        orders.push({
          id: docSnap.id,
          orderNumber: d.orderNumber || docSnap.id,
          recipientName: d.recipientName || '',
          recipientPhone: d.recipientPhone || '',
          city: d.city || '',
          district: d.district || '',
          address: d.address || '',
          deliveryDate: d.deliveryDate || '',
          deliveryTime: d.deliveryTime || '',
          paymentMethod: d.paymentMethod || 'cod',
          cardMessage: d.cardMessage || '',
          senderName: d.senderName || '',
          total: Number(d.total) || 0,
          status: d.status || 'pending',
          createdAt: d.createdAt || '',
          items: Array.isArray(d.items) ? d.items : [],
        });
      });

      // Merge with any cached local orders
      const localOrders = getCachedLocalOrders();
      const existingIds = new Set(orders.map((o) => o.id));
      const combined = [...orders, ...localOrders.filter((o) => !existingIds.has(o.id))];

      onSuccess(combined);
    },
    (error) => {
      console.warn('Orders subscription note, displaying local orders cache:', error);
      onSuccess(getCachedLocalOrders());
      if (onError) onError(error);
    }
  );
}

// 7. Update order status (Admin)
export async function updateOrderStatus(orderId: string, status: OrderRecord['status'], extraOrderData?: any) {
  const path = `${ORDERS_COLLECTION}/${orderId}`;
  try {
    const docRef = doc(db, ORDERS_COLLECTION, orderId);
    await updateDoc(docRef, { status });

    // Secondary DB (Google Sheets) Sync
    triggerEntitySync('order', orderId, 'update', {
      id: orderId,
      orderNumber: orderId,
      status,
      ...(extraOrderData || {}),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    triggerEntitySync('order', orderId, 'update', {
      id: orderId,
      orderNumber: orderId,
      status,
      ...(extraOrderData || {}),
    });
  }
}

// 8. Store settings
export function subscribeToStoreSettings(
  onSuccess: (settings: StoreSettings) => void
) {
  const docRef = doc(db, SETTINGS_COLLECTION, MAIN_SETTINGS_DOC);
  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const d = docSnap.data();
        onSuccess({
          freeShippingThreshold: Number(d.freeShippingThreshold) || 250,
          whatsappNumber: d.whatsappNumber || '212611938119',
          formattedPhone: d.formattedPhone || '06 11 93 81 19',
          announcementText: d.announcementText || '🌸 توصيل فوري لجميع أحياء القنيطرة والمهدية ونواحيها في أقل من ساعتين!',
        });
      } else {
        // Defaults
        onSuccess({
          freeShippingThreshold: 250,
          whatsappNumber: '212611938119',
          formattedPhone: '06 11 93 81 19',
          announcementText: '🌸 توصيل فوري لجميع أحياء القنيطرة والمهدية ونواحيها في أقل من ساعتين!',
        });
      }
    },
    (error) => {
      console.warn('Store settings note:', error);
      // Fallback
      onSuccess({
        freeShippingThreshold: 250,
        whatsappNumber: '212611938119',
        formattedPhone: '06 11 93 81 19',
        announcementText: '🌸 توصيل فوري لجميع أحياء القنيطرة والمهدية ونواحيها في أقل من ساعتين!',
      });
    }
  );
}

export async function updateStoreSettings(settings: Partial<StoreSettings>) {
  const path = `${SETTINGS_COLLECTION}/${MAIN_SETTINGS_DOC}`;
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, MAIN_SETTINGS_DOC);
    await setDoc(
      docRef,
      {
        ...settings,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
