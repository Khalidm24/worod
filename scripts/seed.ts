import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { PRODUCTS } from '../src/data/flowerData';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);

async function runSeed() {
  console.log('Seeding products to Firestore database:', (firebaseConfig as any).firestoreDatabaseId);

  for (const prod of PRODUCTS) {
    const docRef = doc(db, 'products', prod.id);
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
      categoryLabel: prod.categoryLabel || '',
      tag: prod.tag || '',
      description: prod.description || '',
      flowerTypes: prod.flowerTypes || [],
      inStock: prod.inStock !== false,
      isBestseller: Boolean(prod.isBestseller),
      isNew: Boolean(prod.isNew),
      updatedAt: new Date().toISOString(),
    });
    console.log(`✓ Seeded product: ${prod.id} (${prod.name}) - ${prod.price} MAD`);
  }

  // Seed store settings
  const settingsRef = doc(db, 'settings', 'main_config');
  await setDoc(settingsRef, {
    freeShippingThreshold: 250,
    whatsappNumber: '212611938119',
    formattedPhone: '06 11 93 81 19',
    announcementText: '🌸 توصيل فوري لجميع أحياء القنيطرة والمهدية ونواحيها في أقل من ساعتين!',
    storeName: 'باقة وورد - القنيطرة',
    updatedAt: new Date().toISOString(),
  });
  console.log('✓ Seeded store settings');

  console.log('Seed completed successfully!');
  process.exit(0);
}

runSeed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
