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
import { db, handleFirestoreError, OperationType } from './firebase';
import { Product, OrderRecord, StoreSettings } from '../types';
import { PRODUCTS as INITIAL_PRODUCTS } from '../data/flowerData';

const PRODUCTS_COLLECTION = 'products';
const ORDERS_COLLECTION = 'orders';
const SETTINGS_COLLECTION = 'settings';
const MAIN_SETTINGS_DOC = 'main_config';

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
        // If DB is empty, automatically seed with initial Kenitra luxury products
        try {
          await seedInitialProducts();
        } catch (seedErr) {
          console.warn('Initial seeding note:', seedErr);
        }
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
      console.error('Failed to subscribe to products:', error);
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, PRODUCTS_COLLECTION);
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

  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, productId);
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

    await setDoc(docRef, payload, { merge: true });
    return productId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// 4. Delete product (Admin)
export async function deleteProduct(productId: string) {
  const path = `${PRODUCTS_COLLECTION}/${productId}`;
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, productId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// 5. Submit customer order to Firestore
export async function createOrder(order: Omit<OrderRecord, 'id' | 'createdAt'>) {
  const orderId = 'ord-' + Date.now();
  const path = `${ORDERS_COLLECTION}/${orderId}`;

  try {
    const docRef = doc(db, ORDERS_COLLECTION, orderId);
    const payload = {
      ...order,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };
    await setDoc(docRef, payload);
    return orderId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
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
      onSuccess(orders);
    },
    (error) => {
      console.error('Failed to subscribe to orders:', error);
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, ORDERS_COLLECTION);
    }
  );
}

// 7. Update order status (Admin)
export async function updateOrderStatus(orderId: string, status: OrderRecord['status']) {
  const path = `${ORDERS_COLLECTION}/${orderId}`;
  try {
    const docRef = doc(db, ORDERS_COLLECTION, orderId);
    await updateDoc(docRef, { status });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
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
